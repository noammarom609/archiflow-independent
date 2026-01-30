import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Search,
  Filter,
  FolderPlus,
  Folder,
  FolderOpen,
  LayoutGrid,
  List,
  Calendar as CalendarIcon,
  Loader2,
  History,
  X,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Sparkles
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { showSuccess, showError } from '../utils/notifications';
import RecordingCard from './RecordingCard';
import CreateFolderDialog from './CreateFolderDialog';
import AnalysisResults from './AnalysisResults';
import ProcessingTimeline from './ProcessingTimeline';
import ExecutiveSummary from './ExecutiveSummary';
import AdvancedInsights from './AdvancedInsights';
import DistributionHistory from './DistributionHistory';
import TranscriptionQualityControl from './TranscriptionQualityControl';

export default function RecordingsGrid() {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [sortBy, setSortBy] = useState('date-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [editingRecording, setEditingRecording] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [activeTab, setActiveTab] = useState('analysis');

  // Fetch current user for multi-tenant filtering (with bypass support)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(base44),
  });

  // Multi-tenant: Get architect ID for filtering
  const isSuperAdmin = user?.app_role === 'super_admin';

  // Fetch recordings
  const { data: allRecordings = [], isLoading } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => base44.entities.Recording.list('-created_date', 100),
  });

  // Multi-tenant filtering: Show only recordings created by this user
  const recordings = isSuperAdmin 
    ? allRecordings 
    : allRecordings.filter(r => r.created_by === user?.email);

  // Fetch folders
  const { data: allFolders = [] } = useQuery({
    queryKey: ['recording-folders'],
    queryFn: () => base44.entities.RecordingFolder.list('name'),
  });

  // Multi-tenant filtering for folders
  const folders = isSuperAdmin 
    ? allFolders 
    : allFolders.filter(f => f.created_by === user?.email);

  // Fetch projects for linking (already filtered elsewhere, but ensure consistency)
  const { data: allProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('name'),
  });

  // Multi-tenant filtering for projects
  const myArchitectId = user?.app_role === 'architect' ? user?.id : user?.architect_id;
  const projects = isSuperAdmin 
    ? allProjects 
    : allProjects.filter(p => 
        p.created_by === user?.email || 
        (myArchitectId && p.architect_id === myArchitectId)
      );

  // Mutations
  const deleteRecordingMutation = useMutation({
    mutationFn: (id) => base44.entities.Recording.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      showSuccess('הקלטה נמחקה בהצלחה');
      setSelectedRecording(null);
    },
    onError: () => showError('שגיאה במחיקת ההקלטה'),
  });

  const updateRecordingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Recording.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      showSuccess('ההקלטה עודכנה בהצלחה');
      setEditingRecording(null);
    },
    onError: () => showError('שגיאה בעדכון ההקלטה'),
  });

  // Smart search
  const smartSearch = (recording, query) => {
    const lowerQuery = query.toLowerCase();
    if (recording.title?.toLowerCase().includes(lowerQuery)) return true;
    if (recording.transcription?.toLowerCase().includes(lowerQuery)) return true;
    if (recording.analysis?.summary?.toLowerCase().includes(lowerQuery)) return true;
    if (recording.analysis?.tasks?.some(t => t.toLowerCase().includes(lowerQuery))) return true;
    if (recording.analysis?.topics?.some(t => t.toLowerCase().includes(lowerQuery))) return true;
    return false;
  };

  // Filter and sort recordings
  const filteredRecordings = useMemo(() => {
    let result = recordings.filter(recording => {
      const matchesSearch = !searchQuery.trim() || smartSearch(recording, searchQuery);
      const matchesStatus = statusFilter === 'all' || recording.status === statusFilter;
      const matchesFolder = selectedFolder === 'all' ||
        (selectedFolder === 'none' && !recording.folder_id) ||
        recording.folder_id === selectedFolder;
      
      // Date filter
      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const recordingDate = new Date(recording.created_date);
        if (dateRange.from && recordingDate < dateRange.from) matchesDate = false;
        if (dateRange.to && recordingDate > dateRange.to) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesFolder && matchesDate;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_date) - new Date(a.created_date);
        case 'date-asc':
          return new Date(a.created_date) - new Date(b.created_date);
        case 'name-asc':
          return a.title.localeCompare(b.title, 'he');
        case 'name-desc':
          return b.title.localeCompare(a.title, 'he');
        case 'quality-desc':
          return (b.quality_score || 0) - (a.quality_score || 0);
        default:
          return new Date(b.created_date) - new Date(a.created_date);
      }
    });

    return result;
  }, [recordings, searchQuery, statusFilter, selectedFolder, dateRange, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total: recordings.length,
    analyzed: recordings.filter(r => r.status === 'analyzed').length,
    processing: recordings.filter(r => r.status === 'processing').length,
    failed: recordings.filter(r => r.status === 'failed').length,
    distributed: recordings.filter(r => r.status === 'distributed').length,
    withFlags: recordings.filter(r => r.flagged_count > 0 || r.analysis?.flagged_segments?.length > 0).length,
  }), [recordings]);

  // Folder counts
  const folderCounts = useMemo(() => {
    const counts = folders.map(folder => ({
      ...folder,
      count: recordings.filter(r => r.folder_id === folder.id).length
    }));
    const unfiledCount = recordings.filter(r => !r.folder_id).length;
    return { folders: counts, unfiled: unfiledCount };
  }, [folders, recordings]);

  const handleDelete = (recording) => {
    if (confirm(`האם למחוק את ההקלטה "${recording.title}"?`)) {
      deleteRecordingMutation.mutate(recording.id);
    }
  };

  const handleEdit = (recording) => {
    setEditingRecording(recording);
    setEditedTitle(recording.title);
  };

  const handleSaveEdit = () => {
    if (editedTitle.trim() && editingRecording) {
      updateRecordingMutation.mutate({
        id: editingRecording.id,
        data: { title: editedTitle.trim() }
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSelectedFolder('all');
    setDateRange({ from: null, to: null });
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || 
    selectedFolder !== 'all' || dateRange.from || dateRange.to;

  return (
    <>
      <Card className="border-slate-200">
        <CardHeader className="pb-4 px-3 sm:px-6">
          {/* Stats Row */}
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-100 rounded-lg">
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
              <span className="text-xs sm:text-sm font-medium">{stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span className="text-xs sm:text-sm text-emerald-700">{stats.analyzed}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-50 rounded-lg hidden sm:flex">
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
              <span className="text-xs sm:text-sm text-purple-700">{stats.distributed}</span>
            </div>
            {stats.processing > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-amber-50 rounded-lg">
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 animate-spin" />
                <span className="text-xs sm:text-sm text-amber-700">{stats.processing}</span>
              </div>
            )}
            {stats.withFlags > 0 && (
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-orange-50 rounded-lg hidden md:flex">
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                <span className="text-xs sm:text-sm text-orange-700">{stats.withFlags}</span>
              </div>
            )}
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-0 sm:min-w-[200px] relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="חיפוש..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Quick Filters */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 sm:w-36 text-xs sm:text-sm">
                  <SelectValue placeholder="סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="analyzed">מנותח</SelectItem>
                  <SelectItem value="distributed">פוזר</SelectItem>
                  <SelectItem value="processing">בעיבוד</SelectItem>
                  <SelectItem value="failed">נכשל</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range - Hidden on mobile */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-1.5 sm:gap-2 text-xs sm:text-sm hidden sm:flex">
                    <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        `${format(dateRange.from, 'dd/MM')} - ${format(dateRange.to, 'dd/MM')}`
                      ) : format(dateRange.from, 'dd/MM/yy')
                    ) : 'תאריך'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    locale={he}
                    numberOfMonths={1}
                  />
                  {(dateRange.from || dateRange.to) && (
                    <div className="p-2 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDateRange({ from: null, to: null })}
                        className="w-full"
                      >
                        נקה תאריכים
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Sort - Hidden on mobile */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-28 sm:w-40 text-xs sm:text-sm hidden md:flex">
                  <SelectValue placeholder="מיון" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">חדש לישן</SelectItem>
                  <SelectItem value="date-asc">ישן לחדש</SelectItem>
                  <SelectItem value="name-asc">שם (א-ת)</SelectItem>
                  <SelectItem value="name-desc">שם (ת-א)</SelectItem>
                  <SelectItem value="quality-desc">איכות תמלול</SelectItem>
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none px-2 sm:px-3"
                >
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none px-2 sm:px-3"
                >
                  <List className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-slate-500 text-xs sm:text-sm"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                  <span className="hidden sm:inline">נקה</span>
                </Button>
              )}
            </div>
          </div>

          {/* Folders */}
          <div className="flex items-center gap-2 flex-wrap mt-3 sm:mt-4 overflow-x-auto pb-2">
            <Button
              variant={selectedFolder === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFolder('all')}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0"
            >
              <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              הכל ({recordings.length})
            </Button>
            <Button
              variant={selectedFolder === 'none' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFolder('none')}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0 hidden sm:flex"
            >
              <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ללא ({folderCounts.unfiled})
            </Button>
            {folderCounts.folders.slice(0, 3).map(folder => (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFolder(folder.id)}
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0"
              >
                <Folder className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {folder.name} ({folder.count})
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolder(true)}
              className="gap-1.5 sm:gap-2 text-xs sm:text-sm flex-shrink-0"
            >
              <FolderPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">תיקייה</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-3 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredRecordings.length === 0 ? (
            <div className="text-center py-10 sm:py-16">
              <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <History className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-2">
                {recordings.length === 0 ? 'אין הקלטות עדיין' : 'לא נמצאו הקלטות'}
              </h3>
              <p className="text-slate-500 text-sm sm:text-base mb-4">
                {recordings.length === 0 
                  ? 'העלה הקלטה או הקלט שיחה כדי לקבל תמלול וניתוח AI' 
                  : 'נסה לשנות את הפילטרים או את החיפוש'}
              </p>
              {recordings.length === 0 && (
                <p className="text-xs text-slate-400">
                  ההקלטות שלך יופיעו כאן לאחר העלאה או הקלטה
                </p>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
              <AnimatePresence>
                {filteredRecordings.map((recording, index) => (
                  <RecordingCard
                    key={recording.id}
                    recording={recording}
                    folders={folders}
                    index={index}
                    onView={setSelectedRecording}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredRecordings.map((recording, index) => (
                  <RecordingCard
                    key={recording.id}
                    recording={recording}
                    folders={folders}
                    index={index}
                    onView={setSelectedRecording}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
      />

      {/* Edit Title Dialog */}
      <Dialog open={!!editingRecording} onOpenChange={() => setEditingRecording(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>עריכת שם הקלטה</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              placeholder="שם ההקלטה"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingRecording(null)}>
                ביטול
              </Button>
              <Button onClick={handleSaveEdit}>
                שמור
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recording Details Dialog */}
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedRecording?.title}</h2>
                <p className="text-sm text-slate-500 font-normal">
                  {selectedRecording && format(new Date(selectedRecording.created_date), 'dd MMMM yyyy, HH:mm', { locale: he })}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedRecording && (
            <div className="mt-4">
              {/* Tabs */}
              <div className="flex border-b border-slate-200 mb-4">
                {[
                  { id: 'analysis', label: 'ניתוח AI' },
                  { id: 'transcription', label: 'תמלול' },
                  { id: 'quality', label: 'בקרת איכות' },
                  { id: 'history', label: 'היסטוריה' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'analysis' && (
                <div className="space-y-6">
                  <ExecutiveSummary recording={selectedRecording} />
                  <AdvancedInsights recording={selectedRecording} />
                  
                  {/* Tasks */}
                  {selectedRecording.analysis?.tasks?.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-slate-900 mb-3">משימות שזוהו</h3>
                      <ul className="space-y-2">
                        {selectedRecording.analysis.tasks.map((task, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Decisions */}
                  {selectedRecording.analysis?.decisions?.length > 0 && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h3 className="font-semibold text-slate-900 mb-3">החלטות</h3>
                      <ul className="space-y-2">
                        {selectedRecording.analysis.decisions.map((decision, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                            {decision}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'transcription' && (
                <div className="space-y-4">
                  {/* Audio Player */}
                  {selectedRecording.audio_url && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h3 className="font-semibold text-slate-900 mb-3">נגן אודיו</h3>
                      <audio controls className="w-full">
                        <source src={selectedRecording.audio_url} />
                      </audio>
                    </div>
                  )}

                  {/* Transcription */}
                  <div className="p-4 bg-white border border-slate-200 rounded-lg">
                    <h3 className="font-semibold text-slate-900 mb-3">תמלול מלא</h3>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {selectedRecording.transcription || 'אין תמלול זמין'}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'quality' && (
                <TranscriptionQualityControl
                  recording={selectedRecording}
                  transcription={selectedRecording.transcription}
                />
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  <ProcessingTimeline recording={selectedRecording} />
                  {selectedRecording.distribution_log?.length > 0 && (
                    <DistributionHistory recording={selectedRecording} />
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}