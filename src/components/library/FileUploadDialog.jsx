import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function FileUploadDialog({ isOpen, onClose, folderName, category }) {
  const [files, setFiles] = useState([]);
  const [tags, setTags] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const uploadMutation = useMutation({
    mutationFn: async (fileData) => base44.entities.DesignAsset.create(fileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['designAssets'] });
    },
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    setUploading(true);
    try {
      // Upload each file
      for (const file of files) {
        // Upload file to storage
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        // Create asset record
        await uploadMutation.mutateAsync({
          name: file.name,
          category: category,
          file_url: file_url,
          file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          tags: tags.split(',').map(t => t.trim()).filter(t => t),
          description: description || null,
          metadata: {},
        });
      }
      
      showSuccess(`${files.length} קבצים הועלו בהצלחה!`);
      setFiles([]);
      setTags('');
      setDescription('');
      onClose();
    } catch (error) {
      showError('שגיאה בהעלאת קבצים');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">העלאת קבצים - {folderName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* File Input */}
          <div>
            <Label className="text-sm font-semibold">בחר קבצים</Label>
            <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept="image/*,.pdf,.dwg"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-1">גרור קבצים לכאן או לחץ לבחירה</p>
                <p className="text-xs text-slate-500">תמונות, PDF, DWG</p>
              </label>
            </div>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">קבצים נבחרו ({files.length})</Label>
              <div className="max-h-32 overflow-y-auto space-y-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                    <span className="text-sm truncate flex-1">{file.name}</span>
                    <span className="text-xs text-slate-500 mr-2">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <Label htmlFor="tags" className="text-sm font-semibold">תגיות (מופרדות בפסיקים)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="מודרני, עץ, טבעי"
              className="mt-2"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-semibold">תיאור (אופציונלי)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="הוסף תיאור לקבצים..."
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 ml-2" />
                  העלה ({files.length})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}