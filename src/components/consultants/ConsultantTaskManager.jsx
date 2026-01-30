import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, AlertCircle, Briefcase, FileText, Calendar } from 'lucide-react';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '../utils/notifications';

export default function ConsultantTaskManager({ tasks }) {
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => archiflow.entities.ConsultantTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultantTasks'] });
      showSuccess('סטטוס המשימה עודכן');
    },
    onError: () => {
      showError('שגיאה בעדכון סטטוס');
    },
  });

  const handleStatusChange = (taskId, newStatus) => {
    updateTaskMutation.mutate({
      id: taskId,
      data: { status: newStatus },
    });
  };

  const statusOptions = [
    { value: 'pending', label: 'ממתין', icon: Clock, color: 'text-yellow-600' },
    { value: 'in_progress', label: 'בביצוע', icon: AlertCircle, color: 'text-blue-600' },
    { value: 'review', label: 'בבדיקה', icon: FileText, color: 'text-purple-600' },
    { value: 'completed', label: 'הושלם', icon: CheckCircle2, color: 'text-green-600' },
  ];

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    urgent: 'bg-red-200 text-red-900',
  };

  const priorityLabels = {
    low: 'נמוך',
    medium: 'בינוני',
    high: 'גבוה',
    urgent: 'דחוף',
  };

  const taskTypeLabels = {
    report: 'דו"ח',
    review: 'בדיקה',
    calculation: 'חישוב',
    approval: 'אישור',
    meeting: 'פגישה',
    site_visit: 'ביקור באתר',
    other: 'אחר',
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <Briefcase className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <p className="text-muted-foreground">אין משימות פעילות</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => {
        const StatusIcon = statusOptions.find(s => s.value === task.status)?.icon || Clock;
        
        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-border hover:shadow-soft-organic-hover transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <StatusIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-bold text-foreground">{task.title}</h3>
                        <Badge className={priorityColors[task.priority] || priorityColors.medium}>
                          {priorityLabels[task.priority] || 'בינוני'}
                        </Badge>
                        {task.task_type && (
                          <Badge variant="outline" className="border-border">
                            {taskTypeLabels[task.task_type] || task.task_type}
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {task.project_name && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {task.project_name}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            יעד: {new Date(task.due_date).toLocaleDateString('he-IL')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-48">
                    <Select
                      value={task.status}
                      onValueChange={(value) => handleStatusChange(task.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${option.color}`} />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
