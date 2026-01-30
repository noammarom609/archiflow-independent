import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Star, Briefcase, Clock, CheckCircle2 } from 'lucide-react';
import UserAccessStatus from '../users/UserAccessStatus';

const specialtyLabels = {
  electrical: 'חשמל',
  plumbing: 'אינסטלציה',
  drywall: 'גבס',
  flooring: 'ריצוף',
  carpentry: 'נגרות',
  painting: 'צביעה',
  hvac: 'מיזוג אוויר',
  general_contractor: 'קבלן ראשי',
  engineer: 'מהנדס',
  designer: 'מעצב',
  supplier: 'ספק',
  other: 'אחר',
};

const typeLabels = {
  contractor: 'קבלן',
  partner: 'שותף',
  supplier: 'ספק',
};

const statusColors = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-slate-100 text-slate-800 border-slate-200',
  on_hold: 'bg-orange-100 text-orange-800 border-orange-200',
};

const statusLabels = {
  active: 'פעיל',
  inactive: 'לא פעיל',
  on_hold: 'בהמתנה',
};

export default function ContractorCard({ contractor, onClick, index }) {
  const specialtyLabel = specialtyLabels[contractor.specialty] || contractor.specialty;
  const typeLabel = typeLabels[contractor.type] || contractor.type;
  const statusColor = statusColors[contractor.status] || statusColors.active;
  const statusLabel = statusLabels[contractor.status] || contractor.status;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
    >
      <Card className="border-slate-200 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
        <CardContent className="p-6">
          {/* Header with Avatar and Status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center flex-shrink-0">
                {contractor.avatar_url ? (
                  <img
                    src={contractor.avatar_url}
                    alt={contractor.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <span className="text-2xl font-bold text-indigo-700">
                    {contractor.name.charAt(0)}
                  </span>
                )}
              </div>

              {/* Name and Company */}
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {contractor.name}
                </h3>
                {contractor.company && (
                  <p className="text-sm text-slate-600 mb-2">{contractor.company}</p>
                )}
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                    {specialtyLabel}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {typeLabel}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <Badge className={`${statusColor} border`}>
              {statusLabel}
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4" strokeWidth={1.5} />
              <span dir="ltr" className="text-left">{contractor.phone}</span>
            </div>
            {contractor.email && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4" strokeWidth={1.5} />
                  <span>{contractor.email}</span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <UserAccessStatus email={contractor.email} name={contractor.name} type="contractor" />
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            {/* Rating */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-lg font-bold text-slate-900">
                  {contractor.rating ? contractor.rating.toFixed(1) : 'N/A'}
                </span>
              </div>
              <p className="text-xs text-slate-500">דירוג</p>
            </div>

            {/* Projects */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-lg font-bold text-slate-900">
                  {contractor.projects_completed || 0}
                </span>
              </div>
              <p className="text-xs text-slate-500">פרויקטים</p>
            </div>

            {/* Hourly Rate */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span className="text-lg font-bold text-slate-900">
                  {contractor.hourly_rate ? `₪${contractor.hourly_rate}` : '-'}
                </span>
              </div>
              <p className="text-xs text-slate-500">לשעה</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}