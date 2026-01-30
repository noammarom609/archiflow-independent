import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Users, 
  FileText, 
  Calendar, 
  Pencil, 
  Image, 
  ClipboardList,
  Hammer,
  CheckCircle2,
  Mic,
  DollarSign,
  Signature,
  ExternalLink,
  ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { createPageUrl } from '../../utils';
import { useNavigate } from 'react-router-dom';

const eventIcons = {
  phone_call: Phone,
  first_meeting: Users,
  proposal: FileText,
  gantt: Calendar,
  sketches: Pencil,
  renderings: Image,
  technical: ClipboardList,
  execution: Hammer,
  completion: CheckCircle2,
  recording: Mic,
  payment: DollarSign,
  signature: Signature,
  document: FileText,
};

const eventColors = {
  phone_call: 'bg-blue-100 text-blue-700 border-blue-200',
  first_meeting: 'bg-purple-100 text-purple-700 border-purple-200',
  proposal: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  gantt: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  sketches: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  renderings: 'bg-pink-100 text-pink-700 border-pink-200',
  technical: 'bg-orange-100 text-orange-700 border-orange-200',
  execution: 'bg-red-100 text-red-700 border-red-200',
  completion: 'bg-green-100 text-green-700 border-green-200',
  recording: 'bg-violet-100 text-violet-700 border-violet-200',
  payment: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  signature: 'bg-amber-100 text-amber-700 border-amber-200',
  document: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function ClientTimeline({ timeline = [], onEventClick }) {
  const navigate = useNavigate();

  // Navigate to related content
  const handleEventClick = (event) => {
    if (onEventClick) {
      onEventClick(event);
      return;
    }

    // Smart navigation based on event type and data
    if (event.project_id) {
      let url = createPageUrl('Projects') + `?id=${event.project_id}`;
      
      // Add specific context based on event type
      if (event.data?.recording_id) {
        // Navigate to recordings with specific recording
        url = createPageUrl('Recordings') + `?id=${event.data.recording_id}`;
      } else if (event.data?.document_id) {
        // Stay on project but could highlight document
        url = createPageUrl('Projects') + `?id=${event.project_id}&doc=${event.data.document_id}`;
      } else if (event.data?.proposal_id) {
        url = createPageUrl('Projects') + `?id=${event.project_id}&proposal=${event.data.proposal_id}`;
      }
      
      navigate(url);
    }
  };

  if (!timeline || timeline.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-indigo-600" />
            היסטוריית פעילות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>אין פעילות עדיין</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by date descending
  const sortedTimeline = [...timeline].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-indigo-600" />
          היסטוריית פעילות ({timeline.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          
          <div className="space-y-4">
            {sortedTimeline.map((event, index) => {
              const Icon = eventIcons[event.type] || FileText;
              const colorClass = eventColors[event.type] || eventColors.document;
              const hasLink = event.project_id || event.data?.recording_id || event.data?.document_id;
              
              return (
                <motion.div
                  key={event.date + index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative pr-12 group ${hasLink ? 'cursor-pointer' : ''}`}
                  onClick={() => hasLink && handleEventClick(event)}
                >
                  {/* Icon bubble */}
                  <div className={`absolute right-0 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  {/* Content */}
                  <div className={`p-4 rounded-xl border transition-all group-hover:shadow-md ${colorClass.replace('text-', 'hover:border-')}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-900">{event.title}</h4>
                          {hasLink && (
                            <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        {event.project_name && (
                          <p className="text-sm text-slate-500">
                            פרויקט: <span className="text-indigo-600 hover:underline">{event.project_name}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-left flex-shrink-0">
                        <p className="text-sm font-medium text-slate-700">
                          {format(new Date(event.date), 'd בMMMM yyyy', { locale: he })}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(event.date), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                      {event.stage && (
                        <Badge variant="outline" className="text-xs">
                          שלב: {event.stage}
                        </Badge>
                      )}
                      {event.data?.recording_id && (
                        <Badge variant="outline" className="text-xs bg-violet-50">
                          <Mic className="w-3 h-3 ml-1" />
                          הקלטה
                        </Badge>
                      )}
                      {event.data?.document_id && (
                        <Badge variant="outline" className="text-xs bg-amber-50">
                          <FileText className="w-3 h-3 ml-1" />
                          מסמך
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}