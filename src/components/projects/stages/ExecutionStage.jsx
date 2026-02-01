import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import { 
  Hammer, 
  Users, 
  Package, 
  Send, 
  CheckCircle2, 
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/notifications';
import { addStageChangeToClientHistory } from '../../utils/clientHistoryHelper';

// Sub-components
import ContractorManagement from './execution/ContractorManagement';
import SupplierTracking from './execution/SupplierTracking';
import ClientUpdates from './execution/ClientUpdates';
import AddContractorDialog from '@/components/contractors/AddContractorDialog';

const subStages = [
  { id: 'contractors', label: 'ניהול קבלנים', icon: Users, description: 'מעקב התקדמות ומשימות' },
  { id: 'suppliers', label: 'רכש וספקים', icon: Package, description: 'הזמנות ומשלוחים' },
  { id: 'updates', label: 'עדכוני לקוח', icon: Send, description: 'שליחת עדכונים שוטפים' },
];

export default function ExecutionStage({ project, onUpdate, onSubStageChange, currentSubStage }) {
  // Initialize from prop if available to prevent overwriting saved value
  const [activeSubStage, setActiveSubStage] = useState(() => {
    const validSubStages = ['contractors', 'suppliers', 'updates'];
    if (currentSubStage && validSubStages.includes(currentSubStage)) {
      return currentSubStage;
    }
    return 'contractors';
  });
  const [completedSubStages, setCompletedSubStages] = useState([]);
  const [showAddSupplierDialog, setShowAddSupplierDialog] = useState(false);

  // Track if change came from parent to prevent loops
  const isExternalChange = React.useRef(false);
  // Track if initial sync is done to prevent saving on mount
  const initialSyncDone = React.useRef(false);

  // Sync from parent Stepper
  useEffect(() => {
    if (currentSubStage) {
      const validSubStages = ['contractors', 'suppliers', 'updates'];
      if (validSubStages.includes(currentSubStage) && currentSubStage !== activeSubStage) {
        isExternalChange.current = true;
        setActiveSubStage(currentSubStage);
      }
    }
    // Mark initial sync as done after first currentSubStage update
    if (!initialSyncDone.current && currentSubStage) {
      initialSyncDone.current = true;
    }
  }, [currentSubStage]);

  // Notify parent of sub-stage changes (only if internal change AND initial sync is done)
  useEffect(() => {
    if (isExternalChange.current) {
      isExternalChange.current = false;
      return;
    }
    // Don't notify on initial mount - wait for sync from parent first
    if (!initialSyncDone.current) {
      return;
    }
    if (onSubStageChange) {
      onSubStageChange(activeSubStage);
    }
  }, [activeSubStage]);

  // --- Data Fetching ---
  
  // Fetch selected quote
  const { data: selectedQuote } = useQuery({
    queryKey: ['selectedQuote', project?.selected_quote_id],
    queryFn: () => archiflow.entities.ContractorQuote.filter({ id: project?.selected_quote_id }),
    enabled: !!project?.selected_quote_id,
    select: (data) => data[0]
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['projectTasks', project?.id],
    queryFn: () => archiflow.entities.Task.filter({ project_id: project?.id }),
    enabled: !!project?.id
  });

  // Fetch contractor details
  const { data: contractorDetails } = useQuery({
    queryKey: ['contractor', selectedQuote?.contractor_id],
    queryFn: () => archiflow.entities.Contractor.filter({ id: selectedQuote?.contractor_id }),
    enabled: !!selectedQuote?.contractor_id,
    select: (data) => data[0]
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => archiflow.entities.Contractor.filter({ type: 'supplier' }, '-created_date'),
  });

  const completeProject = async () => {
    try {
      if (onUpdate) {
        await onUpdate({ status: 'completion' });
      }

      if (project?.client_id) {
        await addStageChangeToClientHistory(project.client_id, 'completion', project);
      }

      showSuccess('הפרויקט הושלם! ממשיכים לסגירה');
    } catch (error) {
      console.error('Error completing project:', error);
      showError('שגיאה בהשלמת הפרויקט');
    }
  };

  const renderSubStageContent = () => {
    switch (activeSubStage) {
      case 'contractors':
        return (
          <ContractorManagement 
            project={project}
            selectedQuote={selectedQuote}
            contractorDetails={contractorDetails}
            tasks={tasks}
          />
        );

      case 'suppliers':
        return (
          <SupplierTracking 
            project={project}
            suppliers={suppliers}
            tasks={tasks}
            onAddSupplier={() => setShowAddSupplierDialog(true)}
          />
        );

      case 'updates':
        return (
          <ClientUpdates 
            project={project}
            onUpdate={onUpdate}
          />
        );

      default:
        return null;
    }
  };

  // Calculate progress metrics
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      
      <AddContractorDialog 
        isOpen={showAddSupplierDialog} 
        onClose={() => setShowAddSupplierDialog(false)}
        initialType="supplier"
      />

      {/* Progress Overview Card */}
      <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Hammer className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">{project?.name || 'שלב הביצוע'}</h3>
                <p className="text-sm text-red-700">
                  {selectedQuote?.contractor_name || 'קבלן ראשי לא נבחר עדיין'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 md:gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-900">{completedTasks}/{totalTasks}</p>
                <p className="text-xs text-red-600">משימות</p>
              </div>
              <div className="w-px bg-red-200" />
              <div className="text-center">
                <p className="text-2xl font-bold text-red-900">{taskProgress}%</p>
                <p className="text-xs text-red-600">התקדמות</p>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 bg-white rounded-full h-3 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${taskProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-red-500 to-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sub-Stage Navigation */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Hammer className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">שלב הביצוע</h2>
              <p className="text-sm text-slate-500 font-normal">ניהול ביצוע, רכש ותקשורת שוטפת</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {subStages.map((subStage) => {
              const Icon = subStage.icon;
              const isActive = activeSubStage === subStage.id;
              
              return (
                <button
                  key={subStage.id}
                  onClick={() => setActiveSubStage(subStage.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all whitespace-nowrap ${
                    isActive 
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-red-500' : 'bg-slate-200'
                  }`}>
                    <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <span className="text-sm font-medium">{subStage.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sub-Stage Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubStage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderSubStageContent()}
        </motion.div>
      </AnimatePresence>

      {/* Complete Project Button */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <Button 
            onClick={completeProject}
            className="w-full h-12 bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 ml-2" />
            סיום ביצוע ומעבר לשלב מסירה (Completion)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}