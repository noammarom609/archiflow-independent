import React, { useState, useEffect, useRef } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Loader2, CheckCircle2, AlertCircle, Upload, Scissors, FileAudio, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

// Target chunk size ~10MB to stay well under 25MB Whisper limit and upload limits
const TARGET_CHUNK_SIZE_MB = 10;
const CHUNK_DURATION_SECONDS = 900; // 15 minutes per chunk

export default function LargeAudioProcessor({ 
  file, 
  onComplete, 
  onError, 
  onCancel 
}) {
  const [stage, setStage] = useState('loading_ffmpeg');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('טוען מנוע עיבוד...');
  const [chunkInfo, setChunkInfo] = useState({ current: 0, total: 0 });
  const [error, setError] = useState(null);
  const [detailedLog, setDetailedLog] = useState([]);
  const ffmpegRef = useRef(null);
  const abortRef = useRef(false);

  const addLog = (message) => {
    console.log(`[LargeAudio] ${message}`);
    setDetailedLog(prev => [...prev.slice(-10), message]);
  };

  useEffect(() => {
    if (file) {
      processFile();
    }
    return () => {
      abortRef.current = true;
    };
  }, [file]);

  const loadFFmpeg = async () => {
    try {
      addLog('Loading FFmpeg WASM...');
      
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;

      ffmpeg.on('log', ({ message }) => {
        if (message.includes('Duration') || message.includes('time=')) {
          addLog(message);
        }
      });

      ffmpeg.on('progress', ({ progress: p }) => {
        if (stage === 'splitting' && p > 0) {
          const splitProgress = Math.round(p * 100);
          setProgress(Math.min(10 + splitProgress * 0.3, 40));
        }
      });

      // Load FFmpeg with specific CORS-friendly URLs
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      await ffmpeg.load({
        coreURL: `${baseURL}/ffmpeg-core.js`,
        wasmURL: `${baseURL}/ffmpeg-core.wasm`,
      });

      addLog('FFmpeg loaded successfully!');
      return ffmpeg;
      
    } catch (err) {
      addLog(`FFmpeg load error: ${err.message}`);
      throw new Error(`שגיאה בטעינת מנוע עיבוד: ${err.message}`);
    }
  };

  const splitAudioIntoChunks = async (ffmpeg, inputFile) => {
    addLog(`Splitting file: ${inputFile.name} (${(inputFile.size / 1024 / 1024).toFixed(1)}MB)`);
    
    // Write input file to FFmpeg filesystem
    const inputName = 'input.mp3';
    const inputData = await fetchFile(inputFile);
    await ffmpeg.writeFile(inputName, inputData);
    addLog('File loaded into FFmpeg');

    // Estimate duration based on file size (~1MB per minute at 128kbps)
    const fileSizeMB = inputFile.size / 1024 / 1024;
    const estimatedDurationSeconds = fileSizeMB * 60;
    const numChunks = Math.max(1, Math.ceil(estimatedDurationSeconds / CHUNK_DURATION_SECONDS));
    
    addLog(`Estimated duration: ${Math.round(estimatedDurationSeconds / 60)} minutes, ${numChunks} chunks`);
    setChunkInfo({ current: 0, total: numChunks });

    const chunks = [];

    for (let i = 0; i < numChunks; i++) {
      if (abortRef.current) throw new Error('בוטל');

      const startTime = i * CHUNK_DURATION_SECONDS;
      const outputName = `chunk_${i}.mp3`;
      
      setStatusMessage(`מפצל חלק ${i + 1} מתוך ${numChunks}...`);
      addLog(`Creating chunk ${i + 1}/${numChunks} starting at ${startTime}s`);

      try {
        await ffmpeg.exec([
          '-i', inputName,
          '-ss', String(startTime),
          '-t', String(CHUNK_DURATION_SECONDS),
          '-acodec', 'libmp3lame',
          '-b:a', '64k',  // Lower bitrate for smaller files
          '-ar', '16000', // 16kHz optimal for Whisper
          '-ac', '1',     // Mono
          '-y',
          outputName
        ]);

        const data = await ffmpeg.readFile(outputName);
        
        if (data.length > 1000) { // Only add if chunk has actual content
          const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
          const chunkFile = new File([blob], outputName, { type: 'audio/mpeg' });
          
          chunks.push({
            index: i,
            file: chunkFile,
            sizeMB: chunkFile.size / 1024 / 1024,
            startTime
          });
          
          addLog(`Chunk ${i + 1}: ${(chunkFile.size / 1024 / 1024).toFixed(2)}MB`);
        }

        await ffmpeg.deleteFile(outputName);
        setChunkInfo({ current: i + 1, total: numChunks });
        setProgress(10 + Math.round(((i + 1) / numChunks) * 30));
        
      } catch (chunkErr) {
        addLog(`Chunk ${i + 1} error: ${chunkErr.message}`);
        // Continue with other chunks
      }
    }

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    
    addLog(`Split complete: ${chunks.length} chunks created`);
    return chunks;
  };

  const uploadAndTranscribeChunk = async (chunk, index, total) => {
    addLog(`Uploading chunk ${index + 1}/${total} (${chunk.sizeMB.toFixed(1)}MB)...`);
    
    // Upload
    const uploadResult = await base44.integrations.Core.UploadFile({ file: chunk.file });
    const fileUrl = uploadResult.file_url;
    addLog(`Chunk ${index + 1} uploaded`);

    // Transcribe
    addLog(`Transcribing chunk ${index + 1}...`);
    const transcribeResult = await base44.functions.invoke('transcribeLargeAudio', { 
      audio_url: fileUrl 
    });

    if (!transcribeResult.data?.success) {
      addLog(`Chunk ${index + 1} transcription failed: ${transcribeResult.data?.error}`);
      return `[שגיאה בחלק ${index + 1}]`;
    }

    const text = transcribeResult.data.transcription || '';
    addLog(`Chunk ${index + 1} transcribed: ${text.length} chars`);
    return text;
  };

  const processFile = async () => {
    try {
      abortRef.current = false;
      setError(null);
      setDetailedLog([]);
      
      const fileSizeMB = file.size / 1024 / 1024;
      addLog(`Starting: ${file.name} (${fileSizeMB.toFixed(1)}MB)`);

      // Step 1: Load FFmpeg
      setStage('loading_ffmpeg');
      setStatusMessage('טוען מנוע עיבוד אודיו...');
      setProgress(5);
      
      const ffmpeg = await loadFFmpeg();
      if (abortRef.current) return;

      // Step 2: Split file into chunks
      setStage('splitting');
      setStatusMessage('מפצל קובץ לחלקים...');
      setProgress(10);
      
      const chunks = await splitAudioIntoChunks(ffmpeg, file);
      if (abortRef.current) return;
      
      if (chunks.length === 0) {
        throw new Error('לא נוצרו חלקים - ייתכן שהקובץ ריק');
      }

      // Step 3: Upload and transcribe each chunk
      setStage('transcribing');
      const transcriptions = [];
      
      for (let i = 0; i < chunks.length; i++) {
        if (abortRef.current) return;
        
        setStatusMessage(`מעלה ומתמלל חלק ${i + 1} מתוך ${chunks.length}...`);
        setChunkInfo({ current: i, total: chunks.length });
        setProgress(40 + Math.round(((i + 0.5) / chunks.length) * 50));
        
        try {
          const text = await uploadAndTranscribeChunk(chunks[i], i, chunks.length);
          transcriptions.push({ index: i, text, startTime: chunks[i].startTime });
        } catch (err) {
          addLog(`Chunk ${i + 1} failed: ${err.message}`);
          transcriptions.push({ index: i, text: `[שגיאה בחלק ${i + 1}]`, startTime: chunks[i].startTime });
        }
        
        setChunkInfo({ current: i + 1, total: chunks.length });
        setProgress(40 + Math.round(((i + 1) / chunks.length) * 50));
      }

      // Step 4: Combine transcriptions
      setStage('combining');
      setStatusMessage('מאחד תמלולים...');
      setProgress(95);
      
      const combined = transcriptions
        .sort((a, b) => a.index - b.index)
        .map(t => t.text)
        .filter(t => t && !t.startsWith('[שגיאה'))
        .join('\n\n');

      // Done!
      setStage('done');
      setProgress(100);
      setStatusMessage('הושלם!');
      addLog(`Complete! Total: ${combined.length} chars`);

      onComplete({
        transcription: combined,
        chunks: chunks.length,
        totalSize: fileSizeMB
      });

    } catch (err) {
      console.error('Processing error:', err);
      addLog(`Error: ${err.message}`);
      setError(err.message);
      setStage('error');
      if (!abortRef.current) {
        onError(err.message);
      }
    }
  };

  const handleCancel = () => {
    abortRef.current = true;
    onCancel?.();
  };

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">שגיאה בעיבוד</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <div className="text-xs text-red-400 text-right max-h-20 overflow-auto bg-red-100 p-2 rounded mb-4">
            {detailedLog.slice(-5).map((log, i) => <div key={i}>{log}</div>)}
          </div>
          <Button variant="outline" onClick={handleCancel}>חזרה</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white/80 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            {stage === 'done' ? (
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            ) : stage === 'splitting' ? (
              <Scissors className="w-8 h-8 text-indigo-600 animate-pulse" />
            ) : stage === 'transcribing' ? (
              <FileAudio className="w-8 h-8 text-indigo-600 animate-pulse" />
            ) : (
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            עיבוד קובץ גדול
          </h3>
          <p className="text-sm text-slate-600">{statusMessage}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span>התקדמות</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-between items-center mb-6 px-2">
          {[
            { key: 'loading_ffmpeg', label: 'טעינה' },
            { key: 'splitting', label: 'פיצול' },
            { key: 'transcribing', label: 'תמלול' },
            { key: 'done', label: 'הושלם' }
          ].map((s, idx, arr) => {
            const stageOrder = ['loading_ffmpeg', 'splitting', 'transcribing', 'combining', 'done'];
            const currentIdx = stageOrder.indexOf(stage);
            const thisIdx = stageOrder.indexOf(s.key);
            const isComplete = thisIdx < currentIdx || stage === 'done';
            const isCurrent = s.key === stage || (s.key === 'transcribing' && stage === 'combining');

            return (
              <React.Fragment key={s.key}>
                <div className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                    ${isComplete ? 'bg-green-500 text-white' : 
                      isCurrent ? 'bg-indigo-500 text-white animate-pulse' : 
                      'bg-slate-200 text-slate-500'}
                  `}>
                    {isComplete ? '✓' : idx + 1}
                  </div>
                  <span className="text-[10px] mt-1 text-slate-600">{s.label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div className={`flex-1 h-1 mx-1 rounded ${thisIdx < currentIdx ? 'bg-green-500' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Chunk Progress */}
        {chunkInfo.total > 0 && (
          <div className="bg-white/60 rounded-xl p-4 mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">חלקים:</span>
              <span className="font-semibold text-indigo-600">
                {chunkInfo.current} / {chunkInfo.total}
              </span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {Array.from({ length: chunkInfo.total }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded ${
                    idx < chunkInfo.current ? 'bg-green-500' :
                    idx === chunkInfo.current ? 'bg-indigo-500 animate-pulse' :
                    'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* File Info */}
        <div className="bg-white/40 rounded-lg p-3 text-center mb-4">
          <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
          <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>

        {/* Live Log */}
        {detailedLog.length > 0 && (
          <div className="text-[10px] text-slate-400 bg-slate-100 rounded p-2 max-h-16 overflow-auto mb-4 font-mono">
            {detailedLog.slice(-3).map((log, i) => <div key={i}>{log}</div>)}
          </div>
        )}

        {/* Cancel Button */}
        {stage !== 'done' && (
          <Button variant="ghost" onClick={handleCancel} className="w-full text-slate-500">
            <X className="w-4 h-4 ml-2" />
            ביטול
          </Button>
        )}
      </CardContent>
    </Card>
  );
}