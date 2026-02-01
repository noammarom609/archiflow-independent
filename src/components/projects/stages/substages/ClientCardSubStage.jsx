import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles,
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';
import { showSuccess, showError } from '../../../utils/notifications';

export default function ClientCardSubStage({ project, onComplete, onContinue, onUpdate }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: recordings = [] } = useQuery({
    queryKey: ['projectRecordings', project?.id],
    queryFn: () => archiflow.entities.Recording.filter({ project_id: String(project?.id) }),
    enabled: !!project?.id
  });

  const generateFromAI = async () => {
    if (recordings.length === 0 && !project?.ai_summary && !project?.phone_call_checklist && !project?.client_needs_checklist) {
      showError('אין מספיק נתונים למילוי אוטומטי');
      return;
    }

    setIsGenerating(true);

    try {
      // Collect ALL available data
      const analysisData = recordings.filter(r => r.analysis).map(r => r.analysis);
      const projectSummary = project?.ai_summary || {};
      const phoneChecklist = project?.phone_call_checklist || [];
      const meetingChecklist = project?.client_needs_checklist || [];
      
      const phoneChecklistText = phoneChecklist
        .filter(item => item.checked)
        .map(item => `${item.item}: ${item.notes || 'בוצע'}`)
        .join('\n');
      
      const meetingChecklistText = meetingChecklist
        .filter(item => item.checked)
        .map(item => `${item.item}: ${item.notes || 'בוצע'}`)
        .join('\n');

      const result = await archiflow.integrations.Core.InvokeLLM({
        prompt: `אתה עוזר חכם לעדכון כרטיסי לקוח ותיקי פרויקט עבור משרד אדריכלות.

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
לקוח: ${project?.client || 'לא מוגדר'}

---

## המשימה שלך:
חלץ ומלא פרטי לקוח ופרויקט על בסיס כל הנתונים לעיל.

עבור **לקוח**:
- פרטים אישיים (שם, טלפון, אימייל, כתובת)
- העדפות עיצוביות
- הערות רלוונטיות

עבור **פרויקט**:
- תיאור מפורט
- תקציב משוער
- לוח זמנים רצוי
- הערות ודגשים

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
                notes: { type: 'string' }
              }
            },
            project: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                budget: { type: 'string' },
                timeline: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      });

      const aiData = result?.response && typeof result.response === 'object' 
        ? result.response 
        : result;
      
      console.log('🤖 AI Response for client/project:', aiData);
      
      // Update project with AI data
      if (onUpdate && aiData) {
        const updates = {};
        
        if (aiData.client) {
          if (aiData.client.full_name) updates.client = aiData.client.full_name;
          if (aiData.client.phone) updates.client_phone = aiData.client.phone;
          if (aiData.client.email) updates.client_email = aiData.client.email;
          if (aiData.client.address) updates.location = aiData.client.address;
        }
        
        if (aiData.project) {
          if (aiData.project.description) updates.description = aiData.project.description;
          if (aiData.project.budget) updates.budget = parseInt(aiData.project.budget.replace(/[^\d]/g, '')) || undefined;
          if (aiData.project.timeline) updates.timeline = aiData.project.timeline;
          if (aiData.project.notes) updates.notes = aiData.project.notes;
        }
        
        if (Object.keys(updates).length > 0) {
          await onUpdate(updates);
        }
      }

      showSuccess('הנתונים עודכנו מ-AI! בדוק את פרטי הלקוח ותיק הפרויקט למטה.');
    } catch (error) {
      console.error('AI Generation Error:', error);
      showError('שגיאה במילוי נתונים מ-AI');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ✅ AI Fill Button */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900 text-lg">עדכון באמצעות AI</h3>
                <p className="text-sm text-indigo-700">מילוי פרטי לקוח ותיק פרויקט מהנתונים שנאספו</p>
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
                  ממלא...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  מלא מ-AI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Info Banner - Direct user to accordions below */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 text-blue-800">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">
              <span className="font-medium">ערוך את פרטי הלקוח ותיק הפרויקט</span>
              {' '}באקורדיונים הפתוחים למטה. לחץ "מלא מ-AI" למילוי אוטומטי מהנתונים שנאספו.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Continue Button */}
      <Card className="border-green-300 bg-green-50">
        <CardContent className="p-4">
          <Button 
            onClick={async () => {
              try {
                // ✅ Update current_stage to 'proposal' (not status)
                if (onUpdate) {
                  await onUpdate({ 
                    current_stage: 'proposal',
                    current_sub_stage: 'create_proposal'
                  });
                }
                if (onContinue) {
                  onContinue();
                }
                showSuccess('עוברים לשלב הצעת מחיר!');
              } catch (error) {
                console.error('Error moving to proposal stage:', error);
                showError('שגיאה במעבר לשלב הבא');
              }
            }} 
            className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
          >
            המשך להצעת מחיר
            <CheckCircle2 className="w-5 h-5 mr-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
