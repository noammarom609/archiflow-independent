import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  FileText,
  ChevronLeft,
  PhoneCall,
  Video,
  Users
} from 'lucide-react';

// Stage configuration for leads
const leadStageConfig = {
  phone_call: { 
    label: 'שיחה ראשונה', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Phone 
  },
  first_meeting: { 
    label: 'פגישה פרונטלית', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Users 
  },
  client_card: { 
    label: 'כרטיס לקוח', 
    color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: User 
  },
  proposal: { 
    label: 'הצעת מחיר', 
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: FileText 
  },
};

// Follow-up type icons
const followUpTypeIcons = {
  phone_call: PhoneCall,
  meeting: Users,
  zoom: Video,
};

export default function LeadCard({ 
  project, 
  nextFollowUp,
  onSelect, 
  onQuickCall,
  onScheduleFollowUp 
}) {
  // Determine current stage display
  const getCurrentStage = () => {
    if (project.current_stage === 'first_call') {
      return project.current_sub_stage || 'phone_call';
    }
    return 'proposal';
  };
  
  const currentStageKey = getCurrentStage();
  const stageConfig = leadStageConfig[currentStageKey] || leadStageConfig.phone_call;
  const StageIcon = stageConfig.icon;
  
  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
    });
  };
  
  // Format time helper
  const formatTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Check if follow-up is overdue
  const isOverdue = nextFollowUp && new Date(nextFollowUp.scheduled_at) < new Date();
  
  // Get client name
  const clientName = project.client_name || project.client || 'ליד חדש';
  const clientPhone = project.client_phone || '';
  
  // Get days since creation
  const getDaysSinceCreation = () => {
    if (!project.created_date) return null;
    const created = new Date(project.created_date);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysSinceCreation = getDaysSinceCreation();

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card 
        className={`
          cursor-pointer border-2 transition-all duration-200
          hover:shadow-lg hover:border-primary/30
          ${isOverdue ? 'border-red-200 bg-red-50/30' : 'border-border bg-white'}
        `}
        onClick={() => onSelect(project.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Left side - Main info */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {project.name || clientName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-xs">ליד חדש</span>
                    {clientPhone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {clientPhone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Stage badge + Days counter */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${stageConfig.color} border text-xs`}>
                  <StageIcon className="w-3 h-3 ml-1" />
                  {stageConfig.label}
                </Badge>
                
                {daysSinceCreation !== null && (
                  <span className="text-xs text-muted-foreground">
                    לפני {daysSinceCreation} ימים
                  </span>
                )}
              </div>
              
              {/* Next follow-up indicator */}
              {nextFollowUp && (
                <div className={`
                  mt-3 p-2 rounded-lg text-xs flex items-center gap-2
                  ${isOverdue 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-blue-50 text-blue-700'
                  }
                `}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {isOverdue ? 'באיחור: ' : 'Follow-up: '}
                    {formatDate(nextFollowUp.scheduled_at)}
                    {' '}
                    {formatTime(nextFollowUp.scheduled_at)}
                  </span>
                  {nextFollowUp.type && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      {nextFollowUp.type === 'phone_call' && 'שיחה'}
                      {nextFollowUp.type === 'meeting' && 'פגישה'}
                      {nextFollowUp.type === 'zoom' && 'זום'}
                    </>
                  )}
                </div>
              )}
            </div>
            
            {/* Right side - Quick actions */}
            <div className="flex flex-col gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickCall?.(project);
                }}
                title="התקשר"
              >
                <PhoneCall className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onScheduleFollowUp?.(project);
                }}
                title="תזמן follow-up"
              >
                <Calendar className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(project.id);
                }}
                title="פתח"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
