import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Share2, X, Calendar, FileImage } from 'lucide-react';
import { showSuccess } from '../utils/notifications';
import FileDetailView from './FileDetailView';

export default function FilePreviewDialog({ file, onClose, onImageSelect }) {
  if (!file) return null;

  const isPdf = file.type === 'pdf' || file.url?.toLowerCase().endsWith('.pdf') || file.name?.toLowerCase().endsWith('.pdf');
  const isImage = !isPdf && (file.type === 'image' || file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i));

  const handleDownload = () => {
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showSuccess(`הקובץ "${file.name}" הורד בהצלחה ✓`);
  };

  const handleShare = () => {
    const shareUrl = `https://archiflow.app/library/${file.id}`;
    navigator.clipboard.writeText(shareUrl);
    showSuccess('קישור לשיתוף הועתק ללוח ✓');
  };

  return (
    <Dialog open={!!file} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileImage className="w-5 h-5" />
            {file.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* File Preview */}
          <div className="relative rounded-lg overflow-hidden bg-slate-100 min-h-[300px] flex items-center justify-center">
            {isPdf ? (
              <iframe
                src={`${file.url}#toolbar=0`}
                className="w-full h-[60vh]"
                title={file.name}
              />
            ) : isImage ? (
              <img
                src={file.url}
                alt={file.name}
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            ) : (
               <div className="text-center p-8 text-slate-500">
                 <FileImage className="w-16 h-16 mx-auto mb-4 opacity-50" />
                 <p>תצוגה מקדימה לא זמינה לסוג קובץ זה</p>
               </div>
            )}
          </div>

          {/* File Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs text-slate-500 mb-1">גודל קובץ</p>
              <p className="font-semibold text-slate-900">{file.size}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">תאריך העלאה</p>
              <p className="font-semibold text-slate-900 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {file.date}
              </p>
            </div>
          </div>

          {/* Tags */}
          {file.tags && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">תגיות</p>
              <div className="flex flex-wrap gap-2">
                {file.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Extended Details */}
          <FileDetailView file={file} onImageSelect={onImageSelect} />

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleDownload} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              <Download className="w-4 h-4 ml-2" />
              הורד קובץ
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1">
              <Share2 className="w-4 h-4 ml-2" />
              שתף
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}