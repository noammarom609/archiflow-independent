import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { archiflow } from '@/api/archiflow';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import BusinessHealthGauges from '../components/dashboard/BusinessHealthGauges';
import ProjectStatusMatrix from '../components/dashboard/ProjectStatusMatrix';
import NotificationsCard from '../components/dashboard/NotificationsCard';
import TodayEventsCard from '../components/dashboard/TodayEventsCard';
import { ErrorBoundary, WidgetErrorState } from '../components/ui/error-boundary';
import { WidgetSkeleton } from '../components/ui/widget-skeleton';
import { EmptyState } from '../components/ui/empty-state';
import { Card, CardContent } from '../components/ui/card';
import { Search, Plus, Clock as ClockIcon, Mic as MicIcon, Receipt, FolderKanban } from 'lucide-react';
import { useGlobalSearch } from '../components/search/useGlobalSearch';
import { useSidebarState } from '@/components/providers/SidebarContext';
import { useLanguage } from '@/components/providers/LanguageProvider';
import NewInvoiceDialog from '../components/financials/NewInvoiceDialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { showMenuButton, handleMenuClick } = useSidebarState();
  const { user, isLoadingAuth: loadingUser } = useAuth();
  const { openSearch } = useGlobalSearch();
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);

  const isSuperAdmin = user?.app_role === 'super_admin';
  const myArchitectId = user?.app_role === 'architect' ? user?.id : user?.architect_id;

  // ── Data queries ──
  const {
    data: allProjects = [],
    error: projectsError,
    isLoading: projectsLoading,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: () => archiflow.entities.Project.list('-created_date'),
    enabled: !!user,
    retry: 1,
  });

  const projects = isSuperAdmin
    ? allProjects
    : allProjects.filter(p =>
        p.created_by === user?.email ||
        (myArchitectId && p.architect_id === myArchitectId)
      );

  const {
    data: allInvoices = [],
    error: invoicesError,
    isLoading: invoicesLoading,
  } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => archiflow.entities.Invoice.list('-created_date'),
    enabled: !!user,
    retry: 1,
  });

  const {
    data: allProposals = [],
    error: proposalsError,
    isLoading: proposalsLoading,
  } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => archiflow.entities.Proposal.list('-created_date'),
    enabled: !!user,
    retry: 1,
  });

  const invoices = isSuperAdmin
    ? allInvoices
    : allInvoices.filter(i => i.created_by === user?.email);

  const proposals = isSuperAdmin
    ? allProposals
    : allProposals.filter(p => p.created_by === user?.email);

  // ── Derived state ──
  const gaugesLoading = projectsLoading || invoicesLoading || proposalsLoading;
  const gaugesError = projectsError || invoicesError || proposalsError;

  const handleProjectClick = (projectId) => {
    navigate(createPageUrl('Projects') + `?id=${projectId}`);
  };

  const handleGaugeClick = (gaugeName) => {
    if (gaugeName === 'גבייה') {
      navigate(createPageUrl('Financials'));
    } else if (gaugeName === 'עמידה בלו״ז' || gaugeName === 'המרות') {
      navigate(createPageUrl('Projects'));
    }
  };

  const userName = user?.full_name?.split(' ')[0] || 'משתמש';

  // ── Loading state (auth) ──
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
        <div className="mb-6 space-y-3">
          <div className="h-8 bg-muted rounded-xl w-1/3 animate-pulse" />
          <div className="h-5 bg-muted rounded-xl w-1/2 animate-pulse" />
        </div>
        <WidgetSkeleton variant="gauges" className="mb-5" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
          <WidgetSkeleton variant="table" />
          <WidgetSkeleton variant="list" />
        </div>
      </div>
    );
  }

  // ── New architect welcome ──
  const isNewArchitect = user?.app_role === 'architect' && projects.length === 0 && !projectsLoading;

  if (isNewArchitect) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8 relative">
        <div className="relative z-10 max-w-2xl mx-auto text-center pt-16">
          <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <span className="text-5xl">🏠</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-light text-foreground mb-4">
            ברוך הבא, <span className="font-semibold text-primary">{userName}</span>!
          </h1>

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            זהו המשרד הדיגיטלי שלך. התחל ביצירת הפרויקט הראשון שלך<br />
            או חקור את ספריית התוכן עם רהיטים ותמונות רפרנס.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate(createPageUrl('Projects') + '?newProject=true')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 text-lg shadow-lg"
            >
              צור פרויקט ראשון
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('DesignLibrary'))}
              className="h-12 px-8 text-lg border-border"
            >
              עיין בספריית התוכן
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-right">
            <div className="bg-card/50 rounded-2xl p-6 border border-border">
              <div className="text-3xl mb-3">📁</div>
              <h3 className="font-semibold text-foreground mb-2">פרויקטים</h3>
              <p className="text-sm text-muted-foreground">נהל את כל הפרויקטים שלך במקום אחד</p>
            </div>
            <div className="bg-card/50 rounded-2xl p-6 border border-border">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-semibold text-foreground mb-2">ספריית תוכן</h3>
              <p className="text-sm text-muted-foreground">רהיטים, השראות ותבניות מוכנות</p>
            </div>
            <div className="bg-card/50 rounded-2xl p-6 border border-border">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-semibold text-foreground mb-2">ניהול לקוחות</h3>
              <p className="text-sm text-muted-foreground">הוסף לקוחות וקבלנים לפרויקטים</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main dashboard ──
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-5 pb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-40">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-primary/30 via-border to-primary/30" />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {showMenuButton && (
              <button
                className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-organic-sm hover:bg-primary/90 transition-all flex-shrink-0"
                onClick={handleMenuClick}
                aria-label="פתח תפריט"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>
            )}
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                שלום, <span className="text-primary">{userName}</span>
              </h1>
              <p className="text-muted-foreground text-sm">סקירה מערכתית וניהול שוטף</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <div className="relative group cursor-pointer" onClick={openSearch}>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border border-border rounded-xl hover:bg-muted hover:border-primary/30 transition-all">
                <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm text-muted-foreground">חיפוש...</span>
                <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
                  <span className="text-xs">{navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl+'}</span>K
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions — CTA ברור */}
      <section className="mb-6" aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading" className="text-base font-semibold text-foreground mb-3">
          פעולות מהירות
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Button
            variant="default"
            className="h-auto py-3 px-4 flex flex-col items-center gap-2 rounded-2xl shadow-organic hover:shadow-organic-lg"
            onClick={() => navigate(createPageUrl('Projects') + '?newProject=true')}
            aria-label={t('a11y.newProject')}
            title={t('a11y.newProject')}
          >
            <Plus className="w-5 h-5 text-primary-foreground" aria-hidden />
            <span className="text-xs font-medium">פרויקט חדש</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 px-4 flex flex-col items-center gap-2 rounded-2xl border-dashed hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate(createPageUrl('TimeTracking'))}
            aria-label={t('a11y.logHours')}
            title={t('a11y.logHours')}
          >
            <ClockIcon className="w-5 h-5 text-primary" aria-hidden />
            <span className="text-xs font-medium">רישום שעות</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 px-4 flex flex-col items-center gap-2 rounded-2xl border-dashed hover:border-primary/50 hover:bg-primary/5"
            onClick={() => navigate(createPageUrl('Recordings') + '?tab=record')}
            aria-label={t('a11y.recordMeeting')}
            title={t('a11y.recordMeeting')}
          >
            <MicIcon className="w-5 h-5 text-primary" aria-hidden />
            <span className="text-xs font-medium">הקלטת פגישה</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 px-4 flex flex-col items-center gap-2 rounded-2xl border-dashed hover:border-primary/50 hover:bg-primary/5"
            onClick={() => setNewInvoiceOpen(true)}
            aria-label={t('a11y.newInvoice')}
            title={t('a11y.newInvoice')}
          >
            <Receipt className="w-5 h-5 text-primary" aria-hidden />
            <span className="text-xs font-medium">חשבונית חדשה</span>
          </Button>
        </div>
      </section>

      {/* 1. המוקד להיום — Today's Focus */}
      <section className="mb-6" aria-labelledby="today-focus-heading">
        <h2 id="today-focus-heading" className="text-base font-semibold text-foreground mb-3">
          המוקד להיום
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ErrorBoundary
            fallbackTitle="שגיאה בטעינת אירועי היום"
            onReset={() => queryClient.invalidateQueries({ queryKey: ['calendarEvents', 'week'] })}
          >
            <TodayEventsCard />
          </ErrorBoundary>
          <ErrorBoundary
            fallbackTitle="שגיאה בטעינת עדכונים"
            onReset={() => queryClient.invalidateQueries({ queryKey: ['notifications'] })}
          >
            <NotificationsCard />
          </ErrorBoundary>
        </div>
      </section>

      {/* 2. בריאות העסק — Business Health */}
      <section className="mb-6" aria-labelledby="business-health-heading">
        <h2 id="business-health-heading" className="text-base font-semibold text-foreground mb-3">
          בריאות העסק
        </h2>
        <ErrorBoundary fallbackTitle="שגיאה בטעינת מדדי ביצוע" onReset={() => {
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          queryClient.invalidateQueries({ queryKey: ['invoices'] });
          queryClient.invalidateQueries({ queryKey: ['proposals'] });
        }}>
          {gaugesLoading ? (
            <div>
              <WidgetSkeleton variant="gauges" />
            </div>
          ) : gaugesError ? (
            <Card>
              <CardContent className="p-0">
                <WidgetErrorState
                  title="שגיאה בטעינת מדדי ביצוע"
                  message="לא ניתן לטעון את נתוני הפרויקטים, החשבוניות או ההצעות."
                  onRetry={() => {
                    queryClient.invalidateQueries({ queryKey: ['projects'] });
                    queryClient.invalidateQueries({ queryKey: ['invoices'] });
                    queryClient.invalidateQueries({ queryKey: ['proposals'] });
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <BusinessHealthGauges
              onGaugeClick={handleGaugeClick}
              projects={projects}
              invoices={invoices}
              proposals={proposals}
            />
          )}
        </ErrorBoundary>
      </section>

      {/* 3. פרויקטים פעילים — Active Projects */}
      <section aria-labelledby="active-projects-heading">
        <h2 id="active-projects-heading" className="text-base font-semibold text-foreground mb-3">
          פרויקטים פעילים
        </h2>
        <ErrorBoundary
          fallbackTitle="שגיאה בטעינת מטריצת פרויקטים"
          onReset={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
        >
          {projectsLoading ? (
            <WidgetSkeleton variant="table" />
          ) : projectsError ? (
            <Card>
              <CardContent className="p-0">
                <WidgetErrorState
                  title="שגיאה בטעינת פרויקטים"
                  onRetry={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
                />
              </CardContent>
            </Card>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={FolderKanban}
                  title="אין פרויקטים עדיין"
                  description="צור את הפרויקט הראשון שלך כדי לראות אותו כאן"
                  compact
                  action={
                    <Button size="sm" onClick={() => navigate(createPageUrl('Projects') + '?newProject=true')}>
                      צור פרויקט
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <ProjectStatusMatrix onProjectClick={handleProjectClick} projects={projects} />
          )}
        </ErrorBoundary>
      </section>

      <NewInvoiceDialog isOpen={newInvoiceOpen} onClose={() => setNewInvoiceOpen(false)} />
    </div>
  );
}
