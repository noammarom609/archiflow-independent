import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
// Toaster moved to App.jsx for global fixed positioning
import RecordingControls from '../components/recordings/RecordingControls';
import AnalysisResults from '../components/recordings/AnalysisResults';
import RecordingsGrid from '../components/recordings/RecordingsGrid';
import LargeAudioProcessor from '../components/audio/LargeAudioProcessor';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '../components/utils/notifications';
import PageHeader from '../components/layout/PageHeader';

const LARGE_FILE_THRESHOLD_MB = 24; // Files above this will use chunked processing

export default function Recordings() {
  const [analysisState, setAnalysisState] = useState('empty'); // 'empty' | 'processing' | 'results'
  const [currentRecording, setCurrentRecording] = useState(null);
  const [largeFileProcessing, setLargeFileProcessing] = useState(null); // { file, duration } for large files
  const queryClient = useQueryClient();

  const createRecordingMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Recording.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
    },
  });

  const handleRecordingComplete = async (audioFile, duration) => {
    console.log('🎙️ Starting recording processing...', { 
      fileName: audioFile.name, 
      fileSize: audioFile.size, 
      fileType: audioFile.type,
      duration 
    });
    
    const fileSizeMB = audioFile.size / 1024 / 1024;
    
    // Route large files to chunked processing
    if (fileSizeMB > LARGE_FILE_THRESHOLD_MB) {
      console.log(`📦 Large file detected (${fileSizeMB.toFixed(1)}MB > ${LARGE_FILE_THRESHOLD_MB}MB) - using chunked processing`);
      setLargeFileProcessing({ file: audioFile, duration });
      setAnalysisState('processing');
      return;
    }
    
    // Standard processing for small files
    setAnalysisState('processing');
    
    let initialRecording = null;
    let file_url = null;
    
    try {
      // Step 1: Upload audio file
      console.log('📤 Step 1/6: Uploading audio file...');
      console.log(`   File size: ${fileSizeMB.toFixed(2)} MB`);
      
      try {
        const uploadResult = await archiflow.integrations.Core.UploadFile({ file: audioFile });
        console.log('✅ Upload successful:', uploadResult);
        file_url = uploadResult.file_url;
      } catch (uploadError) {
        console.error('❌ Upload failed:', uploadError);
        showError(`שגיאה בהעלאת הקובץ: ${uploadError.message || 'נסה שוב'}`);
        setAnalysisState('empty');
        return;
      }
      
      // Step 2: Save recording to database
      console.log('💾 Step 2/6: Saving recording to database...');
      try {
        initialRecording = await createRecordingMutation.mutateAsync({
          title: `הקלטה ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`,
          audio_url: file_url,
          duration: duration,
          status: 'processing',
          transcription: '',
          analysis: null,
        });
        console.log('✅ Recording saved:', initialRecording.id);
      } catch (saveError) {
        console.error('❌ Save failed:', saveError);
        showError('שגיאה בשמירת ההקלטה במערכת.');
        setAnalysisState('empty');
        return;
      }

      // Step 3: Transcribe audio (small files only - under 24MB)
      console.log('🎙️ Step 3/6: Transcribing audio...');
      console.log(`   File URL: ${file_url}`);
      console.log(`   File size: ${fileSizeMB.toFixed(2)}MB`);
      let transcription = '';

      try {
        const transcribeResult = await archiflow.functions.invoke('transcribeLargeAudio', { audio_url: file_url });

        console.log('📦 Transcribe result:', transcribeResult);
        console.log('📝 Transcription data:', transcribeResult.data);

        if (!transcribeResult.data || transcribeResult.data.success === false) {
          throw new Error(transcribeResult.data?.error || 'התמלול נכשל ללא הסבר');
        }

        transcription = transcribeResult.data?.transcription || '';

        if (!transcription || transcription.trim().length === 0) {
          console.warn('⚠️ Empty transcription received');
          transcription = 'לא זוהה דיבור בהקלטה';
        }

        console.log(`✅ Transcription completed: ${transcription.length} chars`);

        if (transcribeResult.data?.is_partial) {
          showSuccess('⚠️ קובץ גדול - נוצר תמלול חלקי');
        }

      } catch (transcribeError) {
        console.error('❌ Transcription failed:', transcribeError);
        console.error('❌ Error details:', {
          message: transcribeError.message,
          stack: transcribeError.stack,
          response: transcribeError.response
        });

        let errorMsg = 'שגיאה בתמלול';
        if (transcribeError.message === 'TIMEOUT') {
          errorMsg = 'תמלול ארך יותר מדי (15+ דקות). הקובץ ארוך מדי.';
        } else if (transcribeError.message?.includes('Timeout') || transcribeError.message?.includes('timeout')) {
          errorMsg = 'תמלול ארך יותר מדי. נסה קובץ קצר יותר.';
        } else if (transcribeError.message) {
          errorMsg = `שגיאת תמלול: ${transcribeError.message}`;
        }

        // Update recording with error
        await archiflow.entities.Recording.update(initialRecording.id, {
          status: 'failed',
          error_message: errorMsg,
          error_step: 'transcription',
          transcription: `שגיאה: ${errorMsg}`
        });

        showError(errorMsg);
        queryClient.invalidateQueries({ queryKey: ['recordings'] });
        setAnalysisState('empty');
        return;
      }

      // Steps 4-6: Run ALL analyses in PARALLEL for better performance
      console.log('🚀 Steps 4-6/6: Running parallel analysis (Basic + Deep + Advanced)...');
      showSuccess('✅ תמלול הושלם! מפעיל 3 ניתוחים במקביל...');
      
      let analysis = {};
      let deepAnalysis = {};
      let advancedInsights = {};
      
      try {
        // Define all prompts
        const basicPrompt = `נא לנתח את התמלול הבא של פגישה ולחלץ מידע בסיסי:

תמלול: "${transcription}"

חלץ:
1. סיכום קצר (2-3 משפטים)
2. משימות שהוזכרו
3. החלטות שהתקבלו
4. תאריכים או דדליינים
5. נושאים מרכזיים

החזר JSON מובנה בעברית.`;

        const deepPrompt = `בצע ניתוח מעמיק של התמלול הבא:

תמלול: "${transcription}"

חלץ בדיוק:
1. אנשים שהוזכרו (שם, תפקיד משוער)
2. פרויקטים שהוזכרו (שמות ספציפיים)
3. סכומים כספיים (סכום בשקלים והקשר)
4. ניתוח רגשי (טון כללי: positive/neutral/negative, ציון 0-1, רגשות מרכזיים)
5. action items מפורטים (משימה, אחראי, דדליין, עדיפות: low/medium/high/urgent)

החזר JSON מובנה מדויק.`;

        const advancedPrompt = `בצע ניתוח מתקדם של התמלול הבא והפק תובנות מפורטות:

תמלול: "${transcription}"

חלץ בדיוק:

1. נושאים מפורטים (topics_detailed):
   - זהה 3-5 נושאים מרכזיים שנדונו
   - לכל נושא: שם, קטגוריה (טכני/עסקי/תקציבי/תכנוני/אחר), ציון ביטחון (0-1), מספר אזכורים, נקודות מפתח

2. סיכונים מזוהים (risks_identified):
   - זהה סיכונים פוטנציאליים: עיכובים, חריגות תקציב, בעיות טכניות, בעיות תקשורת
   - לכל סיכון: סוג, חומרה (low/medium/high), תיאור, ציון ביטחון, המלצה

3. נושאי תאימות (compliance_issues):
   - זהה בעיות רגולציה, בטיחות, חוזים, תקינה
   - לכל נושא: סוג, תיאור, ציון ביטחון, פעולה נדרשת

4. שאלות המשך (follow_up_questions):
   - צור 3-5 שאלות חכמות להמשך דיון
   - לכל שאלה: השאלה, קטגוריה, עדיפות (low/medium/high), הסבר קצר למה חשוב

החזר JSON מובנה.`;

        // Run all 3 analyses in PARALLEL with Promise.allSettled
        const [basicResult, deepResult, advancedResult] = await Promise.allSettled([
          // Basic Analysis
          archiflow.integrations.Core.InvokeLLM({
            prompt: basicPrompt,
            response_json_schema: {
              type: 'object',
              properties: {
                summary: { type: 'string' },
                tasks: { type: 'array', items: { type: 'string' } },
                decisions: { type: 'array', items: { type: 'string' } },
                dates: { type: 'array', items: { type: 'string' } },
                topics: { type: 'array', items: { type: 'string' } },
              },
              required: ['summary']
            },
          }),
          
          // Deep Analysis
          archiflow.integrations.Core.InvokeLLM({
            prompt: deepPrompt,
            response_json_schema: {
              type: 'object',
              properties: {
                people_mentioned: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      role: { type: 'string' }
                    }
                  }
                },
                projects_identified: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      project_name: { type: 'string' },
                      confidence: { type: 'number' }
                    }
                  }
                },
                financial_data: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      amount: { type: 'number' },
                      currency: { type: 'string' },
                      context: { type: 'string' }
                    }
                  }
                },
                sentiment: {
                  type: 'object',
                  properties: {
                    overall: { type: 'string' },
                    score: { type: 'number' },
                    key_emotions: { type: 'array', items: { type: 'string' } }
                  }
                },
                action_items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      task: { type: 'string' },
                      assignee: { type: 'string' },
                      deadline: { type: 'string' },
                      priority: { type: 'string' }
                    }
                  }
                }
              }
            },
          }),
          
          // Advanced Insights
          Promise.race([
            archiflow.integrations.Core.InvokeLLM({
              prompt: advancedPrompt,
              response_json_schema: {
                type: 'object',
                properties: {
                  topics_detailed: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        topic: { type: 'string' },
                        category: { type: 'string' },
                        confidence: { type: 'number' },
                        mentions: { type: 'number' },
                        key_points: { type: 'array', items: { type: 'string' } }
                      }
                    }
                  },
                  risks_identified: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        risk_type: { type: 'string' },
                        severity: { type: 'string' },
                        description: { type: 'string' },
                        confidence: { type: 'number' },
                        recommendation: { type: 'string' }
                      }
                    }
                  },
                  compliance_issues: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        issue_type: { type: 'string' },
                        description: { type: 'string' },
                        confidence: { type: 'number' },
                        action_required: { type: 'string' }
                      }
                    }
                  },
                  follow_up_questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string' },
                        category: { type: 'string' },
                        priority: { type: 'string' },
                        rationale: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('ADVANCED_TIMEOUT')), 120000)
            )
          ])
        ]);

        // Process results
        if (basicResult.status === 'fulfilled') {
          analysis = basicResult.value;
          analysis.transcription = transcription;
          console.log('✅ Basic analysis completed');
        } else {
          console.error('❌ Basic analysis failed:', basicResult.reason);
          throw new Error('ניתוח בסיסי נכשל: ' + basicResult.reason?.message);
        }

        if (deepResult.status === 'fulfilled') {
          deepAnalysis = deepResult.value;
          console.log('✅ Deep analysis completed');
        } else {
          console.error('⚠️ Deep analysis failed:', deepResult.reason);
        }

        if (advancedResult.status === 'fulfilled') {
          advancedInsights = advancedResult.value;
          console.log('✅ Advanced insights completed');
        } else {
          console.error('⚠️ Advanced insights failed:', advancedResult.reason);
        }

        showSuccess('✅ כל הניתוחים הושלמו!');
        
      } catch (analysisError) {
        console.error('❌ Analysis failed:', analysisError);
        
        await archiflow.entities.Recording.update(initialRecording.id, {
          transcription: transcription,
          status: 'failed',
          error_message: 'שגיאה בניתוח: ' + analysisError.message,
          error_step: 'basic_analysis',
        });
        
        showError('שגיאה בניתוח. התמלול נשמר.');
        setAnalysisState('empty');
        return;
      }

        // Step 7: Save complete analysis
      console.log('💾 Saving complete analysis...');
      await archiflow.entities.Recording.update(initialRecording.id, {
        transcription: transcription,
        analysis: analysis,
        deep_analysis: deepAnalysis,
        advanced_insights: advancedInsights,
        status: 'analyzed',
      });

      const finalRecording = {
        ...initialRecording,
        transcription: transcription,
        analysis: analysis,
        deep_analysis: deepAnalysis,
        advanced_insights: advancedInsights,
        status: 'analyzed',
      };
      
      setCurrentRecording(finalRecording);
      setAnalysisState('results');
      showSuccess('✅ ההקלטה נותחה בהצלחה במלואה!');
      console.log('🎉 Recording process completed successfully!');
      
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      
      // Update recording if it exists
      if (initialRecording?.id) {
        try {
          await archiflow.entities.Recording.update(initialRecording.id, {
            status: 'failed',
            error_message: 'שגיאה כללית: ' + error.message,
            error_step: 'unknown',
          });
        } catch (updateError) {
          console.error('Failed to update recording with error:', updateError);
        }
      }
      
      showError('שגיאה בלתי צפויה: ' + error.message);
      setAnalysisState('empty');
    }
  };

  // Handler for large file chunked processing completion
  const handleLargeFileComplete = async (result) => {
    console.log('🎉 Large file processing complete:', result);
    const file = largeFileProcessing?.file;
    const duration = largeFileProcessing?.duration || '00:00';
    setLargeFileProcessing(null);
    
    // Upload the original file to get audio_url for the recording
    let audio_url = '';
    try {
      console.log('📤 Uploading original file for reference...');
      const uploadResult = await archiflow.integrations.Core.UploadFile({ file });
      audio_url = uploadResult.file_url;
      console.log('✅ Original file uploaded:', audio_url);
    } catch (uploadErr) {
      console.warn('⚠️ Could not upload original file:', uploadErr.message);
    }
    
    // Now run analysis on the combined transcription
    await processTranscription(result.transcription, duration, audio_url);
  };

  const handleLargeFileError = (error) => {
    console.error('❌ Large file processing failed:', error);
    showError(`שגיאה בעיבוד קובץ גדול: ${error}`);
    setLargeFileProcessing(null);
    setAnalysisState('empty');
  };

  const handleLargeFileCancel = () => {
    console.log('🚫 Large file processing cancelled');
    setLargeFileProcessing(null);
    setAnalysisState('empty');
  };

  // Shared function to process transcription and run AI analysis
  const processTranscription = async (transcription, duration, audio_url = '') => {
    let initialRecording = null;
    
    try {
      // Save recording to database with transcription already included
      console.log('💾 Saving recording to database with transcription...');
      console.log(`   Transcription length: ${transcription?.length || 0} chars`);
      
      initialRecording = await createRecordingMutation.mutateAsync({
        title: `הקלטה ${new Date().toLocaleDateString('he-IL')} ${new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`,
        audio_url: audio_url,
        duration: duration,
        status: 'processing',
        transcription: transcription, // Save transcription immediately
        analysis: null,
      });
      console.log('✅ Recording saved with transcription:', initialRecording.id);

      // Run parallel analysis
      console.log('🚀 Running parallel analysis...');
      showSuccess('✅ תמלול הושלם! מפעיל ניתוח AI...');
      
      const { analysis, deepAnalysis, advancedInsights } = await runParallelAnalysis(transcription);

      // Save complete analysis
      console.log('💾 Saving complete analysis...');
      await archiflow.entities.Recording.update(initialRecording.id, {
        analysis: analysis,
        deep_analysis: deepAnalysis,
        advanced_insights: advancedInsights,
        status: 'analyzed',
      });

      const finalRecording = {
        ...initialRecording,
        transcription: transcription,
        analysis: analysis,
        deep_analysis: deepAnalysis,
        advanced_insights: advancedInsights,
        status: 'analyzed',
      };
      
      setCurrentRecording(finalRecording);
      setAnalysisState('results');
      showSuccess('✅ ההקלטה נותחה בהצלחה!');
      
    } catch (error) {
      console.error('❌ Analysis error:', error);
      if (initialRecording?.id) {
        await archiflow.entities.Recording.update(initialRecording.id, {
          status: 'failed',
          error_message: error.message,
        });
      }
      showError('שגיאה בניתוח: ' + error.message);
      setAnalysisState('empty');
    }
  };

  // Extracted parallel analysis logic
  const runParallelAnalysis = async (transcription) => {
    const basicPrompt = `נא לנתח את התמלול הבא של פגישה ולחלץ מידע בסיסי:

תמלול: "${transcription}"

חלץ:
1. סיכום קצר (2-3 משפטים)
2. משימות שהוזכרו
3. החלטות שהתקבלו
4. תאריכים או דדליינים
5. נושאים מרכזיים

החזר JSON מובנה בעברית.`;

    const deepPrompt = `בצע ניתוח מעמיק של התמלול הבא:

תמלול: "${transcription}"

חלץ בדיוק:
1. אנשים שהוזכרו (שם, תפקיד משוער)
2. פרויקטים שהוזכרו (שמות ספציפיים)
3. סכומים כספיים (סכום בשקלים והקשר)
4. ניתוח רגשי (טון כללי: positive/neutral/negative, ציון 0-1, רגשות מרכזיים)
5. action items מפורטים (משימה, אחראי, דדליין, עדיפות: low/medium/high/urgent)

החזר JSON מובנה מדויק.`;

    const advancedPrompt = `בצע ניתוח מתקדם של התמלול הבא והפק תובנות מפורטות:

תמלול: "${transcription}"

חלץ בדיוק:

1. נושאים מפורטים (topics_detailed):
   - זהה 3-5 נושאים מרכזיים שנדונו
   - לכל נושא: שם, קטגוריה (טכני/עסקי/תקציבי/תכנוני/אחר), ציון ביטחון (0-1), מספר אזכורים, נקודות מפתח

2. סיכונים מזוהים (risks_identified):
   - זהה סיכונים פוטנציאליים: עיכובים, חריגות תקציב, בעיות טכניות, בעיות תקשורת
   - לכל סיכון: סוג, חומרה (low/medium/high), תיאור, ציון ביטחון, המלצה

3. נושאי תאימות (compliance_issues):
   - זהה בעיות רגולציה, בטיחות, חוזים, תקינה
   - לכל נושא: סוג, תיאור, ציון ביטחון, פעולה נדרשת

4. שאלות המשך (follow_up_questions):
   - צור 3-5 שאלות חכמות להמשך דיון
   - לכל שאלה: השאלה, קטגוריה, עדיפות (low/medium/high), הסבר קצר למה חשוב

החזר JSON מובנה.`;

    const [basicResult, deepResult, advancedResult] = await Promise.allSettled([
      archiflow.integrations.Core.InvokeLLM({
        prompt: basicPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            tasks: { type: 'array', items: { type: 'string' } },
            decisions: { type: 'array', items: { type: 'string' } },
            dates: { type: 'array', items: { type: 'string' } },
            topics: { type: 'array', items: { type: 'string' } },
          },
          required: ['summary']
        },
      }),
      archiflow.integrations.Core.InvokeLLM({
        prompt: deepPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            people_mentioned: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' } } } },
            projects_identified: { type: 'array', items: { type: 'object', properties: { project_name: { type: 'string' }, confidence: { type: 'number' } } } },
            financial_data: { type: 'array', items: { type: 'object', properties: { amount: { type: 'number' }, currency: { type: 'string' }, context: { type: 'string' } } } },
            sentiment: { type: 'object', properties: { overall: { type: 'string' }, score: { type: 'number' }, key_emotions: { type: 'array', items: { type: 'string' } } } },
            action_items: { type: 'array', items: { type: 'object', properties: { task: { type: 'string' }, assignee: { type: 'string' }, deadline: { type: 'string' }, priority: { type: 'string' } } } }
          }
        },
      }),
      archiflow.integrations.Core.InvokeLLM({
        prompt: advancedPrompt,
        response_json_schema: {
          type: 'object',
          properties: {
            topics_detailed: { type: 'array', items: { type: 'object', properties: { topic: { type: 'string' }, category: { type: 'string' }, confidence: { type: 'number' }, mentions: { type: 'number' }, key_points: { type: 'array', items: { type: 'string' } } } } },
            risks_identified: { type: 'array', items: { type: 'object', properties: { risk_type: { type: 'string' }, severity: { type: 'string' }, description: { type: 'string' }, confidence: { type: 'number' }, recommendation: { type: 'string' } } } },
            compliance_issues: { type: 'array', items: { type: 'object', properties: { issue_type: { type: 'string' }, description: { type: 'string' }, confidence: { type: 'number' }, action_required: { type: 'string' } } } },
            follow_up_questions: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, category: { type: 'string' }, priority: { type: 'string' }, rationale: { type: 'string' } } } }
          }
        }
      })
    ]);

    let analysis = {};
    let deepAnalysis = {};
    let advancedInsights = {};

    if (basicResult.status === 'fulfilled') {
      analysis = basicResult.value;
      console.log('✅ Basic analysis completed');
    } else {
      throw new Error('ניתוח בסיסי נכשל');
    }

    if (deepResult.status === 'fulfilled') {
      deepAnalysis = deepResult.value;
      console.log('✅ Deep analysis completed');
    }

    if (advancedResult.status === 'fulfilled') {
      advancedInsights = advancedResult.value;
      console.log('✅ Advanced insights completed');
    }

    return { analysis, deepAnalysis, advancedInsights };
  };

  const handleApprove = async (approvalData) => {
    try {
      console.log('📤 Distributing data to system (V2)...', approvalData);
      
      // Use the new V2 distribution function
      const result = await archiflow.functions.invoke('distributeRecordingDataV2', {
        recording: approvalData.recording,
        selections: approvalData.selections,
        clientData: approvalData.clientData,
        projectData: approvalData.projectData,
        tasks: approvalData.tasks,
        journal: approvalData.journal,
        email: approvalData.email,
        changedFields: approvalData.changedFields
      });

      console.log('✅ Distribution V2 result:', result.data);

      const summary = result.data?.summary || {};
      const messages = [];
      if (summary.client_updated) messages.push('לקוח עודכן');
      if (summary.project_updated) messages.push('פרויקט עודכן');
      if (summary.tasks_created > 0) messages.push(`${summary.tasks_created} משימות נוצרו`);
      if (summary.journal_created) messages.push('רשומת יומן נוצרה');
      if (summary.email_sent) messages.push('מייל נשלח');
      
      showSuccess(`הצלחה! ${messages.join(', ')}`);
      
      setAnalysisState('empty');
      setCurrentRecording(null);
      queryClient.invalidateQueries({ queryKey: ['recordings'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch (error) {
      console.error('Distribution error:', error);
      showError('שגיאה בפיזור הנתונים: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-40 shadow-soft-organic">
        <div className="p-4 sm:p-6 md:p-8 lg:p-12">
          <PageHeader 
            title="בקרת הקלטות (מנהל מערכת)" 
            subtitle="ניהול ובקרת כל ההקלטות במערכת - Super Admin בלבד"
            className="mb-0 border-b-0 pb-0"
          />
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="p-4 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
          {/* Left Panel - Recording or Large File Processor */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="h-auto lg:h-[600px]"
          >
            {largeFileProcessing ? (
              <LargeAudioProcessor
                file={largeFileProcessing.file}
                onComplete={handleLargeFileComplete}
                onError={handleLargeFileError}
                onCancel={handleLargeFileCancel}
              />
            ) : (
              <RecordingControls onRecordingComplete={handleRecordingComplete} />
            )}
          </motion.div>

          {/* Right Panel - Analysis */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="h-auto lg:h-[600px]"
          >
            <AnalysisResults 
              state={analysisState} 
              onApprove={handleApprove}
              recording={currentRecording}
            />
          </motion.div>
        </div>

        {/* Bottom Section - Recordings Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <RecordingsGrid />
        </motion.div>
      </div>

      {/* Glassmorphism Overlay Effect */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}