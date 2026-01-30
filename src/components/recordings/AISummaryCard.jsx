import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, CheckCircle2, AlertTriangle, Users, Calendar } from 'lucide-react';

export default function AISummaryCard({ recording }) {
  if (!recording?.analysis && !recording?.deep_analysis) {
    return null;
  }

  const analysis = recording.analysis || {};
  const deepAnalysis = recording.deep_analysis || {};

  // Generate smart summary
  const taskCount = analysis.tasks?.length || 0;
  const decisionCount = analysis.decisions?.length || 0;
  const peopleCount = deepAnalysis.people_mentioned?.length || 0;
  const projectsCount = deepAnalysis.projects_identified?.length || 0;
  const sentiment = deepAnalysis.sentiment?.overall || 'neutral';
  const sentimentScore = deepAnalysis.sentiment?.score || 0.5;

  // Sentiment styling
  const sentimentConfig = {
    positive: { 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: TrendingUp,
      label: 'חיובי'
    },
    neutral: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: TrendingUp,
      label: 'ניטרלי'
    },
    negative: { 
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: AlertTriangle,
      label: 'מאתגר'
    }
  };

  const sentimentInfo = sentimentConfig[sentiment] || sentimentConfig.neutral;
  const SentimentIcon = sentimentInfo.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">סיכום AI חכם</CardTitle>
              <p className="text-sm text-slate-600">תובנות מרכזיות מהפגישה</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Main Summary Text */}
          {analysis.summary && (
            <div className="p-4 bg-white rounded-lg border border-indigo-200 shadow-sm">
              <p className="text-slate-800 leading-relaxed font-medium">
                {analysis.summary}
              </p>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tasks */}
            {taskCount > 0 && (
              <div className="p-3 bg-white rounded-lg border border-green-200 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">{taskCount}</div>
                  <div className="text-xs text-slate-600">משימות</div>
                </div>
              </div>
            )}

            {/* Decisions */}
            {decisionCount > 0 && (
              <div className="p-3 bg-white rounded-lg border border-purple-200 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">{decisionCount}</div>
                  <div className="text-xs text-slate-600">החלטות</div>
                </div>
              </div>
            )}

            {/* People */}
            {peopleCount > 0 && (
              <div className="p-3 bg-white rounded-lg border border-blue-200 flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">{peopleCount}</div>
                  <div className="text-xs text-slate-600">משתתפים</div>
                </div>
              </div>
            )}

            {/* Projects */}
            {projectsCount > 0 && (
              <div className="p-3 bg-white rounded-lg border border-orange-200 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-slate-900">{projectsCount}</div>
                  <div className="text-xs text-slate-600">פרויקטים</div>
                </div>
              </div>
            )}
          </div>

          {/* Sentiment Analysis */}
          {deepAnalysis.sentiment && (
            <div className={`p-4 rounded-lg border ${sentimentInfo.color}`}>
              <div className="flex items-center gap-3 mb-2">
                <SentimentIcon className="w-5 h-5" />
                <span className="font-semibold">טון הפגישה: {sentimentInfo.label}</span>
                <Badge className="bg-white/80">
                  {Math.round(sentimentScore * 100)}%
                </Badge>
              </div>
              {deepAnalysis.sentiment.key_emotions && deepAnalysis.sentiment.key_emotions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {deepAnalysis.sentiment.key_emotions.map((emotion, idx) => (
                    <Badge key={idx} variant="outline" className="bg-white/60">
                      {emotion}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Top Action Items Preview */}
          {deepAnalysis.action_items && deepAnalysis.action_items.length > 0 && (
            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                פעולות מיידיות
              </h4>
              <ul className="space-y-1">
                {deepAnalysis.action_items.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="text-indigo-600 mt-1">•</span>
                    <span>
                      {item.task}
                      {item.assignee && (
                        <span className="text-slate-500"> ({item.assignee})</span>
                      )}
                    </span>
                  </li>
                ))}
                {deepAnalysis.action_items.length > 3 && (
                  <li className="text-sm text-slate-500 font-medium">
                    +{deepAnalysis.action_items.length - 3} פעולות נוספות
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Financial Summary */}
          {deepAnalysis.financial_data && deepAnalysis.financial_data.length > 0 && (
            <div className="p-4 bg-white rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                💰 נתונים כספיים
              </h4>
              <ul className="space-y-1">
                {deepAnalysis.financial_data.slice(0, 3).map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-700">
                    <span className="font-bold">₪{item.amount?.toLocaleString()}</span>
                    {item.context && <span className="text-slate-600"> - {item.context}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}