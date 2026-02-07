import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  FileText,
  ListTodo,
  Brain,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Play,
  ClipboardList,
  Sparkles,
  Calendar,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { formatDurationDisplay } from '@/utils/duration';

export default function PortfolioStageView({ stageId, stageConfig, stageData, project, onUpdate }) {
  const [activeTab, setActiveTab] = useState('summary');
  
  const { documents = [], tasks = [], recordings = [], insights = [], checklist, proposals, programData, ganttData, meetingData } = stageData || {};

  const hasDocuments = documents.length > 0;
  const hasTasks = tasks.length > 0;
  const hasRecordings = recordings.length > 0;
  const hasInsights = insights.length > 0 || project?.ai_summary;
  const hasChecklist = checklist && checklist.length > 0;
  const hasProposals = proposals && proposals.length > 0;
  const hasProgramData = programData && Object.keys(programData).length > 0;
  const hasGanttData = ganttData && ganttData.milestones?.length > 0;

  const Icon = stageConfig?.icon || FileText;

  // Checklist completion percentage
  const checklistProgress = hasChecklist 
    ? Math.round((checklist.filter(c => c.checked).length / checklist.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stage Header */}
      <Card className={`border-${stageConfig?.color || 'slate'}-200 bg-gradient-to-br from-${stageConfig?.color || 'slate'}-50 to-white`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-${stageConfig?.color || 'slate'}-100 rounded-xl flex items-center justify-center`}>
                <Icon className={`w-6 h-6 text-${stageConfig?.color || 'slate'}-600`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{stageConfig?.label || stageId}</h2>
                <p className="text-sm text-slate-500 font-normal">
                  {hasDocuments && `${documents.length} מסמכים`}
                  {hasDocuments && hasTasks && ' • '}
                  {hasTasks && `${tasks.length} משימות`}
                </p>
              </div>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {project?.status === stageId && (
                <Badge className="bg-amber-100 text-amber-800">שלב נוכחי</Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="summary" className="gap-2">
            <Sparkles className="w-4 h-4" />
            סיכום
          </TabsTrigger>
          {hasDocuments && (
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              מסמכים ({documents.length})
            </TabsTrigger>
          )}
          {hasTasks && (
            <TabsTrigger value="tasks" className="gap-2">
              <ListTodo className="w-4 h-4" />
              משימות ({tasks.length})
            </TabsTrigger>
          )}
          {hasRecordings && (
            <TabsTrigger value="recordings" className="gap-2">
              <Play className="w-4 h-4" />
              הקלטות ({recordings.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4 mt-4">
          {/* AI Insights for this stage */}
          {stageId === 'first_call' && project?.ai_summary && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-purple-800">
                  <Brain className="w-5 h-5" />
                  תובנות AI משיחת הטלפון
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.ai_summary.summary && (
                  <p className="text-slate-700 mb-4">{project.ai_summary.summary}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {project.ai_summary.estimated_budget && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">תקציב משוער</p>
                      <p className="font-semibold text-slate-900">{project.ai_summary.estimated_budget}</p>
                    </div>
                  )}
                  {project.ai_summary.timeline_estimate && (
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">לוח זמנים</p>
                      <p className="font-semibold text-slate-900">{project.ai_summary.timeline_estimate}</p>
                    </div>
                  )}
                </div>

                {project.ai_summary.client_needs?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 mb-2">צרכי הלקוח</p>
                    <div className="flex flex-wrap gap-2">
                      {project.ai_summary.client_needs.map((need, idx) => (
                        <Badge key={idx} className="bg-white text-purple-700">{need}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Checklist Summary */}
          {hasChecklist && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                  צ'קליסט שיחת טלפון
                  <Badge className={checklistProgress === 100 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                    {checklistProgress}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {checklist.map((item, idx) => (
                    <div 
                      key={idx}
                      className={`flex items-start gap-3 p-2 rounded-lg ${
                        item.checked ? 'bg-green-50' : 'bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.checked ? 'bg-green-500' : 'bg-slate-300'
                      }`}>
                        {item.checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${item.checked ? 'text-green-800' : 'text-slate-700'}`}>
                          {item.item}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-slate-500 mt-1">{item.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Proposals Summary */}
          {hasProposals && (
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-800">
                  <DollarSign className="w-5 h-5" />
                  הצעות מחיר
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {proposals.map((proposal) => (
                    <div key={proposal.id} className="bg-white rounded-lg p-4 border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900">{proposal.title || `הצעה #${proposal.id}`}</h4>
                        <Badge className={
                          proposal.status === 'approved' ? 'bg-green-100 text-green-800' :
                          proposal.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                          'bg-slate-100 text-slate-800'
                        }>
                          {proposal.status === 'approved' ? 'אושרה' : proposal.status === 'sent' ? 'נשלחה' : 'טיוטה'}
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-green-700">
                        ₪{proposal.total?.toLocaleString() || '0'}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gantt Summary */}
          {hasGanttData && (
            <Card className="border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                  <Calendar className="w-5 h-5" />
                  לוח זמנים (גנט)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ganttData.milestones?.slice(0, 5).map((milestone, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: milestone.color || '#f97316' }}
                      />
                      <span className="flex-1 text-sm text-slate-700">{milestone.name}</span>
                      <span className="text-xs text-slate-500">
                        {milestone.endDate && format(new Date(milestone.endDate), 'd/M/yy')}
                      </span>
                    </div>
                  ))}
                  {ganttData.milestones?.length > 5 && (
                    <p className="text-xs text-slate-500 text-center pt-2">
                      +{ganttData.milestones.length - 5} אבני דרך נוספות
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Program Data (Concept) */}
          {hasProgramData && (
            <Card className="border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-purple-800">
                  <Sparkles className="w-5 h-5" />
                  פרוגרמה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {programData.adults && (
                    <div className="bg-white rounded-lg p-3 border border-purple-100">
                      <p className="text-xs text-slate-500">מבוגרים</p>
                      <p className="font-semibold">{programData.adults}</p>
                    </div>
                  )}
                  {programData.children && (
                    <div className="bg-white rounded-lg p-3 border border-purple-100">
                      <p className="text-xs text-slate-500">ילדים</p>
                      <p className="font-semibold">{programData.children}</p>
                    </div>
                  )}
                  {programData.rooms_required?.length > 0 && (
                    <div className="col-span-2 bg-white rounded-lg p-3 border border-purple-100">
                      <p className="text-xs text-slate-500 mb-2">חדרים נדרשים</p>
                      <div className="flex flex-wrap gap-1">
                        {programData.rooms_required.map((room, idx) => (
                          <Badge key={idx} variant="outline">{room}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!hasInsights && !hasChecklist && !hasProposals && !hasGanttData && !hasProgramData && (
            <Card className="border-dashed border-slate-300">
              <CardContent className="py-12 text-center">
                <Icon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">אין נתונים מפורטים לשלב זה עדיין</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <div className="grid grid-cols-2 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 truncate">{doc.title}</h4>
                      <p className="text-xs text-slate-500">
                        {format(new Date(doc.created_date), 'd בMMMM yyyy', { locale: he })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" aria-label="צפייה במסמך">
                        <Eye className="w-4 h-4" aria-hidden />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      'bg-slate-300'
                    }`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{task.title}</h4>
                      {task.due_date && (
                        <p className="text-xs text-slate-500">
                          יעד: {format(new Date(task.due_date), 'd/M/yy')}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {task.status === 'completed' ? 'הושלם' :
                       task.status === 'in_progress' ? 'בתהליך' : 'ממתין'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recordings Tab */}
        <TabsContent value="recordings" className="mt-4">
          <div className="space-y-3">
            {recordings.map((recording) => (
              <Card key={recording.id} className="border-purple-200 bg-purple-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                      <Play className="w-5 h-5 text-purple-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900">{recording.title}</h4>
                      <p className="text-xs text-slate-500">
                        {formatDurationDisplay(recording.duration)} • {format(new Date(recording.created_date), 'd/M/yy')}
                      </p>
                    </div>
                    {recording.analysis && (
                      <Badge className="bg-purple-200 text-purple-800">נותח</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}