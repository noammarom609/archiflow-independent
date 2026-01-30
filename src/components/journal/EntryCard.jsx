import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, User, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const categoryColors = {
  meeting: 'bg-blue-100 text-blue-800 border-blue-200',
  site_visit: 'bg-green-100 text-green-800 border-green-200',
  decision: 'bg-purple-100 text-purple-800 border-purple-200',
  milestone: 'bg-orange-100 text-orange-800 border-orange-200',
  note: 'bg-slate-100 text-slate-800 border-slate-200',
};

const categoryLabels = {
  meeting: 'פגישה',
  site_visit: 'ביקור אתר',
  decision: 'החלטה',
  milestone: 'אבן דרך',
  note: 'הערה',
};

export default function EntryCard({ entry, onClick, index }) {
  const categoryColor = categoryColors[entry.category] || categoryColors.note;
  const categoryLabel = categoryLabels[entry.category] || 'הערה';
  
  const dateStr = entry.entry_date || entry.created_date || entry.date;
  if (!dateStr) return null;
  
  const dateObj = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(dateObj.getTime())) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
    >
      <Card className="border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
        {/* Top Color Bar */}
        <div className={`h-1 ${categoryColor.replace('text-', 'bg-').replace('100', '400')}`} />
        
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-slate-900 mb-2">{entry.title}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" strokeWidth={1.5} />
                  <span>{format(dateObj, 'dd MMMM yyyy', { locale: he })}</span>
                </div>
                {entry.project && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" strokeWidth={1.5} />
                    <span>{entry.project}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge className={`${categoryColor} border font-medium`}>
              {categoryLabel}
            </Badge>
          </div>

          {/* Content Preview */}
          <p className="text-slate-700 mb-4 line-clamp-3">{entry.content}</p>

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              {entry.location && (
                <>
                  <MapPin className="w-4 h-4" strokeWidth={1.5} />
                  <span>{entry.location}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User className="w-4 h-4" strokeWidth={1.5} />
              <span>{entry.author}</span>
            </div>
          </div>

          {/* Attachments indicator */}
          {entry.attachments && entry.attachments.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              {entry.attachments.slice(0, 3).map((attachment, idx) => (
                <div
                  key={idx}
                  className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden"
                >
                  {attachment.type === 'image' ? (
                    <img src={attachment.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">
                      {attachment.type}
                    </div>
                  )}
                </div>
              ))}
              {entry.attachments.length > 3 && (
                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
                  +{entry.attachments.length - 3}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}