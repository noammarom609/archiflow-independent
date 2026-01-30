import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Phone, Mail, Clock, AlertCircle, FileText, Plus } from 'lucide-react';
import TaskFormDialog from '@/components/projects/tasks/TaskFormDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/utils/notifications';

export default function ContractorManagement({ project, selectedQuote, contractorDetails, tasks = [] }) {
  const queryClient = useQueryClient();
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
      showSuccess('משימה נוצרה בהצלחה');
      setShowTaskDialog(false);
      setEditingTask(null);
    },
    onError: () => showError('שגיאה ביצירת משימה')
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectTasks'] });
      showSuccess('משימה עודכנה בהצלחה');
      setShowTaskDialog(false);
      setEditingTask(null);
    },
    onError: () => showError('שגיאה בעדכון משימה')
  });

  const handleSaveTask = (taskData) => {
    const payload = {
      ...taskData,
      project_id: project.id,
      project_name: project.name,
      contractor_id: taskData.contractor_id || contractorDetails?.id, // Default to main contractor if not selected
      contractor_name: taskData.contractor_name || contractorDetails?.name,
    };

    if (editingTask) {
      updateTaskMutation.mutate({ id: editingTask.id, data: payload });
    } else {
      createTaskMutation.mutate(payload);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Selected Contractor */}
      {selectedQuote && contractorDetails ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-green-900">
              <CheckCircle2 className="w-5 h-5" />
              קבלן מבצע נבחר
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-green-900">{contractorDetails.name}</h3>
                <p className="text-green-700">{contractorDetails.specialty}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-green-800">
                  {contractorDetails.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {contractorDetails.phone}
                    </span>
                  )}
                  {contractorDetails.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {contractorDetails.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left">
                <p className="text-3xl font-bold text-green-800">
                  ₪{(selectedQuote.quote_amount || 0).toLocaleString()}
                </p>
                {selectedQuote.timeline_days && (
                  <p className="text-sm text-green-700">
                    <Clock className="w-4 h-4 inline ml-1" />
                    {selectedQuote.timeline_days} ימים לביצוע
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="font-semibold text-amber-900">לא נבחר קבלן ראשי</h3>
            <p className="text-sm text-amber-700">ניתן לנהל משימות, אך מומלץ לבחור קבלן בשלב התוכניות</p>
          </CardContent>
        </Card>
      )}

      {/* Tasks */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">משימות לביצוע</CardTitle>
            <div className="flex items-center gap-3">
              <Badge className="bg-indigo-100 text-indigo-800">
                {tasks.filter(t => t.status === 'completed').length}/{tasks.length} הושלמו
              </Badge>
              <Button size="sm" onClick={() => setShowTaskDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 ml-2" />
                משימה חדשה
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>אין משימות פתוחות לפרויקט זה</p>
              <Button variant="outline" className="mt-3" onClick={() => setShowTaskDialog(true)}>
                <Plus className="w-4 h-4 ml-2" />
                הוסף משימה ראשונה
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleEditTask(task)}
                  className={`p-4 rounded-lg border-2 cursor-pointer hover:shadow-sm transition-all ${
                    task.status === 'completed'
                      ? 'border-green-200 bg-green-50'
                      : task.status === 'in_progress'
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{task.title}</h4>
                      {task.description && <p className="text-sm text-slate-600 mt-1">{task.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        {task.contractor_name && (
                          <Badge variant="outline" className="bg-white/50">
                            {task.contractor_name}
                          </Badge>
                        )}
                        {task.due_date && (
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-800'
                      }>
                        {task.status === 'completed' ? 'הושלם' :
                         task.status === 'in_progress' ? 'בתהליך' : 'ממתין'}
                      </Badge>
                      <Badge variant="outline" className={
                        task.priority === 'urgent' ? 'border-red-500 text-red-600' :
                        task.priority === 'high' ? 'border-orange-500 text-orange-600' :
                        'border-slate-200 text-slate-500'
                      }>
                        {task.priority === 'urgent' ? 'דחוף' :
                         task.priority === 'high' ? 'גבוה' :
                         task.priority === 'low' ? 'נמוך' : 'רגיל'}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TaskFormDialog
        isOpen={showTaskDialog}
        onClose={() => {
          setShowTaskDialog(false);
          setEditingTask(null);
        }}
        task={editingTask}
        project={project}
        onSave={handleSaveTask}
        isLoading={createTaskMutation.isPending || updateTaskMutation.isPending}
      />
    </div>
  );
}