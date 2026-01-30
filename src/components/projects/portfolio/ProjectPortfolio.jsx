import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban,
  FileText,
  ListTodo,
  Brain,
  Phone,
  Users,
  Calendar,
  Download,
  Search,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Filter,
  LayoutGrid,
  List,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

import PortfolioSidebar from './PortfolioSidebar';
import PortfolioStageView from './PortfolioStageView';
import PortfolioDocumentsSection from './PortfolioDocumentsSection';
import PortfolioTasksSection from './PortfolioTasksSection';
import PortfolioAIInsights from './PortfolioAIInsights';
import PortfolioExportDialog from './PortfolioExportDialog';
import PortfolioChecklistsSection from './PortfolioChecklistsSection';
import ClientInfoCard from '../ClientInfoCard';
import ProjectDetailsCard from './ProjectDetailsCard';

// Stage configuration
const stageConfig = {
  first_call: { label: 'שיחה ראשונה', icon: Phone, color: 'indigo' },
  proposal: { label: 'הצעת מחיר', icon: FileText, color: 'green' },
  survey: { label: 'מדידה', icon: Calendar, color: 'blue' },
  concept: { label: 'קונספט', icon: Sparkles, color: 'purple' },
  gantt: { label: 'גנט', icon: Calendar, color: 'orange' },
  sketches: { label: 'סקיצות', icon: FileText, color: 'yellow' },
  rendering: { label: 'הדמיות', icon: FileText, color: 'pink' },
  technical: { label: 'תוכניות', icon: FileText, color: 'cyan' },
  selections: { label: 'בחירות', icon: ListTodo, color: 'amber' },
  execution: { label: 'ביצוע', icon: CheckCircle2, color: 'emerald' },
  completion: { label: 'גמר', icon: CheckCircle2, color: 'green' },
};

const stageOrder = ['first_call', 'proposal', 'survey', 'concept', 'gantt', 'sketches', 'rendering', 'technical', 'selections', 'execution', 'completion'];

export default function ProjectPortfolio({ project, onUpdate }) {
  const [activeSection, setActiveSection] = useState('overview'); // overview, documents, tasks, ai_insights, stage_xxx
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Fetch all project-related data
  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['portfolioDocuments', project?.id],
    queryFn: () => archiflow.entities.Document.filter({ project_id: String(project.id) }, '-created_date'),
    enabled: !!project?.id,
  });

  const { data: tasks = [], isLoading: loadingTasks } = useQuery({
    queryKey: ['portfolioTasks', project?.id],
    queryFn: () => archiflow.entities.Task.filter({ project_id: project?.id }, '-created_date'),
    enabled: !!project?.id,
  });

  const { data: recordings = [], isLoading: loadingRecordings } = useQuery({
    queryKey: ['portfolioRecordings', project?.id],
    queryFn: () => archiflow.entities.Recording.filter({ project_id: String(project.id) }, '-created_date'),
    enabled: !!project?.id,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ['portfolioProposals', project?.id],
    queryFn: () => archiflow.entities.Proposal.filter({ project_id: String(project.id) }, '-created_date'),
    enabled: !!project?.id,
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['portfolioJournal', project?.id],
    queryFn: () => archiflow.entities.JournalEntry.filter({ project_id: String(project.id) }, '-created_date'),
    enabled: !!project?.id,
  });

  // Organize data by stages
  const dataByStage = useMemo(() => {
    const stages = {};
    
    stageOrder.forEach(stageId => {
      stages[stageId] = {
        documents: documents.filter(d => d.tags?.includes(stageId) || d.category === stageId),
        tasks: tasks.filter(t => t.tags?.includes(stageId)),
        recordings: recordings.filter(r => r.tags?.includes(stageId)),
        insights: [],
      };
    });

    // First call specific data
    if (project?.ai_summary) {
      stages.first_call.insights.push({
        type: 'ai_analysis',
        title: 'ניתוח שיחת טלפון',
        data: project.ai_summary,
        date: project.created_date,
      });
    }

    if (project?.phone_call_checklist?.length > 0) {
      stages.first_call.checklist = project.phone_call_checklist;
    }

    // First meeting data
    if (project?.first_meeting_data) {
      stages.first_call.meetingData = project.first_meeting_data;
    }

    // Proposal data
    if (proposals.length > 0) {
      stages.proposal.proposals = proposals;
    }

    // Program data (concept stage)
    if (project?.program_data) {
      stages.concept.programData = project.program_data;
    }

    // Gantt data
    if (project?.gantt_data) {
      stages.gantt.ganttData = project.gantt_data;
    }

    return stages;
  }, [project, documents, tasks, recordings, proposals]);

  // Calculate statistics
  const stats = useMemo(() => ({
    totalDocuments: documents.length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    totalRecordings: recordings.length,
    activeStage: project?.status || 'first_call',
    completedStages: stageOrder.indexOf(project?.status || 'first_call'),
  }), [documents, tasks, recordings, project]);

  // Filter based on search
  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return documents;
    const q = searchQuery.toLowerCase();
    return documents.filter(d => 
      d.title?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q) ||
      d.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [documents, searchQuery]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(t => 
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  const isLoading = loadingDocs || loadingTasks || loadingRecordings;

  // Render section content based on activeSection
  const renderContent = () => {
    if (activeSection === 'overview') {
      return (
        <div className="space-y-6">
          {/* Project Details */}
          <ProjectDetailsCard project={project} onUpdate={onUpdate} />
          
          {/* Client Info */}
          <ClientInfoCard project={project} onUpdate={onUpdate} />
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalDocuments}</p>
                    <p className="text-xs text-slate-500">מסמכים</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                    <ListTodo className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.completedTasks}/{stats.totalTasks}</p>
                    <p className="text-xs text-slate-500">משימות</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalRecordings}</p>
                    <p className="text-xs text-slate-500">הקלטות</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{stats.completedStages}/{stageOrder.length}</p>
                    <p className="text-xs text-slate-500">שלבים</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Summary Preview */}
          {project?.ai_summary && (
            <PortfolioAIInsights 
              aiSummary={project.ai_summary} 
              compact={true}
              onExpand={() => setActiveSection('ai_insights')}
            />
          )}

          {/* Recent Activity Timeline */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-500" />
                פעילות אחרונה
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...documents, ...tasks, ...recordings]
                  .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                  .slice(0, 5)
                  .map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                      <div className={`w-2 h-2 rounded-full ${
                        item.audio_url ? 'bg-purple-500' : 
                        item.file_url ? 'bg-indigo-500' : 'bg-amber-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(item.created_date), 'd בMMMM yyyy', { locale: he })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.audio_url ? 'הקלטה' : item.file_url ? 'מסמך' : 'משימה'}
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSection === 'checklists') {
      return (
        <PortfolioChecklistsSection 
          project={project}
          onUpdate={onUpdate}
        />
      );
    }

    if (activeSection === 'documents') {
      return (
        <PortfolioDocumentsSection 
          documents={filteredDocuments}
          project={project}
          isLoading={loadingDocs}
        />
      );
    }

    if (activeSection === 'tasks') {
      return (
        <PortfolioTasksSection 
          tasks={filteredTasks}
          project={project}
          isLoading={loadingTasks}
        />
      );
    }

    if (activeSection === 'ai_insights') {
      return (
        <PortfolioAIInsights 
          aiSummary={project?.ai_summary}
          recordings={recordings}
          checklists={{
            phoneCall: project?.phone_call_checklist,
            firstMeeting: project?.first_meeting_checklist,
          }}
        />
      );
    }

    // Stage-specific view
    if (activeSection.startsWith('stage_')) {
      const stageId = activeSection.replace('stage_', '');
      return (
        <PortfolioStageView
          stageId={stageId}
          stageConfig={stageConfig[stageId]}
          stageData={dataByStage[stageId]}
          project={project}
          onUpdate={onUpdate}
        />
      );
    }

    return null;
  };

  return (
    <div className="flex gap-4 h-[700px]">
      {/* Sidebar Navigation */}
      <PortfolioSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        stages={stageOrder.map(id => ({ id, ...stageConfig[id] }))}
        currentStage={project?.status || 'first_call'}
        stats={stats}
        dataByStage={dataByStage}
      />

      {/* Main Content */}
      <Card className="flex-1 border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <CardHeader className="border-b border-slate-100 pb-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">תיק פרויקט</h2>
                <p className="text-sm text-slate-500">כל המידע והנתונים במקום אחד</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="חיפוש בתיק..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-9"
                />
              </div>

              {/* Export Button */}
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(true)}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                ייצוא
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Export Dialog */}
      <PortfolioExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        project={project}
        documents={documents}
        tasks={tasks}
        recordings={recordings}
      />
    </div>
  );
}