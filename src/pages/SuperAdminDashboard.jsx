import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Shield, 
    Trash2, 
    ChevronDown, 
    ChevronUp, 
    Building2, 
    User, 
    Hammer, 
    Search,
    AlertTriangle,
    Mail,
    Phone,
    Calendar,
    UserPlus,
    ArrowRight,
    CheckCircle2,
    XCircle,
    Truck,
    UsersRound,
    Package,
    Clock,
    Check,
    X,
    Link2,
    HardHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from '@/components/utils/notifications';
import PageHeader from '@/components/layout/PageHeader';

export default function SuperAdminDashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedArchitects, setExpandedArchitects] = useState([]);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assignOrphanDialogOpen, setAssignOrphanDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedOrphan, setSelectedOrphan] = useState(null);
    const [assignAs, setAssignAs] = useState('');
    const [targetArchitect, setTargetArchitect] = useState('');
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedForApproval, setSelectedForApproval] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const queryClient = useQueryClient();

    // Fetch Hierarchy
    const { data: systemData, isLoading } = useQuery({
        queryKey: ['systemHierarchy'],
        queryFn: async () => {
            const response = await base44.functions.invoke('getSystemHierarchy', {});
            return response.data;
        },
    });

    // Delete Record Mutation
    const deleteRecordMutation = useMutation({
        mutationFn: async ({ entityType, recordId }) => {
            await base44.functions.invoke('adminDeleteRecord', { entityType, recordId });
        },
        onSuccess: () => {
            showSuccess('הרשומה נמחקה בהצלחה');
            queryClient.invalidateQueries({ queryKey: ['systemHierarchy'] });
        },
        onError: (err) => showError('שגיאה במחיקה: ' + err.message)
    });

    // Assign User Mutation
    const assignUserMutation = useMutation({
        mutationFn: async (data) => {
            await base44.functions.invoke('adminAssignUser', data);
        },
        onSuccess: () => {
            showSuccess('הפעולה בוצעה בהצלחה');
            setAssignDialogOpen(false);
            setSelectedUser(null);
            setAssignAs('');
            setTargetArchitect('');
            queryClient.invalidateQueries({ queryKey: ['systemHierarchy'] });
        },
        onError: (err) => showError('שגיאה: ' + err.message)
    });

    // Assign Orphan Record Mutation
    const assignOrphanMutation = useMutation({
        mutationFn: async (data) => {
            await base44.functions.invoke('assignOrphanedRecord', data);
        },
        onSuccess: () => {
            showSuccess('הרשומה שויכה בהצלחה');
            setAssignOrphanDialogOpen(false);
            setSelectedOrphan(null);
            setTargetArchitect('');
            queryClient.invalidateQueries({ queryKey: ['systemHierarchy'] });
        },
        onError: (err) => showError('שגיאה: ' + err.message)
    });

    // Approve/Reject Mutation
    const approveMutation = useMutation({
        mutationFn: async ({ entityType, recordId, action, rejectionReason }) => {
            await base44.functions.invoke('approveRecord', { entityType, recordId, action, rejectionReason });
        },
        onSuccess: (_, variables) => {
            showSuccess(variables.action === 'approve' ? 'אושר בהצלחה!' : 'נדחה');
            setRejectDialogOpen(false);
            setSelectedForApproval(null);
            setRejectionReason('');
            queryClient.invalidateQueries({ queryKey: ['systemHierarchy'] });
        },
        onError: (err) => showError('שגיאה: ' + err.message)
    });

    const toggleArchitect = (archId) => {
        setExpandedArchitects(prev => 
            prev.includes(archId) 
                ? prev.filter(id => id !== archId) 
                : [...prev, archId]
        );
    };

    const openAssignDialog = (user) => {
        setSelectedUser(user);
        setAssignDialogOpen(true);
    };

    const openAssignOrphanDialog = (record) => {
        setSelectedOrphan(record);
        setTargetArchitect('');
        setAssignOrphanDialogOpen(true);
    };

    const handleAssign = () => {
        if (!selectedUser) return;

        if (assignAs === 'architect') {
            assignUserMutation.mutate({ 
                action: 'make_architect', 
                userId: selectedUser.id 
            });
        } else if (assignAs && targetArchitect) {
            assignUserMutation.mutate({ 
                action: 'assign_to_architect', 
                userId: selectedUser.id,
                targetArchitectId: targetArchitect,
                assignAs: assignAs
            });
        }
    };

    const handleAssignOrphan = () => {
        if (!selectedOrphan || !targetArchitect) return;
        assignOrphanMutation.mutate({
            entityType: selectedOrphan.entity_type,
            recordId: selectedOrphan.id,
            targetArchitectId: targetArchitect
        });
    };

    const handleApprove = (record) => {
        approveMutation.mutate({
            entityType: record.entity_type,
            recordId: record.id,
            action: 'approve'
        });
    };

    const openRejectDialog = (record) => {
        setSelectedForApproval(record);
        setRejectDialogOpen(true);
    };

    const handleReject = () => {
        if (!selectedForApproval) return;
        approveMutation.mutate({
            entityType: selectedForApproval.entity_type,
            recordId: selectedForApproval.id,
            action: 'reject',
            rejectionReason
        });
    };

    const getApprovalBadge = (status) => {
        switch(status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle2 className="w-3 h-3" /> מאושר</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700 gap-1"><XCircle className="w-3 h-3" /> נדחה</Badge>;
            default:
                return <Badge className="bg-amber-100 text-amber-700 gap-1"><Clock className="w-3 h-3" /> ממתין</Badge>;
        }
    };

    const getEntityIcon = (type) => {
        switch(type) {
            case 'architect': return <Building2 className="w-4 h-4" />;
            case 'client': return <User className="w-4 h-4" />;
            case 'contractor': return <Hammer className="w-4 h-4" />;
            case 'supplier': return <Package className="w-4 h-4" />;
            case 'team_member': return <UsersRound className="w-4 h-4" />;
            case 'consultant': return <HardHat className="w-4 h-4" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    const getEntityBadge = (type, contractorType) => {
        if (type === 'contractor' && contractorType === 'supplier') {
            return <Badge className="bg-orange-100 text-orange-700">ספק</Badge>;
        }
        switch(type) {
            case 'architect': return <Badge className="bg-indigo-100 text-indigo-700">אדריכל</Badge>;
            case 'client': return <Badge className="bg-emerald-100 text-emerald-700">לקוח</Badge>;
            case 'contractor': return <Badge className="bg-amber-100 text-amber-700">קבלן</Badge>;
            case 'team_member': return <Badge className="bg-blue-100 text-blue-700">צוות</Badge>;
            case 'consultant': return <Badge className="bg-purple-100 text-purple-700">יועץ</Badge>;
            case 'user': return <Badge variant="outline">משתמש</Badge>;
            default: return <Badge variant="outline">{type}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">טוען נתוני מערכת...</p>
                </div>
            </div>
        );
    }

    const hierarchy = systemData?.hierarchy || [];
    const unassignedUsers = systemData?.unassigned_users || [];
    const orphanedRecords = systemData?.orphaned_records || { clients: [], contractors: [], team_members: [], consultants: [] };
    const totals = systemData?.totals || {};
    const architects = hierarchy.map(h => h.architect);

    // Filter
    const filterItems = (items) => {
        if (!searchQuery) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(item => 
            item.full_name?.toLowerCase().includes(q) ||
            item.name?.toLowerCase().includes(q) ||
            item.email?.toLowerCase().includes(q)
        );
    };

    const filteredHierarchy = hierarchy.filter(node => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            node.architect.full_name?.toLowerCase().includes(q) ||
            node.architect.email?.toLowerCase().includes(q) ||
            node.clients.some(c => c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)) ||
            node.contractors.some(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)) ||
            node.team_members.some(t => t.full_name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q)) ||
            (node.consultants || []).some(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
        );
    });

    // Record Row Component
    const RecordRow = ({ record, showDelete = true, showApproval = true, showAssign = false }) => (
        <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors border-b last:border-0">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    record.entity_type === 'client' ? 'bg-emerald-100 text-emerald-600' :
                    record.entity_type === 'contractor' ? 'bg-amber-100 text-amber-600' :
                    record.entity_type === 'team_member' ? 'bg-blue-100 text-blue-600' :
                    record.entity_type === 'consultant' ? 'bg-purple-100 text-purple-600' :
                    'bg-slate-100 text-slate-600'
                }`}>
                    {getEntityIcon(record.entity_type)}
                </div>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900 text-sm">
                            {record.full_name || record.name || 'ללא שם'}
                        </span>
                        {getEntityBadge(record.entity_type, record.type)}
                        {record.is_registered ? (
                            <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 className="w-3 h-3" /> רשום
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                                <XCircle className="w-3 h-3" /> לא רשום
                            </span>
                        )}
                        {showApproval && getApprovalBadge(record.approval_status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                        {record.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {record.email}</span>}
                        {record.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {record.phone}</span>}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Approval Actions */}
                {showApproval && (!record.approval_status || record.approval_status === 'pending') && (
                    <>
                        <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 gap-1 h-7 text-xs"
                            onClick={() => handleApprove(record)}
                            disabled={approveMutation.isPending}
                        >
                            <Check className="w-3 h-3" />
                            אשר
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 gap-1 h-7 text-xs"
                            onClick={() => openRejectDialog(record)}
                            disabled={approveMutation.isPending}
                        >
                            <X className="w-3 h-3" />
                            דחה
                        </Button>
                    </>
                )}

                {/* Assign to Architect Button (for orphans) */}
                {showAssign && (
                    <Button 
                        size="sm" 
                        variant="outline"
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 gap-1 h-7 text-xs"
                        onClick={() => openAssignOrphanDialog(record)}
                    >
                        <Link2 className="w-3 h-3" />
                        שייך לאדריכל
                    </Button>
                )}

                {showDelete && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent dir="rtl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                                    <AlertTriangle className="w-5 h-5" />
                                    מחיקת רשומה
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    האם למחוק את <strong>{record.full_name || record.name}</strong>?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                                <AlertDialogCancel>ביטול</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={() => deleteRecordMutation.mutate({ 
                                        entityType: record.entity_type, 
                                        recordId: record.id 
                                    })}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    מחק
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );

    // Unassigned User Row with Actions
    const UnassignedUserRow = ({ user }) => (
        <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b last:border-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                    <User className="w-5 h-5" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{user.full_name || 'משתמש חדש'}</span>
                        <Badge variant="outline" className="text-purple-600 border-purple-200">ממתין לשיוך</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(user.created_date).toLocaleDateString('he-IL')}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                    onClick={() => openAssignDialog(user)}
                >
                    <UserPlus className="w-4 h-4 ml-1" />
                    שייך
                </Button>
                
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-red-600">מחיקת משתמש</AlertDialogTitle>
                            <AlertDialogDescription>
                                האם למחוק את המשתמש <strong>{user.full_name || user.email}</strong>?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => deleteRecordMutation.mutate({ entityType: 'user', recordId: user.id })}
                                className="bg-red-600"
                            >
                                מחק
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-6" dir="rtl">
            <PageHeader 
                title="ניהול מערכת (Super Admin)" 
                subtitle={`${totals.users || 0} משתמשים | ${totals.clients || 0} לקוחות | ${totals.contractors || 0} קבלנים | ${totals.consultants || 0} יועצים | ${totals.team_members || 0} אנשי צוות`}
            >
                <div className="relative w-72">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="חיפוש..." 
                        className="pr-9 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </PageHeader>

            <div className="max-w-6xl mx-auto space-y-6">

                {/* Unassigned Users */}
                {unassignedUsers.length > 0 && (
                    <Card className="border-purple-200 bg-purple-50/30">
                        <div className="p-4 border-b border-purple-100">
                            <h3 className="font-semibold text-purple-800 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                משתמשים לא משויכים ({unassignedUsers.length})
                            </h3>
                            <p className="text-xs text-purple-600 mt-1">משתמשים רשומים שעדיין לא שויכו לאדריכל</p>
                        </div>
                        <div className="divide-y divide-purple-100">
                            {filterItems(unassignedUsers).map(user => (
                                <UnassignedUserRow key={user.id} user={user} />
                            ))}
                        </div>
                    </Card>
                )}

                {/* Architects Hierarchy */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        אדריכלים ({hierarchy.length})
                    </h3>
                    
                    {filteredHierarchy.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="py-12 text-center text-muted-foreground">
                                לא נמצאו אדריכלים
                            </CardContent>
                        </Card>
                    ) : (
                        filteredHierarchy.map((node) => (
                            <motion.div 
                                key={node.architect.id}
                                layout
                                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                            >
                                {/* Architect Header */}
                                <div 
                                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                                    onClick={() => toggleArchitect(node.architect.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                            <Building2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">{node.architect.full_name || node.architect.email}</h3>
                                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                                                <span>{node.architect.email}</span>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {node.stats.clients} לקוחות
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {node.stats.contractors} קבלנים
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {node.stats.consultants || 0} יועצים
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {node.stats.team_members} צוות
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent dir="rtl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-red-600">מחיקת אדריכל</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        האם למחוק את האדריכל <strong>{node.architect.full_name}</strong>?
                                                        <br/>הלקוחות והקבלנים שלו יישארו במערכת ללא שיוך.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                                                    <AlertDialogAction 
                                                        onClick={() => deleteRecordMutation.mutate({ entityType: 'user', recordId: node.architect.id })}
                                                        className="bg-red-600"
                                                    >
                                                        מחק
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        
                                        {expandedArchitects.includes(node.architect.id) ? (
                                            <ChevronUp className="w-5 h-5 text-slate-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {expandedArchitects.includes(node.architect.id) && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden border-t border-slate-100"
                                        >
                                            <Tabs defaultValue="clients" className="p-4">
                                                <TabsList className="mb-4 flex-wrap">
                                                    <TabsTrigger value="clients">
                                                        לקוחות ({node.clients.length})
                                                    </TabsTrigger>
                                                    <TabsTrigger value="contractors">
                                                        קבלנים ({node.contractors.length})
                                                    </TabsTrigger>
                                                    <TabsTrigger value="consultants">
                                                        יועצים ({(node.consultants || []).length})
                                                    </TabsTrigger>
                                                    <TabsTrigger value="team">
                                                        צוות ({node.team_members.length})
                                                    </TabsTrigger>
                                                </TabsList>

                                                <TabsContent value="clients" className="bg-slate-50 rounded-lg">
                                                    {node.clients.length === 0 ? (
                                                        <div className="p-8 text-center text-slate-400 text-sm">אין לקוחות</div>
                                                    ) : (
                                                        <div className="divide-y divide-slate-100">
                                                            {filterItems(node.clients).map(c => <RecordRow key={c.id} record={c} />)}
                                                        </div>
                                                    )}
                                                </TabsContent>

                                                <TabsContent value="contractors" className="bg-slate-50 rounded-lg">
                                                    {node.contractors.length === 0 ? (
                                                        <div className="p-8 text-center text-slate-400 text-sm">אין קבלנים/ספקים</div>
                                                    ) : (
                                                        <div className="divide-y divide-slate-100">
                                                            {filterItems(node.contractors).map(c => <RecordRow key={c.id} record={c} />)}
                                                        </div>
                                                    )}
                                                </TabsContent>

                                                <TabsContent value="consultants" className="bg-slate-50 rounded-lg">
                                                    {(node.consultants || []).length === 0 ? (
                                                        <div className="p-8 text-center text-slate-400 text-sm">אין יועצים</div>
                                                    ) : (
                                                        <div className="divide-y divide-slate-100">
                                                            {filterItems(node.consultants || []).map(c => <RecordRow key={c.id} record={c} />)}
                                                        </div>
                                                    )}
                                                </TabsContent>

                                                <TabsContent value="team" className="bg-slate-50 rounded-lg">
                                                    {node.team_members.length === 0 ? (
                                                        <div className="p-8 text-center text-slate-400 text-sm">אין אנשי צוות</div>
                                                    ) : (
                                                        <div className="divide-y divide-slate-100">
                                                            {filterItems(node.team_members).map(t => <RecordRow key={t.id} record={t} />)}
                                                        </div>
                                                    )}
                                                </TabsContent>
                                            </Tabs>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Orphaned Records */}
                {(orphanedRecords.clients.length > 0 || orphanedRecords.contractors.length > 0 || orphanedRecords.team_members.length > 0 || (orphanedRecords.consultants || []).length > 0) && (
                    <Card className="border-amber-200 bg-amber-50/30">
                        <div className="p-4 border-b border-amber-100">
                            <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                רשומות ללא שיוך
                            </h3>
                            <p className="text-xs text-amber-600 mt-1">רשומות שלא משויכות לאף אדריכל</p>
                        </div>
                        
                        <Tabs defaultValue="clients" className="p-4">
                            <TabsList className="mb-4 flex-wrap">
                                <TabsTrigger value="clients">לקוחות ({orphanedRecords.clients.length})</TabsTrigger>
                                <TabsTrigger value="contractors">קבלנים ({orphanedRecords.contractors.length})</TabsTrigger>
                                <TabsTrigger value="consultants">יועצים ({(orphanedRecords.consultants || []).length})</TabsTrigger>
                                <TabsTrigger value="team">צוות ({orphanedRecords.team_members.length})</TabsTrigger>
                            </TabsList>

                            <TabsContent value="clients" className="bg-white rounded-lg border">
                                {orphanedRecords.clients.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">אין</div>
                                ) : (
                                    <div className="divide-y">
                                        {filterItems(orphanedRecords.clients).map(c => <RecordRow key={c.id} record={c} showAssign={true} />)}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="contractors" className="bg-white rounded-lg border">
                                {orphanedRecords.contractors.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">אין</div>
                                ) : (
                                    <div className="divide-y">
                                        {filterItems(orphanedRecords.contractors).map(c => <RecordRow key={c.id} record={c} showAssign={true} />)}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="consultants" className="bg-white rounded-lg border">
                                {(orphanedRecords.consultants || []).length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">אין</div>
                                ) : (
                                    <div className="divide-y">
                                        {filterItems(orphanedRecords.consultants || []).map(c => <RecordRow key={c.id} record={c} showAssign={true} />)}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="team" className="bg-white rounded-lg border">
                                {orphanedRecords.team_members.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">אין</div>
                                ) : (
                                    <div className="divide-y">
                                        {filterItems(orphanedRecords.team_members).map(t => <RecordRow key={t.id} record={t} showAssign={true} />)}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </Card>
                )}
            </div>

            {/* Assign Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent dir="rtl" className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>שיוך משתמש</DialogTitle>
                        <DialogDescription>
                            בחר כיצד לשייך את <strong>{selectedUser?.full_name || selectedUser?.email}</strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">שייך בתור:</label>
                            <Select value={assignAs} onValueChange={setAssignAs}>
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר תפקיד..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="architect">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-indigo-600" />
                                            אדריכל עצמאי
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="client">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-emerald-600" />
                                            לקוח
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="contractor">
                                        <div className="flex items-center gap-2">
                                            <Hammer className="w-4 h-4 text-amber-600" />
                                            קבלן
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="supplier">
                                        <div className="flex items-center gap-2">
                                            <Package className="w-4 h-4 text-orange-600" />
                                            ספק
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="team_member">
                                        <div className="flex items-center gap-2">
                                            <UsersRound className="w-4 h-4 text-blue-600" />
                                            איש צוות
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="consultant">
                                        <div className="flex items-center gap-2">
                                            <HardHat className="w-4 h-4 text-purple-600" />
                                            יועץ
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {assignAs && assignAs !== 'architect' && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">שייך לאדריכל:</label>
                                <Select value={targetArchitect} onValueChange={setTargetArchitect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="בחר אדריכל..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {architects.map(arch => (
                                            <SelectItem key={arch.id} value={arch.id}>
                                                {arch.full_name || arch.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>ביטול</Button>
                        <Button 
                            onClick={handleAssign}
                            disabled={!assignAs || (assignAs !== 'architect' && !targetArchitect) || assignUserMutation.isPending}
                        >
                            {assignUserMutation.isPending ? 'מעבד...' : 'שייך'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Orphan Record Dialog */}
            <Dialog open={assignOrphanDialogOpen} onOpenChange={setAssignOrphanDialogOpen}>
                <DialogContent dir="rtl" className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>שיוך רשומה לאדריכל</DialogTitle>
                        <DialogDescription>
                            שייך את <strong>{selectedOrphan?.full_name || selectedOrphan?.name}</strong> לאדריכל
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">בחר אדריכל:</label>
                            <Select value={targetArchitect} onValueChange={setTargetArchitect}>
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר אדריכל..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {architects.map(arch => (
                                        <SelectItem key={arch.id} value={arch.id}>
                                            {arch.full_name || arch.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignOrphanDialogOpen(false)}>ביטול</Button>
                        <Button 
                            onClick={handleAssignOrphan}
                            disabled={!targetArchitect || assignOrphanMutation.isPending}
                        >
                            {assignOrphanMutation.isPending ? 'מעבד...' : 'שייך'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            דחיית רשומה
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך לדחות את <strong>{selectedForApproval?.full_name || selectedForApproval?.name}</strong>?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    
                    <div className="py-4">
                        <label className="text-sm font-medium text-slate-700">סיבת הדחייה (אופציונלי)</label>
                        <Textarea 
                            className="mt-2"
                            placeholder="הזן סיבה..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                        />
                    </div>

                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleReject}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={approveMutation.isPending}
                        >
                            {approveMutation.isPending ? 'מעבד...' : 'דחה'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}