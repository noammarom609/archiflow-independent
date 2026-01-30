import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HardHat,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  MessageSquare,
  Briefcase,
  PenTool,
  Loader2,
  LogOut,
  FolderKanban,
  Users
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ConsultantDocumentUpload from '../components/consultants/ConsultantDocumentUpload';
import ConsultantTaskManager from '../components/consultants/ConsultantTaskManager';
import ConsultantMessagingSystem from '../components/consultants/ConsultantMessagingSystem';
import DigitalSignatureDialog from '../components/signature/DigitalSignatureDialog';
import SignatureHistory from '../components/signature/SignatureHistory';
import PageHeader from '../components/layout/PageHeader';

export default function ConsultantPortal() {
  const { user, isLoadingAuth: loadingUser, logout } = useAuth();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [documentToSign, setDocumentToSign] = useState(null);
  const [impersonateEmail, setImpersonateEmail] = useState(null);

  // Check if user is approved
  const isApproved = user?.approval_status === 'approved' || 
                     user?.app_role === 'super_admin' || 
                     user?.app_role === 'architect' ||
                     user?.role === 'admin';

  const canImpersonate = user?.role === 'admin' || user?.app_role === 'super_admin' || user?.app_role === 'architect';

  // Fetch Consultants for dropdown
  const { data: allConsultants = [] } = useQuery({
    queryKey: ['allConsultantsForImpersonation'],
    queryFn: () => base44.entities.Consultant.list('-created_date'),
    enabled: canImpersonate
  });

  // Fetch consultant documents
  const { data: allDocuments = [] } = useQuery({
    queryKey: ['consultantDocuments'],
    queryFn: () => base44.entities.ConsultantDocument.list('-created_date', 100),
  });

  // Fetch consultant tasks
  const { data: allTasks = [] } = useQuery({
    queryKey: ['consultantTasks'],
    queryFn: () => base44.entities.ConsultantTask.list('-updated_date', 100),
  });

  // Fetch consultant messages
  const { data: allMessages = [] } = useQuery({
    queryKey: ['consultantMessages'],
    queryFn: () => base44.entities.ConsultantMessage.list('-created_date', 100),
  });

  // Fetch project consultants to show assigned projects
  const { data: projectConsultants = [] } = useQuery({
    queryKey: ['myProjectConsultants', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      // Find consultant record by email
      const consultants = await base44.entities.Consultant.filter({ email: user.email });
      if (consultants.length === 0) return [];
      const consultantId = consultants[0].id;
      return base44.entities.ProjectConsultant.filter({ consultant_id: consultantId }, '-created_date');
    },
    enabled: !!user?.email,
  });

  // Fetch projects for names
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => base44.entities.Project.list(),
  });

  // Fetch signatures
  const { data: allSignatures = [] } = useQuery({
    queryKey: ['consultantDocumentSignatures'],
    queryFn: () => base44.entities.DocumentSignature.list('-created_date', 200),
  });

  // Multi-tenant filtering
  const targetEmail = canImpersonate && impersonateEmail ? impersonateEmail : user?.email;
  const showAll = canImpersonate && !impersonateEmail;

  const documents = showAll 
    ? allDocuments 
    : allDocuments.filter(doc => doc.created_by === targetEmail);

  const tasks = showAll 
    ? allTasks 
    : allTasks.filter(task => 
        task.created_by === targetEmail || 
        (task.assigned_to && task.assigned_to.includes(targetEmail))
      );

  const messages = showAll 
    ? allMessages 
    : allMessages.filter(msg => 
        msg.sender_id === targetEmail || 
        msg.recipient_id === targetEmail ||
        msg.created_by === targetEmail
      );

  const signatures = showAll 
    ? allSignatures 
    : allSignatures.filter(sig => sig.created_by === targetEmail || sig.signer_id === targetEmail);

  const pendingDocs = documents.filter(d => d.status === 'pending').length;
  const approvedDocs = documents.filter(d => d.status === 'approved').length;
  const activeTasks = tasks.filter(t => ['pending', 'in_progress'].includes(t.status)).length;
  const unreadMessages = messages.filter(m => !m.is_read).length;
  const activeProjects = projectConsultants.filter(pc => pc.status === 'active').length;

  // Loading state
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  // Check approval status for consultants
  if (!isApproved) {
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
              onClick={() => logout()}
              className="w-full h-12"
            >
              <LogOut className="w-4 h-4 ml-2" />
              יציאה
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <PageHeader 
          title={canImpersonate && impersonateEmail 
            ? `צופה כ: ${allConsultants.find(c => c.email === impersonateEmail)?.full_name || impersonateEmail}`
            : "פורטל יועצים"
          } 
          subtitle={canImpersonate && impersonateEmail ? "מצב צפייה - פורטל יועץ" : "ניהול משימות, מסמכים, פרויקטים ותקשורת"}
          icon="🏛️"
        >
          <div className="flex items-center gap-3">
            {canImpersonate && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 100, delay: 1 }}
                className="flex items-center gap-2 bg-muted p-1 rounded-lg border border-border"
              >
                <Users className="w-4 h-4 text-muted-foreground mr-2" />
                <Select value={impersonateEmail || ""} onValueChange={(val) => setImpersonateEmail(val === "me" ? null : val)}>
                  <SelectTrigger className="w-[250px] border-0 bg-transparent h-8 focus:ring-0">
                    <SelectValue placeholder="בחר יועץ לצפייה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">הצג הכל (מנהל)</SelectItem>
                    {allConsultants
                      .filter(c => c.email && c.email.trim() !== '')
                      .map(c => (
                        <SelectItem key={c.id} value={c.email}>
                          {c.full_name || 'ללא שם'} {c.specialty ? `(${c.specialty})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 150, delay: 1.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover"
              >
                <Upload className="w-5 h-5 ml-2" />
                העלאת מסמך
              </Button>
            </motion.div>
          </div>
        </PageHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">פרויקטים פעילים</p>
                  <p className="text-3xl font-bold text-primary">{activeProjects}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">מסמכים ממתינים</p>
                  <p className="text-3xl font-bold text-archiflow-terracotta">{pendingDocs}</p>
                </div>
                <div className="w-12 h-12 bg-archiflow-terracotta/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-archiflow-terracotta" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">מסמכים מאושרים</p>
                  <p className="text-3xl font-bold text-archiflow-forest-green">{approvedDocs}</p>
                </div>
                <div className="w-12 h-12 bg-archiflow-forest-green/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-archiflow-forest-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">משימות פעילות</p>
                  <p className="text-3xl font-bold text-archiflow-taupe">{activeTasks}</p>
                </div>
                <div className="w-12 h-12 bg-archiflow-taupe/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-archiflow-taupe" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">הודעות חדשות</p>
                  <p className="text-3xl font-bold text-secondary">{unreadMessages}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-border">
          <CardContent className="p-6">
            <Tabs defaultValue="projects" dir="rtl">
              <TabsList className="grid w-full grid-cols-4 bg-muted">
                <TabsTrigger value="projects">
                  <FolderKanban className="w-4 h-4 ml-2" />
                  פרויקטים
                </TabsTrigger>
                <TabsTrigger value="tasks">
                  <Briefcase className="w-4 h-4 ml-2" />
                  משימות
                </TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="w-4 h-4 ml-2" />
                  מסמכים
                </TabsTrigger>
                <TabsTrigger value="messages">
                  <MessageSquare className="w-4 h-4 ml-2" />
                  הודעות
                </TabsTrigger>
              </TabsList>

              {/* Projects Tab */}
              <TabsContent value="projects" className="mt-6">
                {projectConsultants.length === 0 ? (
                  <div className="text-center py-12">
                    <FolderKanban className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">אין פרויקטים משויכים</p>
                    <p className="text-sm text-muted-foreground mt-2">פרויקטים ישויכו אליך על ידי האדריכל</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projectConsultants.map((pc, index) => {
                      const project = projects.find(p => p.id === pc.project_id);
                      return (
                        <motion.div
                          key={pc.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="border-border hover:shadow-soft-organic-hover transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <FolderKanban className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-foreground">{project?.name || 'פרויקט'}</h3>
                                    <p className="text-xs text-muted-foreground">{pc.scope || 'תחום לא הוגדר'}</p>
                                  </div>
                                </div>
                                <Badge className={
                                  pc.status === 'active' 
                                    ? 'bg-secondary/10 text-secondary border-secondary/30' 
                                    : pc.status === 'completed'
                                    ? 'bg-primary/10 text-primary border-primary/30'
                                    : 'bg-muted text-muted-foreground border-border'
                                }>
                                  {pc.status === 'active' ? 'פעיל' : pc.status === 'completed' ? 'הושלם' : 'ממתין'}
                                </Badge>
                              </div>
                              {project?.client_name && (
                                <p className="text-sm text-muted-foreground mb-2">לקוח: {project.client_name}</p>
                              )}
                              {pc.fee && (
                                <p className="text-sm font-semibold text-foreground">שכ"ט: ₪{pc.fee.toLocaleString()}</p>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tasks" className="mt-6">
                <ConsultantTaskManager tasks={tasks} />
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <div className="space-y-4">
                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">אין מסמכים עדיין</p>
                      <Button
                        onClick={() => setShowUploadDialog(true)}
                        className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover"
                      >
                        <Upload className="w-4 h-4 ml-2" />
                        העלה מסמך ראשון
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {documents.map((doc, index) => {
                        const docSignatures = signatures.filter(s => s.document_id === doc.id);
                        const isSigned = docSignatures.length > 0;
                        const requiresSignature = ['contract', 'quote', 'approval', 'certificate'].includes(doc.file_type);

                        return (
                          <motion.div
                            key={doc.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className="border-border hover:shadow-soft-organic-hover transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                                      <FileText className="w-6 h-6 text-secondary" />
                                    </div>
                                    <div className="flex-1">
                                      <h3 className="font-bold text-foreground mb-1">{doc.title}</h3>
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {doc.project_name} • {doc.file_size}
                                      </p>
                                      {doc.notes && (
                                        <p className="text-sm text-muted-foreground/80">{doc.notes}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex flex-col gap-2 items-end">
                                    <Badge
                                      className={
                                        doc.status === 'approved'
                                          ? 'bg-archiflow-forest-green/20 text-archiflow-forest-green border-archiflow-forest-green/30'
                                          : doc.status === 'rejected'
                                          ? 'bg-destructive/20 text-destructive border-destructive/30'
                                          : 'bg-archiflow-terracotta/20 text-archiflow-terracotta border-archiflow-terracotta/30'
                                      }
                                    >
                                      {doc.status === 'approved'
                                        ? 'מאושר'
                                        : doc.status === 'rejected'
                                        ? 'נדחה'
                                        : 'ממתין'}
                                    </Badge>
                                    {requiresSignature && (
                                      <Badge
                                        className={
                                          isSigned
                                            ? 'bg-archiflow-forest-green/20 text-archiflow-forest-green border-archiflow-forest-green/30'
                                            : 'bg-archiflow-terracotta/20 text-archiflow-terracotta border-archiflow-terracotta/30'
                                        }
                                      >
                                        {isSigned ? '✓ נחתם' : 'דרוש חתימה'}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Signature Action */}
                                {requiresSignature && !isSigned && doc.status === 'approved' && (
                                  <Button
                                    onClick={() => {
                                      setDocumentToSign(doc);
                                      setShowSignatureDialog(true);
                                    }}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover"
                                    size="sm"
                                  >
                                    <PenTool className="w-4 h-4 ml-2" />
                                    חתום על המסמך
                                  </Button>
                                )}

                                {/* Signature History */}
                                {isSigned && (
                                  <div className="mt-4 pt-4 border-t border-border">
                                    <SignatureHistory
                                      signatures={docSignatures}
                                      documentTitle={doc.title}
                                    />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="messages" className="mt-6">
                <ConsultantMessagingSystem messages={messages} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <ConsultantDocumentUpload
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
      />

      <DigitalSignatureDialog
        isOpen={showSignatureDialog}
        onClose={() => {
          setShowSignatureDialog(false);
          setDocumentToSign(null);
        }}
        document={documentToSign}
        signerInfo={{
          id: user?.id || 'consultant-1',
          name: user?.full_name || 'יועץ',
          role: 'consultant',
        }}
      />
    </div>
  );
}