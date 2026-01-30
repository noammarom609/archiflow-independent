import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Plus,
  CheckCircle2,
  Clock,
  CalendarDays,
  Link2,
  Loader2,
  Trash2,
  GripVertical,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/notifications';
import { format, addDays, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

const defaultMilestones = [
  { id: 'planning', name: 'תכנון ראשוני', duration: 14, color: '#6366f1' },
  { id: 'sketches', name: 'סקיצות ועיצוב', duration: 21, color: '#8b5cf6' },
  { id: 'renderings', name: 'הדמיות', duration: 14, color: '#ec4899' },
  { id: 'technical', name: 'תוכניות טכניות', duration: 21, color: '#f97316' },
  { id: 'permits', name: 'היתרים', duration: 30, color: '#eab308' },
  { id: 'execution', name: 'ביצוע', duration: 90, color: '#22c55e' },
];

const subStages = [
  { id: 'create', label: 'בניית גנט', description: 'הגדרת משימות ואבני דרך' },
  { id: 'sync', label: 'סנכרון יומן', description: 'חיבור ל-Google Calendar' },
];

export default function GanttStage({ project, onUpdate, onSubStageChange, currentSubStage }) {
  const queryClient = useQueryClient();
  const [activeSubStage, setActiveSubStage] = useState('create');
  const [completedSubStages, setCompletedSubStages] = useState([]);
  const [startDate, setStartDate] = useState(project?.start_date || new Date().toISOString().split('T')[0]);
  const [milestones, setMilestones] = useState(project?.gantt_data?.milestones || defaultMilestones);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch proposal data for smart generation
  const { data: proposal } = useQuery({
    queryKey: ['proposal', project?.proposal_id],
    queryFn: () => project?.proposal_id 
      ? archiflow.entities.Proposal.filter({ id: project.proposal_id }).then(res => res[0]) 
      : Promise.resolve(null),
    enabled: !!project?.proposal_id
  });

  // Track if change came from parent to prevent loops
  const isExternalChange = React.useRef(false);

  // Sync from parent Stepper when sub-stage is clicked there
  React.useEffect(() => {
    if (currentSubStage) {
      const reverseMap = {
        'create_gantt': 'create',
        'sync_calendar': 'sync',
      };
      const mappedSubStage = reverseMap[currentSubStage];
      if (mappedSubStage && mappedSubStage !== activeSubStage) {
        isExternalChange.current = true;
        setActiveSubStage(mappedSubStage);
      }
    }
  }, [currentSubStage]);

  // Notify parent of sub-stage changes (only if internal change)
  React.useEffect(() => {
    if (isExternalChange.current) {
      isExternalChange.current = false;
      return;
    }
    if (onSubStageChange) {
      const subStageMap = { create: 'create_gantt', sync: 'sync_calendar' };
      onSubStageChange(subStageMap[activeSubStage] || activeSubStage);
    }
  }, [activeSubStage]);

  // Generate Smart Gantt from AI
  const generateSmartGantt = async () => {
    setIsGenerating(true);
    try {
      // Fetch existing tasks to inform the Gantt
      const tasks = await archiflow.entities.Task.filter({ project_id: project.id });
      const tasksText = tasks.length > 0 
        ? tasks.map(t => `- ${t.title} (${t.status})`).join('\n') 
        : 'אין משימות קיימות עדיין';

      const prompt = `צור תוכנית גנט מפורטת וחכמה לפרויקט אדריכלות.
      
      נתוני הפרויקט:
      - שם: ${project.name}
      - סוג: ${project.ai_summary?.project_type || 'כללי'}
      - תיאור: ${proposal?.scope_of_work || project.description || ''}
      - הערכת זמנים מקורית: ${project.ai_summary?.timeline_estimate || ''}
      
      משימות קיימות במערכת (התחשב בהן ביצירת אבני הדרך):
      ${tasksText}

      הוראות:
      1. נתח את היקף הפרויקט והמשימות הקיימות.
      2. צור רשימה מפורטת של 8-15 אבני דרך (Milestones) לביצוע הפרויקט.
      3. אם יש משימות קיימות, וודא שאבני הדרך משקפות אותן או מכילות אותן.
      4. התאם את הזמנים למורכבות המשתמעת.
      
      לכל אבן דרך ציין:
      - שם (name): ברור ומקצועי בעברית
      - משך (duration): בימים
      - צבע (color): גוון מודרני המבדיל בין שלבים שונים (תכנון, ביצוע, גמר וכו')

      פלט רצוי: JSON עם מערך milestones.`;

      const result = await archiflow.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            milestones: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  duration: { type: 'number' },
                  color: { type: 'string' }
                },
                required: ['name', 'duration']
              }
            }
          }
        }
      });

      if (result.milestones && result.milestones.length > 0) {
        // Add IDs to new milestones
        const newMilestones = result.milestones.map((m, idx) => ({
          ...m,
          id: `ai_${idx}_${Date.now()}`,
          color: m.color || defaultMilestones[idx % defaultMilestones.length].color
        }));
        
        setMilestones(newMilestones);
        showSuccess('לוח הזמנים נוצר בהצלחה על בסיס נתוני הפרויקט!');
      }

    } catch (error) {
      console.error('Error generating gantt:', error);
      showError('שגיאה ביצירת הגנט האוטומטי');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate dates for each milestone
  const calculateMilestoneDates = () => {
    let currentDate = new Date(startDate);
    return milestones.map(milestone => {
      const start = new Date(currentDate);
      const end = addDays(currentDate, milestone.duration);
      currentDate = addDays(end, 1); // Next milestone starts day after
      return {
        ...milestone,
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    });
  };

  const milestonesWithDates = calculateMilestoneDates();
  const projectEndDate = milestonesWithDates.length > 0 
    ? milestonesWithDates[milestonesWithDates.length - 1].endDate 
    : startDate;

  // Save gantt data
  const saveGantt = async () => {
    setIsSaving(true);
    try {
      const ganttData = {
        startDate,
        milestones: milestonesWithDates,
        endDate: projectEndDate,
      };

      if (onUpdate) {
        await onUpdate({
          gantt_data: ganttData,
          start_date: startDate,
          end_date: projectEndDate,
        });
      }

      showSuccess('לוח הזמנים נשמר!');
      setCompletedSubStages(['create']);
      setActiveSubStage('sync');

    } catch (error) {
      console.error('Error saving gantt:', error);
      showError('שגיאה בשמירת לוח הזמנים');
    } finally {
      setIsSaving(false);
    }
  };

  // Sync to Google Calendar
  const syncToCalendar = async () => {
    setIsSyncing(true);
    try {
      // Create calendar events for each milestone
      for (const milestone of milestonesWithDates) {
        await archiflow.entities.CalendarEvent.create({
          title: `${project?.name}: ${milestone.name}`,
          description: `אבן דרך בפרויקט ${project?.name}`,
          event_type: 'deadline',
          start_date: milestone.endDate,
          end_date: milestone.endDate,
          all_day: true,
          project_id: project?.id,
          color: milestone.color,
          status: 'approved',
        });
      }

      showSuccess('לוח הזמנים סונכרן ללוח השנה!');
      setCompletedSubStages(['create', 'sync']);

      // Move to next project stage (Survey - מדידה)
      if (onUpdate) {
        await onUpdate({ status: 'survey' });
      }

    } catch (error) {
      console.error('Error syncing calendar:', error);
      showError('שגיאה בסנכרון ללוח השנה');
    } finally {
      setIsSyncing(false);
    }
  };

  // Update milestone
  const updateMilestone = (index, field, value) => {
    const newMilestones = [...milestones];
    newMilestones[index] = { ...newMilestones[index], [field]: value };
    setMilestones(newMilestones);
  };

  // Add milestone
  const addMilestone = () => {
    setMilestones([
      ...milestones,
      { id: `custom_${Date.now()}`, name: 'אבן דרך חדשה', duration: 7, color: '#64748b' }
    ]);
  };

  // Remove milestone
  const removeMilestone = (index) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  // Calculate total project duration
  const totalDays = milestones.reduce((sum, m) => sum + m.duration, 0);

  return (
    <div className="space-y-6">
      {/* Content - No navigation tabs, controlled by Stepper */}
      
      {/* Create Gantt */}
      {activeSubStage === 'create' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Project Overview Card - Visual Summary */}
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-indigo-900">{project?.name || 'לוח זמנים'}</h3>
                    <p className="text-sm text-indigo-600">
                      {milestonesWithDates.length} אבני דרך • {totalDays} ימים סה"כ
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-xs text-indigo-600 mb-1">התחלה</p>
                    <p className="text-lg font-bold text-indigo-900">
                      {format(new Date(startDate), 'd MMM', { locale: he })}
                    </p>
                  </div>
                  <div className="w-px bg-indigo-200" />
                  <div className="text-center">
                    <p className="text-xs text-indigo-600 mb-1">סיום</p>
                    <p className="text-lg font-bold text-indigo-900">
                      {format(new Date(projectEndDate), 'd MMM', { locale: he })}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Mini progress bar */}
              <div className="mt-4 bg-white rounded-full h-3 overflow-hidden shadow-inner">
                <div className="h-full flex">
                  {milestonesWithDates.map((m, idx) => (
                    <motion.div
                      key={m.id}
                      initial={{ width: 0 }}
                      animate={{ width: `${(m.duration / totalDays) * 100}%` }}
                      transition={{ delay: idx * 0.05, duration: 0.3 }}
                      style={{ backgroundColor: m.color }}
                      className="h-full"
                      title={`${m.name}: ${m.duration} ימים`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Dates */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">תאריכי פרויקט</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>תאריך התחלה</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>תאריך סיום משוער</Label>
                  <Input
                    type="date"
                    value={projectEndDate}
                    disabled
                    className="mt-1 bg-slate-50"
                  />
                </div>
                <div>
                  <Label>משך כולל</Label>
                  <div className="mt-1 h-10 flex items-center px-3 bg-indigo-50 rounded-md border border-indigo-200">
                    <span className="font-semibold text-indigo-700">{totalDays} ימים</span>
                    <span className="text-xs text-indigo-500 mr-2">({Math.ceil(totalDays / 7)} שבועות)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card className="border-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">אבני דרך</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={generateSmartGantt}
                    disabled={isGenerating}
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 ml-1" />
                    )}
                    צור אוטומטית מנתוני הפרויקט
                  </Button>
                  <Button size="sm" variant="outline" onClick={addMilestone}>
                    <Plus className="w-4 h-4 ml-1" />
                    הוסף אבן דרך
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {milestonesWithDates.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-50 rounded-xl p-4"
                  >
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-1 flex justify-center">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: milestone.color }}
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          value={milestone.name}
                          onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={milestone.duration}
                            onChange={(e) => updateMilestone(index, 'duration', parseInt(e.target.value) || 0)}
                            className="bg-white"
                          />
                          <span className="text-sm text-slate-500">ימים</span>
                        </div>
                      </div>
                      <div className="col-span-2 text-sm text-slate-600">
                        {format(new Date(milestone.startDate), 'd MMM', { locale: he })}
                      </div>
                      <div className="col-span-2 text-sm font-medium text-slate-900">
                        {format(new Date(milestone.endDate), 'd MMM yyyy', { locale: he })}
                      </div>
                      <div className="col-span-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeMilestone(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Visual Gantt Chart */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg">תצוגת גנט</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {milestonesWithDates.map((milestone, index) => {
                  const totalProjectDays = differenceInDays(new Date(projectEndDate), new Date(startDate)) || 1;
                  const startOffset = differenceInDays(new Date(milestone.startDate), new Date(startDate));
                  const widthPercent = (milestone.duration / totalProjectDays) * 100;
                  const leftPercent = (startOffset / totalProjectDays) * 100;

                  return (
                    <div key={milestone.id} className="flex items-center gap-3">
                      <div className="w-32 text-sm text-slate-600 truncate">{milestone.name}</div>
                      <div className="flex-1 h-8 bg-slate-100 rounded-lg relative">
                        <div
                          className="absolute h-full rounded-lg flex items-center justify-center text-xs text-white font-medium"
                          style={{
                            backgroundColor: milestone.color,
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            minWidth: '40px',
                          }}
                        >
                          {milestone.duration}d
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={saveGantt}
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 ml-2" />
                שמור לוח זמנים
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Sync to Calendar */}
      {activeSubStage === 'sync' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                סנכרון ללוח שנה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-indigo-50 rounded-xl p-6 text-center">
                <Link2 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                  סנכרן אבני דרך ללוח השנה
                </h3>
                <p className="text-indigo-700 mb-4">
                  כל אבני הדרך יתווספו ללוח השנה שלך כאירועים
                </p>
                
                <div className="bg-white rounded-lg p-4 mb-4 text-right">
                  <h4 className="font-medium text-slate-900 mb-2">יתווספו {milestonesWithDates.length} אירועים:</h4>
                  <ul className="space-y-1 text-sm text-slate-600">
                    {milestonesWithDates.map(m => (
                      <li key={m.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                        {m.name} - {format(new Date(m.endDate), 'd/M/yyyy')}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={syncToCalendar}
                  disabled={isSyncing}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      מסנכרן...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 ml-2" />
                      סנכרן ללוח שנה
                    </>
                  )}
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setCompletedSubStages(['create', 'sync']);
                  if (onUpdate) {
                    onUpdate({ status: 'survey' });
                  }
                  showSuccess('ממשיכים לשלב המדידה!');
                }}
                className="w-full"
              >
                דלג והמשך למדידה
                <ChevronRight className="w-4 h-4 mr-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}