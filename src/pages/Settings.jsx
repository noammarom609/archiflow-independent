import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Toaster moved to App.jsx for global fixed positioning
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell, 
  Globe,
  Camera,
  Loader2,
  Save,
  LogOut,
  Sliders,
  ClipboardList,
  Check,
  Palette,
  Sun,
  Moon,
  Monitor,
  RotateCcw,
  Sparkles,
  Menu
} from 'lucide-react';
import { THEMES, useTheme } from '@/components/providers/ThemeProvider';



import ChecklistSettingsTab from '../components/settings/ChecklistSettingsTab';
import { showSuccess, showError } from '../components/utils/notifications';
import { NotificationSettings } from '../components/notifications/PushNotificationPrompt';

export default function Settings() {
  const queryClient = useQueryClient();
  const { logout, user: authUser, isLoadingAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);
  
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

  const { 
    currentTheme, 
    changeTheme, 
    updateCustomColors, 
    resetTheme, 
    getCurrentPrimaryColor, 
    customColors 
  } = useTheme();
  
  // Custom Color State for Theme
  const [customColor, setCustomColor] = useState(getCurrentPrimaryColor());
  
  // Update custom color input when theme changes
  React.useEffect(() => {
    setCustomColor(getCurrentPrimaryColor());
  }, [currentTheme, getCurrentPrimaryColor]);

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
    showSuccess('ערכת נושא עודכנה');
  };

  const handleCustomColorApply = () => {
    updateCustomColors({ primary: customColor });
    showSuccess('צבע מותאם אישית הוחל');
  };

  const handleResetTheme = () => {
    resetTheme();
    setCustomColor(THEMES.terracotta.primary);
    showSuccess('ערכת נושא אופסה לברירת מחדל');
  };

  const organicThemePresets = Object.values(THEMES).map(theme => ({
    name: theme.name,
    label: theme.name === 'terracotta' ? `${theme.label} (ברירת מחדל)` : theme.label,
    preview: theme.primary,
  }));

  const isCustomColorActive = customColors.primary && 
    !Object.values(THEMES).some(t => t.primary.toLowerCase() === customColors.primary.toLowerCase());

  // Use user from AuthContext (includes Supabase data)
  const currentUser = authUser;
  const isLoading = isLoadingAuth;

  // Profile form state
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    avatar_url: '',
  });

  // Password form state
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  // Notifications preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    email_notifications: true,
    app_notifications: true,
    project_updates: true,
    task_updates: true,
    contractor_updates: false,
  });

  // Language preference
  const [language, setLanguage] = useState('he');
  const [theme, setTheme] = useState('system');

  // Update profile when user data loads
  React.useEffect(() => {
    if (currentUser) {
      setProfile({
        full_name: currentUser.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        avatar_url: currentUser.avatar_url || '',
      });
      setNotificationPrefs(currentUser.notification_preferences || notificationPrefs);
      setLanguage(currentUser.language || 'he');
      setTheme(currentUser.theme || 'system');
    }
  }, [currentUser]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      showSuccess('הפרופיל עודכן בהצלחה ✓');
    },
    onError: () => {
      showError('שגיאה בעדכון הפרופיל');
    },
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profile);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      showError('הסיסמאות אינן תואמות');
      return;
    }
    if (passwords.new.length < 6) {
      showError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (!passwords.current) {
      showError('יש להזין סיסמה נוכחית');
      return;
    }
    // Note: Password change is managed through Base44 authentication system
    showError('שינוי סיסמה מתבצע דרך מערכת ההתחברות. לחץ על "שכחתי סיסמה" בעת הכניסה.');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const handleNotificationsSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({ notification_preferences: notificationPrefs });
  };

  const handleLanguageSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({ language });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfile(prev => ({ ...prev, avatar_url: file_url }));
      await updateProfileMutation.mutateAsync({ avatar_url: file_url });
    } catch (error) {
      showError('שגיאה בהעלאת התמונה');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Header - Sticky */}
        <div className="mb-12 border-b border-border pb-8 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-40 -mx-8 md:-mx-12 px-8 md:px-12 pt-8 md:pt-12 -mt-8 md:-mt-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-organic">
              <SettingsIcon className="w-7 h-7 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground tracking-tight">הגדרות</h1>
              <p className="text-muted-foreground font-light text-lg">נהל את הפרופיל וההעדפות שלך</p>
            </div>
            
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
          <Button 
            variant="outline" 
            className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 ml-2" />
            התנתק
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-card border border-border p-1.5 rounded-xl">
            <TabsTrigger value="profile" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="w-4 h-4" />
              פרטים אישיים
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Lock className="w-4 h-4" />
              סיסמה
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Bell className="w-4 h-4" />
              התראות
            </TabsTrigger>
            <TabsTrigger value="language" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Globe className="w-4 h-4" />
              שפה ומראה
            </TabsTrigger>
            {(currentUser?.app_role === 'super_admin' || currentUser?.app_role === 'admin' || currentUser?.role === 'admin') && (
              <>
                <TabsTrigger value="checklists" className="gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <ClipboardList className="w-4 h-4" />
                  צ׳קליסטים
                </TabsTrigger>

              </>
            )}
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="border-border shadow-organic">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">פרופיל אישי</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24 border-2 border-border">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                          {profile.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-organic"
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4 text-primary-foreground" />
                        )}
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">תמונת פרופיל</h3>
                      <p className="text-sm text-muted-foreground">לחץ על המצלמה להעלאת תמונה חדשה</p>
                    </div>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-foreground">שם מלא</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      placeholder="הזן שם מלא"
                      className="border-border bg-card"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">אימייל</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="הזן כתובת אימייל"
                      disabled
                      className="bg-muted border-border"
                    />
                    <p className="text-xs text-muted-foreground">לא ניתן לשנות את כתובת האימייל</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">טלפון</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="הזן מספר טלפון"
                      className="border-border bg-card"
                    />
                  </div>

                  {/* Role (Read-only) */}
                  <div className="space-y-2">
                    <Label className="text-foreground">תפקיד במערכת</Label>
                    <Input
                      value={
                        currentUser?.app_role === 'super_admin' ? 'מנהל על' :
                        currentUser?.app_role === 'admin' || currentUser?.role === 'admin' ? 'מנהל מערכת' :
                        currentUser?.app_role === 'architect' ? 'אדריכל' :
                        currentUser?.app_role === 'project_manager' ? 'מנהל פרויקט' :
                        currentUser?.app_role === 'team_member' ? 'איש צוות' :
                        currentUser?.app_role === 'client' ? 'לקוח' :
                        currentUser?.app_role === 'contractor' ? 'קבלן' :
                        currentUser?.app_role === 'consultant' ? 'יועץ' :
                        'משתמש'
                      }
                      disabled
                      className="bg-muted border-border"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-organic hover-lift"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        שומר...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        שמור שינויים
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card className="border-border shadow-organic">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">שינוי סיסמה</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-foreground">סיסמה נוכחית</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder="הזן סיסמה נוכחית"
                      className="border-border bg-card"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-foreground">סיסמה חדשה</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder="הזן סיסמה חדשה"
                      className="border-border bg-card"
                    />
                    <p className="text-xs text-muted-foreground">לפחות 6 תווים</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-foreground">אימות סיסמה</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="הזן שוב את הסיסמה החדשה"
                      className="border-border bg-card"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-organic hover-lift">
                    <Lock className="w-4 h-4 ml-2" />
                    שנה סיסמה
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="border-border shadow-organic">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">העדפות התראות</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Push Notifications Settings */}
                <div className="mb-8">
                  <NotificationSettings />
                </div>
                
                <hr className="border-border my-6" />
                
                <form onSubmit={handleNotificationsSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-5 bg-muted/50 rounded-xl border border-border">
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">התראות במייל</h4>
                        <p className="text-sm text-muted-foreground">קבל עדכונים לכתובת האימייל שלך</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.email_notifications}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs({ ...notificationPrefs, email_notifications: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-5 bg-muted/50 rounded-xl border border-border">
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">התראות באפליקציה</h4>
                        <p className="text-sm text-muted-foreground">קבל עדכונים בממשק המערכת</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.app_notifications}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs({ ...notificationPrefs, app_notifications: checked })
                        }
                      />
                    </div>

                    <div className="border-t border-border pt-6 mt-6">
                      <h4 className="font-semibold text-foreground mb-4">סוגי התראות</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border/50">
                          <span className="text-sm text-foreground">עדכוני פרויקטים</span>
                          <Switch
                            checked={notificationPrefs.project_updates}
                            onCheckedChange={(checked) =>
                              setNotificationPrefs({ ...notificationPrefs, project_updates: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border/50">
                          <span className="text-sm text-foreground">עדכוני משימות</span>
                          <Switch
                            checked={notificationPrefs.task_updates}
                            onCheckedChange={(checked) =>
                              setNotificationPrefs({ ...notificationPrefs, task_updates: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border/50">
                          <span className="text-sm text-foreground">עדכוני קבלנים</span>
                          <Switch
                            checked={notificationPrefs.contractor_updates}
                            onCheckedChange={(checked) =>
                              setNotificationPrefs({ ...notificationPrefs, contractor_updates: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-organic hover-lift"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        שומר...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        שמור העדפות
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language & Theme Tab */}
          <TabsContent value="language">
            <Card className="border-border shadow-organic">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">שפה ומראה</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  updateProfileMutation.mutate({ language, theme });
                }} className="space-y-8">
                  
                  {/* Enhanced Language & Theme Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Language Section */}
                    <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            שפת ממשק
                        </h3>
                        <div className="grid gap-3">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setLanguage('he')}
                                className={`relative overflow-hidden p-4 rounded-2xl border-2 cursor-pointer transition-all h-32 flex items-center justify-between ${
                                language === 'he'
                                    ? 'border-primary bg-primary/5 shadow-organic'
                                    : 'border-border bg-card hover:border-primary/30'
                                }`}
                            >
                                <div className="z-10 flex items-center gap-4">
                                    <span className="text-4xl shadow-sm rounded-lg">🇮🇱</span>
                                    <div className="text-right">
                                        <h4 className={`font-bold text-lg ${language === 'he' ? 'text-primary' : 'text-foreground'}`}>עברית</h4>
                                        <p className="text-sm text-muted-foreground">Hebrew</p>
                                    </div>
                                </div>
                                {language === 'he' && (
                                    <div className="absolute top-3 left-3 bg-primary text-white rounded-full p-1 shadow-lg animate-in zoom-in">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                                <div className="absolute -right-6 -bottom-6 text-9xl opacity-5 select-none pointer-events-none font-serif">א</div>
                            </motion.div>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setLanguage('en')}
                                className={`relative overflow-hidden p-4 rounded-2xl border-2 cursor-pointer transition-all h-32 flex items-center justify-between ${
                                language === 'en'
                                    ? 'border-primary bg-primary/5 shadow-organic'
                                    : 'border-border bg-card hover:border-primary/30'
                                }`}
                            >
                                <div className="z-10 flex items-center gap-4">
                                    <span className="text-4xl shadow-sm rounded-lg">🇺🇸</span>
                                    <div className="text-right">
                                        <h4 className={`font-bold text-lg ${language === 'en' ? 'text-primary' : 'text-foreground'}`}>English</h4>
                                        <p className="text-sm text-muted-foreground">אנגלית</p>
                                    </div>
                                </div>
                                {language === 'en' && (
                                    <div className="absolute top-3 left-3 bg-primary text-white rounded-full p-1 shadow-lg animate-in zoom-in">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                                <div className="absolute -right-4 -bottom-4 text-9xl opacity-5 select-none pointer-events-none font-serif">A</div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Theme Section */}
                    <div>
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Palette className="w-4 h-4 text-primary" />
                            ערכות נושא (צבעים)
                        </h3>
                        <div className="grid gap-3">
                            {organicThemePresets.map((t) => (
                                <motion.button
                                    key={t.name}
                                    type="button"
                                    onClick={() => handleThemeChange(t.name)}
                                    className={`
                                      p-4 rounded-xl border-2 transition-all text-right group relative overflow-hidden
                                      ${currentTheme === t.name && !isCustomColorActive
                                        ? 'border-primary bg-primary/5 shadow-organic' 
                                        : 'border-border hover:border-primary/50'
                                      }
                                    `}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-foreground">{t.label.replace(' (ברירת מחדל)', '')}</span>
                                        {currentTheme === t.name && !isCustomColorActive && (
                                            <Check className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                    <div 
                                      className="w-full h-8 rounded-lg shadow-sm" 
                                      style={{ backgroundColor: t.preview }}
                                    />
                                </motion.button>
                            ))}
                        </div>

                        <div className="mt-6 space-y-4">
                            <Label>צבע מותאם אישית</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={customColor}
                                    onChange={(e) => setCustomColor(e.target.value)}
                                    className="w-12 h-12 p-1 rounded-lg cursor-pointer"
                                />
                                <Input 
                                    type="text" 
                                    value={customColor} 
                                    onChange={(e) => setCustomColor(e.target.value)}
                                    className="flex-1"
                                />
                                <Button type="button" onClick={handleCustomColorApply} variant="outline">החל</Button>
                            </div>
                            
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={handleResetTheme} 
                                className="w-full text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="w-4 h-4 ml-2" />
                                אפס לברירת מחדל
                            </Button>
                        </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-organic hover-lift"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        שומר...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        שמור שינויים
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checklists Settings Tab (Admin Only) */}
          {(currentUser?.app_role === 'super_admin' || currentUser?.app_role === 'admin' || currentUser?.role === 'admin') && (
            <TabsContent value="checklists">
              <ChecklistSettingsTab />
            </TabsContent>
          )}


        </Tabs>
      </motion.div>
    </div>
  );
}