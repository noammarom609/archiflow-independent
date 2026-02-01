import React, { useState } from 'react';
import { motion } from 'framer-motion';
// Toaster moved to App.jsx for global fixed positioning
import { archiflow } from '@/api/archiflow';
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
  Users,
  DollarSign,
  Send
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '@/components/utils/notifications';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ContractorDocumentUpload from '../components/contractors/ContractorDocumentUpload';
import ContractorTaskManager from '../components/contractors/ContractorTaskManager';
import MessagingSystem from '../components/contractors/MessagingSystem';
import DigitalSignatureDialog from '../components/signature/DigitalSignatureDialog';
import SignatureHistory from '../components/signature/SignatureHistory';
import PageHeader from '../components/layout/PageHeader';

export default function ContractorPortal() {
  const { user, isLoadingAuth: loadingUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [documentToSign, setDocumentToSign] = useState(null);
  const [impersonateEmail, setImpersonateEmail] = useState(null);
  const [quoteFormData, setQuoteFormData] = useState({});
  const [submittingQuoteId, setSubmittingQuoteId] = useState(null);

  // Check if user is approved
  const isApproved = user?.approval_status === 'approved' || 
                     user?.app_role === 'super_admin' || 
                     user?.app_role === 'architect' ||
                     user?.role === 'admin';

  const canImpersonate = user?.role === 'admin' || user?.app_role === 'super_admin' || user?.app_role === 'architect';

  // Fetch Contractors for dropdown
  const { data: allContractors = [] } = useQuery({
    queryKey: ['allContractorsForImpersonation'],
    queryFn: () => archiflow.entities.Contractor.list('-created_date'),
    enabled: canImpersonate
  });

  // Fetch contractor documents
  const { data: allDocuments = [] } = useQuery({
    queryKey: ['contractorDocuments'],
    queryFn: () => archiflow.entities.ContractorDocument.list('-created_date', 100),
  });

  // Fetch contractor tasks
  const { data: allTasks = [] } = useQuery({
    queryKey: ['contractorTasks'],
    queryFn: () => archiflow.entities.Task.list('-updated_date', 100),
  });

  // Fetch messages
  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => archiflow.entities.Message.list('-created_date', 100),
  });

  // Fetch signatures
  const { data: allSignatures = [] } = useQuery({
    queryKey: ['documentSignatures'],
    queryFn: () => archiflow.entities.DocumentSignature.list('-created_date', 200),
  });

  // Fetch contractor quotes
  const { data: allQuotes = [] } = useQuery({
    queryKey: ['contractorQuotes'],
    queryFn: () => archiflow.entities.ContractorQuote.list('-created_date', 100),
  });

  // Submit quote mutation
  const submitQuoteMutation = useMutation({
    mutationFn: async ({ quoteId, data }) => {
      return archiflow.entities.ContractorQuote.update(quoteId, {
        quote_amount: data.amount,
        quote_details: data.details,
        execution_time_days: data.executionDays,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractorQuotes'] });
      setQuoteFormData({});
      setSubmittingQuoteId(null);
      showSuccess('הצעת המחיר נשלחה בהצלחה!');
    },
    onError: () => {
      showError('שגיאה בשליחת הצעת המחיר');
    }
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

  // Filter quotes for this contractor
  const quotes = showAll 
    ? allQuotes 
    : allQuotes.filter(q => q.contractor_email === targetEmail || q.created_by === targetEmail);
  
  const pendingQuotes = quotes.filter(q => q.status === 'requested').length;
  const submittedQuotes = quotes.filter(q => q.status === 'submitted').length;

  const pendingDocs = documents.filter(d => d.status === 'pending').length;
  const approvedDocs = documents.filter(d => d.status === 'approved').length;
  const activeTasks = tasks.filter(t => ['pending', 'in_progress'].includes(t.status)).length;
  const unreadMessages = messages.filter(m => !m.is_read).length;

  // Loading state
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  // Check approval status for contractors
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
            ? `צופה כ: ${allContractors.find(c => c.email === impersonateEmail)?.name || impersonateEmail}`
            : "פורטל קבלנים"
          } 
          subtitle={canImpersonate && impersonateEmail ? "מצב צפייה - פורטל קבלן" : "ניהול משימות, מסמכים ותקשורת"}
          icon="🏗️"
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
                    <SelectValue placeholder="בחר קבלן לצפייה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">הצג הכל (מנהל)</SelectItem>
                    {allContractors
                      .filter(c => c.email && c.email.trim() !== '')
                      .map(c => (
                        <SelectItem key={c.id} value={c.email}>
                          {c.name || 'ללא שם'} {c.company ? `(${c.company})` : ''}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <Tabs defaultValue="tasks" dir="rtl">
              <TabsList className="grid w-full grid-cols-4 bg-muted">
                <TabsTrigger value="tasks">
                  <Briefcase className="w-4 h-4 ml-2" />
                  משימות
                </TabsTrigger>
                <TabsTrigger value="quotes">
                  <DollarSign className="w-4 h-4 ml-2" />
                  הצעות מחיר
                  {pendingQuotes > 0 && (
                    <Badge className="mr-2 bg-orange-500 text-white text-xs">{pendingQuotes}</Badge>
                  )}
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

              <TabsContent value="tasks" className="mt-6">
                <ContractorTaskManager tasks={tasks} />
              </TabsContent>

              <TabsContent value="quotes" className="mt-6">
                <div className="space-y-4">
                  {quotes.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">אין בקשות להצעות מחיר</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {quotes.map((quote) => (
                        <Card key={quote.id} className="border-border">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-bold text-foreground text-lg">{quote.project_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  נשלח: {new Date(quote.created_date).toLocaleDateString('he-IL')}
                                </p>
                              </div>
                              <Badge className={
                                quote.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                quote.status === 'selected' ? 'bg-green-100 text-green-700' :
                                quote.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-orange-100 text-orange-700'
                              }>
                                {quote.status === 'submitted' ? 'נשלחה' :
                                 quote.status === 'selected' ? 'נבחרה' :
                                 quote.status === 'rejected' ? 'נדחתה' :
                                 'ממתינה להגשה'}
                              </Badge>
                            </div>
                            
                            {quote.status === 'requested' ? (
                              <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>סכום הצעה (₪)</Label>
                                    <Input
                                      type="number"
                                      placeholder="הזן סכום"
                                      value={quoteFormData[quote.id]?.amount || ''}
                                      onChange={(e) => setQuoteFormData({
                                        ...quoteFormData,
                                        [quote.id]: { ...quoteFormData[quote.id], amount: e.target.value }
                                      })}
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label>זמן ביצוע (ימים)</Label>
                                    <Input
                                      type="number"
                                      placeholder="מספר ימים"
                                      value={quoteFormData[quote.id]?.executionDays || ''}
                                      onChange={(e) => setQuoteFormData({
                                        ...quoteFormData,
                                        [quote.id]: { ...quoteFormData[quote.id], executionDays: e.target.value }
                                      })}
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label>פרטי ההצעה</Label>
                                  <Textarea
                                    placeholder="תיאור מפורט של ההצעה, כולל חומרים, עבודה וכו'"
                                    value={quoteFormData[quote.id]?.details || ''}
                                    onChange={(e) => setQuoteFormData({
                                      ...quoteFormData,
                                      [quote.id]: { ...quoteFormData[quote.id], details: e.target.value }
                                    })}
                                    className="mt-1 min-h-[100px]"
                                  />
                                </div>
                                <Button 
                                  onClick={() => {
                                    const formData = quoteFormData[quote.id];
                                    if (!formData?.amount) {
                                      showError('יש להזין סכום');
                                      return;
                                    }
                                    setSubmittingQuoteId(quote.id);
                                    submitQuoteMutation.mutate({ 
                                      quoteId: quote.id, 
                                      data: formData 
                                    });
                                  }}
                                  disabled={submittingQuoteId === quote.id}
                                  className="w-full bg-primary hover:bg-primary/90"
                                >
                                  {submittingQuoteId === quote.id ? (
                                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4 ml-2" />
                                  )}
                                  שלח הצעת מחיר
                                </Button>
                              </div>
                            ) : (
                              <div className="bg-muted/30 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">סכום:</span>
                                    <span className="font-bold mr-2">₪{quote.quote_amount?.toLocaleString() || '-'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">זמן ביצוע:</span>
                                    <span className="font-bold mr-2">{quote.execution_time_days || '-'} ימים</span>
                                  </div>
                                </div>
                                {quote.quote_details && (
                                  <p className="text-sm text-muted-foreground mt-2">{quote.quote_details}</p>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
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
                        const requiresSignature = ['contract', 'quote', 'certificate'].includes(doc.file_type);

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
                <MessagingSystem messages={messages} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      <ContractorDocumentUpload
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
          id: 'contractor-1',
          name: 'יוסי כהן',
          role: 'contractor',
        }}
      />
    </div>
  );
}