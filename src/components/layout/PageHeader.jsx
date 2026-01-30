import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu } from 'lucide-react';
import { FloatingOrbs, ParticleField } from '../animations/AnimatedBackground';
import { TextReveal } from '../animations/AnimatedComponents';
import { useGlobalSearch } from '../search/useGlobalSearch';
import { Button } from '@/components/ui/button';

// Header animation variants - matching Dashboard style
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

// Storage key for sidebar state (must match Layout.jsx)
const SIDEBAR_STORAGE_KEY = 'archiflow_sidebar_collapsed';

export default function PageHeader({ 
  title, 
  subtitle, 
  children,
  className = '',
  showBackground = true,
  icon = null // Optional icon/emoji
}) {
  const { openSearch } = useGlobalSearch();
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

  const handleMenuClick = () => {
    if (isMobile) {
      window.dispatchEvent(new CustomEvent('openMobileMenu'));
    } else {
      window.dispatchEvent(new CustomEvent('toggleSidebar'));
    }
  };

  const showMenuButton = isMobile || sidebarCollapsed;

  return (
    <motion.div 
      className={`mb-6 sm:mb-8 md:mb-12 border-b border-border pb-4 sm:pb-6 md:pb-8 overflow-hidden sticky top-0 bg-background/95 backdrop-blur-sm z-40 ${className}`}
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Animated Background - Hidden on mobile for performance */}
      {showBackground && (
        <div className="hidden md:block">
          <FloatingOrbs count={4} className="opacity-40" />
          <ParticleField count={15} />
        </div>
      )}
      
      {/* Animated accent line */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: '100%', opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
      />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start">
            {/* Title with Dashboard-style animation */}
            <motion.div 
              className="flex items-center gap-3 mb-2"
              initial={{ opacity: 0, x: -50, rotateY: -20 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ type: "spring", stiffness: 80, delay: 0.2 }}
            >
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

              <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-foreground tracking-tight">
                <motion.span 
                  className="font-semibold inline-block"
                  initial={{ opacity: 0, scale: 0.5, rotateZ: -10 }}
                  animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 150, 
                    delay: 0.3,
                    duration: 0.8 
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    textShadow: "0 0 20px rgba(152, 78, 57, 0.3)"
                  }}
                >
                  {title}
                </motion.span>
              </h1>
            
              {/* Animated icon if provided */}
              {icon && (
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
                  {typeof icon === 'function' || (icon && icon.$$typeof) ? 
                    React.createElement(icon, { className: "w-6 h-6 text-primary" }) : 
                    icon}
                </motion.span>
              )}
            </motion.div>

            {/* Search Bar in Header (Left side) */}
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

            {/* Subtitle with TextReveal */}
        {subtitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <TextReveal 
              text={subtitle} 
              className="text-muted-foreground font-light text-sm sm:text-base md:text-lg"
              delay={0.7}
            />
          </motion.div>
        )}
        
        {/* Children (buttons, actions) */}
        {children && (
          <motion.div
            className="mt-3 sm:mt-4"
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 100,
              delay: 0.8 
            }}
          >
            {children}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}