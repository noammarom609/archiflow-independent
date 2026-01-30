// Transcribe with Whisper Edge Function
// Advanced audio transcription with quality analysis and format support

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_SIZE_BYTES = 24 * 1024 * 1024 // 24MB limit

// Supported audio formats by Whisper API
const SUPPORTED_FORMATS: Record<string, { mimeType: string; whisperSupported: boolean; needsConversion?: boolean }> = {
  'mp3': { mimeType: 'audio/mpeg', whisperSupported: true },
  'mp4': { mimeType: 'audio/mp4', whisperSupported: true },
  'm4a': { mimeType: 'audio/m4a', whisperSupported: true },
  'wav': { mimeType: 'audio/wav', whisperSupported: true },
  'webm': { mimeType: 'audio/webm', whisperSupported: true },
  'ogg': { mimeType: 'audio/ogg', whisperSupported: true },
  'flac': { mimeType: 'audio/flac', whisperSupported: true },
  'mpeg': { mimeType: 'audio/mpeg', whisperSupported: true },
  'mpga': { mimeType: 'audio/mpeg', whisperSupported: true },
  'oga': { mimeType: 'audio/ogg', whisperSupported: true },
  'opus': { mimeType: 'audio/opus', whisperSupported: true },
  'aac': { mimeType: 'audio/aac', whisperSupported: false, needsConversion: true },
  'wma': { mimeType: 'audio/x-ms-wma', whisperSupported: false, needsConversion: true },
}

// Error messages in Hebrew
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'אין הרשאה - יש להתחבר למערכת',
  MISSING_URL: 'חסר קישור לקובץ האודיו',
  DOWNLOAD_FAILED: 'שגיאה בהורדת קובץ האודיו',
  INVALID_FORMAT: 'פורמט קובץ לא נתמך',
  FILE_TOO_LARGE: 'הקובץ גדול מדי',
  TRANSCRIPTION_FAILED: 'שגיאה בתמלול',
  OPENAI_ERROR: 'שגיאה בשירות התמלול',
  EMPTY_AUDIO: 'קובץ האודיו ריק או פגום',
}

// Detect format from URL and content-type
function detectAudioFormat(url: string, contentType: string) {
  const urlLower = url.toLowerCase()
  for (const [ext, info] of Object.entries(SUPPORTED_FORMATS)) {
    if (urlLower.includes(`.${ext}`)) {
      return { extension: ext, ...info }
    }
  }
  
  const ctLower = (contentType || '').toLowerCase()
  for (const [ext, info] of Object.entries(SUPPORTED_FORMATS)) {
    if (ctLower.includes(ext) || ctLower.includes(info.mimeType)) {
      return { extension: ext, ...info }
    }
  }
  
  return { extension: 'webm', ...SUPPORTED_FORMATS['webm'] }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()
  const stepLog: any[] = []
  
  const logStep = (step: string, details: any = {}) => {
    const elapsed = Date.now() - startTime
    stepLog.push({ step, elapsed, ...details })
    console.log(`[Whisper] [${elapsed}ms] ${step}`, JSON.stringify(details))
  }

  try {
    logStep('init')
    
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.UNAUTHORIZED, error_code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get the current user from the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.UNAUTHORIZED, error_code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    const { audio_url, language = 'he' } = body
    
    if (!audio_url) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.MISSING_URL, error_code: 'MISSING_URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logStep('downloading', { url: audio_url.substring(0, 100) })

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    })

    // Download audio file with timeout
    const controller = new AbortController()
    const downloadTimeout = setTimeout(() => controller.abort(), 120000) // 2 min timeout
    
    let audioResponse
    try {
      audioResponse = await fetch(audio_url, { signal: controller.signal })
    } catch (fetchError: any) {
      clearTimeout(downloadTimeout)
      if (fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'תם הזמן המוקצב לפעולה',
            error_code: 'TIMEOUT',
            details: 'הורדת הקובץ נמשכה יותר מ-2 דקות',
            steps: stepLog
          }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      throw fetchError
    }
    clearTimeout(downloadTimeout)
    
    if (!audioResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `${ERROR_MESSAGES.DOWNLOAD_FAILED}: HTTP ${audioResponse.status}`,
          error_code: 'DOWNLOAD_FAILED',
          steps: stepLog
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const audioBytes = new Uint8Array(audioBuffer)
    const fileSizeBytes = audioBytes.length
    
    if (fileSizeBytes === 0) {
      return new Response(
        JSON.stringify({ success: false, error: ERROR_MESSAGES.EMPTY_AUDIO, error_code: 'EMPTY_AUDIO', steps: stepLog }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const contentType = audioResponse.headers.get('content-type') || ''
    const format = detectAudioFormat(audio_url, contentType)
    const fileSizeMB = fileSizeBytes / 1024 / 1024
    
    logStep('analyzed', { 
      format: format.extension,
      sizeMB: fileSizeMB.toFixed(2),
      needsConversion: format.needsConversion
    })

    // Check if format needs conversion
    if (format.needsConversion) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `${ERROR_MESSAGES.INVALID_FORMAT}: ${format.extension}`,
          error_code: 'INVALID_FORMAT',
          details: `פורמט ${format.extension} אינו נתמך`,
          supported_formats: Object.keys(SUPPORTED_FORMATS).filter(k => SUPPORTED_FORMATS[k].whisperSupported),
          steps: stepLog
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check file size
    if (fileSizeBytes > MAX_SIZE_BYTES) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `${ERROR_MESSAGES.FILE_TOO_LARGE} (${fileSizeMB.toFixed(1)}MB)`,
          error_code: 'FILE_TOO_LARGE',
          suggestion: 'המר את הקובץ ל-MP3 קטן מ-24MB או השתמש בפונקציית split-and-transcribe',
          max_size_mb: MAX_SIZE_BYTES / 1024 / 1024,
          steps: stepLog
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    logStep('transcribing')
    
    const audioFile = new File([audioBytes], `audio.${format.extension}`, {
      type: format.mimeType || `audio/${format.extension}`,
    })

    // Optimize parameters for Hebrew architecture domain
    const transcriptionParams: any = {
      file: audioFile,
      model: "whisper-1",
      language: language,
      response_format: "verbose_json",
    }
    
    if (language === 'he') {
      transcriptionParams.prompt = 'שיחה בעברית בנושא אדריכלות, עיצוב פנים, שיפוץ, חומרים, תכנון, לקוחות, פרויקטים, הצעות מחיר, קבלנים'
    }

    const transcriptionStart = Date.now()
    let transcription
    
    try {
      transcription = await openai.audio.transcriptions.create(transcriptionParams)
    } catch (openaiError: any) {
      logStep('openai_error', { message: openaiError.message })
      
      let userError = ERROR_MESSAGES.OPENAI_ERROR
      let errorCode = 'OPENAI_ERROR'
      
      if (openaiError.message?.includes('Invalid file format')) {
        userError = `${ERROR_MESSAGES.INVALID_FORMAT}: הקובץ לא תואם לפורמט ${format.extension}`
        errorCode = 'INVALID_FORMAT'
      } else if (openaiError.message?.includes('rate limit')) {
        userError = 'מגבלת קריאות לשירות - נסה שוב בעוד דקה'
        errorCode = 'RATE_LIMIT'
      } else if (openaiError.message?.includes('audio file could not be decoded')) {
        userError = 'לא ניתן לקרוא את קובץ האודיו - ייתכן שהקובץ פגום'
        errorCode = 'DECODE_ERROR'
      }
      
      return new Response(
        JSON.stringify({ success: false, error: userError, error_code: errorCode, details: openaiError.message, steps: stepLog }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const transcriptionDuration = (Date.now() - transcriptionStart) / 1000
    logStep('transcription_complete', { duration: transcriptionDuration })

    // Extract segments with confidence for quality control
    const segments = (transcription as any).segments?.map((seg: any) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text,
      confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : null,
      no_speech_prob: seg.no_speech_prob
    })) || []

    // Flag potentially problematic segments
    const flaggedSegments = segments
      .filter((seg: any) => 
        (seg.confidence && seg.confidence < 0.5) || 
        (seg.no_speech_prob && seg.no_speech_prob > 0.5)
      )
      .map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence_score: seg.confidence,
        flag_type: seg.no_speech_prob > 0.5 ? 'unclear_audio' : 'low_confidence',
        reason: seg.no_speech_prob > 0.5 ? 'אודיו לא ברור' : 'ביטחון נמוך בתמלול'
      }))

    const totalDuration = (Date.now() - startTime) / 1000

    return new Response(
      JSON.stringify({
        success: true,
        transcription: (transcription as any).text,
        duration_seconds: totalDuration,
        transcription_duration_seconds: transcriptionDuration,
        file_size_mb: fileSizeMB.toFixed(2),
        chunks_count: 1,
        audio_duration_seconds: (transcription as any).duration,
        language_detected: (transcription as any).language,
        segments_count: segments.length,
        flagged_segments: flaggedSegments,
        flagged_count: flaggedSegments.length,
        quality_score: flaggedSegments.length === 0 ? 100 : 
          Math.max(0, 100 - (flaggedSegments.length / Math.max(segments.length, 1) * 100)),
        metadata: {
          format: format.extension,
        },
        steps: stepLog
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[Whisper] Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: ERROR_MESSAGES.TRANSCRIPTION_FAILED,
        error_code: 'UNEXPECTED_ERROR',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
