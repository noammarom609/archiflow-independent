import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pencil, 
  Upload, 
  Eye, 
  CheckCircle2,
  FileText,
  Send,
  Calendar,
  Loader2,
  CalendarPlus
} from 'lucide-react';
import { archiflow } from '@/api/archiflow';
import { showSuccess, showError } from '../../utils/notifications';
import DocumentApprovalSubStage from './substages/DocumentApprovalSubStage';
import ProjectMeetingSchedulerModal from '../scheduling/ProjectMeetingSchedulerModal';

const subStages = [
  { id: 'upload', label: 'העלאת סקיצות', icon: Upload },
  { id: 'present', label: 'הצגה ללקוח', icon: Eye },
  { id: 'approve', label: 'אישור + חתימה', icon: CheckCircle2 },
];

export default function SketchesStage({ project, onUpdate, onSubStageChange, currentSubStage }) {
  // Initialize from prop if available to prevent overwriting saved value
  const [activeSubStage, setActiveSubStage] = useState(() => {
    const reverseMap = {
      'upload_sketches': 'upload',
      'present_sketches': 'present',
      'approve_sketches': 'approve',
    };
    if (currentSubStage && reverseMap[currentSubStage]) {
      return reverseMap[currentSubStage];
    }
    return 'upload';
  });
  const [completedSubStages, setCompletedSubStages] = useState([]);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);

  // Track if change came from parent to prevent loops
  const isExternalChange = React.useRef(false);
  // Track if initial sync is done to prevent saving on mount
  const initialSyncDone = React.useRef(false);

  // Sync from parent Stepper when sub-stage is clicked there
  React.useEffect(() => {
    if (currentSubStage) {
      const reverseMap = {
        'upload_sketches': 'upload',
        'present_sketches': 'present',
        'approve_sketches': 'approve',
      };
      const mappedSubStage = reverseMap[currentSubStage];
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

  // Notify parent of sub-stage changes (only if internal change AND initial sync is done)
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
      const subStageMap = { upload: 'upload_sketches', present: 'present_sketches', approve: 'approve_sketches' };
      onSubStageChange(subStageMap[activeSubStage] || activeSubStage);
    }
  }, [activeSubStage]);

  const handleSubStageComplete = (subStageId) => {
    if (!completedSubStages.includes(subStageId)) {
      setCompletedSubStages([...completedSubStages, subStageId]);
    }
    
    const currentIndex = subStages.findIndex(s => s.id === subStageId);
    if (currentIndex < subStages.length - 1) {
      setActiveSubStage(subStages[currentIndex + 1].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule Meeting Button - Show in present/approve stages */}
      {(activeSubStage === 'present' || activeSubStage === 'approve') && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-indigo-900">שלח קישור לתיאום פגישה להצגת סקיצות</h4>
              <p className="text-sm text-indigo-700">אפשר ללקוח לבחור מועד נוח מתוך הזמנים הפנויים שלך</p>
            </div>
            <Button
              onClick={() => setShowMeetingScheduler(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              שלח קישור תיאום
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Meeting Scheduler Modal */}
      <ProjectMeetingSchedulerModal
        isOpen={showMeetingScheduler}
        onClose={() => setShowMeetingScheduler(false)}
        project={project}
        meetingTitle={`פגישת סקיצות - ${project?.name || ''}`}
        meetingContext={`הצגת סקיצות ראשוניות ללקוח ${project?.client || ''}`}
      />

      {/* Sub-Stage Content - No navigation tabs, controlled by Stepper */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubStage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <DocumentApprovalSubStage
            type="sketches"
            typeLabel="סקיצות"
            project={project}
            activeSubStage={activeSubStage}
            onComplete={handleSubStageComplete}
            onUpdate={onUpdate}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}