import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sparkles,
  CheckCircle2,
  Briefcase,
  FileText,
  TrendingUp,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import ApprovalPreview from './ApprovalPreview';
import AISummaryCard from './AISummaryCard';
import AdvancedInsights from './AdvancedInsights';
import ExecutiveSummary from './ExecutiveSummary';
import TranscriptionQualityControl from './TranscriptionQualityControl';
import DataExtractionPanel from './DataExtractionPanel';

export default function AnalysisResults({ state, onApprove, recording, onRecordingUpdate, project, client }) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [useNewPanel, setUseNewPanel] = useState(true);

  const handleTranscriptionUpdate = async (newTranscription) => {
    if (onRecordingUpdate && recording?.id) {
      await onRecordingUpdate(recording.id, {
        transcription: newTranscription,
        analysis: { ...recording.analysis, transcription: newTranscription },
      });
    }
  };

  // ── Empty state ──
  if (state === 'empty') {
    return (
      <Card className="h-full">
        <CardContent className="flex flex-col items-center justify-center h-full py-20">
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">ממתין להקלטה...</h3>
          <p className="text-muted-foreground text-center max-w-md">
            ה-AI מוכן להקשיב ולחלץ תובנות מהפגישה שלך
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Processing state ──
  if (state === 'processing') {
    return (
      <Card className="h-full relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 animate-pulse" />
        <CardContent className="flex flex-col items-center justify-center h-full py-20 relative z-10">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
          <h3 className="text-xl font-bold text-foreground mb-4">ה-AI מנתח את השיחה...</h3>
          <div className="space-y-3 text-center">
            <p className="text-foreground flex items-center gap-2 justify-center text-sm">
              <CheckCircle2 className="w-4 h-4 text-success" />
              מתמלל את ההקלטה
            </p>
            <p className="text-foreground flex items-center gap-2 justify-center text-sm">
              <CheckCircle2 className="w-4 h-4 text-success" />
              מזהה משימות ופעולות
            </p>
            <p className="text-foreground flex items-center gap-2 justify-center text-sm">
              <CheckCircle2 className="w-4 h-4 text-success" />
              מנתח בעומק
            </p>
            <div className="mt-6 p-4 bg-info/10 rounded-xl border border-info/20">
              <p className="text-sm text-info font-medium mb-1">
                ⏱️ עיבוד הקלטות ארוכות
              </p>
              <p className="text-xs text-muted-foreground">
                המערכת תומכת בעד 2 שעות הקלטה (100MB)
              </p>
              <p className="text-xs text-muted-foreground">
                זמן עיבוד: 5-15 דקות תלוי באורך
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Results state ──
  const analysis = recording?.analysis || {};

  return (
    <Card className="h-full overflow-y-auto">
      <CardHeader className="border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl">תוצאות הניתוח</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">ה-AI חילץ את המידע הבא מההקלטה</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Executive Summary */}
        <ExecutiveSummary recording={recording} />

        {/* Advanced Insights */}
        <AdvancedInsights recording={recording} />

        {/* Transcription */}
        {analysis.transcription && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">תמלול</h3>
            </div>
            <div className="p-4 bg-muted/50 rounded-xl border border-border max-h-40 overflow-y-auto">
              <p className="text-foreground/80 leading-relaxed text-sm whitespace-pre-wrap">
                {recording?.transcription || analysis.transcription}
              </p>
            </div>
          </div>
        )}

        {/* Transcription Quality Control */}
        {(recording?.transcription || analysis.transcription) && (
          <TranscriptionQualityControl
            recording={{ ...recording, transcription: recording?.transcription || analysis.transcription }}
            onTranscriptionUpdate={handleTranscriptionUpdate}
          />
        )}

        {/* Summary */}
        {analysis.summary && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">סיכום</h3>
            </div>
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-foreground leading-relaxed">{analysis.summary}</p>
            </div>
          </div>
        )}

        {/* Tasks */}
        {analysis.tasks && analysis.tasks.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-5 h-5 text-success" />
              <h3 className="font-bold text-lg text-foreground">משימות שזוהו</h3>
            </div>
            <div className="p-4 bg-success/5 rounded-xl border border-success/20">
              <ul className="space-y-2">
                {analysis.tasks.map((task, idx) => (
                  <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-success mt-1">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Decisions */}
        {analysis.decisions && analysis.decisions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-secondary" />
              <h3 className="font-bold text-lg text-foreground">החלטות</h3>
            </div>
            <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/20">
              <ul className="space-y-2">
                {analysis.decisions.map((decision, idx) => (
                  <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-secondary mt-1">•</span>
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Topics */}
        {analysis.topics && analysis.topics.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-info" />
              <h3 className="font-bold text-lg text-foreground">נושאים</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.topics.map((topic, idx) => (
                <Badge key={idx} variant="outline">{topic}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={() => setShowApprovalDialog(true)}
          className="w-full h-14 text-lg"
        >
          <ArrowRight className="w-5 h-5 ml-2" />
          המשך לפיזור נתונים
        </Button>

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                חילוץ והטמעת נתונים
              </DialogTitle>
            </DialogHeader>
            {useNewPanel ? (
              <DataExtractionPanel
                recording={recording}
                analysis={recording?.analysis}
                deepAnalysis={recording?.deep_analysis}
                project={project}
                client={client}
                onApprove={(data) => { setShowApprovalDialog(false); onApprove(data); }}
                onCancel={() => setShowApprovalDialog(false)}
              />
            ) : (
              <ApprovalPreview
                recording={recording}
                onApprove={(data) => { setShowApprovalDialog(false); onApprove(data); }}
                onCancel={() => setShowApprovalDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
