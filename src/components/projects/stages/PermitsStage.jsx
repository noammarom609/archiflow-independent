import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileCheck, 
  Upload, 
  Building2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  FileText,
  Calendar,
  SkipForward,
  ChevronRight,
  Send,
  Download,
  ExternalLink,
  Plus,
  X
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/notifications';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import DocumentUploadDialog from '../documents/DocumentUploadDialog';

const PERMIT_SUBSTAGES = [
  { id: 'permit_preparation', label: 'הכנת מסמכים', icon: FileText, description: 'הכנת תוכניות, טפסים ונספחים נדרשים' },
  { id: 'permit_submission', label: 'הגשה לוועדה', icon: Building2, description: 'הגשת הבקשה לרשות המקומית' },
  { id: 'permit_review', label: 'בחינה ותיקונים', icon: AlertTriangle, description: 'טיפול בהערות ותיקונים נדרשים' },
  { id: 'permit_approval', label: 'קבלת היתר', icon: CheckCircle2, description: 'אישור סופי וקבלת היתר' },
];

export default function PermitsStage({ project, currentSubStage, onSubStageChange, onUpdate, onSkipStage, onComplete }) {
  const queryClient = useQueryClient();
  const [documents, setDocuments] = useState(project?.permit_documents || []);
  const [submissionDate, setSubmissionDate] = useState(project?.permit_submission_date || '');
  const [expectedResponseDate, setExpectedResponseDate] = useState(project?.permit_expected_response || '');
  const [permitNumber, setPermitNumber] = useState(project?.permit_number || '');
  const [notes, setNotes] = useState(project?.permit_notes || '');
  const [corrections, setCorrections] = useState(project?.permit_corrections || []);
  const [newCorrection, setNewCorrection] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [permitSystemUrl, setPermitSystemUrl] = useState(project?.permit_system_url || 'https://rishui.interior.gov.il/');

  // Get current substage index
  const currentSubStageIndex = PERMIT_SUBSTAGES.findIndex(s => s.id === currentSubStage) || 0;
  const progressPercent = ((currentSubStageIndex + 1) / PERMIT_SUBSTAGES.length) * 100;

  const updateProjectMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Project.update(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      showSuccess('נשמר בהצלחה');
    },
    onError: () => {
      showError('שגיאה בשמירה');
    }
  });

  const handleSave = () => {
    updateProjectMutation.mutate({
      permit_documents: documents,
      permit_submission_date: submissionDate,
      permit_expected_response: expectedResponseDate,
      permit_number: permitNumber,
      permit_notes: notes,
      permit_corrections: corrections,
    });
  };

  const handleSkipStage = () => {
    if (window.confirm('האם לדלג על שלב ההיתרים? (פרויקט ללא צורך בהיתר)')) {
      if (onSkipStage) {
        onSkipStage();
      } else if (onUpdate) {
        onUpdate({ 
          status: 'technical',
          sub_stage: 'upload_plans',
          permit_skipped: true 
        });
      }
      showSuccess('דילגת על שלב ההיתרים');
    }
  };

  const handleAddCorrection = () => {
    if (!newCorrection.trim()) return;
    const updated = [...corrections, { id: Date.now(), text: newCorrection, resolved: false, date: new Date().toISOString() }];
    setCorrections(updated);
    setNewCorrection('');
  };

  const handleToggleCorrection = (id) => {
    setCorrections(corrections.map(c => 
      c.id === id ? { ...c, resolved: !c.resolved } : c
    ));
  };

  const handleRemoveCorrection = (id) => {
    setCorrections(corrections.filter(c => c.id !== id));
  };

  // Open permit system website
  const openPermitSystem = () => {
    window.open(permitSystemUrl, '_blank');
  };

  // Download permit document (first permit document found)
  const downloadPermit = () => {
    const permitDoc = documents.find(d => d.file_url);
    if (permitDoc?.file_url) {
      window.open(permitDoc.file_url, '_blank');
    } else {
      showError('לא נמצא מסמך היתר להורדה');
    }
  };

  const handleNextSubStage = () => {
    if (currentSubStageIndex < PERMIT_SUBSTAGES.length - 1) {
      const nextSubStage = PERMIT_SUBSTAGES[currentSubStageIndex + 1];
      if (onSubStageChange) {
        onSubStageChange('permits', nextSubStage.id);
      }
    } else if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Skip Option */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sky-900">
                <FileCheck className="w-6 h-6" />
                שלב היתרים
                <Badge variant="outline" className="mr-2 bg-sky-100 text-sky-700 border-sky-300">
                  אופציונלי
                </Badge>
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSkipStage}
                className="text-slate-600 hover:text-slate-900 gap-2"
              >
                <SkipForward className="w-4 h-4" />
                דלג על שלב
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sky-800 mb-4">
              שלב זה רלוונטי לפרויקטים הדורשים היתר בנייה, היתר שיפוץ או אישורים מהרשות המקומית.
            </p>
            
            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-sky-700">התקדמות בשלב</span>
                <span className="font-medium text-sky-900">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Substages */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PERMIT_SUBSTAGES.map((substage, index) => {
                const Icon = substage.icon;
                const isActive = currentSubStage === substage.id;
                const isCompleted = index < currentSubStageIndex;

                return (
                  <div
                    key={substage.id}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-sky-100 border-sky-400 shadow-sm' 
                        : isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-slate-200 hover:border-sky-300'
                    }`}
                    onClick={() => onSubStageChange && onSubStageChange('permits', substage.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500 text-white' : isActive ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3 h-3" />}
                      </div>
                      <span className={`text-xs font-medium ${isActive ? 'text-sky-900' : 'text-slate-700'}`}>
                        {substage.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preparation Stage */}
      {currentSubStage === 'permit_preparation' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                הכנת מסמכים להיתר
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 text-sm">
                העלה את כל המסמכים הנדרשים להגשת בקשת ההיתר
              </p>

              {/* Required Documents Checklist */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-medium text-slate-900 mb-3">מסמכים נדרשים:</h4>
                <div className="space-y-2 text-sm">
                  {[
                    'תוכניות אדריכליות',
                    'תוכניות קונסטרוקציה',
                    'תוכניות חשמל',
                    'תוכניות אינסטלציה',
                    'חישובי יועצים',
                    'טופס 4 / בקשה להיתר',
                    'מפת מדידה',
                    'נסח טאבו',
                  ].map((doc, idx) => (
                    <label key={idx} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-slate-300" />
                      <span className="text-slate-700">{doc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label>הערות</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="הערות לגבי ההיתר..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setShowUploadDialog(true)}>
                  <Upload className="w-4 h-4" />
                  העלה מסמכים
                </Button>
                <Button onClick={handleSave} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700">
                  שמור והמשך
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Document Upload Dialog */}
      <DocumentUploadDialog
        isOpen={showUploadDialog}
        onClose={() => {
          setShowUploadDialog(false);
          queryClient.invalidateQueries({ queryKey: ['projectDocuments'] });
        }}
        project={project}
        presetCategory="permit"
        categoryLabel="מסמכי היתר"
      />

      {/* Submission Stage */}
      {currentSubStage === 'permit_submission' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                הגשה לוועדה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>תאריך הגשה</Label>
                  <Input
                    type="date"
                    value={submissionDate}
                    onChange={(e) => setSubmissionDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>תאריך צפוי לתשובה</Label>
                  <Input
                    type="date"
                    value={expectedResponseDate}
                    onChange={(e) => setExpectedResponseDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {submissionDate && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Calendar className="w-5 h-5" />
                    <span>הוגש בתאריך: {format(new Date(submissionDate), 'd בMMMM yyyy', { locale: he })}</span>
                  </div>
                  {expectedResponseDate && (
                    <div className="flex items-center gap-2 text-blue-600 mt-2">
                      <Clock className="w-5 h-5" />
                      <span>צפי לתשובה: {format(new Date(expectedResponseDate), 'd בMMMM yyyy', { locale: he })}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={openPermitSystem}>
                  <ExternalLink className="w-4 h-4" />
                  לינק למערכת רישוי
                </Button>
                <Button onClick={handleSave} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700">
                  שמור והמשך
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Review Stage */}
      {currentSubStage === 'permit_review' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                בחינה ותיקונים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600 text-sm">
                נהל את התיקונים וההערות שהתקבלו מהוועדה
              </p>

              {/* Corrections List */}
              <div className="space-y-2">
                {corrections.map((correction) => (
                  <div 
                    key={correction.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${
                      correction.resolved ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={correction.resolved}
                      onChange={() => handleToggleCorrection(correction.id)}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1">
                      <p className={correction.resolved ? 'line-through text-slate-500' : 'text-slate-800'}>
                        {correction.text}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {format(new Date(correction.date), 'd/M/yyyy')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCorrection(correction.id)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Correction */}
              <div className="flex gap-2">
                <Input
                  value={newCorrection}
                  onChange={(e) => setNewCorrection(e.target.value)}
                  placeholder="הוסף הערה/תיקון נדרש..."
                  className="flex-1"
                />
                <Button onClick={handleAddCorrection} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  הוסף
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700">
                  שמור והמשך
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Approval Stage */}
      {currentSubStage === 'permit_approval' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle2 className="w-5 h-5" />
                קבלת היתר
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>מספר היתר</Label>
                <Input
                  value={permitNumber}
                  onChange={(e) => setPermitNumber(e.target.value)}
                  placeholder="הזן מספר היתר..."
                  className="mt-1"
                />
              </div>

              {permitNumber && (
                <div className="bg-green-100 p-4 rounded-lg text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-green-900">היתר התקבל!</h3>
                  <p className="text-green-700">מספר היתר: {permitNumber}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={downloadPermit}>
                  <Download className="w-4 h-4" />
                  הורד היתר
                </Button>
                <Button 
                  onClick={() => {
                    handleSave();
                    if (onComplete) onComplete();
                  }} 
                  className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                >
                  סיים שלב
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => onSubStageChange && currentSubStageIndex > 0 && onSubStageChange('permits', PERMIT_SUBSTAGES[currentSubStageIndex - 1].id)}>
          <ChevronRight className="w-4 h-4" />
          הקודם
        </Button>
        <Button onClick={handleNextSubStage} className="bg-indigo-600 hover:bg-indigo-700">
          {currentSubStageIndex === PERMIT_SUBSTAGES.length - 1 ? 'סיים שלב' : 'הבא'}
          <ChevronRight className="w-4 h-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
}
