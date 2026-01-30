import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getCurrentUser } from '@/utils/authHelpers';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileAudio,
  Search,
  Upload,
  Mic,
  Play,
  Pause,
  Clock,
  Calendar,
  Users,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ListTodo,
  MessageSquare,
  ChevronRight,
  Filter,
  X,
  Sparkles,
  Send,
  Eye,
  FolderOpen
} from 'lucide-react';

import RecordingControls from '@/components/recordings/RecordingControls';
import LargeAudioProcessor from '@/components/audio/LargeAudioProcessor';
import { showSuccess, showError } from '@/components/utils/notifications';

const LARGE_FILE_THRESHOLD_MB = 24;

export default function MeetingSummaries() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('summaries');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [processingState, setProcessingState] = useState('idle'); // idle | processing | done
  const [largeFileProcessing, setLargeFileProcessing] = useState(null);
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);
  const [distributingRecording, setDistributingRecording] = useState(null);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(base44),
  });

  // Get architect context for multi-tenant filtering
  const myArchitectId = currentUser?.app_role === 'architect' ? currentUser?.id : currentUser?.architect_id;

  // Fetch recordings - filtered by user
  const { data: allRecordings = [], isLoading: loadingRecordings } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => base44.entities.Recording.list('-created_date', 100),
  });

  // Multi-tenant filter: show only user's recordings or recordings they're associated with
  const recordings = useMemo(() => {
    if (!currentUser) return [];
    return allRecordings.filter(r => 
      r.created_by === currentUser.email ||
      (myArchitectId && r.architect_id === myArchitectId)
    );
  }, [allRecordings, currentUser, myArchitectId]);

  // Fetch projects for filtering
  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('name'),
  });

  // Multi-tenant filter for projects
  const projects = useMemo(() => {
    if (!currentUser) return [];
    return allProjects.filter(p => 
      p.created_by === currentUser?.email || 
      (myArchitectId && p.architect_id === myArchitectId)
    );
  }, [allProjects, currentUser, myArchitectId]);

  // Create recording mutation
  const createRecordingMutation = useMutation({
    mutationFn: (data) => base44.entities.Recording.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    },
  });

  // Filter recordings
  const filteredRecordings = useMemo(() => {
    let result = recordings;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title?.toLowerCase().includes(query) ||
        r.analysis?.summary?.toLowerCase().includes(query) ||
        r.transcription?.toLowerCase().includes(query)
      );
    }

    // Project filter
    if (projectFilter !== 'all') {
      result = result.filter(r => r.project_id === projectFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    return result;
  }, [recordings, searchQuery, projectFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => ({
    total: recordings.length,
    analyzed: recordings.filter(r => r.status === 'analyzed' || r.status === 'distributed').length,
    distributed: recordings.filter(r => r.status === 'distributed').length,
    pending: recordings.filter(r => r.status === 'processing').length,
  }), [recordings]);

  // Handle recording completion from RecordingControls
  const handleRecordingComplete = async (audioFile, duration) => {
    const fileSizeMB = audioFile.size / 1024 / 1024;
    
    if (fileSizeMB > LARGE_FILE_THRESHOLD_MB) {
      setLargeFileProcessing({ file: audioFile, duration });
      setProcessingState('processing');
      return;
    }

    setProcessingState('processing');
    await processRecording(audioFile, duration);
  };

  // Process recording (upload, transcribe, analyze)
  const processRecording = async (audioFile, duration) => {
    try {
      // Upload file
      showSuccess('מעלה את ההקלטה...');
      const uploadResult = await base44.integrations.Core.UploadFile({ file: audioFile });
      const file_url = uploadResult.file_url;

      // Create recording record
      const recording = await createRecordingMutation.mutateAsync({
        title: `סיכום פגישה ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}`,
        audio_url: file_url,
        duration: duration,
        status: 'processing',
        transcription: '',
        analysis: null,
        architect_id: myArchitectId,
      });

      // Transcribe
      showSuccess('מתמלל את ההקלטה...');
      const transcribeResult = await base44.functions.invoke('transcribeLargeAudio', { audio_url: file_url });
      
      if (!transcribeResult.data?.transcription) {
        throw new Error('התמלול נכשל');
      }

      const transcription = transcribeResult.data.transcription;

      // Analyze
      showSuccess('מנתח את התוכן...');
      const analysisResult = await runAnalysis(transcription);

      // Update recording
      await base44.entities.Recording.update(recording.id, {
        transcription: transcription,
        analysis: analysisResult.analysis,
        deep_analysis: analysisResult.deepAnalysis,
        status: 'analyzed',
      });

      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      setProcessingState('done');
      showSuccess('ההקלטה נותחה בהצלחה!');
      setShowUploadDialog(false);

    } catch (error) {
      console.error('Recording processing error:', error);
      showError('שגיאה בעיבוד ההקלטה: ' + error.message);
      setProcessingState('idle');
    }
  };

  // Run AI analysis
  const runAnalysis = async (transcription) => {
    const basicPrompt = `נא לנתח את התמלול הבא של פגישה ולחלץ מידע:

תמלול: "${transcription}"

חלץ:
1. סיכום קצר (2-3 משפטים)
2. משימות שהוזכרו
3. החלטות שהתקבלו
4. תאריכים או דדליינים
5. נושאים מרכזיים

החזר JSON מובנה בעברית.`;

    const deepPrompt = `בצע ניתוח מעמיק של התמלול הבא:

תמלול: "${transcription}"

חלץ:
1. אנשים שהוזכרו (שם, תפקיד משוער)
2. פרויקטים שהוזכרו
3. action items מפורטים (משימה, אחראי, דדליין, עדיפות)

החזר JSON מובנה.`;

    const [basicResult, deepResult] = await Promise.allSettled([
      base44.integrations.Core.InvokeLLM({
        prompt: basicPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            tasks: { type: 'array', items: { type: 'string' } },
            decisions: { type: 'array', items: { type: 'string' } },
            dates: { type: 'array', items: { type: 'string' } },
            topics: { type: 'array', items: { type: 'string' } },
          },
          required: ['summary']
        },
      }),
      base44.integrations.Core.InvokeLLM({
        prompt: deepPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            people_mentioned: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' } } } },
            projects_identified: { type: 'array', items: { type: 'object', properties: { project_name: { type: 'string' } } } },
            action_items: { type: 'array', items: { type: 'object', properties: { task: { type: 'string' }, assignee: { type: 'string' }, deadline: { type: 'string' }, priority: { type: 'string' } } } }
          }
        },
      }),
    ]);

    return {
      analysis: basicResult.status === 'fulfilled' ? basicResult.value : {},
      deepAnalysis: deepResult.status === 'fulfilled' ? deepResult.value : {},
    };
  };

  // Handle large file processing completion
  const handleLargeFileComplete = async (result) => {
    const file = largeFileProcessing?.file;
    const duration = largeFileProcessing?.duration || '00:00';
    setLargeFileProcessing(null);
    
    try {
      let audio_url = '';
      try {
        const uploadResult = await base44.integrations.Core.UploadFile({ file });
        audio_url = uploadResult.file_url;
      } catch (e) {
        console.warn('Could not upload original file');
      }

      // Create recording with transcription
      const recording = await createRecordingMutation.mutateAsync({
        title: `סיכום פגישה ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}`,
        audio_url: audio_url,
        duration: duration,
        status: 'processing',
        transcription: result.transcription,
        architect_id: myArchitectId,
      });

      // Analyze
      showSuccess('מנתח את התוכן...');
      const analysisResult = await runAnalysis(result.transcription);

      // Update
      await base44.entities.Recording.update(recording.id, {
        analysis: analysisResult.analysis,
        deep_analysis: analysisResult.deepAnalysis,
        status: 'analyzed',
      });

      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      setProcessingState('done');
      showSuccess('ההקלטה נותחה בהצלחה!');
      setShowUploadDialog(false);

    } catch (error) {
      showError('שגיאה: ' + error.message);
      setProcessingState('idle');
    }
  };

  // Handle distribution
  const handleDistribute = async (recording, selections) => {
    try {
      showSuccess('מפזר את הנתונים...');
      
      const result = await base44.functions.invoke('distributeRecordingDataV2', {
        recording: recording,
        selections: selections,
      });

      await base44.entities.Recording.update(recording.id, {
        status: 'distributed',
        distribution_log: [
          ...(recording.distribution_log || []),
          {
            date: new Date().toISOString(),
            selections: selections,
            result: result.data?.summary
          }
        ]
      });

      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      showSuccess('הנתונים פוזרו בהצלחה!');
      setShowDistributeDialog(false);
      setDistributingRecording(null);

    } catch (error) {
      showError('שגיאה בפיזור: ' + error.message);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setProjectFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery || projectFilter !== 'all' || statusFilter !== 'all';

  // Handle summarizing an existing recording that wasn't analyzed yet
  const handleSummarizeRecording = async (recording) => {
    if (!recording.transcription) {
      showError('אין תמלול להקלטה זו');
      return;
    }

    try {
      showSuccess('מנתח את התוכן...');
      
      const analysisResult = await runAnalysis(recording.transcription);

      await base44.entities.Recording.update(recording.id, {
        analysis: analysisResult.analysis,
        deep_analysis: analysisResult.deepAnalysis,
        status: 'analyzed',
      });

      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      showSuccess('ההקלטה נותחה בהצלחה!');

    } catch (error) {
      console.error('Summarize error:', error);
      showError('שגיאה בניתוח: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <PageHeader
          title="סיכומי פגישות"
          subtitle="העלה הקלטות, קבל סיכומים ופזר משימות אוטומטית"
          icon={FileAudio}
        >
          <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
            <Upload className="w-4 h-4" />
            העלאת הקלטה
          </Button>
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">סה"כ הקלטות</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileAudio className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">נותחו</p>
                  <p className="text-2xl font-bold">{stats.analyzed}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">פוזרו</p>
                  <p className="text-2xl font-bold">{stats.distributed}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">בעיבוד</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Loader2 className={`w-5 h-5 text-amber-600 ${stats.pending > 0 ? 'animate-spin' : ''}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש בסיכומים..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Project Filter */}
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <Briefcase className="w-4 h-4 ml-2 text-muted-foreground" />
                  <SelectValue placeholder="כל הפרויקטים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הפרויקטים</SelectItem>
                  {projects
                    .filter(project => project.id)
                    .map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="analyzed">נותח</SelectItem>
                  <SelectItem value="distributed">פוזר</SelectItem>
                  <SelectItem value="processing">בעיבוד</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 ml-1" />
                  נקה
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recordings List */}
        <Card>
          <CardContent className="p-0">
            {loadingRecordings ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredRecordings.length === 0 ? (
              <div className="p-12 text-center">
                <FileAudio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">
                  {recordings.length === 0 ? 'אין הקלטות עדיין' : 'לא נמצאו תוצאות'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {recordings.length === 0 
                    ? 'העלה הקלטה ראשונה כדי לקבל סיכום אוטומטי'
                    : 'נסה לשנות את הפילטרים'}
                </p>
                {recordings.length === 0 && (
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="w-4 h-4 ml-2" />
                    העלאת הקלטה
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {filteredRecordings.map((recording) => (
                  <RecordingRow
                    key={recording.id}
                    recording={recording}
                    onView={() => setSelectedRecording(recording)}
                    onDistribute={() => {
                      setDistributingRecording(recording);
                      setShowDistributeDialog(true);
                    }}
                    onSummarize={() => handleSummarizeRecording(recording)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                העלאת הקלטה חדשה
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              {largeFileProcessing ? (
                <LargeAudioProcessor
                  file={largeFileProcessing.file}
                  onComplete={handleLargeFileComplete}
                  onError={(err) => {
                    showError(err);
                    setLargeFileProcessing(null);
                    setProcessingState('idle');
                  }}
                  onCancel={() => {
                    setLargeFileProcessing(null);
                    setProcessingState('idle');
                  }}
                />
              ) : processingState === 'processing' ? (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-lg font-medium">מעבד את ההקלטה...</p>
                  <p className="text-sm text-muted-foreground">זה עשוי לקחת כמה דקות</p>
                </div>
              ) : (
                <RecordingControls onRecordingComplete={handleRecordingComplete} />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* View Recording Dialog */}
        <RecordingViewDialog
          recording={selectedRecording}
          isOpen={!!selectedRecording}
          onClose={() => setSelectedRecording(null)}
          onDistribute={() => {
            setDistributingRecording(selectedRecording);
            setShowDistributeDialog(true);
            setSelectedRecording(null);
          }}
        />

        {/* Distribute Dialog */}
        <DistributeDialog
          recording={distributingRecording}
          isOpen={showDistributeDialog}
          onClose={() => {
            setShowDistributeDialog(false);
            setDistributingRecording(null);
          }}
          onDistribute={handleDistribute}
          projects={projects}
        />
      </div>
    </div>
  );
}

// Recording Row Component
function RecordingRow({ recording, onView, onDistribute, onSummarize }) {
  const getStatusBadge = (status) => {
    const statusConfig = {
      analyzed: { label: 'נותח', variant: 'default', className: 'bg-green-100 text-green-700' },
      distributed: { label: 'פוזר', variant: 'default', className: 'bg-purple-100 text-purple-700' },
      processing: { label: 'בעיבוד', variant: 'default', className: 'bg-amber-100 text-amber-700' },
      failed: { label: 'נכשל', variant: 'destructive', className: '' },
    };
    const config = statusConfig[status] || { label: status, variant: 'outline', className: '' };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group"
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileAudio className="w-5 h-5 text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{recording.title}</h3>
            {getStatusBadge(recording.status)}
          </div>
          {recording.analysis?.summary && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {recording.analysis.summary}
            </p>
          )}
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(recording.created_date), 'dd/MM/yyyy', { locale: he })}
            </span>
            {recording.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recording.duration}
              </span>
            )}
            {recording.analysis?.tasks?.length > 0 && (
              <span className="flex items-center gap-1">
                <ListTodo className="w-3 h-3" />
                {recording.analysis.tasks.length} משימות
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onView}>
                <Eye className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>צפייה</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {recording.status === 'processing' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onSummarize} className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  סכם
                </Button>
              </TooltipTrigger>
              <TooltipContent>נתח וסכם את ההקלטה</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {recording.status === 'analyzed' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onDistribute} className="gap-1">
                  <Send className="w-3 h-3" />
                  פיזור
                </Button>
              </TooltipTrigger>
              <TooltipContent>פזר משימות ונתונים</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </motion.div>
  );
}

// Recording View Dialog
function RecordingViewDialog({ recording, isOpen, onClose, onDistribute }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!recording) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileAudio className="w-5 h-5 text-primary" />
            {recording.title}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">סיכום</TabsTrigger>
            <TabsTrigger value="tasks">משימות</TabsTrigger>
            <TabsTrigger value="transcription">תמלול</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] mt-4">
            <TabsContent value="summary" className="space-y-4">
              {/* Summary */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    סיכום
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {recording.analysis?.summary || 'אין סיכום זמין'}
                  </p>
                </CardContent>
              </Card>

              {/* Topics */}
              {recording.analysis?.topics?.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">נושאים מרכזיים</h4>
                    <div className="flex flex-wrap gap-2">
                      {recording.analysis.topics.map((topic, i) => (
                        <Badge key={i} variant="outline">{topic}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Decisions */}
              {recording.analysis?.decisions?.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">החלטות</h4>
                    <ul className="space-y-2">
                      {recording.analysis.decisions.map((decision, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {decision}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              {recording.analysis?.tasks?.length > 0 ? (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">משימות שזוהו</h4>
                    <ul className="space-y-3">
                      {recording.analysis.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                          <ListTodo className="w-4 h-4 text-primary mt-0.5" />
                          <span className="text-sm">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>לא זוהו משימות</p>
                </div>
              )}

              {/* Action Items from deep analysis */}
              {recording.deep_analysis?.action_items?.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">פריטי פעולה מפורטים</h4>
                    <div className="space-y-3">
                      {recording.deep_analysis.action_items.map((item, i) => (
                        <div key={i} className="p-3 border rounded-lg">
                          <p className="font-medium text-sm">{item.task}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {item.assignee && <span>אחראי: {item.assignee}</span>}
                            {item.deadline && <span>דדליין: {item.deadline}</span>}
                            {item.priority && (
                              <Badge variant="outline" className="text-xs">
                                {item.priority === 'high' || item.priority === 'urgent' ? 'דחוף' : 
                                 item.priority === 'medium' ? 'רגיל' : 'נמוך'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="transcription">
              <Card>
                <CardContent className="p-4">
                  {recording.audio_url && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <audio controls className="w-full">
                        <source src={recording.audio_url} />
                      </audio>
                    </div>
                  )}
                  <h4 className="font-medium mb-2">תמלול מלא</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {recording.transcription || 'אין תמלול זמין'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>סגור</Button>
          {recording.status === 'analyzed' && (
            <Button onClick={onDistribute} className="gap-2">
              <Send className="w-4 h-4" />
              פזר משימות
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Distribute Dialog
function DistributeDialog({ recording, isOpen, onClose, onDistribute, projects }) {
  const [selections, setSelections] = useState({
    createTasks: true,
    updateProject: false,
    sendEmail: false,
    createJournalEntry: true,
    selectedProjectId: '',
  });

  if (!recording) return null;

  const handleSubmit = () => {
    onDistribute(recording, selections);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            פיזור נתונים מהסיכום
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            בחר מה לעשות עם הנתונים שחולצו מההקלטה:
          </p>

          {/* Project Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">שייך לפרויקט</label>
            <Select 
              value={selections.selectedProjectId || 'none'} 
              onValueChange={(v) => setSelections(s => ({ ...s, selectedProjectId: v === 'none' ? '' : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר פרויקט" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא פרויקט</SelectItem>
                {projects
                  .filter(p => p.id)
                  .map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
              <input
                type="checkbox"
                checked={selections.createTasks}
                onChange={(e) => setSelections(s => ({ ...s, createTasks: e.target.checked }))}
                className="rounded"
              />
              <div>
                <p className="text-sm font-medium">יצירת משימות</p>
                <p className="text-xs text-muted-foreground">
                  {recording.analysis?.tasks?.length || 0} משימות זוהו
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
              <input
                type="checkbox"
                checked={selections.createJournalEntry}
                onChange={(e) => setSelections(s => ({ ...s, createJournalEntry: e.target.checked }))}
                className="rounded"
              />
              <div>
                <p className="text-sm font-medium">יצירת רשומת יומן</p>
                <p className="text-xs text-muted-foreground">שמירת הסיכום ביומן הפרויקט</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
              <input
                type="checkbox"
                checked={selections.sendEmail}
                onChange={(e) => setSelections(s => ({ ...s, sendEmail: e.target.checked }))}
                className="rounded"
              />
              <div>
                <p className="text-sm font-medium">שליחת סיכום במייל</p>
                <p className="text-xs text-muted-foreground">שליחה לצוות הפרויקט</p>
              </div>
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Send className="w-4 h-4" />
            פזר
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}