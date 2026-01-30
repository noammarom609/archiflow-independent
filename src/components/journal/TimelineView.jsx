import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Calendar,
  TrendingUp,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';

const categoryConfig = {
  meeting: { icon: Users, color: 'blue', label: 'פגישה' },
  site_visit: { icon: MapPin, color: 'purple', label: 'ביקור אתר' },
  decision: { icon: CheckCircle2, color: 'green', label: 'החלטה' },
  milestone: { icon: TrendingUp, color: 'indigo', label: 'אבן דרך' },
  note: { icon: Lightbulb, color: 'amber', label: 'הערה' },
  issue: { icon: AlertCircle, color: 'red', label: 'בעיה' },
  achievement: { icon: CheckCircle2, color: 'emerald', label: 'הישג' },
};

const moodConfig = {
  positive: { color: 'bg-green-100 border-green-300', emoji: '😊' },
  neutral: { color: 'bg-slate-100 border-slate-300', emoji: '😐' },
  challenging: { color: 'bg-orange-100 border-orange-300', emoji: '😓' },
};

export default function TimelineView({ entries, onEntryClick }) {
  // Group entries by month
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = entry.entry_date || entry.created_date;
    if (!date) return acc;
    
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
      if (isNaN(dateObj.getTime())) return acc;
      
      const month = format(dateObj, 'MMMM yyyy', { locale: he });
      if (!acc[month]) acc[month] = [];
      acc[month].push(entry);
    } catch (e) {
      console.error('Invalid date:', date);
    }
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(groupedEntries).map(([month, monthEntries], monthIndex) => (
        <div key={month}>
          {/* Month Header */}
          <div className="sticky top-0 z-10 bg-slate-50 py-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{month}</h3>
                <p className="text-sm text-slate-600">{monthEntries.length} רשומות</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute right-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-purple-300 to-transparent"></div>

            {/* Entries */}
            <div className="space-y-8">
              {monthEntries.map((entry, index) => {
                const date = entry.entry_date || entry.created_date;
                if (!date) return null;
                
                const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
                if (isNaN(dateObj.getTime())) return null;
                
                const config = categoryConfig[entry.category] || categoryConfig.note;
                const Icon = config.icon;
                const mood = moodConfig[entry.mood] || moodConfig.neutral;

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pr-16"
                  >
                    {/* Timeline Dot */}
                    <div className={`absolute right-3 top-6 w-6 h-6 bg-${config.color}-600 rounded-full border-4 border-slate-50 shadow-lg flex items-center justify-center`}>
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>

                    {/* Entry Card */}
                    <Card
                      onClick={() => onEntryClick(entry)}
                      className={`border-2 ${mood.color} hover:shadow-xl transition-all duration-300 cursor-pointer group`}
                    >
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-12 h-12 bg-${config.color}-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                              <Icon className={`w-6 h-6 text-${config.color}-600`} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                {entry.title}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`bg-${config.color}-100 text-${config.color}-800 border-${config.color}-200`}>
                                  {config.label}
                                </Badge>
                                {entry.project_name && (
                                  <Badge variant="outline" className="text-xs">
                                    {entry.project_name}
                                  </Badge>
                                )}
                                {entry.is_milestone && (
                                  <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white">
                                    🏆 אבן דרך
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className="text-2xl">{mood.emoji}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {format(dateObj, 'dd MMM', { locale: he })}
                              </p>
                              <p className="text-xs text-slate-500">
                                {format(dateObj, 'HH:mm', { locale: he })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <p className="text-slate-700 leading-relaxed mb-4 line-clamp-3">
                          {entry.content}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                          {entry.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{entry.location}</span>
                            </div>
                          )}
                          {entry.attendees && entry.attendees.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{entry.attendees.length} משתתפים</span>
                            </div>
                          )}
                          {entry.attachments && entry.attachments.length > 0 && (
                            <div className="flex items-center gap-1">
                              <ImageIcon className="w-4 h-4" />
                              <span>{entry.attachments.length} קבצים</span>
                            </div>
                          )}
                          {entry.shared_with_client && (
                            <Badge variant="outline" className="text-xs">
                              משותף עם לקוח
                            </Badge>
                          )}
                        </div>

                        {/* Tags */}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex items-center gap-2 mt-4 flex-wrap">
                            {entry.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Attachments Preview */}
                        {entry.attachments && entry.attachments.filter(a => a.type === 'image').length > 0 && (
                          <div className="flex gap-2 mt-4 overflow-x-auto">
                            {entry.attachments
                              .filter(a => a.type === 'image')
                              .slice(0, 4)
                              .map((att, idx) => (
                                <img
                                  key={idx}
                                  src={att.url}
                                  alt={att.name || 'attachment'}
                                  className="w-20 h-20 object-cover rounded-lg border-2 border-slate-200"
                                />
                              ))}
                            {entry.attachments.filter(a => a.type === 'image').length > 4 && (
                              <div className="w-20 h-20 bg-slate-100 rounded-lg border-2 border-slate-200 flex items-center justify-center text-sm text-slate-600">
                                +{entry.attachments.filter(a => a.type === 'image').length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}