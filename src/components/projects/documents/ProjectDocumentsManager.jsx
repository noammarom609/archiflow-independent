import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  FileText,
  Image,
  File,
  Trash2,
  Download,
  Eye,
  Loader2,
  FolderOpen,
  FolderPlus,
  Calendar,
  Tag,
  Grid,
  List,
  MoreVertical,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import DocumentUploadDialog from './DocumentUploadDialog';
import DocumentPreviewDialog from './DocumentPreviewDialog';
import { showSuccess, showError } from '../../utils/notifications';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const categoryConfig = {
  contract: { label: 'חוזה', color: 'bg-blue-100 text-blue-700', icon: FileText },
  proposal: { label: 'הצעת מחיר', color: 'bg-green-100 text-green-700', icon: FileText },
  plan: { label: 'תוכנית אדריכלית', color: 'bg-purple-100 text-purple-700', icon: File },
  rendering: { label: 'הדמיה', color: 'bg-pink-100 text-pink-700', icon: Image },
  permit: { label: 'היתר', color: 'bg-orange-100 text-orange-700', icon: FileText },
  invoice: { label: 'חשבונית', color: 'bg-yellow-100 text-yellow-700', icon: FileText },
  report: { label: 'דוח', color: 'bg-cyan-100 text-cyan-700', icon: FileText },
  photo: { label: 'תמונה', color: 'bg-indigo-100 text-indigo-700', icon: Image },
  specification: { label: 'מפרט', color: 'bg-slate-100 text-slate-700', icon: FileText },
  other: { label: 'אחר', color: 'bg-gray-100 text-gray-700', icon: File },
};

const fileTypeConfig = {
  pdf: { label: 'PDF', color: 'bg-red-100 text-red-700' },
  image: { label: 'תמונה', color: 'bg-green-100 text-green-700' },
  dwg: { label: 'DWG', color: 'bg-blue-100 text-blue-700' },
  excel: { label: 'Excel', color: 'bg-emerald-100 text-emerald-700' },
  word: { label: 'Word', color: 'bg-blue-100 text-blue-700' },
  other: { label: 'קובץ', color: 'bg-gray-100 text-gray-700' },
};

export default function ProjectDocumentsManager({ project, tasks = [] }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [activeFolder, setActiveFolder] = useState('All');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showNewFolderDialog, setShowAddFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [previewDocument, setPreviewDocument] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Fetch documents for this project
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['projectDocuments', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      return archiflow.entities.Document.filter({ project_id: String(project.id) }, '-created_date');
    },
    enabled: !!project?.id,
  });

  // Calculate folders from existing documents + default ones
  const folders = React.useMemo(() => {
    const existingFolders = new Set(['General']);
    documents.forEach(doc => {
      if (doc.folder_name) existingFolders.add(doc.folder_name);
    });
    return ['All', ...Array.from(existingFolders).sort()];
  }, [documents]);

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => archiflow.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectDocuments', project?.id] });
      showSuccess('המסמך נמחק בהצלחה');
    },
    onError: () => showError('שגיאה במחיקת המסמך'),
  });

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    // Folder filter
    if (activeFolder !== 'All' && (doc.folder_name || 'General') !== activeFolder) {
      return false;
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      doc.title?.toLowerCase().includes(searchLower) ||
      doc.description?.toLowerCase().includes(searchLower) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchLower));
    
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesFileType = fileTypeFilter === 'all' || doc.file_type === fileTypeFilter;
    
    return matchesSearch && matchesCategory && matchesFileType;
  });

  const getFileIcon = (fileType) => {
    if (fileType === 'image' || fileType === 'photo') return Image;
    if (fileType === 'pdf') return FileText;
    return File;
  };

  const handleDownload = (doc) => {
    const link = document.createElement('a');
    link.href = doc.file_url;
    link.download = doc.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess('הקובץ הורד בהצלחה');
  };

  const canPreview = (doc) => {
    const type = doc.file_type?.toLowerCase();
    const previewableTypes = ['pdf', 'image', 'photo'];
    const previewableExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return previewableTypes.includes(type) || 
           previewableExtensions.some(ext => doc.file_url?.toLowerCase().endsWith(ext));
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    // Just close dialog, the folder will be "created" when a file is uploaded to it
    // Or we can create a dummy placeholder? No, let's just allow selecting it in upload
    // Actually, to make it persistent, better to have a folder entity, but for "minimum changes",
    // we'll just allow the user to type a new folder name in the upload dialog, 
    // OR we can add it to the local list temporarily?
    // Let's keep it simple: Folders are derived from documents. 
    // BUT user wants to "Create Folder". 
    // Trick: We can't really create a folder without a file if we don't have a Folder entity.
    // So we'll just show success and tell user to upload file to it.
    // Or better: update the upload dialog to allow typing a new folder name.
    // I'll update the `folders` list locally or better yet - pass `folders` to UploadDialog.
    
    // For now, simply closing. The real "Creation" happens on upload.
    // But to UX, we can switch to that "empty" folder view maybe?
    setActiveFolder(newFolderName);
    setShowAddFolderDialog(false);
    showSuccess(`תיקייה "${newFolderName}" נוצרה (העלה קבצים אליה כדי לשמור אותה)`);
    setNewFolderName('');
  };

  return (
    <div className="flex gap-6 h-[600px]">
      {/* Sidebar - Folders */}
      <Card className="w-64 flex-shrink-0 border-slate-200 h-full flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">תיקיות</h3>
          <Button variant="ghost" size="icon" onClick={() => setShowAddFolderDialog(true)}>
            <FolderPlus className="w-4 h-4 text-slate-500 hover:text-indigo-600" />
          </Button>
        </div>
        <div className="p-2 overflow-y-auto flex-1 space-y-1">
          {folders.map(folder => (
            <button
              key={folder}
              onClick={() => setActiveFolder(folder)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                activeFolder === folder 
                  ? 'bg-indigo-50 text-indigo-700 font-medium' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className={`w-4 h-4 ${activeFolder === folder ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="truncate">{folder === 'All' ? 'כל הקבצים' : folder}</span>
              </div>
              {folder !== 'All' && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[10px] h-5 min-w-[20px] justify-center">
                  {documents.filter(d => (d.folder_name || 'General') === folder).length}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Main Content */}
      <Card className="flex-1 border-slate-200 h-full flex flex-col">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                {activeFolder === 'All' ? 'כל הקבצים' : activeFolder}
              </h2>
              <Badge className="bg-slate-100 text-slate-700">
                {filteredDocuments.length}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 rounded-lg p-1 flex">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 ml-2" />
                העלה קובץ
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="חיפוש לפי שם, תגיות או תיאור..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {Object.entries(categoryConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue placeholder="סוג קובץ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסוגים</SelectItem>
                {Object.entries(fileTypeConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {searchQuery || categoryFilter !== 'all' || fileTypeFilter !== 'all'
                  ? 'לא נמצאו מסמכים תואמים לחיפוש'
                  : 'התיקייה ריקה'}
              </p>
              <Button
                variant="outline"
                onClick={() => setShowUploadDialog(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 ml-2" />
                העלה מסמך ראשון
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredDocuments.map((doc, index) => {
                  const FileIcon = getFileIcon(doc.file_type);
                  const typeConfig = fileTypeConfig[doc.file_type] || fileTypeConfig.other;
                  const catConfig = categoryConfig[doc.category] || categoryConfig.other;

                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.02 }}
                      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-all group flex flex-col h-full"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                          {(doc.file_type === 'image' || doc.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                            <img src={doc.file_url} alt={doc.title} className="w-full h-full object-cover" />
                          ) : (
                            <FileIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            onClick={() => deleteMutation.mutate(doc.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 mb-3">
                        <h4 className="font-medium text-slate-900 truncate mb-1" title={doc.title}>{doc.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(doc.created_date), 'd/MM/yy')}
                          </span>
                          <span>•</span>
                          <span>{doc.file_size}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className={`${catConfig.color} text-[10px] h-5`}>
                            {catConfig.label}
                          </Badge>
                          {doc.tags?.slice(0, 2).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] h-5">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-auto pt-3 border-t border-slate-100">
                        {canPreview(doc) && (
                          <Button
                            variant="ghost"
                            className="flex-1 h-8 text-xs"
                            onClick={() => setPreviewDocument(doc)}
                          >
                            <Eye className="w-3 h-3 ml-1" />
                            צפה
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="flex-1 h-8 text-xs"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="w-3 h-3 ml-1" />
                          הורד
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => {
                const FileIcon = getFileIcon(doc.file_type);
                const typeConfig = fileTypeConfig[doc.file_type] || fileTypeConfig.other;
                const catConfig = categoryConfig[doc.category] || categoryConfig.other;

                return (
                  <div key={doc.id} className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <FileIcon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 truncate font-medium text-slate-900">{doc.title}</div>
                      <div className="col-span-2">
                        <Badge variant="secondary" className={`${catConfig.color} text-[10px]`}>
                          {catConfig.label}
                        </Badge>
                      </div>
                      <div className="col-span-3 flex gap-1 flex-wrap">
                        {doc.tags?.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-[10px]">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="col-span-2 text-xs text-slate-500 text-right">
                        {format(new Date(doc.created_date), 'd MMM yyyy', { locale: he })}
                      </div>
                      <div className="col-span-1 flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteMutation.mutate(doc.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        project={project}
        tasks={tasks}
        availableFolders={folders.filter(f => f !== 'All')}
        defaultFolder={activeFolder === 'All' ? 'General' : activeFolder}
      />

      {/* Preview Dialog */}
      <DocumentPreviewDialog
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
      />

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowAddFolderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>יצירת תיקייה חדשה</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-name" className="text-right mb-2 block">
              שם התיקייה
            </Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="למשל: תוכניות חשמל"
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddFolderDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleCreateFolder} className="bg-indigo-600 hover:bg-indigo-700">
              צור תיקייה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}