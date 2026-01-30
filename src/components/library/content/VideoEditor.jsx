import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Scissors,
  Plus,
  Trash2,
  Save,
  X,
  Check,
  Clock,
  Film,
  Download,
} from 'lucide-react';

export default function VideoEditor({ videoUrl, onSave, onCancel }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  // Trim points
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  
  // Segments (clips)
  const [segments, setSegments] = useState([]);
  const [activeSegment, setActiveSegment] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setTrimEnd(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value) => {
    const video = videoRef.current;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value) => {
    const video = videoRef.current;
    video.volume = value[0];
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (isMuted) {
      video.volume = volume || 1;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const skipBackward = () => {
    const video = videoRef.current;
    video.currentTime = Math.max(0, video.currentTime - 5);
  };

  const skipForward = () => {
    const video = videoRef.current;
    video.currentTime = Math.min(duration, video.currentTime + 5);
  };

  const setTrimStartPoint = () => {
    setTrimStart(currentTime);
  };

  const setTrimEndPoint = () => {
    setTrimEnd(currentTime);
  };

  const addSegment = () => {
    if (trimStart < trimEnd) {
      const newSegment = {
        id: Date.now(),
        start: trimStart,
        end: trimEnd,
        name: `מקטע ${segments.length + 1}`,
      };
      setSegments([...segments, newSegment]);
    }
  };

  const removeSegment = (id) => {
    setSegments(segments.filter(s => s.id !== id));
  };

  const jumpToSegment = (segment) => {
    const video = videoRef.current;
    video.currentTime = segment.start;
    setActiveSegment(segment.id);
  };

  const handleSave = () => {
    onSave({
      trimStart,
      trimEnd,
      segments,
      volume,
    });
  };

  const trimProgress = duration > 0 ? ((trimEnd - trimStart) / duration) * 100 : 100;

  return (
    <div className="flex flex-col h-full bg-background" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-medium flex items-center gap-2">
          <Film className="w-5 h-5" />
          עריכת סרטון
        </h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 ml-1" />
            ביטול
          </Button>
          <Button onClick={handleSave}>
            <Check className="w-4 h-4 ml-1" />
            שמור
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Video Preview */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            <video
              ref={videoRef}
              src={videoUrl}
              className="max-w-full max-h-full"
              onClick={togglePlay}
            />
          </div>

          {/* Controls */}
          <div className="p-4 bg-muted/30 space-y-3">
            {/* Timeline */}
            <div className="relative">
              {/* Trim markers visualization */}
              <div className="absolute inset-0 flex items-center pointer-events-none">
                <div 
                  className="absolute h-full bg-primary/20 rounded"
                  style={{
                    left: `${(trimStart / duration) * 100}%`,
                    width: `${((trimEnd - trimStart) / duration) * 100}%`,
                  }}
                />
              </div>
              <Slider
                value={[currentTime]}
                onValueChange={handleSeek}
                min={0}
                max={duration || 100}
                step={0.1}
                className="relative z-10"
              />
            </div>

            {/* Time Display */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="ghost" size="icon" onClick={skipBackward}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button 
                size="icon" 
                className="h-12 w-12 rounded-full"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 mr-[-2px]" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={skipForward}>
                <SkipForward className="w-5 h-5" />
              </Button>
              
              <div className="w-px h-8 bg-border mx-2" />
              
              <Button variant="ghost" size="icon" onClick={toggleMute}>
                {isMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
              <div className="w-24">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Editing Panel */}
        <div className="w-80 border-r overflow-y-auto">
          {/* Trim Section */}
          <div className="p-4 border-b">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Scissors className="w-4 h-4" />
              חיתוך סרטון
            </h4>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">התחלה</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      value={formatTime(trimStart)}
                      readOnly
                      className="text-center text-sm h-8"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={setTrimStartPoint}
                      title="קבע כנקודת התחלה"
                    >
                      <Clock className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">סיום</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      value={formatTime(trimEnd)}
                      readOnly
                      className="text-center text-sm h-8"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={setTrimEndPoint}
                      title="קבע כנקודת סיום"
                    >
                      <Clock className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-muted rounded-lg p-3 text-center">
                <p className="text-sm text-muted-foreground">משך לאחר חיתוך</p>
                <p className="text-lg font-bold">{formatTime(trimEnd - trimStart)}</p>
              </div>
            </div>
          </div>

          {/* Segments Section */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center gap-2">
                <Film className="w-4 h-4" />
                מקטעים שמורים
              </h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={addSegment}
                disabled={trimStart >= trimEnd}
              >
                <Plus className="w-3 h-3 ml-1" />
                הוסף
              </Button>
            </div>

            {segments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Scissors className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">אין מקטעים שמורים</p>
                <p className="text-xs mt-1">הגדר נקודות התחלה וסיום ולחץ "הוסף"</p>
              </div>
            ) : (
              <div className="space-y-2">
                {segments.map((segment, index) => (
                  <div
                    key={segment.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      activeSegment === segment.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => jumpToSegment(segment)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{segment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(segment.start)} - {formatTime(segment.end)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {formatTime(segment.end - segment.start)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSegment(segment.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export Info */}
          <div className="p-4 border-t">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800 text-center">
                💡 השינויים יישמרו כמטא-דאטה.
                <br />
                ייצוא סרטון ערוך יהיה זמין בקרוב.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}