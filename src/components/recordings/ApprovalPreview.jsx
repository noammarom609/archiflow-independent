import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle2,
  Edit2,
  Save,
  X,
  Briefcase,
  UserPlus,
  Calendar,
  DollarSign,
  FileText,
  Bell,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function ApprovalPreview({ recording, onApprove, onCancel }) {
  const [editMode, setEditMode] = useState({});
  const [selections, setSelections] = useState({
    createTasks: true,
    createJournalEntry: true,
    updateProject: true,
    sendNotifications: true,
    createCalendarEvents: true,
    updateBudget: true,
  });
  const [editedData, setEditedData] = useState({
    tasks: recording?.deep_analysis?.action_items || [],
    projects: recording?.deep_analysis?.projects_identified || [],
    financials: recording?.deep_analysis?.financial_data || [],
  });

  const toggleEdit = (section) => {
    setEditMode(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const updateTaskField = (index, field, value) => {
    setEditedData(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const removeTask = (index) => {
    setEditedData(prev => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index)
    }));
  };

  const handleApprove = () => {
    onApprove({
      selections,
      editedData,
      recording
    });
  };

  const analysis = recording?.analysis || {};
  const deepAnalysis = recording?.deep_analysis || {};

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">מקדימה לפני אישור</h2>
          <p className="text-slate-600 mt-1">בחר מה לעדכן במערכת ועדכן פרטים בעת הצורך</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800">
            {Object.values(selections).filter(Boolean).length} פעולות נבחרו
          </Badge>
        </div>
      </div>

      {/* Sentiment Analysis */}
      {deepAnalysis.sentiment && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg">ניתוח רגשי</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm text-slate-600 mb-2">טון כללי:</p>
                  <Badge className={
                    deepAnalysis.sentiment.overall === 'positive' ? 'bg-green-100 text-green-800' :
                    deepAnalysis.sentiment.overall === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }>
                    {deepAnalysis.sentiment.overall === 'positive' ? 'חיובי' :
                     deepAnalysis.sentiment.overall === 'negative' ? 'שלילי' : 'ניטרלי'}
                  </Badge>
                </div>
                {deepAnalysis.sentiment.key_emotions && (
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 mb-2">רגשות מרכזיים:</p>
                    <div className="flex gap-2 flex-wrap">
                      {deepAnalysis.sentiment.key_emotions.map((emotion, i) => (
                        <Badge key={i} variant="outline">{emotion}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tasks Preview */}
      {editedData.tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selections.createTasks}
                    onCheckedChange={(checked) => 
                      setSelections(prev => ({ ...prev, createTasks: checked }))
                    }
                  />
                  <Briefcase className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">משימות ({editedData.tasks.length})</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleEdit('tasks')}
                >
                  {editMode.tasks ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  {editMode.tasks ? 'שמור' : 'ערוך'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {editedData.tasks.map((task, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg border">
                    {editMode.tasks ? (
                      <div className="space-y-2">
                        <Input
                          value={task.task}
                          onChange={(e) => updateTaskField(index, 'task', e.target.value)}
                          placeholder="תיאור המשימה"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={task.assignee || ''}
                            onChange={(e) => updateTaskField(index, 'assignee', e.target.value)}
                            placeholder="אחראי"
                          />
                          <Input
                            type="date"
                            value={task.deadline || ''}
                            onChange={(e) => updateTaskField(index, 'deadline', e.target.value)}
                          />
                          <Select
                            value={task.priority || 'medium'}
                            onValueChange={(value) => updateTaskField(index, 'priority', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">נמוכה</SelectItem>
                              <SelectItem value="medium">בינונית</SelectItem>
                              <SelectItem value="high">גבוהה</SelectItem>
                              <SelectItem value="urgent">דחוף</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTask(index)}
                          className="text-red-600"
                        >
                          <X className="w-4 h-4 ml-1" />
                          הסר משימה
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-slate-900">{task.task}</p>
                        <div className="flex gap-4 mt-2 text-sm text-slate-600">
                          {task.assignee && <span>👤 {task.assignee}</span>}
                          {task.deadline && <span>📅 {task.deadline}</span>}
                          {task.priority && (
                            <Badge variant="outline" className="text-xs">
                              {task.priority === 'urgent' ? 'דחוף' :
                               task.priority === 'high' ? 'גבוהה' :
                               task.priority === 'medium' ? 'בינונית' : 'נמוכה'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Journal Entry */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selections.createJournalEntry}
                onCheckedChange={(checked) => 
                  setSelections(prev => ({ ...prev, createJournalEntry: checked }))
                }
              />
              <FileText className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-lg">רשומת יומן</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-indigo-50 rounded-lg">
              <p className="font-medium text-slate-900 mb-2">{recording?.title}</p>
              <p className="text-sm text-slate-700">{analysis.summary}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Projects Update */}
      {editedData.projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selections.updateProject}
                  onCheckedChange={(checked) => 
                    setSelections(prev => ({ ...prev, updateProject: checked }))
                  }
                />
                <Briefcase className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">עדכון פרויקטים</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {editedData.projects.map((project, i) => (
                  <div key={i} className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                    <span className="font-medium">{project.project_name}</span>
                    <Badge variant="outline">
                      {Math.round(project.confidence * 100)}% התאמה
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Financial Data */}
      {editedData.financials.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selections.updateBudget}
                  onCheckedChange={(checked) => 
                    setSelections(prev => ({ ...prev, updateBudget: checked }))
                  }
                />
                <DollarSign className="w-5 h-5 text-green-600" />
                <CardTitle className="text-lg">נתונים כספיים</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {editedData.financials.map((item, i) => (
                  <div key={i} className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-green-700">
                        ₪{item.amount.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{item.context}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selections.sendNotifications}
                onCheckedChange={(checked) => 
                  setSelections(prev => ({ ...prev, sendNotifications: checked }))
                }
              />
              <Bell className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">התראות</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              שליחת התראות לאנשי צוות רלוונטיים על משימות ועדכונים
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Calendar Events */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selections.createCalendarEvents}
                onCheckedChange={(checked) => 
                  setSelections(prev => ({ ...prev, createCalendarEvents: checked }))
                }
              />
              <Calendar className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-lg">אירועי יומן</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              יצירת אירועי follow-up בלוח השנה לדדליינים ומשימות
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t sticky bottom-0 bg-white">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          ביטול
        </Button>
        <Button
          onClick={handleApprove}
          disabled={!Object.values(selections).some(Boolean)}
          className="flex-1 bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <CheckCircle2 className="w-5 h-5 ml-2" />
          אשר ופזר למערכת ({Object.values(selections).filter(Boolean).length})
        </Button>
      </div>
    </div>
  );
}