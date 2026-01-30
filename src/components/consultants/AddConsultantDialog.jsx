import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Loader2,
  Zap,
  Droplets,
  Lightbulb,
  Shield,
  Wind,
  Volume2,
  Ruler,
  HardHat,
  Users,
  Award,
  MapPin
} from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\-+().\s]{7,20}$/;

// Consultant types with icons
const CONSULTANT_TYPES = [
  { value: 'structural', label: 'קונסטרוקטור', icon: Building2 },
  { value: 'electrical', label: 'יועץ חשמל', icon: Zap },
  { value: 'plumbing', label: 'יועץ אינסטלציה', icon: Droplets },
  { value: 'hvac', label: 'יועץ מיזוג ואוורור', icon: Wind },
  { value: 'lighting', label: 'יועץ תאורה', icon: Lightbulb },
  { value: 'civil_defense', label: 'יועץ פיקוד העורף / הג"ה', icon: Shield },
  { value: 'acoustics', label: 'יועץ אקוסטיקה', icon: Volume2 },
  { value: 'hydrology', label: 'הידרולוג', icon: Droplets },
  { value: 'surveyor', label: 'מודד', icon: Ruler },
  { value: 'fire_safety', label: 'יועץ בטיחות אש', icon: Shield },
  { value: 'accessibility', label: 'יועץ נגישות', icon: Users },
  { value: 'other', label: 'אחר', icon: HardHat },
];

export default function AddConsultantDialog({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { t, isRTL } = useLanguage();
  
  // Get current user to set architect_id
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => archiflow.auth.me(),
  });
  
  const [formData, setFormData] = useState({
    name: '',
    consultant_type: '',
    phone: '',
    email: '',
    company: '',
    license_number: '',
    address: '',
    notes: '',
    status: 'active',
    rating: null,
  });
  
  const [errors, setErrors] = useState({});

  const createConsultantMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Consultant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultants'] });
      showSuccess(t('consultants.addSuccess') || 'יועץ נוסף בהצלחה!');
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating consultant:', error);
      showError(t('consultants.addError') || 'שגיאה בהוספת היועץ');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      consultant_type: '',
      phone: '',
      email: '',
      company: '',
      license_number: '',
      address: '',
      notes: '',
      status: 'active',
      rating: null,
    });
  };

  const validateField = (field, value) => {
    if (field === 'phone') {
      if (!value) return 'שדה חובה';
      if (!PHONE_REGEX.test(value)) return 'מספר טלפון לא תקין (לפחות 7 ספרות)';
    }
    if (field === 'email') {
      if (!value) return 'שדה חובה';
      if (!EMAIL_REGEX.test(value)) return 'כתובת אימייל לא תקינה';
    }
    return null;
  };

  const handleFieldBlur = (field) => {
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.consultant_type || !formData.phone || !formData.email) {
      showError(t('consultants.requiredFields') || 'שם, סוג יועץ, טלפון ואימייל הם שדות חובה');
      return;
    }

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

    // Add architect_id and architect_email for multi-tenant filtering
    const dataWithArchitect = {
      ...formData,
      architect_id: currentUser?.id || null,
      architect_email: currentUser?.email || null,
      approval_status: 'approved', // Auto-approve when created by architect
    };

    createConsultantMutation.mutate(dataWithArchitect);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border shadow-organic-xl" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            {t('consultants.addNewConsultant') || 'הוספת יועץ חדש'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name */}
          <div>
            <Label className="text-foreground">{t('consultants.consultantName') || 'שם היועץ'} *</Label>
            <div className="relative mt-1">
              <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <Input
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'} border-border bg-background focus:border-primary focus:ring-primary/20`}
                placeholder={t('consultants.fullName') || 'שם מלא'}
              />
            </div>
          </div>

          {/* Consultant Type */}
          <div>
            <Label className="text-foreground">{t('consultants.consultantType') || 'סוג יועץ'} *</Label>
            <Select value={formData.consultant_type} onValueChange={(value) => updateField('consultant_type', value)}>
              <SelectTrigger className="mt-1 border-border bg-background focus:border-primary focus:ring-primary/20">
                <SelectValue placeholder={t('consultants.selectType') || 'בחר סוג יועץ...'} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border shadow-organic-lg">
                {CONSULTANT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value} className="hover:bg-accent focus:bg-accent">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">{t('common.phone') || 'טלפון'} *</Label>
              <div className="relative mt-1">
                <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  onBlur={() => handleFieldBlur('phone')}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} bg-background focus:ring-primary/20 ${errors.phone ? 'border-red-500 focus:border-red-500 focus-visible:ring-red-500' : 'border-border focus:border-primary'}`}
                  placeholder="050-0000000"
                  dir="ltr"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <Label className="text-foreground">{t('common.email') || 'אימייל'} *</Label>
              <div className="relative mt-1">
                <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  type="text"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  onBlur={() => handleFieldBlur('email')}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} bg-background focus:ring-primary/20 ${errors.email ? 'border-red-500 focus:border-red-500 focus-visible:ring-red-500' : 'border-border focus:border-primary'}`}
                  placeholder="email@example.com"
                  dir="ltr"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Company & License */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-foreground">{t('consultants.company') || 'חברה/משרד'}</Label>
              <div className="relative mt-1">
                <Building2 className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} border-border bg-background focus:border-primary focus:ring-primary/20`}
                  placeholder={t('consultants.companyName') || 'שם החברה'}
                />
              </div>
            </div>

            <div>
              <Label className="text-foreground">{t('consultants.licenseNumber') || 'מספר רישיון'}</Label>
              <div className="relative mt-1">
                <Award className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                <Input
                  value={formData.license_number}
                  onChange={(e) => updateField('license_number', e.target.value)}
                  className={`${isRTL ? 'pr-10' : 'pl-10'} border-border bg-background focus:border-primary focus:ring-primary/20`}
                  placeholder={t('consultants.licenseNumber') || 'מספר רישיון'}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <Label className="text-foreground">{t('common.address') || 'כתובת'}</Label>
            <div className="relative mt-1">
              <MapPin className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
              <Input
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                className={`${isRTL ? 'pr-10' : 'pl-10'} border-border bg-background focus:border-primary focus:ring-primary/20`}
                placeholder={t('consultants.streetCity') || 'רחוב, עיר'}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-foreground">{t('common.notes') || 'הערות'}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className="mt-1 border-border bg-background focus:border-primary focus:ring-primary/20"
              placeholder={t('consultants.notesPlaceholder') || 'הערות נוספות על היועץ...'}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="border-border hover:bg-accent"
          >
            {t('common.cancel') || 'ביטול'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createConsultantMutation.isPending}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-organic hover-lift"
          >
            {createConsultantMutation.isPending ? (
              <Loader2 className={`w-4 h-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
            ) : null}
            {t('consultants.addConsultant') || 'הוסף יועץ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}