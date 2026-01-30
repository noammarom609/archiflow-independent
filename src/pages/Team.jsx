import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Plus, 
  Search, 
  Shield, 
  UserCog, 
  Crown, 
  Palette, 
  HardHat, 
  LayoutGrid, 
  List,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { showSuccess, showError } from '@/components/utils/notifications';

import TeamMemberCard from '@/components/team/TeamMemberCard';
import UserTable from '@/components/admin/UserTable';
import InviteUserDialog from '@/components/admin/InviteUserDialog';
import EditUserDialog from '@/components/admin/EditUserDialog';

import { APP_ROLES } from '@/components/admin/constants';

export default function Team() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // Dialog States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // 1. Fetch current user to check permissions (with bypass support)
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(archiflow),
  });
  
  const isAdmin = currentUser?.role === 'admin';

  // 2. Fetch Users (Source of Truth)
  // We use the User entity for everything now
  // Note: This requires admin permissions - will fail gracefully for non-admins
  const { data: users = [], isLoading, refetch, error: usersError } = useQuery({
    queryKey: ['teamUsers'],
    queryFn: async () => {
      try {
        return await archiflow.entities.User.list('-created_date', 100);
      } catch (error) {
        // If permission denied, return empty array (non-admin users)
        if (error.message?.includes('Permission denied')) {
          console.warn('User does not have permission to list users');
          return [];
        }
        throw error;
      }
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // --- Mutations (Copied from AdminUsers) ---

  // Invite User - using backend function to bypass User entity permissions
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role, app_role, allowed_pages, full_name }) => {
      const response = await archiflow.functions.invoke('inviteUserToApp', {
        email,
        role: role || 'user',
        full_name,
        app_role,
        allowed_pages
      });
      
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      return true;
    },
    onSuccess: () => {
      showSuccess('ההזמנה נשלחה בהצלחה');
      setShowInviteModal(false);
      queryClient.invalidateQueries(['teamUsers']);
    },
    onError: (error) => {
      console.error(error);
      showError('שגיאה בשליחת ההזמנה');
    }
  });

  // Update User
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await archiflow.entities.User.update(id, data);
    },
    onSuccess: () => {
      showSuccess('פרטי המשתמש עודכנו בהצלחה');
      setEditingUser(null);
      queryClient.invalidateQueries(['teamUsers']);
    },
    onError: (error) => {
      console.error(error);
      showError('שגיאה בעדכון פרטי המשתמש');
    }
  });

  // Delete User
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await archiflow.entities.User.delete(id);
    },
    onSuccess: () => {
      showSuccess('המשתמש נמחק בהצלחה');
      setEditingUser(null);
      queryClient.invalidateQueries(['teamUsers']);
    },
    onError: (error) => {
      console.error(error);
      showError('שגיאה במחיקת המשתמש');
    }
  });

  // --- Handlers ---

  const handleInvite = (data) => inviteMutation.mutate(data);
  const handleUpdateUser = (id, data) => updateMutation.mutate({ id, data });
  const handleDeleteUser = (id) => deleteMutation.mutate(id);
  const handleResendInvite = (user) => inviteMutation.mutate({ email: user.email, role: user.role });


  // --- Filtering & Stats ---

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    // Check app_role
    const userAppRole = user.app_role || (user.role === 'admin' ? 'admin' : 'client');
    const matchesRole = roleFilter === 'all' || userAppRole === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const stats = [
    {
      label: 'סה״כ משתמשים',
      value: users.length,
      icon: Users,
      color: 'text-indigo-600',
    },
    {
      label: 'מנהלי פרויקט',
      value: users.filter(u => u.app_role === 'project_manager').length,
      icon: UserCog,
      color: 'text-blue-600',
    },
    {
      label: 'מעצבים',
      value: users.filter(u => u.app_role === 'designer').length,
      icon: Palette,
      color: 'text-purple-600',
    },
    {
      label: 'ממתינים לאישור',
      value: users.filter(u => u.status === 'pending_approval' || (!u.status && u.role !== 'admin')).length,
      icon: Shield,
      color: 'text-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">ניהול צוות ומשתמשים</h1>
            <p className="text-lg text-slate-600">כל המשתמשים, התפקידים וההרשאות במקום אחד</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white rounded-lg border border-slate-200 p-1 flex">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 px-2 ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            <Button 
              variant="outline" 
              onClick={() => refetch()}
              className="bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
              title="רענן רשימה"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>

            {isAdmin && (
              <Button 
                onClick={() => setShowInviteModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all hover:shadow-lg"
              >
                <Plus className="w-5 h-5 ml-2" />
                <span className="hidden sm:inline">הזמן משתמש</span>
                <span className="sm:hidden">הוסף</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs md:text-sm text-slate-600 mb-1">{stat.label}</p>
                        <p className="text-2xl md:text-3xl font-bold text-slate-900">{stat.value}</p>
                      </div>
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl flex items-center justify-center">
                        <Icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} strokeWidth={1.5} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="חפש משתמש..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 py-5 border-slate-200 bg-white"
            />
          </div>
          
          <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-full md:w-auto">
            <TabsList className="bg-white border border-slate-200 p-1 w-full md:w-auto overflow-x-auto flex-nowrap">
              <TabsTrigger value="all">הכל</TabsTrigger>
              <TabsTrigger value="admin">אדמין</TabsTrigger>
              <TabsTrigger value="project_manager">מנהלים</TabsTrigger>
              <TabsTrigger value="designer">מעצבים</TabsTrigger>
              <TabsTrigger value="contractor">קבלנים</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pending Users Warning (Admin Only) */}
        {isAdmin && users.some(u => (u.status === 'pending_approval' || (!u.status && u.role !== 'admin'))) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900">ממתינים לאישור</h3>
                <p className="text-sm text-amber-700">ישנם משתמשים הממתינים לאישור. עבור ל"רשימה" כדי לנהל אותם.</p>
              </div>
            </div>
            {viewMode !== 'list' && (
              <Button size="sm" variant="outline" onClick={() => setViewMode('list')} className="bg-white/50 border-amber-300 text-amber-800 hover:bg-white">
                עבור לרשימה
              </Button>
            )}
          </motion.div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
            </div>
          ) : filteredUsers.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user, index) => (
                  <div key={user.id} onClick={() => isAdmin && setEditingUser(user)} className={isAdmin ? "cursor-pointer" : ""}>
                    <TeamMemberCard
                      member={user} // Sending User entity, TeamMemberCard logic updated to handle it
                      index={index}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // List View (Table)
              <UserTable 
                users={filteredUsers}
                onEdit={(user) => isAdmin ? setEditingUser(user) : null}
                onResendInvite={(user) => isAdmin ? handleResendInvite(user) : null}
                currentUserEmail={currentUser?.email}
              />
            )
          ) : (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">לא נמצאו משתמשים</h3>
              <p className="text-slate-600">נסה לשנות את מסנני החיפוש</p>
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Admin Dialogs */}
      {isAdmin && (
        <>
          <InviteUserDialog 
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            onInvite={handleInvite}
            isLoading={inviteMutation.isPending}
          />

          <EditUserDialog 
            isOpen={!!editingUser}
            onClose={() => setEditingUser(null)}
            user={editingUser}
            onUpdate={handleUpdateUser}
            onDelete={handleDeleteUser}
            isLoading={updateMutation.isPending || deleteMutation.isPending}
          />
        </>
      )}
    </div>
  );
}