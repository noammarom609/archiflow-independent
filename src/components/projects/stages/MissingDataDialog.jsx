import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save, Sparkles } from 'lucide-react';

export default function MissingDataDialog({ 
  isOpen, 
  onClose, 
  missingFields = [], 
  project,
  onSave 
}) {
  const [formData, setFormData] = useState({
    budget_estimate: '',
    timeline_estimate: '',
    client_needs: '',
  });

  // Initialize with existing data from project
  useEffect(() => {
    if (project) {
      const aiInsights = project.ai_insights || {};
      const aiSummary = project.ai_summary || {};
      
      setFormData({
        budget_estimate: aiInsights.budget_estimate?.value || aiSummary.budget_estimate || project.budget || '',
        timeline_estimate: aiInsights.timeline_estimate?.value || aiSummary.timeline_estimate || project.timeline || '',
        client_needs: (aiInsights.client_needs || aiSummary.client_needs || [])
          .map(n => typeof n === 'string' ? n : n.value)
          .join('\n') || '',
      });
    }
  }, [project, isOpen]);

  const handleSave = () => {
    // Convert client_needs from text to array
    const clientNeedsArray = formData.client_needs
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const dataToSave = {
      ai_insights: {
        ...(project?.ai_insights || {}),
        budget_estimate: formData.budget_estimate ? {
          value: formData.budget_estimate,
          source: { type: 'manual', date: new Date().toISOString().split('T')[0] }
        } : project?.ai_insights?.budget_estimate,
        timeline_estimate: formData.timeline_estimate ? {
          value: formData.timeline_estimate,
          source: { type: 'manual', date: new Date().toISOString().split('T')[0] }
        } : project?.ai_insights?.timeline_estimate,
        client_needs: clientNeedsArray.length > 0 ? clientNeedsArray.map(need => ({
          value: need,
          source: { type: 'manual', date: new Date().toISOString().split('T')[0] }
        })) : project?.ai_insights?.client_needs,
        last_updated: new Date().toISOString(),
      },
      // Also update legacy ai_summary for backward compatibility
      ai_summary: {
        ...(project?.ai_summary || {}),
        budget_estimate: formData.budget_estimate || project?.ai_summary?.budget_estimate,
        timeline_estimate: formData.timeline_estimate || project?.ai_summary?.timeline_estimate,
        client_needs: clientNeedsArray.length > 0 ? clientNeedsArray : project?.ai_summary?.client_needs,
      },
      // Update top-level fields too
      budget: formData.budget_estimate || project?.budget,
      timeline: formData.timeline_estimate || project?.timeline,
    };

    onSave(dataToSave);
    onClose();
  };

  const fieldLabels = {
    'הקלטת שיחה או פגישה': 'recording',
    'ניתוח AI מהשיחות': 'ai_analysis',
    'צרכי הלקוח': 'client_needs',
    'הערכת תקציב': 'budget_estimate',
  };

  // Check which fields are actually missing and can be filled manually
  const canFillManually = missingFields.filter(f => 
    f === 'צרכי הלקוח' || f === 'הערכת תקציב'
  );

  const requiresRecording = missingFields.some(f => 
    f === 'הקלטת שיחה או פגישה' || f === 'ניתוח AI מהשיחות'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-5 h-5" />
            חסרים נתונים ליצירת הצעה עם AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Show what's missing */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm font-medium text-amber-800 mb-2">הנתונים הבאים חסרים:</p>
            <div className="flex flex-wrap gap-2">
              {missingFields.map((field, idx) => (
                <Badge key={idx} variant="outline" className="border-amber-300 text-amber-700">
                  {field}
                </Badge>
              ))}
            </div>
          </div>

          {/* Info about recording requirement */}
          {requiresRecording && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                💡 <strong>טיפ:</strong> להצעה מדויקת יותר, מומלץ להקליט שיחה או פגישה עם הלקוח ולהריץ ניתוח AI.
                בינתיים, תוכל למלא את הנתונים ידנית למטה.
              </p>
            </div>
          )}

          {/* Manual input fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="budget" className="text-sm font-medium">
                הערכת תקציב
              </Label>
              <Input
                id="budget"
                placeholder="לדוגמה: 200,000-300,000 ₪"
                value={formData.budget_estimate}
                onChange={(e) => setFormData(prev => ({ ...prev, budget_estimate: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="timeline" className="text-sm font-medium">
                לוח זמנים משוער
              </Label>
              <Input
                id="timeline"
                placeholder="לדוגמה: 3-4 חודשים"
                value={formData.timeline_estimate}
                onChange={(e) => setFormData(prev => ({ ...prev, timeline_estimate: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="needs" className="text-sm font-medium">
                צרכי הלקוח (שורה לכל צורך)
              </Label>
              <Textarea
                id="needs"
                placeholder={"שיפוץ מטבח\nהרחבת סלון\nהוספת חדר עבודה"}
                value={formData.client_needs}
                onChange={(e) => setFormData(prev => ({ ...prev, client_needs: e.target.value }))}
                className="mt-1 min-h-[100px]"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Save className="w-4 h-4 ml-2" />
            שמור והמשך
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}