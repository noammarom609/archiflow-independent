import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Clock, MoreVertical, Pencil, Trash2, Timer, DollarSign, Lock } from 'lucide-react';

// Number of days after which entries are locked
const LOCK_AFTER_DAYS = 7;

const STAGE_LABELS = {
  first_call: 'שיחה ראשונה',
  proposal: 'הצעת מחיר',
  survey: 'מדידות',
  concept: 'קונספט',
  sketches: 'סקיצות',
  rendering: 'הדמיות',
  permits: 'היתרים',
  technical: 'תוכניות עבודה',
  selections: 'בחירת חומרים',
  execution: 'ביצוע',
  completion: 'מסירה',
};

export default function TimeEntryRow({ entry, onEdit, onDelete, canBypassLock = false }) {
  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) {
      return m > 0 ? `${h}:${m.toString().padStart(2, '0')}` : `${h}:00`;
    }
    return `0:${m.toString().padStart(2, '0')}`;
  };

  const formattedDate = entry.date 
    ? format(new Date(entry.date), 'EEEE, d בMMM', { locale: he })
    : '';

  // Check if entry is locked (older than 7 days)
  const isLocked = () => {
    if (canBypassLock) return false; // Admins can bypass
    if (!entry.created_at && !entry.date) return false;
    
    const createdDate = entry.created_at ? new Date(entry.created_at) : new Date(entry.date);
    const daysSinceCreation = differenceInDays(new Date(), createdDate);
    return daysSinceCreation > LOCK_AFTER_DAYS;
  };

  const locked = isLocked();
  const daysUntilLock = entry.created_at 
    ? LOCK_AFTER_DAYS - differenceInDays(new Date(), new Date(entry.created_at))
    : null;

  return (
    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group">
      <div className="flex items-center gap-4 flex-1">
        {/* Duration */}
        <div className="flex items-center gap-2 min-w-[80px]">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            entry.billable ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
          }`}>
            <Clock className="w-4 h-4" />
          </div>
          <span className="font-mono font-medium">
            {formatDuration(entry.duration_minutes)}
          </span>
        </div>

        {/* Project & Task */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{entry.project_name || 'ללא פרויקט'}</span>
            {entry.task_name && (
              <>
                <span className="text-muted-foreground">›</span>
                <span className="text-sm text-muted-foreground truncate">{entry.task_name}</span>
              </>
            )}
          </div>
          {entry.description && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {entry.description}
            </p>
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2">
          {/* Date */}
          <span className="text-sm text-muted-foreground hidden md:block">
            {formattedDate}
          </span>

          {/* Time range */}
          {entry.start_time && entry.end_time && (
            <span className="text-xs text-muted-foreground hidden lg:block">
              {entry.start_time} - {entry.end_time}
            </span>
          )}

          {/* Stage */}
          {entry.stage && (
            <Badge variant="outline" className="text-xs hidden lg:flex">
              {STAGE_LABELS[entry.stage] || entry.stage}
            </Badge>
          )}

          {/* Source */}
          {entry.source === 'timer' && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Timer className="w-3 h-3" />
              טיימר
            </Badge>
          )}

          {/* Billable */}
          {entry.billable && (
            <Badge className="bg-green-100 text-green-700 text-xs gap-1">
              <DollarSign className="w-3 h-3" />
              לחיוב
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        {/* Lock indicator */}
        {locked && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent dir="rtl">
                <p>הדיווח נעול לעריכה (עברו יותר מ-{LOCK_AFTER_DAYS} ימים)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Days until lock warning */}
        {!locked && daysUntilLock !== null && daysUntilLock <= 2 && daysUntilLock > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                  {daysUntilLock} ימים לנעילה
                </Badge>
              </TooltipTrigger>
              <TooltipContent dir="rtl">
                <p>הדיווח יינעל בעוד {daysUntilLock} ימים</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {!locked && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 ml-2" />
                עריכה
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    מחיקה
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>מחיקת דיווח שעות</AlertDialogTitle>
                    <AlertDialogDescription>
                      האם למחוק את הדיווח הזה? פעולה זו לא ניתנת לביטול.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                      מחיקה
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}