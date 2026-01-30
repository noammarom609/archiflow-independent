import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2, AlertCircle, Brain } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AudioConverter from '../components/audio/AudioConverter';
import ChunkedTranscriber from '../components/audio/ChunkedTranscriber';

export default function TestTranscribe() {
  const [file, setFile] = useState(null);
  const [convertingFile, setConvertingFile] = useState(null);
  const [transcribingFile, setTranscribingFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3 
    });
    console.log(`[${timestamp}] ${message}`);
    setLogs(prev => [...prev, { timestamp, message, type }]);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      addLog(`📁 נבחר קובץ: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`, 'info');
      setConvertingFile(selectedFile);
      setResult(null);
      setError(null);
    }
  };

  const handleConversionComplete = (convertedFile) => {
    addLog(`✅ קובץ מוכן: ${convertedFile.name} (${(convertedFile.size / 1024 / 1024).toFixed(2)} MB)`, 'success');
    setFile(convertedFile);
    setConvertingFile(null);
    
    // Auto-start transcription
    setTranscribingFile(convertedFile);
  };

  const handleConversionError = (errorMsg) => {
    addLog(`❌ שגיאת המרה: ${errorMsg}`, 'error');
    setError(`שגיאת המרה: ${errorMsg}`);
    setConvertingFile(null);
  };

  const handleTranscriptionComplete = (data) => {
    addLog(`✅ תמלול הושלם!`, 'success');
    setResult({
      success: true,
      transcription: data.transcription,
      method: 'whisper'
    });
    setTranscribingFile(null);
  };

  const handleTranscriptionError = (errorMsg) => {
    addLog(`❌ שגיאת תמלול: ${errorMsg}`, 'error');
    setError(`שגיאת תמלול: ${errorMsg}`);
    setTranscribingFile(null);
  };

  const handleTest = async () => {
    if (!file) return;
    setTranscribingFile(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8" dir="rtl">
      {convertingFile && (
        <AudioConverter
          file={convertingFile}
          onConverted={handleConversionComplete}
          onError={handleConversionError}
        />
      )}
      {transcribingFile && (
        <ChunkedTranscriber
          file={transcribingFile}
          onComplete={handleTranscriptionComplete}
          onError={handleTranscriptionError}
          addLog={addLog}
        />
      )}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-3">
              <Brain className="w-7 h-7 text-indigo-600" />
              מעבדת תמלול - OpenAI Whisper
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">
              תמלול מדויק בעברית עם מודל Whisper של OpenAI
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
                id="audio-file"
                disabled={!!convertingFile}
              />
              <label htmlFor="audio-file">
                <div className={`border-2 border-dashed border-slate-300 rounded-lg p-8 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all ${convertingFile ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-slate-700">
                      {file ? file.name : 'בחר קובץ אודיו'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      MP3, WAV, M4A, OGG, FLAC (עד 25MB)
                    </p>
                    {file && (
                      <>
                        <p className="text-xs text-slate-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            setFile(null);
                          }}
                          className="mt-2"
                        >
                          נקה
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </label>
            </div>

            {/* Test Button */}
            <Button
              onClick={handleTest}
              disabled={!file || loading || !!transcribingFile}
              className="w-full h-12"
            >
              {transcribingFile ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  מתמלל עם Whisper...
                </>
              ) : (
                'התחל תמלול'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">מעבד...</p>
                  <p className="text-sm text-blue-700">שולח לתמלול עם OpenAI Whisper</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 mb-1">שגיאה</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Result */}
        {result && result.success && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <p className="font-medium text-green-900">תמלול הושלם!</p>
              </div>

              <div className="p-4 bg-white rounded border border-green-200">
                <p className="text-xs text-slate-500 mb-2">תמלול</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {result.transcription}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Logs Display */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">לוגים ({logs.length})</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogs([])}
              disabled={logs.length === 0}
            >
              נקה
            </Button>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-slate-500 text-center py-8">אין לוגים עדיין</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 ${
                        log.type === 'error'
                          ? 'text-red-400'
                          : log.type === 'success'
                          ? 'text-green-400'
                          : 'text-slate-300'
                      }`}
                      dir="ltr"
                    >
                      <span className="text-slate-500">[{log.timestamp}]</span>
                      <span className="whitespace-pre-wrap break-all">{log.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}