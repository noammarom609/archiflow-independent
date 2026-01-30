import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';

const categories = {
  materials: 'חומרים',
  contractors: 'קבלנים',
  office: 'משרד',
  marketing: 'שיווק',
  equipment: 'ציוד',
  travel: 'נסיעות',
  other: 'אחר',
};

export default function NewExpenseDialog({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    description: '',
    category: 'other',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    project_id: '',
    project_name: '',
    contractor_id: '',
    contractor_name: '',
    receipt_url: '',
    notes: '',
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => archiflow.entities.Project.list('-created_date'),
    enabled: isOpen,
  });

  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => archiflow.entities.Contractor.list('-created_date'),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showSuccess('הוצאה נוספה בהצלחה!');
      resetForm();
      onClose();
    },
    onError: () => showError('שגיאה בהוספת ההוצאה'),
  });

  const resetForm = () => {
    setFormData({
      description: '',
      category: 'other',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      project_id: '',
      project_name: '',
      contractor_id: '',
      contractor_name: '',
      receipt_url: '',
      notes: '',
    });
  };

  const handleProjectSelect = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      project_name: project?.name || '',
    }));
  };

  const handleContractorSelect = (contractorId) => {
    const contractor = contractors.find(c => c.id === contractorId);
    setFormData(prev => ({
      ...prev,
      contractor_id: contractorId,
      contractor_name: contractor?.name || '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount) {
      showError('יש למלא תיאור וסכום');
      return;
    }
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>הוצאה חדשה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>תיאור *</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="תיאור ההוצאה"
              className="mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>קטגוריה</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categories).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>סכום (₪) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
          </div>

          <div>
            <Label>תאריך הוצאה</Label>
            <Input
              type="date"
              value={formData.expense_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>פרויקט (אופציונלי)</Label>
              <Select value={formData.project_id} onValueChange={handleProjectSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר פרויקט" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא פרויקט</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>קבלן (אופציונלי)</Label>
              <Select value={formData.contractor_id} onValueChange={handleContractorSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר קבלן" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>ללא קבלן</SelectItem>
                  {contractors.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>הערות</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'הוסף הוצאה'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}