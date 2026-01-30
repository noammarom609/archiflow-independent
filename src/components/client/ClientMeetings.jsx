import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Calendar, MapPin, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function ClientMeetings({ projectId }) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['clientJournal', projectId],
    queryFn: () => archiflow.entities.JournalEntry.filter({ 
      project_id: parseInt(projectId) || projectId, // Handle both string and number IDs
      shared_with_client: true 
    }, '-entry_date'),
    enabled: !!projectId
  });

  if (isLoading) {
    return <div className="text-center py-8">טוען יומן פרויקט...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            סיכומי פגישות ועדכונים
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>אין סיכומים המשותפים איתך כרגע</p>
            </div>
          ) : (
            <div className="space-y-6 relative border-r border-slate-200 mr-3">
              {entries.map((entry) => (
                <div key={entry.id} className="relative pr-8 pb-2">
                   {/* Timeline Dot */}
                   <div className="absolute -right-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-indigo-500 bg-white" />
                   
                   <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                     <div className="flex flex-col md:flex-row md:items-start justify-between mb-3 gap-2">
                       <div>
                         <h3 className="text-lg font-bold text-slate-900">{entry.title}</h3>
                         <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                           {entry.entry_date && (
                             <span className="flex items-center gap-1">
                               <Calendar className="w-3 h-3" />
                               {format(new Date(entry.entry_date), 'dd MMMM yyyy', { locale: he })}
                             </span>
                           )}
                           {entry.location && (
                             <span className="flex items-center gap-1">
                               <MapPin className="w-3 h-3" />
                               {entry.location}
                             </span>
                           )}
                         </div>
                       </div>
                       
                       <div className="flex gap-2">
                        {entry.category && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                            {entry.category}
                          </span>
                        )}
                       </div>
                     </div>

                     <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line bg-slate-50 p-4 rounded-lg">
                       {entry.content}
                     </div>

                     {/* Attachments */}
                     {entry.attachments && entry.attachments.length > 0 && (
                       <div className="mt-4 pt-4 border-t border-slate-100">
                         <p className="text-xs font-semibold text-slate-500 mb-2">קבצים מצורפים:</p>
                         <div className="flex flex-wrap gap-2">
                           {entry.attachments.map((att, idx) => (
                             <a 
                                key={idx} 
                                href={att.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
                             >
                               <FileText className="w-4 h-4" />
                               {att.name || 'קובץ מצורף'}
                             </a>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}