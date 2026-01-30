import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Sparkles,
  Save,
  CheckCircle2,
  Loader2,
  RefreshCw,
  FolderKanban,
  ClipboardList
} from 'lucide-react';
import { showSuccess, showError } from '../../../utils/notifications';

export default function ClientCardSubStage({ project, onComplete, onContinue, onUpdate }) {
  const queryClient = useQueryClient();
  const [isCreatingBoth, setIsCreatingBoth] = useState(false);
  
  const [clientData, setClientData] = useState({
    full_name: project?.client || '',
    email: project?.client_email || '',
    phone: project?.client_phone || '',
    address: project?.location || '',
    company: '',
    source: 'other',
    notes: '',
    preferences: {
      styles: [],
      colors: [],
      materials: [],
      budget_range: '',
      priorities: []
    }
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const { data: recordings = [] } = useQuery({
    queryKey: ['projectRecordings', project?.id],
    queryFn: () => base44.entities.Recording.filter({ project_id: String(project?.id) }),
    enabled: !!project?.id
  });

  const [projectData, setProjectData] = useState({
    name: project?.name || '',
    description: '',
    location: project?.location || '',
    budget: '',
    timeline: '',
    notes: ''
  });

  const createClientMutation = useMutation({
    mutationFn: async (data) => {
      const newClient = await base44.entities.Client.create(data);
      // Also update project with synced client data
      if (onUpdate) {
        await onUpdate({ 
          client_id: newClient.id,
          client: newClient.full_name,
          client_email: newClient.email,
          client_phone: newClient.phone,
          location: newClient.address || project?.location
        });
      }
      return newClient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showSuccess('כרטיס לקוח נוצר בהצלחה!');
    },
    onError: () => {
      showError('שגיאה ביצירת כרטיס לקוח');
    }
  });

  const generateFromAI = async () => {
    if (recordings.length === 0 && !project?.ai_summary && !project?.phone_call_checklist && !project?.client_needs_checklist) {
      showError('אין מספיק נתונים ליצירת כרטיס אוטומטי');
      return;
    }

    setIsGenerating(true);
    setIsCreatingBoth(true);

    try {
      // Collect ALL available data
      const analysisData = recordings.filter(r => r.analysis).map(r => r.analysis);
      const projectSummary = project?.ai_summary || {};
      const phoneChecklist = project?.phone_call_checklist || [];
      const meetingChecklist = project?.client_needs_checklist || [];
      
      // Build comprehensive context
      const phoneChecklistText = phoneChecklist
        .filter(item => item.checked)
        .map(item => `${item.item}: ${item.notes || 'בוצע'}`)
        .join('\n');
      
      const meetingChecklistText = meetingChecklist
        .filter(item => item.checked)
        .map(item => `${item.item}: ${item.notes || 'בוצע'}`)
        .join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `אתה עוזר חכם ליצירת כרטיסי לקוח ותיקי פרויקט מקיפים עבור משרד אדריכלות.

## נתונים זמינים:

### ניתוח הקלטות:
${JSON.stringify(analysisData, null, 2)}

### סיכום AI כללי:
${JSON.stringify(projectSummary, null, 2)}

### תשובות מצ'קליסט שיחת טלפון:
${phoneChecklistText || 'לא זמין'}

### תשובות מצ'קליסט פגישה ראשונה:
${meetingChecklistText || 'לא זמין'}

### פרטי פרויקט קיימים:
שם: ${project?.name || 'לא מוגדר'}
מיקום: ${project?.location || 'לא מוגדר'}

---

## המשימה שלך:
צור כרטיס לקוח מפורט ותיק פרויקט מלא על בסיס כל הנתונים לעיל.

עבור **כרטיס הלקוח**, חלץ ומלא:
- פרטים אישיים (שם, טלפון, אימייל, כתובת)
- העדפות עיצוביות (סגנונות, צבעים, חומרים)
- טווח תקציבי
- הערות רלוונטיות על הלקוח

עבור **תיק הפרויקט**, חלץ ומלא:
- שם הפרויקט (אם לא מוגדר, צור שם תיאורי)
- תיאור מפורט של הפרויקט
- מיקום מדויק
- תקציב משוער
- לוח זמנים רצוי
- הערות ודגשים חשובים

היה מדויק ומקצועי. אם משהו לא הוזכר, השאר ריק.`,
        response_json_schema: {
          type: 'object',
          properties: {
            client: {
              type: 'object',
              properties: {
                full_name: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string' },
                address: { type: 'string' },
                preferences: {
                  type: 'object',
                  properties: {
                    styles: { type: 'array', items: { type: 'string' } },
                    colors: { type: 'array', items: { type: 'string' } },
                    materials: { type: 'array', items: { type: 'string' } },
                    budget_range: { type: 'string' },
                    priorities: { type: 'array', items: { type: 'string' } }
                  }
                },
                notes: { type: 'string' }
              }
            },
            project: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                location: { type: 'string' },
                budget: { type: 'string' },
                timeline: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      });

      setAiSuggestions(result);
      
      // Update client data
      if (result.client) {
        setClientData(prev => ({
          ...prev,
          full_name: result.client.full_name || prev.full_name,
          phone: result.client.phone || prev.phone,
          email: result.client.email || prev.email,
          address: result.client.address || prev.address,
          preferences: { ...prev.preferences, ...result.client.preferences },
          notes: result.client.notes || prev.notes
        }));
      }
      
      // Update project data
      if (result.project) {
        setProjectData(prev => ({
          ...prev,
          name: result.project.name || prev.name,
          description: result.project.description || prev.description,
          location: result.project.location || prev.location,
          budget: result.project.budget || prev.budget,
          timeline: result.project.timeline || prev.timeline,
          notes: result.project.notes || prev.notes
        }));
      }

      showSuccess('כרטיס לקוח ותיק פרויקט נוצרו מ-AI!');
    } catch (error) {
      console.error('AI Generation Error:', error);
      showError('שגיאה ביצירת נתונים מ-AI');
    } finally {
      setIsGenerating(false);
      setIsCreatingBoth(false);
    }
  };

  const handleSave = async () => {
    if (!clientData.full_name || !clientData.phone) {
      showError('שם וטלפון הם שדות חובה');
      return;
    }

    createClientMutation.mutate({
      ...clientData,
      status: 'active',
      projects: project?.id ? [String(project.id)] : [],
      first_contact_date: new Date().toISOString().split('T')[0],
      timeline: [{
        date: new Date().toISOString(),
        type: 'client_created',
        title: 'כרטיס לקוח נוצר',
        description: `נוצר מפרויקט: ${project?.name}`,
        project_id: project?.id ? String(project.id) : undefined
      }]
    });
  };

  const updateField = (field, value) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* AI Generation */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900 text-lg">יצירה אוטומטית חכמה מ-AI</h3>
                <p className="text-sm text-indigo-700">כרטיס לקוח + תיק פרויקט מלא מכל הנתונים שנאספו</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs bg-white/50">
                    <User className="w-3 h-3 ml-1" />
                    ניתוח הקלטות
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-white/50">
                    <ClipboardList className="w-3 h-3 ml-1" />
                    צ'קליסטים
                  </Badge>
                </div>
              </div>
            </div>
            <Button 
              onClick={generateFromAI} 
              disabled={isGenerating}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  יוצר...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  צור כרטיס + תיק
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Client Form */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-indigo-600" />
            כרטיס לקוח
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>שם מלא *</Label>
              <div className="relative mt-1">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={clientData.full_name} onChange={(e) => updateField('full_name', e.target.value)} className="pr-10" placeholder="שם הלקוח" />
              </div>
            </div>
            
            <div>
              <Label>טלפון *</Label>
              <div className="relative mt-1">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={clientData.phone} onChange={(e) => updateField('phone', e.target.value)} className="pr-10" placeholder="050-0000000" dir="ltr" />
              </div>
            </div>
            
            <div>
              <Label>אימייל</Label>
              <div className="relative mt-1">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input type="email" value={clientData.email} onChange={(e) => updateField('email', e.target.value)} className="pr-10" dir="ltr" />
              </div>
            </div>
            
            <div>
              <Label>כתובת</Label>
              <div className="relative mt-1">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={clientData.address} onChange={(e) => updateField('address', e.target.value)} className="pr-10" />
              </div>
            </div>
            
            <div>
              <Label>מקור הפניה</Label>
              <Select value={clientData.source} onValueChange={(value) => updateField('source', value)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="referral">המלצה</SelectItem>
                  <SelectItem value="website">אתר</SelectItem>
                  <SelectItem value="social_media">רשתות חברתיות</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>הערות</Label>
            <Textarea value={clientData.notes} onChange={(e) => updateField('notes', e.target.value)} className="mt-1 min-h-[100px]" />
          </div>

          <Button onClick={handleSave} disabled={createClientMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {createClientMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
            שמור כרטיס לקוח
          </Button>
        </CardContent>
      </Card>

      {/* Project Form */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderKanban className="w-5 h-5 text-purple-600" />
            תיק פרויקט
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>שם הפרויקט</Label>
              <Input 
                value={projectData.name} 
                onChange={(e) => setProjectData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="שם תיאורי לפרויקט"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>מיקום</Label>
              <div className="relative mt-1">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  value={projectData.location} 
                  onChange={(e) => setProjectData(prev => ({ ...prev, location: e.target.value }))}
                  className="pr-10"
                  placeholder="כתובת הפרויקט"
                />
              </div>
            </div>
            
            <div>
              <Label>תקציב משוער</Label>
              <Input 
                value={projectData.budget} 
                onChange={(e) => setProjectData(prev => ({ ...prev, budget: e.target.value }))}
                placeholder="₪150,000 - ₪250,000"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>לוח זמנים</Label>
              <Input 
                value={projectData.timeline} 
                onChange={(e) => setProjectData(prev => ({ ...prev, timeline: e.target.value }))}
                placeholder="6-8 חודשים"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>תיאור הפרויקט</Label>
            <Textarea 
              value={projectData.description} 
              onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 min-h-[100px]"
              placeholder="תיאור מקיף של הפרויקט, היקף העבודה, מטרות..."
            />
          </div>

          <div>
            <Label>הערות נוספות</Label>
            <Textarea 
              value={projectData.notes} 
              onChange={(e) => setProjectData(prev => ({ ...prev, notes: e.target.value }))}
              className="mt-1 min-h-[80px]"
              placeholder="הערות חשובות, דגשים, נקודות לתשומת לב..."
            />
          </div>

          <Button 
            onClick={async () => {
              if (onUpdate) {
                await onUpdate({
                  name: projectData.name,
                  description: projectData.description,
                  location: projectData.location,
                  budget: projectData.budget,
                  timeline: projectData.timeline,
                  notes: projectData.notes
                });
                showSuccess('תיק הפרויקט עודכן!');
              }
            }}
            variant="outline"
            className="w-full"
          >
            <Save className="w-4 h-4 ml-2" />
            שמור תיק פרויקט
          </Button>
        </CardContent>
      </Card>

      {/* Continue Button */}
      <Card className="border-green-300 bg-green-50">
        <CardContent className="p-4">
          <Button 
            onClick={() => {
              // Validate that client was saved before continuing
              if (!project?.client_id) {
                showError('יש לשמור כרטיס לקוח לפני המשך');
                return;
              }
              // Move project to next stage
              if (onUpdate) {
                onUpdate({ status: 'proposal' });
              }
              if (onContinue) {
                onContinue();
              }
            }} 
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
            disabled={!project?.client_id}
          >
            המשך להצעת מחיר
            <CheckCircle2 className="w-5 h-5 mr-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}