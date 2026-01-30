import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, CheckCircle2, FileText, Calendar, Bell, Briefcase, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const ACTION_ICONS = {
  task_created: Briefcase,
  journal_created: FileText,
  notification_sent: Bell,
  calendar_event_created: Calendar,
  budget_updated: DollarSign,
};

const ACTION_LABELS = {
  task_created: 'משימה נוצרה',
  journal_created: 'רשומת יומן נוצרה',
  notification_sent: 'התראה נשלחה',
  calendar_event_created: 'אירוע יומן נוצר',
  budget_updated: 'תקציב עודכן',
};

const ACTION_COLORS = {
  task_created: 'bg-green-100 text-green-800',
  journal_created: 'bg-indigo-100 text-indigo-800',
  notification_sent: 'bg-orange-100 text-orange-800',
  calendar_event_created: 'bg-purple-100 text-purple-800',
  budget_updated: 'bg-blue-100 text-blue-800',
};

export default function DistributionHistory({ recording }) {
  if (!recording?.distribution_log || recording.distribution_log.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            היסטוריית פעולות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>לא בוצעו פעולות עדיין</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-600" />
          היסטוריית פעולות ({recording.distribution_log.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recording.distribution_log.map((log, index) => {
            const Icon = ACTION_ICONS[log.action] || CheckCircle2;
            const label = ACTION_LABELS[log.action] || log.action;
            const colorClass = ACTION_COLORS[log.action] || 'bg-slate-100 text-slate-800';

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
              >
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {label}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {format(new Date(log.timestamp), 'HH:mm:ss', { locale: he })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{log.details}</p>
                  {log.entity_id && (
                    <p className="text-xs text-slate-500 mt-1">
                      {log.entity} ID: {log.entity_id}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}