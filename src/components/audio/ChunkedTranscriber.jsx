import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Progress } from '@/components/ui/progress';

const MAX_SIZE_MB = 25;

export default function ChunkedTranscriber({ file, onComplete, onError, addLog }) {
  const [transcribing, setTranscribing] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);

  React.useEffect(() => {
    if (!file) return;
    startTranscription();
  }, [file]);

  const startTranscription = async () => {
    setTranscribing(true);
    setProgress(0);

    try {
      const fileSizeMB = file.size / 1024 / 1024;
      addLog?.(`📁 גודל הקובץ: ${fileSizeMB.toFixed(2)}MB`, 'info');
      
      // Upload file first
      setStatus('מעלה קובץ...');
      setProgress(20);
      addLog?.(`📤 מעלה קובץ...`, 'info');
      
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      addLog?.(`✅ קובץ הועלה: ${uploadResult.file_url}`, 'success');
      setProgress(40);

      // If file is large, use the split and transcribe function
      if (fileSizeMB > MAX_SIZE_MB) {
        addLog?.(`📦 קובץ גדול מ-${MAX_SIZE_MB}MB - שולח לעיבוד בשרת...`, 'info');
        setStatus('מעבד קובץ גדול בשרת...');
        setProgress(50);
        
        const response = await base44.functions.invoke('splitAndTranscribe', {
          audio_url: uploadResult.file_url
        });

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Transcription failed');
        }

        setProgress(100);
        addLog?.(`✅ תמלול הושלם! (${response.data.chunks_count || 1} חלקים)`, 'success');
        onComplete({ transcription: response.data.transcription });
        
      } else {
        // Small file - direct transcription
        setStatus('מתמלל עם Whisper...');
        setProgress(60);
        addLog?.('🎙️ מתמלל עם OpenAI Whisper...', 'info');
        
        const response = await base44.functions.invoke('transcribeWithWhisper', {
          audio_url: uploadResult.file_url
        });

        if (!response.data?.success) {
          throw new Error(response.data?.error || 'Transcription failed');
        }

        setProgress(100);
        addLog?.(`✅ תמלול הושלם ב-${response.data.duration_seconds} שניות`, 'success');
        onComplete({ transcription: response.data.transcription });
      }

    } catch (error) {
      console.error('❌ [TRANSCRIBE] Error:', error);
      addLog?.(`❌ שגיאה: ${error.message}`, 'error');
      onError(error.message || 'Transcription failed');
    } finally {
      setTranscribing(false);
    }
  };

  if (!transcribing) return null;

  const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(1) : 0;
  const isLargeFile = parseFloat(fileSizeMB) > MAX_SIZE_MB;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {status || 'מתמלל קובץ'}
          </h3>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>{fileSizeMB}MB</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <p className="text-xs font-semibold text-green-900 mb-1">
              🎙️ Powered by OpenAI Whisper
            </p>
            <p className="text-xs text-green-700">
              {isLargeFile 
                ? 'קובץ גדול - מעבד בשרת...'
                : 'תמלול מדויק בעברית'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}