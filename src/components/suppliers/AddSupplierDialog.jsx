import React, { useState } from 'react';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showSuccess, showError } from '../utils/notifications';
import { useAuth } from '@/lib/AuthContext';

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\-+().\s]{7,20}$/;

const categoryOptions = [
  { value: 'furniture', label: 'ריהוט' },
  { value: 'lighting', label: 'תאורה' },
  { value: 'flooring', label: 'ריצוף' },
  { value: 'tiles', label: 'אריחים' },
  { value: 'sanitary', label: 'סניטריה' },
  { value: 'kitchen', label: 'מטבחים' },
  { value: 'doors_windows', label: 'דלתות וחלונות' },
  { value: 'paint', label: 'צבעים' },
  { value: 'fabrics', label: 'טקסטיל' },
  { value: 'accessories', label: 'אביזרים' },
  { value: 'outdoor', label: 'חוץ' },
  { value: 'electronics', label: 'אלקטרוניקה' },
  { value: 'other', label: 'אחר' },
];

export default function AddSupplierDialog({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  
  // Get current user to set architect_id (fallback: authUser from context)
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => archiflow.auth.me(),
  });
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'other',
    company: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    payment_terms: '',
    delivery_time: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState({});

  const createSupplierMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Supplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      showSuccess('הספק נוסף בהצלחה! ✓');
      onClose();
      setFormData({
        name: '',
        category: 'other',
        company: '',
        phone: '',
        email: '',
        website: '',
        address: '',
        payment_terms: '',
        delivery_time: '',
        notes: '',
      });
    },
    onError: (error) => {
      console.error('Failed to create supplier:', error);
      showError('שגיאה בהוספת ספק. אנא נסה שוב.');
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
    
    const newErrors = {};
    const phoneError = validateField('phone', formData.phone);
    const emailError = validateField('email', formData.email);
    
    if (phoneError) newErrors.phone = phoneError;
    if (emailError) newErrors.email = emailError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const payload = {
      ...formData,
      status: 'active',
      rating: 0,
      orders_completed: 0,
      architect_id: currentUser?.id || authUser?.id || authUser?.architect_id || null,
      architect_email: currentUser?.email || authUser?.email || authUser?.architect_email || null,
      created_by: currentUser?.email || authUser?.email || null,
      approval_status: 'approved',
    };

    createSupplierMutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border shadow-organic-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            הוסף ספק חדש
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">שם הספק *</Label>
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
              <Label htmlFor="category">קטגוריה *</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger className="mt-1 border-border bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website">אתר אינטרנט</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="mt-1 border-border bg-background"
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            <div>
              <Label htmlFor="address">כתובת</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1 border-border bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_terms">תנאי תשלום</Label>
              <Input
                id="payment_terms"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="mt-1 border-border bg-background"
                placeholder="למשל: שוטף + 30"
              />
            </div>
            <div>
              <Label htmlFor="delivery_time">זמן אספקה</Label>
              <Input
                id="delivery_time"
                value={formData.delivery_time}
                onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                className="mt-1 border-border bg-background"
                placeholder="למשל: 2-3 שבועות"
              />
            </div>
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
              disabled={createSupplierMutation.isPending}
            >
              {createSupplierMutation.isPending && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              הוסף ספק
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}