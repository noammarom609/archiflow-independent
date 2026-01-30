import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Tag,
  UserPlus
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import AssignTaskDialog from '../team/AssignTaskDialog';

const statusConfig = {
  pending: { 
    label: 'ממתין', 
    color: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: PauseCircle 
  },
  in_progress: { 
    label: 'בביצוע', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: PlayCircle 
  },
  review: { 
    label: 'בבדיקה', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: AlertCircle 
  },
  completed: { 
    label: 'הושלם', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2 
  },
  blocked: { 
    label: 'חסום', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: AlertCircle 
  },
};

const priorityConfig = {
  low: { label: 'נמוכה', color: 'bg-slate-100 text-slate-700' },
  medium: { label: 'בינונית', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'גבוהה', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'דחוף', color: 'bg-red-100 text-red-800' },
};

export default function TaskCard({ task, onStatusChange, onApprove, index }) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const status = statusConfig[task.status] || statusConfig.pending;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className={`border-2 hover:shadow-lg transition-all ${
        isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
      }`}>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {task.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 mr-4">
              <Badge className={`${status.color} border flex items-center gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Project and Priority */}
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {task.project_name}
            </Badge>
            <Badge className={priority.color}>
              {priority.label}
            </Badge>
          </div>

          {/* Dates and Progress */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            {task.start_date && (
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" strokeWidth={1.5} />
                <span>{format(new Date(task.start_date), 'dd/MM/yy')}</span>
              </div>
            )}
            {task.due_date && (
              <div className={`flex items-center gap-2 ${
                isOverdue ? 'text-red-600 font-medium' : 'text-slate-600'
              }`}>
                <Clock className="w-4 h-4" strokeWidth={1.5} />
                <span>{format(new Date(task.due_date), 'dd/MM/yy')}</span>
                {isOverdue && <span className="text-xs">(באיחור)</span>}
              </div>
            )}
          </div>

          {/* Cost and Hours */}
          {(task.estimated_hours || task.estimated_cost) && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg mb-4">
              {task.estimated_hours && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">שעות</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {task.actual_hours || 0} / {task.estimated_hours}
                  </p>
                </div>
              )}
              {task.estimated_cost && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">עלות</p>
                  <p className="text-sm font-semibold text-slate-900">
                    ₪{task.actual_cost || 0} / ₪{task.estimated_cost}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
            {task.status === 'review' && task.approval_required && (
              <Button
                onClick={() => onApprove(task)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <CheckCircle2 className="w-4 h-4 ml-2" />
                אשר עבודה
              </Button>
            )}
            
            {task.status !== 'completed' && (
              <Button
                onClick={() => onStatusChange(task)}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                עדכן סטטוס
              </Button>
            )}

            <Button
              onClick={() => setShowAssignDialog(true)}
              variant="ghost"
              size="sm"
            >
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>

          {/* Assigned Team Members */}
          {task.assigned_to && task.assigned_to.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">מוקצה ל:</p>
              <div className="flex items-center gap-1">
                {task.assigned_to.slice(0, 3).map((id, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700"
                  >
                    {idx + 1}
                  </div>
                ))}
                {task.assigned_to.length > 3 && (
                  <span className="text-xs text-slate-500">
                    +{task.assigned_to.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Approval info */}
          {task.approved_by && (
            <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-800">
              אושר על ידי {task.approved_by}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Task Dialog */}
      <AssignTaskDialog
        isOpen={showAssignDialog}
        onClose={() => setShowAssignDialog(false)}
        task={task}
      />
    </motion.div>
  );
}