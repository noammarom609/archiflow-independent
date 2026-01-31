import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import { format } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { showError } from '@/components/utils/notifications';

const STAGES = [
  { value: 'first_call', label: 'שיחה ראשונה' },
  { value: 'proposal', label: 'הצעת מחיר' },
  { value: 'survey', label: 'מדידות' },
  { value: 'concept', label: 'קונספט' },
  { value: 'sketches', label: 'סקיצות' },
  { value: 'rendering', label: 'הדמיות' },
  { value: 'permits', label: 'היתרים' },
  { value: 'technical', label: 'תוכניות עבודה' },
  { value: 'selections', label: 'בחירת חומרים' },
  { value: 'execution', label: 'ביצוע' },
  { value: 'completion', label: 'מסירה' },
];

export default function TimeEntryDialog({
  isOpen,
  onClose,
  entry,
  projects = [],
  onSave,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    project_id: '',
    project_name: '',
    task_id: '',
    task_name: '',
    stage: '',
    start_time: '',
    end_time: '',
    duration_minutes: '',
    description: '',
    billable: true,
    source: 'manual',
  });

  const [showCalendar, setShowCalendar] = useState(false);

  // Reset form when dialog opens/entry changes
  useEffect(() => {
    if (isOpen) {
      if (entry) {
        setFormData({
          date: entry.date || format(new Date(), 'yyyy-MM-dd'),
          project_id: entry.project_id || '',
          project_name: entry.project_name || '',
          task_id: entry.task_id || '',
          task_name: entry.task_name || '',
          stage: entry.stage || '',
          start_time: entry.start_time || '',
          end_time: entry.end_time || '',
          duration_minutes: entry.duration_minutes?.toString() || '',
          description: entry.description || '',
          billable: entry.billable ?? true,
          source: entry.source || 'manual',
        });
      } else {
        setFormData({
          date: format(new Date(), 'yyyy-MM-dd'),
          project_id: '',
          project_name: '',
          task_id: '',
          task_name: '',
          stage: '',
          start_time: '',
          end_time: '',
          duration_minutes: '',
          description: '',
          billable: true,
          source: 'manual',
        });
      }
    }
  }, [isOpen, entry]);

  // Fetch tasks for selected project
  const { data: tasks = [] } = useQuery({
    queryKey: ['projectTasks', formData.project_id],
    queryFn: () => archiflow.entities.Task.filter({ project_id: formData.project_id }),
    enabled: !!formData.project_id,
  });

  // Auto-calculate duration from start/end times
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const [startH, startM] = formData.start_time.split(':').map(Number);
      const [endH, endM] = formData.end_time.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      
      if (endMinutes > startMinutes) {
        setFormData(prev => ({
          ...prev,
          duration_minutes: (endMinutes - startMinutes).toString()
        }));
      }
    }
  }, [formData.start_time, formData.end_time]);

  const handleProjectChange = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      project_name: project?.name || '',
      task_id: '',
      task_name: '',
    }));
  };

  const handleTaskChange = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    setFormData(prev => ({
      ...prev,
      task_id: taskId === 'none' ? '' : taskId,
      task_name: task?.title || '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation - Project required
    if (!formData.project_id) {
      showError('יש לבחור פרויקט');
      return;
    }

    // Validation - Duration required and positive
    const duration = parseInt(formData.duration_minutes);
    if (!duration || duration <= 0) {
      showError('יש להזין משך זמן תקין (לפחות דקה אחת)');
      return;
    }

    // Validation - Maximum duration check (prevent typos)
    if (duration > 1440) { // More than 24 hours
      showError('משך הזמן לא יכול לעלות על 24 שעות');
      return;
    }

    // Check no future dates
    const entryDate = new Date(formData.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (entryDate > today) {
      showError('לא ניתן לדווח שעות לתאריך עתידי');
      return;
    }

    // Validation - Date required
    if (!formData.date) {
      showError('יש לבחור תאריך');
      return;
    }

    // Convert empty strings to null for TIME fields (PostgreSQL can't parse "")
    const dataToSave = {
      ...formData,
      duration_minutes: duration,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
      task_id: formData.task_id || null,
    };
    
    onSave(dataToSave);
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} שעות ${m > 0 ? `ו-${m} דקות` : ''}` : `${m} דקות`;
  };

  const isValid = formData.project_id && formData.date && parseInt(formData.duration_minutes) > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            {entry?.id ? 'עריכת דיווח שעות' : 'דיווח שעות חדש'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="space-y-2">
            <Label>תאריך *</Label>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-right font-normal"
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {formData.date ? format(new Date(formData.date), 'dd/MM/yyyy') : 'בחר תאריך'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date ? new Date(formData.date) : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setFormData(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
                      setShowCalendar(false);
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label>פרויקט *</Label>
            <Select value={formData.project_id} onValueChange={handleProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="בחר פרויקט" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task (optional) */}
          {formData.project_id && tasks.length > 0 && (
            <div className="space-y-2">
              <Label>משימה (אופציונלי)</Label>
              <Select value={formData.task_id || 'none'} onValueChange={handleTaskChange}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר משימה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">ללא משימה</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                      {task.estimated_hours && (
                        <span className="text-muted-foreground mr-2">
                          ({task.estimated_hours}ש׳)
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Stage */}
          <div className="space-y-2">
            <Label>שלב (אופציונלי)</Label>
            <Select value={formData.stage || 'none'} onValueChange={(v) => setFormData(prev => ({ ...prev, stage: v === 'none' ? '' : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="בחר שלב" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ללא שלב</SelectItem>
                {STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>התחלה</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>סיום</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>משך (דקות) *</Label>
              <Input
                type="number"
                min="1"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                placeholder="60"
              />
            </div>
          </div>

          {formData.duration_minutes && (
            <p className="text-sm text-muted-foreground">
              {formatDuration(parseInt(formData.duration_minutes))}
            </p>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>תיאור</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="מה עשית?"
              rows={2}
            />
          </div>

          {/* Billable */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="billable"
              checked={formData.billable}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, billable: !!checked }))}
            />
            <Label htmlFor="billable" className="text-sm cursor-pointer">
              שעות לחיוב
            </Label>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {entry?.id ? 'עדכון' : 'שמירה'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}