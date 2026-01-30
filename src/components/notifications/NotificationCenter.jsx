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

// Colors by notification type
const typeColors = {
  project_created: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  project_updated: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  project_stage_changed: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  task_assigned: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  task_completed: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  task_due_soon: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  document_uploaded: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  proposal_approved: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  proposal_rejected: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  proposal_sent: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  meeting_scheduled: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  meeting_reminder: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  payment_received: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  expense_added: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  new_comment: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  client_added: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  contractor_added: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  supplier_added: 'bg-lime-50 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400',
  consultant_added: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  team_member_added: 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  recording_analyzed: 'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  general: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const priorityColors = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function NotificationCenter({ isOpen, onClose }) {
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
          className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-l from-indigo-50 to-white dark:from-indigo-900/20 dark:to-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">התראות</h2>
                  {unreadCount > 0 && (
                    <p className="text-sm text-slate-600 dark:text-slate-400">{unreadCount} חדשות</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
                className={filter === 'all' ? 'bg-indigo-600' : ''}
              >
                הכל
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
                className={filter === 'unread' ? 'bg-indigo-600' : ''}
              >
                לא נקראו ({unreadCount})
              </Button>
              <Button
                variant={filter === 'document' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('document')}
                className={filter === 'document' ? 'bg-indigo-600' : ''}
              >
                מסמכים
              </Button>
              <Button
                variant={filter === 'task' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('task')}
                className={filter === 'task' ? 'bg-indigo-600' : ''}
              >
                משימות
              </Button>
            </div>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
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
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredNotifications.map((notification, index) => {
                  const Icon = typeIcons[notification.type] || Bell;
                  const typeColor = typeColors[notification.type] || typeColors.general;
                  const priorityColor = priorityColors[notification.priority] || priorityColors.normal;

                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-indigo-50/30 dark:bg-indigo-900/20' : ''
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
                                  !notification.is_read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {notification.title}
                              </Link>
                            ) : (
                              <h3 className={`font-semibold text-sm ${
                                !notification.is_read ? 'text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-300'
                              }`}>
                                {notification.title}
                              </h3>
                            )}
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap">
                            {(notification.priority === 'urgent' || notification.priority === 'high') && (
                              <Badge className={`${priorityColor} text-xs`}>
                                {notification.priority === 'urgent' && 'דחוף'}
                                {notification.priority === 'high' && 'גבוה'}
                              </Badge>
                            )}
                            <span className="text-xs text-slate-500 dark:text-slate-500">
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
                              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
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
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">אין התראות</h3>
                <p className="text-sm text-slate-600">
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