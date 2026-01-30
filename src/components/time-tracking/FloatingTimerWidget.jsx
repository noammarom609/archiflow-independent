import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Pause } from 'lucide-react';

const STORAGE_KEY = 'archiflow_time_tracker';

export default function FloatingTimerWidget() {
  const [timerData, setTimerData] = useState(null);
  const [seconds, setSeconds] = useState(0);

  // Check localStorage for active timer
  useEffect(() => {
    const checkTimer = () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.startTime || data.pausedSeconds > 0) {
            setTimerData(data);
            if (data.startTime) {
              const elapsed = Math.floor((Date.now() - data.startTime) / 1000) + (data.pausedSeconds || 0);
              setSeconds(elapsed);
            } else {
              setSeconds(data.pausedSeconds || 0);
            }
          } else {
            setTimerData(null);
          }
        } catch (e) {
          setTimerData(null);
        }
      } else {
        setTimerData(null);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update seconds when timer is running
  useEffect(() => {
    if (timerData?.startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerData.startTime) / 1000) + (timerData.pausedSeconds || 0);
        setSeconds(elapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timerData]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isRunning = timerData?.startTime !== null && timerData?.startTime !== undefined;

  if (!timerData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-20 md:bottom-6 left-4 z-50"
      >
        <Link to={createPageUrl('TimeTracking')}>
          <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:scale-105">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm font-medium">{formatTime(seconds)}</span>
            {timerData.project?.name && (
              <span className="text-xs opacity-80 max-w-[100px] truncate hidden sm:inline">
                {timerData.project.name}
              </span>
            )}
          </div>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}