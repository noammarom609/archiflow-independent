import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Zap, 
  User, 
  Phone, 
  MessageSquare, 
  Clock, 
  CheckCircle2,
  Loader2,
  Calendar,
  Bell
} from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';
import { archiflow } from '@/api/archiflow';
import { useAuth } from '@/lib/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Reminder time options
const reminderOptions = [
  { value: '30', label: 'עוד 30 דקות' },
  { value: '60', label: 'עוד שעה' },
  { value: '120', label: 'עוד שעתיים' },
  { value: '240', label: 'עוד 4 שעות' },
  { value: 'tomorrow_9', label: 'מחר ב-9:00' },
  { value: 'tomorrow_14', label: 'מחר ב-14:00' },
  { value: 'custom', label: 'בחירת תאריך ושעה' },
];

// Stock images for quick projects
const stockImages = [
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
];

export default function QuickLeadModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    notes: '',
  });
  
  const [createTask, setCreateTask] = useState(true);
  const [reminderTime, setReminderTime] = useState('60');
  const [customDateTime, setCustomDateTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', phone: '', notes: '' });
      setCreateTask(true);
      setReminderTime('60');
      setCustomDateTime('');
      setErrors({});
    }
  }, [isOpen]);
  
  // Calculate reminder datetime
  const calculateReminderDate = () => {
    const now = new Date();
    
    switch (reminderTime) {
      case '30':
        return new Date(now.getTime() + 30 * 60 * 1000);
      case '60':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '120':
        return new Date(now.getTime() + 120 * 60 * 1000);
      case '240':
        return new Date(now.getTime() + 240 * 60 * 1000);
      case 'tomorrow_9': {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;
      }
      case 'tomorrow_14': {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(14, 0, 0, 0);
        return tomorrow;
      }
      case 'custom':
        return customDateTime ? new Date(customDateTime) : new Date(now.getTime() + 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 60 * 60 * 1000);
    }
  };
  
  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'שם חובה';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'טלפון חובה';
    } else if (!/^[\d\-\+\s]{9,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'מספר טלפון לא תקין';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };
  
  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      const userEmail = user?.email;
      
      // 1. Create client entity
      const newClient = await archiflow.entities.Client.create({
        full_name: formData.name.trim(),
        phone: formData.phone.trim(),
        status: 'lead',
        notes: formData.notes || null,
        architect_email: userEmail,
        created_by: userEmail,
      });
      
      // 2. Create quick project
      const projectName = `ליד - ${formData.name.trim()}`;
      const newProject = await archiflow.entities.Project.create({
        name: projectName,
        client_id: newClient.id,
        client_name: formData.name.trim(),
        client_phone: formData.phone.trim(),
        status: 'active',
        current_stage: 'first_call',
        current_sub_stage: 'phone_call',
        image: stockImages[Math.floor(Math.random() * stockImages.length)],
        architect_email: userEmail,
        created_by: userEmail,
        notes: formData.notes || null,
      });
      
      // 3. Create follow-up task if enabled
      if (createTask) {
        const reminderDate = calculateReminderDate();
        
        // Create task
        await archiflow.entities.Task.create({
          title: `לחזור ל: ${formData.name.trim()}`,
          description: `חזרה לליד: ${formData.name.trim()}\nטלפון: ${formData.phone.trim()}${formData.notes ? `\n\nהערות: ${formData.notes}` : ''}`,
          project_id: newProject.id,
          status: 'pending',
          priority: 'high',
          due_date: reminderDate.toISOString(),
          assignee_email: userEmail,
          created_by: userEmail,
          task_type: 'follow_up',
        });
        
        // Create lead follow-up record
        try {
          await archiflow.entities.LeadFollowup.create({
            project_id: newProject.id,
            type: 'phone_call',
            scheduled_at: reminderDate.toISOString(),
            notes: formData.notes || null,
            created_by: userEmail,
          });
        } catch (err) {
          // If LeadFollowup entity doesn't exist yet, just log and continue
          console.log('LeadFollowup entity not available yet:', err);
        }
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      showSuccess(`ליד "${formData.name}" נוצר בהצלחה!${createTask ? ' משימת חזרה נוספה.' : ''}`);
      
      onSuccess?.(newProject);
      onClose();
      
    } catch (error) {
      console.error('Error creating quick lead:', error);
      showError('שגיאה ביצירת הליד');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            ליד מהיר
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name field */}
          <div>
            <Label htmlFor="quick-name" className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              שם <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quick-name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="שם הליד"
              className={`mt-1.5 ${errors.name ? 'border-red-500' : ''}`}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          
          {/* Phone field */}
          <div>
            <Label htmlFor="quick-phone" className="text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              טלפון <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quick-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="050-1234567"
              className={`mt-1.5 ${errors.phone ? 'border-red-500' : ''}`}
              dir="ltr"
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>
          
          {/* Notes field */}
          <div>
            <Label htmlFor="quick-notes" className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              הערות מהירות
            </Label>
            <Textarea
              id="quick-notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="מה הליד רצה? מאיפה הגיע?"
              rows={2}
              className="mt-1.5 resize-none"
            />
          </div>
          
          {/* Task toggle and reminder */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <Label htmlFor="create-task" className="text-sm font-medium cursor-pointer">
                  צור משימה לחזרה
                </Label>
              </div>
              <Switch
                id="create-task"
                checked={createTask}
                onCheckedChange={setCreateTask}
              />
            </div>
            
            <AnimatePresence>
              {createTask && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      מתי לתזכר?
                    </Label>
                    <Select value={reminderTime} onValueChange={setReminderTime}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reminderOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {reminderTime === 'custom' && (
                      <Input
                        type="datetime-local"
                        value={customDateTime}
                        onChange={(e) => setCustomDateTime(e.target.value)}
                        className="mt-2"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              ביטול
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  יוצר...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  צור ליד
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
