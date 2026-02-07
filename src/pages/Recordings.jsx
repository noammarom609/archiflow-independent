import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import { getCurrentUser } from '@/utils/authHelpers';
import { useAuth } from '@/lib/AuthContext';
import { format, parseISO, isAfter, startOfToday } from 'date-fns';
import { he } from 'date-fns/locale';

import PageHeader from '@/components/layout/PageHeader';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { ErrorBoundary, WidgetErrorState } from '@/components/ui/error-boundary';
import { EmptyState } from '@/components/ui/empty-state';
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
  Clock,
  Calendar,
  Briefcase,
  CheckCircle2,
  Loader2,
  ListTodo,
  MessageSquare,
  X,
  Sparkles,
  Send,
  Eye,
  CalendarPlus,
  MapPin,
  Users,
  Plus,
} from 'lucide-react';

import RecordingControls from '@/components/recordings/RecordingControls';
import LargeAudioProcessor from '@/components/audio/LargeAudioProcessor';
import AnalysisResults from '@/components/recordings/AnalysisResults';
import AddEventDialog from '@/components/calendar/AddEventDialog';
import { showSuccess, showError } from '@/components/utils/notifications';
import { parseDurationToSeconds, formatDurationDisplay } from '@/utils/duration';

const LARGE_FILE_THRESHOLD_MB = 24;

export default function Recordings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summaries');

  // When arriving with ?tab=record (e.g. from Dashboard "הקלטת פגישה"), open the recording tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'record') {
      setActiveTab('record');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecording, setSelectedRecording] = useState(null);

  // Recording / analysis state
  const [analysisState, setAnalysisState] = useState('empty');
  const [currentRecording, setCurrentRecording] = useState(null);
  const [largeFileProcessing, setLargeFileProcessing] = useState(null);

  // Meeting scheduling
  const [showAddMeeting, setShowAddMeeting] = useState(false);

  // Distribution
  const [showDistributeDialog, setShowDistributeDialog] = useState(false);
  const [distributingRecording, setDistributingRecording] = useState(null);

  // ── Data queries ──
  const myArchitectId = user?.app_role === 'architect' ? user?.id : user?.architect_id;
  const isSuperAdmin = user?.app_role === 'super_admin';

  const { data: allRecordings = [], isLoading: loadingRecordings } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => archiflow.entities.Recording.list('-created_date', 100),
    enabled: !!user,
  });

  const recordings = useMemo(() => {
    if (!user) return [];
    if (isSuperAdmin) return allRecordings;
    return allRecordings.filter(r =>
      r.created_by === user.email ||
      (myArchitectId && r.architect_id === myArchitectId)
    );
  }, [allRecordings, user, myArchitectId, isSuperAdmin]);

  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => archiflow.entities.Project.list('name'),
    enabled: !!user,
  });

  const projects = useMemo(() => {
    if (!user) return [];
    if (isSuperAdmin) return allProjects;
    return allProjects.filter(p =>
      p.created_by === user?.email ||
      (myArchitectId && p.architect_id === myArchitectId)
    );
  }, [allProjects, user, myArchitectId, isSuperAdmin]);

  const { data: calendarEvents = [], isLoading: loadingMeetings } = useQuery({
    queryKey: ['calendarEvents', 'meetings'],
    queryFn: () => archiflow.entities.CalendarEvent.list('-start_date', 50),
    enabled: !!user,
  });

  const upcomingMeetings = useMemo(() => {
    const today = startOfToday();
    return calendarEvents
      .filter(e => e.event_type === 'meeting' && e.start_date && isAfter(parseISO(e.start_date), today))
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(0, 10);
  }, [calendarEvents]);

  const recentMeetings = useMemo(() => {
    const today = startOfToday();
    return calendarEvents
      .filter(e => e.event_type === 'meeting' && e.start_date && !isAfter(parseISO(e.start_date), today))
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
      .slice(0, 10);
  }, [calendarEvents]);

  // ── Mutations ──
  const createRecordingMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Recording.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recordings'] }),
  });

  // ── Filters ──
  const filteredRecordings = useMemo(() => {
    let result = recordings;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.title?.toLowerCase().includes(q) ||
        r.analysis?.summary?.toLowerCase().includes(q) ||
        r.transcription?.toLowerCase().includes(q)
      );
    }
    if (projectFilter !== 'all') result = result.filter(r => r.project_id === projectFilter);
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
    return result;
  }, [recordings, searchQuery, projectFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: recordings.length,
    analyzed: recordings.filter(r => r.status === 'analyzed' || r.status === 'distributed').length,
    distributed: recordings.filter(r => r.status === 'distributed').length,
    pending: recordings.filter(r => r.status === 'processing').length,
  }), [recordings]);

  const hasActiveFilters = searchQuery || projectFilter !== 'all' || statusFilter !== 'all';

  // ── Recording handlers ──
  const handleRecordingComplete = async (audioFile, duration) => {
    const fileSizeMB = audioFile.size / 1024 / 1024;
    if (fileSizeMB > LARGE_FILE_THRESHOLD_MB) {
      setLargeFileProcessing({ file: audioFile, duration });
      setAnalysisState('processing');
      return;
    }
    setAnalysisState('processing');
    await processRecording(audioFile, duration);
  };

  const processRecording = async (audioFile, duration) => {
    try {
      showSuccess('מעלה את ההקלטה...');
      const uploadResult = await archiflow.integrations.Core.UploadFile({ file: audioFile });
      const file_url = uploadResult.file_url;

      const recording = await createRecordingMutation.mutateAsync({
        title: `הקלטת פגישה ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}`,
        audio_url: file_url,
        duration: parseDurationToSeconds(duration ?? '0'),
        status: 'processing',
        transcription: '',
        analysis: null,
        created_by: user?.email ?? null,
        architect_email: user?.email ?? null,
      });

      showSuccess('מתמלל את ההקלטה...');
      const transcribeResult = await archiflow.functions.invoke('transcribeLargeAudio', { audio_url: file_url });
      if (!transcribeResult.data?.transcription) throw new Error('התמלול נכשל');
      const transcription = transcribeResult.data.transcription;

      showSuccess('מנתח את התוכן...');
      const analysisResult = await runAnalysis(transcription);

      await archiflow.entities.Recording.update(recording.id, {
        transcription,
        analysis: analysisResult.analysis,
        deep_analysis: analysisResult.deepAnalysis,
        status: 'analyzed',
      });

      setCurrentRecording({
        ...recording,
        transcription,
        analysis: analysisResult.analysis,
        deep_analysis: analysisResult.deepAnalysis,
        status: 'analyzed',
      });
      setAnalysisState('results');
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      showSuccess('ההקלטה נותחה בהצלחה!');
    } catch (error) {
      console.error('Recording processing error:', error);
      const detail = error?.details ?? error?.hint ?? error?.message ?? String(error);
      showError('שגיאה בעיבוד ההקלטה: ' + detail);
      setAnalysisState('empty');
    }
  };

  const runAnalysis = async (transcription) => {
    const basicPrompt = `נא לנתח את התמלול הבא של פגישה ולחלץ מידע:\n\nתמלול: "${transcription}"\n\nחלץ:\n1. סיכום קצר (2-3 משפטים)\n2. משימות שהוזכרו\n3. החלטות שהתקבלו\n4. תאריכים או דדליינים\n5. נושאים מרכזיים\n\nהחזר JSON מובנה בעברית.`;
    const deepPrompt = `בצע ניתוח מעמיק של התמלול הבא:\n\nתמלול: "${transcription}"\n\nחלץ:\n1. אנשים שהוזכרו (שם, תפקיד משוער)\n2. פרויקטים שהוזכרו\n3. action items מפורטים (משימה, אחראי, דדליין, עדיפות)\n\nהחזר JSON מובנה.`;

    const [basicResult, deepResult] = await Promise.allSettled([
      archiflow.integrations.Core.InvokeLLM({
        prompt: basicPrompt,
        response_json_schema: { type: 'object', properties: { summary: { type: 'string' }, tasks: { type: 'array', items: { type: 'string' } }, decisions: { type: 'array', items: { type: 'string' } }, dates: { type: 'array', items: { type: 'string' } }, topics: { type: 'array', items: { type: 'string' } } }, required: ['summary'] },
      }),
      archiflow.integrations.Core.InvokeLLM({
        prompt: deepPrompt,
        response_json_schema: { type: 'object', properties: { people_mentioned: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' } } } }, projects_identified: { type: 'array', items: { type: 'object', properties: { project_name: { type: 'string' } } } }, action_items: { type: 'array', items: { type: 'object', properties: { task: { type: 'string' }, assignee: { type: 'string' }, deadline: { type: 'string' }, priority: { type: 'string' } } } } } },
      }),
    ]);

    return {
      analysis: basicResult.status === 'fulfilled' ? basicResult.value : {},
      deepAnalysis: deepResult.status === 'fulfilled' ? deepResult.value : {},
    };
  };

  const handleLargeFileComplete = async (result) => {
    const file = largeFileProcessing?.file;
    const duration = largeFileProcessing?.duration || '00:00';
    setLargeFileProcessing(null);
    try {
      let audio_url = '';
      try {
        const uploadResult = await archiflow.integrations.Core.UploadFile({ file });
        audio_url = uploadResult.file_url;
      } catch { /* optional */ }

      const recording = await createRecordingMutation.mutateAsync({
        title: `הקלטת פגישה ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: he })}`,
        audio_url,
        duration: parseDurationToSeconds(duration || '0'),
        status: 'processing',
        transcription: result.transcription,
        analysis: null,
        created_by: user?.email ?? null,
        architect_email: user?.email ?? null,
      });

      showSuccess('מנתח את התוכן...');
      const analysisResult = await runAnalysis(result.transcription);
      await archiflow.entities.Recording.update(recording.id, { analysis: analysisResult.analysis, deep_analysis: analysisResult.deepAnalysis, status: 'analyzed' });

      setCurrentRecording({ ...recording, transcription: result.transcription, analysis: analysisResult.analysis, deep_analysis: analysisResult.deepAnalysis, status: 'analyzed' });
      setAnalysisState('results');
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      showSuccess('ההקלטה נותחה בהצלחה!');
    } catch (error) {
      console.error('Recording processing error (large file):', error);
      const detail = error?.details ?? error?.hint ?? error?.message ?? String(error);
      showError('שגיאה בעיבוד ההקלטה: ' + detail);
      setAnalysisState('empty');
    }
  };

  const handleApprove = async (approvalData) => {
    try {
      const result = await archiflow.functions.invoke('distributeRecordingDataV2', {
        recording: approvalData.recording, selections: approvalData.selections,
        clientData: approvalData.clientData, projectData: approvalData.projectData,
        tasks: approvalData.tasks, journal: approvalData.journal,
        email: approvalData.email, changedFields: approvalData.changedFields,
      });
      const summary = result.data?.summary || {};
      const messages = [];
      if (summary.client_updated) messages.push('לקוח עודכן');
      if (summary.project_updated) messages.push('פרויקט עודכן');
      if (summary.tasks_created > 0) messages.push(`${summary.tasks_created} משימות נוצרו`);
      if (summary.journal_created) messages.push('רשומת יומן נוצרה');
      if (summary.email_sent) messages.push('מייל נשלח');
      showSuccess(`הצלחה! ${messages.join(', ')}`);
      setAnalysisState('empty');
      setCurrentRecording(null);
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    } catch (error) {
      showError('שגיאה בפיזור הנתונים: ' + error.message);
    }
  };

  const handleDistribute = async (recording, selections) => {
    try {
      showSuccess('מפזר את הנתונים...');
      const result = await archiflow.functions.invoke('distributeRecordingDataV2', { recording, selections });
      await archiflow.entities.Recording.update(recording.id, {
        status: 'distributed',
        distribution_log: [...(recording.distribution_log || []), { date: new Date().toISOString(), selections, result: result.data?.summary }],
      });
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      showSuccess('הנתונים פוזרו בהצלחה!');
      setShowDistributeDialog(false);
      setDistributingRecording(null);
    } catch (error) {
      showError('שגיאה בפיזור: ' + error.message);
    }
  };

  const handleSummarizeRecording = async (recording) => {
    if (!recording.transcription) { showError('אין תמלול להקלטה זו'); return; }
    try {
      showSuccess('מנתח את התוכן...');
      const analysisResult = await runAnalysis(recording.transcription);
      await archiflow.entities.Recording.update(recording.id, { analysis: analysisResult.analysis, deep_analysis: analysisResult.deepAnalysis, status: 'analyzed' });
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      showSuccess('ההקלטה נותחה בהצלחה!');
    } catch (error) {
      showError('שגיאה בניתוח: ' + error.message);
    }
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-background p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="ניהול והקלטת פגישות"
          subtitle="הקלט, תמלל ונתח פגישות עם AI — ופזר משימות אוטומטית"
          icon={FileAudio}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowAddMeeting(true)} className="gap-2">
              <CalendarPlus className="w-4 h-4" />
              קבע פגישה
            </Button>
            <Button onClick={() => setActiveTab('record')} className="gap-2">
              <Mic className="w-4 h-4" />
              הקלטה חדשה
            </Button>
          </div>
        </PageHeader>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">סה״כ הקלטות</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileAudio className="w-5 h-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">נותחו</p>
                <p className="text-2xl font-bold">{stats.analyzed}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">פוזרו</p>
                <p className="text-2xl font-bold">{stats.distributed}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-secondary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">פגישות קרובות</p>
                <p className="text-2xl font-bold">{upcomingMeetings.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summaries" className="gap-2">
              <FileAudio className="w-4 h-4" />
              סיכומי פגישות
            </TabsTrigger>
            <TabsTrigger value="record" className="gap-2">
              <Mic className="w-4 h-4" />
              הקלטה וניתוח
            </TabsTrigger>
            <TabsTrigger value="meetings" className="gap-2">
              <Calendar className="w-4 h-4" />
              פגישות
            </TabsTrigger>
          </TabsList>

          {/* ── Tab 1: Summaries (recordings list) ── */}
          <TabsContent value="summaries" className="space-y-4 mt-4">
            <ErrorBoundary fallbackTitle="שגיאה בטעינת סיכומי פגישות">
              {/* Filters */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="חיפוש בסיכומים..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pe-10" />
                    </div>
                    <Select value={projectFilter} onValueChange={setProjectFilter}>
                      <SelectTrigger className="w-[180px]"><Briefcase className="w-4 h-4 ms-2 text-muted-foreground" /><SelectValue placeholder="כל הפרויקטים" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">כל הפרויקטים</SelectItem>
                        {projects.filter(p => p.id).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]"><SelectValue placeholder="סטטוס" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">הכל</SelectItem>
                        <SelectItem value="analyzed">נותח</SelectItem>
                        <SelectItem value="distributed">פוזר</SelectItem>
                        <SelectItem value="processing">בעיבוד</SelectItem>
                      </SelectContent>
                    </Select>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setProjectFilter('all'); setStatusFilter('all'); }}>
                        <X className="w-4 h-4 ml-1" />נקה
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recordings list */}
              <Card>
                <CardContent className="p-0">
                  {loadingRecordings ? (
                    <div className="p-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
                  ) : filteredRecordings.length === 0 ? (
                    <EmptyState
                      icon={FileAudio}
                      title={recordings.length === 0 ? 'אין הקלטות עדיין' : 'לא נמצאו תוצאות'}
                      description={recordings.length === 0 ? 'הקלט פגישה חדשה כדי לקבל סיכום אוטומטי' : 'נסה לשנות את הפילטרים'}
                      compact
                      action={recordings.length === 0 ? <Button size="sm" onClick={() => setActiveTab('record')} className="gap-2"><Mic className="w-4 h-4" />הקלטה חדשה</Button> : undefined}
                    />
                  ) : (
                    <div className="divide-y divide-border">
                      {filteredRecordings.map((recording) => (
                        <RecordingRow
                          key={recording.id}
                          recording={recording}
                          onView={() => setSelectedRecording(recording)}
                          onDistribute={() => { setDistributingRecording(recording); setShowDistributeDialog(true); }}
                          onSummarize={() => handleSummarizeRecording(recording)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ErrorBoundary>
          </TabsContent>

          {/* ── Tab 2: Record & Analyze ── */}
          <TabsContent value="record" className="space-y-4 mt-4">
            <ErrorBoundary fallbackTitle="שגיאה ברכיב ההקלטה">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="h-auto lg:min-h-[500px]">
                  {largeFileProcessing ? (
                    <LargeAudioProcessor
                      file={largeFileProcessing.file}
                      onComplete={handleLargeFileComplete}
                      onError={(err) => { showError(err); setLargeFileProcessing(null); setAnalysisState('empty'); }}
                      onCancel={() => { setLargeFileProcessing(null); setAnalysisState('empty'); }}
                    />
                  ) : (
                    <RecordingControls onRecordingComplete={handleRecordingComplete} />
                  )}
                </div>
                <div className="h-auto lg:min-h-[500px]">
                  <AnalysisResults
                    state={analysisState}
                    onApprove={handleApprove}
                    recording={currentRecording}
                  />
                </div>
              </div>
            </ErrorBoundary>
          </TabsContent>

          {/* ── Tab 3: Meetings ── */}
          <TabsContent value="meetings" className="space-y-4 mt-4">
            <ErrorBoundary fallbackTitle="שגיאה בטעינת פגישות">
              {/* Upcoming */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      פגישות קרובות
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setShowAddMeeting(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      קבע פגישה
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingMeetings ? (
                    <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
                  ) : upcomingMeetings.length === 0 ? (
                    <EmptyState
                      icon={Calendar}
                      title="אין פגישות קרובות"
                      description="קבע פגישה חדשה כדי לראות אותה כאן"
                      compact
                      action={<Button size="sm" onClick={() => setShowAddMeeting(true)} className="gap-2"><CalendarPlus className="w-4 h-4" />קבע פגישה</Button>}
                    />
                  ) : (
                    <div className="space-y-2">
                      {upcomingMeetings.map(meeting => (
                        <MeetingRow key={meeting.id} meeting={meeting} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent */}
              {recentMeetings.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      פגישות אחרונות
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {recentMeetings.map(meeting => (
                        <MeetingRow key={meeting.id} meeting={meeting} isPast />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </ErrorBoundary>
          </TabsContent>
        </Tabs>

        {/* ── Dialogs ── */}
        <AddEventDialog
          isOpen={showAddMeeting}
          onClose={() => { setShowAddMeeting(false); queryClient.invalidateQueries({ queryKey: ['calendarEvents'] }); }}
          prefilledData={{ event_type: 'meeting' }}
        />

        <RecordingViewDialog
          recording={selectedRecording}
          isOpen={!!selectedRecording}
          onClose={() => setSelectedRecording(null)}
          onDistribute={() => { setDistributingRecording(selectedRecording); setShowDistributeDialog(true); setSelectedRecording(null); }}
        />

        <DistributeDialog
          recording={distributingRecording}
          isOpen={showDistributeDialog}
          onClose={() => { setShowDistributeDialog(false); setDistributingRecording(null); }}
          onDistribute={handleDistribute}
          projects={projects}
        />
      </div>
    </div>
  );
}

// ── Sub-components ──

function MeetingRow({ meeting, isPast = false }) {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl border border-border/60 hover:border-primary/30 transition-colors ${isPast ? 'opacity-60' : ''}`}>
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Calendar className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{meeting.title}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {meeting.start_date ? format(parseISO(meeting.start_date), 'EEEE d/M, HH:mm', { locale: he }) : '—'}
          </span>
          {meeting.location && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3" />
              {meeting.location}
            </span>
          )}
        </div>
      </div>
      {meeting.completed && <Badge variant="outline" className="text-xs">הושלמה</Badge>}
    </div>
  );
}

function RecordingRow({ recording, onView, onDistribute, onSummarize }) {
  const { t } = useLanguage();
  const getStatusBadge = (status) => {
    const map = {
      analyzed: { label: 'נותח', className: 'bg-success/10 text-success' },
      distributed: { label: 'פוזר', className: 'bg-secondary/10 text-secondary' },
      processing: { label: 'בעיבוד', className: 'bg-warning/10 text-warning' },
      failed: { label: 'נכשל', variant: 'destructive' },
    };
    const c = map[status] || { label: status, variant: 'outline' };
    return <Badge variant={c.variant || 'default'} className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <FileAudio className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{recording.title}</h3>
            {getStatusBadge(recording.status)}
          </div>
          {recording.analysis?.summary && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">{recording.analysis.summary}</p>
          )}
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(recording.created_date), 'dd/MM/yyyy', { locale: he })}</span>
            {recording.duration != null && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDurationDisplay(recording.duration)}</span>}
            {recording.analysis?.tasks?.length > 0 && <span className="flex items-center gap-1"><ListTodo className="w-3 h-3" />{recording.analysis.tasks.length} משימות</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={onView} aria-label={t('a11y.view')}><Eye className="w-4 h-4" aria-hidden /></Button></TooltipTrigger><TooltipContent>צפייה</TooltipContent></Tooltip></TooltipProvider>
        {recording.status === 'processing' && (
          <Button variant="outline" size="sm" onClick={onSummarize} className="gap-1"><Sparkles className="w-3 h-3" />סכם</Button>
        )}
        {recording.status === 'analyzed' && (
          <Button variant="outline" size="sm" onClick={onDistribute} className="gap-1"><Send className="w-3 h-3" />פיזור</Button>
        )}
      </div>
    </div>
  );
}

function RecordingViewDialog({ recording, isOpen, onClose, onDistribute }) {
  const [activeTab, setActiveTab] = useState('summary');
  if (!recording) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileAudio className="w-5 h-5 text-primary" />{recording.title}</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">סיכום</TabsTrigger>
            <TabsTrigger value="tasks">משימות</TabsTrigger>
            <TabsTrigger value="transcription">תמלול</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[50vh] mt-4">
            <TabsContent value="summary" className="space-y-4">
              <Card><CardContent className="p-4"><h4 className="font-medium mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4" />סיכום</h4><p className="text-sm text-muted-foreground leading-relaxed">{recording.analysis?.summary || 'אין סיכום זמין'}</p></CardContent></Card>
              {recording.analysis?.topics?.length > 0 && <Card><CardContent className="p-4"><h4 className="font-medium mb-2">נושאים מרכזיים</h4><div className="flex flex-wrap gap-2">{recording.analysis.topics.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}</div></CardContent></Card>}
              {recording.analysis?.decisions?.length > 0 && <Card><CardContent className="p-4"><h4 className="font-medium mb-2">החלטות</h4><ul className="space-y-2">{recording.analysis.decisions.map((d, i) => <li key={i} className="text-sm flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />{d}</li>)}</ul></CardContent></Card>}
            </TabsContent>
            <TabsContent value="tasks" className="space-y-4">
              {recording.analysis?.tasks?.length > 0 ? (
                <Card><CardContent className="p-4"><h4 className="font-medium mb-3">משימות שזוהו</h4><ul className="space-y-3">{recording.analysis.tasks.map((task, i) => <li key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"><ListTodo className="w-4 h-4 text-primary mt-0.5" /><span className="text-sm">{task}</span></li>)}</ul></CardContent></Card>
              ) : (
                <EmptyState icon={ListTodo} title="לא זוהו משימות" compact />
              )}
              {recording.deep_analysis?.action_items?.length > 0 && (
                <Card><CardContent className="p-4"><h4 className="font-medium mb-3">פריטי פעולה מפורטים</h4><div className="space-y-3">{recording.deep_analysis.action_items.map((item, i) => (
                  <div key={i} className="p-3 border border-border rounded-lg"><p className="font-medium text-sm">{item.task}</p><div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">{item.assignee && <span>אחראי: {item.assignee}</span>}{item.deadline && <span>דדליין: {item.deadline}</span>}{item.priority && <Badge variant="outline" className="text-xs">{item.priority === 'high' || item.priority === 'urgent' ? 'דחוף' : item.priority === 'medium' ? 'רגיל' : 'נמוך'}</Badge>}</div></div>
                ))}</div></CardContent></Card>
              )}
            </TabsContent>
            <TabsContent value="transcription">
              <Card><CardContent className="p-4">
                {recording.audio_url && <div className="mb-4 p-3 bg-muted rounded-lg"><audio controls className="w-full"><source src={recording.audio_url} /></audio></div>}
                <h4 className="font-medium mb-2">תמלול מלא</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{recording.transcription || 'אין תמלול זמין'}</p>
              </CardContent></Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>סגור</Button>
          {recording.status === 'analyzed' && <Button onClick={onDistribute} className="gap-2"><Send className="w-4 h-4" />פזר משימות</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DistributeDialog({ recording, isOpen, onClose, onDistribute, projects }) {
  const [selections, setSelections] = useState({ createTasks: true, updateProject: false, sendEmail: false, createJournalEntry: true, selectedProjectId: '' });
  if (!recording) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="w-5 h-5 text-primary" />פיזור נתונים מהסיכום</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">בחר מה לעשות עם הנתונים שחולצו מההקלטה:</p>
          <div className="space-y-2">
            <label className="text-sm font-medium">שייך לפרויקט</label>
            <Select value={selections.selectedProjectId || 'none'} onValueChange={(v) => setSelections(s => ({ ...s, selectedProjectId: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder="בחר פרויקט" /></SelectTrigger>
              <SelectContent><SelectItem value="none">ללא פרויקט</SelectItem>{projects.filter(p => p.id).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
              <input type="checkbox" checked={selections.createTasks} onChange={(e) => setSelections(s => ({ ...s, createTasks: e.target.checked }))} className="rounded" />
              <div><p className="text-sm font-medium">יצירת משימות</p><p className="text-xs text-muted-foreground">{recording.analysis?.tasks?.length || 0} משימות זוהו</p></div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
              <input type="checkbox" checked={selections.createJournalEntry} onChange={(e) => setSelections(s => ({ ...s, createJournalEntry: e.target.checked }))} className="rounded" />
              <div><p className="text-sm font-medium">יצירת רשומת יומן</p><p className="text-xs text-muted-foreground">שמירת הסיכום ביומן הפרויקט</p></div>
            </label>
            <label className="flex items-center gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50">
              <input type="checkbox" checked={selections.sendEmail} onChange={(e) => setSelections(s => ({ ...s, sendEmail: e.target.checked }))} className="rounded" />
              <div><p className="text-sm font-medium">שליחת סיכום במייל</p><p className="text-xs text-muted-foreground">שליחה לצוות הפרויקט</p></div>
            </label>
          </div>
        </div>
        <DialogFooter className="gap-2"><Button variant="outline" onClick={onClose}>ביטול</Button><Button onClick={() => onDistribute(recording, selections)} className="gap-2"><Send className="w-4 h-4" />פזר</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
