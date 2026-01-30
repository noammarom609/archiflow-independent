import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, Mail, FolderKanban, Info } from 'lucide-react';
import UserAccessStatus from '../users/UserAccessStatus';

const statusLabels = {
  lead: { label: 'ליד', color: 'bg-blue-100 text-blue-800' },
  active: { label: 'פעיל', color: 'bg-green-100 text-green-800' },
  completed: { label: 'הושלם', color: 'bg-slate-100 text-slate-800' },
  inactive: { label: 'לא פעיל', color: 'bg-red-100 text-red-800' },
};

const sourceLabels = {
  referral: 'המלצה',
  website: 'אתר',
  social_media: 'רשתות חברתיות',
  advertisement: 'פרסום',
  returning: 'לקוח חוזר',
  other: 'אחר',
};

export default function ClientCard({ client, onClick, index, projectCount = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
    >
      <Card className="border-slate-200 hover:shadow-xl transition-all cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0">
              {client.avatar_url ? (
                <img src={client.avatar_url} alt={client.full_name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <User className="w-7 h-7 text-indigo-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-slate-900 truncate">{client.full_name}</h3>
                <Badge className={`${statusLabels[client.status]?.color || 'bg-slate-100'} text-xs`}>
                  {statusLabels[client.status]?.label || client.status}
                </Badge>
              </div>

              {client.phone && (
                <p className="text-sm text-slate-600 flex items-center gap-1 mb-1">
                  <Phone className="w-3 h-3" />
                  <span dir="ltr">{client.phone}</span>
                </p>
              )}

              {client.email && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 text-sm text-slate-500 truncate">
                    <Mail className="w-3 h-3" />
                    <span>{client.email}</span>
                  </div>
                  <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                    <UserAccessStatus email={client.email} name={client.full_name} type="client" entityId={client.id} />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {client.source && (
                  <Badge variant="outline" className="text-xs">
                    <Info className="w-3 h-3 ml-1" />
                    {sourceLabels[client.source] || client.source}
                  </Badge>
                )}
                {projectCount > 0 && (
                  <Badge variant="outline" className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700">
                    <FolderKanban className="w-3 h-3 ml-1" />
                    {projectCount} פרויקטים
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}