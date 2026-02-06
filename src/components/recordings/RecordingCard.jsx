import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  Share2,
  FileText,
  Sparkles,
  Calendar,
  Mic,
  FolderOpen,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { formatDurationDisplay } from '@/utils/duration';

const statusConfig = {
  analyzed: {
    label: 'מנותח',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600'
  },
  distributed: {
    label: 'פוזר למערכת',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Share2,
    iconColor: 'text-purple-600'
  },
  completed: {
    label: 'הושלם',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle2,
    iconColor: 'text-blue-600'
  },
  processing: {
    label: 'מעבד',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Loader2,
    iconColor: 'text-amber-600',
    animate: true
  },
  failed: {
    label: 'נכשל',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600'
  }
};

export default function RecordingCard({
  recording,
  folders = [],
  onView,
  onEdit,
  onDelete,
  onMoveToFolder,
  onPlay,
  index = 0
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  const status = statusConfig[recording.status] || statusConfig.processing;
  const StatusIcon = status.icon;
  const folder = folders.find(f => f.id === recording.folder_id);

  // Calculate quality score display
  const qualityScore = recording.quality_score ?? null;
  const flaggedCount = recording.flagged_count || 
    (recording.analysis?.flagged_segments?.length) || 0;

  // Parse duration
  const parseDuration = (duration) => {
    if (!duration || duration === '--:--') return null;
    const parts = duration.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0]);
      const secs = parseInt(parts[1]);
      return mins > 0 ? `${mins} דקות` : `${secs} שניות`;
    }
    return duration;
  };

  const handlePlayPause = () => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.pause();
      } else {
        audioRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Get summary preview
  const summaryPreview = recording.analysis?.summary?.substring(0, 120);
  const hasAnalysis = recording.analysis && recording.status !== 'failed';
  const hasTasks = recording.analysis?.tasks?.length > 0;
  const hasTopics = recording.analysis?.topics?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`
        border-slate-200 hover:shadow-lg transition-all duration-300 overflow-hidden
        ${recording.status === 'failed' ? 'border-red-200 bg-red-50/30' : ''}
        ${recording.status === 'processing' ? 'border-amber-200' : ''}
      `}>
        <CardContent className="p-0">
          {/* Main Content */}
          <div className="p-4">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Recording Icon */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${recording.status === 'failed' ? 'bg-red-100' : 
                    recording.status === 'processing' ? 'bg-amber-100' : 
                    'bg-gradient-to-br from-indigo-100 to-purple-100'}
                `}>
                  {recording.status === 'processing' ? (
                    <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                  ) : recording.status === 'failed' ? (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  ) : (
                    <Mic className="w-6 h-6 text-indigo-600" />
                  )}
                </div>

                {/* Title & Meta */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate mb-1">
                    {recording.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(recording.created_date), 'dd/MM/yy HH:mm', { locale: he })}
                    </span>
                    {(recording.duration != null && formatDurationDisplay(recording.duration) !== '--:--') && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDurationDisplay(recording.duration)}
                      </span>
                    )}
                    {folder && (
                      <span className="flex items-center gap-1 text-indigo-600">
                        <FolderOpen className="w-3 h-3" />
                        {folder.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <Badge className={`${status.color} border flex items-center gap-1 flex-shrink-0`}>
                <StatusIcon className={`w-3 h-3 ${status.iconColor} ${status.animate ? 'animate-spin' : ''}`} />
                {status.label}
              </Badge>
            </div>

            {/* Quality & Flags Indicators */}
            {(qualityScore !== null || flaggedCount > 0) && recording.status !== 'failed' && (
              <div className="flex items-center gap-3 mb-3 p-2 bg-slate-50 rounded-lg">
                {qualityScore !== null && (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-slate-600">איכות תמלול:</span>
                    <Progress 
                      value={qualityScore} 
                      className={`h-2 flex-1 max-w-[100px] ${
                        qualityScore >= 80 ? '[&>div]:bg-emerald-500' :
                        qualityScore >= 50 ? '[&>div]:bg-amber-500' :
                        '[&>div]:bg-red-500'
                      }`}
                    />
                    <span className={`text-xs font-medium ${
                      qualityScore >= 80 ? 'text-emerald-600' :
                      qualityScore >= 50 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {Math.round(qualityScore)}%
                    </span>
                  </div>
                )}
                {flaggedCount > 0 && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <AlertTriangle className="w-3 h-3 ml-1" />
                    {flaggedCount} קטעים לבדיקה
                  </Badge>
                )}
              </div>
            )}

            {/* Error Message */}
            {recording.status === 'failed' && recording.error_message && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {recording.error_message}
                </p>
              </div>
            )}

            {/* Summary Preview */}
            {summaryPreview && (
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                {summaryPreview}...
              </p>
            )}

            {/* Topics Tags */}
            {hasTopics && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {recording.analysis.topics.slice(0, 4).map((topic, idx) => (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700"
                  >
                    {topic}
                  </Badge>
                ))}
                {recording.analysis.topics.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{recording.analysis.topics.length - 4}
                  </Badge>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {/* Play Button */}
                {recording.audio_url && (
                  <>
                    <audio
                      ref={setAudioRef}
                      src={recording.audio_url}
                      onEnded={handleAudioEnded}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePlayPause}
                      className="gap-1"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          עצור
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          נגן
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* View Analysis */}
                {hasAnalysis && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView?.(recording)}
                    className="gap-1"
                  >
                    <Sparkles className="w-4 h-4" />
                    ניתוח
                  </Button>
                )}

                {/* View Transcription */}
                {recording.transcription && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    תמלול
                    {showDetails ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit?.(recording)}
                  className="h-8 w-8"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete?.(recording)}
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Expandable Transcription */}
          {showDetails && recording.transcription && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-100"
            >
              <div className="p-4 bg-slate-50 max-h-48 overflow-y-auto">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {recording.transcription}
                </p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}