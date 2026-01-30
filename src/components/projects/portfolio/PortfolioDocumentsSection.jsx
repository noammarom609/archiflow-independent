import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  Grid,
  List,
  Calendar,
  MoreVertical
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DocumentUploadDialog from '../documents/DocumentUploadDialog';
import DocumentPreviewDialog from '../documents/DocumentPreviewDialog';
import { showSuccess, showError } from '../../utils/notifications';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const categoryConfig = {
  contract: { label: 'חוזה', color: 'bg-blue-100 text-blue-700' },
  proposal: { label: 'הצעת מחיר', color: 'bg-green-100 text-green-700' },
  plan: { label: 'תוכנית', color: 'bg-purple-100 text-purple-700' },
  rendering: { label: 'הדמיה', color: 'bg-pink-100 text-pink-700' },
  permit: { label: 'היתר', color: 'bg-orange-100 text-orange-700' },
  invoice: { label: 'חשבונית', color: 'bg-yellow-100 text-yellow-700' },
  photo: { label: 'תמונה', color: 'bg-indigo-100 text-indigo-700' },
  other: { label: 'אחר', color: 'bg-gray-100 text-gray-700' },
};

export default function PortfolioDocumentsSection({ documents, project, isLoading }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioDocuments', project?.id] });
      showSuccess('המסמך נמחק');
    },
    onError: () => showError('שגיאה במחיקה'),
  });

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (fileType) => {
    if (fileType === 'image' || fileType === 'photo') return Image;
    if (fileType === 'pdf') return FileText;
    return File;
  };

  const handleDownload = (doc) => {
    window.open(doc.file_url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">מסמכים</h2>
            <p className="text-sm text-slate-500">{documents.length} קבצים</p>
          </div>
        </div>

        <Button onClick={() => setShowUploadDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 ml-2" />
          העלה מסמך
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="חיפוש..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="קטגוריה" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {Object.entries(categoryConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Documents Grid/List */}
      {filteredDocuments.length === 0 ? (
        <Card className="border-dashed border-slate-300">
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">אין מסמכים</p>
            <Button variant="outline" onClick={() => setShowUploadDialog(true)} className="mt-4">
              <Plus className="w-4 h-4 ml-2" />
              העלה מסמך ראשון
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredDocuments.map((doc, index) => {
              const FileIcon = getFileIcon(doc.file_type);
              const catConfig = categoryConfig[doc.category] || categoryConfig.other;

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="border-slate-200 hover:shadow-lg transition-all group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
                          {doc.file_type === 'image' ? (
                            <img src={doc.file_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <FileIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewDocument(doc)}>
                              <Eye className="w-4 h-4 ml-2" />
                              צפה
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(doc)}>
                              <Download className="w-4 h-4 ml-2" />
                              הורד
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteMutation.mutate(doc.id)}
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              מחק
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <h4 className="font-medium text-slate-900 truncate mb-1">{doc.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(doc.created_date), 'd/M/yy')}
                      </div>
                      <Badge className={`${catConfig.color} text-[10px]`}>
                        {catConfig.label}
                      </Badge>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredDocuments.map((doc) => {
            const FileIcon = getFileIcon(doc.file_type);
            const catConfig = categoryConfig[doc.category] || categoryConfig.other;

            return (
              <Card key={doc.id} className="border-slate-200 hover:bg-slate-50">
                <CardContent className="p-3 flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                    <FileIcon className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">{doc.title}</h4>
                  </div>
                  <Badge className={`${catConfig.color} text-[10px]`}>{catConfig.label}</Badge>
                  <span className="text-xs text-slate-500">
                    {format(new Date(doc.created_date), 'd/M/yy')}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewDocument(doc)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500"
                      onClick={() => deleteMutation.mutate(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs */}
      <DocumentUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        project={project}
      />

      <DocumentPreviewDialog
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
      />
    </div>
  );
}