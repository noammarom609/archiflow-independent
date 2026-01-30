import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Mail, Briefcase, ShieldCheck, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  APP_ROLES, 
  ROLE_PRESETS, 
  AVAILABLE_PAGES,
  roleRequiresApproval,
  getAssignableRoles 
} from './constants';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';

export default function InviteUserDialog({ isOpen, onClose, onInvite, isLoading, initialData }) {
  const [formData, setFormData] = useState({
    email: '',
    app_role: 'team_member',
    full_name: '',
  });

  // Get current user to determine which roles they can assign
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(base44),
  });

  // Reset form when dialog opens with initial data
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: initialData?.email || '',
        app_role: initialData?.app_role || 'team_member',
        full_name: initialData?.full_name || '',
      });
    }
  }, [isOpen, initialData]);

  // Get roles this user can assign
  const assignableRoles = getAssignableRoles(currentUser?.app_role);

  // Get selected role info
  const selectedRole = APP_ROLES.find(r => r.value === formData.app_role);
  const allowedPages = ROLE_PRESETS[formData.app_role] || [];
  const needsApproval = roleRequiresApproval(formData.app_role);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Determine built-in platform role
      const builtInRole = ['admin', 'super_admin'].includes(formData.app_role) ? 'admin' : 'user';
      
      await onInvite({
        email: formData.email,
        full_name: formData.full_name,
        role: builtInRole,
        app_role: formData.app_role,
        allowed_pages: allowedPages,
        // Set initial approval status based on role
        approval_status: needsApproval ? 'pending' : 'approved',
        status: needsApproval ? 'pending_approval' : 'active',
      });
    } catch (err) {
      console.error('Invite error:', err);
      // Better error message extraction
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.error ||
                       err.message || 
                       'שגיאה בשליחת ההזמנה';
      
      // Check for user already exists
      if (errorMsg.includes('already') || err.response?.status === 409) {
        setError('משתמש עם אימייל זה כבר קיים במערכת');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPageLabel = (pageId) => {
    const page = AVAILABLE_PAGES.find(p => p.id === pageId);
    return page?.label || pageId;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">הזמנת משתמש חדש</DialogTitle>
          <DialogDescription>
            הזן את פרטי המשתמש ובחר תפקיד. המשתמש יקבל הזמנה במייל.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label>כתובת אימייל *</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                required
                placeholder="user@company.com"
                className="pr-10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                dir="ltr"
              />
            </div>
          </div>

          {/* Full Name (optional) */}
          <div className="space-y-2">
            <Label>שם מלא (אופציונלי)</Label>
            <Input
              type="text"
              placeholder="ישראל ישראלי"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>תפקיד *</Label>
            <Select
              value={formData.app_role}
              onValueChange={(value) => setFormData({ ...formData, app_role: value })}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="בחר תפקיד" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <div className="flex flex-col py-1">
                      <span className="font-medium">{role.label}</span>
                      {role.description && (
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Info Card */}
          {selectedRole && (
            <Card className="bg-accent/50 border-border">
              <CardContent className="p-4 space-y-3">
                {/* Role Description */}
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedRole.label}</p>
                    {selectedRole.description && (
                      <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
                    )}
                  </div>
                </div>

                {/* Approval Status */}
                <div className="flex items-center gap-2">
                  {needsApproval ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <span className="text-xs text-yellow-700">המשתמש יצטרך אישור לפני כניסה למערכת</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-green-700">המשתמש יאושר אוטומטית</span>
                    </>
                  )}
                </div>

                {/* Allowed Pages */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    דפים שיהיו זמינים:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {allowedPages.slice(0, 6).map(pageId => (
                      <Badge key={pageId} variant="secondary" className="text-xs">
                        {getPageLabel(pageId)}
                      </Badge>
                    ))}
                    {allowedPages.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{allowedPages.length - 6} נוספים
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} type="button">
            ביטול
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || isSubmitting || !formData.email}
            className="bg-primary hover:bg-primary/90"
          >
            {(isLoading || isSubmitting) ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            שלח הזמנה
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}