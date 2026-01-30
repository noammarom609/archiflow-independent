import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import { getCurrentUser } from '@/utils/authHelpers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, UserPlus, Loader2, Clock, Send, UserCheck, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import InviteUserDialog from '@/components/admin/InviteUserDialog';
import { showSuccess, showError } from '@/components/utils/notifications';
import { getRoleDisplayInfo, getStatusDisplayInfo, canInvite } from '@/utils/roleHelpers';
import { ROLE_PRESETS, roleRequiresApproval } from '@/components/admin/constants';

export default function UserAccessStatus({ email, name, type, entityId, userStatus }) {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);

  // Get current user to check permissions
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(archiflow),
  });

  // Check if user exists using backend function (bypasses User entity permissions)
  const { data: user, isLoading } = useQuery({
    queryKey: ['userByEmail', email],
    queryFn: async () => {
      if (!email) return null;
      try {
        const response = await archiflow.functions.invoke('checkUserByEmail', { email });
        if (response.data?.exists) {
          return response.data.user;
        }
        return null;
      } catch (error) {
        console.error('Error checking user:', error);
        // Return null on error - treat as user not found
        return null;
      }
    },
    enabled: !!email
  });

  const inviteMutation = useMutation({
    mutationFn: async ({ email, role, app_role, full_name }) => {
      // Use archiflow.users.inviteUser directly - works for all authenticated users
      const platformRole = ['admin', 'super_admin'].includes(app_role) ? 'admin' : 'user';
      await archiflow.users.inviteUser(email, platformRole);
      
      // Update entity user_status to 'invited'
      if (entityId && type) {
        const entityMap = {
          consultant: archiflow.entities.Consultant,
          contractor: archiflow.entities.Contractor,
          client: archiflow.entities.Client,
          team_member: archiflow.entities.TeamMember,
        };
        const entity = entityMap[type];
        if (entity) {
          await entity.update(entityId, { 
            user_status: 'invited',
            user_invited_at: new Date().toISOString(),
          });
        }
      }
      
      return true;
    },
    onSuccess: () => {
      showSuccess('הזמנה נשלחה בהצלחה');
      setShowInvite(false);
      queryClient.invalidateQueries({ queryKey: ['userByEmail'] });
      queryClient.invalidateQueries({ queryKey: ['consultants'] });
      queryClient.invalidateQueries({ queryKey: ['contractors'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
    onError: (error) => {
      console.error('Invite error:', error);
      showError('שגיאה בשליחת ההזמנה');
    }
  });

  // Check if current user can invite
  const userCanInvite = canInvite(currentUser);

  // Determine default roles based on type
  const getDefaultAppRole = () => {
    switch (type) {
      case 'contractor': return 'contractor';
      case 'consultant': return 'consultant';
      case 'team_member': return 'team_member';
      case 'client': return 'client';
      default: return 'client';
    }
  };

  if (!email) return null;
  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;

  // User is registered
  if (user) {
    const roleInfo = getRoleDisplayInfo(user.app_role);
    const isApproved = user.approval_status === 'approved' || 
                       ['super_admin', 'admin', 'architect', 'project_manager'].includes(user.app_role);
    const isPending = user.approval_status === 'pending' && !isApproved;
    const isRejected = user.approval_status === 'rejected';
    
    return (
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {isApproved && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <UserCheck className="w-3 h-3" />
            משתמש פעיל
          </Badge>
        )}
        {isPending && (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ממתין לאישור
          </Badge>
        )}
        {isRejected && (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            נדחה
          </Badge>
        )}
        <Badge className={`${roleInfo.color} text-xs`}>
          {roleInfo.label}
        </Badge>
      </div>
    );
  }

  // Show user_status from entity
  const getStatusDisplay = () => {
    switch (userStatus) {
      case 'invited':
        return (
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              הוזמן - ממתין לרישום
            </Badge>
            {userCanInvite && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowInvite(true)}
                className="h-6 text-xs text-primary hover:bg-primary/10 p-1"
              >
                <Send className="w-3 h-3 ml-1" />
                שלח שוב
              </Button>
            )}
          </div>
        );
      case 'disabled':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1 mt-1">
            <Shield className="w-3 h-3" />
            מושבת
          </Badge>
        );
      case 'active':
        // Shouldn't reach here if user exists, but fallback
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-3 h-3" />
            פעיל
          </Badge>
        );
      default: // 'not_invited' or undefined
        if (!userCanInvite) {
          return (
            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />
              לא הוזמן למערכת
            </Badge>
          );
        }
        return (
          <div className="mt-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowInvite(true)}
              className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10"
            >
              <UserPlus className="w-3 h-3 ml-1" />
              הזמן למערכת
            </Button>
          </div>
        );
    }
  };

  return (
    <>
      {getStatusDisplay()}

      {showInvite && (
        <InviteUserDialog
          isOpen={showInvite}
          onClose={() => setShowInvite(false)}
          onInvite={inviteMutation.mutate}
          isLoading={inviteMutation.isPending}
          initialData={{
            email: email,
            full_name: name,
            app_role: getDefaultAppRole(),
          }}
        />
      )}
    </>
  );
}