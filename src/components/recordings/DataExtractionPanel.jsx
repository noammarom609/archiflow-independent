import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import {
  User, Building2, DollarSign, Calendar, Palette, CheckCircle2,
  Edit3, Save, X, ChevronDown, ChevronUp, Sparkles, AlertTriangle,
  Plus, Trash2, Send, BookOpen, Bell, ArrowRight, Info, RefreshCw
} from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';

export default function DataExtractionPanel({ 
  recording, 
  analysis,
  deepAnalysis,
  project,
  client,
  onApprove,
  onCancel 
}) {
  // Tab state
  const [activeTab, setActiveTab] = useState('client');
  
  // Editable data state
  const [clientData, setClientData] = useState({});
  const [projectData, setProjectData] = useState({});
  const [tasksData, setTasksData] = useState([]);
  const [journalData, setJournalData] = useState({ enabled: false, content: '' });
  const [emailData, setEmailData] = useState({ enabled: false, subject: '', body: '' });
  
  // Track changes for feedback loop
  const [originalData, setOriginalData] = useState({});
  const [changedFields, setChangedFields] = useState(new Set());
  
  // Selection state for what to apply
  const [selections, setSelections] = useState({
    updateClient: true,
    updateProject: true,
    createTasks: false,
    createJournal: false,
    sendEmail: false
  });

  // Load existing projects and clients for matching
  const { data: existingProjects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => archiflow.entities.Project.list(),
  });

  const { data: existingClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => archiflow.entities.Client.list(),
  });

  // Load AI learnings for context enhancement
  const { data: aiLearnings = [] } = useQuery({
    queryKey: ['ai-learnings'],
    queryFn: () => archiflow.entities.AILearning.filter({ is_active: true }),
  });

  // Initialize data from analysis
  useEffect(() => {
    if (analysis || deepAnalysis) {
      initializeFromAnalysis();
    }
  }, [analysis, deepAnalysis]);

  const initializeFromAnalysis = () => {
    // Apply learnings to improve extracted data
    const learningMap = buildLearningMap(aiLearnings);
    
    // Client data extraction
    const extractedClient = {
      full_name: applyLearning(analysis?.client_info?.name || deepAnalysis?.people_mentioned?.[0]?.name || '', 'client_info', learningMap),
      phone: client?.phone || analysis?.client_info?.phone || '',
      email: client?.email || analysis?.client_info?.email || '',
      profession: analysis?.client_info?.profession || '',
      family_status: analysis?.client_info?.family_status || 'unknown',
      adults_count: analysis?.program_data?.adults || null,
      children_count: analysis?.program_data?.children || null,
      pets: analysis?.program_data?.pets || '',
      address: project?.location || '',
      preferences: {
        styles: analysis?.style_preferences || [],
        colors: analysis?.color_preferences || [],
        materials: analysis?.material_preferences || [],
        budget_range: analysis?.estimated_budget || '',
        priorities: analysis?.explicit_needs || [],
        inspirations: analysis?.inspirations || []
      },
      ai_insights: {
        communication_style: analysis?.client_info?.communication_style || '',
        emotional_needs: analysis?.emotional_needs || [],
        key_concerns: analysis?.concerns || [],
        red_flags: analysis?.red_flags || [],
        leverage_points: analysis?.leverage_points || [],
        closing_probability: analysis?.closing_probability || null
      }
    };

    // Project data extraction
    const extractedProject = {
      budget: analysis?.estimated_budget || '',
      timeline: analysis?.timeline || analysis?.timeline_estimate || '',
      location: project?.location || '',
      description: analysis?.summary || '',
      program_data: {
        adults: analysis?.program_data?.adults || null,
        children: analysis?.program_data?.children || null,
        pets: analysis?.program_data?.pets || '',
        rooms_required: analysis?.program_data?.rooms_required || [],
        style_notes: analysis?.style_preferences?.join(', ') || '',
        special_requests: analysis?.implicit_needs?.join(', ') || ''
      }
    };

    // Tasks extraction from deep analysis
    const extractedTasks = (deepAnalysis?.action_items || analysis?.next_steps || []).map((item, idx) => ({
      id: `task_${idx}`,
      enabled: true,
      title: typeof item === 'string' ? item : item.task,
      assignee: typeof item === 'object' ? item.assignee : '',
      deadline: typeof item === 'object' ? item.deadline : '',
      priority: typeof item === 'object' ? item.priority : 'medium'
    }));

    // Journal content
    const journalContent = `## סיכום פגישה\n${analysis?.summary || ''}\n\n### נושאים שנדונו\n${analysis?.topics?.map(t => `- ${t}`).join('\n') || ''}\n\n### החלטות\n${analysis?.decisions?.map(d => `- ${d}`).join('\n') || ''}`;

    // Email template
    const emailSubject = `תודה על הפגישה - ${project?.name || 'פרויקט חדש'}`;
    const emailBody = `שלום ${extractedClient.full_name || ''},\n\nתודה על הפגישה היום.\n\n${analysis?.meeting_approach || 'אשמח להמשיך בתהליך.'}\n\nלהלן הצעדים הבאים:\n${extractedTasks.slice(0, 3).map(t => `• ${t.title}`).join('\n')}\n\nאשמח לשמוע ממך,`;

    setClientData(extractedClient);
    setProjectData(extractedProject);
    setTasksData(extractedTasks);
    setJournalData({ enabled: false, content: journalContent });
    setEmailData({ enabled: false, subject: emailSubject, body: emailBody });
    
    // Store original for diff tracking
    setOriginalData({
      client: JSON.parse(JSON.stringify(extractedClient)),
      project: JSON.parse(JSON.stringify(extractedProject)),
      tasks: JSON.parse(JSON.stringify(extractedTasks))
    });
  };

  // Build learning map from saved corrections
  const buildLearningMap = (learnings) => {
    const map = {};
    learnings.forEach(l => {
      const key = `${l.category}_${l.original_value.toLowerCase()}`;
      if (!map[key]) map[key] = [];
      map[key].push(l);
    });
    return map;
  };

  // Apply learned corrections
  const applyLearning = (value, category, learningMap) => {
    if (!value) return value;
    const key = `${category}_${value.toLowerCase()}`;
    const learnings = learningMap[key];
    if (learnings && learnings.length > 0) {
      // Use the most used correction
      const best = learnings.sort((a, b) => b.usage_count - a.usage_count)[0];
      return best.corrected_value;
    }
    return value;
  };

  // Track field changes
  const handleFieldChange = (section, field, value) => {
    const fieldKey = `${section}.${field}`;
    setChangedFields(prev => new Set([...prev, fieldKey]));
    
    if (section === 'client') {
      setClientData(prev => ({ ...prev, [field]: value }));
    } else if (section === 'project') {
      setProjectData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle nested field changes
  const handleNestedChange = (section, parent, field, value) => {
    const fieldKey = `${section}.${parent}.${field}`;
    setChangedFields(prev => new Set([...prev, fieldKey]));
    
    if (section === 'client') {
      setClientData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [field]: value }
      }));
    } else if (section === 'project') {
      setProjectData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [field]: value }
      }));
    }
  };

  // Handle task changes
  const handleTaskChange = (taskId, field, value) => {
    setTasksData(prev => prev.map(t => 
      t.id === taskId ? { ...t, [field]: value } : t
    ));
    setChangedFields(prev => new Set([...prev, `tasks.${taskId}.${field}`]));
  };

  // Add new task
  const addTask = () => {
    const newTask = {
      id: `task_new_${Date.now()}`,
      enabled: true,
      title: '',
      assignee: '',
      deadline: '',
      priority: 'medium'
    };
    setTasksData(prev => [...prev, newTask]);
  };

  // Remove task
  const removeTask = (taskId) => {
    setTasksData(prev => prev.filter(t => t.id !== taskId));
  };

  // Save corrections to AILearning
  const saveCorrections = async () => {
    const corrections = [];
    
    changedFields.forEach(fieldKey => {
      const [section, ...rest] = fieldKey.split('.');
      const field = rest.join('.');
      
      let originalValue, correctedValue, category;
      
      if (section === 'client') {
        originalValue = getNestedValue(originalData.client, field);
        correctedValue = getNestedValue(clientData, field);
        category = 'client_info';
      } else if (section === 'project') {
        originalValue = getNestedValue(originalData.project, field);
        correctedValue = getNestedValue(projectData, field);
        category = field.includes('budget') ? 'budget' : 
                   field.includes('timeline') ? 'timeline' : 'project_details';
      }
      
      if (originalValue !== correctedValue && originalValue && correctedValue) {
        corrections.push({
          learning_type: 'analysis_correction',
          original_value: String(originalValue),
          corrected_value: String(correctedValue),
          field_name: field,
          category,
          source_recording_id: recording?.id,
          context: analysis?.summary?.slice(0, 200) || ''
        });
      }
    });

    // Save corrections to database
    for (const correction of corrections) {
      try {
        await archiflow.entities.AILearning.create(correction);
      } catch (err) {
        console.error('Error saving correction:', err);
      }
    }

    return corrections.length;
  };

  // Helper to get nested value
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  };

  // Handle final approval
  const handleApprove = async () => {
    try {
      // Save corrections first (feedback loop)
      const correctionCount = await saveCorrections();
      if (correctionCount > 0) {
        showSuccess(`נשמרו ${correctionCount} תיקונים ללמידה`);
      }

      // Prepare data for distribution
      const approvalData = {
        recording,
        selections,
        clientData: selections.updateClient ? clientData : null,
        projectData: selections.updateProject ? projectData : null,
        tasks: selections.createTasks ? tasksData.filter(t => t.enabled) : [],
        journal: selections.createJournal ? journalData : null,
        email: selections.sendEmail ? emailData : null,
        changedFields: Array.from(changedFields)
      };

      onApprove(approvalData);
    } catch (error) {
      showError('שגיאה בשמירה: ' + error.message);
    }
  };

  // Render field with edit indicator
  const renderField = (label, value, onChange, options = {}) => {
    const { type = 'text', placeholder = '', multiline = false, fieldKey = '' } = options;
    const isChanged = changedFields.has(fieldKey);
    
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
          {label}
          {isChanged && (
            <Badge className="bg-amber-100 text-amber-700 text-[10px] px-1">שונה</Badge>
          )}
        </label>
        {multiline ? (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`text-sm ${isChanged ? 'border-amber-300 bg-amber-50' : ''}`}
          />
        ) : (
          <Input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`text-sm ${isChanged ? 'border-amber-300 bg-amber-50' : ''}`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Header with selections */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              בחר מה להטמיע במערכת
            </h3>
            <Badge className="bg-indigo-600 text-white">
              {changedFields.size} שינויים
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: 'updateClient', label: 'עדכון לקוח', icon: User, auto: true },
              { key: 'updateProject', label: 'עדכון פרויקט', icon: Building2, auto: true },
              { key: 'createTasks', label: 'יצירת משימות', icon: CheckCircle2, auto: false },
              { key: 'createJournal', label: 'רשומת יומן', icon: BookOpen, auto: false },
              { key: 'sendEmail', label: 'שליחת מייל', icon: Send, auto: false },
            ].map(item => (
              <div 
                key={item.key}
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                  selections[item.key] 
                    ? 'bg-white border-2 border-indigo-400 shadow-sm' 
                    : 'bg-white/50 border border-transparent'
                }`}
                onClick={() => setSelections(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
              >
                <Checkbox 
                  checked={selections[item.key]}
                  onCheckedChange={(checked) => setSelections(prev => ({ ...prev, [item.key]: checked }))}
                />
                <item.icon className={`w-4 h-4 ${selections[item.key] ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`text-xs ${selections[item.key] ? 'text-indigo-900 font-medium' : 'text-slate-600'}`}>
                  {item.label}
                </span>
                {item.auto && (
                  <Badge className="bg-green-100 text-green-700 text-[8px] px-1">אוטו</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different data sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="client" className="gap-1">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">לקוח</span>
          </TabsTrigger>
          <TabsTrigger value="project" className="gap-1">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">פרויקט</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="hidden sm:inline">משימות</span>
          </TabsTrigger>
          <TabsTrigger value="journal" className="gap-1">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">יומן</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1">
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">מייל</span>
          </TabsTrigger>
        </TabsList>

        {/* Client Tab */}
        <TabsContent value="client" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                פרטי לקוח
                {!selections.updateClient && (
                  <Badge className="bg-slate-200 text-slate-600 mr-auto">לא נבחר לעדכון</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={`space-y-4 ${!selections.updateClient ? 'opacity-50' : ''}`}>
              <div className="grid grid-cols-2 gap-4">
                {renderField('שם מלא', clientData.full_name, 
                  (v) => handleFieldChange('client', 'full_name', v),
                  { fieldKey: 'client.full_name' }
                )}
                {renderField('טלפון', clientData.phone,
                  (v) => handleFieldChange('client', 'phone', v),
                  { fieldKey: 'client.phone' }
                )}
                {renderField('אימייל', clientData.email,
                  (v) => handleFieldChange('client', 'email', v),
                  { type: 'email', fieldKey: 'client.email' }
                )}
                {renderField('מקצוע', clientData.profession,
                  (v) => handleFieldChange('client', 'profession', v),
                  { fieldKey: 'client.profession' }
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">מצב משפחתי</label>
                  <Select 
                    value={clientData.family_status || 'unknown'}
                    onValueChange={(v) => handleFieldChange('client', 'family_status', v)}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">לא ידוע</SelectItem>
                      <SelectItem value="single">רווק/ה</SelectItem>
                      <SelectItem value="married">נשוי/אה</SelectItem>
                      <SelectItem value="married_with_kids">נשוי/אה + ילדים</SelectItem>
                      <SelectItem value="divorced">גרוש/ה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {renderField('מספר מבוגרים', clientData.adults_count,
                  (v) => handleFieldChange('client', 'adults_count', parseInt(v) || null),
                  { type: 'number', fieldKey: 'client.adults_count' }
                )}
                {renderField('מספר ילדים', clientData.children_count,
                  (v) => handleFieldChange('client', 'children_count', parseInt(v) || null),
                  { type: 'number', fieldKey: 'client.children_count' }
                )}
              </div>

              {renderField('כתובת', clientData.address,
                (v) => handleFieldChange('client', 'address', v),
                { fieldKey: 'client.address' }
              )}

              {/* Preferences Section */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-600" />
                  העדפות עיצוביות
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">סגנונות</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {clientData.preferences?.styles?.map((style, idx) => (
                        <Badge key={idx} className="bg-purple-100 text-purple-800">
                          {style}
                          <button 
                            className="mr-1 hover:text-red-600"
                            onClick={() => {
                              const newStyles = clientData.preferences.styles.filter((_, i) => i !== idx);
                              handleNestedChange('client', 'preferences', 'styles', newStyles);
                            }}
                          >×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">צבעים</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {clientData.preferences?.colors?.map((color, idx) => (
                        <Badge key={idx} className="bg-blue-100 text-blue-800">{color}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">חומרים</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {clientData.preferences?.materials?.map((mat, idx) => (
                        <Badge key={idx} className="bg-amber-100 text-amber-800">{mat}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Insights Section */}
              {clientData.ai_insights && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    תובנות AI
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {clientData.ai_insights.communication_style && (
                      <div>
                        <span className="text-slate-500">סגנון תקשורת:</span>
                        <span className="font-medium mr-1">{clientData.ai_insights.communication_style}</span>
                      </div>
                    )}
                    {clientData.ai_insights.closing_probability && (
                      <div>
                        <span className="text-slate-500">סיכוי סגירה:</span>
                        <span className="font-medium mr-1">{clientData.ai_insights.closing_probability}%</span>
                      </div>
                    )}
                  </div>
                  {clientData.ai_insights.red_flags?.length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-red-700 text-sm font-medium flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        דגלים אדומים:
                      </span>
                      <ul className="text-sm text-red-600 mt-1">
                        {clientData.ai_insights.red_flags.map((flag, idx) => (
                          <li key={idx}>• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Tab */}
        <TabsContent value="project" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-600" />
                פרטי פרויקט
                {!selections.updateProject && (
                  <Badge className="bg-slate-200 text-slate-600 mr-auto">לא נבחר לעדכון</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className={`space-y-4 ${!selections.updateProject ? 'opacity-50' : ''}`}>
              <div className="grid grid-cols-2 gap-4">
                {renderField('תקציב משוער', projectData.budget,
                  (v) => handleFieldChange('project', 'budget', v),
                  { fieldKey: 'project.budget', placeholder: 'לדוגמה: 200,000-300,000 ₪' }
                )}
                {renderField('לוח זמנים', projectData.timeline,
                  (v) => handleFieldChange('project', 'timeline', v),
                  { fieldKey: 'project.timeline', placeholder: 'לדוגמה: 6 חודשים' }
                )}
              </div>
              
              {renderField('מיקום', projectData.location,
                (v) => handleFieldChange('project', 'location', v),
                { fieldKey: 'project.location' }
              )}

              {renderField('תיאור/סיכום', projectData.description,
                (v) => handleFieldChange('project', 'description', v),
                { fieldKey: 'project.description', multiline: true }
              )}

              {/* Program Data */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-900 mb-3">תכנית</h4>
                <div className="grid grid-cols-2 gap-4">
                  {renderField('הערות סגנון', projectData.program_data?.style_notes,
                    (v) => handleNestedChange('project', 'program_data', 'style_notes', v),
                    { fieldKey: 'project.program_data.style_notes' }
                  )}
                  {renderField('בקשות מיוחדות', projectData.program_data?.special_requests,
                    (v) => handleNestedChange('project', 'program_data', 'special_requests', v),
                    { fieldKey: 'project.program_data.special_requests', multiline: true }
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-amber-600" />
                  משימות ({tasksData.filter(t => t.enabled).length})
                </CardTitle>
                <Button size="sm" variant="outline" onClick={addTask}>
                  <Plus className="w-4 h-4 ml-1" />
                  הוסף משימה
                </Button>
              </div>
              {!selections.createTasks && (
                <Badge className="bg-slate-200 text-slate-600 mt-2">דורש אישור</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {tasksData.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border transition-all ${
                    task.enabled ? 'bg-white border-amber-200' : 'bg-slate-50 border-slate-200 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={task.enabled}
                      onCheckedChange={(checked) => handleTaskChange(task.id, 'enabled', checked)}
                      className="mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <Input
                        value={task.title}
                        onChange={(e) => handleTaskChange(task.id, 'title', e.target.value)}
                        placeholder="תיאור המשימה"
                        className="text-sm"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={task.assignee}
                          onChange={(e) => handleTaskChange(task.id, 'assignee', e.target.value)}
                          placeholder="אחראי"
                          className="text-sm"
                        />
                        <Input
                          type="date"
                          value={task.deadline}
                          onChange={(e) => handleTaskChange(task.id, 'deadline', e.target.value)}
                          className="text-sm"
                        />
                        <Select
                          value={task.priority}
                          onValueChange={(v) => handleTaskChange(task.id, 'priority', v)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">נמוכה</SelectItem>
                            <SelectItem value="medium">בינונית</SelectItem>
                            <SelectItem value="high">גבוהה</SelectItem>
                            <SelectItem value="urgent">דחופה</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-slate-400 hover:text-red-600"
                      onClick={() => removeTask(task.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
              {tasksData.length === 0 && (
                <div className="text-center text-slate-500 py-8">
                  לא זוהו משימות בהקלטה
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Journal Tab */}
        <TabsContent value="journal" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  רשומת יומן
                </CardTitle>
                <Switch
                  checked={journalData.enabled}
                  onCheckedChange={(checked) => {
                    setJournalData(prev => ({ ...prev, enabled: checked }));
                    setSelections(prev => ({ ...prev, createJournal: checked }));
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className={!journalData.enabled ? 'opacity-50' : ''}>
              <Textarea
                value={journalData.content}
                onChange={(e) => setJournalData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="תוכן הרשומה..."
                className="min-h-[200px] text-sm"
                disabled={!journalData.enabled}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="w-5 h-5 text-green-600" />
                  מייל ללקוח
                </CardTitle>
                <Switch
                  checked={emailData.enabled}
                  onCheckedChange={(checked) => {
                    setEmailData(prev => ({ ...prev, enabled: checked }));
                    setSelections(prev => ({ ...prev, sendEmail: checked }));
                  }}
                />
              </div>
            </CardHeader>
            <CardContent className={`space-y-3 ${!emailData.enabled ? 'opacity-50' : ''}`}>
              <Input
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="נושא המייל"
                disabled={!emailData.enabled}
              />
              <Textarea
                value={emailData.body}
                onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="תוכן המייל..."
                className="min-h-[200px] text-sm"
                disabled={!emailData.enabled}
              />
              {emailData.enabled && !clientData.email && (
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-700 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  לא נמצא אימייל ללקוח
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t sticky bottom-0 bg-white pb-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Info className="w-4 h-4" />
          תיקונים שלך ישמרו לשיפור הניתוח בעתיד
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel}>
            ביטול
          </Button>
          <Button 
            onClick={handleApprove}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            אשר והטמע ({Object.values(selections).filter(Boolean).length} פעולות)
          </Button>
        </div>
      </div>
    </div>
  );
}