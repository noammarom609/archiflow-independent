import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Shield, 
  MessageCircleQuestion, 
  Tags,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Target,
  AlertCircle,
  Filter
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export default function AdvancedInsights({ recording }) {
  const [expandedSections, setExpandedSections] = useState({
    topics: true,
    risks: true,
    compliance: false,
    followUp: false
  });

  const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'high' | 'medium' | 'low'
  const [confidenceFilter, setConfidenceFilter] = useState(0); // 0-1

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (!recording?.advanced_insights) {
    return null;
  }

  const insights = recording.advanced_insights || {};
  const hasTopics = Array.isArray(insights.topics_detailed) && insights.topics_detailed.length > 0;
  const hasRisks = Array.isArray(insights.risks_identified) && insights.risks_identified.length > 0;
  const hasCompliance = Array.isArray(insights.compliance_issues) && insights.compliance_issues.length > 0;
  const hasFollowUp = Array.isArray(insights.follow_up_questions) && insights.follow_up_questions.length > 0;

  if (!hasTopics && !hasRisks && !hasCompliance && !hasFollowUp) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Topics Detailed */}
      {hasTopics && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('topics')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tags className="w-5 h-5 text-blue-600" />
                נושאים מפורטים ({insights.topics_detailed.length})
              </CardTitle>
              {expandedSections.topics ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.topics && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <CardContent className="space-y-3">
                  {insights.topics_detailed.map((topic, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 mb-1">{topic.topic}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {topic.category}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              ביטחון: {Math.round(topic.confidence * 100)}%
                            </Badge>
                            {topic.mentions > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {topic.mentions} אזכורים
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ConfidenceIndicator score={topic.confidence} />
                      </div>
                      {Array.isArray(topic.key_points) && topic.key_points.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {topic.key_points.map((point, pidx) => (
                            <li key={pidx} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="text-blue-600 mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Risks Identified */}
      {hasRisks && (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('risks')}>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                סיכונים מזוהים ({insights.risks_identified.filter(r => 
                  (riskFilter === 'all' || r.severity === riskFilter) && 
                  r.confidence >= confidenceFilter
                ).length})
              </CardTitle>
              {expandedSections.risks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
            
            {/* Filters */}
            {expandedSections.risks && (
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-orange-200">
                <Filter className="w-4 h-4 text-orange-600" />
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="חומרה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסיכונים</SelectItem>
                    <SelectItem value="high">גבוה</SelectItem>
                    <SelectItem value="medium">בינוני</SelectItem>
                    <SelectItem value="low">נמוך</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-slate-600">ביטחון מינימלי:</span>
                  <Slider
                    value={[confidenceFilter * 100]}
                    onValueChange={(value) => setConfidenceFilter(value[0] / 100)}
                    max={100}
                    step={10}
                    className="w-32"
                  />
                  <span className="text-xs text-slate-700 font-medium w-10">
                    {Math.round(confidenceFilter * 100)}%
                  </span>
                </div>
              </div>
            )}
          </CardHeader>
          <AnimatePresence>
            {expandedSections.risks && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <CardContent className="space-y-3">
                  {insights.risks_identified
                    .filter(r => 
                      (riskFilter === 'all' || r.severity === riskFilter) && 
                      r.confidence >= confidenceFilter
                    )
                    .map((risk, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 bg-white rounded-lg border-2 ${
                        risk.severity === 'high' ? 'border-red-300' :
                        risk.severity === 'medium' ? 'border-orange-300' :
                        'border-yellow-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">{risk.risk_type}</h4>
                            <Badge className={
                              risk.severity === 'high' ? 'bg-red-100 text-red-800' :
                              risk.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {risk.severity === 'high' ? 'גבוה' :
                               risk.severity === 'medium' ? 'בינוני' :
                               'נמוך'}
                            </Badge>
                            <Badge className="bg-slate-100 text-slate-800 text-xs">
                              ביטחון: {Math.round(risk.confidence * 100)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{risk.description}</p>
                          {risk.recommendation && (
                            <div className="p-2 bg-blue-50 rounded text-xs text-blue-900 flex items-start gap-2">
                              <Target className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              <span><strong>המלצה:</strong> {risk.recommendation}</span>
                            </div>
                          )}
                        </div>
                        <ConfidenceIndicator score={risk.confidence} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Compliance Issues */}
      {hasCompliance && (
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('compliance')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                נושאי תאימות ({insights.compliance_issues.length})
              </CardTitle>
              {expandedSections.compliance ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.compliance && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <CardContent className="space-y-3">
                  {insights.compliance_issues.map((issue, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-lg border-2 border-red-300">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <h4 className="font-semibold text-slate-900">{issue.issue_type}</h4>
                            <Badge className="bg-slate-100 text-slate-800 text-xs">
                              ביטחון: {Math.round(issue.confidence * 100)}%
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 mb-2">{issue.description}</p>
                          {issue.action_required && (
                            <div className="p-2 bg-red-50 rounded text-xs text-red-900 flex items-start gap-2">
                              <span className="font-semibold">פעולה נדרשת:</span>
                              <span>{issue.action_required}</span>
                            </div>
                          )}
                        </div>
                        <ConfidenceIndicator score={issue.confidence} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Follow-up Questions */}
      {hasFollowUp && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-3 cursor-pointer" onClick={() => toggleSection('followUp')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircleQuestion className="w-5 h-5 text-purple-600" />
                שאלות להמשך דיון ({insights.follow_up_questions.length})
              </CardTitle>
              {expandedSections.followUp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.followUp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <CardContent className="space-y-3">
                  {insights.follow_up_questions.map((q, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {q.category}
                        </Badge>
                        <Badge className={
                          q.priority === 'high' ? 'bg-red-100 text-red-800' :
                          q.priority === 'medium' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {q.priority === 'high' ? 'דחוף' :
                           q.priority === 'medium' ? 'בינוני' :
                           'רגיל'}
                        </Badge>
                      </div>
                      <p className="font-medium text-slate-900 mb-1">{q.question}</p>
                      {q.rationale && (
                        <p className="text-xs text-slate-600 italic">
                          {q.rationale}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}
    </motion.div>
  );
}

// Confidence Indicator Component
function ConfidenceIndicator({ score }) {
  const percentage = Math.round(score * 100);
  const color = score >= 0.8 ? 'text-green-600' :
                score >= 0.6 ? 'text-blue-600' :
                score >= 0.4 ? 'text-orange-600' :
                'text-red-600';

  return (
    <div className="flex flex-col items-center">
      <TrendingUp className={`w-5 h-5 ${color}`} />
      <span className={`text-xs font-semibold ${color}`}>{percentage}%</span>
    </div>
  );
}