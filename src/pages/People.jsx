import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import { useLanguage } from '@/components/providers/LanguageProvider';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Search,
  Plus,
  LayoutGrid,
  List,
  Briefcase,
  User,
  Building2,
  HardHat,
  Star,
  TrendingUp,
  Filter,
  SlidersHorizontal,
  Menu
} from 'lucide-react';

// Components
import TeamMemberCard from '@/components/team/TeamMemberCard';
import ClientCard from '@/components/clients/ClientCard';
import ContractorCard from '@/components/contractors/ContractorCard';
import ConsultantCard from '@/components/consultants/ConsultantCard';
import SupplierCard from '@/components/suppliers/SupplierCard';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import EntityDetailModal from '@/components/people/EntityDetailModal';
import UserManagementContent from '@/components/admin/UserManagementContent';

// Dialogs
import InviteUserDialog from '@/components/admin/InviteUserDialog';
import NewClientModal from '@/components/clients/NewClientModal';
import AddContractorDialog from '@/components/contractors/AddContractorDialog';
import AddConsultantDialog from '@/components/consultants/AddConsultantDialog';
import AddSupplierDialog from '@/components/suppliers/AddSupplierDialog';

// Animations
import { FloatingOrbs, ParticleField } from '@/components/animations/AnimatedBackground';
import { TextReveal, RevealOnScroll } from '@/components/animations/AnimatedComponents';

// Animation variants matching Dashboard
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30, 
    scale: 0.95,
    filter: "blur(5px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    }
  }
};

const headerVariants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 80,
      damping: 15,
    }
  }
};

export default function People() {
  const { t, isRTL } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [smartFilter, setSmartFilter] = useState('all');
  
  // Modal state
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedEntityType, setSelectedEntityType] = useState(null);
  
  // Dialog States
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showContractorModal, setShowContractorModal] = useState(false);
  const [showConsultantModal, setShowConsultantModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  
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

  // Check URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab) setActiveTab(tab);
  }, []);

  // --- Queries ---
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(base44),
  });
  
  const isAdmin = currentUser?.role === 'admin';
  const isSuperAdmin = currentUser?.app_role === 'super_admin';
  const myArchitectId = currentUser?.app_role === 'architect' ? currentUser?.id : null;
  const myEmail = currentUser?.email?.toLowerCase();

  const { data: allClients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-created_date', 500),
  });

  const { data: allContractors = [], isLoading: loadingContractors } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.list('-created_date', 500),
  });

  const { data: allTeamMembers = [], isLoading: loadingTeam } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list('-created_date', 200),
  });

  const { data: allConsultants = [], isLoading: loadingConsultants } = useQuery({
    queryKey: ['consultants'],
    queryFn: () => base44.entities.Consultant.list('-created_date', 500),
  });

  const { data: allSuppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list('-created_date', 500),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: allProjectConsultants = [] } = useQuery({
    queryKey: ['allProjectConsultants'],
    queryFn: () => base44.entities.ProjectConsultant.list(),
  });

  // Multi-tenant filtering
  const clients = isSuperAdmin 
    ? allClients 
    : allClients.filter(c => 
        c.architect_id === myArchitectId || 
        c.created_by?.toLowerCase() === myEmail ||
        c.architect_email?.toLowerCase() === myEmail ||
        c.approved_by?.toLowerCase() === myEmail
      );

  const contractors = isSuperAdmin 
    ? allContractors 
    : allContractors.filter(c => 
        c.architect_id === myArchitectId || 
        c.created_by?.toLowerCase() === myEmail ||
        c.architect_email?.toLowerCase() === myEmail ||
        c.approved_by?.toLowerCase() === myEmail
      );

  const teamMembers = isSuperAdmin 
    ? allTeamMembers 
    : allTeamMembers.filter(t => 
        t.architect_id === myArchitectId || 
        t.created_by?.toLowerCase() === myEmail ||
        t.architect_email?.toLowerCase() === myEmail ||
        t.approved_by?.toLowerCase() === myEmail
      );

  const consultants = isSuperAdmin 
    ? allConsultants 
    : allConsultants.filter(c => 
        c.architect_id === myArchitectId || 
        c.created_by?.toLowerCase() === myEmail ||
        c.architect_email?.toLowerCase() === myEmail ||
        c.approved_by?.toLowerCase() === myEmail
      );

  const suppliers = isSuperAdmin 
    ? allSuppliers 
    : allSuppliers.filter(s => 
        s.architect_id === myArchitectId || 
        s.created_by?.toLowerCase() === myEmail ||
        s.architect_email?.toLowerCase() === myEmail ||
        s.approved_by?.toLowerCase() === myEmail
      );

  // --- Stats ---
  const stats = [
    { 
      label: 'סה"כ אנשי קשר', 
      value: (clients.length + contractors.length + suppliers.length + teamMembers.length + consultants.length).toString(), 
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      label: 'לקוחות', 
      value: clients.length.toString(), 
      icon: User,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    { 
      label: 'קבלנים', 
      value: contractors.length.toString(), 
      icon: Briefcase,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    { 
      label: 'ספקים', 
      value: suppliers.length.toString(), 
      icon: Building2,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    },
    { 
      label: 'יועצים', 
      value: consultants.length.toString(), 
      icon: HardHat,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
  ];

  // --- Helpers ---
  const getClientProjectCount = (clientId) => projects.filter(p => p.client_id === clientId).length;
  const getConsultantProjectCount = (consultantId) => allProjectConsultants.filter(pc => pc.consultant_id === consultantId).length;

  // --- Filtering ---
  const getFilteredItems = () => {
    const q = searchQuery.toLowerCase();
    
    const teamItems = teamMembers.filter(t => 
      t.full_name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q)
    ).map(i => ({ ...i, entityType: 'team_member' }));

    const clientItems = clients.filter(c => 
      c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q)
    ).map(i => ({ ...i, entityType: 'client' }));

    const contractorItems = contractors.filter(c => 
      c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.phone?.includes(q)
    ).map(i => ({ ...i, entityType: 'contractor' }));

    const consultantItems = consultants.filter(c => 
      c.name?.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.phone?.includes(q)
    ).map(i => ({ ...i, entityType: 'consultant' }));

    const supplierItems = suppliers.filter(s => 
      s.name?.toLowerCase().includes(q) || s.company?.toLowerCase().includes(q) || s.phone?.includes(q)
    ).map(i => ({ ...i, entityType: 'supplier' }));

    // Apply smart filter for "all" tab
    let allItems = [...teamItems, ...clientItems, ...contractorItems, ...supplierItems, ...consultantItems];
    
    if (activeTab === 'all' && smartFilter !== 'all') {
      if (smartFilter === 'active') {
        allItems = allItems.filter(i => i.status === 'active' || !i.status);
      } else if (smartFilter === 'with_projects') {
        allItems = allItems.filter(i => {
          if (i.entityType === 'client') return getClientProjectCount(i.id) > 0;
          if (i.entityType === 'consultant') return getConsultantProjectCount(i.id) > 0;
          return true;
        });
      } else if (smartFilter === 'recent') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        allItems = allItems.filter(i => new Date(i.created_date) >= oneWeekAgo);
      } else if (smartFilter === 'high_rated') {
        allItems = allItems.filter(i => i.rating && i.rating >= 4);
      }
    }

    if (activeTab === 'team') return teamItems;
    if (activeTab === 'clients') return clientItems;
    if (activeTab === 'contractors') return contractorItems;
    if (activeTab === 'suppliers') return supplierItems;
    if (activeTab === 'consultants') return consultantItems;
    
    return allItems;
  };

  const filteredItems = getFilteredItems();
  const isLoading = loadingClients || loadingContractors || loadingSuppliers || loadingTeam || loadingConsultants;

  // --- Entity Click Handler ---
  const handleEntityClick = (entity, type) => {
    setSelectedEntity(entity);
    setSelectedEntityType(type);
  };

  // --- Render Card ---
  const renderCard = (item, index) => {
    const type = item.entityType;

    if (type === 'team_member') {
      return (
        <motion.div key={item.id} variants={itemVariants}>
          <TeamMemberCard 
            member={item} 
            index={index} 
            onClick={() => handleEntityClick(item, 'team_member')}
          />
        </motion.div>
      );
    }
    if (type === 'client') {
      return (
        <motion.div key={item.id} variants={itemVariants}>
          <ClientCard 
            client={item} 
            index={index} 
            projectCount={getClientProjectCount(item.id)}
            onClick={() => handleEntityClick(item, 'client')}
          />
        </motion.div>
      );
    }
    if (type === 'contractor') {
      return (
        <motion.div key={item.id} variants={itemVariants}>
          <ContractorCard 
            contractor={item} 
            index={index} 
            onClick={() => handleEntityClick(item, 'contractor')}
          />
        </motion.div>
      );
    }
    if (type === 'consultant') {
      return (
        <motion.div key={item.id} variants={itemVariants}>
          <ConsultantCard 
            consultant={item} 
            index={index} 
            projectCount={getConsultantProjectCount(item.id)}
            onClick={() => handleEntityClick(item, 'consultant')}
          />
        </motion.div>
      );
    }
    if (type === 'supplier') {
      return (
        <motion.div key={item.id} variants={itemVariants}>
          <SupplierCard 
            supplier={item} 
            index={index} 
            onClick={() => handleEntityClick(item, 'supplier')}
          />
        </motion.div>
      );
    }
    return null;
  };

  // --- Get Add Button ---
  const getAddButton = () => {
    if (activeTab === 'team' && isAdmin) {
      return (
        <Button onClick={() => setShowInviteModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover">
          <Plus className="w-5 h-5 ml-2" />
          <span className="hidden sm:inline">הוסף</span> עובד
        </Button>
      );
    }
    if (activeTab === 'clients') {
      return (
        <Button onClick={() => setShowClientModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover">
          <Plus className="w-5 h-5 ml-2" />
          לקוח חדש
        </Button>
      );
    }
    if (activeTab === 'contractors') {
      return (
        <Button onClick={() => setShowContractorModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover">
          <Plus className="w-5 h-5 ml-2" />
          קבלן חדש
        </Button>
      );
    }
    if (activeTab === 'consultants') {
      return (
        <Button onClick={() => setShowConsultantModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover">
          <Plus className="w-5 h-5 ml-2" />
          יועץ חדש
        </Button>
      );
    }
    if (activeTab === 'suppliers') {
      return (
        <Button onClick={() => setShowSupplierModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover">
          <Plus className="w-5 h-5 ml-2" />
          ספק חדש
        </Button>
      );
    }
    // All tab - show dropdown or multiple buttons
    return (
      <div className="flex gap-2 flex-wrap">
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={() => setShowInviteModal(true)} className="text-xs sm:text-sm">
            <Users className="w-4 h-4 ml-1" /> צוות
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setShowClientModal(true)} className="text-xs sm:text-sm">
          <User className="w-4 h-4 ml-1" /> לקוח
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowContractorModal(true)} className="text-xs sm:text-sm">
          <Briefcase className="w-4 h-4 ml-1" /> קבלן
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowSupplierModal(true)} className="text-xs sm:text-sm">
          <Building2 className="w-4 h-4 ml-1" /> ספק
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowConsultantModal(true)} className="text-xs sm:text-sm">
          <HardHat className="w-4 h-4 ml-1" /> יועץ
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 lg:p-12 overflow-hidden relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Animated Background */}
      <FloatingOrbs count={4} className="opacity-40" />
      <ParticleField count={15} />

      <motion.div
        className="relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header - Sticky */}
        <motion.div 
          className="mb-6 sm:mb-8 md:mb-12 border-b border-border pb-4 sm:pb-6 md:pb-8 sticky top-0 bg-background/95 backdrop-blur-sm z-40"
          variants={headerVariants}
        >
          {/* Animated accent line */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary via-secondary to-primary"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <motion.h1 
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              >
                אנשי קשר וצוות
              </motion.h1>
              
              {/* Hamburger Menu Button */}
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
            </div>
            <TextReveal 
              text="ניהול מרכזי של לקוחות, קבלנים, יועצים וצוות"
              className="text-muted-foreground text-sm sm:text-base md:text-lg"
              delay={0.4}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="flex items-center gap-3"
            >
              {/* View Mode Toggle */}
              <div className="bg-card rounded-lg border border-border p-1 flex shadow-soft-organic">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${viewMode === 'grid' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-2 ${viewMode === 'list' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
              {getAddButton()}
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <RevealOnScroll direction="up">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="bg-card border-border shadow-organic card-hover">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-muted-foreground mb-1">{stat.label}</p>
                          <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                        </div>
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${stat.bgColor} rounded-xl flex items-center justify-center shadow-organic-sm`}>
                          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} strokeWidth={1.5} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </RevealOnScroll>

        {/* Search and Tabs */}
        <motion.div 
          className="flex flex-col gap-4 mb-6"
          variants={itemVariants}
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
            <Input
              type="text"
              placeholder="חפש לפי שם, אימייל, חברה או טלפון..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${isRTL ? 'pr-12' : 'pl-12'} py-6 border-border bg-card focus:border-primary focus:ring-primary/20`}
            />
          </div>

          {/* Tabs and Smart Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto overflow-x-auto">
              <TabsList className="bg-card border border-border p-1 shadow-organic-sm flex w-full sm:w-auto min-w-max">
                <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-4">
                  הכל
                </TabsTrigger>
                <TabsTrigger value="team" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-4">
                  צוות
                </TabsTrigger>
                <TabsTrigger value="clients" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-4">
                  לקוחות
                </TabsTrigger>
                <TabsTrigger value="contractors" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-4">
                  קבלנים
                </TabsTrigger>
                <TabsTrigger value="suppliers" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-4">
                  ספקים
                </TabsTrigger>
                <TabsTrigger value="consultants" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-4">
                  יועצים
                </TabsTrigger>
                {(isAdmin || isSuperAdmin || currentUser?.app_role === 'architect') && (
                  <TabsTrigger value="users" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-4">
                    ניהול משתמשים
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>

            {/* Smart Filter - Only show on "All" tab */}
            {activeTab === 'all' && (
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <Select value={smartFilter} onValueChange={setSmartFilter}>
                  <SelectTrigger className="w-40 bg-card border-border">
                    <SelectValue placeholder="סינון חכם" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכל</SelectItem>
                    <SelectItem value="active">פעילים בלבד</SelectItem>
                    <SelectItem value="with_projects">עם פרויקטים</SelectItem>
                    <SelectItem value="recent">נוספו לאחרונה</SelectItem>
                    <SelectItem value="high_rated">דירוג גבוה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <SkeletonCard count={6} />
            </motion.div>
          ) : filteredItems.length > 0 ? (
            activeTab === 'users' && (isAdmin || isSuperAdmin || currentUser?.app_role === 'architect') ? (
              <UserManagementContent />
            ) :
            <motion.div 
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                : "flex flex-col gap-4"
              }
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredItems.map((item, index) => renderCard(item, index))}
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-16 sm:py-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-organic">
                <Search className="w-8 h-8 sm:w-10 sm:h-10 text-primary/60" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                לא נמצאו תוצאות
              </h3>
              <p className="text-muted-foreground mb-4">
                נסה לשנות את החיפוש או הסינון
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dialogs */}
        <InviteUserDialog 
          isOpen={showInviteModal} 
          onClose={() => setShowInviteModal(false)}
          onInvite={async (data) => {
            // Determine platform role - admin or user
            const platformRole = ['admin', 'super_admin'].includes(data.app_role) ? 'admin' : 'user';
            
            // Use base44.users.inviteUser directly from frontend SDK
            // This is the ONLY correct method - no backend function needed
            await base44.users.inviteUser(data.email, platformRole);
            
            // Create TeamMember record to track the invited user
            await base44.entities.TeamMember.create({
              full_name: data.full_name || data.email.split('@')[0],
              email: data.email,
              role: data.app_role || 'team_member',
              approval_status: 'approved',
              status: 'active',
              user_status: 'invited',
              architect_id: currentUser?.id,
              architect_email: currentUser?.email
            });
            
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
            setShowInviteModal(false);
          }}
          isLoading={false}
        />
        <NewClientModal 
          isOpen={showClientModal}
          onClose={() => setShowClientModal(false)}
        />
        <AddContractorDialog 
          isOpen={showContractorModal}
          onClose={() => setShowContractorModal(false)}
        />
        <AddConsultantDialog 
          isOpen={showConsultantModal}
          onClose={() => setShowConsultantModal(false)}
        />
        <AddSupplierDialog 
          isOpen={showSupplierModal}
          onClose={() => setShowSupplierModal(false)}
        />

        {/* Entity Detail Modal */}
        <EntityDetailModal
          isOpen={!!selectedEntity}
          onClose={() => {
            setSelectedEntity(null);
            setSelectedEntityType(null);
          }}
          entity={selectedEntity}
          entityType={selectedEntityType}
        />
      </motion.div>
    </div>
  );
}