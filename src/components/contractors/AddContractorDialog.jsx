import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showSuccess, showError } from '../utils/notifications';

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\-+().\s]{7,20}$/;

export default function AddContractorDialog({ isOpen, onClose, initialType = 'contractor' }) {
  const queryClient = useQueryClient();
  
  // Get current user to set architect_id
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });
  
  const [formData, setFormData] = useState({
    name: '',
    type: initialType,
    specialty: 'general_contractor',
    company: '',
    phone: '',
    email: '',
    hourly_rate: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState({});

  // Reset form when opening with new initialType
  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        type: initialType
      }));
    }
  }, [isOpen, initialType]);

  const createContractorMutation = useMutation({
    mutationFn: (data) => base44.entities.Contractor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      
      const typeLabel = formData.type === 'partner' ? 'השותף' : 'הקבלן';
      showSuccess(`${typeLabel} נוסף בהצלחה! ✓`);
      
      onClose();
      setFormData({
        name: '',
        type: 'contractor',
        specialty: 'general_contractor',
        company: '',
        phone: '',
        email: '',
        hourly_rate: '',
        notes: '',
      });
    },
    onError: (error) => {
      console.error('Failed to create contractor:', error);
      showError('שגיאה בהוספת קבלן. אנא נסה שוב.');
    }
  });

  const validateField = (field, value) => {
    if (field === 'phone') {
      if (!value) return 'שדה חובה';
      if (!PHONE_REGEX.test(value)) return 'מספר טלפון לא תקין (לפחות 7 ספרות)';
    }
    if (field === 'email' && value && !EMAIL_REGEX.test(value)) {
      return 'כתובת אימייל לא תקינה';
    }
    return null;
  };

  const handleFieldChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleFieldBlur = (field) => {
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors({ ...errors, [field]: error });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    const phoneError = validateField('phone', formData.phone);
    const emailError = validateField('email', formData.email);
    
    if (phoneError) newErrors.phone = phoneError;
    if (emailError) newErrors.email = emailError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Clean up empty strings for number fields
    const payload = {
      ...formData,
      status: 'active',
      rating: 0,
      projects_completed: 0,
      hourly_rate: formData.hourly_rate ? Number(formData.hourly_rate) : undefined,
      // Add architect_id and architect_email for multi-tenant filtering
      architect_id: currentUser?.id || null,
      architect_email: currentUser?.email || null,
      approval_status: 'approved', // Auto-approve when created by architect
    };

    createContractorMutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border shadow-organic-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            {formData.type === 'partner' ? 'הוסף שותף חדש' : 'הוסף קבלן חדש'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">שם מלא *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="mt-1 border-border bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">סוג *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="mt-1 border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contractor">קבלן</SelectItem>
                    <SelectItem value="partner">שותף</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="specialty">התמחות *</Label>
                <Select value={formData.specialty} onValueChange={(value) => setFormData({ ...formData, specialty: value })}>
                  <SelectTrigger className="mt-1 border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general_contractor">קבלן ראשי</SelectItem>
                    <SelectItem value="electrical">חשמל</SelectItem>
                    <SelectItem value="plumbing">אינסטלציה</SelectItem>
                    <SelectItem value="drywall">גבס</SelectItem>
                    <SelectItem value="flooring">ריצוף</SelectItem>
                    <SelectItem value="carpentry">נגרות</SelectItem>
                    <SelectItem value="painting">צביעה</SelectItem>
                    <SelectItem value="hvac">מיזוג</SelectItem>
                    <SelectItem value="engineer">מהנדס</SelectItem>
                    <SelectItem value="designer">מעצב</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="company">שם חברה</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="mt-1 border-border bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">טלפון *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  onBlur={() => handleFieldBlur('phone')}
                  required
                  className={`mt-1 bg-background ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`}
                  placeholder="050-0000000"
                  dir="ltr"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <Label htmlFor="email">אימייל</Label>
                <Input
                  id="email"
                  type="text"
                  value={formData.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  className={`mt-1 bg-background ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : 'border-border'}`}
                  placeholder="email@example.com"
                  dir="ltr"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="hourly_rate">תעריף שעתי (₪)</Label>
              <Input
                id="hourly_rate"
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                className="mt-1 border-border bg-background"
              />
            </div>

            <div>
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 min-h-[80px] border-border bg-background"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border hover:bg-accent"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-organic"
              disabled={createContractorMutation.isPending}
            >
              {createContractorMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {formData.type === 'partner' ? 'הוסף שותף' : 'הוסף קבלן'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}