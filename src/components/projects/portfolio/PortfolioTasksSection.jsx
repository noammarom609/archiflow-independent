import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  ListTodo,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Kanban,
  List,
  Trash2,
  Edit2,
  Calendar
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TaskFormDialog from '../tasks/TaskFormDialog';
import { showSuccess, showError } from '../../utils/notifications';
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: 'ממתין', color: 'bg-slate-100 text-slate-700', icon: Clock },
  in_progress: { label: 'בתהליך', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  review: { label: 'לבדיקה', color: 'bg-amber-100 text-amber-700', icon: AlertCircle },
  completed: { label: 'הושלם', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  blocked: { label: 'חסום', color: 'bg-red-100 text-red-700', icon: AlertCircle },
};

const priorityConfig = {
  low: { label: 'נמוך', color: 'bg-slate-100 text-slate-600' },
  medium: { label: 'בינוני', color: 'bg-amber-100 text-amber-700' },
  high: { label: 'גבוה', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'דחוף', color: 'bg-red-100 text-red-700' },
};

export default function PortfolioTasksSection({ tasks, project, isLoading }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('kanban');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Task.create({ 
      ...data, 
      project_id: project?.id,
      project_name: project?.name 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioTasks', project?.id] });
      setShowTaskForm(false);
      showSuccess('משימה נוצרה');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => archiflow.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioTasks', project?.id] });
      setShowTaskForm(false);
      setEditingTask(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => archiflow.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolioTasks', project?.id] });
      showSuccess('משימה נמחקה');
    },
  });

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group by status for kanban
  const tasksByStatus = {
    pending: filteredTasks.filter(t => t.status === 'pending'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  };

  // Stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">משימות</h2>
            <p className="text-sm text-slate-500">{stats.completed}/{stats.total} הושלמו</p>
          </div>
        </div>

        <Button onClick={() => { setEditingTask(null); setShowTaskForm(true); }} className="bg-amber-600 hover:bg-amber-700">
          <Plus className="w-4 h-4 ml-2" />
          משימה חדשה
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500">סה"כ</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-slate-500">{stats.pending}</p>
            <p className="text-xs text-slate-500">ממתינות</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.inProgress}</p>
            <p className="text-xs text-blue-600">בתהליך</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
            <p className="text-xs text-green-600">הושלמו</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="חיפוש משימות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="סטטוס" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">הכל</SelectItem>
            {Object.entries(statusConfig).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 rounded ${viewMode === 'kanban' ? 'bg-white shadow-sm' : ''}`}
          >
            <Kanban className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => {
            const config = statusConfig[status];
            const Icon = config.icon;

            return (
              <div key={status} className="space-y-3">
                <div className={`rounded-lg p-2 ${config.color}`}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{config.label}</span>
                    <Badge variant="secondary" className="mr-auto text-[10px]">
                      {statusTasks.length}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  <AnimatePresence>
                    {statusTasks.map((task) => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <Card className="border-slate-200 hover:shadow-md transition-shadow cursor-pointer group">
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <h4 className="text-sm font-medium text-slate-900 flex-1">{task.title}</h4>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => { setEditingTask(task); setShowTaskForm(true); }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-red-500"
                                  onClick={() => deleteMutation.mutate(task.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {task.due_date && (
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(task.due_date), 'd/M')}
                              </p>
                            )}
                            {task.priority && (
                              <Badge className={`mt-2 text-[10px] ${priorityConfig[task.priority]?.color || ''}`}>
                                {priorityConfig[task.priority]?.label || task.priority}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const config = statusConfig[task.status] || statusConfig.pending;

            return (
              <Card key={task.id} className="border-slate-200 hover:bg-slate-50">
                <CardContent className="p-3 flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${
                    task.status === 'completed' ? 'bg-green-500' :
                    task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 truncate">{task.title}</h4>
                  </div>
                  <Badge className={`${config.color} text-[10px]`}>{config.label}</Badge>
                  {task.due_date && (
                    <span className="text-xs text-slate-500">
                      {format(new Date(task.due_date), 'd/M/yy')}
                    </span>
                  )}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setEditingTask(task); setShowTaskForm(true); }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500"
                      onClick={() => deleteMutation.mutate(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Form Dialog */}
      <TaskFormDialog
        isOpen={showTaskForm}
        onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
        task={editingTask}
        project={project}
        onSave={editingTask 
          ? (data) => updateMutation.mutate({ id: editingTask.id, data })
          : (data) => createMutation.mutate(data)
        }
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}