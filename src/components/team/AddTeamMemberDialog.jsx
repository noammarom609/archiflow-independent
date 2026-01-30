import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Shield } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { showError, showSuccess } from '../utils/notifications';

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\-+().\s]{7,20}$/;

export default function AddTeamMemberDialog({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'designer',
    department: 'design',
    hourly_rate: '',
    permissions: {
      can_create_projects: false,
      can_edit_projects: false,
      can_delete_projects: false,
      can_manage_team: false,
      can_assign_tasks: false,
      can_view_financials: false,
      can_approve_work: false,
    },
  });
  
  const [errors, setErrors] = useState({});

  const createMemberMutation = useMutation({
    mutationFn: (data) => archiflow.entities.TeamMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
      showSuccess('חבר צוות נוסף בהצלחה!');
      onClose();
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        role: 'designer',
        department: 'design',
        hourly_rate: '',
        permissions: {
          can_create_projects: false,
          can_edit_projects: false,
          can_delete_projects: false,
          can_manage_team: false,
          can_assign_tasks: false,
          can_view_financials: false,
          can_approve_work: false,
        },
      });
    },
  });

  const validateField = (field, value) => {
    if (field === 'email') {
      if (!value) return 'שדה חובה';
      if (!EMAIL_REGEX.test(value)) return 'כתובת אימייל לא תקינה';
    }
    if (field === 'phone' && value && !PHONE_REGEX.test(value)) {
      return 'מספר טלפון לא תקין (לפחות 7 ספרות)';
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
    
    // Validate all fields
    const newErrors = {};
    const emailError = validateField('email', formData.email);
    const phoneError = validateField('phone', formData.phone);
    
    if (emailError) newErrors.email = emailError;
    if (phoneError) newErrors.phone = phoneError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    createMemberMutation.mutate({
      ...formData,
      status: 'active',
      projects_assigned: [],
    });
  };

  const togglePermission = (permission) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: !formData.permissions[permission],
      },
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                הוסף חבר צוות חדש
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">מידע בסיסי</h3>
                  
                  <div>
                    <Label htmlFor="full_name">שם מלא *</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">אימייל *</Label>
                      <Input
                        id="email"
                        type="text"
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        onBlur={() => handleFieldBlur('email')}
                        required
                        className={`mt-2 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        dir="ltr"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <Label htmlFor="phone">טלפון</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        onBlur={() => handleFieldBlur('phone')}
                        className={`mt-2 ${errors.phone ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        dir="ltr"
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">תפקיד *</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">אדמין</SelectItem>
                          <SelectItem value="project_manager">מנהל פרויקט</SelectItem>
                          <SelectItem value="designer">מעצב</SelectItem>
                          <SelectItem value="client">לקוח</SelectItem>
                          <SelectItem value="contractor">קבלן</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">מחלקה</Label>
                      <Select value={formData.department} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="architecture">אדריכלות</SelectItem>
                          <SelectItem value="design">עיצוב</SelectItem>
                          <SelectItem value="project_management">ניהול פרויקטים</SelectItem>
                          <SelectItem value="finance">כספים</SelectItem>
                          <SelectItem value="execution">ביצוע</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="hourly_rate">תעריף שעתי (₪)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      value={formData.hourly_rate}
                      onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-semibold text-slate-900">הרשאות</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'can_create_projects', label: 'יצירת פרויקטים' },
                      { key: 'can_edit_projects', label: 'עריכת פרויקטים' },
                      { key: 'can_delete_projects', label: 'מחיקת פרויקטים' },
                      { key: 'can_manage_team', label: 'ניהול צוות' },
                      { key: 'can_assign_tasks', label: 'הקצאת משימות' },
                      { key: 'can_view_financials', label: 'צפייה בכספים' },
                      { key: 'can_approve_work', label: 'אישור עבודות' },
                    ].map((permission) => (
                      <div key={permission.key} className="flex items-center gap-2">
                        <Checkbox
                          checked={formData.permissions[permission.key]}
                          onCheckedChange={() => togglePermission(permission.key)}
                        />
                        <label className="text-sm text-slate-700">{permission.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    ביטול
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    disabled={createMemberMutation.isPending}
                  >
                    {createMemberMutation.isPending ? 'שומר...' : 'הוסף חבר צוות'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}