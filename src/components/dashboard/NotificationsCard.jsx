import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell, Clock, CheckCircle, AlertCircle, FileText, Users, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getCurrentUser } from '@/utils/authHelpers';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
  exit: { opacity: 0, x: -30, scale: 0.9 }
};

const iconMap = {
  document: FileText,
  task: CheckCircle,
  project: AlertCircle,
  contractor: Users,
  system: Clock,
};

export default function NotificationsCard() {
  const navigate = useNavigate();

  // Fetch current user for multi-tenant filtering (with bypass support)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(archiflow),
  });

  const isSuperAdmin = user?.app_role === 'super_admin';

  const { data: allNotifications = [], error: notificationsError } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => archiflow.entities.Notification.list('-created_date', 20),
    enabled: !!user,
    retry: 1,
    onError: (error) => {
      console.error('[NotificationsCard] Failed to load notifications:', error);
    },
  });

  // Multi-tenant filtering - show only relevant notifications
  const notifications = isSuperAdmin 
    ? allNotifications.slice(0, 4)
    : allNotifications
        .filter(n => 
          n.created_by === user?.email || 
          n.recipient_email === user?.email ||
          n.architect_id === user?.id
        )
        .slice(0, 4);

  const [hoveredId, setHoveredId] = useState(null);

  const handleNotificationClick = (notification) => {
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
    >
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-4">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <motion.div 
              className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center relative"
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Bell className="w-5 h-5 text-foreground" strokeWidth={1.5} />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, delay: 0.3 }}
                >
                  <span className="text-[10px] text-destructive-foreground font-bold">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                </motion.div>
              )}
            </motion.div>
            <CardTitle className="text-xl font-bold text-foreground">עדכונים מהשטח</CardTitle>
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div 
            className="space-y-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {notificationsError ? (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  <AlertCircle className="w-12 h-12 text-destructive/50 mx-auto mb-3" />
                </motion.div>
                <p className="text-destructive text-sm font-medium mb-1">שגיאה בטעינת עדכונים</p>
                <p className="text-destructive/70 text-xs">
                  {notificationsError.message?.includes('checkpoint') 
                    ? 'שגיאת טעינת סשן עדכונים' 
                    : notificationsError.message || 'שגיאה לא ידועה'}
                </p>
                <motion.button
                  onClick={() => window.location.reload()}
                  className="mt-3 text-xs text-primary hover:underline"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  רענן דף
                </motion.button>
              </motion.div>
            ) : notifications.length === 0 ? (
              <motion.div 
                className="text-center py-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                </motion.div>
                <p className="text-muted-foreground text-sm">אין עדכונים חדשים</p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {notifications.map((notification, index) => {
                  const Icon = iconMap[notification.type] || Bell;
                  const priorityColor = notification.priority === 'urgent' ? 'text-destructive' : 
                                       notification.priority === 'high' ? 'text-warning' :
                                       notification.priority === 'medium' ? 'text-info' : 'text-muted-foreground';
                  const isHovered = hoveredId === notification.id;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      variants={itemVariants}
                      exit="exit"
                      onClick={() => handleNotificationClick(notification)}
                      onMouseEnter={() => setHoveredId(notification.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      whileHover={{ 
                        x: 8, 
                        transition: { type: "spring", stiffness: 300, damping: 20 }
                      }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 rounded-xl cursor-pointer group relative overflow-hidden hover:bg-muted/50 transition-colors"
                    >
                      {/* Background glow effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isHovered ? 1 : 0 }}
                      />
                      
                      <div className="flex items-start gap-3 relative z-10">
                        <motion.div
                          animate={isHovered ? { rotate: [0, -10, 10, 0], scale: 1.1 } : { scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Icon className={`w-5 h-5 ${priorityColor} flex-shrink-0 mt-0.5`} strokeWidth={2} />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <motion.p 
                            className="text-sm text-foreground font-medium group-hover:text-primary transition-colors"
                            animate={{ x: isHovered ? 3 : 0 }}
                          >
                            {notification.message}
                          </motion.p>
                          <motion.p 
                            className="text-xs text-muted-foreground mt-1"
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: isHovered ? 1 : 0.7 }}
                          >
                            {new Date(notification.created_date).toLocaleDateString('he-IL', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </motion.p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <motion.div 
                              className="w-2 h-2 bg-primary rounded-full"
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                          <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: isHovered ? 1 : 0, x: isHovered ? 0 : -10 }}
                          >
                            <ChevronLeft className="w-4 h-4 text-primary" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}