import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { archiflow } from '@/api/archiflow';

export default function AudioConverter({ file, onConverted, onError, onProgress }) {
  const [converting, setConverting] = useState(false);
  const [status, setStatus] = useState('');

  React.useEffect(() => {
    if (!file) return;

    // Gemini supports M4A, MP3, WAV, and more - no conversion needed!
    const needsConversion = file.name.toLowerCase().match(/\.(wma|aiff|aif|aifc)$/);
    if (!needsConversion) {
      // No conversion needed - Gemini handles it
      onConverted(file);
      return;
    }

    convertAudio();
  }, [file]);

  const convertAudio = async () => {
    setConverting(true);
    setStatus('מעלה קובץ...');

    try {
      console.log('🔄 [CONVERT] Uploading file for conversion...');

      // Upload original file
      const uploadResult = await archiflow.integrations.Core.UploadFile({ file });
      console.log('✅ [CONVERT] File uploaded:', uploadResult.file_url);

      setStatus('ממיר קובץ (1-2 דקות)...');
      onProgress?.(10);

      // Use CloudConvert via backend function
      const response = await archiflow.functions.invoke('convertAudioToMP3', {
        audio_url: uploadResult.file_url,
        original_filename: file.name
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Conversion failed');
      }

      console.log('✅ [CONVERT] Conversion complete:', response.data.converted_url);
      onProgress?.(50);

      setStatus('מוריד קובץ...');

      // Download converted file
      const convertedResponse = await fetch(response.data.converted_url);
      const convertedBlob = await convertedResponse.blob();
      
      const convertedFile = new File(
        [convertedBlob],
        file.name.replace(/\.[^.]+$/, '.mp3'),
        { type: 'audio/mpeg' }
      );

      console.log('✅ [CONVERT] Conversion complete!');
      onProgress?.(100);
      onConverted(convertedFile);

    } catch (error) {
      console.error('❌ [CONVERT] Error:', error);
      onError(error.message || 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  if (!converting) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" dir="rtl">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            ממיר קובץ לפורמט נתמך
          </h3>
          <p className="text-sm text-slate-600 mb-4">
            {status}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            המרת {file?.name} ל-MP3
          </p>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              💡 ההמרה מתבצעת בשרת ויכולה לקחת 1-2 דקות
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}