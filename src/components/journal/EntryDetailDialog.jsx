import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Users,
  Calendar,
  X,
  Download,
  Share2,
  Edit,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '../utils/notifications';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const categoryConfig = {
  meeting: { color: 'blue', label: 'פגישה' },
  site_visit: { color: 'purple', label: 'ביקור אתר' },
  decision: { color: 'green', label: 'החלטה' },
  milestone: { color: 'indigo', label: 'אבן דרך' },
  note: { color: 'amber', label: 'הערה' },
  issue: { color: 'red', label: 'בעיה' },
  achievement: { color: 'emerald', label: 'הישג' },
};

const moodEmojis = {
  positive: '😊',
  neutral: '😐',
  challenging: '😓',
};

export default function EntryDetailDialog({ entry, onClose, onEdit }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.JournalEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      showSuccess('הרשומה נמחקה בהצלחה');
      onClose();
    },
    onError: () => showError('שגיאה במחיקת הרשומה'),
  });

  if (!entry) return null;

  const config = categoryConfig[entry.category] || categoryConfig.note;
  const date = entry.entry_date || entry.created_date;
  
  if (!date) return null;
  
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  if (isNaN(dateObj.getTime())) return null;

  const handleViewInCalendar = () => {
    navigate(createPageUrl('Calendar') + `?date=${date}`);
  };

  const handleDelete = () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק רשומה זו?')) {
      deleteMutation.mutate(entry.id);
    }
  };

  return (
    <>
      <Dialog open={!!entry} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold text-slate-900 mb-3">
                  {entry.title}
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`bg-${config.color}-100 text-${config.color}-800 border-${config.color}-200`}>
                    {config.label}
                  </Badge>
                  {entry.project_name && (
                    <Badge variant="outline">{entry.project_name}</Badge>
                  )}
                  {entry.is_milestone && (
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                      🏆 אבן דרך
                    </Badge>
                  )}
                  {entry.shared_with_client && (
                    <Badge className="bg-blue-100 text-blue-800">
                      משותף עם לקוח
                    </Badge>
                  )}
                  {entry.mood && (
                    <span className="text-xl">{moodEmojis[entry.mood]}</span>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* Date & Meta */}
            <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">
                  {format(dateObj, 'dd MMMM yyyy, HH:mm', { locale: he })}
                </span>
              </div>
              {entry.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{entry.location}</span>
                </div>
              )}
              {entry.attendees && entry.attendees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{entry.attendees.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>
            </div>

            {/* Tags */}
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-700">תגיות:</span>
                {entry.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Attachments */}
            {entry.attachments && entry.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  קבצים מצורפים ({entry.attachments.length})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {entry.attachments.map((att, idx) => (
                    <div key={idx} className="group relative">
                      {att.type === 'image' ? (
                        <img
                          src={att.url}
                          alt={att.name || 'attachment'}
                          className="w-full h-32 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-indigo-400 transition-colors"
                          onClick={() => setSelectedImage(att.url)}
                        />
                      ) : (
                        <div className="w-full h-32 bg-slate-100 rounded-lg border-2 border-slate-200 flex flex-col items-center justify-center gap-2 hover:border-indigo-400 transition-colors cursor-pointer">
                          <FileText className="w-8 h-8 text-slate-400" />
                          <span className="text-xs text-slate-600 px-2 text-center truncate w-full">
                            {att.name}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Entries */}
            {entry.related_entries && entry.related_entries.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2">
                  רשומות קשורות ({entry.related_entries.length})
                </h4>
                <div className="text-sm text-slate-600">
                  {/* This would need to fetch and display related entries */}
                  <p className="text-xs text-slate-500">מקושר לרשומות נוספות</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-slate-200 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewInCalendar}
                className="flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                הצג בלוח שנה
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit && onEdit(entry)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                ערוך
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                שתף
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                הורד PDF
              </Button>
              <div className="flex-1"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 text-white hover:bg-white/20"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={selectedImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}