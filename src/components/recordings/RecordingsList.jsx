import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { History, Play, CheckCircle2, Clock, Loader2, FileText, Calendar, Trash2, Eye, Search, FolderPlus, Folder, FolderOpen, Share2, Edit2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { showSuccess, showError } from '../utils/notifications';
import CreateFolderDialog from './CreateFolderDialog';
import DistributionHistory from './DistributionHistory';
import AISummaryCard from './AISummaryCard';
import ProcessingTimeline from './ProcessingTimeline';
import AdvancedInsights from './AdvancedInsights';
import ExecutiveSummary from './ExecutiveSummary';

export default function RecordingsList() {
  const queryClient = useQueryClient();
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [sortBy, setSortBy] = useState('date-desc');
  const [editingRecording, setEditingRecording] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');

  const { data: recordings = [], isLoading } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => base44.entities.Recording.list('-created_date', 50),
  });

  const { data: folders = [] } = useQuery({
    queryKey: ['recording-folders'],
    queryFn: () => base44.entities.RecordingFolder.list('name'),
  });

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
      showSuccess('שם ההקלטה עודכן בהצלחה');
      setEditingRecording(null);
    },
    onError: () => showError('שגיאה בעדכון שם ההקלטה'),
  });

  const moveToFolderMutation = useMutation({
    mutationFn: ({ recordingId, folderId }) => 
      base44.entities.Recording.update(recordingId, { folder_id: folderId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      showSuccess('ההקלטה הועברה בהצלחה');
    },
    onError: () => showError('שגיאה בהעברת ההקלטה'),
  });

  const handleDelete = (recording) => {
    if (confirm(`האם למחוק את ההקלטה "${recording.title}"?`)) {
      deleteRecordingMutation.mutate(recording.id);
    }
  };

  const handleStartEdit = (recording) => {
    setEditingRecording(recording.id);
    setEditedTitle(recording.title);
  };

  const handleSaveEdit = (id) => {
    if (editedTitle.trim()) {
      updateRecordingMutation.mutate({ id, data: { title: editedTitle.trim() } });
    } else {
      setEditingRecording(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingRecording(null);
    setEditedTitle('');
  };

  // Smart search - searches in title, transcription, and analysis
  const smartSearch = (recording, query) => {
    const lowerQuery = query.toLowerCase();

    // Search in title
    if (recording.title.toLowerCase().includes(lowerQuery)) return true;

    // Search in transcription
    if (recording.transcription?.toLowerCase().includes(lowerQuery)) return true;

    // Search in analysis summary
    if (recording.analysis?.summary?.toLowerCase().includes(lowerQuery)) return true;

    // Search in tasks
    if (recording.analysis?.tasks?.some(task => 
      task.toLowerCase().includes(lowerQuery)
    )) return true;

    // Search in decisions
    if (recording.analysis?.decisions?.some(decision => 
      decision.toLowerCase().includes(lowerQuery)
    )) return true;

    // Search in topics
    if (recording.analysis?.topics?.some(topic => 
      topic.toLowerCase().includes(lowerQuery)
    )) return true;

    return false;
  };

  // Convert duration string (MM:SS) to seconds for sorting
  const durationToSeconds = (duration) => {
    if (!duration || duration === '--:--') return 0;
    const parts = duration.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  // Filter and sort recordings
  let filteredRecordings = recordings.filter(recording => {
    const matchesSearch = searchQuery.trim() === '' || smartSearch(recording, searchQuery);
    const matchesStatus = statusFilter === 'all' || recording.status === statusFilter;
    const matchesFolder = selectedFolder === 'all' || 
                          (selectedFolder === 'none' && !recording.folder_id) ||
                          recording.folder_id === selectedFolder;
    return matchesSearch && matchesStatus && matchesFolder;
  });

  // Sort recordings
  filteredRecordings = [...filteredRecordings].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.created_date) - new Date(a.created_date);
      case 'date-asc':
        return new Date(a.created_date) - new Date(b.created_date);
      case 'duration-desc':
        return durationToSeconds(b.duration) - durationToSeconds(a.duration);
      case 'duration-asc':
        return durationToSeconds(a.duration) - durationToSeconds(b.duration);
      case 'name-asc':
        return a.title.localeCompare(b.title, 'he');
      case 'name-desc':
        return b.title.localeCompare(a.title, 'he');
      default:
        return new Date(b.created_date) - new Date(a.created_date);
    }
  });

  // Count by folder
  const folderCounts = folders.map(folder => ({
    ...folder,
    count: recordings.filter(r => r.folder_id === folder.id).length
  }));

  const unfiledCount = recordings.filter(r => !r.folder_id).length;

  return (
    <>
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              תיקיית הקלטות ({recordings.length})
            </CardTitle>
            {isLoading && (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="חיפוש חכם: כותרת, תמלול, נושאים, משימות..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              {searchQuery && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                  {filteredRecordings.length} תוצאות
                </span>
              )}
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסטטוסים</SelectItem>
                <SelectItem value="analyzed">מנותח</SelectItem>
                <SelectItem value="distributed">פוזר</SelectItem>
                <SelectItem value="completed">הושלם</SelectItem>
                <SelectItem value="processing">מעבד</SelectItem>
                <SelectItem value="failed">נכשל</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="מיון" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">תאריך (חדש לישן)</SelectItem>
                <SelectItem value="date-asc">תאריך (ישן לחדש)</SelectItem>
                <SelectItem value="duration-desc">משך (ארוך לקצר)</SelectItem>
                <SelectItem value="duration-asc">משך (קצר לארוך)</SelectItem>
                <SelectItem value="name-asc">שם (א-ת)</SelectItem>
                <SelectItem value="name-desc">שם (ת-א)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Folders */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Button
              variant={selectedFolder === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFolder('all')}
              className="gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              הכל ({recordings.length})
            </Button>
            <Button
              variant={selectedFolder === 'none' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFolder('none')}
              className="gap-2"
            >
              <Folder className="w-4 h-4" />
              ללא תיקייה ({unfiledCount})
            </Button>
            {folderCounts.map(folder => (
              <Button
                key={folder.id}
                variant={selectedFolder === folder.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFolder(folder.id)}
                className="gap-2"
              >
                <Folder className="w-4 h-4" />
                {folder.name} ({folder.count})
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolder(true)}
              className="gap-2"
            >
              <FolderPlus className="w-4 h-4" />
              תיקייה חדשה
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecordings.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {recordings.length === 0 ? 'אין הקלטות עדיין' : 'לא נמצאו הקלטות'}
              </p>
              <p className="text-sm text-slate-400">
                {recordings.length === 0 ? 'ההקלטות שלך יופיעו כאן' : 'נסה לשנות את הפילטרים'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                      תאריך
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                      שם ההקלטה
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                      משך
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                      סטטוס
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecordings.map((recording, index) => (
                    <motion.tr
                      key={recording.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-slate-700">
                        {format(new Date(recording.created_date), 'dd/MM/yyyy HH:mm', { locale: he })}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">
                        {editingRecording === recording.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(recording.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="h-8"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSaveEdit(recording.id)}
                              className="h-8 w-8 p-0"
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 p-0"
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group">
                            <span>{recording.title}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStartEdit(recording)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-700" dir="ltr">
                        {recording.duration || '--:--'}
                      </td>
                      <td className="py-3 px-4">
                        {recording.status === 'distributed' ? (
                          <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1 w-fit">
                            <Share2 className="w-3 h-3" />
                            פוזר למערכת
                          </Badge>
                        ) : recording.status === 'analyzed' ? (
                          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            מנותח
                          </Badge>
                        ) : recording.status === 'completed' ? (
                          <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            נותח
                          </Badge>
                        ) : recording.status === 'processing' ? (
                          <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1 w-fit">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            מעבד
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                            <Clock className="w-3 h-3" />
                            נכשל
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Select
                            value={recording.folder_id || 'none'}
                            onValueChange={(value) => 
                              moveToFolderMutation.mutate({
                                recordingId: recording.id,
                                folderId: value === 'none' ? null : value
                              })
                            }
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="תיקייה" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">ללא תיקייה</SelectItem>
                              {folders.map(folder => (
                                <SelectItem key={folder.id} value={folder.id}>
                                  {folder.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {recording.audio_url && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => window.open(recording.audio_url, '_blank')}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          {recording.status === 'completed' && recording.analysis && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => setSelectedRecording(recording)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(recording)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
      />

      {/* Recording Details Dialog */}
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedRecording?.title}
            </DialogTitle>
          </DialogHeader>

          {selectedRecording && (
            <div className="space-y-6 mt-4">
              {/* Recording Info */}
              <div className="flex items-center gap-4 text-sm text-slate-600 pb-4 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(selectedRecording.created_date), 'dd MMMM yyyy, HH:mm', { locale: he })}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {selectedRecording.duration}
                </div>
              </div>

              {/* Processing Timeline */}
              <ProcessingTimeline recording={selectedRecording} />

              {/* Executive Summary */}
              <ExecutiveSummary recording={selectedRecording} />

              {/* Advanced Insights */}
              <AdvancedInsights recording={selectedRecording} />

              {/* Transcription */}
              {selectedRecording.transcription && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    תמלול
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedRecording.transcription}
                  </p>
                </div>
              )}

              {/* Distribution History */}
              {selectedRecording.distribution_log && selectedRecording.distribution_log.length > 0 && (
                <DistributionHistory recording={selectedRecording} />
              )}

              {/* Analysis Results */}
              {selectedRecording.analysis && (
                <div className="space-y-4">
                  {/* Summary */}
                  {selectedRecording.analysis.summary && (
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <h3 className="font-semibold text-slate-900 mb-2">סיכום</h3>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {selectedRecording.analysis.summary}
                      </p>
                    </div>
                  )}

                  {/* Tasks */}
                  {selectedRecording.analysis.tasks && selectedRecording.analysis.tasks.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-slate-900 mb-2">משימות שזוהו</h3>
                      <ul className="space-y-1">
                        {selectedRecording.analysis.tasks.map((task, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-green-600">•</span>
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Decisions */}
                  {selectedRecording.analysis.decisions && selectedRecording.analysis.decisions.length > 0 && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h3 className="font-semibold text-slate-900 mb-2">החלטות</h3>
                      <ul className="space-y-1">
                        {selectedRecording.analysis.decisions.map((decision, idx) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <span className="text-purple-600">•</span>
                            {decision}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Topics */}
                  {selectedRecording.analysis.topics && selectedRecording.analysis.topics.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-slate-900 mb-2">נושאים שנדונו</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedRecording.analysis.topics.map((topic, idx) => (
                          <Badge key={idx} variant="outline" className="bg-white">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Audio Player */}
              {selectedRecording.audio_url && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-semibold text-slate-900 mb-3">השמע הקלטה</h3>
                  <audio controls className="w-full">
                    <source src={selectedRecording.audio_url} />
                    הדפדפן שלך אינו תומך בנגן אודיו.
                  </audio>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}