// Split and Transcribe Edge Function
// Handles audio transcription with automatic splitting for large files

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_SIZE_BYTES = 24 * 1024 * 1024 // 24MB limit per chunk

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
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
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { audio_url } = await req.json()

    if (!audio_url) {
      return new Response(
        JSON.stringify({ error: 'Missing audio_url parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('[SPLIT_TRANSCRIBE] Downloading audio from:', audio_url)
    
    // Download the audio file
    const audioResponse = await fetch(audio_url)
    if (!audioResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to download audio file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const fileSizeBytes = audioBuffer.byteLength
    const fileSizeMB = fileSizeBytes / 1024 / 1024
    
    console.log('[SPLIT_TRANSCRIBE] File size:', fileSizeMB.toFixed(2), 'MB')

    // Determine file extension from URL or content-type
    const contentType = audioResponse.headers.get('content-type') || ''
    let extension = 'mp3'
    if (audio_url.includes('.m4a') || contentType.includes('m4a')) extension = 'm4a'
    else if (audio_url.includes('.wav') || contentType.includes('wav')) extension = 'wav'
    else if (audio_url.includes('.mp4') || contentType.includes('mp4')) extension = 'mp4'
    else if (audio_url.includes('.ogg') || contentType.includes('ogg')) extension = 'ogg'
    else if (audio_url.includes('.webm') || contentType.includes('webm')) extension = 'webm'
    else if (audio_url.includes('.flac') || contentType.includes('flac')) extension = 'flac'
    else if (audio_url.includes('.mp3') || contentType.includes('mp3') || contentType.includes('mpeg')) extension = 'mp3'

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    })

    // If file is small enough, transcribe directly
    if (fileSizeBytes <= MAX_SIZE_BYTES) {
      console.log('[SPLIT_TRANSCRIBE] File is small enough, transcribing directly')
      
      const audioFile = new File([audioBuffer], `audio.${extension}`, { 
        type: contentType || `audio/${extension}` 
      })

      const startTime = Date.now()
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "he",
        response_format: "text",
      })
      const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1)

      return new Response(
        JSON.stringify({
          success: true,
          transcription: transcription,
          duration_seconds: durationSeconds,
          file_size_mb: fileSizeMB.toFixed(2),
          chunks_count: 1
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For large files, split and transcribe chunks
    console.log('[SPLIT_TRANSCRIBE] File too large, attempting chunked transcription')
    
    const numChunks = Math.ceil(fileSizeBytes / MAX_SIZE_BYTES)
    const chunkSize = Math.ceil(fileSizeBytes / numChunks)
    
    console.log('[SPLIT_TRANSCRIBE] Splitting into', numChunks, 'chunks of ~', (chunkSize / 1024 / 1024).toFixed(1), 'MB')

    const transcriptions: string[] = []
    const audioData = new Uint8Array(audioBuffer)

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, fileSizeBytes)
      const chunkData = audioData.slice(start, end)

      const chunkFile = new File(
        [chunkData], 
        `chunk_${i + 1}.${extension}`, 
        { type: contentType || `audio/${extension}` }
      )

      console.log(`[SPLIT_TRANSCRIBE] Transcribing chunk ${i + 1}/${numChunks} (${(chunkFile.size / 1024 / 1024).toFixed(1)}MB)`)

      try {
        const chunkTranscription = await openai.audio.transcriptions.create({
          file: chunkFile,
          model: "whisper-1",
          language: "he",
          response_format: "text",
        })
        
        transcriptions.push(chunkTranscription)
        console.log(`[SPLIT_TRANSCRIBE] Chunk ${i + 1} transcribed successfully`)
      } catch (chunkError: any) {
        console.error(`[SPLIT_TRANSCRIBE] Chunk ${i + 1} failed:`, chunkError.message)
        // If chunking fails, we can't proceed with this approach
        return new Response(
          JSON.stringify({
            success: false,
            error: `קובץ גדול מדי (${fileSizeMB.toFixed(1)}MB) ופורמט ${extension.toUpperCase()} לא תומך בחלוקה. אנא המר את הקובץ ל-MP3 קטן יותר מ-25MB.`,
            file_size_mb: fileSizeMB.toFixed(2),
            suggestion: 'נסה להמיר את הקובץ ל-MP3 באיכות נמוכה יותר כדי להקטין את הגודל'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Combine transcriptions
    const fullTranscription = transcriptions.join('\n\n')

    return new Response(
      JSON.stringify({
        success: true,
        transcription: fullTranscription,
        file_size_mb: fileSizeMB.toFixed(2),
        chunks_count: numChunks
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[SPLIT_TRANSCRIBE] Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
