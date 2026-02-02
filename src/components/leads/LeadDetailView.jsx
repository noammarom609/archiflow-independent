import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Phone, 
  Trash2, 
  Loader2,
  Sparkles,
  ChevronLeft,
  ExternalLink
} from 'lucide-react';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '../utils/notifications';
import { ScrollReveal } from '@/components/animations';

// Import lead-specific components
import LeadWorkflowStepper from './LeadWorkflowStepper';
import LeadFollowUpSection from './LeadFollowUpSection';
import ClientInfoCard from '../projects/ClientInfoCard';

// Import stage components (only the ones needed for leads)
import FirstCallStage from '../projects/stages/FirstCallStage';
import ProposalStage from '../projects/stages/ProposalStage';

export default function LeadDetailView({ 
  project, 
  onBack, 
  onUpdate,
  onConvertToProject 
}) {
  const queryClient = useQueryClient();
  const [currentStage, setCurrentStage] = useState(project?.current_stage || 'first_call');
  const [currentSubStage, setCurrentSubStage] = useState(project?.current_sub_stage || 'phone_call');
  const [isConverting, setIsConverting] = useState(false);

  // Check if proposal is approved
  const { data: proposals = [] } = useQuery({
    queryKey: ['projectProposals', project?.id],
    queryFn: async () => {
      try {
        const result = await archiflow.entities.Proposal.filter(
          { project_id: project.id },
          '-created_date'
        );
        return result || [];
      } catch (error) {
        return [];
      }
    },
    enabled: !!project?.id,
  });

  const isProposalApproved = proposals.some(p => p.status === 'approved');

  // Sync stage with project
  useEffect(() => {
    if (project) {
      setCurrentStage(project.current_stage || 'first_call');
      
      const subStageDefaults = {
        first_call: 'phone_call',
        proposal: 'initial',
      };
      setCurrentSubStage(project.current_sub_stage || subStageDefaults[project.current_stage] || 'phone_call');
    }
  }, [project?.id, project?.current_stage, project?.current_sub_stage]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => archiflow.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showSuccess('הליד נמחק בהצלחה');
      onBack?.();
    },
    onError: () => {
      showError('שגיאה במחיקת הליד');
    },
  });

  // Handle stage click
  const handleStageClick = async (stageId) => {
    setCurrentStage(stageId);
    const defaultSubStage = stageId === 'first_call' ? 'phone_call' : 'initial';
    setCurrentSubStage(defaultSubStage);
    
    if (onUpdate && stageId !== project?.current_stage) {
      try {
        await onUpdate({ 
          current_stage: stageId,
          current_sub_stage: defaultSubStage
        });
      } catch (error) {
        console.error('Failed to save stage change:', error);
      }
    }
  };

  // Handle sub-stage click
  const handleSubStageClick = async (stageId, subStageId) => {
    setCurrentStage(stageId);
    setCurrentSubStage(subStageId);
    
    if (onUpdate) {
      try {
        await onUpdate({ 
          current_stage: stageId, 
          current_sub_stage: subStageId 
        });
      } catch (error) {
        console.error('Failed to save sub-stage change:', error);
      }
    }
  };

  // Handle sub-stage change (from within stage components)
  const handleSubStageChange = async (subStageId) => {
    setCurrentSubStage(subStageId);
    
    if (onUpdate && subStageId !== project?.current_sub_stage) {
      try {
        await onUpdate({ current_sub_stage: subStageId });
      } catch (error) {
        console.error('Failed to save sub-stage change:', error);
      }
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את הליד "${project?.name}"? פעולה זו לא ניתנת לביטול.`)) {
      deleteMutation.mutate(project.id);
    }
  };

  // Handle manual conversion to project (skipping proposal)
  const handleManualConvert = async () => {
    setIsConverting(true);
    try {
      const now = new Date().toISOString();
      
      // Update project to gantt stage with conversion timestamp
      if (onUpdate) {
        await onUpdate({
          current_stage: 'gantt',
          status: 'active',
          lead_converted_at: now,
        });
      }
      
      // Update client status to active
      if (project?.client_id) {
        try {
          await archiflow.entities.Client.update(project.client_id, {
            status: 'active'
          });
        } catch (err) {
          console.log('Could not update client status:', err);
        }
      }
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projectProposals', project?.id] });
      
      showSuccess('הליד הועבר לפרויקט פעיל בהצלחה!');
      
      // Trigger the callback to navigate to project view
      onConvertToProject?.();
      
    } catch (error) {
      console.error('Error converting lead to project:', error);
      showError('שגיאה בהעברה לפרויקט');
    } finally {
      setIsConverting(false);
    }
  };

  // Render the appropriate stage content
  const renderStageContent = () => {
    const stageProps = {
      project: project,
      onUpdate: onUpdate,
      onSubStageChange: handleSubStageChange,
      currentSubStage: currentSubStage,
    };

    switch (currentStage) {
      case 'first_call':
        return <FirstCallStage {...stageProps} />;
      case 'proposal':
        return <ProposalStage {...stageProps} />;
      default:
        return <FirstCallStage {...stageProps} />;
    }
  };

  // Get stage label
  const getStageLabel = () => {
    if (currentStage === 'first_call') {
      switch (currentSubStage) {
        case 'phone_call': return 'שיחת טלפון';
        case 'first_meeting': return 'פגישה פרונטלית';
        case 'client_card': return 'כרטיס לקוח';
        default: return 'שיחה ראשונה';
      }
    }
    if (currentStage === 'proposal') {
      return currentSubStage === 'approval' ? 'אישור הצעה' : 'הצעת מחיר';
    }
    return 'ליד';
  };

  if (!project) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-l from-primary/5 to-background border-b border-border sticky top-0 z-40">
        <div className="p-4 md:p-5">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <button 
                onClick={onBack}
                className="hover:text-primary cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                חזרה לרשימה
              </button>
              <ArrowRight className="w-4 h-4" />
              <span className="text-foreground font-medium truncate">{project.name}</span>
            </div>

            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {project.client_name || project.name}
                  </h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {project.client_phone && (
                      <a 
                        href={`tel:${project.client_phone}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {project.client_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="w-3 h-3 ml-1" />
                  מתעניין
                </Badge>
                <Badge variant="outline" className="text-muted-foreground">
                  {getStageLabel()}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* If proposal approved, show conversion message */}
            {isProposalApproved && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-green-700 font-medium">
                    ההצעה אושרה! הליד הפך לפרויקט פעיל
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={onConvertToProject}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="w-4 h-4 ml-1" />
                  עבור לפרויקט
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 md:p-5">
        {/* Sidebar - Lead Workflow */}
        <div className="lg:col-span-3 space-y-4">
          <ScrollReveal delay={0.1} direction="right" distance={20}>
            <LeadWorkflowStepper
              project={project}
              currentStage={currentStage}
              currentSubStage={currentSubStage}
              onStageClick={handleStageClick}
              onSubStageClick={handleSubStageClick}
              isProposalApproved={isProposalApproved}
              onConvertToProject={handleManualConvert}
              isConverting={isConverting}
            />
          </ScrollReveal>
          
          {/* Follow-up Section in sidebar */}
          <ScrollReveal delay={0.2} direction="right" distance={20}>
            <LeadFollowUpSection project={project} onUpdate={onUpdate} />
          </ScrollReveal>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-4">
          <ScrollReveal delay={0.2} direction="left" distance={20}>
            {/* Stage Content */}
            {renderStageContent()}
          </ScrollReveal>

          {/* Client Info */}
          <ScrollReveal delay={0.3} direction="left" distance={20}>
            <ClientInfoCard project={project} onUpdate={onUpdate} />
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
