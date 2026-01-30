import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';
import { useNotifications } from '@/hooks/use-notifications';

export default function NewInvoiceDialog({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { sendTemplate } = useNotifications();
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [formData, setFormData] = useState({
    project_id: '',
    project_name: '',
    client_name: '',
    amount: '',
    status: 'pending',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: '',
    notes: '',
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Invoice.create(data),
    onSuccess: (createdInvoice) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showSuccess('חשבונית נוצרה בהצלחה!');
      
      // Send notification to client
      if (selectedProject?.client_id) {
        sendTemplate('invoiceCreated', selectedProject.client_id, {
          projectName: selectedProject.name,
          projectId: selectedProject.id,
          invoiceNumber: createdInvoice?.invoice_number || 'חדשה',
          amount: parseFloat(formData.amount).toLocaleString()
        });
      }
      
      resetForm();
      setSelectedProject(null);
      onClose();
    },
    onError: () => showError('שגיאה ביצירת החשבונית'),
  });

  const resetForm = () => {
    setFormData({
      project_id: '',
      project_name: '',
      client_name: '',
      amount: '',
      status: 'pending',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      description: '',
      notes: '',
    });
  };

  const handleProjectSelect = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setFormData(prev => ({
        ...prev,
        project_id: projectId,
        project_name: project.name,
        client_name: project.client || '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.project_name) {
      showError('יש למלא שם פרויקט וסכום');
      return;
    }
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      invoice_number: `INV-${Date.now()}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>חשבונית חדשה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>פרויקט</Label>
            <Select value={formData.project_id} onValueChange={handleProjectSelect}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="בחר פרויקט" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>שם לקוח</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                className="mt-1"
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>תאריך הנפקה</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>תאריך יעד לתשלום</Label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>סטטוס</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">טיוטה</SelectItem>
                <SelectItem value="pending">ממתין לתשלום</SelectItem>
                <SelectItem value="paid">שולם</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>תיאור</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="flex-1">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'צור חשבונית'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}