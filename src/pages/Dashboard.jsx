import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import BusinessHealthGauges from '../components/dashboard/BusinessHealthGauges';
import ProjectStatusMatrix from '../components/dashboard/ProjectStatusMatrix';
import NotificationsCard from '../components/dashboard/NotificationsCard';
import TimeTrackingWidget from '../components/dashboard/TimeTrackingWidget';
import WeeklyScheduleWidget from '../components/dashboard/WeeklyScheduleWidget';
import { SkeletonCard } from '../components/ui/SkeletonCard';
import { FloatingOrbs, GradientMesh, ParticleField } from '../components/animations/AnimatedBackground';
import { TextReveal, RevealOnScroll, MorphingShape } from '../components/animations/AnimatedComponents';
import { Search } from 'lucide-react';
import { useGlobalSearch } from '../components/search/useGlobalSearch';

// Ultra Advanced Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
      when: "beforeChildren",
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 60, 
    scale: 0.85,
    rotateX: -15,
    filter: "blur(10px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
      mass: 0.8,
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, x: -80, skewX: -5 },
  visible: {
    opacity: 1,
    x: 0,
    skewX: 0,
    transition: {
      type: "spring",
      stiffness: 60,
      damping: 15,
    }
  }
};

const fadeInScale = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 40,
    rotateY: -10 
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    rotateY: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    }
  }
};

// Floating animation for decorative elements
const floatingVariants = {
  animate: {
    y: [0, -20, 0],
    rotate: [-2, 2, -2],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    }
  }
};

// Pulse glow for interactive elements
const pulseGlow = {
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(152, 78, 57, 0.4)",
      "0 0 0 20px rgba(152, 78, 57, 0)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeOut",
    }
  }
};


// Storage key for sidebar state (must match Layout.jsx)
const SIDEBAR_STORAGE_KEY = 'archiflow_sidebar_collapsed';

export default function Dashboard() {
  const navigate = useNavigate();
  // Initialize from localStorage for immediate correct state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return saved === 'true';
    } catch {
      return false;
    }
  });
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Listen for sidebar state changes
  useEffect(() => {
    const handleSidebarState = (e) => {
      setSidebarCollapsed(e.detail?.collapsed || false);
    };
    
    window.addEventListener('sidebarStateChange', handleSidebarState);
    
    return () => {
      window.removeEventListener('sidebarStateChange', handleSidebarState);
    };
  }, []);

  // Get current user from AuthContext (includes Supabase data)
  const { user, isLoadingAuth: loadingUser } = useAuth();
  const userError = null; // Errors are handled in AuthContext

  const { openSearch } = useGlobalSearch();

  // Multi-tenant: Get architect ID for filtering
  const isSuperAdmin = user?.app_role === 'super_admin';
  const myArchitectId = user?.app_role === 'architect' ? user?.id : user?.architect_id;

  // Fetch data for live metrics - Only if user is authenticated
  const { data: allProjects = [], error: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
    enabled: !!user,
    retry: 1,
    onError: (error) => {
      console.error('[Dashboard] Failed to load projects:', error);
      if (error?.message?.includes('checkpoint')) {
        console.error('[Dashboard] Checkpoint error in projects:', error);
      }
    },
  });

  // Multi-tenant filtering: Show only projects belonging to current architect (or all for super_admin)
  const projects = isSuperAdmin 
    ? allProjects 
    : allProjects.filter(p => 
        p.created_by === user?.email || 
        (myArchitectId && p.architect_id === myArchitectId)
      );

  const { data: allInvoices = [], error: invoicesError } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date'),
    enabled: !!user,
    retry: 1,
    onError: (error) => {
      console.error('[Dashboard] Failed to load invoices:', error);
      if (error?.message?.includes('checkpoint')) {
        console.error('[Dashboard] Checkpoint error in invoices:', error);
      }
    },
  });

  const { data: allProposals = [], error: proposalsError } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => base44.entities.Proposal.list('-created_date'),
    enabled: !!user,
    retry: 1,
    onError: (error) => {
      console.error('[Dashboard] Failed to load proposals:', error);
      if (error?.message?.includes('checkpoint')) {
        console.error('[Dashboard] Checkpoint error in proposals:', error);
      }
    },
  });

  // Multi-tenant filtering for invoices and proposals
  const invoices = isSuperAdmin 
    ? allInvoices 
    : allInvoices.filter(i => i.created_by === user?.email);
  
  const proposals = isSuperAdmin 
    ? allProposals 
    : allProposals.filter(p => p.created_by === user?.email);

  const handleProjectClick = (projectId) => {
    navigate(createPageUrl('Projects') + `?id=${projectId}`);
  };

  const handleGaugeClick = (gaugeName) => {
    if (gaugeName === 'גבייה') {
      navigate(createPageUrl('Financials'));
    } else if (gaugeName === 'עמידה בלו״ז' || gaugeName === 'המרות') {
      navigate(createPageUrl('Projects'));
    }
  };

  const userName = user?.full_name?.split(' ')[0] || 'משתמש';

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 relative overflow-hidden">
        {/* Animated loading background */}
        <GradientMesh />
        <div className="relative z-10">
          <div className="mb-6 sm:mb-8 space-y-3">
            <motion.div 
              className="h-8 sm:h-10 bg-muted rounded-xl w-2/3 sm:w-1/3 skeleton-shimmer"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div 
              className="h-5 sm:h-6 bg-muted rounded-xl w-3/4 sm:w-1/2 skeleton-shimmer"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <SkeletonCard count={3} />
          </div>
        </div>
      </div>
    );
  }

  // Check if this is a new architect with no projects
  const isNewArchitect = user?.app_role === 'architect' && projects.length === 0;

  // Show welcome screen for new architects
  if (isNewArchitect) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 lg:p-12 overflow-hidden relative">
        <FloatingOrbs count={6} className="opacity-60" />
        <ParticleField count={25} />
        
        <motion.div
          className="relative z-10 max-w-2xl mx-auto text-center pt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80 }}
        >
          <motion.div
            className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          >
            <span className="text-5xl">🏠</span>
          </motion.div>
          
          <motion.h1 
            className="text-3xl sm:text-4xl font-light text-foreground mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            ברוך הבא, <span className="font-semibold text-primary">{userName}</span>!
          </motion.h1>
          
          <motion.p 
            className="text-lg text-muted-foreground mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            זהו המשרד הדיגיטלי שלך. התחל ביצירת הפרויקט הראשון שלך<br/>
            או חקור את ספריית התוכן עם רהיטים ותמונות רפרנס.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button 
              onClick={() => navigate(createPageUrl('Projects') + '?newProject=true')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 text-lg shadow-lg"
            >
              צור פרויקט ראשון
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(createPageUrl('DesignLibrary'))}
              className="h-12 px-8 text-lg border-border"
            >
              עיין בספריית התוכן
            </Button>
          </motion.div>
          
          <motion.div
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="bg-card/50 rounded-2xl p-6 border border-border">
              <div className="text-3xl mb-3">📁</div>
              <h3 className="font-semibold text-foreground mb-2">פרויקטים</h3>
              <p className="text-sm text-muted-foreground">נהל את כל הפרויקטים שלך במקום אחד</p>
            </div>
            <div className="bg-card/50 rounded-2xl p-6 border border-border">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-semibold text-foreground mb-2">ספריית תוכן</h3>
              <p className="text-sm text-muted-foreground">רהיטים, השראות ותבניות מוכנות</p>
            </div>
            <div className="bg-card/50 rounded-2xl p-6 border border-border">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-semibold text-foreground mb-2">ניהול לקוחות</h3>
              <p className="text-sm text-muted-foreground">הוסף לקוחות וקבלנים לפרויקטים</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 overflow-hidden relative">
      {/* Ultra Advanced Animated Background */}
      <FloatingOrbs count={6} className="opacity-60" />
      <ParticleField count={25} />
      
      {/* Decorative morphing shapes - Hidden on mobile for performance */}
      <motion.div
        className="hidden md:block absolute top-20 left-10 w-72 h-72 opacity-20 pointer-events-none"
        variants={floatingVariants}
        animate="animate"
      >
        <MorphingShape className="w-full h-full" />
      </motion.div>
      
      <motion.div
        className="hidden md:block absolute bottom-20 right-10 w-48 h-48 opacity-15 pointer-events-none"
        animate={{
          y: [0, 15, 0],
          rotate: [0, 5, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <MorphingShape className="w-full h-full" color="secondary" />
      </motion.div>

      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ perspective: 1200 }}
      >
        {/* Header with ultra smooth slide-in animation - Sticky */}
        <motion.div 
          className="mb-4 sm:mb-5 border-b border-border pb-3 sm:pb-4 sticky top-0 bg-background/95 backdrop-blur-sm z-40"
          variants={headerVariants}
        >
          {/* Animated accent line */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          />
          
          <div className="flex justify-between items-start">
            <motion.div 
              className="flex items-center gap-3 mb-2"
              initial={{ opacity: 0, x: -50, rotateY: -20 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
            >
              {/* Hamburger Menu Button - First (rightmost in RTL) */}
              {(isMobile || sidebarCollapsed) && (
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 md:w-11 md:h-11 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-all border-2 border-white/20 md:shadow-organic-lg backdrop-blur-sm flex-shrink-0"
                  onClick={() => {
                    if (isMobile) {
                      window.dispatchEvent(new CustomEvent('openMobileMenu'));
                    } else {
                      window.dispatchEvent(new CustomEvent('toggleSidebar'));
                    }
                  }}
                  aria-label="פתח תפריט"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu">
                    <line x1="4" x2="20" y1="12" y2="12"/>
                    <line x1="4" x2="20" y1="6" y2="6"/>
                    <line x1="4" x2="20" y1="18" y2="18"/>
                  </svg>
                </motion.button>
              )}

              <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-foreground tracking-tight">
              שלום,{' '}
              <motion.span 
                className="font-semibold text-gradient-animate inline-block"
                initial={{ opacity: 0, scale: 0.5, rotateZ: -10 }}
                animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 150, 
                  delay: 0.5,
                  duration: 0.8 
                }}
                whileHover={{ 
                  scale: 1.1, 
                  textShadow: "0 0 20px rgba(152, 78, 57, 0.5)"
                }}
              >
                {userName}
              </motion.span>
            </h1>

            {/* Animated emoji/icon */}
            <motion.span
              className="text-xl sm:text-2xl"
              animate={{ 
                rotate: [0, 15, -15, 0],
                y: [0, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3,
                ease: "easeInOut" 
              }}
            >
              👋
            </motion.span>
            </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <TextReveal 
              text="סקירה מערכתית וניהול שוטף" 
              className="text-muted-foreground font-light text-sm sm:text-base md:text-lg"
              delay={0.7}
            />
          </motion.div>

          {/* Search Bar - Re-introduced */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="hidden md:flex"
          >
            <div 
              className="relative group cursor-pointer"
              onClick={openSearch}
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-background/50 border border-border rounded-xl hover:bg-background/80 hover:border-primary/50 transition-all shadow-sm">
                <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm text-muted-foreground">חיפוש...</span>
                <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </motion.div>
        </div>
        </motion.div>

        {/* Business Health Gauges with enhanced stagger effect */}
        <RevealOnScroll direction="up">
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <BusinessHealthGauges 
              onGaugeClick={handleGaugeClick}
              projects={projects}
              invoices={invoices}
              proposals={proposals}
            />
          </motion.div>
        </RevealOnScroll>

        {/* Project Status Matrix + Notifications - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5">
          <RevealOnScroll direction="left">
            <motion.div
              variants={fadeInScale}
              whileHover={{ 
                scale: 1.008,
                rotateY: 2,
                boxShadow: "0 25px 50px rgba(0,0,0,0.1)"
              }}
              transition={{ type: "spring", stiffness: 200 }}
              style={{ transformStyle: "preserve-3d" }}
              className="h-full"
            >
              <ProjectStatusMatrix onProjectClick={handleProjectClick} projects={projects} />
            </motion.div>
          </RevealOnScroll>
          
          <RevealOnScroll direction="right">
            <motion.div
              variants={itemVariants}
              whileHover={{ 
                scale: 1.005,
                y: -5,
              }}
              transition={{ type: "spring", stiffness: 300 }}
              className="h-full"
            >
              <NotificationsCard />
            </motion.div>
          </RevealOnScroll>
        </div>

        {/* Weekly Schedule Widget */}
        <div className="mt-5">
          <RevealOnScroll direction="up">
            <WeeklyScheduleWidget />
          </RevealOnScroll>
        </div>

        {/* Time Tracking Widget - Full Width Below */}
        <div className="mt-5">
          <RevealOnScroll direction="up">
            <TimeTrackingWidget />
          </RevealOnScroll>
        </div>
        
        {/* Bottom decorative element - Hidden on mobile */}
        <motion.div
          className="hidden sm:flex justify-center mt-5 opacity-30"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 0.3, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <motion.div
            className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
            animate={{ 
              scaleX: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}