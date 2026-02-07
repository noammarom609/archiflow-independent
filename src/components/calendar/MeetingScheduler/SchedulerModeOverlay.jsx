import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Check, Clock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useLanguage } from '@/components/providers/LanguageProvider';

export default function SchedulerModeOverlay({ 
  isActive, 
  selectedSlots, 
  onRemoveSlot,
  onCancel, 
  onConfirm,
  duration 
}) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 sm:bottom-6 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl border border-border sm:min-w-[400px] sm:max-w-[600px] max-h-[50vh] sm:max-h-[70vh] flex flex-col"
    >
      {/* Header - Fixed */}
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm sm:text-base">מצב תיאום פגישה</h3>
            <p className="text-xs text-muted-foreground">
              גרור על הלוח ({duration} דקות)
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label={t('a11y.cancel')} title={t('a11y.cancel')}>
          <X className="w-4 h-4" aria-hidden />
        </Button>
      </div>

      {/* Selected Slots - Scrollable */}
      {selectedSlots.length > 0 && (
        <div className="px-4 py-3 overflow-y-auto flex-1">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            חלונות שנבחרו ({selectedSlots.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedSlots.map((slot, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-lg text-xs"
              >
                <span>
                  {format(new Date(slot.date), 'EEE d/M', { locale: he })} {slot.start_time}-{slot.end_time}
                </span>
                <button 
                  onClick={() => onRemoveSlot(idx)}
                  className="hover:bg-primary/20 rounded p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Actions - Fixed at bottom */}
      <div className="flex items-center justify-between p-4 border-t border-border flex-shrink-0">
        <Button variant="outline" onClick={onCancel} className="gap-2 text-sm">
          <X className="w-4 h-4" />
          ביטול
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={selectedSlots.length === 0}
          className="gap-2 bg-primary hover:bg-primary/90 text-sm"
        >
          <Check className="w-4 h-4" />
          המשך ({selectedSlots.length})
        </Button>
      </div>
    </motion.div>
  );
}