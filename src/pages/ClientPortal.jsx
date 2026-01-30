import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowRight,
  FileText,
  Briefcase,
  Building2,
  Clock,
  Calendar,
  Banknote,
  BookOpen,
  Upload,
  Loader2,
  Users,
  LogOut
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ClientProjectCard from '../components/client/ClientProjectCard';
import CommentSection from '../components/client/CommentSection';
import ApprovalButtons from '../components/client/ApprovalButtons';
import ClientGanttView from '../components/client/ClientGanttView';
import ClientFinancials from '../components/client/ClientFinancials';
import ClientMeetings from '../components/client/ClientMeetings';
import DocumentUploadDialog from '../components/projects/documents/DocumentUploadDialog';
import PageHeader from '../components/layout/PageHeader';

export default function ClientPortal() {
  const queryClient = useQueryClient();
  const { user, isLoadingAuth: loadingUser, navigateToLogin, logout } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  
  // Admin Impersonation State
  const [impersonateEmail, setImpersonateEmail] = useState('ALL');

  // Effective Email (User's or Impersonated)
  const effectiveEmail = (impersonateEmail && impersonateEmail !== 'ALL' && impersonateEmail !== 'me') 
    ? impersonateEmail 
    : user?.email;
  const canImpersonate = user?.role === 'admin' || user?.app_role === 'super_admin' || user?.app_role === 'architect';

  // Fetch Clients for Admin dropdown (to view portal as specific client)
  const { data: allClients = [] } = useQuery({
    queryKey: ['allClientsForImpersonation'],
    queryFn: () => base44.entities.Client.list('-created_date', 1000),
    enabled: canImpersonate
  });

  // 2. Fetch Client Profile (to link user to client)
  const { data: client, isLoading: loadingClient } = useQuery({
    queryKey: ['clientProfile', effectiveEmail],
    queryFn: async () => {
      if (!effectiveEmail) return null;
      const clients = await base44.entities.Client.filter({ email: effectiveEmail });
      return clients[0];
    },
    enabled: !!effectiveEmail,
  });

  // 3. Fetch Real Projects (based on ProjectPermission or direct client email)
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['clientProjects', effectiveEmail, impersonateEmail],
    queryFn: async () => {
      // Admin "Show All" Mode
      if (canImpersonate && impersonateEmail === 'ALL') {
        return await base44.entities.Project.list('-created_date');
      }

      const targetEmail = effectiveEmail;
      if (!targetEmail) return [];
      
      // Get projects where user has explicit permission
      const permissions = await base44.entities.ProjectPermission.filter({ user_email: targetEmail });
      const permissionProjectIds = permissions.map(p => p.project_id);
      
      // Also get projects where user is the designated client (legacy/direct link)
      const directProjects = await base44.entities.Project.filter({ client_email: targetEmail });
      
      // Fetch details for permission-based projects (with error handling for deleted projects)
      let permissionProjects = [];
      if (permissionProjectIds.length > 0) {
        const projectPromises = permissionProjectIds.map(async (id) => {
          try {
            return await base44.entities.Project.get(id);
          } catch (error) {
            console.warn(`Project ${id} not found, skipping...`);
            return null;
          }
        });
        const results = await Promise.all(projectPromises);
        permissionProjects = results.filter(p => p !== null);
      }

      // Merge and deduplicate
      const allProjects = [...directProjects, ...permissionProjects];
      const uniqueProjects = Array.from(new Map(allProjects.filter(p => p).map(p => [p.id, p])).values());
      
      return uniqueProjects;
    },
    enabled: !!effectiveEmail || (canImpersonate && impersonateEmail === 'ALL'),
  });

  // Fetch specific permissions for the selected project
  const { data: projectPermissions } = useQuery({
    queryKey: ['projectPermissions', selectedProjectId, effectiveEmail],
    queryFn: async () => {
      if (!selectedProjectId || !effectiveEmail) return null;
      const perms = await base44.entities.ProjectPermission.filter({ 
        project_id: String(selectedProjectId),
        user_email: effectiveEmail
      });
      return perms[0]?.permissions || null; // Return the permissions object directly
    },
    enabled: !!selectedProjectId && !!effectiveEmail
  });

  // Fetch tasks for selected project
  const { data: tasks = [] } = useQuery({
    queryKey: ['clientTasks', selectedProjectId],
    queryFn: () =>
      selectedProjectId
        ? base44.entities.Task.filter({ project_id: String(selectedProjectId) })
        : Promise.resolve([]),
    enabled: !!selectedProjectId,
  });

  // Fetch documents for selected project
  const { data: documents = [] } = useQuery({
    queryKey: ['clientDocuments', selectedProjectId],
    queryFn: () =>
      selectedProjectId
        ? base44.entities.Document.filter({ project_id: String(selectedProjectId) })
        : Promise.resolve([]),
    enabled: !!selectedProjectId,
  });

  // Fetch access permissions
  const { data: clientAccess } = useQuery({
    queryKey: ['clientAccess', effectiveEmail],
    queryFn: () => 
      effectiveEmail 
        ? base44.entities.ClientAccess.filter({ 
            client_email: effectiveEmail,
            is_active: true 
          })
        : Promise.resolve([]),
    enabled: !!effectiveEmail,
  });

  const handleLogin = () => {
    navigateToLogin();
  };

  const handleLogout = () => {
    logout();
  };



  // Loading State
  if (loadingUser || loadingClient || loadingProjects) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  // Check if user is approved (clients need approval)
  const isApproved = user?.approval_status === 'approved' || 
                     user?.app_role === 'super_admin' || 
                     user?.app_role === 'architect' ||
                     user?.role === 'admin';

  // Not Authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border shadow-soft-organic">
          <CardHeader className="text-center pb-6">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft-organic">
              <Building2 className="w-10 h-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-light text-foreground mb-2">
              פורטל לקוחות
            </CardTitle>
            <p className="text-muted-foreground">התחבר לצפייה בפרויקטים שלך</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Button
              onClick={handleLogin}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg shadow-soft-organic hover:shadow-soft-organic-hover"
            >
              כניסה למערכת
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not approved, show pending message
  if (!isApproved && !canImpersonate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border shadow-soft-organic text-center">
          <CardHeader className="pb-6">
            <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <CardTitle className="text-2xl font-light text-foreground mb-2">
              ממתין לאישור
            </CardTitle>
            <p className="text-muted-foreground">
              החשבון שלך ממתין לאישור מהאדריכל.<br/>
              תקבל הודעה ברגע שהחשבון יאושר.
            </p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full h-12"
            >
              יציאה
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedProject = projects.find(p => String(p.id) === String(selectedProjectId));
  const currentAccess = clientAccess?.find(a => String(a.project_id) === String(selectedProjectId));
  
  // Use new permissions if available, otherwise fallback to legacy access or defaults
  const permissions = projectPermissions || {
    view_documents: true,
    view_financials: !!currentAccess, // Fallback
    view_gantt: true,
    approve_items: currentAccess?.can_approve_tasks || false,
    comment: true,
    upload_documents: true // Default to true for client portal usually
  };

  // Projects List View
  if (!selectedProjectId) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8">
        <PageHeader 
          title={canImpersonate && impersonateEmail && impersonateEmail !== 'ALL' && impersonateEmail !== 'me'
            ? `צופה כ: ${allClients.find(c => c.email === impersonateEmail)?.full_name || impersonateEmail}`
            : impersonateEmail === 'ALL' 
              ? 'כל הפרויקטים במערכת'
              : `שלום, ${client?.full_name || user.full_name}`
          }
          subtitle={canImpersonate && impersonateEmail === 'ALL' 
            ? 'תצוגת מנהל - כל הפרויקטים' 
            : canImpersonate && impersonateEmail 
              ? 'מצב צפייה - פורטל לקוח' 
              : 'ברוך הבא לפורטל הלקוחות שלך'}
          icon="🏠"
        >
          {canImpersonate && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 100, delay: 1 }}
              className="flex items-center gap-2 bg-muted p-1 rounded-lg border border-border"
            >
              <Users className="w-4 h-4 text-muted-foreground mr-2" />
              <Select value={impersonateEmail || "ALL"} onValueChange={(val) => setImpersonateEmail(val)}>
                <SelectTrigger className="w-[250px] border-0 bg-transparent h-8 focus:ring-0">
                  <SelectValue placeholder="בחר לקוח לצפייה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">הצג את כל הפרויקטים</SelectItem>
                  <SelectItem value="me">הצג כשלי (מנהל)</SelectItem>
                  {allClients
                    .filter(c => c.email && c.email.trim() !== '') // Filter out clients without email
                    .map(c => (
                      <SelectItem key={c.id} value={c.email}>
                        {c.full_name || 'ללא שם'} {c.company ? `(${c.company})` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}
        </PageHeader>

        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-light text-foreground mb-6 tracking-tight">
              {canImpersonate && impersonateEmail ? 'הפרויקטים של המשתמש' : 'הפרויקטים שלך'}
            </h2>
            {projects.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-lg">לא נמצאו פרויקטים המשויכים לחשבון זה</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                  <ClientProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => setSelectedProjectId(project.id)}
                    index={index}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Single Project View
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-10 shadow-soft-organic">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <span 
                className="hover:text-primary cursor-pointer font-medium transition-colors"
                onClick={() => setSelectedProjectId(null)}
              >
                הפרויקטים שלי
              </span>
              <ArrowRight className="w-4 h-4" />
              <span className="text-foreground font-semibold">{selectedProject.name}</span>
            </div>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-light text-foreground mb-2 tracking-tight">
                  {selectedProject.name}
                </h1>
                <p className="text-lg text-muted-foreground">{selectedProject.location}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSelectedProjectId(null)} 
                className="gap-2 border-border shadow-soft-organic"
              >
                <ArrowRight className="w-4 h-4" />
                חזרה לרשימה
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border mb-6 w-full justify-start h-auto p-1 overflow-x-auto flex-nowrap shadow-soft-organic">
            <TabsTrigger value="overview" className="gap-2 h-10 px-4">
              <Building2 className="w-4 h-4" />
              סקירה
            </TabsTrigger>
            
            {permissions.view_gantt && (
              <TabsTrigger value="timeline" className="gap-2 h-10 px-4">
                <Calendar className="w-4 h-4" />
                לוח זמנים
              </TabsTrigger>
            )}
            
            <TabsTrigger value="tasks" className="gap-2 h-10 px-4">
              <Briefcase className="w-4 h-4" />
              משימות ({tasks.length})
            </TabsTrigger>
            
            {permissions.view_documents && (
              <TabsTrigger value="documents" className="gap-2 h-10 px-4">
                <FileText className="w-4 h-4" />
                מסמכים ({documents.length})
              </TabsTrigger>
            )}
            
            {permissions.view_financials && (
              <TabsTrigger value="financials" className="gap-2 h-10 px-4">
                <Banknote className="w-4 h-4" />
                כספים
              </TabsTrigger>
            )}
            
            <TabsTrigger value="meetings" className="gap-2 h-10 px-4">
              <BookOpen className="w-4 h-4" />
              סיכומים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">סה״כ משימות</p>
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">{tasks.length}</p>
                </CardContent>
              </Card>
              
              <Card className="border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">ממתינות לאישור</p>
                    <Clock className="w-5 h-5 text-archiflow-terracotta" />
                  </div>
                  <p className="text-3xl font-bold text-foreground">
                    {tasks.filter(t => t.approval_required && !t.approval_status).length}
                  </p>
                </CardContent>
              </Card>

              {permissions.view_documents && (
                <Card className="border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">מסמכים</p>
                      <FileText className="w-5 h-5 text-secondary" />
                    </div>
                    <p className="text-3xl font-bold text-foreground">{documents.length}</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Recent Timeline Preview */}
            {permissions.view_gantt && (
              <div className="mt-6">
                 <ClientGanttView project={selectedProject} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline">
            <ClientGanttView project={selectedProject} />
          </TabsContent>

          <TabsContent value="tasks">
            <div className="space-y-6">
              {tasks.length > 0 ? (
                tasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-border">
                      <CardHeader>
                        <CardTitle className="text-xl text-foreground">{task.title}</CardTitle>
                        {task.description && (
                          <p className="text-muted-foreground">{task.description}</p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {task.approval_required && permissions.approve_items && (
                          <ApprovalButtons
                            item={task}
                            itemType="task"
                            currentUser={{
                              name: client?.full_name || user.full_name,
                              email: user.email,
                              role: 'client'
                            }}
                            canApprove={true}
                          />
                        )}
                        {permissions.comment && (
                          <CommentSection
                            relatedId={task.id}
                            relatedType="task"
                            projectId={selectedProjectId}
                            currentUser={{
                              name: client?.full_name || user.full_name,
                              email: user.email,
                              role: 'client'
                            }}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Briefcase className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">אין משימות</h3>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="documents">
            {permissions.upload_documents && (
              <div className="mb-6 flex justify-end">
                <Button onClick={() => setShowUploadDialog(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover">
                  <Upload className="w-4 h-4 ml-2" />
                  העלאת מסמך
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-border hover:shadow-soft-organic-hover transition-all h-full flex flex-col">
                    <CardContent className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-6 h-6 text-secondary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground truncate" title={doc.title}>{doc.title}</h3>
                          <p className="text-xs text-muted-foreground">{doc.file_size}</p>
                        </div>
                      </div>
                      <div className="mt-auto">
                        <Button
                          variant="outline"
                          className="w-full border-border shadow-soft-organic"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          צפייה במסמך
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <DocumentUploadDialog
              isOpen={showUploadDialog}
              onClose={() => {
                setShowUploadDialog(false);
                queryClient.invalidateQueries({ queryKey: ['clientDocuments'] });
              }}
              project={selectedProject}
              presetCategory="other" // Default category for client uploads
              categoryLabel="קבצים כלליים"
            />
          </TabsContent>

          <TabsContent value="financials">
            <ClientFinancials projectId={selectedProjectId} />
          </TabsContent>

          <TabsContent value="meetings">
            <ClientMeetings projectId={selectedProjectId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}