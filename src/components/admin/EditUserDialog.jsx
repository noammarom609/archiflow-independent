import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Activity, Trash2, Briefcase, ShieldCheck, Info, CheckCircle2, AlertCircle, Mail, User } from 'lucide-react';
import { 
  APP_ROLES, 
  ROLE_PRESETS, 
  AVAILABLE_PAGES,
  USER_STATUSES,
  APPROVAL_STATUSES,
  getAssignableRoles,
  roleRequiresApproval
} from './constants';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import { canManageUser, getRoleDisplayInfo, getStatusDisplayInfo } from '@/utils/roleHelpers';

export default function EditUserDialog({ isOpen, onClose, user, onUpdate, onDelete, isLoading }) {
  const [appRole, setAppRole] = useState('employee');
  const [status, setStatus] = useState('active');
  const [approvalStatus, setApprovalStatus] = useState('pending');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get current user to check permissions
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(base44),
  });

  useEffect(() => {
    if (user) {
      setAppRole(user.app_role || 'employee');
      setStatus(user.status || 'active');
      setApprovalStatus(user.approval_status || 'pending');
      setShowDeleteConfirm(false);
    }
  }, [user]);

  // Get roles this user can assign
  const assignableRoles = getAssignableRoles(currentUser?.app_role);

  // Check if current user can edit this user
  const canEdit = canManageUser(currentUser, user);

  // Get selected role info
  const selectedRole = APP_ROLES.find(r => r.value === appRole);
  const allowedPages = ROLE_PRESETS[appRole] || [];
  const needsApproval = roleRequiresApproval(appRole);

  const handleUpdate = () => {
    // Determine built-in platform role
    const builtInRole = ['admin', 'super_admin'].includes(appRole) ? 'admin' : 'user';
    
    onUpdate(user.id, { 
      role: builtInRole, 
      app_role: appRole, 
      status,
      approval_status: approvalStatus,
      allowed_pages: allowedPages
    });
  };

  const getPageLabel = (pageId) => {
    const page = AVAILABLE_PAGES.find(p => p.id === pageId);
    return page?.label || pageId;
  };

  if (!user) return null;

  if (showDeleteConfirm) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md border-destructive/50 bg-destructive/5" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-destructive">מחיקת משתמש לצמיתות</DialogTitle>
            <DialogDescription className="text-destructive/80">
              האם אתה בטוח שברצונך למחוק את המשתמש <strong>{user.full_name || user.email}</strong>?
              <br />
              פעולה זו אינה ניתנת לביטול.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              ביטול
            </Button>
            <Button 
              onClick={() => onDelete(user.id)}
              variant="destructive"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              כן, מחק משתמש
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const roleInfo = getRoleDisplayInfo(user.app_role);
  const statusInfo = getStatusDisplayInfo(user.status || user.approval_status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">עריכת משתמש</DialogTitle>
        </DialogHeader>

        {/* User Info Header */}
        <Card className="bg-accent/30 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">{user.full_name || 'ללא שם'}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                  <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 py-4">
          {/* Role Selection */}
          <div className="space-y-2">
            <Label>תפקיד</Label>
            <Select value={appRole} onValueChange={setAppRole} disabled={!canEdit}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <SelectValue />
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

          {/* Account Status */}
          <div className="space-y-2">
            <Label>סטטוס חשבון</Label>
            <Select value={status} onValueChange={setStatus} disabled={!canEdit}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {USER_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Approval Status */}
          <div className="space-y-2">
            <Label>סטטוס אישור</Label>
            <Select value={approvalStatus} onValueChange={setApprovalStatus} disabled={!canEdit}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  {approvalStatus === 'approved' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : approvalStatus === 'rejected' ? (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                  )}
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {APPROVAL_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role Info Card */}
          {selectedRole && (
            <Card className="bg-accent/50 border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedRole.label}</p>
                    {selectedRole.description && (
                      <p className="text-xs text-muted-foreground">{selectedRole.description}</p>
                    )}
                  </div>
                </div>

                {/* Approval Info */}
                <div className="flex items-center gap-2">
                  {needsApproval ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <span className="text-xs text-yellow-700">תפקיד זה דורש אישור מנהל</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-green-700">תפקיד זה מאושר אוטומטית</span>
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
        </div>

        <DialogFooter className="flex justify-between items-center w-full">
          {canEdit && (
            <Button 
              variant="ghost" 
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              מחק
            </Button>
          )}
          
          <div className="flex gap-2 mr-auto">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            {canEdit && (
              <Button 
                onClick={handleUpdate}
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                שמור שינויים
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
