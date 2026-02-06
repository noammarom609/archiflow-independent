import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu } from 'lucide-react';
import { TextReveal } from '../animations/AnimatedComponents';
import { useGlobalSearch } from '../search/useGlobalSearch';
import { useSidebarState } from '@/components/providers/SidebarContext';

// Header animation variants
const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    }
  }
};

export default function PageHeader({ 
  title, 
  subtitle, 
  children,
  className = '',
  showBackground = false,
  icon = null
}) {
  const { openSearch } = useGlobalSearch();
  const { showMenuButton, handleMenuClick } = useSidebarState();

  return (
    <motion.div 
      className={`mb-4 sm:mb-6 pb-4 sm:pb-5 sticky top-0 bg-background/95 backdrop-blur-sm z-40 ${className}`}
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-primary/30 via-border to-primary/30" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Menu Button */}
              {showMenuButton && (
                <button
                  className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-organic-sm hover:bg-primary/90 transition-all flex-shrink-0"
                  onClick={handleMenuClick}
                  aria-label="פתח תפריט"
                >
                  <Menu className="w-5 h-5" strokeWidth={2} />
                </button>
              )}

              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
                  {title}
                  {icon && (
                    <span className="inline-block mr-2 text-lg align-middle">
                      {typeof icon === 'function' || (icon && icon.$$typeof) ? 
                        React.createElement(icon, { className: "w-5 h-5 text-primary inline" }) : 
                        icon}
                    </span>
                  )}
                </h1>
                {subtitle && (
                  <p className="text-muted-foreground text-sm mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-2">
              <div 
                className="relative group cursor-pointer"
                onClick={openSearch}
              >
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border border-border rounded-xl hover:bg-muted hover:border-primary/30 transition-all">
                  <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm text-muted-foreground">חיפוש...</span>
                  <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
                    <span className="text-xs">{navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl+'}</span>K
                  </kbd>
                </div>
              </div>
            </div>
        </div>

        {/* Children (buttons, actions) */}
        {children && (
          <div className="mt-3 sm:mt-4">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}