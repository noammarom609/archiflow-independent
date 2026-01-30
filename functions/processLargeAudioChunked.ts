import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import OpenAI from 'npm:openai@4.28.0';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// Whisper API limit is 25MB, we use 20MB to be safe
const MAX_CHUNK_SIZE_BYTES = 20 * 1024 * 1024;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { audio_url, file_name, file_size_mb } = await req.json();
    
    if (!audio_url) {
      return Response.json({ success: false, error: 'Missing audio_url' }, { status: 400 });
    }

    console.log(`🎬 Processing large audio: ${file_name} (${file_size_mb?.toFixed(1)}MB)`);
    console.log(`📥 Downloading from: ${audio_url}`);

    // Step 1: Download the audio file
    const audioResponse = await fetch(audio_url);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }
    
    const audioBuffer = await audioResponse.arrayBuffer();
    const totalSize = audioBuffer.byteLength;
    console.log(`✅ Downloaded ${(totalSize / 1024 / 1024).toFixed(2)}MB`);

    // Determine file extension from URL or filename
    let extension = 'mp3';
    if (file_name) {
      const ext = file_name.split('.').pop()?.toLowerCase();
      if (['mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg', 'flac'].includes(ext)) {
        extension = ext;
      }
    } else if (audio_url.includes('.')) {
      const urlExt = audio_url.split('.').pop()?.split('?')[0]?.toLowerCase();
      if (['mp3', 'mp4', 'm4a', 'wav', 'webm', 'ogg', 'flac'].includes(urlExt)) {
        extension = urlExt;
      }
    }

    // Step 2: If file is small enough, transcribe directly
    if (totalSize <= MAX_CHUNK_SIZE_BYTES) {
      console.log('📝 File is small enough, transcribing directly...');
      
      const file = new File([audioBuffer], `audio.${extension}`, { 
        type: getMimeType(extension) 
      });
      
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: 'he',
        response_format: 'text',
      });

      console.log(`✅ Transcription complete: ${transcription.length} chars`);
      
      return Response.json({
        success: true,
        transcription: transcription,
        chunks_processed: 1,
        total_size_mb: totalSize / 1024 / 1024
      });
    }

    // Step 3: Split into chunks and transcribe each
    console.log(`📦 File too large (${(totalSize / 1024 / 1024).toFixed(1)}MB), splitting into chunks...`);
    
    const numChunks = Math.ceil(totalSize / MAX_CHUNK_SIZE_BYTES);
    const chunkSize = Math.ceil(totalSize / numChunks);
    console.log(`📊 Splitting into ${numChunks} chunks of ~${(chunkSize / 1024 / 1024).toFixed(1)}MB each`);

    const transcriptions = [];
    
    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const chunkBuffer = audioBuffer.slice(start, end);
      
      console.log(`🎙️ Transcribing chunk ${i + 1}/${numChunks} (${(chunkBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)...`);
      
      try {
        const chunkFile = new File([chunkBuffer], `chunk_${i}.${extension}`, {
          type: getMimeType(extension)
        });
        
        const chunkTranscription = await openai.audio.transcriptions.create({
          file: chunkFile,
          model: 'whisper-1',
          language: 'he',
          response_format: 'text',
        });
        
        transcriptions.push({
          index: i,
          text: chunkTranscription || '',
          success: true
        });
        
        console.log(`✅ Chunk ${i + 1} done: ${chunkTranscription?.length || 0} chars`);
        
      } catch (chunkError) {
        console.error(`❌ Chunk ${i + 1} failed:`, chunkError.message);
        transcriptions.push({
          index: i,
          text: `[שגיאה בתמלול חלק ${i + 1}]`,
          success: false,
          error: chunkError.message
        });
      }
    }

    // Step 4: Combine transcriptions
    console.log('📝 Combining transcriptions...');
    
    const combinedText = transcriptions
      .sort((a, b) => a.index - b.index)
      .map((t, idx) => {
        if (numChunks > 1 && t.text.trim()) {
          // Add time markers for multi-chunk files
          const estimatedMinutes = Math.floor((idx * chunkSize) / (totalSize / (file_size_mb || 1)) * (file_size_mb || 1));
          return t.text;
        }
        return t.text;
      })
      .filter(text => text.trim())
      .join('\n\n');

    const successCount = transcriptions.filter(t => t.success).length;
    console.log(`🎉 Processing complete! ${combinedText.length} chars from ${successCount}/${numChunks} successful chunks`);

    return Response.json({
      success: true,
      transcription: combinedText,
      chunks_processed: numChunks,
      chunks_successful: successCount,
      total_size_mb: totalSize / 1024 / 1024
    });

  } catch (error) {
    console.error('❌ Process error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
});

function getMimeType(extension) {
  const mimeTypes = {
    'mp3': 'audio/mpeg',
    'mp4': 'audio/mp4',
    'm4a': 'audio/mp4',
    'wav': 'audio/wav',
    'webm': 'audio/webm',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac'
  };
  return mimeTypes[extension] || 'audio/mpeg';
}