import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Pencil, 
  Save,
  X,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { showSuccess, showError } from '../../utils/notifications';
import { PROJECT_TYPES } from '../../utils/checklistLoader';

export default function ProjectDetailsCard({ project, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    project_type: '',
    location: '',
    budget: '',
    start_date: '',
    end_date: '',
    image: '',
  });

  const openEditDialog = () => {
    setFormData({
      name: project?.name || '',
      project_type: project?.project_type || 'renovation_apartment',
      location: project?.location || '',
      budget: project?.budget || project?.ai_insights?.budget_estimate?.value || project?.ai_summary?.budget_estimate || '',
      start_date: project?.start_date || '',
      end_date: project?.end_date || '',
      image: project?.image || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(formData);
      showSuccess('פרטי הפרויקט עודכנו בהצלחה');
      setIsEditing(false);
    } catch (err) {
      showError('שגיאה בשמירת הפרטים');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setFormData(prev => ({ ...prev, image: file_url }));
      } catch (err) {
        showError('שגיאה בהעלאת התמונה');
      }
    }
  };

  // Get display values - prefer AI insights if available
  const displayBudget = project?.budget || 
    project?.ai_insights?.budget_estimate?.value || 
    project?.ai_summary?.budget_estimate || 
    'לא צוין';
  
  const displayTimeline = project?.timeline || 
    project?.ai_insights?.timeline_estimate?.value || 
    project?.ai_summary?.timeline_estimate || 
    null;

  const displayLocation = project?.location || 
    project?.ai_insights?.location_details?.value ||
    'לא צוין';

  return (
    <>
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-4 h-4 text-indigo-600" />
              </div>
              פרטי הפרויקט
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openEditDialog}
              className="gap-2"
            >
              <Pencil className="w-3 h-3" />
              עריכה
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Project Image */}
          {project?.image && (
            <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-100">
              <img 
                src={project.image} 
                alt={project.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Project Name & Type */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900">{project?.name || 'פרויקט חדש'}</h3>
            <Badge className="bg-indigo-100 text-indigo-800">
              {PROJECT_TYPES[project?.project_type]?.label || 'לא צוין'}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Location */}
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">מיקום</p>
                <p className="text-sm font-medium text-slate-900">{displayLocation}</p>
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">תקציב משוער</p>
                <p className="text-sm font-medium text-slate-900">{displayBudget}</p>
                {project?.ai_insights?.budget_estimate?.source?.type === 'phone_call' && (
                  <Badge variant="outline" className="text-[10px] mt-1 border-purple-200 text-purple-600">
                    מניתוח AI
                  </Badge>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="flex items-start gap-2 col-span-2">
              <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-xs text-slate-500">לוח זמנים</p>
                {project?.start_date || project?.end_date ? (
                  <p className="text-sm font-medium text-slate-900">
                    {project?.start_date && format(new Date(project.start_date), 'd/M/yyyy', { locale: he })}
                    {project?.start_date && project?.end_date && ' - '}
                    {project?.end_date && format(new Date(project.end_date), 'd/M/yyyy', { locale: he })}
                  </p>
                ) : displayTimeline ? (
                  <div>
                    <p className="text-sm font-medium text-slate-900">{displayTimeline}</p>
                    {project?.ai_insights?.timeline_estimate?.source?.type === 'phone_call' && (
                      <Badge variant="outline" className="text-[10px] mt-1 border-purple-200 text-purple-600">
                        מניתוח AI
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">לא צוין</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת פרטי הפרויקט</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Project Name */}
            <div>
              <Label htmlFor="name">שם הפרויקט</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Project Type */}
            <div>
              <Label>סוג הפרויקט</Label>
              <Select
                value={formData.project_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, project_type: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PROJECT_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">מיקום/כתובת</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="תל אביב, רח' דיזנגוף 123"
                className="mt-1"
              />
            </div>

            {/* Budget */}
            <div>
              <Label htmlFor="budget">תקציב משוער</Label>
              <Input
                id="budget"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="450,000 ₪"
                className="mt-1"
              />
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">תאריך התחלה</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="end_date">תאריך סיום משוער</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Image */}
            <div>
              <Label>תמונת כיסוי</Label>
              <div className="mt-1 space-y-2">
                {formData.image && (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden bg-slate-100">
                    <img 
                      src={formData.image} 
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 left-2 w-6 h-6"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    העלה תמונה
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'שומר...' : 'שמור'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}