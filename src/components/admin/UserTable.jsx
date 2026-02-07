import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Search, Filter, MoreVertical, Shield, User, Lock, Mail, RefreshCw, Pencil, Trash2, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { APP_ROLES } from './constants';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function UserTable({ users, onEdit, onResendInvite, currentUserEmail }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(search.toLowerCase());
    
    // Check app_role if exists, otherwise fall back to built-in role or treat as client (default)
    const userAppRole = user.app_role || 'client';
    const matchesRole = roleFilter === 'all' || userAppRole === roleFilter;
    
    // Resolve effective status
    // Treat any unknown status (from platform) as 'pending_approval' for non-admins
    const knownStatuses = ['active', 'suspended', 'pending_approval'];
    const rawStatus = user.status;
    const isKnown = rawStatus && knownStatuses.includes(rawStatus);
    const effectiveStatus = isKnown ? rawStatus : (user.role === 'admin' ? 'active' : 'pending_approval');
    
    const matchesStatus = statusFilter === 'all' || effectiveStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status) => {
    // Normalize status for badge display
    const knownStatuses = ['active', 'suspended', 'pending_approval'];
    const displayStatus = knownStatuses.includes(status) ? status : 'pending_approval';

    switch (displayStatus) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">פעיל</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800 border-red-200">מושהה</Badge>;
      case 'pending_approval':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex gap-1 items-center">
          <Lock className="w-3 h-3" />
          ממתין לאישור
        </Badge>;
      default:
        return <Badge variant="outline" className="text-slate-500">לא ידוע</Badge>;
    }
  };

  const getRoleBadge = (user) => {
    const appRole = user.app_role || (user.role === 'admin' ? 'admin' : 'client');
    const roleLabel = APP_ROLES.find(r => r.value === appRole)?.label || appRole;
    
    let colorClass = "bg-slate-50 text-slate-700 border-slate-200";
    if (appRole === 'admin') colorClass = "bg-purple-100 text-purple-800 border-purple-200";
    if (appRole === 'architect') colorClass = "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (appRole === 'contractor') colorClass = "bg-orange-100 text-orange-800 border-orange-200";
    if (appRole === 'client') colorClass = "bg-green-100 text-green-800 border-green-200";

    return (
      <Badge variant="outline" className={`${colorClass} flex w-fit gap-1 items-center`}>
        {appRole === 'admin' ? <Shield className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
        {roleLabel}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="חיפוש לפי שם או אימייל..." 
            className="pr-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="flex items-center border rounded-md px-3 bg-white">
            <Filter className="w-4 h-4 text-slate-500 ml-2" />
            <select 
              className="bg-transparent border-none text-sm outline-none cursor-pointer py-2 text-slate-700"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">כל התפקידים</option>
              {APP_ROLES.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center border rounded-md px-3 bg-white">
            <ActivityIcon status={statusFilter} />
            <select 
              className="bg-transparent border-none text-sm outline-none cursor-pointer py-2 text-slate-700 mr-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">כל הסטטוסים</option>
              <option value="active">פעיל</option>
              <option value="pending_approval">ממתין לאישור</option>
              <option value="suspended">מושהה</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right">משתמש</TableHead>
                <TableHead className="text-right">תפקיד</TableHead>
                <TableHead className="text-right">סטטוס</TableHead>
                <TableHead className="text-right">תאריך הצטרפות</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    לא נמצאו משתמשים התואמים את החיפוש
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{user.full_name || 'ללא שם'}</div>
                          <div className="text-xs text-slate-500 font-mono" dir="ltr">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user)}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const knownStatuses = ['active', 'suspended', 'pending_approval'];
                        const rawStatus = user.status;
                        const isKnown = rawStatus && knownStatuses.includes(rawStatus);
                        const effectiveStatus = isKnown ? rawStatus : (user.role === 'admin' ? 'active' : 'pending_approval');
                        return getStatusBadge(effectiveStatus);
                      })()}
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {user.created_date ? format(new Date(user.created_date), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('a11y.openMenu')} title={t('a11y.openMenu')}>
                            <MoreVertical className="w-4 h-4 text-slate-400" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Pencil className="w-4 h-4 ml-2 text-slate-500" />
                            ערוך פרטים והרשאות
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => onResendInvite(user)}>
                            <Mail className="w-4 h-4 ml-2 text-slate-500" />
                            שלח הזמנה מחדש
                          </DropdownMenuItem>
                          
                          {/* Protect self-deletion/modification via UI logic if needed, 
                              though the backend handles security. Usually admins shouldn't delete themselves easily. */}
                          {user.email !== currentUserEmail && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onEdit(user)} // We open edit dialog which has delete
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 ml-2" />
                                מחק משתמש
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <div className="text-sm text-slate-500 text-center">
        סה"כ {filteredUsers.length} משתמשים (מתוך {users.length})
      </div>
    </div>
  );
}

function ActivityIcon({ status }) {
  if (status === 'active') return <div className="w-2 h-2 rounded-full bg-green-500 ml-2" />;
  if (status === 'suspended') return <div className="w-2 h-2 rounded-full bg-red-500 ml-2" />;
  return <div className="w-2 h-2 rounded-full bg-slate-300 ml-2" />;
}