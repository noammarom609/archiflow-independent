import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Upload, Tag, Users as UsersIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { showSuccess, showError } from '../utils/notifications';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

export default function AddJournalEntryDialog({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'note',
    project_id: null,
    project_name: '',
    location: '',
    entry_date: new Date().toISOString().split('T')[0],
    attendees: [],
    tags: [],
    is_milestone: false,
    shared_with_client: false,
    mood: 'neutral',
    attachments: [],
  });
  const [newTag, setNewTag] = useState('');
  const [newAttendee, setNewAttendee] = useState('');

  // Fetch projects for dropdown
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
    enabled: isOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.JournalEntry.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      showSuccess('רשומת יומן נוספה בהצלחה! ✓');
      onClose();
      resetForm();
    },
    onError: () => showError('שגיאה בשמירת הרשומה'),
  });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: 'note',
      project_id: null,
      project_name: '',
      location: '',
      entry_date: new Date().toISOString().split('T')[0],
      attendees: [],
      tags: [],
      is_milestone: false,
      shared_with_client: false,
      mood: 'neutral',
      attachments: [],
    });
    setNewTag('');
    setNewAttendee('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const addAttendee = () => {
    if (newAttendee.trim() && !formData.attendees.includes(newAttendee.trim())) {
      setFormData({ ...formData, attendees: [...formData.attendees, newAttendee.trim()] });
      setNewAttendee('');
    }
  };

  const removeAttendee = (attendee) => {
    setFormData({ ...formData, attendees: formData.attendees.filter(a => a !== attendee) });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const attachment = {
          type: file.type.startsWith('image/') ? 'image' : 'document',
          url: file_url,
          name: file.name,
        };
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, attachment],
        }));
      } catch (error) {
        showError(`שגיאה בהעלאת ${file.name}`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                רשומת יומן חדשה
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  {/* Title & Category */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">כותרת *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="לדוגמה: פגישת תיאום עם קבלנים"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">קטגוריה *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">פגישה</SelectItem>
                          <SelectItem value="site_visit">ביקור אתר</SelectItem>
                          <SelectItem value="decision">החלטה</SelectItem>
                          <SelectItem value="milestone">אבן דרך</SelectItem>
                          <SelectItem value="note">הערה</SelectItem>
                          <SelectItem value="issue">בעיה</SelectItem>
                          <SelectItem value="achievement">הישג</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Project, Location, Date */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="project">פרויקט</Label>
                      <Select 
                        value={formData.project_id?.toString() || ''} 
                        onValueChange={(value) => {
                          const project = projects.find(p => p.id.toString() === value);
                          setFormData({ 
                            ...formData, 
                            project_id: project?.id, 
                            project_name: project?.name || '' 
                          });
                        }}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="בחר פרויקט" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map(project => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location">מיקום</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="המשרד, האתר..."
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">תאריך</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.entry_date}
                        onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Mood */}
                  <div>
                    <Label htmlFor="mood">מצב רוח</Label>
                    <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positive">😊 חיובי</SelectItem>
                        <SelectItem value="neutral">😐 ניטרלי</SelectItem>
                        <SelectItem value="challenging">😓 מאתגר</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Content */}
                  <div>
                    <Label htmlFor="content">תוכן *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      required
                      placeholder="תאר את מה שקרה, החלטות שהתקבלו, נושאים שעלו..."
                      className="mt-2 min-h-[150px]"
                    />
                  </div>

                  {/* Attendees */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <UsersIcon className="w-4 h-4" />
                      משתתפים
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newAttendee}
                        onChange={(e) => setNewAttendee(e.target.value)}
                        placeholder="הוסף משתתף..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                      />
                      <Button type="button" onClick={addAttendee} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.attendees.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {formData.attendees.map((att, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                          >
                            {att}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={() => removeAttendee(att)}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      תגיות
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="הוסף תגית..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      />
                      <Button type="button" onClick={addTag} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {formData.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center gap-2"
                          >
                            #{tag}
                            <X
                              className="w-3 h-3 cursor-pointer"
                              onClick={() => removeTag(tag)}
                            />
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      קבצים מצורפים
                    </Label>
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="mt-2"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    {formData.attachments.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {formData.attachments.map((att, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-slate-100 rounded">
                            {att.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Switches */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="milestone" className="cursor-pointer">
                          🏆 סמן כאבן דרך
                        </Label>
                        <Switch
                          id="milestone"
                          checked={formData.is_milestone}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_milestone: checked })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="share" className="cursor-pointer">
                          שתף עם לקוח
                        </Label>
                        <Switch
                          id="share"
                          checked={formData.shared_with_client}
                          onCheckedChange={(checked) => setFormData({ ...formData, shared_with_client: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    ביטול
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    שמור רשומה
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}