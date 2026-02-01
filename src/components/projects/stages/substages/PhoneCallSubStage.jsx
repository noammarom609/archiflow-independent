import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Phone, 
  Upload, 
  Mic, 
  MicOff,
  Play,
  Pause,
  Square,
  CheckCircle2,
  Clock,
  Loader2,
  FileAudio,
  Brain,
  Sparkles,
  AlertCircle,
  ClipboardList,
  Save,
  Calendar,
  Scissors,
  Download
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { showSuccess, showError } from '../../../utils/notifications';
import { addRecordingToClientHistory } from '../../../utils/clientHistoryHelper';
import { getRecordingTags, getDocumentTags } from '../../../utils/autoTagging';
import { loadChecklist } from '../../../utils/checklistLoader';
import { downloadAudioFile, getAudioFilename } from '../../../utils/audioHelpers';
import { saveProjectAIInsights } from '../../../utils/aiInsightsManager';
import ProjectMeetingSchedulerModal from '../../scheduling/ProjectMeetingSchedulerModal';
import LargeAudioProcessor from '../../../audio/LargeAudioProcessor';
import { useAuth } from '@/lib/AuthContext';

const MAX_CHUNK_SIZE = 25 * 1024 * 1024; // 25MB
const LARGE_FILE_THRESHOLD = 24 * 1024 * 1024; // 24MB - use FFmpeg for larger files

/** Split markdown summary by ### / ## headers into sections for display */
function parseAnalysisSummarySections(text) {
  if (!text || typeof text !== 'string') return [{ title: 'סיכום מנהלים', content: '' }];
  const trimmed = text.trim();
  if (!trimmed) return [{ title: 'סיכום מנהלים', content: '' }];
  const parts = trimmed.split(/(?:^|\n)\s*#{2,3}\s+/).map(p => p.trim()).filter(Boolean);
  if (parts.length <= 1) return [{ title: 'סיכום מנהלים', content: trimmed }];
  return parts.map((block, i) => {
    const firstLineBreak = block.indexOf('\n');
    let title = firstLineBreak >= 0 ? block.slice(0, firstLineBreak).trim() : block.trim();
    const content = firstLineBreak >= 0 ? block.slice(firstLineBreak + 1).trim() : '';
    title = title.replace(/^\d+\.\s*/, '').replace(/\s*\([^)]*\)\s*$/, '').trim() || `חלק ${i + 1}`;
    return { title, content };
  });
}

/** Get content from parsed sections by matching title (for designated cards when structured fields are empty) */
function getSectionContent(sections, ...possibleTitleParts) {
  if (!sections?.length || !possibleTitleParts.length) return '';
  const lower = (s) => (s || '').toLowerCase();
  const found = sections.find(({ title }) =>
    possibleTitleParts.some(part => lower(title).includes(lower(part)))
  );
  return found?.content ?? '';
}

/** Title patterns that have a designated card below – exclude from "full analysis" to avoid duplication */
const DESIGNATED_SECTION_PATTERNS = [
  'צרכים', 'דרישות', 'ניתוח צרכים', 'needs',
  'תקציב', 'פיננסי', 'budget',
  'לוח זמנים', 'זמנים', 'timeline',
  'המלצות אסטרטגיות', 'אסטרטגיות', 'strategic',
  'פרופיל לקוח', 'פרופיל', 'client',
  'ניתוח הפרויקט', 'הפרויקט', 'project',
  'העדפות עיצוביות', 'עיצוביות', 'style',
  'חששות', 'דגלים אדומים', 'concerns', 'red flag',
  'סנטימנט', 'התרשמות', 'sentiment'
];
function isDesignatedSection(title) {
  if (!title || typeof title !== 'string') return false;
  const t = title.toLowerCase();
  return DESIGNATED_SECTION_PATTERNS.some(part => t.includes(part.toLowerCase()));
}

/** Parse markdown "מיפוי סמנטי לצ'קליסט" / Stage 2 → checklist_analysis. Supports [ID: xxx] and ID: xxx (no brackets). */
function parseChecklistAnalysisFromMarkdown(summaryText) {
  if (!summaryText || typeof summaryText !== 'string') return [];
  let text = summaryText;
  const stage2Match = summaryText.match(/(?:מיפוי סמנטי|מיפוי לצ'קליסט|Stage 2|שלב 2|צ'קליסט)[\s\S]*?(?=###|##\s|סיכום מנהלים|$)/i);
  if (stage2Match) text = stage2Match[0];
  const lines = text.split(/\n/);
  const result = [];
  const seen = new Set();

  function addIfValid(id, answer_summary) {
    const val = (answer_summary || '').trim().replace(/^\s*[✓✔]\s*/, '');
    if (!id || seen.has(id)) return;
    if (!val || /answered\s*=\s*false/i.test(val)) return;
    seen.add(id);
    result.push({ id: id.trim(), answer_summary: val, answered: true, confidence: 80 });
  }

  for (const line of lines) {
    // Format A (actual LLM output): "ID: project_type - ✓ שיפוץ" or "ID: intro - answered=false" (no brackets)
    let m = line.match(/^\s*[\-\•\*\d.]*\s*ID:\s*([a-zA-Z0-9_]+)\s*[-–:]\s*(.+)$/);
    if (m) {
      addIfValid(m[1].trim(), m[2]);
      continue;
    }
    // Format B: [ID: project_type]: ✓ שיפוץ
    m = line.match(/\[ID:\s*([^\]\s]+)\].*?[✓✔]?\s*[:–-]?\s*(.+?)(?:\s*\.\d+)?\s*$/);
    if (m) {
      addIfValid(m[1], m[2]);
      continue;
    }
    // Format C: ✓ שיפוץ :**[ID: project_type]**
    m = line.match(/[✓✔]?\s*(.+?)\s*:\s*\*?\*?\[ID:\s*([^\]\s]+)\]/);
    if (m) {
      const id = (m[2] || '').trim();
      if (id && !seen.has(id)) {
        const val = (m[1] || '').trim().replace(/^\s*[✓✔]\s*/, '');
        if (val && !/answered\s*=\s*false/i.test(val)) {
          seen.add(id);
          result.push({ id, answer_summary: val, answered: true, confidence: 80 });
        }
      }
      continue;
    }
    // Format D: - [ID: project_type]: שיפוץ
    m = line.match(/^[\s\-•*]*\[ID:\s*([^\]\s]+)\]\s*[:–-]?\s*(.+)$/);
    if (m) {
      addIfValid(m[1], m[2]);
    }
  }
  return result;
}

export default function PhoneCallSubStage({ project, onComplete, onContinue, onUpdate }) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const chunkFilesRef = useRef([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [processingState, setProcessingState] = useState('idle'); // idle, uploading, transcribing, analyzing, done
  const [transcription, setTranscription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [currentChunkSize, setCurrentChunkSize] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState([]);
  
  // Large file processing state
  const [isLargeFile, setIsLargeFile] = useState(false);
  const [largeFileProcessing, setLargeFileProcessing] = useState(false);
  
  // Detailed progress state
  const [progressInfo, setProgressInfo] = useState({
    stage: '', // uploading, transcribing, analyzing
    current: 0,
    total: 0,
    percent: 0,
    message: ''
  });
  
  // ✅ Phone call checklist state - load ONCE from project or defaults
  const [checklist, setChecklist] = useState([]);
  const checklistLoadedRef = useRef(false); // ✅ Use ref to prevent re-initialization
  const checklistRef = useRef([]); // ✅ Always-current list for async flow (avoids stale closure)
  useEffect(() => {
    checklistRef.current = checklist;
  }, [checklist]);

  useEffect(() => {
    async function initChecklist() {
      if (!project) return;
      
      // ✅ CRITICAL FIX: Always load from project if data exists (not just once)
      if (project?.phone_call_checklist && Array.isArray(project.phone_call_checklist) && project.phone_call_checklist.length > 0) {
        console.log('✅ Loading checklist from project:', project.phone_call_checklist.length, 'items');
        setChecklist(project.phone_call_checklist);
        return;
      }
      
      // Only load defaults if we haven't loaded them yet AND project has no data
      if (!checklistLoadedRef.current) {
        console.log('📋 Loading default checklist from SystemSettings');
        const loadedChecklist = await loadChecklist('phone_call_checklist');
        setChecklist(loadedChecklist);
        checklistLoadedRef.current = true;
      }
    }
    initChecklist();
  }, [project?.id, project?.phone_call_checklist]); // ✅ Watch both ID and checklist data
  
  // ✅ Store the server URL separately for reliable playback/download
  const [serverAudioUrl, setServerAudioUrl] = useState(null);
  
  // ✅ Load existing recording data from project on mount (PERSISTENCE FIX)
  useEffect(() => {
    async function loadExistingData() {
      // If we already have analysis loaded, don't reload
      if (analysis || transcription) return;
      
      // Check if project has a recording ID
      if (project?.first_call_recording_id) {
        try {
          const recordings = await archiflow.entities.Recording.filter({ 
            id: project.first_call_recording_id 
          });
          if (recordings.length > 0) {
            const recording = recordings[0];
            console.log('✅ Loading existing phone call recording:', recording.id);
            
            if (recording.transcription) {
              setTranscription(recording.transcription);
            }
            if (recording.analysis) {
              setAnalysis(recording.analysis);
              setProcessingState('done');
            }
            if (recording.audio_url) {
              // ✅ Store server URL and set it for playback
              setServerAudioUrl(recording.audio_url);
              setAudioUrl(recording.audio_url);
              console.log('✅ Audio URL loaded from server:', recording.audio_url);
            }
          }
        } catch (err) {
          console.log('Could not load existing recording:', err);
        }
      }
    }
    loadExistingData();
  }, [project?.first_call_recording_id]);
  
  const [expandedItems, setExpandedItems] = useState({});
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);

  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const [audioLevel, setAudioLevel] = useState(0);
  const [showRecordingTips, setShowRecordingTips] = useState(true);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start recording with chunking
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : 'audio/ogg';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      chunkFilesRef.current = [];
      setCurrentChunkSize(0);
      setUploadedChunks([]);

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          const newSize = currentChunkSize + event.data.size;
          setCurrentChunkSize(newSize);
          
          // If we've exceeded 25MB, save this chunk and start a new one
          if (newSize >= MAX_CHUNK_SIZE) {
            await saveCurrentChunk();
          }
        }
      };

      mediaRecorder.onstop = async () => {
        // Save any remaining data as the final chunk
        if (chunksRef.current.length > 0) {
          await saveCurrentChunk();
        }
        
        stream.getTracks().forEach(track => track.stop());
        
        // Combine all chunks for preview
        if (chunkFilesRef.current.length > 0) {
          const lastChunk = chunkFilesRef.current[chunkFilesRef.current.length - 1];
          setAudioFile(lastChunk);
          setAudioUrl(URL.createObjectURL(lastChunk));
        }
      };

      mediaRecorder.start(1000); // Get data every second for responsive chunking
      setIsRecording(true);
      setRecordingTime(0);
      setShowRecordingTips(false);
      
      // Setup audio level monitoring
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        analyserRef.current.fftSize = 256;
        
        const monitorAudioLevel = () => {
          if (!analyserRef.current) return;
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(Math.min(100, (average / 128) * 100));
          animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
        };
        monitorAudioLevel();
      } catch (audioErr) {
        console.log('Audio level monitoring not available:', audioErr);
      }
      
    } catch (error) {
      console.error('Error starting recording:', error);
      showError('לא ניתן לגשת למיקרופון');
    }
  };

  const saveCurrentChunk = async () => {
    if (chunksRef.current.length === 0) return;
    
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const chunkNumber = chunkFilesRef.current.length + 1;
    const file = new File([blob], `recording_chunk_${chunkNumber}.webm`, { type: 'audio/webm' });
    
    chunkFilesRef.current.push(file);
    setUploadedChunks(prev => [...prev, { number: chunkNumber, size: blob.size }]);
    
    // Reset for next chunk
    chunksRef.current = [];
    setCurrentChunkSize(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Cleanup audio level monitoring
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      setAudioLevel(0);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Allow files up to 500MB
      const MAX_UPLOAD_SIZE = 500 * 1024 * 1024; // 500MB
      if (file.size > MAX_UPLOAD_SIZE) {
        showError(`הקובץ גדול מדי. גודל מקסימלי: 500MB. גודל הקובץ: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
        return;
      }
      
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
      
      // Check if file is large enough to need FFmpeg processing
      if (file.size > LARGE_FILE_THRESHOLD) {
        setIsLargeFile(true);
        chunkFilesRef.current = [];
      } else {
        setIsLargeFile(false);
        chunkFilesRef.current = [file];
      }
    }
  };
  
  // Handle large file processing completion
  const handleLargeFileComplete = async (result) => {
    setLargeFileProcessing(false);
    setTranscription(result.transcription);
    
    // Continue to analysis - pass audio URL from result
    const urls = result.audio_url ? [result.audio_url] : [];
    await analyzeAndSaveRecording(result.transcription, urls);
  };
  
  const handleLargeFileError = (error) => {
    setLargeFileProcessing(false);
    setProcessingState('idle');
    showError(`שגיאה בעיבוד הקובץ: ${error}`);
  };
  
  const handleLargeFileCancel = () => {
    setLargeFileProcessing(false);
    setProcessingState('idle');
    setAudioFile(null);
    setAudioUrl(null);
    setIsLargeFile(false);
  };

  const processRecording = async () => {
    // For large files, use LargeAudioProcessor component
    if (isLargeFile && audioFile) {
      setLargeFileProcessing(true);
      setProcessingState('uploading');
      return;
    }
    
    // ✅ CRITICAL FIX: Check if we have an existing server URL (for re-processing)
    const hasExistingServerUrl = serverAudioUrl && serverAudioUrl.startsWith('http');
    
    if (chunkFilesRef.current.length === 0 && !hasExistingServerUrl) {
      showError('אין הקלטה לעיבוד');
      return;
    }

    // ✅ If we have an existing server URL but no new files, use the existing URL directly
    if (chunkFilesRef.current.length === 0 && hasExistingServerUrl) {
      console.log('✅ Re-processing existing recording from server URL:', serverAudioUrl);
      setProcessingState('transcribing');
      setProgressInfo({
        stage: 'transcribing',
        current: 1,
        total: 1,
        percent: 50,
        message: 'מתמלל הקלטה קיימת...'
      });
      
      try {
        const response = await archiflow.functions.invoke('transcribeLargeAudio', { audio_url: serverAudioUrl });
        const fullTranscription = response.data?.transcription || '';
        
        if (!fullTranscription) {
          showError('לא ניתן לתמלל את ההקלטה');
          setProcessingState('idle');
          setProgressInfo({ stage: '', current: 0, total: 0, percent: 0, message: '' });
          return;
        }
        
        setTranscription(fullTranscription.trim());
        
        // Continue with analysis using existing server URL
        await analyzeAndSaveRecording(fullTranscription.trim(), [serverAudioUrl]);
      } catch (error) {
        console.error('Error re-processing recording:', error);
        const errorMessage = error?.response?.data?.error || error?.message || 'שגיאה לא ידועה';
        showError(`שגיאה בעיבוד: ${errorMessage}`);
        setProcessingState('idle');
        setProgressInfo({ stage: '', current: 0, total: 0, percent: 0, message: '' });
      }
      return;
    }

    // ✅ Normal flow: Upload new files and process
    setProcessingState('uploading');
    const totalChunks = chunkFilesRef.current.length;
    
    try {
      // Upload all chunks with progress
      const uploadedUrls = [];
      for (let i = 0; i < chunkFilesRef.current.length; i++) {
        const chunk = chunkFilesRef.current[i];
        setProgressInfo({
          stage: 'uploading',
          current: i + 1,
          total: totalChunks,
          percent: Math.round(((i + 0.5) / totalChunks) * 100),
          message: `מעלה חלק ${i + 1} מתוך ${totalChunks}...`
        });
        
        const { file_url } = await archiflow.integrations.Core.UploadFile({ file: chunk });
        uploadedUrls.push(file_url);
        
        setProgressInfo({
          stage: 'uploading',
          current: i + 1,
          total: totalChunks,
          percent: Math.round(((i + 1) / totalChunks) * 100),
          message: `הועלה חלק ${i + 1} מתוך ${totalChunks}`
        });
      }
      
      setProcessingState('transcribing');
      
      // Transcribe all chunks with progress
      let fullTranscription = '';
      for (let i = 0; i < uploadedUrls.length; i++) {
        const url = uploadedUrls[i];
        setProgressInfo({
          stage: 'transcribing',
          current: i + 1,
          total: uploadedUrls.length,
          percent: Math.round(((i + 0.5) / uploadedUrls.length) * 100),
          message: `מתמלל חלק ${i + 1} מתוך ${uploadedUrls.length}...`
        });
        
        const response = await archiflow.functions.invoke('transcribeLargeAudio', { audio_url: url });
        if (response.data?.transcription) {
          fullTranscription += response.data.transcription + ' ';
        }
        
        setProgressInfo({
          stage: 'transcribing',
          current: i + 1,
          total: uploadedUrls.length,
          percent: Math.round(((i + 1) / uploadedUrls.length) * 100),
          message: `תומלל חלק ${i + 1} מתוך ${uploadedUrls.length}`
        });
      }
      
      setTranscription(fullTranscription.trim());
      
      // Continue to analysis - PASS the uploaded URLs!
      await analyzeAndSaveRecording(fullTranscription.trim(), uploadedUrls);
      
    } catch (error) {
      console.error('Error processing recording:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'שגיאה לא ידועה';
      showError(`שגיאה בעיבוד: ${errorMessage}`);
      setProcessingState('idle');
      setProgressInfo({ stage: '', current: 0, total: 0, percent: 0, message: '' });
    }
  };
  
  // Separate analysis function to reuse for both regular and large files
  const analyzeAndSaveRecording = async (fullTranscription, uploadedUrls = []) => {
    setProcessingState('analyzing');
    setProgressInfo({
      stage: 'analyzing',
      current: 1,
      total: 1,
      percent: 50,
      message: 'מנתח את השיחה עם AI...'
    });
    
    try {
      
      // Load previous learnings for context
      let learningsContext = '';
      try {
        const learnings = await archiflow.entities.AILearning.filter({ is_active: true, category: 'client_info' });
        if (learnings.length > 0) {
          learningsContext = '\n\n## תיקונים קודמים ללמידה:\n' + 
            learnings.slice(0, 20).map(l => `- "${l.original_value}" → "${l.corrected_value}"`).join('\n');
        }
      } catch (e) { console.log('No learnings loaded'); }

      // Build checklist items for AI analysis
      const checklistItemsForAI = checklist.map((item, idx) => ({
        id: item.id,
        index: idx,
        question: item.item
      }));
      
      // Analyze with AI - TWO-STAGE DEEP ANALYSIS for accurate checklist mapping
      const rawLLM = await archiflow.integrations.Core.InvokeLLM({
        prompt: `אתה מומחה לניתוח שיחות מכירה ויועץ אסטרטגי עבור משרדי אדריכלות מובילים. 
יש לך ניסיון עשיר בזיהוי דפוסים, הבנת פסיכולוגיה של לקוחות, וחילוץ תובנות עסקיות מתמלולי שיחות.
${learningsContext}

## המשימה שלך - ניתוח דו-שלבי:

### שלב 1: חילוץ מידע גולמי מהתמלול
קרא את התמלול וחלץ את כל המידע העובדתי והחשוב, כולל:
- סוג פרויקט (שיפוץ/בנייה חדשה/דירה/משרד)
- מיקום הנכס (עיר, שכונה)
- גודל הנכס (מ"ר)
- לוח זמנים (מתי רוצים להתחיל/לסיים)
- תקציב
- מקור הגעה (איך הגיעו למשרד)
- חומרים/מסמכים קיימים
- צרכים מיוחדים
- כל מידע רלוונטי אחר

### שלב 2: מיפוי סמנטי לצ'קליסט
כעת, עבור כל פריט בצ'קליסט, בצע **מיפוי סמנטי חכם**:
- חפש מידע שקשור לנושא השאלה (לא רק התאמה מילולית!)
- השתמש בהבנה הקשרית - למשל:
  * "שיפוץ דירה בחדרה" → ענה על "סוג הפרויקט" ו"מיקום הנכס"
  * "100 מטר רבוע" → ענה על "גודל הנכס"
  * "חודש עד חודשיים" → ענה על "לוח זמנים רצוי"
  * "הגיעו דרך חברים" → ענה על "מקור ההגעה"
  * "כל הסרטוטים הקיימים" → ענה על "חומרים/תוכניות קיימות"

**דוגמאות קונקרטיות מתחום האדריכלות:**

תמלול: "רוצים לשפץ דירה בתל אביב, היא 85 מטר"
→ סוג פרויקט: "שיפוץ דירה" ✓
→ מיקום: "תל אביב" ✓
→ גודל: "85 מ"ר" ✓

תמלול: "נרצה להתחיל בעוד חודש ולסיים תוך 3 חודשים"
→ לוח זמנים: "התחלה בעוד חודש, סיום תוך 3 חודשים" ✓

תמלול: "יש לנו את התוכניות המקוריות של הדירה"
→ חומרים קיימים: "תוכניות מקוריות של הדירה" ✓

**חוקי הזהב:**
1. **חפש התאמה סמנטית**, לא רק מילולית
2. **אם אתה רואה מידע רלוונטי - שייך אותו לפריט המתאים**
3. **כתוב את המידע האמיתי**, לא את שם השאלה
4. אם אין מידע - סמן answered=false
5. רמת ביטחון: 90-100 = בטוח מאוד, 70-89 = סביר, 50-69 = אולי, מתחת 50 = לא

**רשימת פריטי הצ'קליסט לניתוח:**
${checklistItemsForAI.map(item => `${item.index + 1}. [ID: ${item.id}] ${item.question}`).join('\n')}

## תמלול השיחה:
${fullTranscription}

## הנחיות ניתוח מתקדם:

### 1. סיכום מנהלים (Executive Summary)
- תמצת את עיקרי השיחה ב-3-4 משפטים ברורים
- הדגש את ההזדמנות העסקית והפוטנציאל

### 2. פרופיל לקוח מלא
- שם מלא, טלפון, אימייל (אם הוזכרו)
- הסק מהשיחה: מקצוע, מצב משפחתי, רמה סוציו-אקונומית
- זהה את סגנון התקשורת: ישיר/עקיף, רגשי/רציונלי

### 3. ניתוח הפרויקט
- סוג הפרויקט המדויק (שיפוץ, בניה חדשה, עיצוב פנים וכו')
- היקף העבודה המשוער
- מורכבות הפרויקט (נמוכה/בינונית/גבוהה)

### 4. צרכים ודרישות - ניתוח שכבות
- צרכים מפורשים (מה הלקוח אמר במפורש)
- צרכים סמויים (מה משתמע מבין השורות)
- צרכים רגשיים (מה הלקוח באמת מחפש - ביטחון, סטטוס, נוחות)

### 5. ניתוח פיננסי
- תקציב שהוזכר או משתמע
- גמישות תקציבית (נמוכה/בינונית/גבוהה)
- נכונות להשקעה

### 6. לוח זמנים וגורמים חיצוניים
- דחיפות הפרויקט
- אירועים שמשפיעים על הטיימליין
- מגבלות זמן

### 7. העדפות עיצוביות וטעם אישי
- סגנונות שהוזכרו
- צבעים, חומרים, אווירה
- דוגמאות או השראות שהוזכרו

### 8. חששות, התנגדויות ושאלות
- חששות מפורשים
- התנגדויות פוטנציאליות
- שאלות שנשארו פתוחות

### 9. ניתוח סנטימנט והתרשמות
- רמת ההתלהבות (1-10)
- רמת הרצינות (1-10)
- סיכויי סגירה משוערים (אחוזים)
- אדום דגלים (אם יש)

### 10. המלצות אסטרטגיות
- פעולות הבאות מומלצות (לפי סדר עדיפות)
- איך לגשת ללקוח בפגישה הבאה
- נקודות למינוף
- נקודות להימנע מהן`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'סיכום מנהלים של השיחה' },
            client_info: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string' },
                profession: { type: 'string', description: 'מקצוע משוער' },
                family_status: { type: 'string', enum: ['single', 'married', 'married_with_kids', 'divorced', 'unknown'] },
                adults_count: { type: 'number', description: 'מספר מבוגרים בבית' },
                children_count: { type: 'number', description: 'מספר ילדים' },
                children_ages: { type: 'array', items: { type: 'string' }, description: 'גילאי ילדים' },
                pets: { type: 'string', description: 'חיות מחמד' },
                address: { type: 'string', description: 'כתובת אם הוזכרה' },
                city: { type: 'string', description: 'עיר' },
                communication_style: { type: 'string', description: 'סגנון תקשורת: ישיר/רגשי/אנליטי/חברותי' },
                socio_economic_level: { type: 'string', enum: ['low', 'medium', 'high', 'very_high'], description: 'רמה סוציו-אקונומית משוערת' }
              }
            },
            project_type: { type: 'string' },
            project_scope: { type: 'string', description: 'היקף העבודה המשוער' },
            project_complexity: { type: 'string', enum: ['low', 'medium', 'high'], description: 'מורכבות הפרויקט' },
            explicit_needs: { type: 'array', items: { type: 'string' }, description: 'צרכים שהוזכרו במפורש' },
            implicit_needs: { type: 'array', items: { type: 'string' }, description: 'צרכים סמויים' },
            emotional_needs: { type: 'array', items: { type: 'string' }, description: 'צרכים רגשיים' },
            main_needs: { type: 'array', items: { type: 'string' } },
            estimated_budget: { type: 'string' },
            budget_flexibility: { type: 'string', enum: ['low', 'medium', 'high'], description: 'גמישות תקציבית' },
            timeline: { type: 'string' },
            urgency_level: { type: 'string', enum: ['low', 'medium', 'high'], description: 'דחיפות' },
            timeline_factors: { type: 'array', items: { type: 'string' }, description: 'גורמים המשפיעים על לוח הזמנים' },
            style_preferences: { type: 'array', items: { type: 'string' } },
            color_preferences: { type: 'array', items: { type: 'string' }, description: 'העדפות צבע' },
            material_preferences: { type: 'array', items: { type: 'string' }, description: 'העדפות חומרים' },
            inspirations: { type: 'array', items: { type: 'string' }, description: 'השראות שהוזכרו' },
            concerns: { type: 'array', items: { type: 'string' } },
            potential_objections: { type: 'array', items: { type: 'string' }, description: 'התנגדויות פוטנציאליות' },
            open_questions: { type: 'array', items: { type: 'string' }, description: 'שאלות שנשארו פתוחות' },
            excitement_level: { type: 'number', description: 'רמת התלהבות 1-10' },
            seriousness_level: { type: 'number', description: 'רמת רצינות 1-10' },
            closing_probability: { type: 'number', description: 'סיכויי סגירה באחוזים' },
            red_flags: { type: 'array', items: { type: 'string' }, description: 'דגלים אדומים' },
            follow_up_points: { type: 'array', items: { type: 'string' } },
            next_steps: { type: 'array', items: { type: 'string' } },
            leverage_points: { type: 'array', items: { type: 'string' }, description: 'נקודות למינוף בפגישה' },
            points_to_avoid: { type: 'array', items: { type: 'string' }, description: 'נקודות להימנע מהן' },
            sentiment: { type: 'string' },
            meeting_approach: { type: 'string', description: 'איך לגשת ללקוח בפגישה הבאה' },
            program_data: {
              type: 'object',
              properties: {
                adults: { type: 'number' },
                children: { type: 'number' },
                pets: { type: 'string' },
                rooms_required: { type: 'array', items: { type: 'string' } },
                special_requests: { type: 'string' }
              },
              description: 'נתוני תכנית שהוזכרו'
            },
            speakers_identified: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['client', 'architect', 'other'] },
                  name: { type: 'string' },
                  key_quotes: { type: 'array', items: { type: 'string' } }
                }
              },
              description: 'דוברים שזוהו בשיחה'
            },
            raw_information_extracted: {
              type: 'object',
              description: 'שלב 1: כל המידע העובדתי שחולץ מהתמלול',
              properties: {
                project_type: { type: 'string' },
                location: { type: 'string' },
                size: { type: 'string' },
                timeline: { type: 'string' },
                budget: { type: 'string' },
                source: { type: 'string' },
                materials: { type: 'string' },
                special_needs: { type: 'array', items: { type: 'string' } },
                other_info: { type: 'array', items: { type: 'string' } }
              }
            },
            checklist_analysis: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'מזהה הפריט מהצ׳קליסט (העתק בדיוק!)' },
                  answered: { type: 'boolean', description: 'האם נמצא מידע רלוונטי בתמלול - השתמש במיפוי סמנטי!' },
                  answer_summary: { type: 'string', description: 'המידע הממשי מהתמלול. דוגמה: אם בתמלול "שיפוץ דירה בחדרה 100 מטר" ושאלה "סוג פרויקט" תכתוב "שיפוץ דירה", אם שאלה "מיקום" תכתוב "חדרה", אם שאלה "גודל" תכתוב "100 מ״ר"' },
                  confidence: { type: 'number', description: 'רמת ביטחון 0-100. 90+ אם המידע ברור, 70-89 אם סביר, 50-69 אם אולי' },
                  source_text: { type: 'string', description: 'הציטוט המדויק מהתמלול שממנו לקחת את המידע' }
                }
              },
              description: 'שלב 2: מיפוי סמנטי של המידע לפריטי הצ׳קליסט. חובה לענות על פריטים שיש להם מידע רלוונטי!'
            }
          }
        }
      });

      // ✅ Handle LLM response - can be string or parsed object
      // Edge Function now returns { response: object|string } depending on json_schema
      let analysisResult;
      try {
        const content = rawLLM?.response ?? rawLLM;
        
        // ✅ If response is already a parsed object, use it directly
        if (content && typeof content === 'object' && !Array.isArray(content)) {
          console.log('✅ LLM returned parsed JSON object');
          analysisResult = content;
        } else if (typeof content === 'string') {
          const trimmed = content.trim();
          // If response looks like markdown (starts with #), use as summary only
          if (/^\s*#+\s/m.test(trimmed) || trimmed.startsWith('###')) {
            console.log('⚠️ LLM returned markdown, using as summary');
            analysisResult = { summary: trimmed };
          } else {
            // Try to parse as JSON
            const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
            const toParse = (jsonMatch ? jsonMatch[1] : trimmed).trim();
            analysisResult = toParse ? JSON.parse(toParse) : { summary: trimmed };
          }
        } else {
          analysisResult = {};
        }
      } catch (e) {
        console.error('Failed to parse LLM analysis response:', e);
        const fallbackText = typeof rawLLM?.response === 'string' ? rawLLM.response : '';
        analysisResult = { summary: fallbackText || 'לא ניתן לפרסר את תוצאת הניתוח.' };
      }
      
      console.log('🤖 Analysis result:', {
        hasSummary: !!analysisResult.summary,
        hasChecklistAnalysis: !!analysisResult.checklist_analysis?.length,
        checklistAnalysisCount: analysisResult.checklist_analysis?.length || 0
      });

      // When response was markdown (only summary), try to extract checklist_analysis for auto-fill
      if (analysisResult.summary && !analysisResult.checklist_analysis?.length) {
        const parsed = parseChecklistAnalysisFromMarkdown(analysisResult.summary);
        if (parsed.length > 0) {
          analysisResult.checklist_analysis = parsed;
          console.log('🤖 Checklist analysis parsed from markdown:', parsed.length, 'items', parsed);
        } else {
          console.log('🤖 No checklist items parsed from markdown (check for "[ID: xxx]" lines in summary)');
        }
      }

      setAnalysis(analysisResult);
      
      setProgressInfo({
        stage: 'analyzing',
        current: 1,
        total: 1,
        percent: 80,
        message: 'שומר את ההקלטה...'
      });
      
      // ✅ CRITICAL FIX: Save the SERVER URL, not the local blob URL!
      // Use the FIRST uploaded chunk URL as the primary audio URL
      const serverUrl = uploadedUrls && uploadedUrls.length > 0 ? uploadedUrls[0] : '';
      
      // Save recording to database (architect_email required by RLS/constraint)
      const recording = await archiflow.entities.Recording.create({
        title: `שיחת טלפון - ${project?.name || 'פרויקט חדש'}`,
        audio_url: serverUrl,
        transcription: fullTranscription,
        analysis: analysisResult,
        status: 'analyzed',
        project_id: project?.id ? String(project.id) : undefined,
        project_name: project?.name,
        architect_email: authUser?.email || null,
        created_by: authUser?.email || null,
      });

      // Generate automatic tags
      const autoTags = getRecordingTags('phone_call', project, 'first_call');

      // Also save as project document with link to recording (architect_email required by documents NOT NULL)
      await archiflow.entities.Document.create({
        title: `הקלטת שיחת טלפון - ${new Date().toLocaleDateString('he-IL')}`,
        file_url: serverUrl, // ✅ Use server URL here too!
        file_type: 'other',
        category: 'other',
        project_id: project?.id ? String(project.id) : undefined,
        project_name: project?.name,
        recording_id: recording.id,
        status: 'active',
        tags: autoTags,
        description: `הקלטת שיחת טלפון ראשונה עם הלקוח. משך: ${formatTime(recordingTime)}. תמלול ונותח אוטומטית.`,
        architect_email: authUser?.email || null,
        created_by: authUser?.email || null,
      });
      
      // ✅ NEW: Save AI insights using the centralized manager with source tracking
      if (project?.id) {
        try {
          const user = await archiflow.auth.me();
          const insightsResult = await saveProjectAIInsights({
            projectId: project.id,
            analysisData: {
              // Map analysis result to insights format
              budget_estimate: analysisResult.estimated_budget,
              timeline_estimate: analysisResult.timeline,
              location: analysisResult.raw_information_extracted?.location,
              property_size: analysisResult.raw_information_extracted?.size,
              summary: analysisResult.summary,
              sentiment: analysisResult.sentiment ? {
                overall: analysisResult.sentiment,
                score: analysisResult.closing_probability,
                key_emotions: []
              } : null,
              client_needs: analysisResult.main_needs || analysisResult.explicit_needs || [],
              explicit_needs: analysisResult.explicit_needs || [],
              implicit_needs: analysisResult.implicit_needs || [],
              style_preferences: analysisResult.style_preferences || [],
              decisions: analysisResult.follow_up_points || [],
              action_items: analysisResult.next_steps?.map(step => ({ value: step })) || [],
              concerns: analysisResult.concerns?.map(c => ({ value: c, severity: 'medium' })) || [],
              follow_up_questions: analysisResult.open_questions?.map(q => ({ value: q, priority: 'medium' })) || [],
              key_topics: analysisResult.raw_information_extracted?.other_info?.map(t => ({ value: t })) || [],
              strategic_recommendations: [
                ...(analysisResult.leverage_points || []).map(p => ({ value: p, priority: 'high' })),
                ...(analysisResult.meeting_approach ? [{ value: analysisResult.meeting_approach, priority: 'high' }] : [])
              ],
              rooms_required: analysisResult.program_data?.rooms_required?.map(r => ({ value: r })) || [],
              people_mentioned: analysisResult.speakers_identified?.map(s => ({ name: s.name, role: s.role })) || [],
              financial_mentions: analysisResult.estimated_budget ? [{ amount: null, context: analysisResult.estimated_budget }] : []
            },
            source: {
              type: 'phone_call',
              recordingId: recording.id,
              date: new Date().toISOString().split('T')[0],
              confidence: 0.85
            },
            triggeredBy: user?.email
          });
          
          console.log('✅ AI Insights saved:', insightsResult.message);
        } catch (insightsErr) {
          console.error('Could not save AI insights:', insightsErr);
        }
      }
      
      // Also update project with recording ID (legacy support)
      if (project?.id && onUpdate) {
        await onUpdate({ 
          first_call_recording_id: recording.id
        });
      }
      
      // Also update analysis state to show in UI
      setAnalysis(analysisResult);
      
      // Auto-update Client entity if we have client_id
      if (project?.client_id && analysisResult.client_info) {
        try {
          const clientUpdate = {};
          const ci = analysisResult.client_info;
          if (ci.name) clientUpdate.full_name = ci.name;
          if (ci.phone) clientUpdate.phone = ci.phone;
          if (ci.email) clientUpdate.email = ci.email;
          if (ci.profession) clientUpdate.profession = ci.profession;
          if (ci.family_status) clientUpdate.family_status = ci.family_status;
          if (ci.adults_count) clientUpdate.adults_count = ci.adults_count;
          if (ci.children_count) clientUpdate.children_count = ci.children_count;
          if (ci.children_ages?.length) clientUpdate.children_ages = ci.children_ages;
          if (ci.pets) clientUpdate.pets = ci.pets;
          if (ci.address) clientUpdate.address = ci.address;
          if (ci.city) clientUpdate.city = ci.city;
          
          // Update preferences
          if (analysisResult.style_preferences?.length || analysisResult.color_preferences?.length || analysisResult.material_preferences?.length) {
            const existingClients = await archiflow.entities.Client.filter({ id: project.client_id });
            if (existingClients.length > 0) {
              const prefs = existingClients[0].preferences || {};
              clientUpdate.preferences = {
                ...prefs,
                styles: [...new Set([...(prefs.styles || []), ...(analysisResult.style_preferences || [])])],
                colors: [...new Set([...(prefs.colors || []), ...(analysisResult.color_preferences || [])])],
                materials: [...new Set([...(prefs.materials || []), ...(analysisResult.material_preferences || [])])],
                inspirations: [...new Set([...(prefs.inspirations || []), ...(analysisResult.inspirations || [])])],
                budget_range: analysisResult.estimated_budget || prefs.budget_range,
                priorities: [...new Set([...(prefs.priorities || []), ...(analysisResult.explicit_needs || [])])]
              };
            }
          }
          
          // Update ai_insights on client
          if (ci.communication_style || ci.socio_economic_level || analysisResult.red_flags?.length || analysisResult.leverage_points?.length) {
            const existingClients = await archiflow.entities.Client.filter({ id: project.client_id });
            if (existingClients.length > 0) {
              const insights = existingClients[0].ai_insights || {};
              clientUpdate.ai_insights = {
                ...insights,
                communication_style: ci.communication_style || insights.communication_style,
                socio_economic_level: ci.socio_economic_level || insights.socio_economic_level,
                red_flags: [...new Set([...(insights.red_flags || []), ...(analysisResult.red_flags || [])])],
                leverage_points: [...new Set([...(insights.leverage_points || []), ...(analysisResult.leverage_points || [])])],
                key_concerns: [...new Set([...(insights.key_concerns || []), ...(analysisResult.concerns || [])])],
                closing_probability: analysisResult.closing_probability || insights.closing_probability,
                urgency_level: analysisResult.urgency_level || insights.urgency_level
              };
            }
          }
          
          if (Object.keys(clientUpdate).length > 0) {
            await archiflow.entities.Client.update(project.client_id, clientUpdate);
            console.log('✅ Client updated with phone call insights');
          }
        } catch (clientErr) {
          console.log('Could not auto-update client:', clientErr);
        }
      }
      
      // Auto-update phone call checklist based on AI checklist analysis
      if (analysisResult.checklist_analysis?.length > 0) {
        console.log('🤖 Raw Information Extracted:', analysisResult.raw_information_extracted);
        console.log('🤖 Checklist Analysis:', analysisResult.checklist_analysis);
        // Use ref so we have the latest list (avoid stale closure); if still empty, load from project or defaults
        let listToUpdate = checklistRef.current?.length > 0
          ? checklistRef.current
          : (project?.phone_call_checklist && Array.isArray(project.phone_call_checklist) && project.phone_call_checklist.length > 0)
            ? project.phone_call_checklist
            : await loadChecklist('phone_call_checklist');
        if (!listToUpdate?.length) {
          console.warn('🤖 Checklist empty – cannot apply AI auto-fill. Load checklist first.');
        }
        const updatedChecklist = (listToUpdate || []).map(item => {
          if (!item?.id) return item;
          const itemAnalysis = analysisResult.checklist_analysis.find(
            a => a.id === item.id
          );
          if (itemAnalysis && itemAnalysis.answered !== false && (itemAnalysis.confidence ?? 80) >= 60) {
            console.log(`✅ Item "${item.item}" answered: "${itemAnalysis.answer_summary || ''}"`);
            return {
              ...item,
              checked: true,
              notes: itemAnalysis.answer_summary || item.notes || ''
            };
          }
          return item;
        });
        setChecklist(updatedChecklist);
        if (project?.id && onUpdate && updatedChecklist.length > 0) {
          try {
            await onUpdate({ phone_call_checklist: updatedChecklist });
            console.log('✅ Checklist auto-saved after AI analysis');
          } catch (err) {
            console.error('Failed to save checklist:', err);
          }
        }
      }
      
      // Add to client history
      if (project?.client_id) {
        await addRecordingToClientHistory(project.client_id, recording, project);
      }
      
      setProcessingState('done');
      setProgressInfo({
        stage: 'done',
        current: 1,
        total: 1,
        percent: 100,
        message: 'הושלם בהצלחה!'
      });
      showSuccess('השיחה נותחה בהצלחה!');
      
      // Mark as complete but don't auto-advance
      if (onComplete) onComplete();
      
      // Scroll to analysis results after short delay
      setTimeout(() => {
        const element = document.getElementById('analysis-results');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
    } catch (error) {
      console.error('Error in analysis:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'שגיאה לא ידועה';
      showError(`שגיאה בניתוח: ${errorMessage}`);
      setProcessingState('idle');
      setProgressInfo({ stage: '', current: 0, total: 0, percent: 0, message: '' });
    }
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Checklist functions
  const toggleChecklistItem = (id, index) => {
    setChecklist(prev => {
      const newList = [...prev];
      newList[index] = { ...newList[index], checked: !newList[index].checked };
      return newList;
    });
    if (!checklist[index].checked) {
      setExpandedItems(prev => ({ ...prev, [id]: true }));
    }
  };

  const updateChecklistNotes = (id, notes) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, notes } : item
    ));
  };

  const saveChecklist = async () => {
    if (project?.id && onUpdate) {
      // ✅ CRITICAL FIX: Properly format checklist data for saving
      const checklistToSave = checklist.map(item => ({
        id: item.id || String(Date.now() + Math.random()),
        item: item.item || '',
        checked: Boolean(item.checked),
        notes: item.notes || ''
      }));
      
      console.log('💾 Saving phone call checklist:', checklistToSave.length, 'items');
      await onUpdate({ phone_call_checklist: checklistToSave });
      showSuccess('הצ׳קליסט נשמר!');
    }
  };

  const completedItems = checklist.filter(item => item.checked).length;
  const progress = (completedItems / checklist.length) * 100;
  const firstUncheckedIndex = checklist.findIndex(item => !item.checked);
  const currentActiveIndex = firstUncheckedIndex === -1 ? checklist.length - 1 : firstUncheckedIndex;

  return (
    <div className="space-y-6">
      {/* Phone Call Checklist */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              צ׳קליסט שיחת טלפון ראשונה
            </CardTitle>
            <Badge className={progress === 100 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
              {completedItems}/{checklist.length}
            </Badge>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
            <motion.div 
              className="bg-indigo-600 h-2 rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {checklist.map((item, index) => {
              const isActive = index === currentActiveIndex && !item.checked;
              const isExpanded = expandedItems[item.id] || (item.checked && item.notes);
              
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`rounded-xl border-2 transition-all duration-200 ${
                    item.checked 
                      ? 'bg-green-50 border-green-300' 
                      : isActive 
                        ? 'bg-indigo-50 border-indigo-400 shadow-md' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
                    <button
                      type="button"
                      onClick={() => toggleChecklistItem(item.id, index)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        item.checked 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : isActive 
                            ? 'bg-indigo-500 animate-pulse hover:bg-indigo-600' 
                            : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                    >
                      {item.checked ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        item.checked ? 'text-green-800' : isActive ? 'text-indigo-900' : 'text-slate-700'
                      }`}>
                        {item.item}
                      </p>
                      {item.checked && item.notes && !isExpanded && (
                        <p className="text-xs text-green-600 mt-0.5 truncate">{item.notes}</p>
                      )}
                    </div>
                    
                    {isActive && !item.checked && (
                      <Badge className="bg-indigo-500 text-white text-xs">נוכחי</Badge>
                    )}
                  </div>
                  
                  {item.checked && isExpanded && (
                    <div className="px-3 pb-3">
                      <Textarea
                        placeholder="הוסף הערות..."
                        value={item.notes}
                        onChange={(e) => updateChecklistNotes(item.id, e.target.value)}
                        className="text-sm min-h-[60px] bg-white border-green-200 focus:border-green-400"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          <Button onClick={saveChecklist} variant="outline" className="w-full mt-4">
            <Save className="w-4 h-4 ml-2" />
            שמור צ׳קליסט
          </Button>
        </CardContent>
      </Card>

      {/* Schedule Meeting Link - Available even before recording analysis */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <h4 className="font-medium text-indigo-900">שלח קישור לתיאום פגישה ראשונה</h4>
            <p className="text-sm text-indigo-700">אפשר ללקוח לבחור מועד נוח מתוך הזמנים הפנויים שלך</p>
          </div>
          <Button 
            onClick={() => setShowMeetingScheduler(true)}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            <Calendar className="w-4 h-4" />
            שלח קישור תיאום
          </Button>
        </CardContent>
      </Card>

      {/* Recording Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="w-5 h-5 text-indigo-600" />
            הקלטת שיחת טלפון
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Recording Tips - Collapsible */}
          {showRecordingTips && !audioFile && !isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-900 mb-2">טיפים להקלטה איכותית</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        הקלט בסביבה שקטה (בלי רעשי רקע)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        החזק את הטלפון קרוב לפה בזמן שיחה
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        אפשר לשים רמקול ולהקליט את שני הצדדים
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        אל תפסיק באמצע - ההקלטה נשמרת אוטומטית
                      </li>
                    </ul>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRecordingTips(false)}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                >
                  הבנתי
                </Button>
              </div>
            </motion.div>
          )}

          {/* Recording Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live Recording */}
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <h3 className="font-semibold text-slate-900 mb-4">הקלטה חיה</h3>
              
              {isRecording ? (
                <div className="space-y-4">
                  {/* Audio Level Indicator */}
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
                    <div 
                      className="absolute inset-0 rounded-full transition-transform duration-75"
                      style={{
                        background: `radial-gradient(circle, rgba(220,38,38,${audioLevel / 100}) 0%, transparent 70%)`,
                        transform: `scale(${1 + audioLevel / 200})`,
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Mic className="w-10 h-10 text-red-600" />
                    </div>
                  </div>
                  
                  {/* Audio Level Bar */}
                  <div className="w-full max-w-[150px] mx-auto">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full transition-colors ${
                          audioLevel > 70 ? 'bg-red-500' : 
                          audioLevel > 40 ? 'bg-green-500' : 
                          'bg-amber-500'
                        }`}
                        animate={{ width: `${audioLevel}%` }}
                        transition={{ duration: 0.1 }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {audioLevel < 20 ? 'חלש - קרב למיקרופון' : audioLevel > 70 ? 'חזק - הרחק מעט' : 'איכות טובה ✓'}
                    </p>
                  </div>
                  
                  <p className="text-3xl font-mono font-bold text-red-600">{formatTime(recordingTime)}</p>
                  {uploadedChunks.length > 0 && (
                    <p className="text-sm text-slate-500">
                      {uploadedChunks.length} חלקים נשמרו
                    </p>
                  )}
                  <Button 
                    onClick={stopRecording}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Square className="w-4 h-4 ml-2" />
                    עצור הקלטה
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto hover:bg-indigo-200 transition-colors cursor-pointer" onClick={startRecording}>
                    <Mic className="w-10 h-10 text-indigo-600" />
                  </div>
                  <Button 
                    onClick={startRecording}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={processingState !== 'idle' && processingState !== 'done'}
                  >
                    <Mic className="w-4 h-4 ml-2" />
                    התחל הקלטה
                  </Button>
                  <p className="text-xs text-slate-500">
                    הקלטות ארוכות יחולקו אוטומטית ל-25MB
                  </p>
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="bg-slate-50 rounded-xl p-6 text-center">
              <h3 className="font-semibold text-slate-900 mb-4">העלאת קובץ</h3>
              <div className="space-y-4">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-10 h-10 text-purple-600" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="audio/*"
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  disabled={isRecording || (processingState !== 'idle' && processingState !== 'done')}
                >
                  <FileAudio className="w-4 h-4 ml-2" />
                  בחר קובץ אודיו
                </Button>
                <p className="text-xs text-slate-500">
                  עד 500MB לקובץ (קבצים גדולים יפוצלו אוטומטית)
                </p>
              </div>
            </div>
          </div>

          {/* Audio Preview */}
          {audioUrl && (
            <div className="bg-indigo-50 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={togglePlayback}
                  className="flex-shrink-0"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <div className="flex-1">
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    onError={(e) => console.log('Audio error:', e)}
                    crossOrigin="anonymous"
                    className="hidden"
                  />
                  <p className="text-sm font-medium text-indigo-900">
                    {audioFile?.name || (serverAudioUrl ? 'הקלטה שמורה' : 'הקלטה חדשה')}
                  </p>
                  <p className="text-xs text-indigo-600">
                    {chunkFilesRef.current.length > 1 
                      ? `${chunkFilesRef.current.length} חלקים`
                      : audioFile ? `${(audioFile.size / (1024 * 1024)).toFixed(1)} MB` : (serverAudioUrl ? 'נטען מהשרת' : '')
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isLargeFile && (
                    <Badge className="bg-amber-100 text-amber-800">
                      קובץ גדול - {(audioFile?.size / (1024 * 1024)).toFixed(0)}MB
                    </Badge>
                  )}
                  {/* Download Button - Uses helper for reliable download */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const filename = getAudioFilename(audioUrl, project?.name, 'phone_call');
                      const result = await downloadAudioFile(audioUrl, filename);
                      if (!result.success) {
                        showError('שגיאה בהורדת הקובץ: ' + result.error);
                      }
                    }}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    <Download className="w-4 h-4 ml-1" />
                    הורד
                  </Button>
                  <Button
                    onClick={processRecording}
                    disabled={(processingState !== 'idle' && processingState !== 'done') || largeFileProcessing}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {processingState === 'idle' || processingState === 'done' ? (
                      <>
                        <Brain className="w-4 h-4 ml-2" />
                        עבד וניתח
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        מעבד...
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Large File Processor */}
          {largeFileProcessing && audioFile && (
            <LargeAudioProcessor
              file={audioFile}
              onComplete={handleLargeFileComplete}
              onError={handleLargeFileError}
              onCancel={handleLargeFileCancel}
            />
          )}

          {/* Processing Status with detailed progress */}
          {processingState !== 'idle' && processingState !== 'done' && !largeFileProcessing && (
            <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    {processingState === 'uploading' && <Upload className="w-6 h-6 text-indigo-600 animate-pulse" />}
                    {processingState === 'transcribing' && <Scissors className="w-6 h-6 text-indigo-600 animate-pulse" />}
                    {processingState === 'analyzing' && <Brain className="w-6 h-6 text-indigo-600 animate-pulse" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-indigo-900">
                      {processingState === 'uploading' && 'מעלה קבצים'}
                      {processingState === 'transcribing' && 'מתמלל הקלטה'}
                      {processingState === 'analyzing' && 'מנתח עם AI'}
                    </h3>
                    <p className="text-sm text-indigo-700">{progressInfo.message || 'מעבד...'}</p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-indigo-600 mb-2">
                    <span>התקדמות</span>
                    <span>{progressInfo.percent}%</span>
                  </div>
                  <Progress value={progressInfo.percent} className="h-3" />
                </div>
                
                {/* Chunks indicator */}
                {progressInfo.total > 1 && (
                  <div className="flex gap-1 justify-center">
                    {Array.from({ length: progressInfo.total }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-3 h-3 rounded-full transition-all ${
                          idx < progressInfo.current ? 'bg-green-500' :
                          idx === progressInfo.current - 1 ? 'bg-indigo-500 animate-pulse' :
                          'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                {/* Stage indicators */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-indigo-200">
                  {[
                    { key: 'uploading', label: 'העלאה', icon: Upload },
                    { key: 'transcribing', label: 'תמלול', icon: FileAudio },
                    { key: 'analyzing', label: 'ניתוח', icon: Brain }
                  ].map((stage, idx, arr) => {
                    const stages = ['uploading', 'transcribing', 'analyzing'];
                    const currentIdx = stages.indexOf(processingState);
                    const thisIdx = stages.indexOf(stage.key);
                    const isComplete = thisIdx < currentIdx;
                    const isCurrent = stage.key === processingState;
                    const Icon = stage.icon;
                    
                    return (
                      <React.Fragment key={stage.key}>
                        <div className="flex flex-col items-center">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center
                            ${isComplete ? 'bg-green-500 text-white' : 
                              isCurrent ? 'bg-indigo-500 text-white animate-pulse' : 
                              'bg-slate-200 text-slate-400'}
                          `}>
                            {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                          </div>
                          <span className="text-[10px] mt-1 text-slate-600">{stage.label}</span>
                        </div>
                        {idx < arr.length - 1 && (
                          <div className={`flex-1 h-1 mx-2 rounded ${thisIdx < currentIdx ? 'bg-green-500' : 'bg-slate-200'}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {processingState === 'done' && analysis && (() => {
        const summarySections = parseAnalysisSummarySections(analysis.summary || '');
        const needsContent = getSectionContent(summarySections, 'צרכים', 'ניתוח צרכים', 'Needs', 'דרישות');
        const budgetContent = getSectionContent(summarySections, 'תקציב', 'פיננסי', 'Budget');
        const timelineContent = getSectionContent(summarySections, 'לוח זמנים', 'זמנים', 'Timeline');
        const strategicContent = getSectionContent(summarySections, 'המלצות אסטרטגיות', 'Strategic', 'אסטרטגיות');
        return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          id="analysis-results"
          className="space-y-4"
        >
          {/* Executive Summary Card */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                <Sparkles className="w-5 h-5" />
                ניתוח AI מתקדם של השיחה
                <Badge className="bg-green-600 text-white text-xs mr-auto">GPT-5 FAST</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary – only sections that don't have a designated card below (avoid duplication) */}
              {parseAnalysisSummarySections(analysis.summary || '').filter(s => !isDesignatedSection(s.title)).map((section, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-sm">
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    {section.title}
                  </h4>
                  <div className="text-slate-700 leading-relaxed whitespace-pre-line">{section.content}</div>
                </div>
              ))}

              {/* Sentiment Meters */}
              {(analysis.excitement_level || analysis.seriousness_level || analysis.closing_probability) && (
                <div className="grid grid-cols-3 gap-3">
                  {analysis.excitement_level && (
                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">התלהבות</p>
                      <p className="text-2xl font-bold text-amber-600">{analysis.excitement_level}/10</p>
                    </div>
                  )}
                  {analysis.seriousness_level && (
                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">רצינות</p>
                      <p className="text-2xl font-bold text-blue-600">{analysis.seriousness_level}/10</p>
                    </div>
                  )}
                  {analysis.closing_probability && (
                    <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">סיכויי סגירה</p>
                      <p className="text-2xl font-bold text-green-600">{analysis.closing_probability}%</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Profile Card */}
          {analysis.client_info && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 text-sm">👤</span>
                  </span>
                  פרופיל לקוח
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {analysis.client_info.name && (
                      <p className="text-sm"><span className="text-slate-500">שם:</span> <span className="font-medium">{analysis.client_info.name}</span></p>
                    )}
                    {analysis.client_info.phone && (
                      <p className="text-sm"><span className="text-slate-500">טלפון:</span> <span className="font-medium" dir="ltr">{analysis.client_info.phone}</span></p>
                    )}
                    {analysis.client_info.email && (
                      <p className="text-sm"><span className="text-slate-500">אימייל:</span> <span className="font-medium">{analysis.client_info.email}</span></p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {analysis.client_info.profession && (
                      <p className="text-sm"><span className="text-slate-500">מקצוע:</span> <span className="font-medium">{analysis.client_info.profession}</span></p>
                    )}
                    {analysis.client_info.communication_style && (
                      <p className="text-sm"><span className="text-slate-500">סגנון תקשורת:</span> <span className="font-medium">{analysis.client_info.communication_style}</span></p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Needs Analysis Card */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-sm">🎯</span>
                </span>
                ניתוח צרכים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Explicit Needs */}
              {(analysis.explicit_needs?.length > 0 || analysis.main_needs?.length > 0) && (
                <div>
                  <h5 className="text-sm font-medium text-slate-700 mb-2">צרכים מפורשים</h5>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.explicit_needs || analysis.main_needs)?.map((need, idx) => (
                      <Badge key={idx} className="bg-purple-100 text-purple-800 hover:bg-purple-200">{need}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Implicit Needs */}
              {analysis.implicit_needs?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-700 mb-2">צרכים סמויים (בין השורות)</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.implicit_needs.map((need, idx) => (
                      <Badge key={idx} variant="outline" className="border-purple-300 text-purple-700">{need}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Emotional Needs */}
              {analysis.emotional_needs?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-slate-700 mb-2">צרכים רגשיים</h5>
                  <div className="flex flex-wrap gap-2">
                    {analysis.emotional_needs.map((need, idx) => (
                      <Badge key={idx} className="bg-pink-100 text-pink-800">{need}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback: content from parsed markdown section when no structured needs */}
              {!analysis.explicit_needs?.length && !analysis.main_needs?.length && !analysis.implicit_needs?.length && !analysis.emotional_needs?.length && needsContent && (
                <div className="text-slate-700 leading-relaxed whitespace-pre-line">{needsContent}</div>
              )}
            </CardContent>
          </Card>

          {/* Budget & Timeline Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm">💰</span>
                  </span>
                  תקציב
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.estimated_budget && (
                  <p className="text-lg font-bold text-green-700 mb-2">{analysis.estimated_budget}</p>
                )}
                {analysis.budget_flexibility && (
                  <Badge className={
                    analysis.budget_flexibility === 'high' ? 'bg-green-100 text-green-800' :
                    analysis.budget_flexibility === 'medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }>
                    גמישות: {analysis.budget_flexibility === 'high' ? 'גבוהה' : analysis.budget_flexibility === 'medium' ? 'בינונית' : 'נמוכה'}
                  </Badge>
                )}
                {!analysis.estimated_budget && !analysis.budget_flexibility && budgetContent && (
                  <div className="text-slate-700 leading-relaxed whitespace-pre-line">{budgetContent}</div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📅</span>
                  </span>
                  לוח זמנים
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.timeline && (
                  <p className="text-lg font-bold text-blue-700 mb-2">{analysis.timeline}</p>
                )}
                {analysis.urgency_level && (
                  <Badge className={
                    analysis.urgency_level === 'high' ? 'bg-red-100 text-red-800' :
                    analysis.urgency_level === 'medium' ? 'bg-amber-100 text-amber-800' :
                    'bg-green-100 text-green-800'
                  }>
                    דחיפות: {analysis.urgency_level === 'high' ? 'גבוהה' : analysis.urgency_level === 'medium' ? 'בינונית' : 'נמוכה'}
                  </Badge>
                )}
                {!analysis.timeline && !analysis.urgency_level && timelineContent && (
                  <div className="text-slate-700 leading-relaxed whitespace-pre-line">{timelineContent}</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Style Preferences Card */}
          {(analysis.style_preferences?.length > 0 || analysis.color_preferences?.length > 0 || analysis.material_preferences?.length > 0) && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <span className="text-amber-600 text-sm">🎨</span>
                  </span>
                  העדפות עיצוביות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.style_preferences?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {analysis.style_preferences.map((style, idx) => (
                      <Badge key={idx} className="bg-amber-100 text-amber-800">{style}</Badge>
                    ))}
                  </div>
                )}
                {analysis.color_preferences?.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500">צבעים: </span>
                    {analysis.color_preferences.join(', ')}
                  </div>
                )}
                {analysis.material_preferences?.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500">חומרים: </span>
                    {analysis.material_preferences.join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Concerns & Red Flags */}
          {(analysis.concerns?.length > 0 || analysis.red_flags?.length > 0) && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  חששות ודגלים אדומים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.concerns?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-red-700 mb-2">חששות שהועלו</h5>
                    <ul className="space-y-1">
                      {analysis.concerns.map((concern, idx) => (
                        <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis.red_flags?.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-red-800 mb-2">🚩 דגלים אדומים</h5>
                    <ul className="space-y-1">
                      {analysis.red_flags.map((flag, idx) => (
                        <li key={idx} className="text-sm text-red-800 font-medium flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0" />
                          {flag}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Strategic Recommendations Card */}
          <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-indigo-800">
                <span className="w-8 h-8 bg-indigo-200 rounded-lg flex items-center justify-center">
                  <span className="text-indigo-700 text-sm">🚀</span>
                </span>
                המלצות אסטרטגיות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Meeting Approach */}
              {analysis.meeting_approach && (
                <div className="bg-white rounded-lg p-3 border border-indigo-200">
                  <h5 className="text-sm font-medium text-indigo-700 mb-1">גישה מומלצת לפגישה</h5>
                  <p className="text-sm text-slate-700">{analysis.meeting_approach}</p>
                </div>
              )}

              {/* Leverage Points */}
              {analysis.leverage_points?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-green-700 mb-2">✓ נקודות למינוף</h5>
                  <ul className="space-y-1">
                    {analysis.leverage_points.map((point, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Points to Avoid */}
              {analysis.points_to_avoid?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-red-700 mb-2">✗ נקודות להימנע מהן</h5>
                  <ul className="space-y-1">
                    {analysis.points_to_avoid.map((point, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-red-600 text-xs">✗</span>
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {analysis.next_steps?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-indigo-700 mb-2">פעולות הבאות</h5>
                  <ul className="bg-white rounded-lg p-3 space-y-2 border border-indigo-200">
                    {analysis.next_steps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fallback: content from parsed markdown section when no structured strategic fields */}
              {!analysis.meeting_approach && !analysis.leverage_points?.length && !analysis.points_to_avoid?.length && !analysis.next_steps?.length && strategicContent && (
                <div className="text-slate-700 leading-relaxed whitespace-pre-line">{strategicContent}</div>
              )}
            </CardContent>
          </Card>

          {/* Continue Button */}
          <Card className="border-green-300 bg-green-50">
            <CardContent className="p-4">
              <Button 
                onClick={() => {
                  if (onContinue) onContinue();
                }}
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
              >
                המשך לפגישה פרונטלית
                <CheckCircle2 className="w-5 h-5 mr-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Transcription */}
          {transcription && (
            <Card className="border-slate-200 mt-4">
              <CardHeader>
                <CardTitle className="text-lg">תמלול מלא</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <p className="text-slate-700 whitespace-pre-wrap text-sm leading-relaxed">
                    {transcription}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
        );
      })()}

      {/* Meeting Scheduler Modal */}
      <ProjectMeetingSchedulerModal
        isOpen={showMeetingScheduler}
        onClose={() => setShowMeetingScheduler(false)}
        project={project}
        meetingTitle={`פגישה ראשונה - ${project?.name || ''}`}
        meetingContext={`פגישת היכרות ובירור צרכים עם ${project?.client || 'הלקוח'}`}
      />
    </div>
  );
}