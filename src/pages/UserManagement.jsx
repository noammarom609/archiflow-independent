import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    CheckCircle2, 
    XCircle, 
    Clock,
    Search,
    User,
    Mail,
    Phone,
    Calendar,
    Building2,
    Hammer,
    Package,
    UsersRound,
    Filter,
    MoreVertical,
    Check,
    X,
    AlertTriangle,
    Loader2,
    HardHat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { showSuccess, showError } from '@/components/utils/notifications';
import PageHeader from '@/components/layout/PageHeader';

export default function UserManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const queryClient = useQueryClient();

    // Fetch architect's users
    const { data, isLoading } = useQuery({
        queryKey: ['architectUsers'],
        queryFn: async () => {
            const emptyResult = {
                clients: [],
                contractors: [],
                team_members: [],
                consultants: [],
                stats: { total: 0, pending: 0, approved: 0, rejected: 0, consultants: 0 }
            };
            
            try {
                const response = await archiflow.functions.invoke('getArchitectUsers', {});
                // התגובה יכולה להיות ב-response.data או ישירות ב-response
                const result = response?.data || response;
                
                // בדיקה שזה לא אובייקט שגיאה
                if (!result || result.error) {
                    console.error('Error response:', result);
                    return emptyResult;
                }
                
                // וודא שכל הערכים הם arrays ולא אובייקטים אחרים
                const clients = Array.isArray(result.clients) ? result.clients : [];
                const contractors = Array.isArray(result.contractors) ? result.contractors : [];
                const team_members = Array.isArray(result.team_members) ? result.team_members : [];
                const consultants = Array.isArray(result.consultants) ? result.consultants : [];
                
                return {
                    clients,
                    contractors,
                    team_members,
                    consultants,
                    stats: result?.stats || { 
                        total: clients.length + contractors.length + team_members.length + consultants.length, 
                        pending: 0, 
                        approved: 0, 
                        rejected: 0,
                        consultants: consultants.length
                    }
                };
            } catch (err) {
                console.error('Error fetching architect users:', err);
                return emptyResult;
            }
        },
    });

    // Approve/Reject mutation
    const approveMutation = useMutation({
        mutationFn: async ({ entityType, recordId, action, rejectionReason }) => {
            await archiflow.functions.invoke('approveRecord', { 
                entityType, 
                recordId, 
                action,
                rejectionReason 
            });
        },
        onSuccess: (_, variables) => {
            showSuccess(variables.action === 'approve' ? 'אושר בהצלחה!' : 'נדחה');
            queryClient.invalidateQueries({ queryKey: ['architectUsers'] });
            setRejectDialogOpen(false);
            setSelectedRecord(null);
            setRejectionReason('');
        },
        onError: (err) => showError('שגיאה: ' + err.message)
    });

    const handleApprove = (record) => {
        approveMutation.mutate({
            entityType: record.entity_type,
            recordId: record.id,
            action: 'approve'
        });
    };

    const openRejectDialog = (record) => {
        setSelectedRecord(record);
        setRejectDialogOpen(true);
    };

    const handleReject = () => {
        if (!selectedRecord) return;
        approveMutation.mutate({
            entityType: selectedRecord.entity_type,
            recordId: selectedRecord.id,
            action: 'reject',
            rejectionReason
        });
    };

    const getEntityIcon = (type) => {
        switch(type) {
            case 'client': return <User className="w-4 h-4" />;
            case 'contractor': return <Hammer className="w-4 h-4" />;
            case 'supplier': return <Package className="w-4 h-4" />;
            case 'team_member': return <UsersRound className="w-4 h-4" />;
            case 'consultant': return <HardHat className="w-4 h-4" />;
            default: return <User className="w-4 h-4" />;
        }
    };

    const getEntityBadge = (record) => {
        if (record.entity_type === 'contractor' && record.type === 'supplier') {
            return <Badge className="bg-orange-100 text-orange-700">ספק</Badge>;
        }
        switch(record.entity_type) {
            case 'client': return <Badge className="bg-emerald-100 text-emerald-700">לקוח</Badge>;
            case 'contractor': return <Badge className="bg-amber-100 text-amber-700">קבלן</Badge>;
            case 'team_member': return <Badge className="bg-blue-100 text-blue-700">צוות</Badge>;
            case 'consultant': return <Badge className="bg-purple-100 text-purple-700">יועץ</Badge>;
            default: return <Badge variant="outline">{String(record.entity_type || 'לא ידוע')}</Badge>;
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'approved':
                return <Badge className="bg-green-100 text-green-700 gap-1"><CheckCircle2 className="w-3 h-3" /> מאושר</Badge>;
            case 'rejected':
                return <Badge className="bg-red-100 text-red-700 gap-1"><XCircle className="w-3 h-3" /> נדחה</Badge>;
            default:
                return <Badge className="bg-amber-100 text-amber-700 gap-1"><Clock className="w-3 h-3" /> ממתין</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-muted-foreground">טוען נתונים...</p>
                </div>
            </div>
        );
    }

    // בדיקה למצב ללא משתמשים
    const hasNoUsers = !data || data.stats?.total === 0;

    if (!isLoading && hasNoUsers) {
        return (
            <div className="min-h-screen bg-slate-50/50 p-4 md:p-6" dir="rtl">
                <PageHeader 
                    title="ניהול משתמשים" 
                    subtitle="ניהול אישורים והרשאות משתמשים חדשים"
                    icon={Users}
                />
                <div className="max-w-6xl mx-auto">
                    <Card className="p-12 text-center border-dashed border-2 border-slate-200 bg-white">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-3">אין משתמשים עדיין</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            כשתוסיף לקוחות, קבלנים או חברי צוות למערכת - הם יופיעו כאן וניתן יהיה לנהל את האישורים שלהם.
                        </p>
                    </Card>
                </div>
            </div>
        );
    }

    const stats = data?.stats || {};
    const allRecords = [
        ...(data?.clients || []),
        ...(data?.contractors || []),
        ...(data?.team_members || []),
        ...(data?.consultants || [])
    ];

    // Filter records
    const filterRecords = (records, status) => {
        let filtered = records;
        
        // Filter by status
        if (status === 'pending') {
            filtered = filtered.filter(r => !r.approval_status || r.approval_status === 'pending');
        } else if (status === 'approved') {
            filtered = filtered.filter(r => r.approval_status === 'approved');
        } else if (status === 'rejected') {
            filtered = filtered.filter(r => r.approval_status === 'rejected');
        }
        
        // Filter by search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(r => 
                r.full_name?.toLowerCase().includes(q) ||
                r.name?.toLowerCase().includes(q) ||
                r.email?.toLowerCase().includes(q) ||
                r.phone?.includes(q)
            );
        }
        
        return filtered;
    };

    const pendingRecords = filterRecords(allRecords, 'pending');
    const approvedRecords = filterRecords(allRecords, 'approved');
    const rejectedRecords = filterRecords(allRecords, 'rejected');

    // Record Row Component
    const RecordRow = ({ record, showActions = true }) => (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors border-b last:border-0"
        >
            <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    record.entity_type === 'client' ? 'bg-emerald-100 text-emerald-600' :
                    record.entity_type === 'contractor' ? 'bg-amber-100 text-amber-600' :
                    record.entity_type === 'consultant' ? 'bg-purple-100 text-purple-600' :
                    'bg-blue-100 text-blue-600'
                }`}>
                    {getEntityIcon(record.entity_type)}
                </div>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">
                            {typeof record.full_name === 'string' ? record.full_name : 
                             typeof record.name === 'string' ? record.name : 'ללא שם'}
                        </span>
                        {getEntityBadge(record)}
                        {record.is_registered && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> רשום
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                        {record.email && typeof record.email === 'string' && (
                            <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5" /> {record.email}
                            </span>
                        )}
                        {record.phone && typeof record.phone === 'string' && (
                            <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5" /> {record.phone}
                            </span>
                        )}
                        {record.created_date && (
                            <span className="flex items-center gap-1 text-xs">
                                <Calendar className="w-3 h-3" /> 
                                {new Date(record.created_date).toLocaleDateString('he-IL')}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {getStatusBadge(record.approval_status)}
                
                {showActions && record.approval_status !== 'approved' && (
                    <div className="flex items-center gap-2">
                        <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 gap-1"
                            onClick={() => handleApprove(record)}
                            disabled={approveMutation.isPending}
                        >
                            <Check className="w-4 h-4" />
                            אשר
                        </Button>
                        <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                            onClick={() => openRejectDialog(record)}
                            disabled={approveMutation.isPending}
                        >
                            <X className="w-4 h-4" />
                            דחה
                        </Button>
                    </div>
                )}

                {showActions && record.approval_status === 'approved' && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => openRejectDialog(record)}
                            >
                                <XCircle className="w-4 h-4 ml-2" />
                                בטל אישור
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </motion.div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-6" dir="rtl">
            <PageHeader 
                title="ניהול משתמשים" 
                subtitle="ניהול אישורים והרשאות משתמשים חדשים"
                icon={Users}
            />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-white border-slate-200">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                <Users className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-slate-900">{stats.total || 0}</p>
                                <p className="text-sm text-slate-500">סה"כ משתמשים</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-amber-700">{stats.pending || 0}</p>
                                <p className="text-sm text-amber-600">ממתינים לאישור</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-green-700">{stats.approved || 0}</p>
                                <p className="text-sm text-green-600">מאושרים</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-700">{stats.rejected || 0}</p>
                                <p className="text-sm text-red-600">נדחו</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Approval Section */}
                {pendingRecords.length > 0 && (
                    <Card className="border-amber-200 bg-gradient-to-br from-amber-50/50 to-white overflow-hidden">
                        <div className="p-4 border-b border-amber-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-amber-800 flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    ממתינים לאישור ({pendingRecords.length})
                                </h3>
                                <p className="text-xs text-amber-600 mt-1">משתמשים שממתינים לאישור גישה למערכת</p>
                            </div>
                        </div>
                        <div className="divide-y divide-amber-100">
                            {pendingRecords.map(record => (
                                <RecordRow key={`${record.entity_type}-${record.id}`} record={record} />
                            ))}
                        </div>
                    </Card>
                )}

                {/* All Users Table */}
                <Card className="overflow-hidden">
                    <div className="p-4 border-b flex items-center justify-between gap-4 flex-wrap">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-600" />
                            כל המשתמשים ({allRecords.length})
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="relative w-64">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input 
                                    placeholder="חיפוש..." 
                                    className="pr-9 bg-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="px-4 border-b">
                            <TabsList className="h-12 bg-transparent p-0 gap-6">
                                <TabsTrigger 
                                    value="all" 
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-1"
                                >
                                    הכל ({allRecords.length})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="pending"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-amber-500 data-[state=active]:bg-transparent rounded-none px-1"
                                >
                                    ממתינים ({pendingRecords.length})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="approved"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:bg-transparent rounded-none px-1"
                                >
                                    מאושרים ({approvedRecords.length})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="rejected"
                                    className="data-[state=active]:border-b-2 data-[state=active]:border-red-500 data-[state=active]:bg-transparent rounded-none px-1"
                                >
                                    נדחו ({rejectedRecords.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="all" className="m-0">
                            {filterRecords(allRecords, 'all').length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>אין משתמשים להצגה</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filterRecords(allRecords, 'all').map(record => (
                                        <RecordRow key={`${record.entity_type}-${record.id}`} record={record} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="pending" className="m-0">
                            {pendingRecords.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50 text-green-400" />
                                    <p>אין משתמשים ממתינים לאישור</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {pendingRecords.map(record => (
                                        <RecordRow key={`${record.entity_type}-${record.id}`} record={record} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="approved" className="m-0">
                            {approvedRecords.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>אין משתמשים מאושרים</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {approvedRecords.map(record => (
                                        <RecordRow key={`${record.entity_type}-${record.id}`} record={record} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="rejected" className="m-0">
                            {rejectedRecords.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>אין משתמשים שנדחו</p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {rejectedRecords.map(record => (
                                        <RecordRow key={`${record.entity_type}-${record.id}`} record={record} />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </Card>
            </div>

            {/* Reject Dialog */}
            <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            דחיית משתמש
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך לדחות את <strong>{selectedRecord?.full_name || selectedRecord?.name}</strong>?
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