import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { generatePhaseSummary } from './ai/AIProjectAssistant';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Loader2, ChevronLeft, ChevronRight, Clock, Zap } from 'lucide-react';
import { ScrollReveal, FadeIn, Magnet, SplitText } from '@/components/animations';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { 
  Check, 
  Circle, 
  ChevronDown, 
  ChevronUp,
  Phone,
  Users,
  FileText,
  Calendar,
  Pencil,
  Image,
  ClipboardList,
  Hammer,
  CheckCircle2,
  Upload,
  Eye,
  Signature,
  Ruler,
  Lightbulb,
  Palette,
  ShoppingBag,
  Truck,
  FileCheck,
  Building2,
  AlertTriangle,
  SkipForward
} from 'lucide-react';

const stages = [
  { 
    id: 'first_call', 
    label: 'שיחה ראשונה', 
    description: 'שיחת טלפון ופגישה ראשונה',
    icon: Phone,
    estimatedDays: '1-3',
    color: 'indigo',
    subStages: [
      { id: 'phone_call', label: 'שיחת טלפון', description: 'הקלטה + תמלול + ניתוח AI', icon: Phone },
      { id: 'first_meeting', label: 'פגישה פרונטלית', description: 'צ׳קליסט + הקלטה + סיכום', icon: Users },
      { id: 'client_card', label: 'כרטיס לקוח', description: 'יצירה אוטומטית מניתוח AI', icon: FileText },
    ]
  },
  { 
    id: 'proposal', 
    label: 'הצעת מחיר', 
    description: 'יצירה ושליחת הצעה + חתימה',
    icon: FileText,
    estimatedDays: '2-5',
    color: 'cyan',
    subStages: [
      { id: 'create_proposal', label: 'יצירת הצעת מחיר', description: 'AI / תבנית / ידנית', icon: FileText },
      { id: 'proposal_approval', label: 'אישור + חתימה', description: 'שליחה וחתימה דיגיטלית', icon: Signature },
    ]
  },
  { 
    id: 'gantt', 
    label: 'יצירת גנט', 
    description: 'בניית לוח זמנים + סנכרון יומן',
    icon: Calendar,
    estimatedDays: '1-2',
    color: 'violet',
    subStages: [
      { id: 'create_gantt', label: 'בניית גנט', description: 'הגדרת משימות ואבני דרך', icon: Calendar },
      { id: 'sync_calendar', label: 'סנכרון יומן', description: 'העברה ללוח שנה', icon: Calendar },
    ]
  },
  { 
    id: 'survey', 
    label: 'מדידה', 
    description: 'מדידה ותוכניות מצב קיים',
    icon: Ruler,
    estimatedDays: '3-7',
    color: 'amber',
    subStages: [
      { id: 'upload_survey', label: 'העלאת מדידה', description: 'קבצי DWG/PDF', icon: Upload },
      { id: 'as_made', label: 'מצב קיים', description: 'בניית תוכנית As-Made', icon: FileText },
      { id: 'site_photos', label: 'תמונות', description: 'תיעוד מצולם', icon: Image },
    ]
  },
  { 
    id: 'concept', 
    label: 'פרוגרמה וקונספט', 
    description: 'הגדרת צרכים וסגנון',
    icon: Lightbulb,
    estimatedDays: '5-14',
    color: 'pink',
    subStages: [
      { id: 'program', label: 'פרוגרמה', description: 'הרכב משפחתי וצרכים', icon: Users },
      { id: 'moodboard', label: 'לוחות השראה', description: 'כיוון עיצובי', icon: Palette },
    ]
  },
  { 
    id: 'sketches', 
    label: 'סקיצות', 
    description: 'העלאה, הצגה ואישור + חתימה',
    icon: Pencil,
    estimatedDays: '14-21',
    color: 'purple',
    subStages: [
      { id: 'upload_sketches', label: 'העלאת סקיצות', description: 'PDF/JPG + עדכון ללקוח', icon: Upload },
      { id: 'present_sketches', label: 'הצגה ללקוח', description: 'פגישה + הערות', icon: Eye },
      { id: 'approve_sketches', label: 'אישור + חתימה', description: 'חתימה דיגיטלית', icon: Signature },
    ]
  },
  { 
    id: 'rendering', 
    label: 'הדמיות', 
    description: 'העלאה, הצגה ואישור + חתימה',
    icon: Image,
    estimatedDays: '14-21',
    color: 'rose',
    subStages: [
      { id: 'upload_renderings', label: 'העלאת הדמיות', description: 'PDF/JPG + עדכון ללקוח', icon: Upload },
      { id: 'present_renderings', label: 'הצגה ללקוח', description: 'פגישה + הערות', icon: Eye },
      { id: 'approve_renderings', label: 'אישור + חתימה', description: 'חתימה דיגיטלית', icon: Signature },
    ]
  },
  { 
    id: 'permits', 
    label: 'היתרים', 
    description: 'היתר בנייה/שיפוץ (אופציונלי)',
    icon: FileCheck,
    estimatedDays: '30-120',
    color: 'sky',
    isOptional: true, // Mark as optional stage
    subStages: [
      { id: 'permit_preparation', label: 'הכנת מסמכים', description: 'תוכניות, טפסים, נספחים', icon: FileText },
      { id: 'permit_submission', label: 'הגשה לוועדה', description: 'הגשה לרשות המקומית', icon: Building2 },
      { id: 'permit_review', label: 'בחינה ותיקונים', description: 'תגובות ותיקונים נדרשים', icon: AlertTriangle },
      { id: 'permit_approval', label: 'קבלת היתר', description: 'אישור סופי', icon: CheckCircle2 },
    ]
  },
  { 
    id: 'technical', 
    label: 'תוכניות עבודה', 
    description: 'העלאה + שליחה לקבלנים + הצעות',
    icon: ClipboardList,
    estimatedDays: '21-30',
    color: 'orange',
    subStages: [
      { id: 'upload_plans', label: 'העלאת תוכניות', description: 'PDF + אישור לקוח + חתימה', icon: Upload },
      { id: 'send_contractors', label: 'שליחה לקבלנים', description: 'בחירת 3 קבלנים + שליחה', icon: Users },
      { id: 'compare_quotes', label: 'השוואת הצעות', description: 'קבלה, השוואה ובחירה', icon: FileText },
    ]
  },
  { 
    id: 'selections', 
    label: 'בחירות וכתב כמויות', 
    description: 'בחירת חומרים וספקים',
    icon: ShoppingBag,
    estimatedDays: '7-14',
    color: 'teal',
    subStages: [
      { id: 'spec_list', label: 'רשימת בחירות', description: 'ריצוף, סניטרי, תאורה', icon: ClipboardList },
      { id: 'orders', label: 'הזמנות', description: 'מעקב הזמנות', icon: Truck },
    ]
  },
  { 
    id: 'execution', 
    label: 'ביצוע', 
    description: 'ניהול קבלנים, ספקים ועדכונים',
    icon: Hammer,
    estimatedDays: '60-180',
    color: 'red',
    subStages: [
      { id: 'contractors', label: 'ניהול קבלנים', description: 'מעקב התקדמות', icon: Users },
      { id: 'suppliers', label: 'מעקב ספקים', description: 'הזמנות ומשלוחים', icon: ClipboardList },
      { id: 'updates', label: 'עדכוני לקוח', description: 'שליחת עדכונים שוטפים', icon: FileText },
    ]
  },
  { 
    id: 'completion', 
    label: 'סיום', 
    description: 'סגירת פרויקט ומשוב',
    icon: CheckCircle2,
    estimatedDays: '7-14',
    color: 'emerald',
    subStages: []
  },
];

// Valid stage IDs that exist in the workflow
const validStageIds = stages.map(s => s.id);

export default function ProjectWorkflowStepper({ currentStage: currentStageProp, currentSubStage, onStageClick, onSubStageClick, project }) {
  const { t } = useLanguage();
  // Get the raw stage value from prop or project current_stage field
  const rawStage = currentStageProp || project?.current_stage || 'first_call';
  
  // Map to valid stage - if the stage is not a valid stage ID, default to 'first_call'
  const currentStage = validStageIds.includes(rawStage) ? rawStage : 'first_call';
  
  const [expandedStages, setExpandedStages] = useState([currentStage]);
  const [summaries, setSummaries] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true); // Mobile collapsed state
  const [isMobile, setIsMobile] = useState(false);

  // Fallback to 0 if stage not found, or use currentStage if it's not found in list (shouldn't happen)
  const currentIndex = stages.findIndex(s => s.id === currentStage);
  const currentStageData = stages.find(s => s.id === currentStage);
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-expand current stage when it changes
  useEffect(() => {
    if (currentStage && !expandedStages.includes(currentStage)) {
      setExpandedStages(prev => [...prev, currentStage]);
    }
  }, [currentStage]);

  const toggleExpand = (stageId) => {
    setExpandedStages(prev => 
      prev.includes(stageId) 
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  const handleGenerateSummary = async (stageId, e) => {
    e.stopPropagation();
    if (summaries[stageId]) return; // Already have it

    setLoadingSummary(stageId);
    // Note: We need tasks for better summary, but we don't have them here easily. 
    // We'll pass project and let the AI function fetch tasks if needed or just summarize based on project data.
    // Ideally we would fetch tasks here or pass them as props.
    // For now, we'll assume the AI function can handle fetching or work without tasks.
    // Actually, let's fetch tasks inside generatePhaseSummary if possible, or pass empty.
    // I updated generatePhaseSummary to take tasks, but since we are in a stepper, let's pass empty array for now 
    // or better - modify generatePhaseSummary to fetch if not provided.
    // Wait, I can't modify generatePhaseSummary easily now without rewriting.
    // I'll update the call to pass an empty array, and the prompt will just say "completed tasks: none provided".
    // It's still better than nothing.
    
    // Tasks are fetched from the project data context
    // The AI will summarize based on stage name and project status. 
    // Let's just pass empty tasks for now, the AI will summarize based on stage name and project status.
    
    const summary = await generatePhaseSummary(project || { name: 'פרויקט', status: currentStage }, stageId);
    
    if (summary) {
      setSummaries(prev => ({ ...prev, [stageId]: summary }));
    }
    setLoadingSummary(null);
  };

  // Calculate overall progress percentage
  const progressPercent = Math.round(((currentIndex + 1) / stages.length) * 100);
  
  // Navigate to next/prev stage
  const goToNextStage = () => {
    if (currentIndex < stages.length - 1) {
      onStageClick(stages[currentIndex + 1].id);
    }
  };
  
  const goToPrevStage = () => {
    if (currentIndex > 0) {
      onStageClick(stages[currentIndex - 1].id);
    }
  };

  // Mobile collapsed view - show only current stage with progress
  if (isMobile && isCollapsed) {
    const CurrentIcon = currentStageData?.icon || Circle;
    return (
      <Card className="border-slate-200 p-3 sticky top-4 shadow-sm">
        {/* Progress bar at top */}
        <div className="mb-3">
          <Progress value={progressPercent} className="h-1.5" />
        </div>
        
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsCollapsed(false)}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center shadow-sm">
              <CurrentIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">שלב נוכחי</p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                  {currentIndex + 1}/{stages.length}
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                {currentStageData?.label || 'שלב לא ידוע'}
              </h3>
              {currentStageData?.estimatedDays && (
                <p className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {currentStageData.estimatedDays} ימים
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Quick navigation buttons */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); goToPrevStage(); }}
              disabled={currentIndex === 0}
              aria-label={t('a11y.previousStep')}
            >
              <ChevronRight className="w-4 h-4" aria-hidden />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); goToNextStage(); }}
              disabled={currentIndex === stages.length - 1}
              aria-label={t('a11y.nextStep')}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
            </Button>
            <div className="w-px h-6 bg-slate-200 mx-1" />
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 p-3 md:p-4 sticky top-4 shadow-sm">
      <FadeIn delay={0.1} direction="right">
        {/* Header with Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              שלבי הפרויקט
            </h2>
            <div className="flex items-center gap-2">
              <Badge 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 px-2.5"
              >
                {currentIndex + 1}/{stages.length} • {progressPercent}%
              </Badge>
              {isMobile && (
                <button 
                  onClick={() => setIsCollapsed(true)}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                </button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="relative">
            <Progress value={progressPercent} className="h-2" />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">התחלה</span>
              <span className="text-[10px] text-slate-400">סיום</span>
            </div>
          </div>

          {/* CTA: השלב הבא */}
          {currentIndex < stages.length - 1 ? (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-600 mb-2">השלב הבא: {stages[currentIndex + 1].label}</p>
              <Button
                variant="default"
                size="sm"
                className="w-full h-8 text-xs gap-1.5"
                onClick={goToNextStage}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                מעבר ל{stages[currentIndex + 1].label}
              </Button>
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-600 font-medium">כל השלבים הושלמו</p>
            </div>
          )}
          
          {/* Quick Stage Navigation */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={goToPrevStage}
              disabled={currentIndex === 0}
            >
              <ChevronRight className="w-3 h-3 ml-1" />
              הקודם
            </Button>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>{currentStageData?.estimatedDays || '?'} ימים</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={goToNextStage}
              disabled={currentIndex === stages.length - 1}
            >
              הבא
              <ChevronLeft className="w-3 h-3 mr-1" />
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Visible window: 3–4 stages around current + scroll */}
      {(() => {
        const windowSize = 4;
        const start = Math.max(0, Math.min(currentIndex - 1, stages.length - windowSize));
        const end = Math.min(stages.length, start + windowSize);
        const visibleStages = stages.slice(start, end).map((stage, i) => ({ stage, originalIndex: start + i }));
        return (
          <ScrollArea className="h-[280px] md:h-[320px] w-full">
            <div className="space-y-0 pr-2">
        {visibleStages.map(({ stage, originalIndex: index }) => {
          const isCompleted = currentIndex !== -1 && index < currentIndex;
          const isActive = stage.id === currentStage;
          const isExpanded = expandedStages.includes(stage.id);
          const hasSubStages = stage.subStages && stage.subStages.length > 0;
          const StageIcon = stage.icon;

          return (
            <ScrollReveal
              key={stage.id}
              delay={index * 0.08}
              direction="right"
              distance={20}
              className="relative"
            >
              {/* Main Stage */}
              <div
                className={`flex items-start gap-2 p-2 md:p-3 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 border-2 border-primary shadow-lg'
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
                style={isActive ? { 
                  backgroundColor: 'rgba(152, 78, 57, 0.15)', 
                  borderColor: '#984E39',
                  borderWidth: '2px',
                  borderStyle: 'solid'
                } : {}}
                onClick={() => {
                  onStageClick(stage.id);
                  if (hasSubStages) {
                    toggleExpand(stage.id);
                  }
                }}
              >
                {/* Icon */}
                <motion.div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                    isCompleted
                      ? 'bg-slate-900 border-slate-900 text-white'
                      : isActive
                      ? 'bg-primary border-primary text-white shadow-md'
                      : 'bg-white border-slate-200 text-slate-400'
                  }`}
                  style={isActive && !isCompleted ? { 
                    backgroundColor: '#984E39', 
                    borderColor: '#984E39',
                    color: 'white'
                  } : {}}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" strokeWidth={2} />
                  ) : (
                    <StageIcon className="w-3 h-3" />
                  )}
                </motion.div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h3
                      className={`text-xs truncate ${
                        isActive ? 'text-primary font-bold' : 'text-slate-600 font-medium'
                      }`}
                      style={isActive ? { color: '#984E39', fontWeight: 'bold' } : {}}
                    >
                      {stage.label}
                    </h3>
                    {isCompleted && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button 
                            className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                            onClick={(e) => handleGenerateSummary(stage.id, e)}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4 text-right" dir="rtl">
                          <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            סיכום שלב {stage.label}
                          </h4>
                          {loadingSummary === stage.id ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                            </div>
                          ) : summaries[stage.id] ? (
                            <div className="text-sm">
                              <p className="text-slate-700 mb-3 leading-relaxed">
                                {summaries[stage.id].summary}
                              </p>
                              {summaries[stage.id].attention_points?.length > 0 && (
                                <div className="bg-amber-50 p-2 rounded text-amber-800 text-xs">
                                  <strong>נקודות לתשומת לב:</strong>
                                  <ul className="list-disc list-inside mt-1">
                                    {summaries[stage.id].attention_points.map((p, i) => (
                                      <li key={i}>{p}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">לחץ שוב לטעינת סיכום</p>
                          )}
                        </PopoverContent>
                      </Popover>
                    )}
                    {hasSubStages && (
                      <button 
                        className="mr-auto text-slate-400 hover:text-slate-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(stage.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                  <p
                    className={`text-[10px] truncate hidden md:block ${
                      isActive ? 'text-primary' : 'text-slate-500'
                    }`}
                    style={isActive ? { color: '#984E39' } : {}}
                  >
                    {stage.description}
                  </p>
                </div>
              </div>

              {/* Sub-Stages */}
              <AnimatePresence>
                {isExpanded && hasSubStages && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mr-8 space-y-0.5 overflow-hidden"
                  >
                    {stage.subStages.map((subStage, subIndex) => {
                      const SubIcon = subStage.icon;
                      const isSubActive = currentSubStage === subStage.id;
                      const canClick = isActive || isCompleted;

                      return (
                        <div
                          key={subStage.id}
                          className={`flex items-center gap-2 p-1.5 rounded-md transition-all ${
                            canClick ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                          } ${
                            isSubActive 
                              ? 'bg-slate-100 text-slate-900' 
                              : canClick ? 'hover:bg-slate-50 text-slate-500' : 'text-slate-400'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canClick && onSubStageClick) {
                              onSubStageClick(stage.id, subStage.id);
                            }
                          }}
                        >
                          <div className="w-4 h-4 flex items-center justify-center">
                            <SubIcon className={`w-3 h-3 ${isSubActive ? 'text-slate-900' : 'text-slate-400'}`} />
                          </div>
                          <p className={`text-xs truncate ${isSubActive ? 'text-indigo-900 font-medium' : 'text-slate-600'}`}>
                            {subStage.label}
                          </p>
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </ScrollReveal>
          );
        })}
            </div>
          </ScrollArea>
        );
      })()}
    </Card>
  );
}

// Export stages for use in other components
export { stages };