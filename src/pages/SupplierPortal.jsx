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
  Package,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  MessageSquare,
  Loader2,
  LogOut,
  Users,
  ShoppingCart
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MessagingSystem from '../components/contractors/MessagingSystem';
import PageHeader from '../components/layout/PageHeader';

export default function SupplierPortal() {
  const { user, isLoadingAuth: loadingUser, logout } = useAuth();
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [impersonateEmail, setImpersonateEmail] = useState(null);

  // Check if user is approved
  const isApproved = user?.approval_status === 'approved' || 
                     user?.app_role === 'super_admin' || 
                     user?.app_role === 'architect' ||
                     user?.role === 'admin';

  const canImpersonate = user?.role === 'admin' || user?.app_role === 'super_admin' || user?.app_role === 'architect';

  // Fetch Suppliers for dropdown
  const { data: allSuppliers = [] } = useQuery({
    queryKey: ['allSuppliersForImpersonation'],
    queryFn: () => base44.entities.Supplier.list('-created_date'),
    enabled: canImpersonate
  });

  // Fetch documents related to suppliers
  const { data: allDocuments = [] } = useQuery({
    queryKey: ['supplierDocuments'],
    queryFn: () => base44.entities.Document.list('-created_date', 100),
  });

  // Fetch messages
  const { data: allMessages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 100),
  });

  // Multi-tenant filtering
  const targetEmail = canImpersonate && impersonateEmail ? impersonateEmail : user?.email;
  const showAll = canImpersonate && !impersonateEmail;

  const documents = showAll 
    ? allDocuments 
    : allDocuments.filter(doc => doc.created_by === targetEmail);

  const messages = showAll 
    ? allMessages 
    : allMessages.filter(msg => 
        msg.sender_id === targetEmail || 
        msg.recipient_id === targetEmail ||
        msg.created_by === targetEmail
      );

  const pendingDocs = documents.filter(d => d.status === 'pending' || d.status === 'draft').length;
  const approvedDocs = documents.filter(d => d.status === 'approved' || d.status === 'active').length;
  const unreadMessages = messages.filter(m => !m.is_read).length;

  // Loading state
  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  // Check approval status
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
            ? `צופה כ: ${allSuppliers.find(s => s.email === impersonateEmail)?.name || impersonateEmail}`
            : "פורטל ספקים"
          } 
          subtitle={canImpersonate && impersonateEmail ? "מצב צפייה - פורטל ספק" : "ניהול הזמנות, מסמכים ותקשורת"}
          icon="📦"
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
                    <SelectValue placeholder="בחר ספק לצפייה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="me">הצג הכל (מנהל)</SelectItem>
                    {allSuppliers
                      .filter(s => s.email && s.email.trim() !== '')
                      .map(s => (
                        <SelectItem key={s.id} value={s.email}>
                          {s.name || 'ללא שם'} {s.company ? `(${s.company})` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </div>
        </PageHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">הזמנות ממתינות</p>
                  <p className="text-3xl font-bold text-teal-600">{pendingDocs}</p>
                </div>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">הזמנות שהושלמו</p>
                  <p className="text-3xl font-bold text-green-600">{approvedDocs}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
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
            <Tabs defaultValue="orders" dir="rtl">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="orders">
                  <ShoppingCart className="w-4 h-4 ml-2" />
                  הזמנות
                </TabsTrigger>
                <TabsTrigger value="messages">
                  <MessageSquare className="w-4 h-4 ml-2" />
                  הודעות
                </TabsTrigger>
              </TabsList>

              <TabsContent value="orders" className="mt-6">
                <div className="space-y-4">
                  {documents.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">אין הזמנות עדיין</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {documents.map((doc, index) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="border-border hover:shadow-soft-organic-hover transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-6 h-6 text-teal-600" />
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="font-bold text-foreground mb-1">{doc.title}</h3>
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {doc.project_name} • {doc.file_size || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  className={
                                    doc.status === 'approved' || doc.status === 'active'
                                      ? 'bg-green-100 text-green-700 border-green-200'
                                      : doc.status === 'rejected' || doc.status === 'archived'
                                      ? 'bg-red-100 text-red-700 border-red-200'
                                      : 'bg-amber-100 text-amber-700 border-amber-200'
                                  }
                                >
                                  {doc.status === 'approved' || doc.status === 'active'
                                    ? 'הושלם'
                                    : doc.status === 'rejected' || doc.status === 'archived'
                                    ? 'בוטל'
                                    : 'ממתין'}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
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
    </div>
  );
}