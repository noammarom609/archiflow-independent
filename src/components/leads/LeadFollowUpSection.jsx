import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Phone, 
  Calendar, 
  Users, 
  Video, 
  Clock, 
  Plus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  MessageSquare,
  Loader2,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { showSuccess, showError } from '../utils/notifications';
import { FadeIn } from '@/components/animations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Follow-up type configuration
const followUpTypes = [
  { value: 'phone_call', label: 'שיחת טלפון', icon: Phone, color: 'text-blue-600 bg-blue-100' },
  { value: 'meeting', label: 'פגישה פרונטלית', icon: Users, color: 'text-purple-600 bg-purple-100' },
  { value: 'zoom', label: 'פגישת זום', icon: Video, color: 'text-green-600 bg-green-100' },
];

// Outcome configuration
const outcomeConfig = {
  answered: { label: 'ענו', icon: CheckCircle2, color: 'text-green-600 bg-green-100' },
  no_answer: { label: 'לא ענו', icon: XCircle, color: 'text-red-600 bg-red-100' },
  rescheduled: { label: 'נדחה', icon: RefreshCw, color: 'text-amber-600 bg-amber-100' },
  moved_to_proposal: { label: 'עבר להצעה', icon: ArrowRight, color: 'text-primary bg-primary/10' },
};

export default function LeadFollowUpSection({ project, onUpdate }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNewFollowUp, setShowNewFollowUp] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'phone_call',
    scheduled_at: '',
    notes: '',
  });
  
  // Fetch follow-ups for this project
  const { data: followUps = [], isLoading } = useQuery({
    queryKey: ['leadFollowups', project?.id],
    queryFn: async () => {
      try {
        const result = await archiflow.entities.LeadFollowup.list('scheduled_at', {
          project_id: project.id
        });
        return result || [];
      } catch (error) {
        console.log('LeadFollowup entity not available yet');
        return [];
      }
    },
    enabled: !!project?.id,
  });
  
  // Create follow-up mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Create follow-up record
      const followUp = await archiflow.entities.LeadFollowup.create({
        project_id: project.id,
        type: data.type,
        scheduled_at: data.scheduled_at,
        notes: data.notes || null,
        created_by: user?.email,
      });
      
      // Also create a task
      await archiflow.entities.Task.create({
        title: `Follow-up: ${project.client_name || project.name}`,
        description: `${followUpTypes.find(t => t.value === data.type)?.label || data.type}\n${data.notes || ''}`,
        project_id: project.id,
        status: 'pending',
        priority: 'high',
        due_date: data.scheduled_at,
        assignee_email: user?.email,
        created_by: user?.email,
        task_type: 'follow_up',
      });
      
      // Create calendar event if available
      try {
        await archiflow.entities.Event.create({
          title: `Follow-up: ${project.client_name || project.name}`,
          description: data.notes || '',
          start_time: data.scheduled_at,
          end_time: new Date(new Date(data.scheduled_at).getTime() + 30 * 60 * 1000).toISOString(),
          event_type: data.type === 'meeting' ? 'meeting' : data.type === 'zoom' ? 'video_call' : 'call',
          project_id: project.id,
          created_by: user?.email,
        });
      } catch (err) {
        console.log('Could not create calendar event:', err);
      }
      
      return followUp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadFollowups', project?.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      showSuccess('Follow-up נוצר בהצלחה!');
      setShowNewFollowUp(false);
      resetForm();
    },
    onError: (error) => {
      console.error('Error creating follow-up:', error);
      showError('שגיאה ביצירת Follow-up');
    },
  });
  
  // Update follow-up mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return await archiflow.entities.LeadFollowup.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadFollowups', project?.id] });
      showSuccess('Follow-up עודכן בהצלחה!');
      setEditingFollowUp(null);
    },
    onError: () => {
      showError('שגיאה בעדכון Follow-up');
    },
  });
  
  // Delete follow-up mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return await archiflow.entities.LeadFollowup.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadFollowups', project?.id] });
      showSuccess('Follow-up נמחק');
    },
    onError: () => {
      showError('שגיאה במחיקת Follow-up');
    },
  });
  
  // Complete follow-up
  const completeFollowUp = async (followUp, outcome) => {
    await updateMutation.mutateAsync({
      id: followUp.id,
      data: {
        completed_at: new Date().toISOString(),
        outcome: outcome,
      },
    });
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'phone_call',
      scheduled_at: '',
      notes: '',
    });
  };
  
  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.scheduled_at) {
      showError('יש לבחור תאריך ושעה');
      return;
    }
    createMutation.mutate(formData);
  };
  
  // Format date helper
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  // Separate completed and pending
  const pendingFollowUps = followUps.filter(f => !f.completed_at);
  const completedFollowUps = followUps.filter(f => f.completed_at);

  return (
    <FadeIn delay={0.1} direction="up" distance={10}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <span>Follow-ups</span>
              {pendingFollowUps.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {pendingFollowUps.length} ממתינים
                </Badge>
              )}
            </div>
            
            <Dialog open={showNewFollowUp} onOpenChange={setShowNewFollowUp}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  חדש
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>תזמון Follow-up חדש</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  {/* Type selection */}
                  <div>
                    <Label className="text-sm font-medium">סוג</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {followUpTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = formData.type === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                            className={`
                              p-3 rounded-lg border-2 transition-all text-center
                              ${isSelected 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/30'
                              }
                            `}
                          >
                            <Icon className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className={`text-xs ${isSelected ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Date/time */}
                  <div>
                    <Label htmlFor="followup-datetime" className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      תאריך ושעה
                    </Label>
                    <Input
                      id="followup-datetime"
                      type="datetime-local"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduled_at: e.target.value }))}
                      className="mt-1.5"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <Label htmlFor="followup-notes" className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      הערות
                    </Label>
                    <Textarea
                      id="followup-notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="מה לדון? מה להזכיר?"
                      rows={2}
                      className="mt-1.5 resize-none"
                    />
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewFollowUp(false);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      ביטול
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-4 h-4 ml-1.5" />
                          צור
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : followUps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">אין Follow-ups מתוזמנים</p>
              <p className="text-xs mt-1">לחץ על "חדש" כדי לתזמן</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Pending Follow-ups */}
              {pendingFollowUps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">ממתינים</h4>
                  {pendingFollowUps.map((followUp) => {
                    const typeConfig = followUpTypes.find(t => t.value === followUp.type);
                    const TypeIcon = typeConfig?.icon || Phone;
                    const isOverdue = new Date(followUp.scheduled_at) < new Date();
                    
                    return (
                      <motion.div
                        key={followUp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`
                          p-3 rounded-lg border-2 transition-all
                          ${isOverdue 
                            ? 'border-red-200 bg-red-50' 
                            : 'border-border bg-background hover:border-primary/30'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${typeConfig?.color || 'bg-gray-100 text-gray-600'}`}>
                              <TypeIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{typeConfig?.label || followUp.type}</p>
                              <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                                {isOverdue ? 'באיחור: ' : ''}{formatDateTime(followUp.scheduled_at)}
                              </p>
                              {followUp.notes && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                  {followUp.notes}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => completeFollowUp(followUp, 'answered')}>
                                <CheckCircle2 className="w-4 h-4 ml-2 text-green-600" />
                                סומן כבוצע - ענו
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => completeFollowUp(followUp, 'no_answer')}>
                                <XCircle className="w-4 h-4 ml-2 text-red-600" />
                                סומן כבוצע - לא ענו
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => completeFollowUp(followUp, 'rescheduled')}>
                                <RefreshCw className="w-4 h-4 ml-2 text-amber-600" />
                                נדחה
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => completeFollowUp(followUp, 'moved_to_proposal')}>
                                <ArrowRight className="w-4 h-4 ml-2 text-primary" />
                                עבר להצעת מחיר
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  if (confirm('למחוק את ה-Follow-up?')) {
                                    deleteMutation.mutate(followUp.id);
                                  }
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 ml-2" />
                                מחק
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              
              {/* Completed Follow-ups */}
              {completedFollowUps.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">הושלמו</h4>
                  {completedFollowUps.slice(0, 3).map((followUp) => {
                    const typeConfig = followUpTypes.find(t => t.value === followUp.type);
                    const outcome = outcomeConfig[followUp.outcome];
                    const OutcomeIcon = outcome?.icon || CheckCircle2;
                    
                    return (
                      <div
                        key={followUp.id}
                        className="p-2 rounded-lg bg-muted/50 flex items-center gap-3"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${outcome?.color || 'bg-gray-100 text-gray-600'}`}>
                          <OutcomeIcon className="w-3 h-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {typeConfig?.label || followUp.type} • {formatDateTime(followUp.completed_at)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {outcome?.label || followUp.outcome}
                        </Badge>
                      </div>
                    );
                  })}
                  
                  {completedFollowUps.length > 3 && (
                    <p className="text-xs text-center text-muted-foreground">
                      +{completedFollowUps.length - 3} נוספים
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
