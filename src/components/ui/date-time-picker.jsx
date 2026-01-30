import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export function DateTimePicker({ 
  value, 
  onChange, 
  placeholder = 'בחר תאריך ושעה',
  disabled = false,
  label,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [timeValue, setTimeValue] = useState(() => {
    if (value) {
      const date = new Date(value);
      return format(date, 'HH:mm');
    }
    return '09:00';
  });

  const selectedDate = value ? new Date(value) : null;

  const handleDateSelect = (date) => {
    if (date) {
      const [hours, minutes] = timeValue.split(':');
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      onChange(format(date, "yyyy-MM-dd'T'HH:mm"));
    }
  };

  const handleTimeChange = (e) => {
    const newTime = e.target.value;
    setTimeValue(newTime);
    
    if (selectedDate) {
      const date = new Date(selectedDate);
      const [hours, minutes] = newTime.split(':');
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      onChange(format(date, "yyyy-MM-dd'T'HH:mm"));
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={`w-full justify-start text-right font-normal ${!value && 'text-slate-500'}`}
            role="button"
            aria-label={label || placeholder}
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <CalendarIcon className="ml-2 h-4 w-4" />
            {value ? (
              <span dir="rtl">
                {format(new Date(value), 'dd MMMM yyyy, HH:mm', { locale: he })}
              </span>
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              initialFocus
              locale={he}
            />
          </div>
          <div className="p-3 space-y-2">
            <Label htmlFor="time-picker" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              שעה
            </Label>
            <Input
              id="time-picker"
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="w-full"
              aria-label="בחר שעה"
            />
            <Button
              onClick={() => setOpen(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              אישור
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}