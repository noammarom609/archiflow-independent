import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Phone, 
  Users, 
  User, 
  FileText, 
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowLeftCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';

// Lead-specific workflow stages (simplified)
const leadStages = [
  {
    id: 'first_call',
    label: 'שיחה ראשונה',
    icon: Phone,
    subStages: [
      { id: 'phone_call', label: 'שיחת טלפון', icon: Phone },
      { id: 'first_meeting', label: 'פגישה פרונטלית', icon: Users },
      { id: 'client_card', label: 'כרטיס לקוח', icon: User },
    ]
  },
  {
    id: 'proposal',
    label: 'הצעת מחיר',
    icon: FileText,
    subStages: [
      { id: 'create_proposal', label: 'יצירת הצעה', icon: FileText },
      { id: 'proposal_approval', label: 'אישור + חתימה', icon: CheckCircle2 },
    ]
  },
];

export default function LeadWorkflowStepper({ 
  project, 
  currentStage, 
  currentSubStage,
  onStageClick,
  onSubStageClick,
  isProposalApproved = false,
  onConvertToProject,
  isConverting = false
}) {
  const [expandedStage, setExpandedStage] = useState(currentStage);
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  // Determine stage completion
  const isStageCompleted = (stageId) => {
    if (stageId === 'first_call') {
      return currentStage === 'proposal' || isProposalApproved;
    }
    if (stageId === 'proposal') {
      return isProposalApproved;
    }
    return false;
  };

  // Determine if stage is current
  const isStageCurrent = (stageId) => {
    return currentStage === stageId && !isProposalApproved;
  };

  // Determine sub-stage completion
  const isSubStageCompleted = (stageId, subStageId) => {
    if (isStageCompleted(stageId)) return true;
    
    if (stageId === 'first_call') {
      const subStageOrder = ['phone_call', 'first_meeting', 'client_card'];
      const currentIndex = subStageOrder.indexOf(currentSubStage);
      const subIndex = subStageOrder.indexOf(subStageId);
      return currentStage === 'proposal' || (currentStage === 'first_call' && subIndex < currentIndex);
    }
    
    if (stageId === 'proposal') {
      if (subStageId === 'create_proposal') {
        return currentSubStage === 'proposal_approval' || currentSubStage === 'approval';
      }
    }
    
    return false;
  };

  return (
    <Card className="border-2 border-primary/10 bg-gradient-to-b from-background to-muted/20">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">תהליך ליד</h3>
            <p className="text-xs text-muted-foreground">שלבים להפיכה לפרויקט</p>
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-2">
          {leadStages.map((stage, stageIndex) => {
            const StageIcon = stage.icon;
            const isCompleted = isStageCompleted(stage.id);
            const isCurrent = isStageCurrent(stage.id);
            const isExpanded = expandedStage === stage.id;
            
            return (
              <div key={stage.id}>
                {/* Stage Header */}
                <button
                  onClick={() => {
                    setExpandedStage(isExpanded ? null : stage.id);
                    onStageClick?.(stage.id);
                  }}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-xl transition-all
                    ${isCompleted 
                      ? 'bg-green-50 border-2 border-green-200' 
                      : isCurrent 
                        ? 'bg-primary/5 border-2 border-primary/30' 
                        : 'bg-muted/50 border-2 border-transparent hover:border-border'
                    }
                  `}
                >
                  {/* Stage indicator */}
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                    ${isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : isCurrent 
                        ? 'bg-primary text-white' 
                        : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StageIcon className="w-5 h-5" />
                    )}
                  </div>
                  
                  {/* Stage label */}
                  <div className="flex-1 text-right">
                    <p className={`font-medium ${isCompleted ? 'text-green-700' : isCurrent ? 'text-primary' : 'text-foreground'}`}>
                      {stage.label}
                    </p>
                    {isCompleted && (
                      <p className="text-xs text-green-600">הושלם</p>
                    )}
                    {isCurrent && (
                      <p className="text-xs text-primary">בתהליך</p>
                    )}
                  </div>
                  
                  {/* Expand indicator */}
                  {!isCompleted && (
                    <div className="text-muted-foreground">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </button>
                
                {/* Sub-stages */}
                <AnimatePresence>
                  {isExpanded && !isCompleted && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pr-6 pt-2 pb-1 space-y-1">
                        {stage.subStages.map((subStage, subIndex) => {
                          const SubIcon = subStage.icon;
                          const isSubCompleted = isSubStageCompleted(stage.id, subStage.id);
                          const isSubCurrent = currentSubStage === subStage.id || 
                            (subStage.id === 'create_proposal' && currentSubStage === 'initial') ||
                            (subStage.id === 'proposal_approval' && currentSubStage === 'approval');
                          
                          return (
                            <button
                              key={subStage.id}
                              onClick={() => {
                                const actualSubStage = subStage.id === 'create_proposal' ? 'initial' :
                                  subStage.id === 'proposal_approval' ? 'approval' : subStage.id;
                                onSubStageClick?.(stage.id, actualSubStage);
                              }}
                              className={`
                                w-full flex items-center gap-2 p-2 rounded-lg transition-all text-sm
                                ${isSubCompleted 
                                  ? 'text-green-600' 
                                  : isSubCurrent 
                                    ? 'bg-primary/10 text-primary font-medium' 
                                    : 'text-muted-foreground hover:bg-muted'
                                }
                              `}
                            >
                              <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center
                                ${isSubCompleted 
                                  ? 'bg-green-100' 
                                  : isSubCurrent 
                                    ? 'bg-primary/20' 
                                    : 'bg-muted'
                                }
                              `}>
                                {isSubCompleted ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <SubIcon className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <span>{subStage.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Connector line between stages */}
                {stageIndex < leadStages.length - 1 && (
                  <div className="flex justify-start pr-7 py-1">
                    <div className={`w-0.5 h-4 ${isStageCompleted(stage.id) ? 'bg-green-300' : 'bg-border'}`} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Success state when proposal is approved */}
          {isProposalApproved && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-gradient-to-l from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-green-800">הליד הפך לפרויקט פעיל!</p>
                  <p className="text-sm text-green-600">ניתן להמשיך לשלבי הביצוע</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manual Convert to Project Button */}
          {!isProposalApproved && onConvertToProject && (
            <div className="mt-6 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowConvertDialog(true)}
                disabled={isConverting}
                className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary"
              >
                <ArrowLeftCircle className="w-4 h-4" />
                העבר לפרויקט פעיל
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                לדילוג על שלב ההצעה
              </p>
            </div>
          )}
        </div>

        {/* Conversion Confirmation Dialog */}
        <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ArrowLeftCircle className="w-5 h-5 text-primary" />
                העברה לפרויקט פעיל
              </DialogTitle>
              <DialogDescription className="text-right">
                האם אתה בטוח שברצונך להעביר את הליד לפרויקט פעיל?
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">שים לב:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1 text-amber-700">
                    <li>פעולה זו תדלג על שלב הצעת המחיר הפורמלית</li>
                    <li>ניתן עדיין ליצור הצעה בהמשך</li>
                    <li>הפרויקט יעבור לשלב יצירת גנט</li>
                  </ul>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setShowConvertDialog(false)}
                disabled={isConverting}
              >
                ביטול
              </Button>
              <Button
                onClick={() => {
                  onConvertToProject?.();
                  setShowConvertDialog(false);
                }}
                disabled={isConverting}
                className="bg-primary hover:bg-primary/90"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מעביר...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    אשר והעבר
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
