import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Briefcase,
  FileText,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import ApprovalPreview from './ApprovalPreview';
import AISummaryCard from './AISummaryCard';
import AdvancedInsights from './AdvancedInsights';
import ExecutiveSummary from './ExecutiveSummary';
import TranscriptionQualityControl from './TranscriptionQualityControl';
import DataExtractionPanel from './DataExtractionPanel';

export default function AnalysisResults({ state, onApprove, recording, onRecordingUpdate, project, client }) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [useNewPanel, setUseNewPanel] = useState(true); // Use new DataExtractionPanel

  // Handle transcription update from quality control
  const handleTranscriptionUpdate = async (newTranscription) => {
    if (onRecordingUpdate && recording?.id) {
      await onRecordingUpdate(recording.id, { 
        transcription: newTranscription,
        analysis: {
          ...recording.analysis,
          transcription: newTranscription
        }
      });
    }
  };
  // State: 'empty' | 'processing' | 'results'

  if (state === 'empty') {
    return (
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white h-full">
        <CardContent className="flex flex-col items-center justify-center h-full py-20">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6"
          >
            <Sparkles className="w-12 h-12 text-indigo-600" />
          </motion.div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">ממתין להקלטה...</h3>
          <p className="text-slate-600 text-center max-w-md">
            ה-AI מוכן להקשיב ולחלץ תובנות מהפגישה שלך
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state === 'processing') {
    return (
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 h-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 animate-pulse" />
        <CardContent className="flex flex-col items-center justify-center h-full py-20 relative z-10">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="w-24 h-24 border-8 border-indigo-200 border-t-indigo-600 rounded-full mb-6"
            />
            <h3 className="text-2xl font-bold text-slate-900 mb-4">ה-AI מנתח את השיחה...</h3>
            <div className="space-y-2 text-center">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-slate-700 flex items-center gap-2 justify-center"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                מתמלל את ההקלטה
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="text-slate-700 flex items-center gap-2 justify-center"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                מזהה משימות ופעולות
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="text-slate-700 flex items-center gap-2 justify-center"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                מנתח בעומק
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2 }}
                className="text-center mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
              >
                <p className="text-sm text-blue-800 font-medium mb-1">
                  ⏱️ עיבוד הקלטות ארוכות
                </p>
                <p className="text-xs text-blue-600">
                  המערכת תומכת בעד 2 שעות הקלטה (100MB)
                </p>
                <p className="text-xs text-blue-600">
                  זמן עיבוד: 5-15 דקות תלוי באורך
                </p>
              </motion.div>
            </div>
          </CardContent>
      </Card>
    );
  }

  // Results state
  const analysis = recording?.analysis || {};
  
  return (
    <Card className="border-slate-200 bg-white h-full overflow-y-auto">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-l from-indigo-50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">תוצאות הניתוח</CardTitle>
            <p className="text-sm text-slate-600 mt-1">ה-AI חילץ את המידע הבא מההקלטה</p>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-lg text-slate-900">תמלול</h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 max-h-40 overflow-y-auto">
              <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                {recording?.transcription || analysis.transcription}
              </p>
            </div>
          </motion.div>
        )}

        {/* Transcription Quality Control */}
        {(recording?.transcription || analysis.transcription) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <TranscriptionQualityControl 
              recording={{
                ...recording,
                transcription: recording?.transcription || analysis.transcription
              }}
              onTranscriptionUpdate={handleTranscriptionUpdate}
            />
          </motion.div>
        )}

        {/* Summary */}
        {analysis.summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-lg text-slate-900">סיכום</h3>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-slate-700 leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          </motion.div>
        )}

        {/* Tasks */}
        {analysis.tasks && analysis.tasks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-lg text-slate-900">משימות שזוהו</h3>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <ul className="space-y-2">
                {analysis.tasks.map((task, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Decisions */}
        {analysis.decisions && analysis.decisions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-lg text-slate-900">החלטות</h3>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <ul className="space-y-2">
                {analysis.decisions.map((decision, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>{decision}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {/* Topics */}
        {analysis.topics && analysis.topics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-lg text-slate-900">נושאים</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.topics.map((topic, idx) => (
                <Badge key={idx} className="bg-blue-100 text-blue-800">
                  {topic}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={() => setShowApprovalDialog(true)}
            className="w-full bg-gradient-to-l from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-14 text-lg"
          >
            <ArrowRight className="w-5 h-5 ml-2" />
            המשך לפיזור נתונים
          </Button>
        </motion.div>

        {/* Approval Dialog - Enhanced Data Extraction Panel */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
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
                onApprove={(data) => {
                  setShowApprovalDialog(false);
                  onApprove(data);
                }}
                onCancel={() => setShowApprovalDialog(false)}
              />
            ) : (
              <ApprovalPreview
                recording={recording}
                onApprove={(data) => {
                  setShowApprovalDialog(false);
                  onApprove(data);
                }}
                onCancel={() => setShowApprovalDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}