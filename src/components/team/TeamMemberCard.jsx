import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  UserCog, 
  Palette, 
  Users, 
  HardHat,
  Mail,
  Phone,
  MoreVertical,
  Shield,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

const roleIcons = {
  admin: Crown,
  project_manager: UserCog,
  designer: Palette,
  client: Users,
  contractor: HardHat,
};

const roleLabels = {
  admin: 'אדמין',
  project_manager: 'מנהל פרויקט',
  designer: 'מעצב',
  client: 'לקוח',
  contractor: 'קבלן',
};

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  project_manager: 'bg-indigo-100 text-indigo-800',
  designer: 'bg-purple-100 text-purple-800',
  client: 'bg-green-100 text-green-800',
  contractor: 'bg-orange-100 text-orange-800',
};

const departmentLabels = {
  architecture: 'אדריכלות',
  design: 'עיצוב',
  project_management: 'ניהול פרויקטים',
  finance: 'כספים',
  execution: 'ביצוע',
};

export default function TeamMemberCard({ member, index, onClick }) {
  const { t } = useLanguage();
  // Map User entity fields to display logic
  const displayRole = member.app_role || member.role || 'client';
  const RoleIcon = roleIcons[displayRole] || Users;
  const roleColor = roleColors[displayRole] || 'bg-slate-100 text-slate-800';
  const roleLabel = roleLabels[displayRole] || displayRole;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
    >
      <Card className="border-slate-200 hover:shadow-lg transition-all group">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.full_name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-2xl font-bold text-indigo-700">
                  {member.full_name.charAt(0)}
                </span>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              {member.status === 'active' && (
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              )}
              <Button variant="ghost" size="icon" className="w-8 h-8" aria-label={t('a11y.openMenu')} title={t('a11y.openMenu')}>
                <MoreVertical className="w-4 h-4" aria-hidden />
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {member.full_name}
            </h3>
            <Badge className={`${roleColor} font-medium mb-2`}>
              <RoleIcon className="w-3 h-3 ml-1" />
              {roleLabel}
            </Badge>
            {member.department && (
              <p className="text-sm text-slate-600">
                {departmentLabels[member.department] || member.department}
              </p>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Mail className="w-4 h-4" />
              <span className="truncate">{member.email}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-4 h-4" />
                <span>{member.phone}</span>
              </div>
            )}
          </div>

          {/* Permissions Summary - Support both legacy permissions object and new allowed_pages array */}
          {(member.permissions || (member.allowed_pages && member.allowed_pages.length > 0)) && (
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-medium text-slate-700">הרשאות:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {/* Legacy Permissions Object */}
                {member.permissions && (
                  <>
                    {member.permissions.can_create_projects && <Badge variant="outline" className="text-xs">יצירת פרויקטים</Badge>}
                    {member.permissions.can_manage_team && <Badge variant="outline" className="text-xs">ניהול צוות</Badge>}
                    {member.permissions.can_view_financials && <Badge variant="outline" className="text-xs">צפייה בכספים</Badge>}
                  </>
                )}
                
                {/* New Allowed Pages Array */}
                {member.allowed_pages && member.allowed_pages.map(page => (
                  <Badge key={page} variant="outline" className="text-xs">{page}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Projects Assigned */}
          {member.projects_assigned && member.projects_assigned.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-600">
                מוקצה ל-{member.projects_assigned.length} פרויקטים
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}