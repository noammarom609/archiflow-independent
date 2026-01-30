import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { showSuccess, showError } from '../../utils/notifications';

export default function AddQuoteDialog({ isOpen, onClose, project, contractors }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    contractor_id: '',
    quote_amount: '',
    timeline_days: '',
    notes: '',
    file_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const createQuoteMutation = useMutation({
    mutationFn: (data) => archiflow.entities.ContractorQuote.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractorQuotes', project?.id] });
      showSuccess('הצעת מחיר נוספה בהצלחה');
      onClose();
      setFormData({ contractor_id: '', quote_amount: '', timeline_days: '', notes: '', file_url: '' });
    },
    onError: () => showError('שגיאה בהוספת ההצעה')
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.contractor_id || !formData.quote_amount) {
      showError('יש למלא קבלן ומחיר');
      return;
    }

    const selectedContractor = contractors.find(c => c.id === formData.contractor_id);

    createQuoteMutation.mutate({
      project_id: String(project.id),
      project_name: project.name,
      contractor_id: formData.contractor_id,
      contractor_name: selectedContractor?.name || 'Unknown',
      contractor_specialty: selectedContractor?.specialty,
      quote_amount: parseFloat(formData.quote_amount),
      timeline_days: parseInt(formData.timeline_days) || 0,
      notes: formData.notes,
      quote_file_url: formData.file_url,
      status: 'received',
      submitted_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await archiflow.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, file_url }));
      showSuccess('קובץ ההצעה הועלה');
    } catch (error) {
      showError('שגיאה בהעלאת קובץ');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת הצעת מחיר ידנית</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>קבלן</Label>
            <Select 
              value={formData.contractor_id} 
              onValueChange={(val) => setFormData({...formData, contractor_id: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר קבלן" />
              </SelectTrigger>
              <SelectContent>
                {contractors.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} - {c.specialty}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>מחיר (₪)</Label>
              <Input 
                type="number" 
                value={formData.quote_amount}
                onChange={(e) => setFormData({...formData, quote_amount: e.target.value})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>משך עבודה (ימים)</Label>
              <Input 
                type="number" 
                value={formData.timeline_days}
                onChange={(e) => setFormData({...formData, timeline_days: e.target.value})}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>קובץ הצעה (אופציונלי)</Label>
            <Input 
              type="file" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            {isUploading && <span className="text-xs text-blue-500">מעלה...</span>}
          </div>

          <div className="space-y-2">
            <Label>הערות</Label>
            <Textarea 
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="הערות נוספות..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button 
              type="submit" 
              disabled={createQuoteMutation.isPending || isUploading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {createQuoteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שמור הצעה'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}