import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { getCurrentUser } from '@/utils/authHelpers';
import { startOfWeek, endOfWeek, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, ArrowLeft, DollarSign } from 'lucide-react';

export default function TimeTrackingWidget() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(base44),
  });

  const { data: timeEntries = [], isLoading } = useQuery({
    queryKey: ['timeEntriesWidget'],
    queryFn: () => base44.entities.TimeEntry.list('-date', 100),
    enabled: !!currentUser,
  });

  // Filter to current week and current user
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });

  const weekEntries = timeEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    const isInWeek = entryDate >= weekStart && entryDate <= weekEnd;
    const isMyEntry = entry.user_email === currentUser?.email || entry.created_by === currentUser?.email;
    return isInWeek && isMyEntry;
  });

  const totalMinutes = weekEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const billableMinutes = weekEntries.filter(e => e.billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const billableHours = (billableMinutes / 60).toFixed(1);
  const billablePercent = totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0;

  // Get unique projects this week
  const projectsThisWeek = [...new Set(weekEntries.map(e => e.project_name).filter(Boolean))];

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="glass-card hover-lift overflow-hidden">
        <CardContent className="p-0">
          <div className="p-5 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">שעות השבוע</h3>
                  <p className="text-xs text-muted-foreground">
                    {format(weekStart, 'd MMM', { locale: he })} - {format(weekEnd, 'd MMM', { locale: he })}
                  </p>
                </div>
              </div>
              <Link to={createPageUrl('TimeTracking')}>
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  צפה בכל
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-xl">
                <div className="text-2xl font-bold text-foreground">{totalHours}</div>
                <div className="text-xs text-muted-foreground">שעות סה״כ</div>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-xl">
                <div className="flex items-center justify-center gap-1">
                  <div className="text-2xl font-bold text-green-600">{billableHours}</div>
                  <DollarSign className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-xs text-green-600/80">לחיוב ({billablePercent}%)</div>
              </div>
            </div>
          </div>

          {projectsThisWeek.length > 0 && (
            <div className="p-4 bg-muted/20">
              <p className="text-xs text-muted-foreground mb-2">פרויקטים השבוע:</p>
              <div className="flex flex-wrap gap-1.5">
                {projectsThisWeek.slice(0, 3).map((name, i) => (
                  <span key={i} className="text-xs bg-background px-2 py-1 rounded-md border border-border">
                    {name}
                  </span>
                ))}
                {projectsThisWeek.length > 3 && (
                  <span className="text-xs text-muted-foreground px-2 py-1">
                    +{projectsThisWeek.length - 3} נוספים
                  </span>
                )}
              </div>
            </div>
          )}

          {weekEntries.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">אין דיווחי שעות השבוע</p>
              <Link to={createPageUrl('TimeTracking')}>
                <Button size="sm" variant="outline">התחל לדווח</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}