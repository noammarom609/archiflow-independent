import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';
import { getCurrentUser } from '@/utils/authHelpers';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';

import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  Plus,
  Calendar,
  Briefcase,
  TrendingUp,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  List,
  LayoutGrid,
  BarChart3,
  Loader2,
  Download
} from 'lucide-react';

import TimeEntryDialog from '@/components/time-tracking/TimeEntryDialog';
import TimeTracker from '@/components/time-tracking/TimeTracker';
import TimeEntryRow from '@/components/time-tracking/TimeEntryRow';
import TimesheetWeekly from '@/components/time-tracking/TimesheetWeekly';
import TimeReports from '@/components/time-tracking/TimeReports';
import TimeFilters from '@/components/time-tracking/TimeFilters';
import { showSuccess, showError } from '@/components/utils/notifications';
import { isAdmin, isArchitect } from '@/utils/roleHelpers';

export default function TimeTracking() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('entries');
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  
  const [filters, setFilters] = useState({
    project_id: '',
    user_email: '',
    dateRange: 'week'
  });

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(archiflow),
  });

  // Check permissions
  const canViewAll = currentUser && (isAdmin(currentUser) || isArchitect(currentUser) || currentUser.app_role === 'project_manager');

  // Fetch time entries
  const { data: allTimeEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['timeEntries'],
    queryFn: () => archiflow.entities.TimeEntry.list('-date'),
  });

  // Fetch projects for filters
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => archiflow.entities.Project.list(),
  });

  // Fetch team members for filters
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => archiflow.entities.TeamMember.list(),
    enabled: canViewAll,
  });

  // Filter entries based on permissions and filters
  const filteredEntries = useMemo(() => {
    let entries = allTimeEntries;

    // Multi-tenant + role filtering
    if (!canViewAll && currentUser) {
      entries = entries.filter(e => e.user_email === currentUser.email);
    }

    // Project filter
    if (filters.project_id) {
      entries = entries.filter(e => e.project_id === filters.project_id);
    }

    // User filter
    if (filters.user_email) {
      entries = entries.filter(e => e.user_email === filters.user_email);
    }

    // Date range filter
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
    if (filters.dateRange === 'week') {
      entries = entries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= currentWeekStart && entryDate <= weekEnd;
      });
    } else if (filters.dateRange === 'month') {
      const monthStart = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), 1);
      const monthEnd = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth() + 1, 0);
      entries = entries.filter(e => {
        const entryDate = new Date(e.date);
        return entryDate >= monthStart && entryDate <= monthEnd;
      });
    }
    // 'all' - no date filtering

    return entries;
  }, [allTimeEntries, canViewAll, currentUser, filters, currentWeekStart]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalMinutes = filteredEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const billableMinutes = filteredEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const uniqueProjects = [...new Set(filteredEntries.map(e => e.project_id))];
    const workDays = [...new Set(filteredEntries.map(e => e.date))].length;
    
    return {
      totalHours: (totalMinutes / 60).toFixed(1),
      billableHours: (billableMinutes / 60).toFixed(1),
      projectsCount: uniqueProjects.length,
      avgDailyHours: workDays > 0 ? (totalMinutes / 60 / workDays).toFixed(1) : '0.0',
      billablePercent: totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0
    };
  }, [filteredEntries]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Add user info
      const entryData = {
        ...data,
        user_id: currentUser?.id,
        user_name: currentUser?.full_name,
        user_email: currentUser?.email,
        architect_id: currentUser?.architect_id || currentUser?.id,
        architect_email: currentUser?.architect_email || currentUser?.email,
      };
      return archiflow.entities.TimeEntry.create(entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      showSuccess('דיווח השעות נשמר בהצלחה');
      setShowEntryDialog(false);
      setEditingEntry(null);
    },
    onError: () => showError('שגיאה בשמירת דיווח השעות'),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return archiflow.entities.TimeEntry.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      showSuccess('דיווח השעות עודכן');
      setShowEntryDialog(false);
      setEditingEntry(null);
    },
    onError: () => showError('שגיאה בעדכון'),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => archiflow.entities.TimeEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] });
      showSuccess('הדיווח נמחק');
    },
    onError: () => showError('שגיאה במחיקה'),
  });

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setShowEntryDialog(true);
  };

  const handleSave = (data) => {
    if (editingEntry?.id) {
      updateMutation.mutate({ id: editingEntry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleTimerComplete = (timerData) => {
    setEditingEntry({
      ...timerData,
      date: format(new Date(), 'yyyy-MM-dd'),
      billable: true,
    });
    setShowEntryDialog(true);
  };

  const navigateWeek = (direction) => {
    setCurrentWeekStart(prev => 
      direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1)
    );
  };

  // Export to CSV function
  const handleExportCSV = () => {
    if (filteredEntries.length === 0) {
      showError('אין נתונים לייצוא');
      return;
    }

    // CSV Headers
    const headers = ['תאריך', 'פרויקט', 'משימה', 'שלב', 'משך (דקות)', 'שעות', 'לחיוב', 'תיאור', 'עובד'];
    
    // CSV Data
    const csvData = filteredEntries.map(entry => [
      entry.date,
      entry.project_name || '',
      entry.task_name || '',
      entry.stage || '',
      entry.duration_minutes || 0,
      ((entry.duration_minutes || 0) / 60).toFixed(2),
      entry.billable ? 'כן' : 'לא',
      (entry.description || '').replace(/,/g, ';').replace(/\n/g, ' '),
      entry.user_name || entry.user_email || ''
    ]);

    // Build CSV string with BOM for Hebrew support
    const BOM = '\uFEFF';
    const csvContent = BOM + [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `time-tracking-${format(currentWeekStart, 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccess('הקובץ יורד בהצלחה');
  };

  const weekLabel = `${format(currentWeekStart, 'd MMM', { locale: he })} - ${format(endOfWeek(currentWeekStart, { weekStartsOn: 0 }), 'd MMM yyyy', { locale: he })}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <PageHeader
          title="ניהול שעות"
          subtitle="דיווח ומעקב שעות עבודה"
          icon={Clock}
        >
          <div className="flex items-center gap-2 md:gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 hidden sm:flex"
            >
              <Download className="w-4 h-4" />
              ייצוא
            </Button>
            <TimeTracker onComplete={handleTimerComplete} />
            <Button onClick={() => { setEditingEntry(null); setShowEntryDialog(true); }} className="gap-2">
              <Plus className="w-4 h-4" />
              דיווח שעות
            </Button>
          </div>
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">סה"כ שעות</p>
                  <p className="text-2xl font-bold">{stats.totalHours}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">שעות לחיוב</p>
                  <p className="text-2xl font-bold">{stats.billableHours}</p>
                  <p className="text-xs text-green-600">{stats.billablePercent}%</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">פרויקטים</p>
                  <p className="text-2xl font-bold">{stats.projectsCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">ממוצע יומי</p>
                  <p className="text-2xl font-bold">{stats.avgDailyHours}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <span className="font-medium min-w-[200px] text-center">{weekLabel}</span>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))}>
              היום
            </Button>
          </div>

          <TimeFilters 
            filters={filters} 
            onFiltersChange={setFilters}
            projects={projects}
            teamMembers={canViewAll ? teamMembers : []}
            showUserFilter={canViewAll}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="entries" className="gap-2">
              <List className="w-4 h-4" />
              רשימה
            </TabsTrigger>
            <TabsTrigger value="weekly" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              שבועון
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              דוחות
            </TabsTrigger>
          </TabsList>

          {/* Entries List */}
          <TabsContent value="entries" className="mt-6">
            <Card>
              <CardContent className="p-0">
                {loadingEntries ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="p-12 text-center">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">אין דיווחי שעות</h3>
                    <p className="text-sm text-muted-foreground mb-4">התחל לדווח שעות עבודה</p>
                    <Button onClick={() => setShowEntryDialog(true)}>
                      <Plus className="w-4 h-4 ml-2" />
                      דיווח ראשון
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredEntries.map((entry) => (
                      <TimeEntryRow
                        key={entry.id}
                        entry={entry}
                        onEdit={() => handleEdit(entry)}
                        onDelete={() => deleteMutation.mutate(entry.id)}
                        canBypassLock={canViewAll}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Timesheet */}
          <TabsContent value="weekly" className="mt-6">
            <TimesheetWeekly
              entries={filteredEntries}
              weekStart={currentWeekStart}
              projects={projects}
              onCellClick={(date, project) => {
                setEditingEntry({
                  date: format(date, 'yyyy-MM-dd'),
                  project_id: project?.id,
                  project_name: project?.name,
                });
                setShowEntryDialog(true);
              }}
            />
          </TabsContent>

          {/* Reports */}
          <TabsContent value="reports" className="mt-6">
            <TimeReports entries={filteredEntries} projects={projects} />
          </TabsContent>
        </Tabs>

        {/* Entry Dialog */}
        <TimeEntryDialog
          isOpen={showEntryDialog}
          onClose={() => { setShowEntryDialog(false); setEditingEntry(null); }}
          entry={editingEntry}
          projects={projects}
          onSave={handleSave}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </div>
    </div>
  );
}