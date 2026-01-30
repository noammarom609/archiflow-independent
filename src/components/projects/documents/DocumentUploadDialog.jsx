import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, FileText, Tag, Folder } from 'lucide-react';
import { archiflow } from '@/api/archiflow';
import { showSuccess, showError } from '@/components/utils/notifications';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/use-notifications';

export default function DocumentUploadDialog({ 
  isOpen, 
  onClose, 
  project, 
  tasks = [], 
  presetCategory = null,
  categoryLabel = null,
  availableFolders = ['General', 'Planning', 'Contracts', 'Communication'],
  defaultFolder = 'General'
}) {
  const { sendTemplate } = useNotifications();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: presetCategory || 'other',
    folder_name: defaultFolder,
    tags: [],
    taskId: 'none'
  });
  const [tagInput, setTagInput] = useState('');

  // Reset form when opened
  React.useEffect(() => {
    if (isOpen) {
      setFile(null);
      setFormData({
        title: '',
        description: '',
        category: presetCategory || 'other',
        folder_name: defaultFolder,
        tags: [],
        taskId: 'none'
      });
      setTagInput('');
    }
  }, [isOpen, presetCategory, defaultFolder]);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill title from filename
      setFormData(prev => ({
        ...prev,
        title: selectedFile.name.split('.').slice(0, -1).join('.')
      }));
    }
  };

  const handleAddTag = (e) => {
    if ((e.key === 'Enter' || e.type === 'click') && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, tagInput.trim()]
        }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async () => {
    if (!file || !formData.title) return;

    setIsUploading(true);
    try {
      // 1. Upload File
      const { file_url } = await archiflow.integrations.Core.UploadFile({ file });

      // 2. Create Document Entity
      const docData = {
        title: formData.title,
        description: formData.description,
        file_url: file_url,
        file_type: file.type.startsWith('image/') ? 'image' : 
                   file.type === 'application/pdf' ? 'pdf' : 
                   file.name.endsWith('.dwg') ? 'dwg' : 'other',
        file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        category: formData.category,
        folder_name: formData.folder_name,
        project_id: String(project.id),
        project_name: project.name,
        tags: formData.tags,
        // Optional link to task if selected
        ...(formData.taskId !== 'none' && { related_task_id: formData.taskId })
      };

      await archiflow.entities.Document.create(docData);

      // Send notification to client if they have a user account
      if (project?.client_id) {
        sendTemplate('documentUploaded', project.client_id, {
          projectName: project.name,
          projectId: project.id,
          documentTitle: formData.title,
          uploaderName: 'האדריכל'
        });
      }

      showSuccess('המסמך הועלה בהצלחה!');
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      showError('שגיאה בהעלאת המסמך');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>העלאת מסמך חדש</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Drop Area */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
            <input
              type="file"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-indigo-600">
                <FileText className="w-6 h-6" />
                <span className="font-medium truncate max-w-[200px]">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Upload className="w-8 h-8" />
                <span>לחץ או גרור קובץ לכאן</span>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">שם המסמך</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">תיקייה</Label>
              <div className="col-span-3">
                <div className="relative">
                  <Folder className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    list="folder-options" 
                    value={formData.folder_name}
                    onChange={(e) => setFormData({ ...formData, folder_name: e.target.value })}
                    placeholder="בחר או הקלד שם תיקייה"
                    className="pr-10"
                  />
                  <datalist id="folder-options">
                    {availableFolders.map(folder => (
                      <option key={folder} value={folder} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">קטגוריה</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData({ ...formData, category: val })}
                disabled={!!presetCategory}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plan">תוכנית אדריכלית</SelectItem>
                  <SelectItem value="contract">חוזה</SelectItem>
                  <SelectItem value="proposal">הצעת מחיר</SelectItem>
                  <SelectItem value="permit">היתר</SelectItem>
                  <SelectItem value="invoice">חשבונית</SelectItem>
                  <SelectItem value="report">דוח</SelectItem>
                  <SelectItem value="photo">תמונה</SelectItem>
                  <SelectItem value="specification">מפרט</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">תגיות</Label>
              <div className="col-span-3 space-y-2">
                <div className="relative">
                  <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="הקלד תגית ואנטר..."
                    className="pr-10"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="px-2 py-1 gap-1">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-red-500">
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="desc" className="text-right mt-2">תיאור</Label>
              <Textarea
                id="desc"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isUploading || !file || !formData.title}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                מעלה...
              </>
            ) : 'העלה מסמך'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}