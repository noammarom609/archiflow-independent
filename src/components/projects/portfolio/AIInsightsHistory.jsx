import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Phone,
  Users,
  Calendar,
  Edit3,
  Settings,
  ChevronDown,
  ChevronUp,
  Eye,
  RotateCcw,
  Clock,
  FileText,
  Sparkles,
  ArrowRight,
  Plus,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// Source type icons and labels
const SOURCE_CONFIG = {
  phone_call: { icon: Phone, label: 'שיחת טלפון', color: 'bg-blue-100 text-blue-700' },
  first_meeting: { icon: Users, label: 'פגישה ראשונה', color: 'bg-green-100 text-green-700' },
  follow_up_meeting: { icon: Calendar, label: 'פגישת המשך', color: 'bg-purple-100 text-purple-700' },
  manual: { icon: Edit3, label: 'עדכון ידני', color: 'bg-amber-100 text-amber-700' },
  system: { icon: Settings, label: 'מערכת', color: 'bg-slate-100 text-slate-700' },
};

// Field name translations
const FIELD_TRANSLATIONS = {
  budget_estimate: 'הערכת תקציב',
  timeline_estimate: 'לוח זמנים',
  property_size: 'גודל הנכס',
  location_details: 'פרטי מיקום',
  summary: 'סיכום',
  sentiment: 'סנטימנט',
  client_needs: 'צרכי לקוח',
  explicit_needs: 'צרכים מפורשים',
  implicit_needs: 'צרכים סמויים',
  style_preferences: 'העדפות סגנון',
  decisions: 'החלטות',
  action_items: 'משימות',
  concerns: 'חששות',
  rooms_required: 'חדרים נדרשים',
  materials_mentioned: 'חומרים',
  people_mentioned: 'אנשים',
  financial_mentions: 'אזכורים כספיים',
  follow_up_questions: 'שאלות המשך',
  key_topics: 'נושאים מרכזיים',
  strategic_recommendations: 'המלצות אסטרטגיות',
};

export default function AIInsightsHistory({ project, onRestoreSnapshot }) {
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Fetch full history from ProjectAIHistory entity
  const { data: fullHistory = [], isLoading, refetch } = useQuery({
    queryKey: ['aiHistory', project?.id],
    queryFn: () => project?.id 
      ? base44.entities.ProjectAIHistory.filter({ project_id: project.id }, '-timestamp')
      : Promise.resolve([]),
    enabled: !!project?.id && showFullHistory,
  });

  // Use condensed history from project if available
  const condensedHistory = project?.ai_insights_history || [];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: he });
    } catch {
      return dateString;
    }
  };

  const renderSourceBadge = (sourceType) => {
    const config = SOURCE_CONFIG[sourceType] || SOURCE_CONFIG.system;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleRestore = async (snapshot) => {
    if (!snapshot?.previous_snapshot || !onRestoreSnapshot) return;
    
    setIsRestoring(true);
    try {
      await onRestoreSnapshot(snapshot.previous_snapshot);
      setSelectedSnapshot(null);
    } finally {
      setIsRestoring(false);
    }
  };

  const renderFieldChanges = (fieldsChanged) => {
    if (!fieldsChanged?.length) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {fieldsChanged.slice(0, 5).map((field, i) => (
          <Badge key={i} variant="outline" className="text-xs">
            {FIELD_TRANSLATIONS[field] || field}
          </Badge>
        ))}
        {fieldsChanged.length > 5 && (
          <Badge variant="outline" className="text-xs bg-slate-50">
            +{fieldsChanged.length - 5} נוספים
          </Badge>
        )}
      </div>
    );
  };

  const renderHistoryEntry = (entry, index, isExpanded) => {
    const config = SOURCE_CONFIG[entry.source_type] || SOURCE_CONFIG.system;
    const Icon = config.icon;

    return (
      <motion.div
        key={entry.snapshot_id || index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="relative"
      >
        {/* Timeline connector */}
        {index < (showFullHistory ? fullHistory.length : condensedHistory.length) - 1 && (
          <div className="absolute right-4 top-12 bottom-0 w-0.5 bg-slate-200" />
        )}

        <div
          className={`relative bg-white rounded-xl border transition-all cursor-pointer ${
            isExpanded ? 'border-primary shadow-md' : 'border-slate-200 hover:border-slate-300'
          }`}
          onClick={() => setExpandedEntry(isExpanded ? null : (entry.snapshot_id || index))}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {renderSourceBadge(entry.source_type)}
                  <span className="text-xs text-slate-500">
                    {formatDate(entry.timestamp)}
                  </span>
                </div>

                {entry.changes_summary && (
                  <p className="text-sm text-slate-700 mt-1 line-clamp-2">
                    {entry.changes_summary}
                  </p>
                )}

                {renderFieldChanges(entry.fields_changed)}
              </div>

              {/* Expand icon */}
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                  {/* Stats */}
                  {entry.merge_stats && (
                    <div className="flex gap-4 mb-3 text-xs">
                      {entry.merge_stats.items_added > 0 && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Plus className="w-3 h-3" />
                          {entry.merge_stats.items_added} נוספו
                        </span>
                      )}
                      {entry.merge_stats.items_updated > 0 && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <RefreshCw className="w-3 h-3" />
                          {entry.merge_stats.items_updated} עודכנו
                        </span>
                      )}
                    </div>
                  )}

                  {/* Recording link */}
                  {entry.recording_id && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <FileText className="w-3 h-3" />
                      <span>הקלטה: {entry.recording_id}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSnapshot(entry);
                      }}
                    >
                      <Eye className="w-3 h-3 ml-1" />
                      צפה ב-Snapshot
                    </Button>
                    {onRestoreSnapshot && entry.previous_snapshot && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 text-amber-600 border-amber-200 hover:bg-amber-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(entry);
                        }}
                      >
                        <RotateCcw className="w-3 h-3 ml-1" />
                        שחזר
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // No history at all
  if (!condensedHistory.length && !showFullHistory) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <History className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-2">אין היסטוריה עדיין</h3>
          <p className="text-sm text-slate-500">
            לאחר ניתוח הקלטות, היסטוריית השינויים תופיע כאן
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="w-5 h-5 text-primary" />
              היסטוריית AI Insights
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {showFullHistory ? fullHistory.length : condensedHistory.length} רשומות
              </Badge>
              <Button
                size="sm"
                variant={showFullHistory ? 'default' : 'outline'}
                className="text-xs h-7"
                onClick={() => setShowFullHistory(!showFullHistory)}
              >
                {showFullHistory ? 'היסטוריה מקוצרת' : 'היסטוריה מלאה'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-2">
              <div className="space-y-3">
                {(showFullHistory ? fullHistory : condensedHistory).map((entry, index) => 
                  renderHistoryEntry(
                    entry, 
                    index, 
                    expandedEntry === (entry.snapshot_id || index)
                  )
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Snapshot Dialog */}
      <Dialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Snapshot - {formatDate(selectedSnapshot?.timestamp)}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] mt-4">
            {selectedSnapshot?.new_values && (
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-700">ערכים שנוספו/עודכנו:</h4>
                <pre className="bg-slate-50 rounded-lg p-4 text-xs overflow-auto whitespace-pre-wrap text-right" dir="rtl">
                  {JSON.stringify(selectedSnapshot.new_values, null, 2)}
                </pre>
              </div>
            )}
            {selectedSnapshot?.previous_snapshot && (
              <div className="space-y-4 mt-6">
                <h4 className="font-semibold text-slate-700">מצב קודם:</h4>
                <pre className="bg-amber-50 rounded-lg p-4 text-xs overflow-auto whitespace-pre-wrap text-right" dir="rtl">
                  {JSON.stringify(selectedSnapshot.previous_snapshot, null, 2)}
                </pre>
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            {onRestoreSnapshot && selectedSnapshot?.previous_snapshot && (
              <Button
                variant="outline"
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                onClick={() => handleRestore(selectedSnapshot)}
                disabled={isRestoring}
              >
                {isRestoring ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 ml-2" />
                )}
                שחזר למצב הקודם
              </Button>
            )}
            <Button variant="outline" onClick={() => setSelectedSnapshot(null)}>
              סגור
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}