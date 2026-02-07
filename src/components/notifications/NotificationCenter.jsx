import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bell,
  X,
  FileText,
  Briefcase,
  FolderKanban,
  Users,
  AlertCircle,
  CheckCircle2,
  Trash2,
  CalendarDays,
  UserPlus,
  HardHat,
  Package,
  MessageSquare,
  CreditCard,
  Mic,
  FileCheck,
  FileX,
  ListTodo,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useLanguage } from '@/components/providers/LanguageProvider';

// Icon mapping by notification type
const typeIcons = {
  project_created: FolderKanban,
  project_updated: FolderKanban,
  project_stage_changed: FolderKanban,
  task_assigned: ListTodo,
  task_completed: CheckCircle2,
  task_due_soon: AlertCircle,
  document_uploaded: FileText,
  proposal_approved: FileCheck,
  proposal_rejected: FileX,
  proposal_sent: FileText,
  meeting_scheduled: CalendarDays,
  meeting_reminder: CalendarDays,
  payment_received: CreditCard,
  expense_added: CreditCard,
  new_comment: MessageSquare,
  client_added: UserPlus,
  contractor_added: HardHat,
  supplier_added: Package,
  consultant_added: Briefcase,
  team_member_added: Users,
  recording_analyzed: Mic,
  general: Bell,
};

// Semantic colors by notification type (using design tokens)
const typeColors = {
  project_created: 'bg-primary/10 text-primary',
  project_updated: 'bg-primary/10 text-primary',
  project_stage_changed: 'bg-primary/10 text-primary',
  task_assigned: 'bg-info/10 text-info',
  task_completed: 'bg-success/10 text-success',
  task_due_soon: 'bg-warning/10 text-warning',
  document_uploaded: 'bg-info/10 text-info',
  proposal_approved: 'bg-success/10 text-success',
  proposal_rejected: 'bg-destructive/10 text-destructive',
  proposal_sent: 'bg-info/10 text-info',
  meeting_scheduled: 'bg-warning/10 text-warning',
  meeting_reminder: 'bg-warning/10 text-warning',
  payment_received: 'bg-success/10 text-success',
  expense_added: 'bg-destructive/10 text-destructive',
  new_comment: 'bg-info/10 text-info',
  client_added: 'bg-secondary/10 text-secondary',
  contractor_added: 'bg-secondary/10 text-secondary',
  supplier_added: 'bg-secondary/10 text-secondary',
  consultant_added: 'bg-secondary/10 text-secondary',
  team_member_added: 'bg-secondary/10 text-secondary',
  recording_analyzed: 'bg-accent text-accent-foreground',
  general: 'bg-muted text-muted-foreground',
};

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning/10 text-warning',
  high: 'bg-warning/20 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

export default function NotificationCenter({ isOpen, onClose }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => archiflow.entities.Notification.list('-created_date', 50),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => archiflow.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => archiflow.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      await Promise.all(
        unreadNotifications.map(n => archiflow.entities.Notification.update(n.id, { is_read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: -400 }}
          animate={{ x: 0 }}
          exit={{ x: -400 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-organic-xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">התראות</h2>
                  {unreadCount > 0 && (
                    <p className="text-sm text-muted-foreground">{unreadCount} חדשות</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label={t('a11y.close')}>
                <X className="w-5 h-5" aria-hidden />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                הכל
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                לא נקראו ({unreadCount})
              </Button>
              <Button
                variant={filter === 'document' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('document')}
              >
                מסמכים
              </Button>
              <Button
                variant={filter === 'task' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('task')}
              >
                משימות
              </Button>
            </div>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="p-3 border-b border-border bg-muted/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="w-full text-primary hover:text-primary hover:bg-primary/10"
              >
                <CheckCircle2 className="w-4 h-4 ml-2" />
                סמן הכל כנקרא
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredNotifications.map((notification, index) => {
                  const Icon = typeIcons[notification.type] || Bell;
                  const typeColor = typeColors[notification.type] || typeColors.general;
                  const priorityColor = priorityColors[notification.priority] || priorityColors.low;

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsReadMutation.mutate(notification.id);
                        }
                        if (notification.link) {
                          onClose();
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            {notification.link ? (
                              <Link 
                                to={createPageUrl(notification.link.split('?')[0]) + (notification.link.includes('?') ? '?' + notification.link.split('?')[1] : '')}
                                className={`font-semibold text-sm hover:text-primary transition-colors ${
                                  !notification.is_read ? 'text-foreground' : 'text-foreground/80'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {notification.title}
                              </Link>
                            ) : (
                              <h3 className={`font-semibold text-sm ${
                                !notification.is_read ? 'text-foreground' : 'text-foreground/80'
                              }`}>
                                {notification.title}
                              </h3>
                            )}
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap">
                            {(notification.priority === 'urgent' || notification.priority === 'high') && (
                              <Badge className={`${priorityColor} text-xs`}>
                                {notification.priority === 'urgent' && 'דחוף'}
                                {notification.priority === 'high' && 'גבוה'}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(notification.created_date), 'dd/MM/yy HH:mm')}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            {!notification.is_read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsReadMutation.mutate(notification.id)}
                                className="h-7 text-xs"
                              >
                                סמן כנקרא
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3 ml-1" />
                              מחק
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">אין התראות</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'unread' ? 'כל ההתראות נקראו' : 'אין התראות זמינות'}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
