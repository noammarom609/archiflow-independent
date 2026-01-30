import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, X, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const categoryLabels = {
  contract: 'חוזה',
  proposal: 'הצעת מחיר',
  plan: 'תוכנית אדריכלית',
  rendering: 'הדמיה',
  permit: 'היתר',
  invoice: 'חשבונית',
  report: 'דוח',
  photo: 'תמונה',
  specification: 'מפרט',
  other: 'אחר',
};

export default function DocumentPreviewDialog({ document: doc, onClose }) {
  if (!doc) return null;

  const type = doc.file_type?.toLowerCase();
  const isPdf = type === 'pdf' || doc.file_url?.toLowerCase().endsWith('.pdf');
  const isImage = type === 'image' || type === 'photo' || doc.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = doc.file_url;
    link.download = doc.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(doc.file_url, '_blank');
  };

  return (
    <Dialog open={!!doc} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {doc.title}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 ml-1" />
                הורד
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                <ExternalLink className="w-4 h-4 ml-1" />
                פתח בחלון חדש
              </Button>
            </div>
          </div>
          
          {/* Document Info */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
            <Badge variant="outline">
              {categoryLabels[doc.category] || 'מסמך'}
            </Badge>
            {doc.file_size && (
              <span>{doc.file_size}</span>
            )}
            {doc.created_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(doc.created_date), 'd MMMM yyyy', { locale: he })}
              </span>
            )}
          </div>
          {doc.description && (
            <p className="text-sm text-slate-600 mt-2">{doc.description}</p>
          )}
        </DialogHeader>

        {/* Preview Area */}
        <div className="flex-1 bg-slate-100 rounded-lg overflow-hidden mt-4">
          {isPdf ? (
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(doc.file_url)}&embedded=true`}
              className="w-full h-full border-none"
              title={doc.title}
            >
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <p>טוען תצוגה מקדימה...</p>
                <Button variant="link" onClick={handleDownload}>אם התצוגה לא עולה, לחץ להורדה</Button>
              </div>
            </iframe>
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img
                src={doc.file_url}
                alt={doc.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
              <FileText className="w-16 h-16 mb-4" />
              <p>לא ניתן להציג תצוגה מקדימה לסוג קובץ זה</p>
              <Button variant="outline" className="mt-4" onClick={handleDownload}>
                <Download className="w-4 h-4 ml-2" />
                הורד את הקובץ
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}