/**
 * Async Transcription Job Orchestrator
 * Manages the full transcription pipeline for large audio files
 * 
 * Endpoints:
 *   POST /start   - Start a new transcription job
 *   GET  /status  - Get job status
 *   GET  /result  - Get transcription result
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai';

const MAX_DIRECT_SIZE_BYTES = 24 * 1024 * 1024; // 24MB - direct to Whisper
const TRANSCODING_SERVICE_URL = Deno.env.get("TRANSCODING_SERVICE_URL");
const TRANSCODING_SERVICE_TOKEN = Deno.env.get("TRANSCODING_SERVICE_TOKEN");

// Supported audio formats
const SUPPORTED_EXTENSIONS = ['mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg', 'flac', 'mpeg', 'mpga', 'oga', 'opus'];
const NEEDS_CONVERSION = ['aac', 'wma', 'amr', '3gp'];

// Hebrew-focused transcription prompt
const HEBREW_PROMPT = 'שיחה בעברית בנושא אדריכלות, עיצוב פנים, שיפוץ, חומרים, תכנון, לקוחות, פרויקטים, הצעות מחיר, קבלנים';

// Error messages
const ERRORS = {
  UNAUTHORIZED: 'אין הרשאה - יש להתחבר למערכת',
  MISSING_URL: 'חסר קישור לקובץ האודיו',
  DOWNLOAD_FAILED: 'שגיאה בהורדת קובץ האודיו',
  FILE_TOO_LARGE: 'הקובץ גדול מדי ושירות הטרנסקודינג לא זמין',
  TRANSCRIPTION_FAILED: 'שגיאה בתמלול',
  INVALID_FORMAT: 'פורמט קובץ לא נתמך'
};

// In-memory job store (for demo - use Redis/DB in production)
const jobs = new Map();

// Detect format from URL
function detectFormat(url, contentType) {
  const urlLower = url.toLowerCase();
  for (const ext of [...SUPPORTED_EXTENSIONS, ...NEEDS_CONVERSION]) {
    if (urlLower.includes(`.${ext}`)) return ext;
  }
  const ctLower = (contentType || '').toLowerCase();
  for (const ext of SUPPORTED_EXTENSIONS) {
    if (ctLower.includes(ext)) return ext;
  }
  return 'webm';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();
    
    // Route based on action
    if (req.method === 'POST') {
      const body = await req.json();
      const action = body.action || 'start';
      
      switch (action) {
        case 'start':
          return await handleStart(base44, body, user);
        case 'status':
          return await handleStatus(body);
        case 'result':
          return await handleResult(body);
        default:
          return Response.json({ error: 'Unknown action' }, { status: 400 });
      }
    }
    
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
    
  } catch (error) {
    console.error('[TranscriptionJob] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleStart(base44, body, user) {
  const { audio_url, recording_id, language = 'he', optimize_for = 'accuracy' } = body;
  
  if (!audio_url) {
    return Response.json({ 
      success: false,
      error: ERRORS.MISSING_URL,
      error_code: 'MISSING_URL'
    }, { status: 400 });
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[Job ${jobId}] Starting transcription job`);
  
  // Initialize job with enhanced metadata
  const job = {
    id: jobId,
    status: 'pending',
    progress: 0,
    audio_url,
    recording_id,
    language,
    optimize_for,
    created_at: new Date().toISOString(),
    user_email: user.email,
    result: null,
    error: null,
    error_code: null,
    steps: [],
    flagged_segments: [],
    quality_score: null
  };
  
  jobs.set(jobId, job);
  
  // Start async processing
  processJob(jobId, base44).catch(err => {
    console.error(`[Job ${jobId}] Processing error:`, err);
    const job = jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = err.message;
      job.error_code = 'PROCESSING_ERROR';
    }
  });
  
  return Response.json({
    success: true,
    job_id: jobId,
    status: 'pending',
    message: 'התמלול התחיל. ניתן לבדוק סטטוס באמצעות action: status'
  });
}

async function handleStatus(body) {
  const { job_id } = body;
  
  if (!job_id) {
    return Response.json({ 
      success: false,
      error: 'חסר מזהה עבודה',
      error_code: 'MISSING_JOB_ID'
    }, { status: 400 });
  }
  
  const job = jobs.get(job_id);
  if (!job) {
    return Response.json({ 
      success: false,
      error: 'עבודה לא נמצאה',
      error_code: 'JOB_NOT_FOUND'
    }, { status: 404 });
  }
  
  return Response.json({
    success: true,
    job_id: job.id,
    status: job.status,
    progress: job.progress,
    steps: job.steps,
    error: job.error,
    error_code: job.error_code,
    created_at: job.created_at,
    quality_score: job.quality_score,
    flagged_count: job.flagged_segments?.length || 0
  });
}

async function handleResult(body) {
  const { job_id } = body;
  
  if (!job_id) {
    return Response.json({ 
      success: false,
      error: 'חסר מזהה עבודה',
      error_code: 'MISSING_JOB_ID'
    }, { status: 400 });
  }
  
  const job = jobs.get(job_id);
  if (!job) {
    return Response.json({ 
      success: false,
      error: 'עבודה לא נמצאה',
      error_code: 'JOB_NOT_FOUND'
    }, { status: 404 });
  }
  
  if (job.status === 'failed') {
    return Response.json({
      success: false,
      job_id: job.id,
      status: 'failed',
      error: job.error,
      error_code: job.error_code,
      steps: job.steps
    }, { status: 400 });
  }
  
  if (job.status !== 'completed') {
    return Response.json({
      success: false,
      error: 'העבודה עדיין בתהליך',
      error_code: 'JOB_IN_PROGRESS',
      status: job.status,
      progress: job.progress
    }, { status: 202 });
  }
  
  return Response.json({
    success: true,
    job_id: job.id,
    transcription: job.result.transcription,
    chunks_count: job.result.chunks_count,
    duration_seconds: job.result.duration_seconds,
    source_duration_sec: job.result.source_duration_sec,
    audio_duration_seconds: job.result.audio_duration_seconds,
    quality_score: job.quality_score,
    flagged_segments: job.flagged_segments,
    flagged_count: job.flagged_segments?.length || 0,
    language_detected: job.result.language_detected,
    was_transcoded: job.result.was_transcoded,
    metadata: job.result.metadata
  });
}

async function processJob(jobId, base44) {
  const job = jobs.get(jobId);
  if (!job) return;
  
  const openai = new OpenAI({
    apiKey: Deno.env.get("OPENAI_API_KEY"),
  });
  
  try {
    // Step 1: Download and check size
    updateJob(jobId, 'downloading', 10, 'מוריד את קובץ האודיו...');
    
    let audioResponse;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      audioResponse = await fetch(job.audio_url, { signal: controller.signal });
      clearTimeout(timeout);
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error('תם הזמן המוקצב להורדת הקובץ (2 דקות)');
      }
      throw new Error(`${ERRORS.DOWNLOAD_FAILED}: ${fetchError.message}`);
    }
    
    if (!audioResponse.ok) {
      job.error_code = 'DOWNLOAD_FAILED';
      throw new Error(`${ERRORS.DOWNLOAD_FAILED}: HTTP ${audioResponse.status}`);
    }
    
    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    const fileSizeBytes = audioBytes.length;
    const fileSizeMB = fileSizeBytes / 1024 / 1024;
    
    if (fileSizeBytes === 0) {
      job.error_code = 'EMPTY_FILE';
      throw new Error('קובץ האודיו ריק או פגום');
    }
    
    console.log(`[Job ${jobId}] File size: ${fileSizeMB.toFixed(2)} MB`);
    
    // Determine extension with enhanced detection
    const contentType = audioResponse.headers.get('content-type') || '';
    const extension = detectFormat(job.audio_url, contentType);
    const needsConversion = NEEDS_CONVERSION.includes(extension);
    
    if (needsConversion && !TRANSCODING_SERVICE_URL) {
      job.error_code = 'INVALID_FORMAT';
      throw new Error(`${ERRORS.INVALID_FORMAT}: ${extension} דורש המרה אך שירות ההמרה לא זמין`);
    }
    
    // Step 2: Direct transcription or chunked processing
    if (fileSizeBytes <= MAX_DIRECT_SIZE_BYTES && !needsConversion) {
      // Small file - direct transcription
      updateJob(jobId, 'transcribing', 30, 'מתמלל עם Whisper...');
      
      const audioFile = new File([audioBytes], `audio.${extension}`, {
        type: contentType || `audio/${extension}`,
      });
      
      // Build transcription params with language optimization
      const transcriptionParams = {
        file: audioFile,
        model: "whisper-1",
        language: job.language || "he",
        response_format: "verbose_json",
      };
      
      // Add Hebrew domain-specific prompt
      if (job.language === 'he') {
        transcriptionParams.prompt = HEBREW_PROMPT;
      }
      
      const startTime = Date.now();
      let transcription;
      
      try {
        transcription = await openai.audio.transcriptions.create(transcriptionParams);
      } catch (openaiError) {
        console.error(`[Job ${jobId}] OpenAI error:`, openaiError.message);
        job.error_code = 'OPENAI_ERROR';
        
        // Parse specific error types
        if (openaiError.message?.includes('Invalid file format')) {
          job.error_code = 'INVALID_FORMAT';
          throw new Error(`פורמט הקובץ לא תואם: ${extension}`);
        } else if (openaiError.message?.includes('rate limit')) {
          job.error_code = 'RATE_LIMIT';
          throw new Error('מגבלת קריאות - נסה שוב בעוד דקה');
        } else if (openaiError.message?.includes('could not be decoded')) {
          job.error_code = 'DECODE_ERROR';
          throw new Error('לא ניתן לקרוא את קובץ האודיו - ייתכן שהקובץ פגום');
        }
        throw new Error(`${ERRORS.TRANSCRIPTION_FAILED}: ${openaiError.message}`);
      }
      
      const duration = (Date.now() - startTime) / 1000;
      
      // Extract and flag problematic segments
      const segments = transcription.segments || [];
      const flaggedSegments = segments
        .filter(seg => 
          (seg.avg_logprob && Math.exp(seg.avg_logprob) < 0.5) || 
          (seg.no_speech_prob && seg.no_speech_prob > 0.5)
        )
        .map(seg => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
          confidence_score: seg.avg_logprob ? Math.exp(seg.avg_logprob) : null,
          flag_type: seg.no_speech_prob > 0.5 ? 'unclear_audio' : 'low_confidence',
          reason: seg.no_speech_prob > 0.5 ? 'אודיו לא ברור' : 'ביטחון נמוך בתמלול'
        }));
      
      job.flagged_segments = flaggedSegments;
      job.quality_score = flaggedSegments.length === 0 ? 100 : 
        Math.max(0, 100 - (flaggedSegments.length / Math.max(segments.length, 1) * 100));
      
      updateJob(jobId, 'completed', 100, 'התמלול הושלם');
      job.result = {
        transcription: transcription.text,
        chunks_count: 1,
        duration_seconds: duration,
        source_duration_sec: transcription.duration,
        audio_duration_seconds: transcription.duration,
        language_detected: transcription.language,
        segments_count: segments.length,
        metadata: {
          format: extension,
          file_size_mb: fileSizeMB.toFixed(2)
        }
      };
      
    } else {
      // Large file or needs conversion - use transcoding service
      if (!TRANSCODING_SERVICE_URL) {
        job.error_code = needsConversion ? 'NEEDS_CONVERSION' : 'FILE_TOO_LARGE';
        throw new Error(needsConversion 
          ? `פורמט ${extension} דורש המרה אך שירות ההמרה לא זמין`
          : ERRORS.FILE_TOO_LARGE
        );
      }
      
      updateJob(jobId, 'transcoding', 20, 'שולח לשירות הטרנסקודינג...');
      
      // Call transcoding service
      let transcodingResponse;
      try {
        transcodingResponse = await fetch(`${TRANSCODING_SERVICE_URL}/transcode-and-split`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SERVICE-TOKEN': TRANSCODING_SERVICE_TOKEN || ''
          },
          body: JSON.stringify({
            sourceUrl: job.audio_url,
            jobId: jobId,
            chunkDurationSec: 2700,
            overlapSec: 3,
            outputFormat: 'mp3',
            targetBitrate: 64
          })
        });
      } catch (transcodingError) {
        job.error_code = 'TRANSCODING_UNAVAILABLE';
        throw new Error(`לא ניתן להתחבר לשירות הטרנסקודינג: ${transcodingError.message}`);
      }
      
      if (!transcodingResponse.ok) {
        const errorText = await transcodingResponse.text();
        job.error_code = 'TRANSCODING_FAILED';
        throw new Error(`שירות הטרנסקודינג החזיר שגיאה: ${errorText}`);
      }
      
      const transcodingResult = await transcodingResponse.json();
      console.log(`[Job ${jobId}] Transcoding result:`, JSON.stringify(transcodingResult));
      
      if (!transcodingResult.success) {
        job.error_code = 'TRANSCODING_FAILED';
        throw new Error(transcodingResult.error || 'הטרנסקודינג נכשל');
      }
      
      // Transcribe chunks
      const chunks = transcodingResult.chunks || [];
      const chunkTranscriptions = [];
      const allFlaggedSegments = [];
      let totalAudioDuration = 0;
      
      // Handle normalized audio (single chunk)
      if (chunks.length === 0 && transcodingResult.normalizedUrl) {
        updateJob(jobId, 'transcribing', 40, 'מתמלל קובץ מומר...');
        
        const normalizedResponse = await fetch(transcodingResult.normalizedUrl);
        if (!normalizedResponse.ok) {
          throw new Error(`שגיאה בהורדת הקובץ המומר: ${normalizedResponse.status}`);
        }
        
        const normalizedBuffer = await normalizedResponse.arrayBuffer();
        const normalizedBytes = new Uint8Array(normalizedBuffer);
        
        const normalizedFile = new File([normalizedBytes], 'audio.mp3', {
          type: 'audio/mpeg'
        });
        
        const transcription = await openai.audio.transcriptions.create({
          file: normalizedFile,
          model: "whisper-1",
          language: job.language || "he",
          response_format: "verbose_json",
          prompt: job.language === 'he' ? HEBREW_PROMPT : undefined
        });
        
        updateJob(jobId, 'completed', 100, 'התמלול הושלם');
        job.result = {
          transcription: transcription.text,
          chunks_count: 1,
          duration_seconds: 0,
          source_duration_sec: transcodingResult.sourceInfo?.durationSec,
          audio_duration_seconds: transcription.duration,
          language_detected: transcription.language,
          was_transcoded: true,
          original_format: extension
        };
        
      } else {
        // Multiple chunks
        updateJob(jobId, 'transcribing', 40, `מתמלל ${chunks.length} חלקים...`);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const progress = 40 + Math.floor((i / chunks.length) * 50);
          updateJob(jobId, 'transcribing', progress, `מתמלל חלק ${i + 1} מתוך ${chunks.length}...`);
          
          try {
            // Download chunk
            const chunkResponse = await fetch(chunk.url);
            if (!chunkResponse.ok) {
              throw new Error(`שגיאה בהורדת חלק ${i + 1}: ${chunkResponse.status}`);
            }
            
            const chunkBuffer = await chunkResponse.arrayBuffer();
            const chunkBytes = new Uint8Array(chunkBuffer);
            
            const chunkFile = new File([chunkBytes], `chunk_${i}.mp3`, {
              type: 'audio/mpeg'
            });
            
            const transcription = await openai.audio.transcriptions.create({
              file: chunkFile,
              model: "whisper-1",
              language: job.language || "he",
              response_format: "verbose_json",
              prompt: job.language === 'he' ? HEBREW_PROMPT : undefined
            });
            
            chunkTranscriptions.push({
              index: chunk.index,
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
            
          } catch (chunkError) {
            console.error(`[Job ${jobId}] Chunk ${i} error:`, chunkError);
            chunkTranscriptions.push({
              index: chunk.index,
              startSec: chunk.startSec,
              endSec: chunk.endSec,
              text: `[שגיאה בתמלול חלק ${i + 1}: ${chunkError.message}]`,
              error: true
            });
          }
        }
        
        // Merge transcriptions
        updateJob(jobId, 'merging', 95, 'ממזג תמלולים...');
        
        const fullTranscription = mergeChunkTranscriptions(chunkTranscriptions, 3);
        const errorChunks = chunkTranscriptions.filter(c => c.error);
        
        job.flagged_segments = allFlaggedSegments;
        job.quality_score = allFlaggedSegments.length === 0 ? 100 : 
          Math.max(0, 100 - (allFlaggedSegments.length * 5));
        
        updateJob(jobId, 'completed', 100, 'התמלול הושלם');
        job.result = {
          transcription: fullTranscription,
          chunks_count: chunks.length,
          successful_chunks: chunks.length - errorChunks.length,
          failed_chunks: errorChunks.length,
          duration_seconds: 0,
          source_duration_sec: transcodingResult.sourceInfo?.durationSec,
          audio_duration_seconds: totalAudioDuration,
          was_transcoded: true,
          original_format: extension,
          metadata: {
            format: extension,
            file_size_mb: fileSizeMB.toFixed(2)
          }
        };
      }
    }
    
    // Update recording if provided
    if (job.recording_id && job.result) {
      try {
        await base44.asServiceRole.entities.Recording.update(job.recording_id, {
          transcription: job.result.transcription,
          status: 'analyzed'
        });
        console.log(`[Job ${jobId}] Updated recording ${job.recording_id}`);
        
        // Save flagged segments as TranscriptionCorrection records for review
        if (job.flagged_segments && job.flagged_segments.length > 0) {
          for (const segment of job.flagged_segments.slice(0, 20)) { // Limit to 20
            try {
              await base44.asServiceRole.entities.TranscriptionCorrection.create({
                recording_id: job.recording_id,
                original_text: segment.text,
                flag_type: segment.flag_type,
                confidence_score: segment.confidence_score,
                segment_start: segment.start,
                segment_end: segment.end,
                domain_category: 'general',
                is_verified: false,
                learned: false
              });
            } catch (correctionError) {
              console.error(`[Job ${jobId}] Failed to save correction:`, correctionError);
            }
          }
          console.log(`[Job ${jobId}] Saved ${Math.min(job.flagged_segments.length, 20)} flagged segments`);
        }
      } catch (updateError) {
        console.error(`[Job ${jobId}] Failed to update recording:`, updateError);
      }
    }
    
  } catch (error) {
    console.error(`[Job ${jobId}] Error:`, error);
    job.status = 'failed';
    job.error = error.message;
    if (!job.error_code) job.error_code = 'PROCESSING_ERROR';
    
    // Update recording with error
    if (job.recording_id) {
      try {
        await base44.asServiceRole.entities.Recording.update(job.recording_id, {
          status: 'failed',
          error_message: error.message,
          error_step: job.steps[job.steps.length - 1]?.step || 'unknown'
        });
      } catch (updateError) {
        console.error(`[Job ${jobId}] Failed to update recording with error:`, updateError);
      }
    }
  }
}

function updateJob(jobId, status, progress, message, details = {}) {
  const job = jobs.get(jobId);
  if (!job) return;
  
  job.status = status;
  job.progress = progress;
  job.steps.push({
    step: status,
    message,
    timestamp: new Date().toISOString(),
    ...details
  });
  
  console.log(`[Job ${jobId}] ${status} (${progress}%): ${message}`);
}

function mergeChunkTranscriptions(chunks, overlapSec) {
  // Sort by index
  chunks.sort((a, b) => a.index - b.index);
  
  // For now, simple concatenation
  // In production, you'd use timestamps to remove overlapping text
  const texts = chunks
    .filter(c => !c.error)
    .map(c => c.text);
  
  return texts.join(' ');
}