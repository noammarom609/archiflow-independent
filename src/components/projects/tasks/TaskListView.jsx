import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  User,
  FileText,
  MoreVertical,
  Trash2,
  Pencil,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Link2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, isPast, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { useLanguage } from '@/components/providers/LanguageProvider';

const statusConfig = {
  pending: { label: 'ממתין', color: 'bg-slate-100 text-slate-700' },
  in_progress: { label: 'בתהליך', color: 'bg-blue-100 text-blue-700' },
  review: { label: 'לבדיקה', color: 'bg-purple-100 text-purple-700' },
  completed: { label: 'הושלם', color: 'bg-green-100 text-green-700' },
  blocked: { label: 'חסום', color: 'bg-red-100 text-red-700' },
};

const priorityConfig = {
  low: { label: 'נמוכה', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'בינונית', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'גבוהה', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'דחוף', color: 'bg-red-100 text-red-700' },
};

export default function TaskListView({ tasks, onStatusChange, onEditTask, onDeleteTask }) {
  const [expandedTask, setExpandedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTasks = filterStatus === 'all' 
    ? tasks 
    : tasks.filter(t => t.status === filterStatus);

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
  };

  const handleToggleComplete = (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    onStatusChange(task.id, newStatus);
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="כל הסטטוסים" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">כל הסטטוסים</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-slate-500">
          {filteredTasks.length} משימות
        </span>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filteredTasks.map((task, index) => {
            const isExpanded = expandedTask === task.id;
            const status = statusConfig[task.status] || statusConfig.pending;
            const priority = priorityConfig[task.priority];
            const overdue = isOverdue(task.due_date);

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.02 }}
                className={`bg-white rounded-xl border-2 transition-all ${
                  isExpanded ? 'border-amber-300 shadow-md' : 'border-slate-200 hover:border-slate-300'
                } ${task.status === 'completed' ? 'opacity-70' : ''}`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Checkbox */}
                    <Checkbox
                      checked={task.status === 'completed'}
                      onCheckedChange={() => handleToggleComplete(task)}
                      className="h-5 w-5"
                    />

                    {/* Task Info */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    >
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium text-slate-900 ${
                          task.status === 'completed' ? 'line-through text-slate-500' : ''
                        }`}>
                          {task.title}
                        </h4>
                        {overdue && task.status !== 'completed' && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
                        {task.due_date && (
                          <span className={`flex items-center gap-1 ${
                            overdue && task.status !== 'completed' ? 'text-red-600 font-medium' : ''
                          }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(task.due_date), 'd MMM yyyy', { locale: he })}
                          </span>
                        )}
                        {task.contractor_name && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {task.contractor_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status & Priority Badges */}
                    <div className="flex items-center gap-2">
                      {priority && (
                        <Badge className={`${priority.color} text-xs`}>
                          {priority.label}
                        </Badge>
                      )}
                      <Badge className={`${status.color} text-xs`}>
                        {status.label}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('a11y.openMenu')} title={t('a11y.openMenu')}>
                            <MoreVertical className="w-4 h-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditTask(task)}>
                            <Pencil className="w-4 h-4 ml-2" />
                            ערוך משימה
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteTask(task.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 ml-2" />
                            מחק משימה
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Description */}
                          <div>
                            <h5 className="text-xs font-medium text-slate-500 mb-1">תיאור</h5>
                            <p className="text-sm text-slate-700">
                              {task.description || 'אין תיאור'}
                            </p>
                          </div>

                          {/* Details */}
                          <div className="space-y-2">
                            {task.estimated_hours && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">שעות משוערות:</span>
                                <span className="font-medium">{task.estimated_hours} שעות</span>
                              </div>
                            )}
                            {task.actual_hours && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">שעות בפועל:</span>
                                <span className="font-medium">{task.actual_hours} שעות</span>
                              </div>
                            )}
                            {task.notes && (
                              <div>
                                <span className="text-xs text-slate-500">הערות:</span>
                                <p className="text-sm text-slate-700 mt-1">{task.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                          <Select
                            value={task.status}
                            onValueChange={(val) => onStatusChange(task.id, val)}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusConfig).map(([key, { label }]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditTask(task)}
                            className="h-8 text-xs"
                          >
                            <Pencil className="w-3 h-3 ml-1" />
                            ערוך
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">אין משימות להצגה</p>
          </div>
        )}
      </div>
    </div>
  );
}