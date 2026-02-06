import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Square, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RecordingControls({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const fileName = `recording-${Date.now()}.${extension}`;
        const audioFile = new File([audioBlob], fileName, { type: mimeType });
        if (onRecordingComplete) {
          onRecordingComplete(audioFile, formatTime(timer));
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('לא ניתן לגשת למיקרופון');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 500 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('הקובץ גדול מדי! מקסימום 500MB');
        return;
      }
      if (onRecordingComplete) {
        onRecordingComplete(file, '00:00');
      }
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" />
          הקלטה חדשה
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          הקלט או העלה קובץ — תמלול וניתוח אוטומטי באמצעות AI
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col items-center justify-center py-8">
        {/* Recording Button */}
        <div className="relative mb-6">
          <button
            className={`w-32 h-32 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
              isRecording
                ? 'bg-destructive shadow-xl ring-4 ring-destructive/20 animate-pulse'
                : 'bg-primary hover:bg-primary/90 shadow-organic-lg hover:shadow-organic-xl'
            }`}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
          >
            {isRecording ? (
              <Square className="w-10 h-10 text-destructive-foreground" fill="currentColor" />
            ) : (
              <Mic className="w-10 h-10 text-primary-foreground" strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Timer */}
        {isRecording && (
          <div className="text-3xl font-bold text-destructive mb-4 tabular-nums">
            {formatTime(timer)}
          </div>
        )}

        {/* Waveform indicator */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1 h-10 mb-4">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${12 + Math.sin(Date.now() / 300 + i) * 10}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        <p className="text-muted-foreground text-center text-sm mb-4">
          {isRecording ? 'מקליט... לחץ לעצירה' : 'לחץ להתחלת הקלטה'}
        </p>

        {/* Upload area */}
        {!isRecording && (
          <>
            <div className="flex items-center gap-4 my-4 w-full max-w-xs">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">או</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div
              className="w-full max-w-xs p-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">העלה קובץ</p>
                <p className="text-xs text-muted-foreground">MP3, WAV, M4A (עד 500MB)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
