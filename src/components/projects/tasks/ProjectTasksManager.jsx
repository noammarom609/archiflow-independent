import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  LayoutList,
  Kanban,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo
} from 'lucide-react';
import TaskListView from './TaskListView';
import TaskKanbanView from './TaskKanbanView';
import TaskFormDialog from './TaskFormDialog';
import { useNotifications } from '@/hooks/use-notifications';

export default function ProjectTasksManager({ project }) {
  const queryClient = useQueryClient();
  const { sendTemplate } = useNotifications();
  const [viewMode, setViewMode] = useState('kanban'); // 'list' or 'kanban'
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Fetch tasks for this project
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['projectTasks', project?.id],
    queryFn: () => base44.entities.Task.filter({ project_id: project?.id }, '-created_date'),
    enabled: !!project?.id,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks', project?.id] });
      setShowTaskForm(false);
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks', project?.id] });
      setShowTaskForm(false);
      setEditingTask(null);
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks', project?.id] });
    },
  });

  const handleCreateTask = (taskData) => {
    createTaskMutation.mutate({
      ...taskData,
      project_id: project?.id,
      project_name: project?.name,
    });
  };

  const handleUpdateTask = (id, taskData) => {
    updateTaskMutation.mutate({ id, data: taskData });
  };

  const handleDeleteTask = (id) => {
    deleteTaskMutation.mutate(id);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    updateTaskMutation.mutate({ id: taskId, data: { status: newStatus } });
    
    // Send notification when task is completed
    if (newStatus === 'completed' && task && project?.client_id) {
      sendTemplate('taskCompleted', project.client_id, {
        projectName: project.name,
        projectId: project.id,
        taskTitle: task.title
      });
    }
  };

  // Task statistics
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <ListTodo className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">משימות הפרויקט</h2>
              <p className="text-sm text-slate-500 font-normal">{stats.total} משימות</p>
            </div>
          </CardTitle>

          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-4 h-4" />
                קנבן
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  viewMode === 'list' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                רשימה
              </button>
            </div>

            <Button
              onClick={() => {
                setEditingTask(null);
                setShowTaskForm(true);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Plus className="w-4 h-4 ml-2" />
              משימה חדשה
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-slate-300" />
            <span className="text-slate-600">ממתין: {stats.pending}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-slate-600">בתהליך: {stats.in_progress}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-600">הושלם: {stats.completed}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : viewMode === 'kanban' ? (
          <TaskKanbanView
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        ) : (
          <TaskListView
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        )}
      </CardContent>

      {/* Task Form Dialog */}
      <TaskFormDialog
        isOpen={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setEditingTask(null);
        }}
        task={editingTask}
        project={project}
        onSave={editingTask ? (data) => handleUpdateTask(editingTask.id, data) : handleCreateTask}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />
    </Card>
  );
}