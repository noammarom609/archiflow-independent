import React, { useMemo } from 'react';
import { format, addDays, isSameDay, isToday } from 'date-fns';
import { he } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Plus, AlertTriangle } from 'lucide-react';

// Overtime thresholds (in minutes)
const DAILY_WARNING_THRESHOLD = 480;  // 8 hours
const DAILY_OVERTIME_THRESHOLD = 600; // 10 hours
const WEEKLY_OVERTIME_THRESHOLD = 2700; // 45 hours

export default function TimesheetWeekly({ entries = [], weekStart, projects = [], onCellClick }) {
  // Generate week days
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Group entries by project and day
  const gridData = useMemo(() => {
    const projectMap = new Map();

    entries.forEach(entry => {
      const projectId = entry.project_id || 'no-project';
      const projectName = entry.project_name || 'ללא פרויקט';
      
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          id: projectId,
          name: projectName,
          days: {}
        });
      }

      const dayKey = entry.date;
      const projectData = projectMap.get(projectId);
      
      if (!projectData.days[dayKey]) {
        projectData.days[dayKey] = { minutes: 0, entries: [] };
      }
      
      projectData.days[dayKey].minutes += entry.duration_minutes || 0;
      projectData.days[dayKey].entries.push(entry);
    });

    return Array.from(projectMap.values());
  }, [entries]);

  // Calculate totals
  const dayTotals = useMemo(() => {
    return weekDays.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      return entries
        .filter(e => e.date === dayKey)
        .reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    });
  }, [weekDays, entries]);

  const weekTotal = dayTotals.reduce((sum, d) => sum + d, 0);

  const formatMinutes = (minutes) => {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? (m > 0 ? `${h}:${m.toString().padStart(2, '0')}` : `${h}:00`) : `0:${m.toString().padStart(2, '0')}`;
  };

  const formatHours = (minutes) => {
    return (minutes / 60).toFixed(1);
  };

  // Get overtime status for daily total
  const getDayOvertimeStatus = (minutes) => {
    if (minutes >= DAILY_OVERTIME_THRESHOLD) return 'overtime';
    if (minutes >= DAILY_WARNING_THRESHOLD) return 'warning';
    return 'normal';
  };

  // Get overtime status for weekly total
  const getWeekOvertimeStatus = (minutes) => {
    if (minutes >= WEEKLY_OVERTIME_THRESHOLD) return 'overtime';
    return 'normal';
  };

  const weekOvertimeStatus = getWeekOvertimeStatus(weekTotal);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">שבועון שעות</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-right p-3 font-medium min-w-[150px]">פרויקט</th>
                {weekDays.map((day, i) => (
                  <th 
                    key={i} 
                    className={`text-center p-3 font-medium min-w-[80px] ${
                      isToday(day) ? 'bg-primary/10' : ''
                    }`}
                  >
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'EEEE', { locale: he })}
                    </div>
                    <div className={`text-sm ${isToday(day) ? 'text-primary font-bold' : ''}`}>
                      {format(day, 'd/M')}
                    </div>
                  </th>
                ))}
                <th className="text-center p-3 font-medium min-w-[80px] bg-muted">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {gridData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted-foreground">
                    אין דיווחי שעות בשבוע זה
                  </td>
                </tr>
              ) : (
                gridData.map((project) => {
                  const projectTotal = Object.values(project.days).reduce(
                    (sum, d) => sum + d.minutes, 0
                  );

                  return (
                    <tr key={project.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <span className="font-medium">{project.name}</span>
                      </td>
                      {weekDays.map((day, i) => {
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const dayData = project.days[dayKey];
                        const projectObj = projects.find(p => p.id === project.id);

                        return (
                          <td 
                            key={i} 
                            className={`text-center p-2 ${isToday(day) ? 'bg-primary/5' : ''}`}
                          >
                            {dayData ? (
                              <Button
                                variant="ghost"
                                className="h-auto py-1 px-2 font-mono"
                                onClick={() => onCellClick?.(day, projectObj)}
                              >
                                {formatMinutes(dayData.minutes)}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 hover:opacity-100"
                                onClick={() => onCellClick?.(day, projectObj)}
                              >
                                <Plus className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center p-3 bg-muted/50 font-medium font-mono">
                        {formatMinutes(projectTotal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-muted/80 font-medium">
                <td className="p-3">סה"כ יומי</td>
                {dayTotals.map((total, i) => {
                  const overtimeStatus = getDayOvertimeStatus(total);
                  return (
                    <td 
                      key={i} 
                      className={`text-center p-3 font-mono ${
                        isToday(weekDays[i]) ? 'bg-primary/10' : ''
                      } ${
                        overtimeStatus === 'overtime' ? 'bg-red-100 text-red-700' : 
                        overtimeStatus === 'warning' ? 'bg-yellow-100 text-yellow-700' : ''
                      }`}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center justify-center gap-1">
                              {formatMinutes(total)}
                              {overtimeStatus !== 'normal' && (
                                <AlertTriangle className="w-3 h-3" />
                              )}
                            </span>
                          </TooltipTrigger>
                          {overtimeStatus !== 'normal' && (
                            <TooltipContent dir="rtl">
                              <p>{overtimeStatus === 'overtime' ? 'שעות נוספות!' : 'מעל 8 שעות'}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  );
                })}
                <td className={`text-center p-3 font-mono font-bold ${
                  weekOvertimeStatus === 'overtime' ? 'bg-red-200 text-red-800' : 'bg-primary/20'
                }`}>
                  <span className="flex items-center justify-center gap-1">
                    {formatHours(weekTotal)}ש׳
                    {weekOvertimeStatus === 'overtime' && (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground">סה"כ שבועי: </span>
              <span className={`font-bold ${weekOvertimeStatus === 'overtime' ? 'text-red-600' : ''}`}>
                {formatHours(weekTotal)} שעות
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">פרויקטים: </span>
              <span className="font-bold">{gridData.length}</span>
            </div>
            {weekOvertimeStatus === 'overtime' && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="w-3 h-3" />
                שעות נוספות
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            ממוצע יומי: {formatHours(weekTotal / 7)} שעות
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}