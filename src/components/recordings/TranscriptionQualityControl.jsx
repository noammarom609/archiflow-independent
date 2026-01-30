import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Flag,
  Loader2,
  Sparkles,
  Volume2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Lightbulb,
  Save
} from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';

const flagTypeLabels = {
  low_confidence: { label: 'ביטחון נמוך', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  unusual_phrasing: { label: 'ניסוח חריג', color: 'bg-amber-100 text-amber-800', icon: Flag },
  technical_term: { label: 'מונח מקצועי', color: 'bg-blue-100 text-blue-800', icon: BookOpen },
  unclear_audio: { label: 'אודיו לא ברור', color: 'bg-purple-100 text-purple-800', icon: Volume2 },
  hebrew_specific: { label: 'עברית ספציפית', color: 'bg-indigo-100 text-indigo-800', icon: Lightbulb }
};

const domainLabels = {
  architecture: 'אדריכלות',
  design: 'עיצוב',
  materials: 'חומרים',
  technical: 'טכני',
  client_communication: 'תקשורת לקוח',
  general: 'כללי'
};

export default function TranscriptionQualityControl({ recording, onTranscriptionUpdate }) {
  const queryClient = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [flaggedSegments, setFlaggedSegments] = useState([]);
  const [editingSegment, setEditingSegment] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [showAllSegments, setShowAllSegments] = useState(false);

  // Fetch existing corrections for this recording
  const { data: existingCorrections = [] } = useQuery({
    queryKey: ['transcriptionCorrections', recording?.id],
    queryFn: () => archiflow.entities.TranscriptionCorrection.filter({ 
      recording_id: recording?.id 
    }),
    enabled: !!recording?.id
  });

  // Fetch learned terms for context
  const { data: learnedTerms = [] } = useQuery({
    queryKey: ['learnedTerms'],
    queryFn: () => archiflow.entities.TranscriptionCorrection.filter({ 
      learned: true 
    }, '-created_date', 100)
  });

  // Create correction mutation
  const createCorrectionMutation = useMutation({
    mutationFn: (data) => archiflow.entities.TranscriptionCorrection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcriptionCorrections'] });
      showSuccess('התיקון נשמר בהצלחה');
    }
  });

  // Update correction mutation
  const updateCorrectionMutation = useMutation({
    mutationFn: ({ id, data }) => archiflow.entities.TranscriptionCorrection.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transcriptionCorrections'] });
    }
  });

  // Analyze transcription quality with AI
  const analyzeTranscription = async () => {
    if (!recording?.transcription) {
      showError('אין תמלול לניתוח');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Build context from learned terms
      const learnedContext = learnedTerms
        .filter(t => t.corrected_text)
        .map(t => `"${t.original_text}" -> "${t.corrected_text}"`)
        .slice(0, 50)
        .join('\n');

      const result = await archiflow.integrations.Core.InvokeLLM({
        prompt: `אתה מומחה לבקרת איכות תמלולים בעברית, במיוחד בתחום האדריכלות והעיצוב.

נתח את התמלול הבא וזהה קטעים בעייתיים:
1. קטעים עם ניסוח לא טבעי או משובש
2. מונחים מקצועיים שייתכן ותומללו לא נכון
3. שמות או מילים בעברית שנראים שגויים
4. קטעים עם הקשר לא ברור

${learnedContext ? `\nתיקונים קודמים ללמידה:\n${learnedContext}\n` : ''}

התמלול:
${recording.transcription}

החזר רשימה של קטעים בעייתיים עם הצעות לתיקון.`,
        response_json_schema: {
          type: 'object',
          properties: {
            quality_score: { type: 'number', description: 'ציון איכות כללי 0-100' },
            flagged_segments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  original_text: { type: 'string' },
                  suggested_correction: { type: 'string' },
                  flag_type: { type: 'string', enum: ['low_confidence', 'unusual_phrasing', 'technical_term', 'unclear_audio', 'hebrew_specific'] },
                  confidence_score: { type: 'number' },
                  domain_category: { type: 'string', enum: ['architecture', 'design', 'materials', 'technical', 'client_communication', 'general'] },
                  reason: { type: 'string' }
                }
              }
            },
            summary: { type: 'string' }
          }
        }
      });

      setFlaggedSegments(result.flagged_segments || []);
      
      // Save flagged segments as pending corrections
      for (const segment of (result.flagged_segments || [])) {
        // Check if already exists
        const exists = existingCorrections.some(
          c => c.original_text === segment.original_text
        );
        
        if (!exists) {
          await createCorrectionMutation.mutateAsync({
            recording_id: recording.id,
            original_text: segment.original_text,
            corrected_text: segment.suggested_correction,
            flag_type: segment.flag_type,
            confidence_score: segment.confidence_score,
            domain_category: segment.domain_category,
            is_verified: false,
            learned: false
          });
        }
      }

      showSuccess(`ניתוח הושלם - ${result.flagged_segments?.length || 0} קטעים דורשים בדיקה`);
    } catch (error) {
      console.error('Analysis error:', error);
      showError('שגיאה בניתוח התמלול');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Apply correction
  const applyCorrection = async (segment, correctedText, markAsLearned = false) => {
    try {
      // Find or create correction record
      const existingCorrection = existingCorrections.find(
        c => c.original_text === segment.original_text
      );

      if (existingCorrection) {
        await updateCorrectionMutation.mutateAsync({
          id: existingCorrection.id,
          data: {
            corrected_text: correctedText,
            is_verified: true,
            learned: markAsLearned
          }
        });
      } else {
        await createCorrectionMutation.mutateAsync({
          recording_id: recording.id,
          original_text: segment.original_text,
          corrected_text: correctedText,
          flag_type: segment.flag_type,
          confidence_score: segment.confidence_score,
          domain_category: segment.domain_category,
          is_verified: true,
          learned: markAsLearned
        });
      }

      // Also save to AILearning for broader context
      if (markAsLearned && correctedText !== segment.original_text) {
        try {
          await archiflow.entities.AILearning.create({
            learning_type: 'transcription_correction',
            original_value: segment.original_text,
            corrected_value: correctedText,
            category: segment.domain_category || 'general',
            field_name: 'transcription',
            source_recording_id: recording.id,
            context: recording.transcription?.slice(0, 200) || ''
          });
        } catch (e) {
          console.log('Could not save to AILearning:', e);
        }
      }

      // Update transcription text
      if (onTranscriptionUpdate && recording.transcription) {
        const updatedTranscription = recording.transcription.replace(
          segment.original_text,
          correctedText
        );
        onTranscriptionUpdate(updatedTranscription);
      }

      setEditingSegment(null);
      setEditedText('');
      
      // Remove from flagged list
      setFlaggedSegments(prev => 
        prev.filter(s => s.original_text !== segment.original_text)
      );

    } catch (error) {
      showError('שגיאה בשמירת התיקון');
    }
  };

  // Dismiss segment (mark as correct)
  const dismissSegment = async (segment) => {
    const existingCorrection = existingCorrections.find(
      c => c.original_text === segment.original_text
    );

    if (existingCorrection) {
      await updateCorrectionMutation.mutateAsync({
        id: existingCorrection.id,
        data: { is_verified: true, corrected_text: segment.original_text }
      });
    }

    setFlaggedSegments(prev => 
      prev.filter(s => s.original_text !== segment.original_text)
    );
  };

  const pendingCorrections = existingCorrections.filter(c => !c.is_verified);
  const verifiedCorrections = existingCorrections.filter(c => c.is_verified);
  const displaySegments = showAllSegments 
    ? [...flaggedSegments, ...pendingCorrections.map(c => ({
        original_text: c.original_text,
        suggested_correction: c.corrected_text,
        flag_type: c.flag_type,
        confidence_score: c.confidence_score,
        domain_category: c.domain_category,
        fromDb: true,
        id: c.id
      }))]
    : flaggedSegments.slice(0, 5);

  if (!recording?.transcription) {
    return null;
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-amber-500" />
            בקרת איכות תמלול
          </CardTitle>
          <div className="flex items-center gap-2">
            {verifiedCorrections.length > 0 && (
              <Badge className="bg-green-100 text-green-800">
                {verifiedCorrections.length} תיקונים מאומתים
              </Badge>
            )}
            <Button
              size="sm"
              onClick={analyzeTranscription}
              disabled={isAnalyzing}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מנתח...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  נתח איכות
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quality Overview */}
        {flaggedSegments.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-amber-800">
                נמצאו {flaggedSegments.length + pendingCorrections.length} קטעים לבדיקה
              </span>
              <Progress 
                value={verifiedCorrections.length / (verifiedCorrections.length + pendingCorrections.length + flaggedSegments.length) * 100} 
                className="w-32 h-2"
              />
            </div>
            <p className="text-sm text-amber-700">
              בדוק ותקן את הקטעים המסומנים לשיפור דיוק התמלול
            </p>
          </div>
        )}

        {/* Flagged Segments */}
        <AnimatePresence>
          {displaySegments.map((segment, index) => {
            const flagInfo = flagTypeLabels[segment.flag_type] || flagTypeLabels.low_confidence;
            const FlagIcon = flagInfo.icon;
            const isEditing = editingSegment === index;

            return (
              <motion.div
                key={segment.original_text + index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border border-slate-200 rounded-lg p-4 bg-white"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${flagInfo.color}`}>
                    <FlagIcon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={flagInfo.color}>{flagInfo.label}</Badge>
                      {segment.domain_category && (
                        <Badge variant="outline" className="text-xs">
                          {domainLabels[segment.domain_category]}
                        </Badge>
                      )}
                      {segment.confidence_score && (
                        <span className="text-xs text-slate-500">
                          ביטחון: {Math.round(segment.confidence_score * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Original Text */}
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                      <span className="text-xs text-red-600 font-medium">מקורי:</span>
                      <p className="text-sm text-red-900 mt-1" dir="rtl">
                        "{segment.original_text}"
                      </p>
                    </div>

                    {/* Suggested or Edited */}
                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editedText}
                          onChange={(e) => setEditedText(e.target.value)}
                          className="min-h-[60px] text-sm"
                          dir="rtl"
                          placeholder="הקלד את התיקון..."
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => applyCorrection(segment, editedText, false)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-3 h-3 ml-1" />
                            שמור
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => applyCorrection(segment, editedText, true)}
                            className="border-indigo-300 text-indigo-700"
                          >
                            <BookOpen className="w-3 h-3 ml-1" />
                            שמור ולמד
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingSegment(null);
                              setEditedText('');
                            }}
                          >
                            ביטול
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {segment.suggested_correction && (
                          <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                            <span className="text-xs text-green-600 font-medium">הצעה:</span>
                            <p className="text-sm text-green-900 mt-1" dir="rtl">
                              "{segment.suggested_correction}"
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingSegment(index);
                              setEditedText(segment.suggested_correction || segment.original_text);
                            }}
                          >
                            <Edit3 className="w-3 h-3 ml-1" />
                            ערוך
                          </Button>
                          {segment.suggested_correction && (
                            <Button
                              size="sm"
                              onClick={() => applyCorrection(segment, segment.suggested_correction, true)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-3 h-3 ml-1" />
                              אשר הצעה
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => dismissSegment(segment)}
                            className="text-slate-500"
                          >
                            התעלם
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Show More Toggle */}
        {(flaggedSegments.length + pendingCorrections.length) > 5 && (
          <Button
            variant="ghost"
            onClick={() => setShowAllSegments(!showAllSegments)}
            className="w-full"
          >
            {showAllSegments ? (
              <>
                <ChevronUp className="w-4 h-4 ml-2" />
                הצג פחות
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 ml-2" />
                הצג עוד {flaggedSegments.length + pendingCorrections.length - 5} קטעים
              </>
            )}
          </Button>
        )}

        {/* Empty State */}
        {displaySegments.length === 0 && !isAnalyzing && (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
            <p className="font-medium">לא נמצאו בעיות בתמלול</p>
            <p className="text-sm mt-1">לחץ על "נתח איכות" לבדיקה מחדש</p>
          </div>
        )}

        {/* Learned Terms Summary */}
        {learnedTerms.length > 0 && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
              <BookOpen className="w-4 h-4" />
              <span>{learnedTerms.length} מונחים נלמדו למערכת</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {learnedTerms.slice(0, 10).map((term, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {term.corrected_text}
                </Badge>
              ))}
              {learnedTerms.length > 10 && (
                <Badge variant="outline" className="text-xs">
                  +{learnedTerms.length - 10}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}