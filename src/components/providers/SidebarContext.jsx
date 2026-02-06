import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SidebarContext = createContext(null);

const SIDEBAR_STORAGE_KEY = 'archiflow_sidebar_collapsed';

export function useSidebarState() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarState must be used within SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [isMobile, setIsMobile] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // Ignore storage errors
    }
  }, [sidebarCollapsed]);

  // Track viewport size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const collapseSidebar = useCallback(() => {
    setSidebarCollapsed(true);
  }, []);

  const expandSidebar = useCallback(() => {
    setSidebarCollapsed(false);
  }, []);

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleMenuClick = useCallback(() => {
    if (isMobile) {
      openMobileMenu();
    } else {
      toggleSidebar();
    }
  }, [isMobile, openMobileMenu, toggleSidebar]);

  const showMenuButton = isMobile || sidebarCollapsed;

  const value = React.useMemo(() => ({
    sidebarCollapsed,
    setSidebarCollapsed,
    isMobile,
    mobileMenuOpen,
    setMobileMenuOpen,
    toggleSidebar,
    collapseSidebar,
    expandSidebar,
    openMobileMenu,
    closeMobileMenu,
    handleMenuClick,
    showMenuButton,
  }), [
    sidebarCollapsed, isMobile, mobileMenuOpen, showMenuButton,
    toggleSidebar, collapseSidebar, expandSidebar,
    openMobileMenu, closeMobileMenu, handleMenuClick,
  ]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}
