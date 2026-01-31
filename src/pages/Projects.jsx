import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { SplitText, BlurText, ScrollReveal, Magnet, FadeIn, GlassBlob } from '../components/animations';

// Advanced animation variants
const pageVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9, rotateX: -10 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.8
    }
  },
  hover: {
    boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
    transition: { type: "spring", stiffness: 300, damping: 25 }
  },
  tap: { scale: 0.98 }
};

const headerVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", stiffness: 80, damping: 20 }
  }
};

const floatingVariants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
// Toaster moved to App.jsx for global fixed positioning
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, MapPin, Plus, Loader2, Trash2, DollarSign, ChevronDown, ChevronUp, Shield, Menu } from 'lucide-react';
import ProjectPermissionsSettings from '../components/projects/settings/ProjectPermissionsSettings';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { ProjectDataProvider } from '../components/projects/ProjectDataContext';
import ProjectWorkflowStepper from '../components/projects/ProjectWorkflowStepper';
import FirstCallStage from '../components/projects/stages/FirstCallStage';
import ProposalStage from '../components/projects/stages/ProposalStage';
import GanttStage from '../components/projects/stages/GanttStage';
import SketchesStage from '../components/projects/stages/SketchesStage';
import RenderingsStage from '../components/projects/stages/RenderingsStage';
import TechnicalPlansStage from '../components/projects/stages/TechnicalPlansStage';
import ExecutionStage from '../components/projects/stages/ExecutionStage';
import CompletionStage from '../components/projects/stages/CompletionStage';
import SurveyStage from '../components/projects/stages/SurveyStage';
import ConceptStage from '../components/projects/stages/ConceptStage';
import SelectionsStage from '../components/projects/stages/SelectionsStage';
import NewProjectModal from '../components/projects/NewProjectModal';
import ProjectsListView from '../components/projects/ProjectsListView';
import GanttView from '../components/calendar/GanttView';
import ProjectTasksManager from '../components/projects/tasks/ProjectTasksManager';
import ProjectDocumentsManager from '../components/projects/documents/ProjectDocumentsManager';
import ClientInfoCard from '../components/projects/ClientInfoCard';
import ProjectPortfolio from '../components/projects/portfolio/ProjectPortfolio';
import { showSuccess, showError } from '../components/utils/notifications';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { ProjectReportDialog } from '../components/projects/ai/AIProjectAssistant';
import { FileText as ReportIcon, Search as SearchIcon } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useNotifications } from '@/hooks/use-notifications';
import { useGlobalSearch } from '../components/search/useGlobalSearch';

const statusConfig = {
  first_call: { label: 'שיחה ראשונה' },
  proposal: { label: 'הצעת מחיר' },
  gantt: { label: 'יצירת גנט' },
  sketches: { label: 'סקיצות' },
  rendering: { label: 'הדמיות' },
  technical: { label: 'תוכניות' },
  execution: { label: 'ביצוע' },
  completion: { label: 'גמר' },
  lead: { label: 'התנעה' },
  planning: { label: 'תכנון' },
  survey: { label: 'מדידה' },
  concept: { label: 'קונספט' },
  selections: { label: 'בחירות' },
};

// Collapsible Section Component - Organic Modernism Style
function CollapsibleSection({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <FadeIn delay={0.1} direction="up" distance={10}>
      <Card className="overflow-hidden">
        <CardHeader 
          className="cursor-pointer hover:bg-accent/50 transition-all duration-300"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CardTitle className="flex items-center justify-between">
            <span className="text-lg text-foreground">{title}</span>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </motion.div>
          </CardTitle>
        </CardHeader>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CardContent className="pt-0">
                <FadeIn delay={0.1} direction="up" distance={10}>
                  {children}
                </FadeIn>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </FadeIn>
  );
}

// WebSocket error likely coming from a sub-component or development server. 
// No direct WS usage found in this file.
export default function Projects() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { sendTemplate } = useNotifications();
  
  // State
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [currentStage, setCurrentStage] = useState(null);
  const [currentSubStage, setCurrentSubStage] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [preselectedClientId, setPreselectedClientId] = useState(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { openSearch } = useGlobalSearch();
  
  // Menu button state - Initialize from localStorage for immediate correct state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('archiflow_sidebar_collapsed');
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarState = (e) => setSidebarCollapsed(e.detail?.collapsed || false);
    window.addEventListener('sidebarStateChange', handleSidebarState);
    return () => window.removeEventListener('sidebarStateChange', handleSidebarState);
  }, []);

  const handleMenuClick = () => {
    if (isMobile) {
      window.dispatchEvent(new CustomEvent('openMobileMenu'));
    } else {
      window.dispatchEvent(new CustomEvent('toggleSidebar'));
    }
  };

  const showMenuButton = isMobile || sidebarCollapsed;

  // Parse URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const newProject = urlParams.get('newProject');
    const clientId = urlParams.get('clientId');
    
    if (projectId) {
      setSelectedProjectId(projectId);
    }
    if (newProject === 'true') {
      setShowNewProjectModal(true);
      if (clientId) {
        setPreselectedClientId(clientId);
      }
    }
  }, [location.search]);

  // Get current user from auth context
  const { user } = useAuth();

  // Multi-tenant: Get architect ID for filtering
  const isSuperAdmin = user?.app_role === 'super_admin';
  console.log('[Projects] User:', user?.email, 'app_role:', user?.app_role, 'isSuperAdmin:', isSuperAdmin);
  const myArchitectId = user?.app_role === 'architect' ? user?.id : user?.architect_id;

  // Fetch projects
  const { data: rawProjects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => archiflow.entities.Project.list('-created_date'),
  });

  // Multi-tenant filtering: Show only projects belonging to current architect (or all for super_admin)
  const allProjects = isSuperAdmin 
    ? rawProjects 
    : rawProjects.filter(p => 
        p.created_by === user?.email || 
        (myArchitectId && p.architect_id === myArchitectId)
      );

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Project.create(data),
    onSuccess: (createdProject, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showSuccess('פרויקט נוצר בהצלחה!');
      
      // Send notification to client if they have an account
      if (createdProject?.client_id) {
        sendTemplate('projectCreated', createdProject.client_id, {
          projectName: createdProject.name,
          projectId: createdProject.id,
          architectName: user?.full_name || 'האדריכל שלך'
        });
      }
    },
    onError: () => {
      showError('שגיאה ביצירת הפרויקט');
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => archiflow.entities.Project.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: () => {
      showError('שגיאה בעדכון הפרויקט');
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (id) => archiflow.entities.Project.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      showSuccess('הפרויקט נמחק בהצלחה');
      handleBackToList();
    },
    onError: () => {
      showError('שגיאה במחיקת הפרויקט');
    },
  });

  const selectedProject = allProjects.find(p => p.id === selectedProjectId);

  // Sync stage with project
  useEffect(() => {
    if (selectedProject) {
      const projectStatus = selectedProject.status || 'first_call';
      setCurrentStage(projectStatus);
      
      const subStageDefaults = {
        first_call: 'phone_call',
        proposal: 'initial',
        gantt: 'create',
        sketches: 'upload',
        survey: 'upload_survey',
        concept: 'program',
        selections: 'spec_list',
        rendering: 'upload',
        technical: 'upload',
        execution: null,
        completion: null,
      };
      setCurrentSubStage(subStageDefaults[projectStatus] || null);
    }
  }, [selectedProject?.id, selectedProject?.status]);

  // Handlers
  const handleProjectClick = (projectId) => {
    setSelectedProjectId(projectId);
    navigate(createPageUrl('Projects') + `?id=${projectId}`);
  };

  const handleBackToList = () => {
    setSelectedProjectId(null);
    navigate(createPageUrl('Projects'));
  };

  const handleCreateProject = (newProject) => {
    createProjectMutation.mutate(newProject);
  };

  const handleProjectUpdate = async (data) => {
    if (selectedProjectId) {
      const previousStatus = selectedProject?.status;
      await updateProjectMutation.mutateAsync({ id: selectedProjectId, data });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      // Send notification if project stage changed
      if (data.status && data.status !== previousStatus && selectedProject?.client_id) {
        const stageLabels = {
          first_call: 'שיחה ראשונה',
          proposal: 'הצעת מחיר',
          gantt: 'תכנון לוח זמנים',
          sketches: 'סקיצות',
          survey: 'מדידה',
          concept: 'קונספט',
          selections: 'בחירות',
          rendering: 'הדמיות',
          technical: 'תוכניות טכניות',
          execution: 'ביצוע',
          completion: 'גמר פרויקט',
        };
        
        sendTemplate('stageChanged', selectedProject.client_id, {
          projectName: selectedProject.name,
          projectId: selectedProjectId,
          stageName: stageLabels[data.status] || data.status
        });
      }
    }
  };

  const handleDeleteProject = () => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את הפרויקט "${selectedProject?.name}"? פעולה זו לא ניתנת לביטול.`)) {
      deleteProjectMutation.mutate(selectedProjectId);
    }
  };

  const handleStageClick = (stageId) => {
    setCurrentStage(stageId);
    const subStageDefaults = {
      first_call: 'phone_call',
      proposal: 'initial',
      gantt: 'create',
      sketches: 'upload',
      rendering: 'upload',
      technical: 'upload',
      execution: null,
      completion: null,
    };
    setCurrentSubStage(subStageDefaults[stageId] || null);
  };

  const handleSubStageClick = (stageId, subStageId) => {
    setCurrentStage(stageId);
    setCurrentSubStage(subStageId);
  };

  const handleSubStageChange = (subStageId) => {
    setCurrentSubStage(subStageId);
  };

  const renderStageContent = () => {
    const effectiveStage = currentStage || selectedProject?.status || 'first_call';
    const stageProps = {
      project: selectedProject,
      onUpdate: handleProjectUpdate,
      onSubStageChange: handleSubStageChange,
      currentSubStage,
    };

    switch (effectiveStage) {
      case 'first_call':
        return <FirstCallStage {...stageProps} />;
      case 'proposal':
        return <ProposalStage {...stageProps} />;
      case 'survey':
        return <SurveyStage {...stageProps} />;
      case 'concept':
        return <ConceptStage {...stageProps} />;
      case 'gantt':
        return <GanttStage {...stageProps} />;
      case 'sketches':
        return <SketchesStage {...stageProps} />;
      case 'rendering':
        return <RenderingsStage {...stageProps} />;
      case 'technical':
        return <TechnicalPlansStage {...stageProps} />;
      case 'selections':
        return <SelectionsStage {...stageProps} />;
      case 'execution':
        return <ExecutionStage {...stageProps} />;
      case 'completion':
        return <CompletionStage {...stageProps} />;
      default:
        // Default to FirstCallStage if stage is unknown or 'first_call'
        return <FirstCallStage {...stageProps} />;
    }
  };

  // Projects List View
  if (!selectedProjectId) {
    return (
      <>
        <NewProjectModal
          isOpen={showNewProjectModal}
          onClose={() => {
            setShowNewProjectModal(false);
            setPreselectedClientId(null);
            navigate(createPageUrl('Projects'), { replace: true });
          }}
          onCreateProject={handleCreateProject}
          preselectedClientId={preselectedClientId}
        />
        <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 relative overflow-hidden">
          {/* Background Blobs - Hidden on mobile for performance */}
          <GlassBlob 
            className="hidden md:block top-20 -right-20 opacity-20" 
            color="#984E39" 
            size={400} 
            blur={100} 
          />
          <GlassBlob 
            className="hidden md:block bottom-40 -left-20 opacity-15" 
            color="#354231" 
            size={350} 
            blur={120} 
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header - Sticky */}
            <div className="mb-6 sm:mb-8 md:mb-12 border-b border-border pb-4 sm:pb-6 md:pb-8 sticky top-0 bg-background/95 backdrop-blur-sm z-40">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {/* Hamburger Menu Button - First (rightmost in RTL) */}
                  <AnimatePresence>
                    {showMenuButton && (
                      <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 md:w-11 md:h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all border-2 border-white/20 backdrop-blur-sm flex-shrink-0"
                        onClick={handleMenuClick}
                        aria-label="פתח תפריט"
                      >
                        <Menu className="w-5 h-5" strokeWidth={2.5} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                  
                  <div>
                    <div className="flex items-end gap-2 sm:gap-3 mb-2">
                      <h1 className="text-2xl sm:text-3xl font-light text-foreground tracking-tight">
                        <SplitText delay={0.1} stagger={0.03}>פרויקטים</SplitText>
                      </h1>
                    </div>
                    <p className="text-muted-foreground font-light text-base sm:text-lg mb-3 sm:mb-4">
                      <BlurText delay={0.3} duration={0.6}>ניהול ותכנון אדריכלי</BlurText>
                    </p>
                  </div>
                </div>
                {/* Search Bar - Added here */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="hidden md:flex mt-2"
                >
                  <div 
                    className="relative group cursor-pointer"
                    onClick={openSearch}
                  >
                    <div className="flex items-center gap-2 px-4 py-2 bg-background/50 border border-border rounded-xl hover:bg-background/80 hover:border-primary/50 transition-all shadow-sm">
                      <SearchIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm text-muted-foreground">חיפוש...</span>
                      <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
                        <span className="text-xs">⌘</span>K
                      </kbd>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              <div>
              <motion.div 
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 80, delay: 0.1 }}
              >
                {/* View Toggle with animated indicator */}
                <div className="flex bg-white border border-border rounded-xl p-1 relative overflow-x-auto">
                  {['grid', 'list', 'gantt'].map((mode, i) => (
                    <motion.button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm transition-all duration-200 relative z-10 whitespace-nowrap ${
                        viewMode === mode 
                          ? 'text-foreground font-medium' 
                          : 'text-slate-400 hover:text-muted-foreground'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {mode === 'grid' ? 'כרטיסים' : mode === 'list' ? 'רשימה' : 'גנט'}
                    </motion.button>
                  ))}
                  {/* Animated background pill */}
                  <motion.div
                    className="absolute top-1 bottom-1 bg-slate-100 rounded-lg z-0"
                    layoutId="viewToggle"
                    initial={false}
                    animate={{
                      x: viewMode === 'grid' ? 0 : viewMode === 'list' ? '100%' : '200%',
                      width: viewMode === 'grid' ? 72 : viewMode === 'list' ? 56 : 48
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    style={{ right: 4 }}
                  />
                </div>
                <Magnet strength={0.2}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      data-testid="new-project-btn"
                      onClick={() => setShowNewProjectModal(true)}
                      className="bg-primary hover:bg-primary/90 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
                    >
                      <motion.div
                        animate={{ rotate: [0, 90, 0] }}
                        transition={{ duration: 0.3 }}
                        whileHover={{ rotate: 90 }}
                      >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.div>
                      <span className="text-sm sm:text-base">פרויקט חדש</span>
                    </Button>
                  </motion.div>
                </Magnet>
                </motion.div>
              </div>
            </div>

            {/* Projects View */}
            {viewMode === 'gantt' ? (
              <GanttView 
                currentDate={new Date()}
                onDateChange={() => {}} 
              />
            ) : viewMode === 'list' ? (
              <ProjectsListView 
                projects={allProjects} 
                onSelectProject={handleProjectClick}
                isLoading={isLoading}
              />
            ) : (
              <>
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <SkeletonCard count={6} />
                  </div>
                ) : allProjects.length === 0 ? (
                  <FadeIn delay={0.2} direction="up">
                    <div className="text-center py-12 sm:py-20">
                      <BlurText delay={0.3} className="block mb-4">
                        <p className="text-muted-foreground text-base sm:text-lg">אין פרויקטים עדיין</p>
                      </BlurText>
                      <Magnet>
                        <Button onClick={() => setShowNewProjectModal(true)} className="bg-primary hover:bg-primary/90">
                          <Plus className="w-4 h-4 ml-2" />
                          צור פרויקט ראשון
                        </Button>
                      </Magnet>
                    </div>
                  </FadeIn>
                ) : (
                  <motion.div 
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                    variants={pageVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ perspective: 1200 }}
                  >
                    {allProjects.map((project, index) => {
                      const status = statusConfig[project.status] || statusConfig.first_call;
                      return (
                        <ScrollReveal
                          key={project.id}
                          delay={index * 0.1}
                          direction="up"
                          distance={40}
                        >
                          <motion.div
                            variants={cardVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => handleProjectClick(project.id)}
                            style={{ transformStyle: "preserve-3d" }}
                          >
                            <Card className="overflow-hidden cursor-pointer border border-border bg-white shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 rounded-xl group">
                            {/* Image with parallax effect */}
                            <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden bg-background">
                              <motion.div 
                                className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" 
                              />
                              <img
                                src={project.image}
                                alt={project.name}
                                className="w-full h-full object-cover transition-all duration-300 group-hover:grayscale-0 grayscale-[20%]"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80';
                                }}
                              />
                              <motion.div 
                                className="absolute top-4 right-4 z-20"
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + index * 0.05 }}
                              >
                                <Badge className="bg-white/90 backdrop-blur-sm text-slate-800 border border-border/50 shadow-sm font-normal px-3 py-1 text-xs tracking-wide">
                                  {status.label}
                                </Badge>
                              </motion.div>

                              {/* Shine effect on hover */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20"
                              />
                            </div>

                            {/* Content with stagger animation */}
                            <motion.div 
                              className="p-4 sm:p-5 md:p-6"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 + index * 0.05 }}
                            >
                              <motion.h3 
                                className="text-base sm:text-lg font-medium text-foreground mb-2 sm:mb-3 tracking-tight line-clamp-1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.15 + index * 0.05 }}
                              >
                                {project.name}
                              </motion.h3>

                              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                                <motion.div 
                                  className="flex items-center gap-2 text-muted-foreground font-light"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.2 + index * 0.05 }}
                                >
                                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" strokeWidth={1.5} />
                                  <span className="truncate">{project.location || 'לא צוין'}</span>
                                </motion.div>
                                <motion.div 
                                  className="flex items-center gap-2 text-muted-foreground font-light"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.25 + index * 0.05 }}
                                >
                                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" strokeWidth={1.5} />
                                  <span className="truncate">{project.timeline || 'לא צוין'}</span>
                                </motion.div>
                              </div>

                              <motion.div 
                                className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-100 flex items-center justify-between"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.05 }}
                              >
                                <span className="text-[10px] sm:text-xs text-slate-400 font-medium tracking-wider uppercase">תקציב</span>
                                <motion.span 
                                  className="text-sm sm:text-base font-semibold text-slate-700"
                                  whileHover={{ scale: 1.1, color: "#984E39" }}
                                >
                                  {project.budget || '₪0'}
                                </motion.span>
                              </motion.div>
                            </motion.div>
                          </Card>
                          </motion.div>
                        </ScrollReveal>
                      );
                    })}
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </>
    );
  }

  // Project Detail View
  if (!selectedProject) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const status = statusConfig[selectedProject?.status] || statusConfig.first_call;

  return (
    <ProjectDataProvider projectId={selectedProjectId}>
      <div className="min-h-screen bg-background">
        {/* Header - Sticky with Menu Button - Compact */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-40">
          <div className="p-3 sm:p-4 md:p-5">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
                {/* Hamburger Menu Button - First (rightmost in RTL) */}
                <AnimatePresence>
                  {showMenuButton && (
                    <motion.button
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-9 h-9 md:w-10 md:h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all border-2 border-white/20 backdrop-blur-sm flex-shrink-0"
                      onClick={handleMenuClick}
                      aria-label="פתח תפריט"
                    >
                      <Menu className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
                    </motion.button>
                  )}
                </AnimatePresence>
                
                <span 
                  className="hover:text-primary cursor-pointer"
                  onClick={handleBackToList}
                >
                  פרויקטים
                </span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-foreground font-medium truncate">{selectedProject.name}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
                    <SplitText delay={0.1} stagger={0.02}>{selectedProject.name}</SplitText>
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground truncate">
                    <BlurText delay={0.3}>{selectedProject.location}</BlurText>
                  </p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1.5 sm:gap-2 text-muted-foreground border-border hover:bg-background text-xs sm:text-sm"
                    onClick={() => setShowReportDialog(true)}
                  >
                    <ReportIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">דוח</span>
                  </Button>
                  <ProjectPermissionsSettings 
                    project={selectedProject}
                    trigger={
                      <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 border-border text-muted-foreground hover:bg-background text-xs sm:text-sm">
                        <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">הרשאות</span>
                      </Button>
                    }
                  />
                  <Badge variant="outline" className="border-slate-300 text-slate-700 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-normal bg-white">
                    {status.label}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteProject}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 w-8 h-8 sm:w-9 sm:h-9"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>


            </motion.div>
          </div>
        </div>

        <ProjectReportDialog 
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          project={selectedProject}
        />

        {/* Main Content - Compact spacing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 md:p-4 lg:p-5">
          {/* Workflow Stepper - Compact */}
          <ScrollReveal delay={0.2} direction="right" distance={30} className="lg:col-span-3">
            <ProjectWorkflowStepper
              project={selectedProject}
              currentStage={currentStage || selectedProject?.status || 'first_call'}
              currentSubStage={currentSubStage}
              onStageClick={handleStageClick}
              onSubStageClick={handleSubStageClick}
            />
          </ScrollReveal>

          {/* Stage Content - Expanded */}
          <ScrollReveal delay={0.3} direction="left" distance={30} className="lg:col-span-9 space-y-3">
            {/* Stage Content - Main execution area first */}
            {renderStageContent()}

            {/* Client Info Card - Moved to bottom */}
            <CollapsibleSection title="פרטי הלקוח" defaultOpen={false}>
              <ClientInfoCard project={selectedProject} onUpdate={handleProjectUpdate} />
            </CollapsibleSection>

            {/* Project Portfolio - Moved to bottom */}
            <CollapsibleSection title="תיק פרויקט" defaultOpen={false}>
              <ProjectPortfolio project={selectedProject} onUpdate={handleProjectUpdate} />
            </CollapsibleSection>
          </ScrollReveal>
        </div>
      </div>
    </ProjectDataProvider>
  );
}