import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users,
  Calendar,
  Settings,
  Menu,
  X,
  Mic,
  BookOpen,
  Building2,
  Palette,
  Banknote,
  HelpCircle,
  Bell,
  User,
  LogOut,
  Home,
  HardHat
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useSidebarState } from '@/components/providers/SidebarContext';

// Quick access items for bottom tab bar
const quickAccessItems = [
  { name: 'Dashboard', label: 'בית', icon: Home },
  { name: 'Projects', label: 'פרויקטים', icon: FolderKanban },
  { name: 'Calendar', label: 'יומן', icon: Calendar },
  { name: 'Recordings', label: 'הקלטות', icon: Mic },
];

// Full menu items for drawer
const menuItems = [
  { name: 'Dashboard', label: 'לוח בקרה', icon: LayoutDashboard },
  { name: 'Projects', label: 'פרויקטים', icon: FolderKanban },
  { name: 'Calendar', label: 'לוח שנה', icon: Calendar },
  { name: 'Recordings', label: 'הקלטות וניתוח', icon: Mic },
  { name: 'Journal', label: 'יומן', icon: BookOpen },
  { name: 'People', label: 'אנשי קשר וצוות', icon: Users },
  { name: 'ConsultantPortal', label: 'פורטל יועצים', icon: HardHat },
  { name: 'ContractorPortal', label: 'פורטל קבלנים', icon: Building2 },
  { name: 'DesignLibrary', label: 'ספריית עיצוב', icon: Palette },
  { name: 'Financials', label: 'כספים', icon: Banknote },
  { name: 'Settings', label: 'הגדרות', icon: Settings },
  { name: 'Support', label: 'עזרה ותמיכה', icon: HelpCircle },
];

export default function MobileNavigation({ currentPageName }) {
  const { mobileMenuOpen: isOpen, setMobileMenuOpen: setIsOpen, closeMobileMenu } = useSidebarState();
  const { logout, user } = useAuth();

  const isActive = (pageName) => currentPageName === pageName;

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Bottom Tab Bar - Always visible on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {quickAccessItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.name);
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.name)}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl min-w-[60px] transition-all ${
                  active 
                    ? 'text-primary' 
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* More menu button */}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-xl min-w-[60px] text-muted-foreground"
          >
            <Menu className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">עוד</span>
          </button>
        </div>
      </div>

      {/* Full Screen Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              className="md:hidden fixed inset-y-0 right-0 w-[85vw] max-w-[320px] bg-background z-50 shadow-2xl flex flex-col"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#F7F5F2]">
                    <img 
                      src="/archiflow-logoV2.png" 
                      alt="ArchiFlow" 
                      className="w-full h-full object-cover"
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">ArchiFlow</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Architecture OS</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto p-3">
                <ul className="space-y-1">
                  {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.name);
                    
                    return (
                      <motion.li
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Link
                          to={createPageUrl(item.name)}
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            active 
                              ? 'bg-primary text-primary-foreground font-medium' 
                              : 'text-foreground hover:bg-accent'
                          }`}
                        >
                          <Icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5} />
                          <span className="text-sm">{item.label}</span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              {/* User Section */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/50 mb-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user?.full_name || 'משתמש'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">התנתק</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}