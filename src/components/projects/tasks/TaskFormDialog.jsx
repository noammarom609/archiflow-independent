import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Calendar, User, FileText, Clock } from 'lucide-react';

const statusOptions = [
  { value: 'pending', label: 'ממתין' },
  { value: 'in_progress', label: 'בתהליך' },
  { value: 'review', label: 'לבדיקה' },
  { value: 'completed', label: 'הושלם' },
  { value: 'blocked', label: 'חסום' },
];

const priorityOptions = [
  { value: 'low', label: 'נמוכה' },
  { value: 'medium', label: 'בינונית' },
  { value: 'high', label: 'גבוהה' },
  { value: 'urgent', label: 'דחוף' },
];

export default function TaskFormDialog({ isOpen, onClose, task, project, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    due_date: '',
    start_date: '',
    contractor_id: '',
    contractor_name: '',
    estimated_hours: '',
    notes: '',
  });

  // Fetch contractors for assignment
  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.list('-created_date'),
  });

  // Fetch documents for linking
  const { data: documents = [] } = useQuery({
    queryKey: ['projectDocuments', project?.id],
    queryFn: () => base44.entities.Document.filter({ project_id: project?.id }),
    enabled: !!project?.id,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        due_date: task.due_date || '',
        start_date: task.start_date || '',
        contractor_id: task.contractor_id || '',
        contractor_name: task.contractor_name || '',
        estimated_hours: task.estimated_hours || '',
        notes: task.notes || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: '',
        start_date: '',
        contractor_id: '',
        contractor_name: '',
        estimated_hours: '',
        notes: '',
      });
    }
  }, [task, isOpen]);

  const handleContractorChange = (contractorId) => {
    const contractor = contractors.find(c => c.id === contractorId);
    setFormData(prev => ({
      ...prev,
      contractor_id: contractorId,
      contractor_name: contractor?.name || '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-600" />
            {task ? 'עריכת משימה' : 'משימה חדשה'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">כותרת המשימה *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="הזן כותרת למשימה"
              required
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="תיאור מפורט של המשימה"
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>סטטוס</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>עדיפות</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date" className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                תאריך התחלה
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="due_date" className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                תאריך יעד
              </Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <Label className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              הקצאה לקבלן/אחראי
            </Label>
            <Select
              value={formData.contractor_id}
              onValueChange={handleContractorChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="בחר אחראי למשימה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>ללא הקצאה</SelectItem>
                {contractors.map(contractor => (
                  <SelectItem key={contractor.id} value={contractor.id}>
                    {contractor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Hours */}
          <div>
            <Label htmlFor="estimated_hours" className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              שעות משוערות
            </Label>
            <Input
              id="estimated_hours"
              type="number"
              value={formData.estimated_hours}
              onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
              placeholder="מספר שעות"
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="הערות נוספות"
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.title}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                task ? 'עדכן משימה' : 'צור משימה'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}