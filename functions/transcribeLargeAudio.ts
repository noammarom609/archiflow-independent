import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import OpenAI from 'npm:openai';

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  const startTime = Date.now();
  console.log('[TranscribeLargeAudio] Function invoked');
  
  try {
    const base44 = createClientFromRequest(req);
    console.log('[TranscribeLargeAudio] Checking auth...');
    const user = await base44.auth.me();

    if (!user) {
      console.log('[TranscribeLargeAudio] Unauthorized');
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`[TranscribeLargeAudio] User: ${user.email}`);

    const body = await req.json();
    const { audio_url, language = 'he' } = body;

    if (!audio_url) {
      console.log('[TranscribeLargeAudio] Missing audio_url');
      return Response.json({ success: false, error: 'Missing audio_url' }, { status: 400 });
    }

    console.log(`[TranscribeLargeAudio] Processing: ${audio_url}`);

    // 1. Download audio
    console.log('[TranscribeLargeAudio] Downloading audio...');
    const response = await fetch(audio_url);
    if (!response.ok) {
      console.error(`[TranscribeLargeAudio] Download failed: ${response.status}`);
      return Response.json({ 
        success: false, 
        error: `Failed to download audio: ${response.status}` 
      }, { status: 400 });
    }
    console.log('[TranscribeLargeAudio] Download complete.');
    
    const arrayBuffer = await response.arrayBuffer();
    const audioData = new Uint8Array(arrayBuffer);
    const fileSizeMB = audioData.length / (1024 * 1024);
    
    // Detect extension from URL or content-type
    const contentType = response.headers.get('content-type') || '';
    let extension = 'mp3';
    if (audio_url.includes('.m4a') || contentType.includes('m4a')) extension = 'm4a';
    else if (audio_url.includes('.wav') || contentType.includes('wav')) extension = 'wav';
    else if (audio_url.includes('.webm') || contentType.includes('webm')) extension = 'webm';
    else if (audio_url.includes('.ogg') || contentType.includes('ogg')) extension = 'ogg';
    else if (audio_url.includes('.mp3') || contentType.includes('mp3') || contentType.includes('mpeg')) extension = 'mp3';

    console.log(`[TranscribeLargeAudio] File size: ${fileSizeMB.toFixed(2)} MB, Format: ${extension}`);

    // Check file size - Whisper API limit is 25MB
    if (fileSizeMB > 25) {
      console.error(`[TranscribeLargeAudio] File too large: ${fileSizeMB.toFixed(2)}MB > 25MB limit`);
      return Response.json({ 
        success: false, 
        error: `File too large (${fileSizeMB.toFixed(1)}MB). Maximum is 25MB. The file should be split before calling this function.`
      }, { status: 400 });
    }

    // 2. Transcribe with Whisper
    console.log(`[TranscribeLargeAudio] Transcribing with Whisper...`);
    
    const mimeType = contentType || `audio/${extension}`;
    const file = new File([audioData], `audio.${extension}`, { type: mimeType });
    
    const transcriptionParams = {
      file,
      model: "whisper-1",
      language: language,
      response_format: "text",
    };
    
    // Add domain-specific prompt for Hebrew
    if (language === 'he') {
      transcriptionParams.prompt = 'שיחה בעברית בנושא אדריכלות, עיצוב פנים, שיפוץ, חומרים, תכנון, לקוחות, פרויקטים, הצעות מחיר, קבלנים';
    }
    
    const result = await openai.audio.transcriptions.create(transcriptionParams);
    const transcription = result;

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[TranscribeLargeAudio] Completed in ${totalTime}s, transcription length: ${transcription?.length || 0} chars`);

    return Response.json({
      success: true,
      transcription: transcription,
      file_size_mb: fileSizeMB.toFixed(2),
      processing_time_sec: totalTime
    });

  } catch (error) {
    console.error(`[TranscribeLargeAudio] ERROR: ${error.message}`);
    console.error(`[TranscribeLargeAudio] Stack: ${error.stack}`);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});