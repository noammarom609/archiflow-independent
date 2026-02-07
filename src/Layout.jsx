import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronDown, ChevronUp, Search, Shield, RefreshCw, Moon, Sun, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeProvider, useTheme } from './components/providers/ThemeProvider';
import { LanguageProvider, useLanguage } from './components/providers/LanguageProvider';
import { SidebarProvider, useSidebarState } from './components/providers/SidebarContext';
import { 
        LayoutDashboard, 
        FolderKanban, 
        Palette, 
        Banknote,
        Building2,
        User,
        Users,
        BookOpen,
        Bell,
        Mic,
        FileAudio,
        Settings,
        CalendarDays,
        Briefcase,
        HardHat,
        Clock,
        Package
      } from 'lucide-react';
import NotificationCenter from './components/notifications/NotificationCenter';
import GlobalSearch from './components/search/GlobalSearch';
import { useGlobalSearch } from './components/search/useGlobalSearch';
import MobileNavigation from './components/layout/MobileNavigation';
import RequireAuth from './components/auth/RequireAuth';
import { PushNotificationPrompt } from './components/notifications/PushNotificationPrompt';
import FloatingTimerWidget from './components/time-tracking/FloatingTimerWidget';
import QuickLeadModal from './components/leads/QuickLeadModal';
import { useAuth } from './lib/AuthContext';
import { 
  isSuperAdmin, 
  isAdmin, 
  isAutoApproved, 
  hasPageAccess, 
  isPendingApproval,
  getPortalPage 
} from './utils/roleHelpers';

// Landing pages that should not show the sidebar and don't require authentication
const LANDING_PAGES = ['LandingHome', 'LandingAbout', 'LandingPricing', 'LandingBlog', 'LandingContact', 'LandingPrivacy', 'LandingTerms'];

// Public pages that don't require authentication
const PUBLIC_PAGES = [...LANDING_PAGES, 'PublicApproval', 'PublicContractorQuote', 'PublicMeetingBooking', 'PublicContent'];

function LayoutContent({ children, currentPageName }) {
    const location = useLocation();
    const [showNotifications, setShowNotifications] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState([]);
    const [showQuickLeadModal, setShowQuickLeadModal] = useState(false);
    const { sidebarCollapsed, setSidebarCollapsed, collapseSidebar } = useSidebarState();
    const { isOpen: searchOpen, setIsOpen: setSearchOpen, openSearch } = useGlobalSearch();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const { t, isRTL } = useLanguage();
    const { logout } = useAuth();

    // Auto-collapse sidebar on project detail pages
    useEffect(() => {
      const isProjectPage = currentPageName === 'Projects' && new URLSearchParams(location.search).get('id');
      if (isProjectPage) {
        collapseSidebar();
      }
    }, [currentPageName, location.search, collapseSidebar]);

    // Listen for proposal editor events to collapse/expand sidebar
    useEffect(() => {
      const handleProposalEditor = (e) => {
        setSidebarCollapsed(e.detail?.active || false);
      };
      window.addEventListener('proposalEditorActive', handleProposalEditor);
      return () => window.removeEventListener('proposalEditorActive', handleProposalEditor);
    }, [setSidebarCollapsed]);

  // Check if current page is a landing page or public page
  const isLandingPage = LANDING_PAGES.includes(currentPageName);
  const isPublicPage = PUBLIC_PAGES.includes(currentPageName);
  
  // Get auth state from context to prevent race conditions
  const { isAuthenticated, isLoadingAuth, user } = useAuth();
  
  // Use user from AuthContext directly (includes Supabase data)
  const loadingUser = isLoadingAuth;

  // Fetch notifications - wait for auth to be ready
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => archiflow.entities.Notification.list('-created_date', 50),
    refetchInterval: 30000,
    enabled: !isLandingPage && !isLoadingAuth && isAuthenticated,
  });

  // 5. Smart Navigation: Check for existing entities to show/hide portals dynamically
  // For architects - show portals if they have any related records
  const { data: portalCounts, isLoading: loadingPortalCounts } = useQuery({
    queryKey: ['portalCounts', user?.id, user?.email, user?.app_role],
    queryFn: async () => {
      try {
        const userRole = user?.app_role;
        const myId = user?.id;
        const myEmail = user?.email?.toLowerCase();
        
        // Super admin and admin see everything
        const isAdminLevel = userRole === 'super_admin' || userRole === 'admin';
        
        // Architects (admin, architect, project_manager) see records they own or created
        const isArchitectRole = ['super_admin', 'admin', 'architect', 'project_manager'].includes(userRole);
        
        // Fetch records
        const [allConsultants, allContractors, allSuppliers, allClients] = await Promise.all([
          archiflow.entities.Consultant.list(null, 100),
          archiflow.entities.Contractor.list(null, 100),
          archiflow.entities.Supplier.list(null, 100),
          archiflow.entities.Client.list(null, 100)
        ]);
        
        // Filter for non-admin users - check multiple ownership fields
        // Note: Entity data returns fields at root level, not nested under 'data'
        const filterByOwnership = (items) => {
          // Admin level users see all
          if (isAdminLevel) return items;
          
          // Architects see records they own or created
          if (isArchitectRole) {
            return items.filter(item => {
              const itemArchitectId = item.architect_id;
              const itemCreatedBy = item.created_by?.toLowerCase();
              const itemArchitectEmail = item.architect_email?.toLowerCase();
              
              return (
                itemArchitectId === myId || 
                itemCreatedBy === myEmail ||
                itemArchitectEmail === myEmail ||
                // Also check if no architect is assigned (orphan records accessible by architects)
                (!itemArchitectId && !itemArchitectEmail)
              );
            });
          }
          
          // Other users - only see their own
          return items.filter(item => 
            item.created_by?.toLowerCase() === myEmail
          );
        };
        
        const consultants = filterByOwnership(allConsultants);
        const contractors = filterByOwnership(allContractors);
        const suppliers = filterByOwnership(allSuppliers);
        const clients = filterByOwnership(allClients);
        
        if (import.meta.env.DEV) {
          console.log('[Layout] Portal counts:', { consultants: consultants?.length, contractors: contractors?.length, suppliers: suppliers?.length, clients: clients?.length });
        }
        
        return { 
          consultants: consultants?.length || 0, 
          contractors: contractors?.length || 0,
          suppliers: suppliers?.length || 0,
          clients: clients?.length || 0
        };
      } catch (e) {
        console.error("Error fetching portal counts", e);
        return { consultants: 0, contractors: 0, suppliers: 0, clients: 0 };
      }
    },
    enabled: !isLandingPage && !isLoadingAuth && isAuthenticated && !!user,
    staleTime: 30000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // If it's a landing page, just render children without sidebar
  if (isLandingPage) {
    return <>{children}</>;
  }

  // If it's a public page (like PublicApproval), render without sidebar but no auth required
  if (isPublicPage) {
    return <>{children}</>;
  }

  // For all other pages, require authentication
  // The RequireAuth wrapper will handle showing login prompt if not authenticated

  // Show loading state while auth or user is loading (only for authenticated pages)
  if (!isPublicPage && (isLoadingAuth || loadingUser)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">{t('layout.loadingSystem')}</p>
        </div>
      </div>
    );
  }

  // Check for pending approval status using centralized helper
  // Auto-approved roles (super_admin, admin, architect, project_manager) bypass this check
  const isPending = user && isPendingApproval(user);

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Background Pattern - Organic */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"></div>
        </div>

        {/* System Logo - Top Right */}
        <div className={`absolute top-8 ${isRTL ? 'right-8' : 'left-8'} flex items-center gap-4 z-10`}>
          {/* Logo Icon */}
          <div className="w-14 h-14 rounded-xl overflow-hidden shadow-organic-lg bg-[#F7F5F2] flex-shrink-0">
            <img 
              src="/archiflow-logoV2.png" 
              alt="ArchiFlow" 
              className="w-full h-full object-cover"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
          {/* Text */}
          <div className={`${isRTL ? 'text-right' : 'text-left'} flex flex-col justify-center`}>
            <h1 className="text-xl font-bold text-foreground tracking-tight leading-tight">ArchiFlow</h1>
            <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">Architecture OS</p>
          </div>
        </div>

        <div className="max-w-md w-full glass rounded-3xl shadow-organic-xl p-8 text-center relative z-20">
          <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-organic border border-primary/20">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur animate-pulse opacity-50"></div>
              <Shield className="w-10 h-10 text-primary relative z-10" />
              <div className={`absolute -bottom-1 ${isRTL ? '-right-1' : '-left-1'} bg-secondary rounded-full p-1 border-2 border-background`}>
                <Loader2 className="w-3 h-3 text-secondary-foreground animate-spin" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('pending.title')}</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {t('pending.message')}
          </p>
          
          <div className={`bg-muted/50 rounded-2xl p-5 mb-8 ${isRTL ? 'text-right' : 'text-left'} border border-border`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">{t('pending.accountDetails')}</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                {user.email.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{user.full_name || t('pending.newUser')}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full h-12 rounded-xl shadow-organic hover-lift"
            >
              <RefreshCw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('pending.checkStatus')}
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => logout()}
              className="w-full text-muted-foreground hover:text-foreground hover:bg-muted h-12 rounded-xl"
            >
              {t('pending.logout')}
            </Button>
          </div>
        </div>
        
        <div className="absolute bottom-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ArchiFlow Systems. All rights reserved.
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MENU ITEMS - Using translation keys for i18n support
  // Portals are shown dynamically based on entity counts
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Build dynamic portal children based on entity counts
  // Architects and above always see all portals; others see only portals with at least one entity.
  const isArchitectOrAbove = user?.app_role && ['super_admin', 'admin', 'architect', 'project_manager'].includes(user.app_role);
  const showAllPortals = loadingPortalCounts || !portalCounts || isArchitectOrAbove;
  
  const portalChildren = [
    { name: 'People', labelKey: 'nav.people', icon: Users }, // Always show People
    ...((showAllPortals || portalCounts?.consultants > 0) ? [{ name: 'ConsultantPortal', labelKey: 'nav.consultantPortal', icon: HardHat }] : []),
    ...((showAllPortals || portalCounts?.contractors > 0) ? [{ name: 'ContractorPortal', labelKey: 'nav.contractorPortal', icon: Building2 }] : []),
    ...((showAllPortals || portalCounts?.suppliers > 0) ? [{ name: 'SupplierPortal', labelKey: 'nav.supplierPortal', icon: Package }] : []),
    ...((showAllPortals || portalCounts?.clients > 0) ? [{ name: 'ClientPortal', labelKey: 'nav.clientPortal', icon: Building2 }] : []),
  ];

  const menuItems = [
                // ── Work ──
                { name: 'Dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
                { name: 'Projects', labelKey: 'nav.projects', icon: FolderKanban },
                { name: 'Calendar', labelKey: 'nav.calendar', icon: CalendarDays },
                { name: 'TimeTracking', labelKey: 'nav.timeTracking', icon: Clock },
                
                // ── Content ──
                { name: '_divider_content', isDivider: true, labelKey: 'nav.content' },
                { name: 'Recordings', labelKey: 'nav.recordingsAdmin', icon: Mic },
                { name: 'DesignLibrary', labelKey: 'nav.designLibrary', icon: Palette },
                
                // ── Business ──
                { name: '_divider_business', isDivider: true, labelKey: 'nav.business' },
                { name: 'Financials', labelKey: 'nav.financials', icon: Banknote },
                { 
                  name: 'Communication', 
                  labelKey: 'nav.communication', 
                  icon: Users, 
                  isGroup: true,
                  children: portalChildren
                },
              ];

  const isActive = (pageName) => currentPageName === pageName;

    const toggleGroup = (groupName) => {
      setExpandedGroups(prev => 
        prev.includes(groupName) 
          ? prev.filter(g => g !== groupName)
          : [...prev, groupName]
      );
    };

    const isGroupActive = (item) => {
              if (!item.children) return false;
              return item.children.some(child => currentPageName === child.name);
            };

          // Use centralized role helper for consistent permission checks
          const hasAccess = (pageName) => hasPageAccess(user, pageName);

          const filteredMenuItems = menuItems.map(item => {
              if (item.isDivider) return item;
              if (item.isGroup) {
                  const visibleChildren = item.children.filter(child => hasAccess(child.name));
                  if (visibleChildren.length === 0) return null;
                  if (visibleChildren.length === 1) {
                      return visibleChildren[0];
                  }
                  return { ...item, children: visibleChildren };
              }
              if (hasAccess(item.name)) return item;
              return null;
          }).filter(Boolean);

          return (
          <div className="min-h-screen bg-background flex font-sans" dir="rtl">
          {/* Sidebar - Right side for RTL with Enhanced Glassmorphism */}
          <aside className={`hidden md:flex flex-col fixed right-0 top-0 h-screen z-50 bg-gradient-to-b from-white/80 to-white/60 dark:from-card/90 dark:to-card/70 backdrop-blur-xl border-l border-border/30 shadow-organic-lg transition-all duration-300 ${sidebarCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-72'}`}>

          {/* Sidebar Toggle Button - Circle centered on left edge of sidebar */}
          {!sidebarCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 -translate-y-1/2 -left-5 z-50 w-10 h-10 rounded-full bg-background backdrop-blur-sm border border-border/50 shadow-md hover:bg-accent hover:text-primary hover:shadow-lg text-muted-foreground transition-all"
              onClick={collapseSidebar}
              aria-label={t('a11y.closeMenu')}
              title={t('a11y.closeMenu')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m9 18 6-6-6-6"/></svg>
            </Button>
          )}

        <Link to={createPageUrl('LandingHome')}>
          <motion.div 
            className="p-6 pb-4 cursor-pointer"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
          >
            <div className="flex items-center gap-3">
              {/* Logo Icon with advanced animations */}
              <motion.div 
                className="relative w-12 h-12 rounded-xl overflow-hidden shadow-organic bg-[#F7F5F2] flex-shrink-0 group"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Shimmer effect on hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out z-10"
                />
                <img 
                  src="/archiflow-logoV2.png" 
                  alt="ArchiFlow" 
                  className="w-full h-full object-cover relative z-0"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </motion.div>
              {/* Text with gradient animation */}
              <div className="flex flex-col justify-center">
                <motion.h1 
                  className="text-xl font-bold text-foreground tracking-tight leading-tight"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                  whileHover={{ 
                    scale: 1.02,
                    textShadow: "0 0 8px rgba(152, 78, 57, 0.3)"
                  }}
                >
                  ArchiFlow
                </motion.h1>
                <motion.p 
                  className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Architecture OS
                </motion.p>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredMenuItems.map((item) => {
              // Render section dividers
              if (item.isDivider) {
                return (
                  <li key={item.name} className="pt-4 pb-1 px-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {t(item.labelKey) || ''}
                    </span>
                  </li>
                );
              }

              const Icon = item.icon;

              // Handle group items with children
              if (item.isGroup) {
                const isExpanded = expandedGroups.includes(item.name);
                const groupActive = isGroupActive(item);

                return (
                  <li key={item.name}>
                    <button
                      onClick={() => toggleGroup(item.name)}
                      className={`
                        w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm
                        ${groupActive 
                          ? 'bg-accent text-accent-foreground font-medium' 
                          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        }
                      `}
                      aria-label={`${t(item.labelKey)}${isExpanded ? ', ' + t('a11y.closeMenu') : ', ' + t('a11y.openMenu')}`}
                      aria-expanded={isExpanded}
                      title={t(item.labelKey)}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" strokeWidth={groupActive ? 2 : 1.5} aria-hidden />
                        <span className="text-sm">{t(item.labelKey)}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <ul className={`mt-1 ${isRTL ? 'mr-4 border-r-2 pr-2' : 'ml-4 border-l-2 pl-2'} space-y-1 border-border`}>
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isActive(child.name);

                          return (
                            <li key={child.name}>
                              <Link
                                to={createPageUrl(child.name)}
                                className={`
                                  flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300
                                  ${childActive 
                                    ? 'bg-primary/10 text-primary font-medium' 
                                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                                  }
                                `}
                                aria-label={`${t('nav.navigateTo')} - ${t(child.labelKey)}`}
                                aria-current={childActive ? 'page' : undefined}
                                title={`${t('nav.navigateTo')} - ${t(child.labelKey)}`}
                              >
                                <ChildIcon className="w-4 h-4" strokeWidth={childActive ? 2 : 1.5} aria-hidden />
                                <span className="text-sm">{t(child.labelKey)}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              // Regular menu items with enhanced animations
              const active = isActive(item.name);

              return (
                <motion.li 
                  key={item.name}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 100, 
                    delay: filteredMenuItems.indexOf(item) * 0.05 
                  }}
                >
                  <Link
                    to={createPageUrl(item.name)}
                    className={`
                      flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 text-sm group relative overflow-hidden
                      ${active 
                        ? 'bg-primary text-primary-foreground font-medium shadow-organic' 
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }
                    `}
                    aria-label={`${t('nav.navigateTo')} - ${t(item.labelKey)}`}
                    aria-current={active ? 'page' : undefined}
                    title={`${t('nav.navigateTo')} - ${t(item.labelKey)}`}
                  >
                    {/* Animated background on hover */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-${isRTL ? 'l' : 'r'} from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
                      layoutId={active ? `nav-active-${item.name}` : undefined}
                    />
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon 
                        className={`w-4 h-4 transition-colors relative z-10 ${active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`} 
                        strokeWidth={active ? 2 : 1.5} 
                        aria-hidden="true" 
                      />
                    </motion.div>
                    <span className="relative z-10">{t(item.labelKey)}</span>

                    {/* Active indicator dot */}
                    {active && (
                      <motion.div
                        className={`absolute ${isRTL ? 'left-2' : 'right-2'} w-1.5 h-1.5 bg-primary-foreground rounded-full`}
                        layoutId="nav-indicator"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      />
                    )}
                  </Link>
                </motion.li>
              );
              })}
          </ul>
        </nav>

        {/* User Profile, Settings, and Dark Mode - Redesigned Bottom Section */}
        <div className="p-4 border-t border-border/50 bg-white/50 dark:bg-black/20">
          
          {/* Action Row: Settings, Theme, Notifications */}
          <div className="flex items-center justify-between mb-4 px-1 gap-2">
            <Link to={createPageUrl('Settings')} title={t('a11y.openSettings')}>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg bg-background border border-border/50 hover:border-primary/50 hover:text-primary shadow-sm hover:shadow-md transition-all" aria-label={t('a11y.openSettings')} title={t('a11y.openSettings')}>
                  <Settings className="w-4 h-4" strokeWidth={1.5} aria-hidden />
                </Button>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg bg-background border border-border/50 hover:border-primary/50 hover:text-primary shadow-sm hover:shadow-md transition-all"
              onClick={toggleDarkMode}
              title={isDarkMode ? t('layout.lightMode') : t('layout.darkMode')}
              aria-label={isDarkMode ? t('layout.lightMode') : t('layout.darkMode')}
              aria-pressed={isDarkMode}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.5} aria-hidden />
              ) : (
                <Moon className="w-4 h-4" strokeWidth={1.5} aria-hidden />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg bg-background border border-border/50 hover:border-primary/50 hover:text-primary shadow-sm hover:shadow-md transition-all relative"
              onClick={() => setShowNotifications(true)}
              aria-label={t('a11y.openNotifications')}
              title={t('a11y.openNotifications')}
            >
              <Bell className="w-4 h-4" strokeWidth={1.5} aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
              )}
            </Button>
          </div>

          {/* User Card */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/40 bg-background/50">
            <div className="w-9 h-9 bg-gradient-to-br from-primary/80 to-primary rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
              {loadingUser ? (
                <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
              ) : (
                <span className="text-sm font-bold text-primary-foreground">
                  {user?.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">{user?.full_name?.split(' ')[0]}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Global Search */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Main Content - Offset by sidebar width */}
      <main className={`flex-1 pb-20 md:pb-0 transition-all duration-300 ${sidebarCollapsed ? 'mr-0' : 'mr-0 md:mr-72'}`}>
        {/* Hamburger Menu Button is in PageHeader (sticky) for pages using it */}
        {/* For pages with custom headers: Dashboard, Projects detail, People - they handle their own buttons */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPageName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              type: "tween", 
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Navigation */}
      <MobileNavigation currentPageName={currentPageName} />

      {/* Floating Timer Widget - show on all pages except TimeTracking */}
      {currentPageName !== 'TimeTracking' && <FloatingTimerWidget />}

      {/* Global Quick Lead Button - show for architects and admins only */}
      {['super_admin', 'admin', 'architect', 'project_manager'].includes(user?.app_role) && (
        <>
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowQuickLeadModal(true)}
            className="fixed bottom-6 left-6 w-14 h-14 bg-primary text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center z-40 group"
            aria-label="הוסף ליד חדש (ליד מהיר)"
            title="הוסף ליד חדש – ליד מהיר"
          >
            <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </motion.button>

          <QuickLeadModal
            isOpen={showQuickLeadModal}
            onClose={() => setShowQuickLeadModal(false)}
            onSuccess={() => {
              setShowQuickLeadModal(false);
            }}
          />
        </>
      )}
      </div>
      );
}

export default function Layout(props) {
  const isPublicPage = PUBLIC_PAGES.includes(props.currentPageName);
  const isLandingPage = LANDING_PAGES.includes(props.currentPageName);
  
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SidebarProvider>
          {isPublicPage ? (
            <LayoutContent {...props} />
          ) : (
            <RequireAuth>
              <LayoutContent {...props} />
            </RequireAuth>
          )}
          {/* Push Notification Prompt - show only for authenticated users, not on landing pages */}
          {!isLandingPage && !isPublicPage && <PushNotificationPrompt delay={8000} />}
        </SidebarProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}