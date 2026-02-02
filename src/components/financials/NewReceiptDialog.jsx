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

const paymentMethods = {
  cash: 'מזומן',
  check: 'צ׳ק',
  bank_transfer: 'העברה בנקאית',
  credit_card: 'כרטיס אשראי',
  bit: 'ביט',
};

export default function NewReceiptDialog({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    invoice_id: '',
    invoice_number: '',
    project_id: '',
    project_name: '',
    client_name: '',
    amount: '',
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Fetch pending/overdue invoices only
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => archiflow.entities.Invoice.list('-created_date'),
    enabled: isOpen,
  });

  const pendingInvoices = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Create receipt (uses anon client to avoid 401)
      const receipt = await archiflow.entities.Receipt.create(data);
      let invoiceUpdated = true;
      if (data.invoice_id) {
        try {
          await archiflow.entities.Invoice.update(data.invoice_id, {
            status: 'paid',
            paid_date: data.payment_date,
          });
        } catch (updateErr) {
          console.warn('[Receipt] Invoice status update failed:', updateErr);
          invoiceUpdated = false;
        }
      }
      return { receipt, invoiceUpdated };
    },
    onSuccess: (result) => {
      const receipt = result.receipt ?? result;
      const invoiceUpdated = result.invoiceUpdated !== false;
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showSuccess(invoiceUpdated ? 'קבלה נוצרה בהצלחה והחשבונית עודכנה!' : 'קבלה נוצרה בהצלחה!');
      resetForm();
      onClose();
    },
    onError: () => showError('שגיאה ביצירת הקבלה'),
  });

  const resetForm = () => {
    setFormData({
      invoice_id: '',
      invoice_number: '',
      project_id: '',
      project_name: '',
      client_name: '',
      amount: '',
      payment_method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleInvoiceSelect = (invoiceId) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice) {
      setFormData(prev => ({
        ...prev,
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number || '',
        project_id: invoice.project_id || '',
        project_name: invoice.project_name || '',
        client_name: invoice.client_name || '',
        amount: invoice.amount?.toString() || '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.client_name) {
      showError('יש למלא שם לקוח וסכום');
      return;
    }
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount),
      receipt_number: `RCP-${Date.now()}`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>קבלה חדשה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>קשר לחשבונית (אופציונלי)</Label>
            <Select value={formData.invoice_id} onValueChange={handleInvoiceSelect}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="בחר חשבונית לקישור" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>ללא קישור לחשבונית</SelectItem>
                {pendingInvoices.map(inv => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.project_name} - ₪{inv.amount?.toLocaleString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {pendingInvoices.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">אין חשבוניות ממתינות לתשלום</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>שם לקוח *</Label>
              <Input
                value={formData.client_name}
                onChange={(e) => setFormData(prev => ({ ...prev, client_name: e.target.value }))}
                className="mt-1"
                required
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

          <div>
            <Label>שם פרויקט</Label>
            <Input
              value={formData.project_name}
              onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>אמצעי תשלום</Label>
              <Select value={formData.payment_method} onValueChange={(v) => setFormData(prev => ({ ...prev, payment_method: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(paymentMethods).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>תאריך תשלום</Label>
              <Input
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                className="mt-1"
              />
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
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'צור קבלה'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}