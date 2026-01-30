import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '../utils/notifications';
import {
  Sparkles,
  UserPlus,
  CheckSquare,
  Calendar,
  FileText,
  Loader2,
  Clock,
  Users,
  Target,
  Smile,
  Frown,
  Meh,
  TrendingUp,
  MessageSquare,
  Lightbulb,
  Activity
} from 'lucide-react';

export default function MeetingAssistant({ event, onClose }) {
  const queryClient = useQueryClient();
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [agendaItems, setAgendaItems] = useState([
    { id: 1, text: 'פתיחה וסקירת יעדי הפגישה', completed: false },
    { id: 2, text: 'דיון בהתקדמות הפרויקט', completed: false },
    { id: 3, text: 'סיכום והחלטות', completed: false },
  ]);
  const [sentiment, setSentiment] = useState(null);
  const [talkingPoints, setTalkingPoints] = useState([]);
  const [engagementMetrics, setEngagementMetrics] = useState(null);

  const { data: attendeesList = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showSuccess('משימה נוצרה בהצלחה');
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CalendarEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      showSuccess('הערות follow-up נשמרו');
    },
  });

  const generateSummary = async () => {
    setGenerating(true);
    try {
      const prompt = `צור סיכום פגישה מקצועי על סמך הפרטים הבאים:
כותרת: ${event.title}
תיאור: ${event.description || 'אין תיאור'}
משתתפים: ${event.attendees?.join(', ') || 'לא צוינו'}
מיקום: ${event.location || 'לא צוין'}

צור:
1. סיכום קצר (2-3 משפטים)
2. 3-5 פעולות follow-up עם הקצאה למשתתפים (אם יש משתתפים)
3. נקודות מפתח שנדונו

פורמט JSON:`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            actionItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  task: { type: 'string' },
                  assignee: { type: 'string' },
                  priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                },
              },
            },
            keyPoints: { type: 'array', items: { type: 'string' } },
            sentiment: {
              type: 'object',
              properties: {
                overall: { type: 'string', enum: ['positive', 'neutral', 'negative', 'mixed'] },
                score: { type: 'number' },
                tone: { type: 'string' },
                analysis: { type: 'string' },
              },
            },
            engagementMetrics: {
              type: 'object',
              properties: {
                participationLevel: { type: 'string', enum: ['high', 'medium', 'low'] },
                topicsDiscussed: { type: 'number' },
                decisionsCount: { type: 'number' },
                feedback: { type: 'string' },
              },
            },
            talkingPoints: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topic: { type: 'string' },
                  importance: { type: 'string', enum: ['high', 'medium', 'low'] },
                  context: { type: 'string' },
                },
              },
            },
          },
        },
      });

      setSummary(result);
      setActionItems(result.actionItems || []);
      setSentiment(result.sentiment);
      setEngagementMetrics(result.engagementMetrics);
      setTalkingPoints(result.talkingPoints || []);
    } catch (error) {
      showError('שגיאה ביצירת סיכום');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const createTask = (item) => {
    createTaskMutation.mutate({
      title: item.task,
      description: `נוצר מפגישה: ${event.title}`,
      priority: item.priority,
      status: 'pending',
      project_name: event.project_name || 'כללי',
      contractor_name: item.assignee,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const toggleAgendaItem = (id) => {
    setAgendaItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const saveFollowUp = () => {
    updateEventMutation.mutate({
      id: event.id,
      data: {
        ...event,
        description: `${event.description || ''}\n\n--- הערות Follow-up ---\n${followUpNotes}`,
      },
    });
  };

  const completedCount = agendaItems.filter((item) => item.completed).length;
  const progressPercentage = (completedCount / agendaItems.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AI Meeting Assistant</h2>
          <p className="text-sm text-slate-600">{event.title}</p>
        </div>
      </div>

      {/* Real-time Agenda Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            מעקב אג'נדה בזמן אמת
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>התקדמות</span>
              <span>{completedCount} מתוך {agendaItems.length}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {agendaItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  item.completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <button
                  onClick={() => toggleAgendaItem(item.id)}
                  className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-all ${
                    item.completed
                      ? 'bg-green-600 border-green-600'
                      : 'border-slate-300 hover:border-indigo-400'
                  }`}
                  aria-label={`סמן ${item.text} כ${item.completed ? 'לא הושלם' : 'הושלם'}`}
                >
                  {item.completed && <CheckSquare className="w-4 h-4 text-white" />}
                </button>
                <span
                  className={`flex-1 ${
                    item.completed ? 'line-through text-slate-500' : 'text-slate-900'
                  }`}
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sentiment & Engagement Analysis */}
      {sentiment && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {sentiment.overall === 'positive' ? (
                  <Smile className="w-5 h-5 text-green-600" />
                ) : sentiment.overall === 'negative' ? (
                  <Frown className="w-5 h-5 text-red-600" />
                ) : (
                  <Meh className="w-5 h-5 text-yellow-600" />
                )}
                ניתוח סנטימנט
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">מצב רוח כללי</span>
                <Badge
                  className={
                    sentiment.overall === 'positive'
                      ? 'bg-green-100 text-green-800'
                      : sentiment.overall === 'negative'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {sentiment.overall === 'positive'
                    ? 'חיובי'
                    : sentiment.overall === 'negative'
                    ? 'שלילי'
                    : sentiment.overall === 'mixed'
                    ? 'מעורב'
                    : 'ניטרלי'}
                </Badge>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-600 mb-1">
                  <span>ציון</span>
                  <span>{Math.round(sentiment.score * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      sentiment.overall === 'positive'
                        ? 'bg-green-600'
                        : sentiment.overall === 'negative'
                        ? 'bg-red-600'
                        : 'bg-yellow-600'
                    }`}
                    style={{ width: `${sentiment.score * 100}%` }}
                  />
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-700">
                  <strong>טון:</strong> {sentiment.tone}
                </p>
                <p className="text-xs text-slate-600 mt-1">{sentiment.analysis}</p>
              </div>
            </CardContent>
          </Card>

          {engagementMetrics && (
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  מדדי מעורבות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">רמת השתתפות</span>
                  <Badge
                    className={
                      engagementMetrics.participationLevel === 'high'
                        ? 'bg-green-100 text-green-800'
                        : engagementMetrics.participationLevel === 'low'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {engagementMetrics.participationLevel === 'high'
                      ? 'גבוהה'
                      : engagementMetrics.participationLevel === 'low'
                      ? 'נמוכה'
                      : 'בינונית'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-indigo-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-700">
                      {engagementMetrics.topicsDiscussed}
                    </p>
                    <p className="text-xs text-slate-600">נושאים</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {engagementMetrics.decisionsCount}
                    </p>
                    <p className="text-xs text-slate-600">החלטות</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-700">{engagementMetrics.feedback}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Talking Points Suggestions */}
      {talkingPoints.length > 0 && (
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-600" />
              נקודות דיון מוצעות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {talkingPoints.map((point, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      point.importance === 'high'
                        ? 'bg-red-500'
                        : point.importance === 'medium'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{point.topic}</h4>
                    <p className="text-sm text-slate-600">{point.context}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      point.importance === 'high'
                        ? 'border-red-300 text-red-700'
                        : point.importance === 'medium'
                        ? 'border-yellow-300 text-yellow-700'
                        : 'border-green-300 text-green-700'
                    }
                  >
                    {point.importance === 'high'
                      ? 'חשוב'
                      : point.importance === 'medium'
                      ? 'רלוונטי'
                      : 'נוסף'}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Generate Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            סיכום פגישה אוטומטי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!summary ? (
            <Button
              onClick={generateSummary}
              disabled={generating}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מייצר סיכום...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 ml-2" />
                  צור סיכום פגישה
                </>
              )}
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <h4 className="font-semibold text-slate-900 mb-2">סיכום</h4>
                <p className="text-slate-700 leading-relaxed">{summary.summary}</p>
              </div>

              {summary.keyPoints && summary.keyPoints.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">נקודות מפתח</h4>
                  <ul className="space-y-1">
                    {summary.keyPoints.map((point, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-indigo-600">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-600" />
              פעולות Follow-up ({actionItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionItems.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-slate-900 font-medium flex-1">{item.task}</p>
                  <Badge
                    className={
                      item.priority === 'urgent'
                        ? 'bg-red-100 text-red-800'
                        : item.priority === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : item.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }
                  >
                    {item.priority === 'urgent'
                      ? 'דחוף'
                      : item.priority === 'high'
                      ? 'גבוה'
                      : item.priority === 'medium'
                      ? 'בינוני'
                      : 'נמוך'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <UserPlus className="w-4 h-4" />
                    <span>{item.assignee}</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => createTask(item)}>
                    צור משימה
                  </Button>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Follow-up Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            הערות Follow-up
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="follow-up-notes">הוסף הערות לאחר הפגישה</Label>
            <Textarea
              id="follow-up-notes"
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="הערות, החלטות, נושאים שנדונו..."
              rows={6}
              className="resize-none"
            />
          </div>
          <Button
            onClick={saveFollowUp}
            disabled={!followUpNotes || updateEventMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {updateEventMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                שומר...
              </>
            ) : (
              'שמור הערות'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Meeting Info */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>{new Date(event.start_date).toLocaleString('he-IL')}</span>
          </div>
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Users className="w-4 h-4 mt-0.5" />
              <span>{event.attendees.join(', ')}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}