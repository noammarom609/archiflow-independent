import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Shield, 
  Plus, 
  Trash2, 
  Check, 
  Loader2,
  Mail
} from 'lucide-react';
import { showSuccess, showError } from '@/components/utils/notifications';
import { useLanguage } from '@/components/providers/LanguageProvider';

const PERMISSION_LABELS = {
  view_documents: 'צפייה במסמכים',
  upload_documents: 'העלאת קבצים',
  view_financials: 'צפייה בכספים',
  view_gantt: 'צפייה בלו"ז',
  approve_items: 'אישור משימות/מסמכים',
  comment: 'הוספת תגובות',
  manage_tasks: 'ניהול משימות'
};

const ROLE_DEFAULTS = {
  client: {
    view_documents: true,
    upload_documents: true,
    view_financials: true,
    view_gantt: true,
    approve_items: true,
    comment: true,
    manage_tasks: false
  },
  contractor: {
    view_documents: true,
    upload_documents: true,
    view_financials: false,
    view_gantt: true,
    approve_items: false,
    comment: true,
    manage_tasks: true
  },
  architect: {
    view_documents: true,
    upload_documents: true,
    view_financials: false,
    view_gantt: true,
    approve_items: true,
    comment: true,
    manage_tasks: true
  },
  viewer: {
    view_documents: true,
    upload_documents: false,
    view_financials: false,
    view_gantt: true,
    approve_items: false,
    comment: false,
    manage_tasks: false
  }
};

export default function ProjectPermissionsSettings({ project, trigger }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('client');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch permissions for this project
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['projectPermissions', project?.id],
    queryFn: () => archiflow.entities.ProjectPermission.filter({ project_id: String(project?.id) }),
    enabled: !!project?.id && isOpen
  });

  // Fetch All Potential Users (Users, Clients, Contractors)
  // Note: User.list() requires admin permissions - gracefully handle permission errors
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['systemUsers', 'all_contacts'],
    queryFn: async () => {
      let users = [];
      try {
        users = await archiflow.entities.User.list('-created_date', 100);
      } catch (error) {
        // If permission denied for User.list, continue with just clients/contractors
        if (!error.message?.includes('Permission denied')) {
          console.error('Error fetching users:', error);
        }
      }
      
      const [clients, contractors] = await Promise.all([
        archiflow.entities.Client.list('-created_date', 100),
        archiflow.entities.Contractor.list('-created_date', 100)
      ]);

      const uniqueMembers = [...users];
      const existingEmails = new Set(users.map(u => u.email?.toLowerCase()));

      clients.forEach(c => {
        const email = c.email?.toLowerCase();
        if (email && !existingEmails.has(email)) {
          uniqueMembers.push({
            id: c.id,
            full_name: c.full_name,
            email: c.email,
            app_role: 'client', // Default role for clients
            is_external: true
          });
          existingEmails.add(email);
        }
      });

      contractors.forEach(c => {
        const email = c.email?.toLowerCase();
        if (email && !existingEmails.has(email)) {
          uniqueMembers.push({
            id: c.id,
            full_name: c.name, // Contractor entity uses 'name'
            email: c.email,
            app_role: 'contractor', // Default role for contractors
            is_external: true
          });
          existingEmails.add(email);
        }
      });

      return uniqueMembers;
    },
    enabled: isOpen
  });

  // Add permission mutation
  const addPermissionMutation = useMutation({
    mutationFn: async (data) => {
      // Check if already exists
      const existing = await archiflow.entities.ProjectPermission.filter({
        project_id: String(project.id),
        user_email: data.user_email
      });
      
      if (existing.length > 0) {
        throw new Error('משתמש זה כבר קיים בפרויקט');
      }

      return archiflow.entities.ProjectPermission.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectPermissions'] });
      setNewUserEmail('');
      setNewUserName('');
      setIsAdding(false);
      showSuccess('משתמש נוסף בהצלחה');
    },
    onError: (error) => showError(error.message)
  });

  // Update permission mutation
  const updatePermissionMutation = useMutation({
    mutationFn: ({ id, data }) => archiflow.entities.ProjectPermission.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectPermissions'] });
      showSuccess('הרשאות עודכנו');
    }
  });

  // Delete permission mutation
  const deletePermissionMutation = useMutation({
    mutationFn: (id) => archiflow.entities.ProjectPermission.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectPermissions'] });
      showSuccess('משתמש הוסר מהפרויקט');
    }
  });

  const handleAddUser = () => {
    if (!newUserEmail || !newUserName) {
      showError('נא לבחור משתמש');
      return;
    }

    addPermissionMutation.mutate({
      project_id: String(project.id),
      project_name: project.name,
      user_email: newUserEmail,
      user_name: newUserName,
      role: newUserRole,
      permissions: ROLE_DEFAULTS[newUserRole]
    });
  };

  const handleUserSelect = (email) => {
    const member = teamMembers.find(m => m.email === email);
    if (member) {
      setNewUserEmail(member.email);
      setNewUserName(member.full_name);
      
      // Map App Role to Permission Role
      // User entity uses 'app_role' usually, or 'role' for built-in admin
      const appRole = member.app_role || (member.role === 'admin' ? 'admin' : 'client');
      
      let mappedRole = 'viewer';
      if (appRole === 'client') mappedRole = 'client';
      else if (appRole === 'contractor') mappedRole = 'contractor';
      else if (appRole === 'project_manager' || appRole === 'admin') mappedRole = 'project_manager';
      else if (appRole === 'designer') mappedRole = 'architect';
      
      setNewUserRole(mappedRole);
    }
  };

  const handlePermissionChange = (permId, currentPermissions, key, value) => {
    updatePermissionMutation.mutate({
      id: permId,
      data: {
        permissions: {
          ...currentPermissions,
          [key]: value
        }
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Shield className="w-4 h-4" />
            ניהול הרשאות ומשתמשים
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="w-6 h-6 text-indigo-600" />
            ניהול הרשאות - {project?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Add New User */}
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-slate-700">בחר משתמש</label>
                  <Select value={newUserEmail} onValueChange={handleUserSelect}>
                    <SelectTrigger className="bg-white text-right" dir="rtl">
                      <SelectValue placeholder="בחר משתמש מהרשימה" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map(member => (
                        <SelectItem key={member.id} value={member.email}>
                          {member.full_name} ({member.app_role || (member.role === 'admin' ? 'אדמין' : 'משתמש')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {newUserEmail && (
                  <div className="w-48 space-y-2">
                    <label className="text-sm font-medium text-slate-700">אימייל</label>
                    <Input 
                      value={newUserEmail}
                      disabled
                      className="bg-slate-100"
                    />
                  </div>
                )}

                <div className="w-40 space-y-2">
                  <label className="text-sm font-medium text-slate-700">תפקיד בפרויקט</label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">לקוח</SelectItem>
                      <SelectItem value="architect">אדריכל</SelectItem>
                      <SelectItem value="contractor">קבלן</SelectItem>
                      <SelectItem value="project_manager">מנהל פרויקט</SelectItem>
                      <SelectItem value="viewer">צופה בלבד</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleAddUser}
                  disabled={addPermissionMutation.isPending || !newUserEmail}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {addPermissionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  הוסף
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">משתמשים והרשאות ({permissions.length})</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
              </div>
            ) : permissions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>אין משתמשים מוגדרים לפרויקט זה</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {permissions.map((perm) => (
                  <Card key={perm.id} className="border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                          {perm.user_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            {perm.user_name}
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-normal">
                              {perm.role === 'client' ? 'לקוח' : 
                               perm.role === 'architect' ? 'אדריכל' :
                               perm.role === 'contractor' ? 'קבלן' :
                               perm.role === 'project_manager' ? 'מנהל פרויקט' : 'צופה'}
                            </span>
                          </div>
                          <div className="text-sm text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {perm.user_email}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('האם אתה בטוח שברצונך להסיר משתמש זה?')) {
                            deletePermissionMutation.mutate(perm.id);
                          }
                        }}
                        aria-label={t('a11y.deleteUser')}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </Button>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                          <div key={key} className="flex items-center gap-2">
                            <Checkbox 
                              id={`${perm.id}-${key}`}
                              checked={perm.permissions?.[key] || false}
                              onCheckedChange={(checked) => handlePermissionChange(perm.id, perm.permissions, key, checked)}
                            />
                            <label 
                              htmlFor={`${perm.id}-${key}`}
                              className="text-sm text-slate-700 cursor-pointer select-none"
                            >
                              {label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}