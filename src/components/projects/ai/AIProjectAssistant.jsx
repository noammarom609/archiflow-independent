import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sparkles, FileText, Loader2, Download, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/utils/notifications';
import { generatePDFFromElement } from '@/components/utils/pdfGenerator';

/**
 * AI Assistant for Project Management
 * Handles:
 * 1. Phase Summaries
 * 2. Progress Reports
 * 3. Advanced Analysis
 */

export const generatePhaseSummary = async (project, stageId, tasks = []) => {
  try {
    const prompt = `
      נתח את השלב "${stageId}" בפרויקט "${project.name}".
      
      נתוני הפרויקט:
      - תיאור: ${project.description || 'ללא תיאור'}
      - סטטוס נוכחי: ${project.status}
      
      משימות שהושלמו בשלב זה:
      ${tasks.filter(t => t.status === 'completed').map(t => `- ${t.title}`).join('\n') || 'אין משימות שהושלמו'}
      
      אנא צור סיכום קצר (עד 3 משפטים) של מה שהושג בשלב זה, וציין אם יש חריגות או דברים שדורשים תשומת לב להמשך.
      התשובה צריכה להיות בעברית, מקצועית ותמציתית.
    `;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          attention_points: { type: 'array', items: { type: 'string' } }
        }
      }
    });

    return result;
  } catch (error) {
    console.error('Error generating summary:', error);
    return null;
  }
};

export function ProjectReportDialog({ isOpen, onClose, project }) {
  const [reportType, setReportType] = useState('progress');
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [includeTasks, setIncludeTasks] = useState(true);
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // 1. Fetch relevant data
      const tasks = await base44.entities.Task.filter({ project_id: project.id });
      // We assume financials come from project or invoices, let's keep it simple for now
      
      const prompt = `
        צור דוח פרויקט מסוג "${reportType}" עבור פרויקט "${project.name}".
        
        פרטי הפרויקט:
        - לקוח: ${project.client || 'לא צוין'}
        - מיקום: ${project.location || 'לא צוין'}
        - סטטוס: ${project.status}
        - התקדמות משוערת: ${project.progress || 0}%
        
        נתונים לכלול:
        ${includeTasks ? `- סה"כ משימות: ${tasks.length}, הושלמו: ${tasks.filter(t => t.status === 'completed').length}` : ''}
        ${includeTimeline ? `- לו"ז: ${project.timeline || 'לא צוין'}` : ''}
        ${includeFinancials ? `- תקציב: ${project.budget || 'לא צוין'}` : ''}
        
        אנא צור דוח מפורט הכולל:
        1. תקציר מנהלים
        2. סטטוס נוכחי והישגים עיקריים
        3. אתגרים וסיכונים
        4. צעדים הבאים
        
        הדוח צריך להיות בפורמט HTML נקי (ללא תגיות html/body, רק תוכן בתוך div) שמתאים לתצוגה בכרטיסיה. השתמש בכותרות h3, h4 ובפסקאות p.
        הטקסט צריך להיות בעברית.
      `;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            html_content: { type: 'string' },
            title: { type: 'string' }
          }
        }
      });

      setGeneratedReport(result);
      showSuccess('הדוח נוצר בהצלחה!');
    } catch (error) {
      console.error('Report generation error:', error);
      showError('שגיאה ביצירת הדוח');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedReport) return;
    try {
      await generatePDFFromElement('ai-report-content', `דוח-${project.name}.pdf`);
      showSuccess('הדוח הורד למחשב');
    } catch (error) {
      showError('שגיאה בהורדת הדוח');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            מחולל דוחות AI
          </DialogTitle>
        </DialogHeader>

        {!generatedReport ? (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <Label>סוג הדוח</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="progress">דוח התקדמות שוטף</SelectItem>
                    <SelectItem value="client_update">עדכון ללקוח</SelectItem>
                    <SelectItem value="internal_review">סקירה פנימית</SelectItem>
                    <SelectItem value="completion">סיכום פרויקט</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>נתונים לכלול</Label>
                <div className="flex items-center gap-2">
                  <Checkbox id="inc-tasks" checked={includeTasks} onCheckedChange={setIncludeTasks} />
                  <Label htmlFor="inc-tasks" className="font-normal cursor-pointer">סטטוס משימות וביצוע</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="inc-timeline" checked={includeTimeline} onCheckedChange={setIncludeTimeline} />
                  <Label htmlFor="inc-timeline" className="font-normal cursor-pointer">לוחות זמנים ואבני דרך</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="inc-finance" checked={includeFinancials} onCheckedChange={setIncludeFinancials} />
                  <Label htmlFor="inc-finance" className="font-normal cursor-pointer">נתונים כספיים ותקציב</Label>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מנתח נתונים ומייצר דוח...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  צור דוח
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div 
              id="ai-report-content" 
              className="bg-slate-50 p-6 rounded-lg border border-slate-200 prose prose-indigo max-w-none text-right"
              dir="rtl"
            >
              <h2 className="text-xl font-bold mb-4 text-indigo-900 border-b pb-2">{generatedReport.title}</h2>
              <div dangerouslySetInnerHTML={{ __html: generatedReport.html_content }} />
              <div className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                <span>נוצר ע"י ArchiFlow AI</span>
                <span>{new Date().toLocaleDateString('he-IL')}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setGeneratedReport(null)} className="flex-1">
                <RefreshCw className="w-4 h-4 ml-2" />
                צור חדש
              </Button>
              <Button onClick={handleDownloadPDF} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                <Download className="w-4 h-4 ml-2" />
                הורד כ-PDF
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}