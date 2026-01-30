import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Star,
  Phone,
  Mail,
  Building2,
  Zap,
  Droplets,
  Lightbulb,
  Shield,
  Wind,
  Volume2,
  Ruler,
  HardHat,
  Users,
  CheckCircle2,
  FolderKanban
} from 'lucide-react';
import UserAccessStatus from '../users/UserAccessStatus';

// Consultant types configuration
const CONSULTANT_TYPES = {
  structural: { label: 'קונסטרוקטור', icon: Building2 },
  electrical: { label: 'יועץ חשמל', icon: Zap },
  plumbing: { label: 'יועץ אינסטלציה', icon: Droplets },
  hvac: { label: 'יועץ מיזוג ואוורור', icon: Wind },
  lighting: { label: 'יועץ תאורה', icon: Lightbulb },
  civil_defense: { label: 'יועץ הג"ה', icon: Shield },
  acoustics: { label: 'יועץ אקוסטיקה', icon: Volume2 },
  hydrology: { label: 'הידרולוג', icon: Droplets },
  surveyor: { label: 'מודד', icon: Ruler },
  fire_safety: { label: 'יועץ בטיחות אש', icon: Shield },
  accessibility: { label: 'יועץ נגישות', icon: Users },
  other: { label: 'אחר', icon: HardHat },
};

export default function ConsultantCard({ consultant, onClick, index = 0, projectCount = 0 }) {
  if (!consultant) return null;

  const typeConfig = CONSULTANT_TYPES[consultant.consultant_type] || CONSULTANT_TYPES.other;
  const TypeIcon = typeConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
    >
      <Card className="bg-card border-border hover:shadow-organic-lg transition-all duration-300 cursor-pointer overflow-hidden card-hover">
        <CardContent className="p-6">
          {/* Header with Avatar and Status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              {/* Avatar - Using organic warm colors */}
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-muted flex items-center justify-center flex-shrink-0 shadow-organic">
                <TypeIcon className="w-8 h-8 text-primary" />
              </div>

              {/* Name and Company */}
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  {consultant.name}
                </h3>
                {consultant.company && (
                  <p className="text-sm text-muted-foreground mb-2">{consultant.company}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Badge with terracotta accent */}
                  <Badge className="bg-accent text-accent-foreground border border-border text-xs">
                    {typeConfig.label}
                  </Badge>
                  {consultant.license_number && (
                    <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                      רישיון
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <Badge className={`border ${
              consultant.status === 'active' 
                ? 'bg-secondary/10 text-secondary border-secondary/30' 
                : 'bg-muted text-muted-foreground border-border'
            }`}>
              {consultant.status === 'active' ? 'פעיל' : 'לא פעיל'}
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 mb-4">
            {consultant.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary/70" strokeWidth={1.5} />
                <span dir="ltr" className="text-left">{consultant.phone}</span>
              </div>
            )}
            {consultant.email && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary/70" strokeWidth={1.5} />
                  <span className="truncate">{consultant.email}</span>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <UserAccessStatus email={consultant.email} name={consultant.name} type="consultant" />
                </div>
              </div>
            )}
          </div>

          {/* Stats - Using organic colors */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            {/* Rating */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4 text-primary fill-primary/20" />
                <span className="text-lg font-bold text-foreground">
                  {consultant.rating ? consultant.rating.toFixed(1) : 'N/A'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">דירוג</p>
            </div>

            {/* Projects */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <FolderKanban className="w-4 h-4 text-secondary" />
                <span className="text-lg font-bold text-foreground">
                  {projectCount}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">פרויקטים</p>
            </div>

            {/* Available */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className={`w-4 h-4 ${consultant.status === 'active' ? 'text-secondary' : 'text-muted-foreground'}`} />
                <span className="text-lg font-bold text-foreground">
                  {consultant.status === 'active' ? '✓' : '-'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">זמין</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
