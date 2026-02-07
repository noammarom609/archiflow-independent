import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

const STORAGE_KEY = 'archiflow_time_tracker';

export default function TimeTracker({ onComplete }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState('idle'); // idle | running | paused
  const [seconds, setSeconds] = useState(0);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectSelect, setShowProjectSelect] = useState(false);
  const intervalRef = useRef(null);

  // Fetch projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => archiflow.entities.Project.list(),
  });

  // Recovery from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { startTime, project, pausedSeconds } = JSON.parse(saved);
        if (startTime) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000) + (pausedSeconds || 0);
          setSeconds(elapsed);
          setSelectedProject(project);
          setStatus('running');
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status]);

  // Persist to localStorage
  useEffect(() => {
    if (status === 'running') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        startTime: Date.now() - (seconds * 1000),
        project: selectedProject,
        pausedSeconds: 0,
      }));
    } else if (status === 'paused') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        startTime: null,
        project: selectedProject,
        pausedSeconds: seconds,
      }));
    } else if (status === 'idle') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [status, seconds, selectedProject]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!selectedProject) {
      setShowProjectSelect(true);
      return;
    }
    setStatus('running');
  };

  const handleStartWithProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(project);
    setShowProjectSelect(false);
    setStatus('running');
  };

  const handlePauseResume = () => {
    setStatus(prev => prev === 'running' ? 'paused' : 'running');
  };

  const handleStop = () => {
    const currentSeconds = seconds;
    const currentProject = selectedProject;
    
    setStatus('idle');
    setSeconds(0);
    setSelectedProject(null);
    localStorage.removeItem(STORAGE_KEY);
    
    if (currentSeconds >= 60) { // At least 1 minute
      onComplete({
        duration_minutes: Math.ceil(currentSeconds / 60),
        project_id: currentProject?.id,
        project_name: currentProject?.name,
        source: 'timer',
      });
    } else if (currentSeconds > 0) {
      // Show message that minimum is 1 minute
      alert('הטיימר דורש לפחות דקה אחת של עבודה כדי לשמור דיווח');
    }
  };

  const handleCancel = () => {
    setStatus('idle');
    setSeconds(0);
    setSelectedProject(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (status === 'idle') {
    return (
      <Popover open={showProjectSelect} onOpenChange={setShowProjectSelect}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Play className="w-4 h-4" />
            טיימר
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end" dir="rtl">
          <div className="space-y-3">
            <p className="text-sm font-medium">בחר פרויקט להתחלה</p>
            <Select onValueChange={handleStartWithProject}>
              <SelectTrigger>
                <SelectValue placeholder="בחר פרויקט" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-primary/5 rounded-xl px-3 py-1.5 border border-primary/20">
      {/* Project badge */}
      {selectedProject && (
        <Badge variant="secondary" className="text-xs">
          {selectedProject.name}
        </Badge>
      )}

      {/* Timer display */}
      <div className="flex items-center gap-1.5">
        <Clock className={`w-4 h-4 ${status === 'running' ? 'text-green-500 animate-pulse' : 'text-yellow-500'}`} />
        <span className={`font-mono text-sm font-medium min-w-[70px] ${seconds < 60 ? 'text-orange-500' : 'text-foreground'}`}>
          {formatTime(seconds)}
        </span>
        {seconds > 0 && seconds < 60 && (
          <span className="text-[10px] text-orange-500">מינ׳ 1 דק׳</span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handlePauseResume}
          aria-label={status === 'running' ? t('a11y.pause') : t('a11y.play')}
        >
          {status === 'running' ? (
            <Pause className="w-3.5 h-3.5" aria-hidden />
          ) : (
            <Play className="w-3.5 h-3.5" aria-hidden />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleStop}
          aria-label={t('a11y.stop')}
        >
          <Square className="w-3.5 h-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  );
}