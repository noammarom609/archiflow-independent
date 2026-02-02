import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  Users, 
  FileText, 
  CheckCircle2, 
  Calendar,
  Clock,
  User,
  MessageSquare,
  Video,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import { FadeIn } from '@/components/animations';

// Journey step configuration
const journeySteps = [
  { 
    id: 'created', 
    label: 'ליד חדש', 
    icon: Sparkles,
    color: 'bg-blue-100 text-blue-600 border-blue-200'
  },
  { 
    id: 'phone_call', 
    label: 'שיחה ראשונה', 
    icon: Phone,
    color: 'bg-cyan-100 text-cyan-600 border-cyan-200'
  },
  { 
    id: 'first_meeting', 
    label: 'פגישה פרונטלית', 
    icon: Users,
    color: 'bg-purple-100 text-purple-600 border-purple-200'
  },
  { 
    id: 'client_card', 
    label: 'כרטיס לקוח', 
    icon: User,
    color: 'bg-indigo-100 text-indigo-600 border-indigo-200'
  },
  { 
    id: 'proposal', 
    label: 'הצעת מחיר', 
    icon: FileText,
    color: 'bg-amber-100 text-amber-600 border-amber-200'
  },
  { 
    id: 'approved', 
    label: 'אישור והפיכה לפרויקט', 
    icon: CheckCircle2,
    color: 'bg-green-100 text-green-600 border-green-200'
  },
];

// Follow-up type icons
const followUpTypeConfig = {
  phone_call: { label: 'שיחה', icon: Phone },
  meeting: { label: 'פגישה', icon: Users },
  zoom: { label: 'זום', icon: Video },
};

export default function LeadJourneyTimeline({ project }) {
  // Fetch follow-ups for this project
  const { data: followUps = [] } = useQuery({
    queryKey: ['leadFollowups', project?.id],
    queryFn: async () => {
      try {
        const result = await archiflow.entities.LeadFollowup.filter(
          { project_id: project.id },
          'scheduled_at'
        );
        return result || [];
      } catch (error) {
        console.log('LeadFollowup entity not available yet');
        return [];
      }
    },
    enabled: !!project?.id,
  });

  // Fetch proposals for this project
  const { data: proposals = [] } = useQuery({
    queryKey: ['projectProposals', project?.id],
    queryFn: async () => {
      try {
        const result = await archiflow.entities.Proposal.filter(
          { project_id: project.id },
          '-created_date'
        );
        return result || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!project?.id,
  });

  // Build timeline events
  const buildTimelineEvents = () => {
    const events = [];
    
    // 1. Project creation
    if (project?.created_date) {
      events.push({
        id: 'created',
        type: 'milestone',
        label: 'ליד נוצר',
        date: project.created_date,
        icon: Sparkles,
        color: 'bg-blue-100 text-blue-600',
      });
    }
    
    // 2. First call recording
    if (project?.first_call_recording_id) {
      events.push({
        id: 'phone_call',
        type: 'milestone',
        label: 'שיחה ראשונה הוקלטה',
        date: project.updated_date, // Approximate
        icon: Phone,
        color: 'bg-cyan-100 text-cyan-600',
      });
    }
    
    // 3. First meeting recording
    if (project?.first_meeting_recording_id) {
      events.push({
        id: 'first_meeting',
        type: 'milestone',
        label: 'פגישה פרונטלית התקיימה',
        date: project.updated_date, // Approximate
        icon: Users,
        color: 'bg-purple-100 text-purple-600',
      });
    }
    
    // 4. Add follow-ups
    const completedFollowUps = followUps.filter(f => f.completed_at);
    completedFollowUps.forEach((followUp) => {
      const typeConfig = followUpTypeConfig[followUp.type] || followUpTypeConfig.phone_call;
      events.push({
        id: `followup-${followUp.id}`,
        type: 'followup',
        label: `${typeConfig.label} - ${followUp.outcome === 'answered' ? 'ענו' : followUp.outcome === 'no_answer' ? 'לא ענו' : followUp.outcome}`,
        date: followUp.completed_at,
        icon: typeConfig.icon,
        color: 'bg-slate-100 text-slate-600',
        notes: followUp.notes,
      });
    });
    
    // 5. Proposal sent
    const sentProposal = proposals.find(p => p.status === 'sent' || p.status === 'approved');
    if (sentProposal) {
      events.push({
        id: 'proposal_sent',
        type: 'milestone',
        label: 'הצעת מחיר נשלחה',
        date: sentProposal.created_date,
        icon: FileText,
        color: 'bg-amber-100 text-amber-600',
      });
    }
    
    // 6. Proposal approved (conversion to project)
    const approvedProposal = proposals.find(p => p.status === 'approved');
    if (approvedProposal && approvedProposal.approved_at) {
      events.push({
        id: 'approved',
        type: 'milestone',
        label: 'הצעת מחיר אושרה',
        date: approvedProposal.approved_at,
        icon: CheckCircle2,
        color: 'bg-green-100 text-green-600',
        isConversion: true,
      });
    }
    
    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return events;
  };
  
  const timelineEvents = buildTimelineEvents();
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (timelineEvents.length === 0) {
    return null;
  }

  return (
    <FadeIn delay={0.1} direction="up" distance={10}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-5 h-5 text-primary" />
            מסע הלקוח
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-border" />
            
            {/* Timeline events */}
            <div className="space-y-4">
              {timelineEvents.map((event, index) => {
                const Icon = event.icon;
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex items-start gap-4 pr-2"
                  >
                    {/* Timeline dot */}
                    <div className={`
                      relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${event.color} border-2 border-white shadow-sm
                      ${event.isConversion ? 'ring-2 ring-green-300 ring-offset-2' : ''}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    
                    {/* Event content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground">
                          {event.label}
                        </span>
                        {event.isConversion && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            הפך לפרויקט
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(event.date)}
                      </p>
                      {event.notes && (
                        <p className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded p-2">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
