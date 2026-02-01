import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Image, 
  Upload, 
  Eye, 
  CheckCircle2,
  FileText,
  MessageSquare,
  CalendarPlus
} from 'lucide-react';
import DocumentApprovalSubStage from './substages/DocumentApprovalSubStage';
import { showSuccess } from '../../utils/notifications';
import ProjectMeetingSchedulerModal from '../scheduling/ProjectMeetingSchedulerModal';

const subStages = [
  { id: 'upload', label: 'העלאת הדמיות', icon: Upload },
  { id: 'present', label: 'הצגה ללקוח', icon: Eye },
  { id: 'approve', label: 'אישור + חתימה', icon: CheckCircle2 },
];

export default function RenderingsStage({ project, onUpdate, onSubStageChange, currentSubStage }) {
  // Initialize from prop if available to prevent overwriting saved value
  const [activeSubStage, setActiveSubStage] = useState(() => {
    const reverseMap = {
      'upload_renderings': 'upload',
      'present_renderings': 'present',
      'approve_renderings': 'approve',
    };
    if (currentSubStage && reverseMap[currentSubStage]) {
      return reverseMap[currentSubStage];
    }
    return 'upload';
  });
  const [completedSubStages, setCompletedSubStages] = useState([]);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [preparationNotes, setPreparationNotes] = useState(project?.renderings_notes || '');

  // Track if change came from parent to prevent loops
  const isExternalChange = React.useRef(false);
  // Track if initial sync is done to prevent saving on mount
  const initialSyncDone = React.useRef(false);

  // Sync from parent Stepper when sub-stage is clicked there
  React.useEffect(() => {
    if (currentSubStage) {
      const reverseMap = {
        'upload_renderings': 'upload',
        'present_renderings': 'present',
        'approve_renderings': 'approve',
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
      const subStageMap = { upload: 'upload_renderings', present: 'present_renderings', approve: 'approve_renderings' };
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
      {/* Sub-Stage Content - No navigation tabs, controlled by Stepper */}
      
      {/* Schedule Meeting Button - Show in present/approve stages */}
      {(activeSubStage === 'present' || activeSubStage === 'approve') && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h4 className="font-medium text-indigo-900">שלח קישור לתיאום פגישה להצגת הדמיות</h4>
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
        meetingTitle={`פגישת הדמיות - ${project?.name || ''}`}
        meetingContext={`הצגת הדמיות ללקוח ${project?.client || ''}`}
      />

      {/* Preparation Notes - Visible in present stage */}
      {activeSubStage === 'present' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-800">
              <MessageSquare className="w-5 h-5" />
              הערות ושאלות הכנה לתוכנית
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={preparationNotes}
              onChange={(e) => setPreparationNotes(e.target.value)}
              placeholder="רשום כאן הערות, שאלות ונקודות חשובות להכנת התוכנית הטכנית..."
              className="min-h-[150px] bg-white"
            />
            <Button 
              variant="outline" 
              className="mt-3"
              onClick={() => {
                if (onUpdate) {
                  onUpdate({ renderings_notes: preparationNotes });
                  showSuccess('הערות נשמרו!');
                }
              }}
            >
              שמור הערות
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sub-Stage Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubStage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <DocumentApprovalSubStage
            type="renderings"
            typeLabel="הדמיות"
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