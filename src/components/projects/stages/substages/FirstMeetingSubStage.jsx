import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { archiflow } from '@/api/archiflow';
import { 
  Users, 
  Mic, 
  Square,
  CheckCircle2,
  Loader2,
  Brain,
  Sparkles,
  ClipboardList,
  Save,
  Upload,
  FileAudio,
  Play,
  Pause,
  Scissors,
  Download,
  AlertCircle
} from 'lucide-react';
import { showSuccess, showError } from '../../../utils/notifications';
import { addMeetingToClientHistory } from '../../../utils/clientHistoryHelper';
import { getRecordingTags, getDocumentTags } from '../../../utils/autoTagging';
import { loadChecklistByProjectType, PROJECT_TYPES } from '../../../utils/checklistLoader';
import { downloadAudioFile, getAudioFilename } from '../../../utils/audioHelpers';
import { saveProjectAIInsights } from '../../../utils/aiInsightsManager';
import ProjectMeetingSchedulerModal from '../../scheduling/ProjectMeetingSchedulerModal';
import LargeAudioProcessor from '../../../audio/LargeAudioProcessor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Building, Building2, Briefcase, RefreshCw, Castle, UtensilsCrossed, Store, Sparkles as SparklesIcon } from 'lucide-react';

// Helper function to get icon component by project type
const getProjectTypeIcon = (projectType) => {
  const iconName = PROJECT_TYPES[projectType]?.icon;
  switch (iconName) {
    case 'Castle': return Castle;
    case 'UtensilsCrossed': return UtensilsCrossed;
    case 'Store': return Store;
    case 'Sparkles': return SparklesIcon;
    case 'Building2': return Building2;
    case 'Briefcase': return Briefcase;
    case 'Building': return Building;
    case 'Home':
    default: return Home;
  }
};

const MAX_CHUNK_SIZE = 25 * 1024 * 1024; // 25MB
const LARGE_FILE_THRESHOLD_MB = 24; // Files above this will use LargeAudioProcessor

export default function FirstMeetingSubStage({ project, onComplete, onContinue, onUpdate }) {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const chunkFilesRef = useRef([]);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  
  // Initialize checklist from SystemSettings or project
  const [checklist, setChecklist] = useState([]);
  const checklistLoadedRef = useRef(false); // ✅ Use ref to prevent re-initialization
  const [selectedProjectType, setSelectedProjectType] = useState(project?.project_type || 'renovation_apartment');
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  
  useEffect(() => {
    async function initChecklist() {
      // ✅ Safety check: ensure project exists
      if (!project) {
        console.warn('⚠️ No project provided to FirstMeetingSubStage');
        return;
      }
      
      try {
        // ✅ CRITICAL FIX: ALWAYS reload from project (remove the ref check)
        // This ensures we see updates when returning to this stage
        if (project?.client_needs_checklist && Array.isArray(project.client_needs_checklist) && project.client_needs_checklist.length > 0) {
          console.log('✅ Loading checklist from project:', project.client_needs_checklist.length, 'items');
          setChecklist(project.client_needs_checklist);
          if (project?.project_type) {
            setSelectedProjectType(project.project_type);
          }
        } else {
          // Only load default if we haven't loaded one yet
          if (!checklistLoadedRef.current) {
            const projectType = project?.project_type || 'renovation_apartment';
            console.log('📋 Loading default checklist for type:', projectType);
            setSelectedProjectType(projectType);
            const loadedChecklist = await loadChecklistByProjectType(projectType);
            setChecklist(loadedChecklist);
            checklistLoadedRef.current = true;
          }
        }
      } catch (error) {
        console.error('❌ Error loading checklist:', error);
        // Fallback to default checklist
        setChecklist(await loadChecklistByProjectType('renovation_apartment'));
      }
    }
    initChecklist();
  }, [project?.id, project?.client_needs_checklist]); // ✅ Depend on both ID and checklist

  // ✅ Load existing recording data from project on mount (PERSISTENCE FIX)
  useEffect(() => {
    async function loadExistingData() {
      // Skip if no project
      if (!project?.first_meeting_recording_id) return;
      
      // If we already have analysis loaded, don't reload
      if (analysis || transcription) return;
      
      try {
        const recordings = await archiflow.entities.Recording.filter({ 
          id: project.first_meeting_recording_id 
        });
        if (recordings.length > 0) {
          const recording = recordings[0];
          console.log('✅ Loading existing meeting recording:', recording.id);
          
          if (recording.transcription) {
            setTranscription(recording.transcription);
          }
          if (recording.analysis) {
            setAnalysis(recording.analysis);
            setProcessingState('done');
          }
          
          // ✅ CRITICAL FIX: Load audio URL for playback
          if (recording.audio_url) {
            setServerAudioUrl(recording.audio_url);
            setUploadedFileUrl(recording.audio_url);
            console.log('✅ Audio URL loaded from server:', recording.audio_url);
          }
        }
      } catch (err) {
        console.error('Could not load existing meeting:', err);
      }
    }
    loadExistingData();
  }, [project?.first_meeting_recording_id]);

  // Handle project type change - load new checklist
  const handleProjectTypeChange = async (newType) => {
    if (newType === selectedProjectType) return;
    
    // Confirm if checklist has been modified
    const hasModifications = checklist.some(item => item.checked || item.notes);
    if (hasModifications) {
      const confirmed = window.confirm('שינוי סוג הפרויקט יאפס את הצ׳קליסט הנוכחי. להמשיך?');
      if (!confirmed) return;
    }
    
    setIsLoadingChecklist(true);
    setSelectedProjectType(newType);
    
    try {
      const newChecklist = await loadChecklistByProjectType(newType);
      setChecklist(newChecklist);
      checklistLoadedRef.current = true; // ✅ Mark as loaded after manual change
      
      // Update project with new type
      if (project?.id && onUpdate) {
        await onUpdate({ project_type: newType, client_needs_checklist: [] });
      }
      
      showSuccess(`הצ׳קליסט עודכן ל${PROJECT_TYPES[newType]?.shortLabel || newType}`);
    } catch (error) {
      console.error('Error loading checklist:', error);
      showError('שגיאה בטעינת הצ׳קליסט');
    } finally {
      setIsLoadingChecklist(false);
    }
  };
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processingState, setProcessingState] = useState('idle');
  const [transcription, setTranscription] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [currentChunkSize, setCurrentChunkSize] = useState(0);
  const [uploadedChunks, setUploadedChunks] = useState([]);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [serverAudioUrl, setServerAudioUrl] = useState(null); // ✅ Store server URL separately
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [largeFileProcessing, setLargeFileProcessing] = useState(false);
  const [isLargeFile, setIsLargeFile] = useState(false);
  const [progressInfo, setProgressInfo] = useState({ stage: '', current: 0, total: 0, percent: 0, message: '' });

  const timerRef = useRef(null);

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
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleChecklistItem = (id, e) => {
    // Prevent event bubbling that might cause multiple toggles
    if (e) {
      e.stopPropagation();
    }
    const updated = checklist.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updated);
    // ✅ Auto-save on toggle
    if (project?.id && onUpdate) {
      onUpdate({ client_needs_checklist: updated });
    }
  };

  const updateChecklistNotes = (id, notes) => {
    const updated = checklist.map(item => 
      item.id === id ? { ...item, notes } : item
    );
    setChecklist(updated);
    autoSaveNotes(updated); // ✅ Trigger auto-save
  };
  
  // ✅ Auto-save notes after user stops typing (debounced)
  const debouncedSaveRef = useRef(null);
  const autoSaveNotes = (updatedChecklist) => {
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }
    debouncedSaveRef.current = setTimeout(() => {
      if (project?.id && onUpdate) {
        onUpdate({ client_needs_checklist: updatedChecklist });
        console.log('✅ Checklist auto-saved');
      }
    }, 1000); // Save 1 second after user stops typing
  };

  const saveChecklist = async () => {
    if (project?.id && onUpdate) {
      await onUpdate({ client_needs_checklist: checklist });
      showSuccess('הצ׳קליסט נשמר!');
    }
  };

  const saveCurrentChunk = async () => {
    if (chunksRef.current.length === 0) return;
    
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const chunkNumber = chunkFilesRef.current.length + 1;
    const file = new File([blob], `meeting_chunk_${chunkNumber}.webm`, { type: 'audio/webm' });
    
    chunkFilesRef.current.push(file);
    setUploadedChunks(prev => [...prev, { number: chunkNumber, size: blob.size }]);
    
    chunksRef.current = [];
    setCurrentChunkSize(0);
  };

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
          const totalSize = chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          setCurrentChunkSize(totalSize);
          
          if (totalSize >= MAX_CHUNK_SIZE) {
            await saveCurrentChunk();
          }
        }
      };

      mediaRecorder.onstop = async () => {
        if (chunksRef.current.length > 0) {
          await saveCurrentChunk();
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(5000);
      setIsRecording(true);
      setRecordingTime(0);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      showError('לא ניתן לגשת למיקרופון');
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Allow files up to 500MB - large files use LargeAudioProcessor with FFmpeg
      const MAX_UPLOAD_SIZE = 500 * 1024 * 1024; // 500MB
      if (file.size > MAX_UPLOAD_SIZE) {
        showError(`הקובץ גדול מדי. גודל מקסימלי: 500MB. גודל הקובץ: ${(file.size / (1024 * 1024)).toFixed(1)}MB`);
        return;
      }
      
      const fileSizeMB = file.size / (1024 * 1024);
      setIsLargeFile(fileSizeMB > LARGE_FILE_THRESHOLD_MB);
      
      setUploadedFile(file);
      setUploadedFileUrl(URL.createObjectURL(file));
      // Set it as the file to process
      chunkFilesRef.current = [file];
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) {
      console.error('❌ Audio ref is not available');
      return;
    }
    
    // ✅ Safety check: ensure audio has a valid source
    if (!audioRef.current.src || audioRef.current.src === '') {
      console.error('❌ No audio source available');
      showError('לא ניתן להפעיל - קובץ האודיו לא זמין');
      return;
    }
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('❌ Playback error:', err);
        showError('שגיאה בהפעלת האודיו');
      });
    }
    setIsPlaying(!isPlaying);
  };

  // Handler for large file processing completion
  const handleLargeFileComplete = async (result) => {
    console.log('Large file processing complete:', result);
    setLargeFileProcessing(false);
    
    // Continue with analysis using the transcription from LargeAudioProcessor
    // ✅ Pass the audio URL from the result for proper saving
    const audioUrl = result.audio_url || '';
    await analyzeAndSaveMeeting(result.transcription, audioUrl);
  };

  const handleLargeFileError = (error) => {
    console.error('Large file processing failed:', error);
    showError(`שגיאה בעיבוד קובץ גדול: ${error}`);
    setLargeFileProcessing(false);
    setProcessingState('idle');
    setProgressInfo({ stage: '', current: 0, total: 0, percent: 0, message: '' });
  };

  const handleLargeFileCancel = () => {
    setLargeFileProcessing(false);
    setProcessingState('idle');
    setProgressInfo({ stage: '', current: 0, total: 0, percent: 0, message: '' });
  };

  const processRecording = async () => {
    // Check if we have files to process - either from recording or uploaded file
    const filesToProcess = chunkFilesRef.current.length > 0 ? chunkFilesRef.current : (uploadedFile ? [uploadedFile] : []);
    
    if (filesToProcess.length === 0) {
      showError('אין הקלטה לעיבוד');
      return;
    }

    // For large files, use LargeAudioProcessor
    if (isLargeFile && uploadedFile) {
      setLargeFileProcessing(true);
      setProcessingState('uploading');
      return;
    }

    setProcessingState('uploading');
    const totalChunks = filesToProcess.length;
    
    try {
      const uploadedUrls = [];
      for (let i = 0; i < filesToProcess.length; i++) {
        const chunk = filesToProcess[i];
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
      
      // Continue with analysis
      await analyzeAndSaveMeeting(fullTranscription.trim(), uploadedUrls[0]);
      
    } catch (error) {
      console.error('Error processing recording:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'שגיאה לא ידועה';
      showError(`שגיאה בעיבוד: ${errorMessage}`);
      setProcessingState('idle');
      setProgressInfo({ stage: '', current: 0, total: 0, percent: 0, message: '' });
    }
  };

  // Separated analysis function for reuse
  const analyzeAndSaveMeeting = async (fullTranscription, audioUrl = '') => {
    setProcessingState('analyzing');
    setProgressInfo({
      stage: 'analyzing',
      current: 1,
      total: 1,
      percent: 50,
      message: 'מנתח את הפגישה עם AI...'
    });
    
    try {
      
      const checklistSummary = checklist
        .filter(item => item.checked)
        .map(item => `${item.item}: ${item.notes || 'ללא הערות'}`)
        .join('\n');
      
      // Load previous learnings for context
      let learningsContext = '';
      try {
        const learnings = await archiflow.entities.AILearning.filter({ is_active: true });
        if (learnings.length > 0) {
          learningsContext = '\n\n## תיקונים קודמים ללמידה:\n' + 
            learnings.slice(0, 20).map(l => `- "${l.original_value}" → "${l.corrected_value}" (${l.category})`).join('\n');
        }
      } catch (e) { console.log('No learnings loaded'); }

      // Build dynamic checklist items for AI analysis
      const checklistItemsForAI = checklist.map((item, idx) => ({
        id: item.id,
        index: idx,
        question: item.item
      }));

      const analysisResult = await archiflow.integrations.Core.InvokeLLM({
        prompt: `אתה מומחה לניתוח פגישות ראשונות עם לקוחות אדריכלות ויועץ אסטרטגי למשרדי אדריכלות מובילים. 
יש לך ניסיון עשיר בזיהוי צרכים, הבנת פסיכולוגיה של לקוחות, וחילוץ תובנות מתמלולי פגישות.
${learningsContext}

## המשימה שלך - ניתוח דו-שלבי:

### שלב 1: חילוץ מידע גולמי מהתמלול
קרא את תמלול הפגישה וחלץ את כל המידע העובדתי והחשוב, כולל:
- תקציב (כמה הלקוח מוכן להשקיע)
- לוח זמנים (מתי רוצים להתחיל/לסיים)
- סגנון עיצובי (מודרני, קלאסי, מינימלי וכו')
- חדרים נדרשים
- הרכב משפחתי (מבוגרים, ילדים, חיות מחמד)
- צרכים מיוחדים
- עדיפויות (מה הכי חשוב ללקוח)
- רפרנסים ודוגמאות
- העדפות צבע
- העדפות חומרים
- צרכי אחסון
- תאורה
- כל מידע רלוונטי אחר

### שלב 2: מיפוי סמנטי לצ'קליסט
כעת, עבור כל פריט בצ'קליסט, בצע **מיפוי סמנטי חכם**:
- חפש מידע שקשור לנושא השאלה (לא רק התאמה מילולית!)
- השתמש בהבנה הקשרית

**דוגמאות קונקרטיות מתחום האדריכלות:**

תמלול: "רוצים דירה מודרנית עם הרבה אור טבעי"
→ סגנון: "מודרני" ✓
→ תאורה: "הרבה אור טבעי" ✓

תמלול: "יש לנו 300 אלף שקל לכל הפרויקט"
→ תקציב: "300,000 ₪" ✓

תמלול: "צריכים 3 חדרי שינה וחדר עבודה"
→ חדרים: "3 חדרי שינה + חדר עבודה" ✓

**חוקי הזהב:**
1. **חפש התאמה סמנטית**, לא רק מילולית
2. **אם אתה רואה מידע רלוונטי - שייך אותו לפריט המתאים**
3. **כתוב את המידע האמיתי**, לא את שם השאלה
4. אם אין מידע - סמן answered=false
5. רמת ביטחון: 90-100 = בטוח מאוד, 70-89 = סביר, 50-69 = אולי, מתחת 50 = לא

## הנחיות ניתוח מתקדם:

### 1. סיכום מנהלים (Executive Summary)
- תמצת את עיקרי הפגישה ב-3-4 משפטים ברורים
- הדגש את ההזדמנות העסקית והפוטנציאל

### 2. פרופיל לקוח מלא
- שם מלא, טלפון, אימייל (אם הוזכרו)
- הסק מהפגישה: מקצוע, מצב משפחתי, רמה סוציו-אקונומית
- זהה את סגנון התקשורת: ישיר/עקיף, רגשי/רציונלי

### 3. צרכים ודרישות - ניתוח שכבות
- צרכים מפורשים (מה הלקוח אמר במפורש)
- צרכים סמויים (מה משתמע מבין השורות)
- צרכים רגשיים (מה הלקוח באמת מחפש - ביטחון, סטטוס, נוחות)

### 4. ניתוח פיננסי
- תקציב שהוזכר או משתמע
- גמישות תקציבית (נמוכה/בינונית/גבוהה)

### 5. לוח זמנים
- דחיפות הפרויקט
- מגבלות זמן

### 6. חששות, התנגדויות ודגלים אדומים
- חששות מפורשים
- התנגדויות פוטנציאליות
- דגלים אדומים (אם יש)

### 7. ניתוח סנטימנט
- רמת ההתלהבות (1-10)
- רמת הרצינות (1-10)
- סיכויי סגירה משוערים (אחוזים)

### 8. המלצות אסטרטגיות
- פעולות הבאות מומלצות
- נקודות למינוף
- נקודות להימנע מהן

תמלול הפגישה:
${fullTranscription}

הערות אדריכל:
${meetingNotes}

**רשימת פריטי הצ'קליסט לניתוח:**
${checklistItemsForAI.map(item => `${item.index + 1}. [ID: ${item.id}] ${item.question}`).join('\n')}`,
        response_json_schema: {
          type: 'object',
          properties: {
            executive_summary: { type: 'string', description: 'סיכום מנהלים של הפגישה' },
            client_needs: { type: 'array', items: { type: 'string' }, description: 'רשימת צרכי הלקוח' },
            explicit_needs: { type: 'array', items: { type: 'string' }, description: 'צרכים שהוזכרו במפורש' },
            implicit_needs: { type: 'array', items: { type: 'string' }, description: 'צרכים סמויים' },
            emotional_needs: { type: 'array', items: { type: 'string' }, description: 'צרכים רגשיים' },
            decisions: { type: 'array', items: { type: 'string' }, description: 'החלטות שהתקבלו' },
            action_items: { type: 'array', items: { type: 'string' }, description: 'פריטי פעולה' },
            next_steps: { type: 'array', items: { type: 'string' }, description: 'פעולות הבאות מומלצות' },
            budget_estimate: { type: 'string', description: 'הערכת תקציב' },
            budget_flexibility: { type: 'string', enum: ['low', 'medium', 'high'], description: 'גמישות תקציבית' },
            timeline_estimate: { type: 'string', description: 'הערכת לוח זמנים' },
            urgency_level: { type: 'string', enum: ['low', 'medium', 'high'], description: 'דחיפות' },
            style_preferences: { type: 'array', items: { type: 'string' }, description: 'העדפות סגנון' },
            color_preferences: { type: 'array', items: { type: 'string' }, description: 'העדפות צבע' },
            material_preferences: { type: 'array', items: { type: 'string' }, description: 'העדפות חומרים' },
            inspirations: { type: 'array', items: { type: 'string' }, description: 'רפרנסים והשראות' },
            concerns: { type: 'array', items: { type: 'string' }, description: 'חששות שהועלו' },
            red_flags: { type: 'array', items: { type: 'string' }, description: 'דגלים אדומים' },
            potential_objections: { type: 'array', items: { type: 'string' }, description: 'התנגדויות פוטנציאליות' },
            open_questions: { type: 'array', items: { type: 'string' }, description: 'שאלות שנשארו פתוחות' },
            leverage_points: { type: 'array', items: { type: 'string' }, description: 'נקודות למינוף' },
            points_to_avoid: { type: 'array', items: { type: 'string' }, description: 'נקודות להימנע מהן' },
            meeting_approach: { type: 'string', description: 'גישה מומלצת להמשך' },
            excitement_level: { type: 'number', description: 'רמת התלהבות 1-10' },
            seriousness_level: { type: 'number', description: 'רמת רצינות 1-10' },
            closing_probability: { type: 'number', description: 'סיכויי סגירה באחוזים' },
            raw_information_extracted: {
              type: 'object',
              description: 'שלב 1: כל המידע העובדתי שחולץ מהתמלול',
              properties: {
                budget: { type: 'string' },
                timeline: { type: 'string' },
                style: { type: 'string' },
                rooms: { type: 'string' },
                family: { type: 'string' },
                special_needs: { type: 'array', items: { type: 'string' } },
                priorities: { type: 'array', items: { type: 'string' } },
                references: { type: 'array', items: { type: 'string' } },
                colors: { type: 'string' },
                materials: { type: 'string' },
                storage: { type: 'string' },
                lighting: { type: 'string' },
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
                  answer_summary: { type: 'string', description: 'המידע הממשי מהתמלול. חובה: כתוב את התוכן האמיתי, לא את שם השאלה!' },
                  confidence: { type: 'number', description: 'רמת ביטחון 0-100. 90+ אם המידע ברור, 70-89 אם סביר, 50-69 אם אולי' },
                  source_text: { type: 'string', description: 'הציטוט המדויק מהתמלול שממנו לקחת את המידע' }
                }
              },
              description: 'שלב 2: מיפוי סמנטי של המידע לפריטי הצ׳קליסט. חובה לענות על פריטים שיש להם מידע רלוונטי!'
            },
            client_info: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string' },
                profession: { type: 'string' },
                family_status: { type: 'string' },
                adults_count: { type: 'number' },
                children_count: { type: 'number' },
                pets: { type: 'string' },
                communication_style: { type: 'string' },
                socio_economic_level: { type: 'string', enum: ['low', 'medium', 'high', 'very_high'] }
              }
            },
            program_data: {
              type: 'object',
              properties: {
                adults: { type: 'number' },
                children: { type: 'number' },
                pets: { type: 'string' },
                rooms_required: { type: 'array', items: { type: 'string' } },
                special_requests: { type: 'string' }
              }
            },
            speakers_identified: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['client', 'architect', 'other'] },
                  name: { type: 'string' }
                }
              }
            }
          }
        }
      });

      setAnalysis(analysisResult);

      // Auto-fill checklist based on AI checklist analysis
      // ✅ IMPORTANT: Only fill EMPTY fields, don't overwrite existing data
      let finalChecklist = checklist;
      if (analysisResult.checklist_analysis?.length > 0) {
        console.log('🤖 Raw Information Extracted:', analysisResult.raw_information_extracted);
        console.log('🤖 Checklist Analysis:', analysisResult.checklist_analysis);
        
        let filledCount = 0;
        let skippedCount = 0;
        
        const updatedChecklist = checklist.map(item => {
          if (!item?.id) return item;
          
          // ✅ Skip items that already have data (checked or have notes)
          if (item.checked || (item.notes && item.notes.trim() !== '')) {
            console.log(`⏭️ Skipping "${item.item}" - already has data`);
            skippedCount++;
            return item;
          }
          
          // Find matching analysis for this checklist item
          const itemAnalysis = analysisResult.checklist_analysis.find(
            analysis => analysis.id === item.id
          );
          
          if (itemAnalysis && itemAnalysis.answered && itemAnalysis.confidence >= 60) {
            console.log(`✅ Item "${item.item}" answered with confidence ${itemAnalysis.confidence}%`);
            console.log(`   Source: "${itemAnalysis.source_text}"`);
            console.log(`   Answer: "${itemAnalysis.answer_summary}"`);
            filledCount++;
            
            return { 
              ...item, 
              checked: true, 
              notes: itemAnalysis.answer_summary || '' 
            };
          }
          return item;
        });
        
        setChecklist(updatedChecklist);
        finalChecklist = updatedChecklist;
        
        if (filledCount > 0) {
          showSuccess(`הצ׳קליסט עודכן: ${filledCount} פריטים חדשים${skippedCount > 0 ? `, ${skippedCount} נשמרו כמו שהם` : ''}`);
        } else if (skippedCount > 0) {
          showSuccess(`כל הפריטים כבר מלאים - לא נדרס מידע קיים`);
        }
      }
      
      setProgressInfo({
        stage: 'analyzing',
        current: 1,
        total: 1,
        percent: 80,
        message: 'שומר את ההקלטה...'
      });
      
      // ✅ CRITICAL FIX: Use the SERVER URL (passed in), not the local blob URL!
      // audioUrl parameter now contains the server URL from upload
      const serverUrl = audioUrl || '';
      
      const recording = await archiflow.entities.Recording.create({
        title: `פגישה ראשונה - ${project?.name || 'פרויקט חדש'}`,
        audio_url: serverUrl, // ✅ Use server URL, not blob!
        transcription: fullTranscription,
        analysis: analysisResult,
        status: 'analyzed',
        project_id: project?.id ? String(project.id) : undefined,
        project_name: project?.name
      });

      // Generate automatic tags
      const autoTags = getRecordingTags('meeting', project, 'first_call');

      // Also save as project document with appropriate category and link to recording
      await archiflow.entities.Document.create({
        title: `הקלטת פגישה ראשונה - ${new Date().toLocaleDateString('he-IL')}`,
        file_url: serverUrl, // ✅ Use server URL here too!
        file_type: 'other',
        category: 'other',
        project_id: project?.id ? String(project.id) : undefined,
        project_name: project?.name,
        recording_id: recording.id,
        status: 'active',
        tags: autoTags,
        description: `הקלטת פגישה ראשונה עם הלקוח. תמלול ונותח אוטומטית.`
      });
      
      // ✅ NEW: Save AI insights using the centralized manager with source tracking
      if (project?.id) {
        try {
          const user = await archiflow.auth.me();
          const insightsResult = await saveProjectAIInsights({
            projectId: project.id,
            analysisData: {
              // Map analysis result to insights format
              budget_estimate: analysisResult.budget_estimate,
              timeline_estimate: analysisResult.timeline_estimate,
              location: analysisResult.raw_information_extracted?.location,
              property_size: analysisResult.raw_information_extracted?.size,
              summary: analysisResult.executive_summary,
              sentiment: {
                overall: analysisResult.urgency_level || 'neutral',
                score: analysisResult.closing_probability,
                key_emotions: []
              },
              client_needs: analysisResult.client_needs || [],
              explicit_needs: analysisResult.explicit_needs || [],
              implicit_needs: analysisResult.implicit_needs || [],
              style_preferences: analysisResult.style_preferences || [],
              decisions: analysisResult.decisions || [],
              action_items: (analysisResult.action_items || analysisResult.next_steps || []).map(item => 
                typeof item === 'string' ? { value: item } : item
              ),
              concerns: (analysisResult.concerns || []).map(c => 
                typeof c === 'string' ? { value: c, severity: 'medium' } : c
              ),
              follow_up_questions: (analysisResult.open_questions || []).map(q => 
                typeof q === 'string' ? { value: q, priority: 'medium' } : q
              ),
              key_topics: (analysisResult.raw_information_extracted?.other_info || []).map(t => ({ value: t })),
              strategic_recommendations: [
                ...(analysisResult.leverage_points || []).map(p => ({ value: p, priority: 'high' })),
                ...(analysisResult.meeting_approach ? [{ value: analysisResult.meeting_approach, priority: 'high' }] : [])
              ],
              rooms_required: (analysisResult.program_data?.rooms_required || []).map(r => ({ value: r })),
              materials_mentioned: (analysisResult.material_preferences || []).map(m => ({ value: m })),
              people_mentioned: (analysisResult.speakers_identified || []).map(s => ({ name: s.name, role: s.role })),
              financial_mentions: analysisResult.budget_estimate ? [{ amount: null, context: analysisResult.budget_estimate }] : []
            },
            source: {
              type: 'first_meeting',
              recordingId: recording.id,
              date: new Date().toISOString().split('T')[0],
              confidence: 0.90
            },
            triggeredBy: user?.email
          });
          
          console.log('✅ AI Insights saved:', insightsResult.message);
        } catch (insightsErr) {
          console.error('Could not save AI insights:', insightsErr);
        }
      }

      // Build legacy AI summary structure for backward compatibility
      const aiSummaryData = {
        client_needs: analysisResult.client_needs || [],
        decisions: analysisResult.decisions || [],
        action_items: analysisResult.action_items || [],
        budget_estimate: analysisResult.budget_estimate || '',
        timeline_estimate: analysisResult.timeline_estimate || '',
        style_preferences: analysisResult.style_preferences || [],
      };

      // Auto-update Client entity if we have client_id
      if (project?.client_id && analysisResult.client_info) {
        try {
          const clientUpdate = {};
          const ci = analysisResult.client_info;
          if (ci.profession) clientUpdate.profession = ci.profession;
          if (ci.family_status) clientUpdate.family_status = ci.family_status;
          if (ci.adults_count) clientUpdate.adults_count = ci.adults_count;
          if (ci.children_count) clientUpdate.children_count = ci.children_count;
          if (ci.pets) clientUpdate.pets = ci.pets;
          
          // Update preferences
          if (analysisResult.style_preferences?.length || analysisResult.color_preferences?.length) {
            const existingClient = await archiflow.entities.Client.filter({ id: project.client_id });
            if (existingClient.length > 0) {
              const prefs = existingClient[0].preferences || {};
              clientUpdate.preferences = {
                ...prefs,
                styles: [...new Set([...(prefs.styles || []), ...(analysisResult.style_preferences || [])])],
                colors: [...new Set([...(prefs.colors || []), ...(analysisResult.color_preferences || [])])],
                materials: [...new Set([...(prefs.materials || []), ...(analysisResult.material_preferences || [])])],
                inspirations: [...new Set([...(prefs.inspirations || []), ...(analysisResult.inspirations || [])])],
                budget_range: analysisResult.budget_estimate || prefs.budget_range
              };
            }
          }
          
          if (Object.keys(clientUpdate).length > 0) {
            await archiflow.entities.Client.update(project.client_id, clientUpdate);
            console.log('✅ Client updated with meeting insights');
          }
        } catch (clientErr) {
          console.log('Could not auto-update client:', clientErr);
        }
      }
      
      // ✅ CRITICAL FIX: Save with the FINAL checklist state (after AI updates) + audio URL
      if (project?.id && onUpdate) {
        const updateData = { 
          first_meeting_recording_id: recording.id,
          client_needs_checklist: finalChecklist,
          ai_summary: aiSummaryData
        };
        
        // ✅ Always save to project, waiting for completion
        await onUpdate(updateData);
        console.log('✅ Meeting data saved with updated checklist:', {
          recordingId: recording.id,
          checklistItems: finalChecklist.length,
          checkedItems: finalChecklist.filter(i => i.checked).length
        });
      }
      
      // Update analysis state to show in UI
      setAnalysis({ ...analysisResult, ...aiSummaryData });
      
      // Add to client history
      if (project?.client_id) {
        await addMeetingToClientHistory(project.client_id, {
          checklist,
          notes: meetingNotes,
          analysis: analysisResult
        }, project);
      }
      
      setProcessingState('done');
      setProgressInfo({
        stage: 'done',
        current: 1,
        total: 1,
        percent: 100,
        message: 'הושלם בהצלחה!'
      });
      showSuccess('הפגישה נותחה בהצלחה!');
      
      // Mark as complete but don't auto-advance
      if (onComplete) onComplete();
      
      // Scroll to results
      setTimeout(() => {
        const element = document.getElementById('meeting-analysis-results');
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

  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [expandedItems, setExpandedItems] = useState({});

  const completedItems = checklist.filter(item => item.checked).length;
  const progress = (completedItems / checklist.length) * 100;

  // Find first unchecked item
  const firstUncheckedIndex = checklist.findIndex(item => !item.checked);
  const currentActiveIndex = firstUncheckedIndex === -1 ? checklist.length - 1 : firstUncheckedIndex;

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Meeting Scheduler Modal */}
      <ProjectMeetingSchedulerModal
        isOpen={showMeetingScheduler}
        onClose={() => setShowMeetingScheduler(false)}
        project={project}
        meetingTitle={`פגישה ראשונה - ${project?.name || ''}`}
        meetingContext={`פגישת היכרות ובירור צרכים עם ${project?.client || 'הלקוח'}`}
      />

      {/* Checklist */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              צ׳קליסט בירור צרכים
            </CardTitle>
            <Badge className={progress === 100 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
              {completedItems}/{checklist.length}
            </Badge>
          </div>
          
          {/* Project Type Selector */}
          <div className="flex items-center gap-3 mt-4 p-3 bg-slate-50 rounded-xl">
            <span className="text-sm font-medium text-slate-600 flex-shrink-0">סוג פרויקט:</span>
            <Select
              value={selectedProjectType}
              onValueChange={handleProjectTypeChange}
              disabled={isLoadingChecklist}
            >
              <SelectTrigger className="flex-1 bg-white">
                <SelectValue>
                  {(() => {
                    const IconComponent = getProjectTypeIcon(selectedProjectType);
                    return (
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{PROJECT_TYPES[selectedProjectType]?.shortLabel || 'בחר סוג'}</span>
                      </div>
                    );
                  })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {Object.entries(PROJECT_TYPES).map(([key, config]) => {
                  const IconComponent = getProjectTypeIcon(key);
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{config.shortLabel}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {isLoadingChecklist && (
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
            )}
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
            <motion.div 
              className="bg-indigo-600 h-2 rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {progress === 100 && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-green-600 mt-2 font-medium"
            >
              ✓ כל הסעיפים הושלמו!
            </motion.p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {checklist.map((item, index) => {
              const isActive = index === currentActiveIndex && !item.checked;
              const isExpanded = expandedItems[item.id] || (item.checked && item.notes);
              
              return (
                <motion.div 
                  key={item.id}
                  id={`checklist-item-${item.id}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`rounded-xl border-2 transition-all duration-200 ${
                    item.checked 
                      ? 'bg-green-50 border-green-300' 
                      : isActive 
                        ? 'bg-indigo-50 border-indigo-400 shadow-md' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 p-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // ✅ Create updated list
                        const newList = [...checklist];
                        if (!item.checked) {
                          newList[index] = { ...newList[index], checked: true };
                          setExpandedItems(prev => ({ ...prev, [item.id]: true }));
                        } else {
                          newList[index] = { ...newList[index], checked: false, notes: '' };
                          setExpandedItems(prev => ({ ...prev, [item.id]: false }));
                        }

                        // ✅ Update state
                        setChecklist(newList);

                        // ✅ Auto-save immediately
                        if (project?.id && onUpdate) {
                          onUpdate({ client_needs_checklist: newList });
                        }
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        item.checked 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : isActive 
                            ? 'bg-indigo-500 animate-pulse hover:bg-indigo-600' 
                            : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                    >
                      {item.checked ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`font-medium ${
                        item.checked 
                          ? 'text-green-800' 
                          : isActive 
                            ? 'text-indigo-900' 
                            : 'text-slate-700'
                      }`}>
                        {item.item}
                      </p>
                      {item.checked && item.notes && !isExpanded && (
                        <p className="text-sm text-green-600 mt-1 truncate">{item.notes}</p>
                      )}
                    </div>
                    
                    {item.checked && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-red-500"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setChecklist(prev => {
                            const newList = [...prev];
                            const idx = newList.findIndex(i => i.id === item.id);
                            if (idx !== -1) {
                              newList[idx] = { ...newList[idx], checked: false, notes: '' };
                            }
                            return newList;
                          });
                          setExpandedItems(prev => ({ ...prev, [item.id]: false }));
                        }}
                      >
                        ביטול
                      </Button>
                    )}
                    
                    {isActive && !item.checked && (
                      <Badge className="bg-indigo-500 text-white text-xs">נוכחי</Badge>
                    )}
                  </div>
                  
                  {/* Expandable Notes Section */}
                  {item.checked && isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-4 pb-4"
                    >
                      <Textarea
                        placeholder="הוסף הערות, פרטים נוספים..."
                        value={item.notes}
                        onChange={(e) => updateChecklistNotes(item.id, e.target.value)}
                        className="text-sm min-h-[80px] bg-white border-green-200 focus:border-green-400"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          <div className="flex gap-3 mt-4">
            <Button onClick={saveChecklist} variant="outline" className="flex-1">
              <Save className="w-4 h-4 ml-2" />
              שמור צ׳קליסט
            </Button>
            {progress === 100 && (
              <Button 
                onClick={() => {
                  saveChecklist();
                  showSuccess('הצ׳קליסט הושלם!');
                }}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="w-4 h-4 ml-2" />
                סיים וממשיך
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recording */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic className="w-5 h-5 text-indigo-600" />
            הקלטת פגישה חיה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recording Options - Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live Recording */}
            <div className={`rounded-xl p-6 text-center ${isRecording ? 'bg-red-50' : 'bg-slate-50'}`}>
              <h3 className="font-semibold text-slate-900 mb-4">הקלטה חיה</h3>
              {isRecording ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Mic className="w-10 h-10 text-red-600" />
                  </div>
                  <p className="text-4xl font-mono font-bold text-red-600">{formatTime(recordingTime)}</p>
                  <p className="text-sm text-red-700">{uploadedChunks.length} חלקים נשמרו</p>
                  <Button onClick={stopRecording} size="lg" className="bg-red-600 hover:bg-red-700">
                    <Square className="w-5 h-5 ml-2" />
                    סיים הקלטה
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                    <Mic className="w-10 h-10 text-indigo-600" />
                  </div>
                  <Button 
                    onClick={startRecording} 
                    size="lg" 
                    className="bg-indigo-600 hover:bg-indigo-700" 
                    disabled={(processingState !== 'idle' && processingState !== 'done') || uploadedFile}
                  >
                    <Mic className="w-5 h-5 ml-2" />
                    התחל הקלטת פגישה
                  </Button>
                  <p className="text-xs text-slate-500">
                    הקלטות ארוכות יחולקו אוטומטית
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

          {/* Audio Preview - Shows for both uploaded file and existing recording */}
          {uploadedFileUrl && (
            <div className="bg-purple-50 rounded-xl p-4">
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
                    src={uploadedFileUrl}
                    onEnded={() => setIsPlaying(false)}
                    onError={(e) => console.log('Audio error:', e)}
                    crossOrigin="anonymous"
                    className="hidden"
                  />
                  <p className="text-sm font-medium text-purple-900">
                    {uploadedFile?.name || (serverAudioUrl ? 'הקלטה שמורה' : 'הקלטת פגישה')}
                  </p>
                  <p className="text-xs text-purple-600">
                    {uploadedFile 
                      ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB` 
                      : (serverAudioUrl ? 'נטען מהשרת' : '')
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Download Button - Uses helper for reliable download */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const filename = getAudioFilename(uploadedFileUrl, project?.name, 'meeting');
                      const result = await downloadAudioFile(uploadedFileUrl, filename);
                      if (!result.success) {
                        showError('שגיאה בהורדת הקובץ: ' + result.error);
                      }
                    }}
                    className="text-purple-600 hover:text-purple-700"
                  >
                    <Download className="w-4 h-4 ml-1" />
                    הורד
                  </Button>
                  {uploadedFile && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadedFileUrl(null);
                        chunkFilesRef.current = [];
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      הסר
                    </Button>
                  )}
                </div>
              </div>
              
              {/* ✅ NEW: Transcribe & Analyze Button - Always visible when audio exists */}
              <div className="mt-3 pt-3 border-t border-purple-200">
                <Button 
                  onClick={processRecording} 
                  className="w-full bg-indigo-600 hover:bg-indigo-700" 
                  disabled={processingState !== 'idle' && processingState !== 'done'}
                >
                  {processingState !== 'idle' && processingState !== 'done' ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      מעבד...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 ml-2" />
                      {analysis ? 'תמלל ונתח מחדש' : 'תמלל ונתח'}
                    </>
                  )}
                </Button>
                {analysis && (
                  <p className="text-xs text-purple-600 text-center mt-2">
                    * עיבוד מחדש ימלא רק שדות ריקים ולא ידרוס מידע קיים
                  </p>
                )}
              </div>
            </div>
          )}

          <Textarea
            placeholder="הערות אדריכל במהלך הפגישה..."
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            className="min-h-[100px]"
          />

          {/* Show process button only for live recordings (not uploaded files - they have their own button) */}
          {chunkFilesRef.current.length > 0 && !uploadedFile && !isRecording && processingState === 'idle' && (
            <div className="flex items-center gap-3">
              <Button onClick={processRecording} className="flex-1 bg-indigo-600 hover:bg-indigo-700" size="lg" disabled={largeFileProcessing}>
                <Brain className="w-5 h-5 ml-2" />
                עבד וניתח את הפגישה
              </Button>
            </div>
          )}

          {/* Large File Processor */}
          {largeFileProcessing && uploadedFile && (
            <LargeAudioProcessor
              file={uploadedFile}
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

      {/* Results - Enhanced with Full Analysis (matching PhoneCallSubStage) */}
      {processingState === 'done' && analysis && (
        <motion.div id="meeting-analysis-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Executive Summary Card */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                <Sparkles className="w-5 h-5" />
                ניתוח AI מתקדם - פגישה ראשונה
                <Badge className="bg-green-600 text-white text-xs mr-auto">GPT-5 FAST</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  סיכום מנהלים
                </h4>
                <p className="text-slate-700 leading-relaxed">{analysis.executive_summary || analysis.summary}</p>
              </div>

              {/* Sentiment Meters - NEW */}
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

          {/* Client Profile Card - Enhanced */}
          {analysis.client_info && Object.keys(analysis.client_info).length > 0 && (
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
                    {analysis.client_info.family_status && (
                      <p className="text-sm"><span className="text-slate-500">מצב משפחתי:</span> <span className="font-medium">{analysis.client_info.family_status}</span></p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Needs Analysis Card - Enhanced */}
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
              {(analysis.client_needs?.length > 0 || analysis.explicit_needs?.length > 0) && (
                <div>
                  <h5 className="text-sm font-medium text-slate-700 mb-2">צרכים מפורשים</h5>
                  <div className="flex flex-wrap gap-2">
                    {(analysis.client_needs || analysis.explicit_needs)?.map((need, idx) => (
                      <Badge key={idx} className="bg-purple-100 text-purple-800 hover:bg-purple-200">{need}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Implicit Needs - NEW */}
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

              {/* Emotional Needs - NEW */}
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
            </CardContent>
          </Card>

          {/* Budget & Timeline Card - Enhanced */}
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
                {analysis.budget_estimate && (
                  <p className="text-lg font-bold text-green-700 mb-2">{analysis.budget_estimate}</p>
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
                {analysis.timeline_estimate && (
                  <p className="text-lg font-bold text-blue-700 mb-2">{analysis.timeline_estimate}</p>
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
              </CardContent>
            </Card>
          </div>

          {/* Style Preferences Card - Enhanced */}
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
                {analysis.inspirations?.length > 0 && (
                  <div>
                    <span className="text-xs text-slate-500">השראות: </span>
                    {analysis.inspirations.join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Concerns & Red Flags - NEW */}
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

          {/* Strategic Recommendations Card - NEW */}
          {(analysis.meeting_approach || analysis.leverage_points?.length > 0 || analysis.points_to_avoid?.length > 0 || analysis.action_items?.length > 0 || analysis.next_steps?.length > 0) && (
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
                    <h5 className="text-sm font-medium text-indigo-700 mb-1">גישה מומלצת להמשך</h5>
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

                {/* Action Items / Next Steps */}
                {(analysis.action_items?.length > 0 || analysis.next_steps?.length > 0) && (
                  <div>
                    <h5 className="text-sm font-medium text-indigo-700 mb-2">פעולות הבאות</h5>
                    <ul className="bg-white rounded-lg p-3 space-y-2 border border-indigo-200">
                      {(analysis.action_items || analysis.next_steps)?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Continue Button */}
          <Card className="border-green-300 bg-green-50">
            <CardContent className="p-4">
              <Button 
                onClick={() => {
                  if (onContinue) onContinue();
                }} 
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
              >
                המשך ליצירת כרטיס לקוח
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
      )}
    </div>
  );
}