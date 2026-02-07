import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar, FolderKanban, Loader2, ArrowRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays, isSameMonth, isWithinInterval, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { he } from 'date-fns/locale';
import { createPageUrl } from '../../utils';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/components/providers/LanguageProvider';

const milestoneColors = {
  planning: '#6366f1',
  sketches: '#8b5cf6',
  renderings: '#ec4899',
  technical: '#f97316',
  permits: '#eab308',
  execution: '#22c55e',
};

const taskColors = {
  pending: '#cbd5e1',
  in_progress: '#3b82f6',
  review: '#eab308',
  completed: '#22c55e',
  blocked: '#ef4444'
};

export default function GanttView({ currentDate: initialDate, onDateChange }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  
  // Fetch projects with gantt data
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projectsGantt'],
    queryFn: () => archiflow.entities.Project.list('-created_date'),
  });

  // Fetch tasks
  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['allTasks'],
    queryFn: () => archiflow.entities.Task.list('-created_date'),
  });

  const isLoading = loadingProjects || loadingTasks;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const totalDays = daysInMonth.length;

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  // Calculate position and width for a bar (RTL: right-to-left)
  const getBarStyle = (start, end, color) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      // Check if overlaps with current month
      const effectiveStart = startDate < monthStart ? monthStart : startDate;
      const effectiveEnd = endDate > monthEnd ? monthEnd : endDate;
      
      if (effectiveStart > monthEnd || effectiveEnd < monthStart) {
        return null; // Not visible this month
      }
      
      const startOffset = differenceInDays(effectiveStart, monthStart);
      const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;
      
      // RTL: use 'right' instead of 'left' so bars start from the right side
      const rightPercent = (startOffset / totalDays) * 100;
      const widthPercent = (duration / totalDays) * 100;
      
      return {
        right: `${Math.max(0, rightPercent)}%`,
        width: `${Math.min(100 - rightPercent, widthPercent)}%`,
        backgroundColor: color || '#6366f1',
      };
    } catch (e) {
      return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-500 mt-2">טוען נתונים...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-white border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-600" />
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">לוח זמנים פרויקטים</CardTitle>
              <p className="text-sm text-slate-500">תצוגת גנט של כל הפרויקטים והמשימות</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <Button variant="ghost" size="sm" onClick={prevMonth} className="hover:bg-white h-8 w-8 p-0" aria-label={t('a11y.previousMonth')}>
              <ChevronRight className="w-4 h-4" aria-hidden />
            </Button>
            <span className="font-semibold min-w-[120px] text-center text-sm">
              {format(currentDate, 'MMMM yyyy', { locale: he })}
            </span>
            <Button variant="ghost" size="sm" onClick={nextMonth} className="hover:bg-white h-8 w-8 p-0" aria-label={t('a11y.nextMonth')}>
              <ChevronLeft className="w-4 h-4" aria-hidden />
            </Button>
            <div className="w-px h-4 bg-slate-300 mx-1"></div>
            <Button variant="ghost" size="sm" onClick={today} className="text-xs h-8 px-2 hover:bg-white">
              היום
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline Header - RTL: dates 31 on left, 1 on right */}
          <div className="flex bg-slate-50 border-b border-slate-200 sticky top-0 z-10" dir="rtl">
            <div className="w-64 flex-shrink-0 p-3 border-r border-slate-200 font-medium text-sm text-slate-700 bg-slate-50 sticky left-0 z-20">
              פרויקט / משימה
            </div>
            <div className="flex-1 flex" dir="ltr">
              {[...daysInMonth].reverse().map((day, idx) => (
                <div
                  key={idx}
                  className={`flex-1 text-center border-l border-slate-100 py-2 text-xs ${
                    format(day, 'E', { locale: he }) === 'שבת' ? 'bg-slate-100 text-slate-400' : 'text-slate-600'
                  }`}
                  style={{ minWidth: '30px' }}
                >
                  <div className="font-medium">{format(day, 'd')}</div>
                  <div className="text-[10px] opacity-70">{format(day, 'E', { locale: he })}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {projects.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                אין פרויקטים להצגה
              </div>
            ) : (
              projects.map((project) => {
                // Get project tasks
                const projectTasks = tasks.filter(t => t.project_id === project.id);
                // Get project milestones
                const milestones = project.gantt_data?.milestones || [];
                
                // If no tasks or milestones, and we want to show empty projects, keep it. 
                // Or maybe filter out empty ones? Let's show all projects.

                return (
                  <div key={project.id} className="group">
                    {/* Project Row */}
                    <div className="flex bg-white hover:bg-slate-50 transition-colors" dir="rtl">
                      <div 
                        className="w-64 flex-shrink-0 p-3 border-l border-slate-200 sticky left-0 z-10 bg-white group-hover:bg-slate-50 cursor-pointer"
                        onClick={() => navigate(createPageUrl('Projects') + `?id=${project.id}`)}
                      >
                        <div className="font-semibold text-sm text-slate-900 truncate">{project.name}</div>
                        <div className="text-xs text-slate-500 truncate">{project.client}</div>
                      </div>
                      <div className="flex-1 relative h-12" dir="ltr">
                        {/* Grid lines - RTL: reversed array */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {[...daysInMonth].reverse().map((day, idx) => (
                            <div 
                              key={idx} 
                              className={`flex-1 border-l border-slate-50 ${
                                format(day, 'E', { locale: he }) === 'שבת' ? 'bg-slate-50/50' : ''
                              }`}
                            />
                          ))}
                        </div>
                        
                        {/* Project Timeline Bar (if exists) */}
                        {(project.start_date && project.end_date) && (() => {
                          const style = getBarStyle(project.start_date, project.end_date, '#4f46e5'); // Indigo
                          if (!style) return null;
                          return (
                            <div className="absolute top-3 h-6 rounded-full opacity-20" style={style} />
                          );
                        })()}
                      </div>
                    </div>

                    {/* Milestones */}
                    {milestones.map((milestone, idx) => {
                      const style = getBarStyle(milestone.startDate, milestone.endDate, milestoneColors[milestone.type] || '#8b5cf6');
                      if (!style) return null;

                      return (
                        <div key={`m-${idx}`} className="flex bg-white hover:bg-slate-50" dir="rtl">
                          <div className="w-64 flex-shrink-0 p-2 pl-8 border-l border-slate-200 text-xs text-slate-600 sticky left-0 z-10 bg-white hover:bg-slate-50 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: milestoneColors[milestone.type] || '#8b5cf6' }} />
                            {milestone.name}
                          </div>
                          <div className="flex-1 relative h-8" dir="ltr">
                            <div className="absolute inset-0 flex pointer-events-none">
                              {[...daysInMonth].reverse().map((day, idx) => (
                                <div key={idx} className={`flex-1 border-l border-slate-50 ${format(day, 'E', { locale: he }) === 'שבת' ? 'bg-slate-50/50' : ''}`} />
                              ))}
                            </div>
                            <div
                              className="absolute top-2 h-4 rounded text-[10px] text-white flex items-center justify-center px-1 truncate shadow-sm cursor-help"
                              style={style}
                              title={`${milestone.name}: ${milestone.startDate} - ${milestone.endDate}`}
                            >
                              {milestone.name}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Tasks */}
                    {projectTasks.map((task) => {
                      if (!task.start_date || !task.due_date) return null;
                      const style = getBarStyle(task.start_date, task.due_date, taskColors[task.status]);
                      if (!style) return null;

                      return (
                        <div key={task.id} className="flex bg-white hover:bg-slate-50" dir="rtl">
                          <div className="w-64 flex-shrink-0 p-2 pl-8 border-l border-slate-200 text-xs text-slate-600 sticky left-0 z-10 bg-white hover:bg-slate-50 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: taskColors[task.status] }} />
                            <span className="truncate" title={task.title}>{task.title}</span>
                          </div>
                          <div className="flex-1 relative h-8" dir="ltr">
                            <div className="absolute inset-0 flex pointer-events-none">
                              {[...daysInMonth].reverse().map((day, idx) => (
                                <div key={idx} className={`flex-1 border-l border-slate-50 ${format(day, 'E', { locale: he }) === 'שבת' ? 'bg-slate-50/50' : ''}`} />
                              ))}
                            </div>
                            <div
                              className="absolute top-2 h-4 rounded text-[10px] text-white flex items-center px-2 truncate shadow-sm cursor-pointer hover:brightness-110 transition-all"
                              style={style}
                              title={`${task.title}: ${task.start_date} - ${task.due_date}\nסטטוס: ${task.status}\nהתקדמות: ${task.progress || 0}%`}
                            >
                              <span className="truncate">{task.title}</span>
                              {task.progress > 0 && (
                                <div className="absolute bottom-0 left-0 h-0.5 bg-white/50" style={{ width: `${task.progress}%` }} />
                              )}
                            </div>
                            
                            {/* Dependencies Lines (Visualizing simple backward dependencies if visible) */}
                            {task.dependencies?.map(depId => {
                                // This is complex to render in simple CSS grid without canvas/SVG overlay
                                // Skipping line drawing for simplicity in this version
                                return null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}