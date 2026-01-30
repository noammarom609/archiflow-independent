import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Users,
  DollarSign,
  Target
} from 'lucide-react';

export default function ExecutiveSummary({ recording }) {
  if (!recording?.analysis) return null;

  const analysis = recording.analysis || {};
  const deepAnalysis = recording.deep_analysis || {};
  const advancedInsights = recording.advanced_insights || {};

  // Calculate critical metrics
  const risksArray = Array.isArray(advancedInsights.risks_identified) ? advancedInsights.risks_identified : [];
  const criticalRisks = risksArray.filter(r => r.severity === 'high').length;
  const totalTasks = Array.isArray(analysis.tasks) ? analysis.tasks.length : 0;
  const totalPeople = Array.isArray(deepAnalysis.people_mentioned) ? deepAnalysis.people_mentioned.length : 0;
  const totalProjects = Array.isArray(deepAnalysis.projects_identified) ? deepAnalysis.projects_identified.length : 0;
  const financialItems = Array.isArray(deepAnalysis.financial_data) ? deepAnalysis.financial_data.length : 0;
  const complianceIssues = Array.isArray(advancedInsights.compliance_issues) ? advancedInsights.compliance_issues.length : 0;

  const sentiment = deepAnalysis?.sentiment?.overall || 'neutral';
  const sentimentScore = deepAnalysis?.sentiment?.score || 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            סיכום מנהלים
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Text */}
          {analysis.summary && (
            <div className="mb-6 p-4 bg-white rounded-lg border-2 border-indigo-200">
              <p className="text-slate-800 leading-relaxed font-medium">
                {analysis.summary}
              </p>
            </div>
          )}

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {/* Tasks */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs text-slate-600">משימות</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{totalTasks}</div>
            </div>

            {/* People */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-slate-600">משתתפים</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{totalPeople}</div>
            </div>

            {/* Projects */}
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-xs text-slate-600">פרויקטים</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{totalProjects}</div>
            </div>

            {/* Financial */}
            {financialItems > 0 && (
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-slate-600">נתונים כספיים</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{financialItems}</div>
              </div>
            )}
          </div>

          {/* Alerts Section */}
          <div className="space-y-3">
            {/* Critical Risks Alert */}
            {criticalRisks > 0 && (
              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900">
                    {criticalRisks} סיכונים קריטיים זוהו!
                  </p>
                  <p className="text-xs text-red-700">נדרשת תשומת לב מיידית</p>
                </div>
              </div>
            )}

            {/* Compliance Issues */}
            {complianceIssues > 0 && (
              <div className="p-3 bg-orange-50 border-2 border-orange-300 rounded-lg flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-orange-900">
                    {complianceIssues} נושאי תאימות זוהו
                  </p>
                  <p className="text-xs text-orange-700">יש לטפל בהתאם</p>
                </div>
              </div>
            )}

            {/* Sentiment */}
            <div className={`p-3 rounded-lg border-2 flex items-center gap-3 ${
              sentiment === 'positive' ? 'bg-green-50 border-green-300' :
              sentiment === 'negative' ? 'bg-red-50 border-red-300' :
              'bg-blue-50 border-blue-300'
            }`}>
              <TrendingUp className={`w-5 h-5 flex-shrink-0 ${
                sentiment === 'positive' ? 'text-green-600' :
                sentiment === 'negative' ? 'text-red-600' :
                'text-blue-600'
              }`} />
              <div>
                <p className={`font-semibold ${
                  sentiment === 'positive' ? 'text-green-900' :
                  sentiment === 'negative' ? 'text-red-900' :
                  'text-blue-900'
                }`}>
                  טון הפגישה: {
                    sentiment === 'positive' ? 'חיובי' :
                    sentiment === 'negative' ? 'שלילי' :
                    'נייטרלי'
                  }
                </p>
                <p className="text-xs text-slate-600">
                  ציון: {Math.round(sentimentScore * 100)}%
                </p>
              </div>
            </div>
          </div>

          {/* Key Decisions (if any) */}
          {Array.isArray(analysis.decisions) && analysis.decisions.length > 0 && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2 text-sm">
                החלטות מרכזיות:
              </h4>
              <ul className="space-y-1">
                {analysis.decisions.slice(0, 3).map((decision, idx) => (
                  <li key={idx} className="text-xs text-purple-800 flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span>{decision}</span>
                  </li>
                ))}
                {analysis.decisions.length > 3 && (
                  <li className="text-xs text-purple-600 font-medium">
                    +{analysis.decisions.length - 3} החלטות נוספות
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}