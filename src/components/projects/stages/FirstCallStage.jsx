import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Phone, 
  Users, 
  FileText, 
  Upload, 
  Mic, 
  MicOff,
  Play,
  Square,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronLeft,
  ArrowLeft
} from 'lucide-react';
import PhoneCallSubStage from './substages/PhoneCallSubStage';
import FirstMeetingSubStage from './substages/FirstMeetingSubStage';
import ClientCardSubStage from './substages/ClientCardSubStage';

const subStages = [
  { 
    id: 'phone_call', 
    label: 'שיחת טלפון', 
    icon: Phone,
    description: 'הקלטה או העלאת שיחת טלפון לתמלול וניתוח AI'
  },
  { 
    id: 'first_meeting', 
    label: 'פגישה פרונטלית', 
    icon: Users,
    description: 'צ׳קליסט בירור צרכים + הקלטה חיה + סיכום AI'
  },
  { 
    id: 'client_card', 
    label: 'כרטיס לקוח', 
    icon: FileText,
    description: 'יצירת כרטיס לקוח מתוך נתוני הניתוח'
  },
];

export default function FirstCallStage({ project, onUpdate, onSubStageChange, currentSubStage }) {
  // Initialize from prop if available to prevent overwriting saved value
  const [activeSubStage, setActiveSubStage] = useState(() => {
    if (currentSubStage && ['phone_call', 'first_meeting', 'client_card'].includes(currentSubStage)) {
      return currentSubStage;
    }
    return 'phone_call';
  });
  const [completedSubStages, setCompletedSubStages] = useState([]);

  // Track if change came from parent to prevent loops
  const isExternalChange = React.useRef(false);
  // Track if initial sync is done to prevent saving on mount
  const initialSyncDone = React.useRef(false);

  // Sync from parent Stepper when sub-stage is clicked there
  React.useEffect(() => {
    if (currentSubStage) {
      const subStageMap = {
        'phone_call': 'phone_call',
        'first_meeting': 'first_meeting',
        'client_card': 'client_card',
      };
      const mappedSubStage = subStageMap[currentSubStage];
      if (mappedSubStage && mappedSubStage !== activeSubStage) {
        isExternalChange.current = true;
        setActiveSubStage(mappedSubStage);
      }
    }
    // Mark initial sync as done after first currentSubStage update
    if (!initialSyncDone.current && currentSubStage) {
      initialSyncDone.current = true;
    }
  }, [currentSubStage]);

  // Notify parent when active sub-stage changes (only if internal change AND initial sync is done)
  React.useEffect(() => {
    if (isExternalChange.current) {
      isExternalChange.current = false;
      return;
    }
    // Don't notify on initial mount - wait for sync from parent first
    if (!initialSyncDone.current) {
      return;
    }
    if (onSubStageChange) {
      onSubStageChange(activeSubStage);
    }
  }, [activeSubStage]);

  // Track if initial load completed to avoid auto-advancing after user action
  const initialLoadDone = React.useRef(false);

  // Initialize completed stages based on project data - only on initial load
  React.useEffect(() => {
    const completed = [];
    if (project?.first_call_recording_id) {
      completed.push('phone_call');
    }
    if (project?.first_meeting_recording_id || project?.client_needs_checklist?.some(c => c.checked)) {
      completed.push('phone_call', 'first_meeting');
    }
    if (project?.client_id) {
      completed.push('phone_call', 'first_meeting', 'client_card');
    }
    setCompletedSubStages([...new Set(completed)]);
    
    // Only set active substage on initial load, not when project data updates
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      // Use saved currentSubStage from database if available
      if (currentSubStage && ['phone_call', 'first_meeting', 'client_card'].includes(currentSubStage)) {
        setActiveSubStage(currentSubStage);
      } else {
        // Fallback to completion-based logic only if no saved sub-stage
        if (!completed.includes('phone_call')) {
          setActiveSubStage('phone_call');
        } else if (!completed.includes('first_meeting')) {
          setActiveSubStage('first_meeting');
        } else if (!completed.includes('client_card')) {
          setActiveSubStage('client_card');
        }
      }
    }
  }, [project?.first_call_recording_id, project?.first_meeting_recording_id, project?.client_id, project?.client_needs_checklist, currentSubStage]);

  const handleSubStageComplete = (subStageId, autoAdvance = false) => {
    if (!completedSubStages.includes(subStageId)) {
      setCompletedSubStages([...completedSubStages, subStageId]);
    }
    
    // Only move to next sub-stage if autoAdvance is true (user clicked continue button)
    if (autoAdvance) {
      const currentIndex = subStages.findIndex(s => s.id === subStageId);
      if (currentIndex < subStages.length - 1) {
        setActiveSubStage(subStages[currentIndex + 1].id);
      }
    }
  };

  const renderSubStageContent = () => {
    switch (activeSubStage) {
      case 'phone_call':
        return (
          <PhoneCallSubStage 
            project={project} 
            onComplete={() => handleSubStageComplete('phone_call', false)}
            onContinue={() => handleSubStageComplete('phone_call', true)}
            onUpdate={onUpdate}
          />
        );
      case 'first_meeting':
        return (
          <FirstMeetingSubStage 
            project={project} 
            onComplete={() => handleSubStageComplete('first_meeting', false)}
            onContinue={() => handleSubStageComplete('first_meeting', true)}
            onUpdate={onUpdate}
          />
        );
      case 'client_card':
        return (
          <ClientCardSubStage 
            project={project} 
            onComplete={() => handleSubStageComplete('client_card', false)}
            onContinue={() => handleSubStageComplete('client_card', true)}
            onUpdate={onUpdate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Stage Content - No navigation tabs, controlled by Stepper */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubStage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderSubStageContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}