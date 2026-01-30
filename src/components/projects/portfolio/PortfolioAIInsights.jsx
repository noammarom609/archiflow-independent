import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Brain,
  Sparkles,
  Target,
  DollarSign,
  Clock,
  Heart,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
  MessageSquare,
  ChevronLeft,
  Lightbulb,
  Shield
} from 'lucide-react';

export default function PortfolioAIInsights({ aiSummary, recordings = [], checklists = {}, compact = false, onExpand }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!aiSummary && recordings.length === 0) {
    return (
      <Card className="border-dashed border-slate-300">
        <CardContent className="py-12 text-center">
          <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">אין תובנות AI זמינות עדיין</p>
          <p className="text-sm text-slate-400 mt-1">הקלט שיחות או פגישות לקבלת ניתוח AI</p>
        </CardContent>
      </Card>
    );
  }

  // Compact view for overview
  if (compact) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-purple-800">
              <Brain className="w-5 h-5" />
              תובנות AI
              <Badge className="bg-purple-200 text-purple-800 text-[10px]">GPT-5</Badge>
            </CardTitle>
            {onExpand && (
              <Button variant="ghost" size="sm" onClick={onExpand} className="text-purple-700">
                צפה בהכל
                <ChevronLeft className="w-4 h-4 mr-1" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {aiSummary?.summary && (
            <p className="text-sm text-slate-700 mb-4 line-clamp-3">{aiSummary.summary}</p>
          )}
          
          <div className="grid grid-cols-3 gap-3">
            {aiSummary?.closing_probability && (
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{aiSummary.closing_probability}%</p>
                <p className="text-xs text-slate-500">סיכויי סגירה</p>
              </div>
            )}
            {aiSummary?.excitement_level && (
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{aiSummary.excitement_level}/10</p>
                <p className="text-xs text-slate-500">התלהבות</p>
              </div>
            )}
            {aiSummary?.seriousness_level && (
              <div className="bg-white rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{aiSummary.seriousness_level}/10</p>
                <p className="text-xs text-slate-500">רצינות</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">תובנות AI</h2>
          <p className="text-sm text-slate-500">ניתוח מתקדם מהקלטות ופגישות</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="summary" className="gap-2">
            <Sparkles className="w-4 h-4" />
            סיכום
          </TabsTrigger>
          <TabsTrigger value="needs" className="gap-2">
            <Target className="w-4 h-4" />
            צרכים
          </TabsTrigger>
          <TabsTrigger value="financial" className="gap-2">
            <DollarSign className="w-4 h-4" />
            פיננסי
          </TabsTrigger>
          <TabsTrigger value="strategy" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            אסטרטגיה
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4 mt-4">
          {/* Executive Summary */}
          {aiSummary?.summary && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-purple-800">
                  <MessageSquare className="w-5 h-5" />
                  סיכום מנהלים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700 leading-relaxed">{aiSummary.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Sentiment Metrics */}
          <div className="grid grid-cols-3 gap-4">
            {aiSummary?.closing_probability !== undefined && (
              <Card className="border-green-200">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-green-700">{aiSummary.closing_probability}%</p>
                  <p className="text-sm text-slate-500">סיכויי סגירה</p>
                </CardContent>
              </Card>
            )}
            {aiSummary?.excitement_level !== undefined && (
              <Card className="border-amber-200">
                <CardContent className="p-4 text-center">
                  <Heart className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-amber-700">{aiSummary.excitement_level}/10</p>
                  <p className="text-sm text-slate-500">רמת התלהבות</p>
                </CardContent>
              </Card>
            )}
            {aiSummary?.seriousness_level !== undefined && (
              <Card className="border-blue-200">
                <CardContent className="p-4 text-center">
                  <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-blue-700">{aiSummary.seriousness_level}/10</p>
                  <p className="text-sm text-slate-500">רמת רצינות</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Client Profile */}
          {aiSummary?.client_info && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  פרופיל לקוח
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {aiSummary.client_info.name && (
                    <div>
                      <p className="text-xs text-slate-500">שם</p>
                      <p className="font-medium">{aiSummary.client_info.name}</p>
                    </div>
                  )}
                  {aiSummary.client_info.phone && (
                    <div>
                      <p className="text-xs text-slate-500">טלפון</p>
                      <p className="font-medium" dir="ltr">{aiSummary.client_info.phone}</p>
                    </div>
                  )}
                  {aiSummary.client_info.communication_style && (
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">סגנון תקשורת</p>
                      <p className="font-medium">{aiSummary.client_info.communication_style}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Needs Tab */}
        <TabsContent value="needs" className="space-y-4 mt-4">
          {/* Explicit Needs */}
          {(aiSummary?.explicit_needs?.length > 0 || aiSummary?.client_needs?.length > 0) && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  צרכים מפורשים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(aiSummary.explicit_needs || aiSummary.client_needs)?.map((need, idx) => (
                    <Badge key={idx} className="bg-purple-100 text-purple-800">{need}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Implicit Needs */}
          {aiSummary?.implicit_needs?.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  צרכים סמויים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {aiSummary.implicit_needs.map((need, idx) => (
                    <Badge key={idx} variant="outline" className="border-indigo-300 text-indigo-700">{need}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emotional Needs */}
          {aiSummary?.emotional_needs?.length > 0 && (
            <Card className="border-pink-200 bg-pink-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-pink-800">
                  <Heart className="w-5 h-5" />
                  צרכים רגשיים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {aiSummary.emotional_needs.map((need, idx) => (
                    <Badge key={idx} className="bg-pink-200 text-pink-800">{need}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Style Preferences */}
          {aiSummary?.style_preferences?.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                  העדפות סגנון
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {aiSummary.style_preferences.map((style, idx) => (
                    <Badge key={idx} className="bg-amber-100 text-amber-800">{style}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            {aiSummary?.estimated_budget && (
              <Card className="border-green-200">
                <CardContent className="p-6">
                  <DollarSign className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-xs text-slate-500 mb-1">תקציב משוער</p>
                  <p className="text-2xl font-bold text-green-700">{aiSummary.estimated_budget}</p>
                  {aiSummary.budget_flexibility && (
                    <Badge className={`mt-2 ${
                      aiSummary.budget_flexibility === 'high' ? 'bg-green-100 text-green-800' :
                      aiSummary.budget_flexibility === 'medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      גמישות: {aiSummary.budget_flexibility === 'high' ? 'גבוהה' : 
                               aiSummary.budget_flexibility === 'medium' ? 'בינונית' : 'נמוכה'}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {aiSummary?.timeline_estimate && (
              <Card className="border-blue-200">
                <CardContent className="p-6">
                  <Clock className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-xs text-slate-500 mb-1">לוח זמנים</p>
                  <p className="text-2xl font-bold text-blue-700">{aiSummary.timeline_estimate}</p>
                  {aiSummary.urgency_level && (
                    <Badge className={`mt-2 ${
                      aiSummary.urgency_level === 'high' ? 'bg-red-100 text-red-800' :
                      aiSummary.urgency_level === 'medium' ? 'bg-amber-100 text-amber-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      דחיפות: {aiSummary.urgency_level === 'high' ? 'גבוהה' : 
                               aiSummary.urgency_level === 'medium' ? 'בינונית' : 'נמוכה'}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-4 mt-4">
          {/* Meeting Approach */}
          {aiSummary?.meeting_approach && (
            <Card className="border-indigo-200 bg-indigo-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-indigo-800">
                  <Lightbulb className="w-5 h-5" />
                  גישה מומלצת לפגישה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-700">{aiSummary.meeting_approach}</p>
              </CardContent>
            </Card>
          )}

          {/* Leverage Points */}
          {aiSummary?.leverage_points?.length > 0 && (
            <Card className="border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="w-5 h-5" />
                  נקודות למינוף
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiSummary.leverage_points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Points to Avoid */}
          {aiSummary?.points_to_avoid?.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  נקודות להימנע מהן
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiSummary.points_to_avoid.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-700">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Red Flags */}
          {aiSummary?.red_flags?.length > 0 && (
            <Card className="border-red-300 bg-red-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-red-900">
                  🚩 דגלים אדומים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiSummary.red_flags.map((flag, idx) => (
                    <li key={idx} className="text-red-800 font-medium">{flag}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {aiSummary?.next_steps?.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">פעולות הבאות</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiSummary.next_steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}