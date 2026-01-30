import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mic, Square, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function RecordingControls({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [showWaveform, setShowWaveform] = useState(false);
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
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
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
      setShowWaveform(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('לא ניתן לגשת למיקרופון');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setShowWaveform(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const maxSize = 500 * 1024 * 1024; // 500MB limit (Backend handles splitting)
      
      if (file.size > maxSize) {
        toast.error(`הקובץ גדול מדי! מקסימום 500MB`);
        return;
      }
      
      if (onRecordingComplete) {
        onRecordingComplete(file, '00:00');
      }
    }
  };

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-white to-indigo-50/30 h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl flex items-center gap-2">
          <Mic className="w-6 h-6 text-indigo-600" />
          הקלטה חדשה
        </CardTitle>
        <p className="text-sm text-slate-500">
          תמלול באמצעות OpenAI Whisper
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col items-center justify-center py-8">
        {/* Recording Button */}
        <div className="relative mb-6">
          <motion.div
            className={`w-36 h-36 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 shadow-2xl'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-2xl'
            }`}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={
              isRecording
                ? {
                    boxShadow: [
                      '0 0 0 0 rgba(239, 68, 68, 0.7)',
                      '0 0 0 20px rgba(239, 68, 68, 0)',
                    ],
                  }
                : {}
            }
            transition={
              isRecording ? { boxShadow: { duration: 1.5, repeat: Infinity } } : {}
            }
          >
            {isRecording ? (
              <Square className="w-12 h-12 text-white" fill="white" />
            ) : (
              <Mic className="w-12 h-12 text-white" strokeWidth={2} />
            )}
          </motion.div>
        </div>

        {/* Timer */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-3xl font-bold text-red-600 mb-4"
            >
              {formatTime(timer)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform */}
        <AnimatePresence>
          {showWaveform && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-1 h-12 mb-4"
            >
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-indigo-600 to-purple-600 rounded-full"
                  animate={{
                    height: [
                      Math.random() * 30 + 10,
                      Math.random() * 50 + 10,
                      Math.random() * 30 + 10,
                    ],
                  }}
                  transition={{
                    duration: 0.5 + Math.random() * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-slate-600 text-center text-sm mb-4">
          {isRecording ? 'מקליט... לחץ לעצירה' : 'לחץ להתחלת הקלטה'}
        </p>

        {/* Upload */}
        {!isRecording && (
          <>
            <div className="flex items-center gap-4 my-4 w-full max-w-xs">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-500">או</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="w-full max-w-xs p-6 border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">העלה קובץ</p>
                <p className="text-xs text-slate-500">MP3, WAV, M4A</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </motion.div>
          </>
        )}
      </CardContent>
    </Card>
  );
}