import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai';

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

const MAX_SIZE_BYTES = 24 * 1024 * 1024; // 24MB limit per chunk

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { audio_url } = await req.json();

    if (!audio_url) {
      return Response.json({ error: 'Missing audio_url parameter' }, { status: 400 });
    }

    console.log('[SPLIT_TRANSCRIBE] Downloading audio from:', audio_url);
    
    // Download the audio file
    const audioResponse = await fetch(audio_url);
    if (!audioResponse.ok) {
      return Response.json({ error: 'Failed to download audio file' }, { status: 400 });
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const fileSizeBytes = audioBuffer.byteLength;
    const fileSizeMB = fileSizeBytes / 1024 / 1024;
    
    console.log('[SPLIT_TRANSCRIBE] File size:', fileSizeMB.toFixed(2), 'MB');

    // Determine file extension from URL or content-type
    const contentType = audioResponse.headers.get('content-type') || '';
    let extension = 'mp3';
    if (audio_url.includes('.m4a') || contentType.includes('m4a')) extension = 'm4a';
    else if (audio_url.includes('.wav') || contentType.includes('wav')) extension = 'wav';
    else if (audio_url.includes('.mp4') || contentType.includes('mp4')) extension = 'mp4';
    else if (audio_url.includes('.ogg') || contentType.includes('ogg')) extension = 'ogg';
    else if (audio_url.includes('.webm') || contentType.includes('webm')) extension = 'webm';
    else if (audio_url.includes('.flac') || contentType.includes('flac')) extension = 'flac';
    else if (audio_url.includes('.mp3') || contentType.includes('mp3') || contentType.includes('mpeg')) extension = 'mp3';

    // If file is small enough, transcribe directly
    if (fileSizeBytes <= MAX_SIZE_BYTES) {
      console.log('[SPLIT_TRANSCRIBE] File is small enough, transcribing directly');
      
      const audioFile = new File([audioBuffer], `audio.${extension}`, { 
        type: contentType || `audio/${extension}` 
      });

      const startTime = Date.now();
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "he",
        response_format: "text",
      });
      const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

      return Response.json({
        success: true,
        transcription: transcription,
        duration_seconds: durationSeconds,
        file_size_mb: fileSizeMB.toFixed(2),
        chunks_count: 1
      });
    }

    // For large files, we need to split by time duration
    // Since we can't use FFmpeg in Deno easily, we'll use a different approach:
    // Split the binary but ensure we maintain valid audio headers
    
    console.log('[SPLIT_TRANSCRIBE] File too large, attempting chunked transcription');
    
    // For formats like MP3, WAV - we can try a byte-based split with overlap
    // This is a workaround - ideally we'd use FFmpeg
    
    // Calculate chunk duration based on file size
    // Assume roughly linear relationship between size and duration
    const numChunks = Math.ceil(fileSizeBytes / MAX_SIZE_BYTES);
    const chunkSize = Math.ceil(fileSizeBytes / numChunks);
    
    console.log('[SPLIT_TRANSCRIBE] Splitting into', numChunks, 'chunks of ~', (chunkSize / 1024 / 1024).toFixed(1), 'MB');

    const transcriptions = [];
    const audioData = new Uint8Array(audioBuffer);

    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileSizeBytes);
      
      // For the chunk, we need to ensure it starts with valid audio data
      // For MP3/M4A this is tricky without proper parsing
      let chunkData;
      
      if (i === 0) {
        // First chunk - include headers
        chunkData = audioData.slice(start, end);
      } else {
        // Subsequent chunks - this won't work well for most formats
        // We need a different approach
        chunkData = audioData.slice(start, end);
      }

      const chunkFile = new File(
        [chunkData], 
        `chunk_${i + 1}.${extension}`, 
        { type: contentType || `audio/${extension}` }
      );

      console.log(`[SPLIT_TRANSCRIBE] Transcribing chunk ${i + 1}/${numChunks} (${(chunkFile.size / 1024 / 1024).toFixed(1)}MB)`);

      try {
        const chunkTranscription = await openai.audio.transcriptions.create({
          file: chunkFile,
          model: "whisper-1",
          language: "he",
          response_format: "text",
        });
        
        transcriptions.push(chunkTranscription);
        console.log(`[SPLIT_TRANSCRIBE] Chunk ${i + 1} transcribed successfully`);
      } catch (chunkError) {
        console.error(`[SPLIT_TRANSCRIBE] Chunk ${i + 1} failed:`, chunkError.message);
        // If chunking fails, we can't proceed with this approach
        return Response.json({
          success: false,
          error: `קובץ גדול מדי (${fileSizeMB.toFixed(1)}MB) ופורמט ${extension.toUpperCase()} לא תומך בחלוקה. אנא המר את הקובץ ל-MP3 קטן יותר מ-25MB.`,
          file_size_mb: fileSizeMB.toFixed(2),
          suggestion: 'נסה להמיר את הקובץ ל-MP3 באיכות נמוכה יותר כדי להקטין את הגודל'
        });
      }
    }

    // Combine transcriptions
    const fullTranscription = transcriptions.join('\n\n');

    return Response.json({
      success: true,
      transcription: fullTranscription,
      file_size_mb: fileSizeMB.toFixed(2),
      chunks_count: numChunks
    });

  } catch (error) {
    console.error('[SPLIT_TRANSCRIBE] Error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});