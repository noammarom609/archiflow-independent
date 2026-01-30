import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { archiflow } from '@/api/archiflow';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  FileText as PdfIcon
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/notifications';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function PortfolioExportDialog({ isOpen, onClose, project, documents, tasks, recordings }) {
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' | 'excel'
  const [isExporting, setIsExporting] = useState(false);
  const [selectedSections, setSelectedSections] = useState({
    projectInfo: true,
    clientInfo: true,
    aiInsights: true,
    documents: true,
    tasks: true,
    timeline: true,
    financials: true,
  });

  const toggleSection = (section) => {
    setSelectedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const sections = [
    { id: 'projectInfo', label: 'פרטי פרויקט', description: 'שם, מיקום, תקציב' },
    { id: 'clientInfo', label: 'פרטי לקוח', description: 'שם, טלפון, אימייל' },
    { id: 'aiInsights', label: 'תובנות AI', description: 'ניתוח שיחות ופגישות' },
    { id: 'documents', label: 'רשימת מסמכים', description: `${documents?.length || 0} מסמכים` },
    { id: 'tasks', label: 'משימות', description: `${tasks?.length || 0} משימות` },
    { id: 'timeline', label: 'לוח זמנים', description: 'אבני דרך וגנט' },
    { id: 'financials', label: 'נתונים פיננסיים', description: 'תקציב והוצאות' },
  ];

  const generatePDF = async () => {
    setIsExporting(true);
    try {
      // Use LLM to format the data nicely
      const exportData = {
        project: {
          name: project.name,
          location: project.location,
          client: project.client,
          client_email: project.client_email,
          client_phone: project.client_phone,
          status: project.status,
          budget: project.budget,
          timeline: project.timeline,
          start_date: project.start_date,
          end_date: project.end_date,
        },
        ai_summary: selectedSections.aiInsights ? project.ai_summary : null,
        documents: selectedSections.documents ? documents.map(d => ({
          title: d.title,
          category: d.category,
          date: d.created_date,
        })) : [],
        tasks: selectedSections.tasks ? tasks.map(t => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          due_date: t.due_date,
        })) : [],
        gantt: selectedSections.timeline ? project.gantt_data : null,
      };

      const prompt = `צור דוח PDF מקצועי עבור פרויקט אדריכלות בשם "${project.name}".

הנתונים:
${JSON.stringify(exportData, null, 2)}

הפק HTML מעוצב יפה בעברית (RTL) שמתאים להדפסה/PDF עם:
1. כותרת ראשית עם שם הפרויקט
2. סקירת פרטי הפרויקט והלקוח
3. ${selectedSections.aiInsights ? 'סיכום תובנות AI' : ''}
4. ${selectedSections.documents ? 'טבלת מסמכים' : ''}
5. ${selectedSections.tasks ? 'טבלת משימות עם סטטוסים' : ''}
6. ${selectedSections.timeline ? 'לוח זמנים / אבני דרך' : ''}

השתמש בסגנון מקצועי ונקי. החזר HTML בלבד ללא הסברים.`;

      const htmlContent = await archiflow.integrations.Core.InvokeLLM({
        prompt,
      });

      // Create blob and download
      const blob = new Blob([`
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <title>תיק פרויקט - ${project.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #1e293b; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
            h2 { color: #334155; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: right; }
            th { background: #f1f5f9; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            .badge-green { background: #dcfce7; color: #166534; }
            .badge-amber { background: #fef3c7; color: #92400e; }
            .badge-blue { background: #dbeafe; color: #1e40af; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          ${htmlContent}
          <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px;">
            נוצר ב-${format(new Date(), 'd בMMMM yyyy', { locale: he })} • ArchiFlow
          </footer>
        </body>
        </html>
      `], { type: 'text/html' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `תיק_פרויקט_${project.name}_${format(new Date(), 'yyyy-MM-dd')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('הדוח יוצא בהצלחה!');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      showError('שגיאה בייצוא הדוח');
    } finally {
      setIsExporting(false);
    }
  };

  const generateExcel = async () => {
    setIsExporting(true);
    try {
      // Create CSV content
      let csv = '\uFEFF'; // BOM for Hebrew support
      
      // Project Info
      csv += 'פרטי פרויקט\n';
      csv += `שם,${project.name}\n`;
      csv += `מיקום,${project.location || ''}\n`;
      csv += `לקוח,${project.client || ''}\n`;
      csv += `תקציב,${project.budget || ''}\n`;
      csv += `סטטוס,${project.status || ''}\n`;
      csv += '\n';

      // Documents
      if (selectedSections.documents && documents.length > 0) {
        csv += 'מסמכים\n';
        csv += 'שם,קטגוריה,תאריך\n';
        documents.forEach(doc => {
          csv += `${doc.title},${doc.category || ''},${format(new Date(doc.created_date), 'dd/MM/yyyy')}\n`;
        });
        csv += '\n';
      }

      // Tasks
      if (selectedSections.tasks && tasks.length > 0) {
        csv += 'משימות\n';
        csv += 'שם,סטטוס,עדיפות,תאריך יעד\n';
        tasks.forEach(task => {
          csv += `${task.title},${task.status || ''},${task.priority || ''},${task.due_date ? format(new Date(task.due_date), 'dd/MM/yyyy') : ''}\n`;
        });
        csv += '\n';
      }

      // Gantt
      if (selectedSections.timeline && project.gantt_data?.milestones?.length > 0) {
        csv += 'אבני דרך\n';
        csv += 'שם,משך (ימים),תאריך סיום\n';
        project.gantt_data.milestones.forEach(m => {
          csv += `${m.name},${m.duration || ''},${m.endDate || ''}\n`;
        });
      }

      // Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `תיק_פרויקט_${project.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showSuccess('הקובץ יוצא בהצלחה!');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      showError('שגיאה בייצוא');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      generatePDF();
    } else {
      generateExcel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            ייצוא תיק פרויקט
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">פורמט ייצוא</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  exportFormat === 'pdf'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <PdfIcon className={`w-8 h-8 ${exportFormat === 'pdf' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium ${exportFormat === 'pdf' ? 'text-indigo-700' : 'text-slate-600'}`}>
                  PDF / HTML
                </span>
                <span className="text-xs text-slate-500">מעוצב להדפסה</span>
              </button>

              <button
                onClick={() => setExportFormat('excel')}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  exportFormat === 'excel'
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileSpreadsheet className={`w-8 h-8 ${exportFormat === 'excel' ? 'text-green-600' : 'text-slate-400'}`} />
                <span className={`text-sm font-medium ${exportFormat === 'excel' ? 'text-green-700' : 'text-slate-600'}`}>
                  Excel / CSV
                </span>
                <span className="text-xs text-slate-500">טבלאות נתונים</span>
              </button>
            </div>
          </div>

          {/* Section Selection */}
          <div>
            <Label className="text-sm font-medium text-slate-700 mb-3 block">בחר חלקים לייצוא</Label>
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                    selectedSections[section.id]
                      ? 'border-indigo-200 bg-indigo-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => toggleSection(section.id)}
                >
                  <Checkbox
                    checked={selectedSections[section.id]}
                    onCheckedChange={() => toggleSection(section.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{section.label}</p>
                    <p className="text-xs text-slate-500">{section.description}</p>
                  </div>
                  {selectedSections[section.id] && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !Object.values(selectedSections).some(Boolean)}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                מייצא...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                ייצא {exportFormat === 'pdf' ? 'PDF' : 'Excel'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}