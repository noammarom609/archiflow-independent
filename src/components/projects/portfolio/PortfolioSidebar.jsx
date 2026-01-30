import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  FileText,
  ListTodo,
  Brain,
  CheckCircle2,
  Circle,
  ChevronLeft,
  ClipboardList
} from 'lucide-react';

const menuItems = [
  { id: 'overview', label: 'סקירה כללית', icon: LayoutDashboard },
  { id: 'checklists', label: 'צ׳קליסטים', icon: ClipboardList },
  { id: 'documents', label: 'מסמכים', icon: FileText },
  { id: 'tasks', label: 'משימות', icon: ListTodo },
  { id: 'ai_insights', label: 'תובנות AI', icon: Brain },
];

export default function PortfolioSidebar({ 
  activeSection, 
  onSectionChange, 
  stages,
  currentStage,
  stats,
  dataByStage
}) {
  const currentStageIndex = stages.findIndex(s => s.id === currentStage);

  return (
    <Card className="w-64 flex-shrink-0 border-slate-200 flex flex-col overflow-hidden">
      {/* Main Menu */}
      <div className="p-3 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">ניווט מהיר</p>
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            let count = 0;
            if (item.id === 'documents') count = stats.totalDocuments;
            if (item.id === 'tasks') count = stats.totalTasks;
            
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700 font-medium' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {count > 0 && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] h-5 min-w-[20px] justify-center">
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stages Navigation */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="p-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">שלבי הפרויקט</p>
        </div>
        
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-1">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const isActive = activeSection === `stage_${stage.id}`;
              const isCurrent = stage.id === currentStage;
              const isCompleted = index < currentStageIndex;
              const stageData = dataByStage[stage.id] || {};
              const hasData = (stageData.documents?.length > 0) || 
                             (stageData.tasks?.length > 0) || 
                             (stageData.insights?.length > 0) ||
                             stageData.checklist ||
                             stageData.proposals;

              return (
                <motion.button
                  key={stage.id}
                  onClick={() => onSectionChange(`stage_${stage.id}`)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-all ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-700 font-medium' 
                      : isCurrent
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Status Indicator */}
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted 
                      ? 'bg-green-500' 
                      : isCurrent 
                      ? 'bg-amber-500 animate-pulse' 
                      : 'bg-slate-200'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    ) : (
                      <span className="text-[10px] font-bold text-white">{index + 1}</span>
                    )}
                  </div>

                  {/* Label */}
                  <span className="flex-1 text-right truncate">{stage.label}</span>

                  {/* Data Indicator */}
                  {hasData && (
                    <div className={`w-2 h-2 rounded-full ${
                      isCompleted ? 'bg-green-400' : isCurrent ? 'bg-amber-400' : 'bg-indigo-400'
                    }`} />
                  )}

                  {/* Arrow for active */}
                  {isActive && (
                    <ChevronLeft className="w-4 h-4 text-indigo-500" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Progress Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">התקדמות כללית</span>
          <span className="text-xs font-semibold text-slate-700">
            {Math.round((currentStageIndex / stages.length) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStageIndex / stages.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </Card>
  );
}