import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Upload, 
  FileText, 
  Brain, 
  Lightbulb,
  Share2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function ProcessingTimeline({ recording }) {
  // Define processing stages
  const stages = [
    {
      id: 'upload',
      name: 'העלאת קובץ',
      icon: Upload,
      status: recording.audio_url ? 'success' : 'pending',
      description: recording.audio_url ? 'קובץ הועלה בהצלחה' : 'ממתין להעלאה'
    },
    {
      id: 'transcription',
      name: 'תמלול',
      icon: FileText,
      status: getStageStatus('transcription', recording),
      description: getStageDescription('transcription', recording)
    },
    {
      id: 'basic_analysis',
      name: 'ניתוח בסיסי',
      icon: Brain,
      status: getStageStatus('basic_analysis', recording),
      description: getStageDescription('basic_analysis', recording)
    },
    {
      id: 'deep_analysis',
      name: 'ניתוח מעמיק',
      icon: Lightbulb,
      status: getStageStatus('deep_analysis', recording),
      description: getStageDescription('deep_analysis', recording)
    },
    {
      id: 'advanced_insights',
      name: 'תובנות מתקדמות',
      icon: Brain,
      status: getStageStatus('advanced_insights', recording),
      description: getStageDescription('advanced_insights', recording)
    },
    {
      id: 'distribution',
      name: 'פיזור נתונים',
      icon: Share2,
      status: getStageStatus('distribution', recording),
      description: getStageDescription('distribution', recording)
    }
  ];

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-600" />
          תהליך העיבוד
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isLast = index === stages.length - 1;

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Connector Line */}
                {!isLast && (
                  <div className="absolute right-[19px] top-10 w-0.5 h-8 bg-slate-200" />
                )}

                {/* Stage Row */}
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        ${stage.status === 'success' ? 'bg-green-100 text-green-600' :
                          stage.status === 'failed' ? 'bg-red-100 text-red-600' :
                          stage.status === 'processing' ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-100 text-slate-400'}
                      `}
                    >
                      {stage.status === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : stage.status === 'failed' ? (
                        <XCircle className="w-5 h-5" />
                      ) : stage.status === 'processing' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Stage Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-slate-900">{stage.name}</h4>
                      <Badge
                        className={
                          stage.status === 'success' ? 'bg-green-100 text-green-800' :
                          stage.status === 'failed' ? 'bg-red-100 text-red-800' :
                          stage.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-600'
                        }
                      >
                        {stage.status === 'success' ? 'הושלם' :
                         stage.status === 'failed' ? 'נכשל' :
                         stage.status === 'processing' ? 'מעבד' :
                         'ממתין'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">{stage.description}</p>

                    {/* Error Details */}
                    {stage.status === 'failed' && recording.error_step === stage.id && recording.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{recording.error_message}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Overall Status Summary */}
        <div className="mt-6 pt-4 border-t border-slate-200">
          {recording.status === 'distributed' ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                העיבוד הושלם בהצלחה והנתונים פוזרו למערכת
              </span>
            </div>
          ) : recording.status === 'analyzed' ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                ההקלטה נותחה - ממתין לאישור ופיזור נתונים
              </span>
            </div>
          ) : recording.status === 'processing' ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-blue-900">
                עיבוד בתהליך... אנא המתן
              </span>
            </div>
          ) : recording.status === 'failed' ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                העיבוד נכשל בשלב: {getStageNameInHebrew(recording.error_step)}
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper functions
function getStageStatus(stage, recording) {
  // Processing state
  if (recording.status === 'processing') {
    if (stage === 'upload') return 'success';
    if (stage === 'transcription') return 'processing';
    return 'pending';
  }

  // Failed state
  if (recording.status === 'failed') {
    if (recording.error_step === stage) return 'failed';
    if (stage === 'upload') return 'success';
    
    const stageOrder = ['transcription', 'basic_analysis', 'deep_analysis', 'advanced_insights', 'distribution'];
    const currentIndex = stageOrder.indexOf(stage);
    const errorIndex = stageOrder.indexOf(recording.error_step);
    
    if (currentIndex < errorIndex) return 'success';
    if (currentIndex > errorIndex) return 'pending';
    return 'failed';
  }

  // Success states
  if (stage === 'upload' && recording.audio_url) return 'success';
  if (stage === 'transcription' && recording.transcription) return 'success';
  if (stage === 'basic_analysis' && recording.analysis) return 'success';
  if (stage === 'deep_analysis' && recording.deep_analysis) return 'success';
  if (stage === 'advanced_insights' && recording.advanced_insights) return 'success';
  if (stage === 'distribution' && recording.status === 'distributed') return 'success';

  // Analyzed but not distributed
  if (recording.status === 'analyzed') {
    if (stage === 'upload') return 'success';
    if (stage === 'transcription') return 'success';
    if (stage === 'basic_analysis') return 'success';
    if (stage === 'deep_analysis') return recording.deep_analysis ? 'success' : 'failed';
    if (stage === 'advanced_insights') {
      // Check if it failed or was skipped
      if (recording.error_step === 'advanced_insights') return 'failed';
      return recording.advanced_insights ? 'success' : 'pending';
    }
    if (stage === 'distribution') return 'pending';
  }

  return 'pending';
}

function getStageDescription(stage, recording) {
  const status = getStageStatus(stage, recording);

  if (status === 'processing') {
    return 'מעבד כעת...';
  }

  if (status === 'pending') {
    return 'ממתין להשלמת שלבים קודמים';
  }

  if (status === 'failed') {
    return recording.error_step === stage && recording.error_message 
      ? recording.error_message 
      : 'השלב נכשל';
  }

  // Success descriptions
  switch (stage) {
    case 'transcription':
      const transcriptionLength = recording.transcription?.length || 0;
      return `תמלול הושלם (${transcriptionLength.toLocaleString()} תווים)`;
    
    case 'basic_analysis':
      const taskCount = recording.analysis?.tasks?.length || 0;
      const decisionCount = recording.analysis?.decisions?.length || 0;
      return `זוהו ${taskCount} משימות, ${decisionCount} החלטות`;
    
    case 'deep_analysis':
      const peopleCount = recording.deep_analysis?.people_mentioned?.length || 0;
      const projectsCount = recording.deep_analysis?.projects_identified?.length || 0;
      return `זוהו ${peopleCount} אנשים, ${projectsCount} פרויקטים`;
    
    case 'advanced_insights':
      const topicsCount = recording.advanced_insights?.topics_detailed?.length || 0;
      const risksCount = recording.advanced_insights?.risks_identified?.length || 0;
      return `זוהו ${topicsCount} נושאים, ${risksCount} סיכונים`;
    
    case 'distribution':
      const logCount = recording.distribution_log?.length || 0;
      return `בוצעו ${logCount} פעולות במערכת`;
    
    default:
      return 'הושלם בהצלחה';
  }
}

function getStageNameInHebrew(stageId) {
  const names = {
    upload: 'העלאת קובץ',
    transcription: 'תמלול',
    basic_analysis: 'ניתוח בסיסי',
    deep_analysis: 'ניתוח מעמיק',
    advanced_insights: 'תובנות מתקדמות',
    distribution: 'פיזור נתונים'
  };
  return names[stageId] || stageId;
}