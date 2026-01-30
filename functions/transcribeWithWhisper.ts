import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai';

const MAX_SIZE_BYTES = 24 * 1024 * 1024; // 24MB limit
const TRANSCODING_SERVICE_URL = Deno.env.get("TRANSCODING_SERVICE_URL");
const TRANSCODING_SERVICE_TOKEN = Deno.env.get("TRANSCODING_SERVICE_TOKEN");

// Supported audio formats by Whisper API
const SUPPORTED_FORMATS = {
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
  'amr': { mimeType: 'audio/amr', whisperSupported: false, needsConversion: true },
  '3gp': { mimeType: 'audio/3gpp', whisperSupported: false, needsConversion: true },
};

// Language detection hints for Hebrew content
const HEBREW_KEYWORDS = ['שלום', 'תודה', 'בסדר', 'אני', 'את', 'הוא', 'היא', 'זה'];

// Error messages in Hebrew
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'אין הרשאה - יש להתחבר למערכת',
  MISSING_URL: 'חסר קישור לקובץ האודיו',
  DOWNLOAD_FAILED: 'שגיאה בהורדת קובץ האודיו',
  INVALID_FORMAT: 'פורמט קובץ לא נתמך',
  FILE_TOO_LARGE: 'הקובץ גדול מדי',
  TRANSCRIPTION_FAILED: 'שגיאה בתמלול',
  TRANSCODING_UNAVAILABLE: 'שירות הטרנסקודינג לא זמין',
  TRANSCODING_FAILED: 'שגיאה בהמרת הקובץ',
  OPENAI_ERROR: 'שגיאה בשירות התמלול',
  NETWORK_ERROR: 'שגיאת רשת',
  TIMEOUT: 'תם הזמן המוקצב לפעולה',
  EMPTY_AUDIO: 'קובץ האודיו ריק או פגום',
};

// Detect format from URL and content-type
function detectAudioFormat(url, contentType) {
  // Try URL extension first
  const urlLower = url.toLowerCase();
  for (const [ext, info] of Object.entries(SUPPORTED_FORMATS)) {
    if (urlLower.includes(`.${ext}`)) {
      return { extension: ext, ...info };
    }
  }
  
  // Try content-type
  const ctLower = (contentType || '').toLowerCase();
  for (const [ext, info] of Object.entries(SUPPORTED_FORMATS)) {
    if (ctLower.includes(ext) || ctLower.includes(info.mimeType)) {
      return { extension: ext, ...info };
    }
  }
  
  // Default to webm (common for browser recordings)
  return { extension: 'webm', ...SUPPORTED_FORMATS['webm'] };
}

// Analyze audio quality indicators
function analyzeAudioMetadata(contentType, fileSize, url) {
  const format = detectAudioFormat(url, contentType);
  const fileSizeMB = fileSize / 1024 / 1024;
  
  // Estimate audio duration based on typical bitrates
  const bitrateEstimates = {
    'mp3': 128, // kbps
    'wav': 1411,
    'flac': 900,
    'ogg': 160,
    'webm': 128,
    'm4a': 256,
    'aac': 256,
  };
  
  const bitrate = bitrateEstimates[format.extension] || 128;
  const estimatedDurationMin = (fileSizeMB * 8 * 1024) / bitrate / 60;
  
  return {
    format,
    fileSizeMB,
    estimatedDurationMin: Math.round(estimatedDurationMin * 10) / 10,
    isLargeFile: fileSize > MAX_SIZE_BYTES,
    needsConversion: format.needsConversion || false,
    qualityHint: fileSizeMB > 50 ? 'high' : fileSizeMB > 10 ? 'medium' : 'low'
  };
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  let stepLog = [];
  
  const logStep = (step, details = {}) => {
    const elapsed = Date.now() - startTime;
    stepLog.push({ step, elapsed, ...details });
    console.log(`[Whisper] [${elapsed}ms] ${step}`, JSON.stringify(details));
  };

  try {
    logStep('init');
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ 
        success: false,
        error: ERROR_MESSAGES.UNAUTHORIZED,
        error_code: 'UNAUTHORIZED'
      }, { status: 401 });
    }

    const body = await req.json();
    const { audio_url, language = 'he', optimize_for = 'accuracy', recording_id } = body;
    
    if (!audio_url) {
      return Response.json({ 
        success: false,
        error: ERROR_MESSAGES.MISSING_URL,
        error_code: 'MISSING_URL'
      }, { status: 400 });
    }

    logStep('downloading', { url: audio_url.substring(0, 100) });

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    // Download audio file with timeout
    const controller = new AbortController();
    const downloadTimeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout
    
    let audioResponse;
    try {
      audioResponse = await fetch(audio_url, { signal: controller.signal });
    } catch (fetchError) {
      clearTimeout(downloadTimeout);
      if (fetchError.name === 'AbortError') {
        return Response.json({
          success: false,
          error: ERROR_MESSAGES.TIMEOUT,
          error_code: 'TIMEOUT',
          details: 'הורדת הקובץ נמשכה יותר מ-2 דקות',
          steps: stepLog
        }, { status: 408 });
      }
      throw fetchError;
    }
    clearTimeout(downloadTimeout);
    
    if (!audioResponse.ok) {
      return Response.json({
        success: false,
        error: `${ERROR_MESSAGES.DOWNLOAD_FAILED}: HTTP ${audioResponse.status}`,
        error_code: 'DOWNLOAD_FAILED',
        details: `שרת הקבצים החזיר שגיאה ${audioResponse.status}`,
        steps: stepLog
      }, { status: 400 });
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    const fileSizeBytes = audioBytes.length;
    
    if (fileSizeBytes === 0) {
      return Response.json({
        success: false,
        error: ERROR_MESSAGES.EMPTY_AUDIO,
        error_code: 'EMPTY_AUDIO',
        steps: stepLog
      }, { status: 400 });
    }

    const contentType = audioResponse.headers.get('content-type') || '';
    const audioMeta = analyzeAudioMetadata(contentType, fileSizeBytes, audio_url);
    
    logStep('analyzed', { 
      format: audioMeta.format.extension,
      sizeMB: audioMeta.fileSizeMB.toFixed(2),
      estimatedMin: audioMeta.estimatedDurationMin,
      needsConversion: audioMeta.needsConversion
    });

    // Check if format needs conversion
    if (audioMeta.needsConversion) {
      if (!TRANSCODING_SERVICE_URL) {
        return Response.json({
          success: false,
          error: `${ERROR_MESSAGES.INVALID_FORMAT}: ${audioMeta.format.extension}`,
          error_code: 'INVALID_FORMAT',
          details: `פורמט ${audioMeta.format.extension} דורש המרה, אך שירות ההמרה לא זמין`,
          supported_formats: Object.keys(SUPPORTED_FORMATS).filter(k => SUPPORTED_FORMATS[k].whisperSupported),
          steps: stepLog
        }, { status: 400 });
      }
      // Will be handled by transcoding service below
    }

    const extension = audioMeta.format.extension;
    const fileSizeMB = audioMeta.fileSizeMB;

    // If file is small enough and format is supported, transcribe directly
    if (fileSizeBytes <= MAX_SIZE_BYTES && !audioMeta.needsConversion) {
      logStep('transcribing_direct');
      
      const audioFile = new File([audioBytes], `audio.${extension}`, {
        type: audioMeta.format.mimeType || `audio/${extension}`,
      });

      // Optimize parameters based on content
      const transcriptionParams = {
        file: audioFile,
        model: "whisper-1",
        language: language,
        response_format: "verbose_json", // Get timestamps and confidence
      };
      
      // Add prompt for Hebrew architecture domain
      if (language === 'he') {
        transcriptionParams.prompt = 'שיחה בעברית בנושא אדריכלות, עיצוב פנים, שיפוץ, חומרים, תכנון, לקוחות, פרויקטים, הצעות מחיר, קבלנים';
      }

      const transcriptionStart = Date.now();
      let transcription;
      
      try {
        transcription = await openai.audio.transcriptions.create(transcriptionParams);
      } catch (openaiError) {
        logStep('openai_error', { message: openaiError.message });
        
        // Parse OpenAI error for better feedback
        const errorMessage = openaiError.message || '';
        let userError = ERROR_MESSAGES.OPENAI_ERROR;
        let errorCode = 'OPENAI_ERROR';
        
        if (errorMessage.includes('Invalid file format')) {
          userError = `${ERROR_MESSAGES.INVALID_FORMAT}: הקובץ לא תואם לפורמט ${extension}`;
          errorCode = 'INVALID_FORMAT';
        } else if (errorMessage.includes('rate limit')) {
          userError = 'מגבלת קריאות לשירות - נסה שוב בעוד דקה';
          errorCode = 'RATE_LIMIT';
        } else if (errorMessage.includes('audio file could not be decoded')) {
          userError = 'לא ניתן לקרוא את קובץ האודיו - ייתכן שהקובץ פגום';
          errorCode = 'DECODE_ERROR';
        }
        
        return Response.json({
          success: false,
          error: userError,
          error_code: errorCode,
          details: errorMessage,
          steps: stepLog
        }, { status: 500 });
      }

      const transcriptionDuration = (Date.now() - transcriptionStart) / 1000;
      logStep('transcription_complete', { duration: transcriptionDuration });

      // Extract segments with confidence for quality control
      const segments = transcription.segments?.map(seg => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
        confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : null,
        no_speech_prob: seg.no_speech_prob
      })) || [];

      // Flag potentially problematic segments
      const flaggedSegments = segments
        .filter(seg => 
          (seg.confidence && seg.confidence < 0.5) || 
          (seg.no_speech_prob && seg.no_speech_prob > 0.5)
        )
        .map(seg => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
          confidence_score: seg.confidence,
          flag_type: seg.no_speech_prob > 0.5 ? 'unclear_audio' : 'low_confidence',
          reason: seg.no_speech_prob > 0.5 ? 'אודיו לא ברור' : 'ביטחון נמוך בתמלול'
        }));

      const totalDuration = (Date.now() - startTime) / 1000;

      return Response.json({
        success: true,
        transcription: transcription.text,
        duration_seconds: totalDuration,
        transcription_duration_seconds: transcriptionDuration,
        file_size_mb: fileSizeMB.toFixed(2),
        chunks_count: 1,
        audio_duration_seconds: transcription.duration,
        language_detected: transcription.language,
        segments_count: segments.length,
        flagged_segments: flaggedSegments,
        flagged_count: flaggedSegments.length,
        quality_score: flaggedSegments.length === 0 ? 100 : 
          Math.max(0, 100 - (flaggedSegments.length / Math.max(segments.length, 1) * 100)),
        metadata: {
          format: audioMeta.format.extension,
          estimated_duration_min: audioMeta.estimatedDurationMin,
          quality_hint: audioMeta.qualityHint
        },
        steps: stepLog
      });
    }

    // File is too large or needs conversion - use transcoding service
    logStep('needs_transcoding', { 
      reason: audioMeta.needsConversion ? 'format_conversion' : 'file_too_large',
      sizeMB: fileSizeMB.toFixed(2)
    });

    if (!TRANSCODING_SERVICE_URL) {
      return Response.json({
        success: false,
        error: audioMeta.needsConversion 
          ? `${ERROR_MESSAGES.INVALID_FORMAT}: פורמט ${extension} דורש המרה`
          : `${ERROR_MESSAGES.FILE_TOO_LARGE} (${fileSizeMB.toFixed(1)}MB)`,
        error_code: audioMeta.needsConversion ? 'NEEDS_CONVERSION' : 'FILE_TOO_LARGE',
        details: 'שירות הטרנסקודינג לא מוגדר',
        suggestion: audioMeta.needsConversion
          ? `המר את הקובץ לאחד מהפורמטים הנתמכים: ${Object.keys(SUPPORTED_FORMATS).filter(k => SUPPORTED_FORMATS[k].whisperSupported).join(', ')}`
          : 'המר את הקובץ ל-MP3 קטן מ-24MB או הגדר את שירות הטרנסקודינג',
        supported_formats: Object.keys(SUPPORTED_FORMATS).filter(k => SUPPORTED_FORMATS[k].whisperSupported),
        max_size_mb: MAX_SIZE_BYTES / 1024 / 1024,
        steps: stepLog
      }, { status: 400 });
    }

    // Call transcoding service
    logStep('calling_transcoding_service');
    
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let transcodingResponse;
    try {
      transcodingResponse = await fetch(`${TRANSCODING_SERVICE_URL}/transcode-and-split`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SERVICE-TOKEN': TRANSCODING_SERVICE_TOKEN || ''
        },
        body: JSON.stringify({
          sourceUrl: audio_url,
          jobId: jobId,
          chunkDurationSec: 2700, // 45 minutes
          overlapSec: 3,
          outputFormat: 'mp3', // Convert to MP3 for best Whisper compatibility
          targetBitrate: 64 // Lower bitrate to reduce file size
        })
      });
    } catch (transcodingError) {
      logStep('transcoding_network_error', { message: transcodingError.message });
      return Response.json({
        success: false,
        error: ERROR_MESSAGES.TRANSCODING_UNAVAILABLE,
        error_code: 'TRANSCODING_UNAVAILABLE',
        details: `לא ניתן להתחבר לשירות הטרנסקודינג: ${transcodingError.message}`,
        steps: stepLog
      }, { status: 503 });
    }

    if (!transcodingResponse.ok) {
      const errorText = await transcodingResponse.text();
      logStep('transcoding_error', { status: transcodingResponse.status, error: errorText });
      return Response.json({
        success: false,
        error: ERROR_MESSAGES.TRANSCODING_FAILED,
        error_code: 'TRANSCODING_FAILED',
        details: `שירות הטרנסקודינג החזיר שגיאה ${transcodingResponse.status}: ${errorText}`,
        steps: stepLog
      }, { status: 500 });
    }

    const transcodingResult = await transcodingResponse.json();
    logStep('transcoding_complete', { 
      chunksCount: transcodingResult.chunks?.length || 0,
      sourceDuration: transcodingResult.sourceInfo?.durationSec
    });

    if (!transcodingResult.success) {
      return Response.json({
        success: false,
        error: ERROR_MESSAGES.TRANSCODING_FAILED,
        error_code: 'TRANSCODING_FAILED',
        details: transcodingResult.error || 'סיבה לא ידועה',
        steps: stepLog
      }, { status: 500 });
    }

    // Process chunks
    const chunks = transcodingResult.chunks || [];
    const chunkTranscriptions = [];
    const allFlaggedSegments = [];
    let totalAudioDuration = 0;
    
    // Handle normalized audio (single chunk after conversion)
    if (chunks.length === 0 && transcodingResult.normalizedUrl) {
      logStep('transcribing_normalized');
      
      try {
        const normalizedResponse = await fetch(transcodingResult.normalizedUrl);
        if (!normalizedResponse.ok) {
          throw new Error(`Failed to download normalized audio: ${normalizedResponse.status}`);
        }
        
        const normalizedBuffer = await normalizedResponse.arrayBuffer();
        const normalizedBytes = new Uint8Array(normalizedBuffer);
        
        const normalizedFile = new File([normalizedBytes], 'audio.mp3', {
          type: 'audio/mpeg'
        });
        
        const transcription = await openai.audio.transcriptions.create({
          file: normalizedFile,
          model: "whisper-1",
          language: language,
          response_format: "verbose_json",
          prompt: language === 'he' ? 'שיחה בעברית בנושא אדריכלות, עיצוב פנים, שיפוץ' : undefined
        });
        
        totalAudioDuration = transcription.duration || 0;
        
        const totalDuration = (Date.now() - startTime) / 1000;
        
        return Response.json({
          success: true,
          transcription: transcription.text,
          duration_seconds: totalDuration,
          file_size_mb: fileSizeMB.toFixed(2),
          chunks_count: 1,
          audio_duration_seconds: totalAudioDuration,
          language_detected: transcription.language,
          was_converted: true,
          original_format: extension,
          steps: stepLog
        });
        
      } catch (normalizedError) {
        logStep('normalized_transcription_error', { message: normalizedError.message });
        return Response.json({
          success: false,
          error: ERROR_MESSAGES.TRANSCRIPTION_FAILED,
          error_code: 'NORMALIZED_TRANSCRIPTION_FAILED',
          details: normalizedError.message,
          steps: stepLog
        }, { status: 500 });
      }
    }

    // Transcribe each chunk
    logStep('transcribing_chunks', { count: chunks.length });
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      logStep(`chunk_${i + 1}_start`);
      
      try {
        // Download chunk
        const chunkResponse = await fetch(chunk.url);
        if (!chunkResponse.ok) {
          throw new Error(`Failed to download chunk ${i + 1}: ${chunkResponse.status}`);
        }
        
        const chunkBuffer = await chunkResponse.arrayBuffer();
        const chunkBytes = new Uint8Array(chunkBuffer);
        
        const chunkFile = new File([chunkBytes], `chunk_${i}.mp3`, {
          type: 'audio/mpeg'
        });
        
        const transcription = await openai.audio.transcriptions.create({
          file: chunkFile,
          model: "whisper-1",
          language: language,
          response_format: "verbose_json",
          prompt: language === 'he' ? 'שיחה בעברית בנושא אדריכלות, עיצוב פנים, שיפוץ' : undefined
        });
        
        chunkTranscriptions.push({
          index: i,
          startSec: chunk.startSec,
          endSec: chunk.endSec,
          text: transcription.text,
          duration: transcription.duration
        });
        
        totalAudioDuration += transcription.duration || 0;
        
        // Collect flagged segments with time offset
        const segments = transcription.segments || [];
        const flagged = segments
          .filter(seg => 
            (seg.avg_logprob && Math.exp(seg.avg_logprob) < 0.5) || 
            (seg.no_speech_prob && seg.no_speech_prob > 0.5)
          )
          .map(seg => ({
            start: (chunk.startSec || 0) + seg.start,
            end: (chunk.startSec || 0) + seg.end,
            text: seg.text,
            confidence_score: seg.avg_logprob ? Math.exp(seg.avg_logprob) : null,
            flag_type: seg.no_speech_prob > 0.5 ? 'unclear_audio' : 'low_confidence',
            chunk_index: i
          }));
        
        allFlaggedSegments.push(...flagged);
        
        logStep(`chunk_${i + 1}_complete`, { textLength: transcription.text?.length || 0 });
        
      } catch (chunkError) {
        logStep(`chunk_${i + 1}_error`, { message: chunkError.message });
        chunkTranscriptions.push({
          index: i,
          startSec: chunk.startSec,
          endSec: chunk.endSec,
          text: `[שגיאה בתמלול חלק ${i + 1}: ${chunkError.message}]`,
          error: true
        });
      }
    }

    // Merge transcriptions (handle overlap)
    logStep('merging');
    
    chunkTranscriptions.sort((a, b) => a.index - b.index);
    const fullTranscription = chunkTranscriptions
      .filter(c => !c.error)
      .map(c => c.text)
      .join(' ');
    
    const errorChunks = chunkTranscriptions.filter(c => c.error);
    const totalDuration = (Date.now() - startTime) / 1000;

    return Response.json({
      success: true,
      transcription: fullTranscription,
      duration_seconds: totalDuration,
      file_size_mb: fileSizeMB.toFixed(2),
      chunks_count: chunks.length,
      successful_chunks: chunks.length - errorChunks.length,
      failed_chunks: errorChunks.length,
      audio_duration_seconds: totalAudioDuration,
      source_duration_sec: transcodingResult.sourceInfo?.durationSec,
      flagged_segments: allFlaggedSegments,
      flagged_count: allFlaggedSegments.length,
      quality_score: allFlaggedSegments.length === 0 ? 100 : 
        Math.max(0, 100 - (allFlaggedSegments.length * 5)),
      was_transcoded: true,
      original_format: extension,
      metadata: {
        format: audioMeta.format.extension,
        estimated_duration_min: audioMeta.estimatedDurationMin,
        quality_hint: audioMeta.qualityHint
      },
      steps: stepLog,
      errors: errorChunks.length > 0 ? errorChunks.map(c => ({
        chunk: c.index,
        message: c.text
      })) : undefined
    });

  } catch (error) {
    console.error('[Whisper] Unexpected error:', error);
    return Response.json({
      success: false,
      error: ERROR_MESSAGES.TRANSCRIPTION_FAILED,
      error_code: 'UNEXPECTED_ERROR',
      details: error.message,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    }, { status: 500 });
  }
});