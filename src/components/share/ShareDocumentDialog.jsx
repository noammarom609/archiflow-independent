import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  X,
  Link as LinkIcon,
  Mail,
  Eye,
  Edit,
  Clock,
  Copy,
  Check,
  Shield,
  Share2,
  Users
} from 'lucide-react';

export default function ShareDocumentDialog({ document, onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('link');
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [linkExpiry, setLinkExpiry] = useState('7');
  const [permission, setPermission] = useState('view');
  const [requirePassword, setRequirePassword] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');

  const createShareLinkMutation = useMutation({
    mutationFn: async (data) => {
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(data.expiryDays));
      
      return base44.entities.ShareLink.create({
        document_id: document.id,
        document_title: document.title,
        link_token: token,
        permission: data.permission,
        expires_at: expiresAt.toISOString(),
        password_protected: data.requirePassword,
        recipient_email: data.recipientEmail || null,
        recipient_name: data.recipientName || null,
        project_id: document.project_id,
        is_active: true,
        access_count: 0,
      });
    },
    onSuccess: (data) => {
      setShareLink(data);
      queryClient.invalidateQueries({ queryKey: ['shareLinks'] });
      
      // Create notification
      if (recipientEmail) {
        base44.entities.Notification.create({
          title: 'מסמך חדש שותף איתך',
          message: `${recipientName || 'מישהו'} שיתף איתך את המסמך "${document.title}"`,
          type: 'document',
          priority: 'medium',
          related_id: document.id,
          related_type: 'document',
          recipient_email: recipientEmail,
          icon: 'FileText',
        });
      }
    },
  });

  const handleCreateLink = () => {
    createShareLinkMutation.mutate({
      expiryDays: linkExpiry,
      permission,
      requirePassword,
      recipientEmail,
      recipientName,
    });
  };

  const handleCopyLink = () => {
    if (shareLink) {
      const fullUrl = `${window.location.origin}/share/${shareLink.link_token}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl"
        >
          <Card className="border-slate-200 shadow-2xl">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">שיתוף מסמך</CardTitle>
                    <p className="text-sm text-slate-600 mt-1">{document.title}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full mb-6">
                  <TabsTrigger value="link" className="flex-1 gap-2">
                    <LinkIcon className="w-4 h-4" />
                    קישור שיתוף
                  </TabsTrigger>
                  <TabsTrigger value="email" className="flex-1 gap-2">
                    <Mail className="w-4 h-4" />
                    שליחה באימייל
                  </TabsTrigger>
                </TabsList>

                {/* Link Tab */}
                <TabsContent value="link" className="space-y-4">
                  {!shareLink ? (
                    <>
                      {/* Permission Selection */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 mb-3 block">
                          הרשאות גישה
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setPermission('view')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              permission === 'view'
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <Eye className={`w-6 h-6 mx-auto mb-2 ${
                              permission === 'view' ? 'text-indigo-600' : 'text-slate-600'
                            }`} />
                            <p className="font-medium text-sm">צפייה בלבד</p>
                          </button>
                          <button
                            onClick={() => setPermission('edit')}
                            className={`p-4 rounded-lg border-2 transition-all ${
                              permission === 'edit'
                                ? 'border-indigo-500 bg-indigo-50'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <Edit className={`w-6 h-6 mx-auto mb-2 ${
                              permission === 'edit' ? 'text-indigo-600' : 'text-slate-600'
                            }`} />
                            <p className="font-medium text-sm">עריכה</p>
                          </button>
                        </div>
                      </div>

                      {/* Expiry */}
                      <div>
                        <Label className="text-sm font-medium text-slate-900 mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          תוקף הקישור
                        </Label>
                        <select
                          value={linkExpiry}
                          onChange={(e) => setLinkExpiry(e.target.value)}
                          className="w-full p-3 border border-slate-200 rounded-lg"
                        >
                          <option value="1">יום אחד</option>
                          <option value="3">3 ימים</option>
                          <option value="7">שבוע</option>
                          <option value="14">שבועיים</option>
                          <option value="30">חודש</option>
                          <option value="90">3 חודשים</option>
                        </select>
                      </div>

                      {/* Password Protection */}
                      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="password"
                          checked={requirePassword}
                          onChange={(e) => setRequirePassword(e.target.checked)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <Label htmlFor="password" className="font-medium cursor-pointer flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            הגנה בסיסמה
                          </Label>
                          <p className="text-xs text-slate-600 mt-1">
                            מקבלי הקישור יצטרכו להזין סיסמה
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleCreateLink}
                        disabled={createShareLinkMutation.isPending}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
                      >
                        {createShareLinkMutation.isPending ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            יוצר קישור...
                          </div>
                        ) : (
                          <>
                            <LinkIcon className="w-5 h-5 ml-2" />
                            צור קישור שיתוף
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Success Message */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800 font-medium mb-1">
                          <Check className="w-5 h-5" />
                          הקישור נוצר בהצלחה!
                        </div>
                        <p className="text-sm text-green-700">
                          הקישור יפוג ב-{new Date(shareLink.expires_at).toLocaleDateString('he-IL')}
                        </p>
                      </div>

                      {/* Link Display */}
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <LinkIcon className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-900">קישור לשיתוף</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={`${window.location.origin}/share/${shareLink.link_token}`}
                            readOnly
                            className="flex-1 font-mono text-sm"
                          />
                          <Button
                            onClick={handleCopyLink}
                            variant={copied ? "default" : "outline"}
                            className={copied ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {copied ? (
                              <>
                                <Check className="w-4 h-4 ml-2" />
                                הועתק
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 ml-2" />
                                העתק
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Link Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white border border-slate-200 rounded-lg">
                          <p className="text-xs text-slate-600 mb-1">הרשאה</p>
                          <Badge className={
                            shareLink.permission === 'edit'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }>
                            {shareLink.permission === 'edit' ? 'עריכה' : 'צפייה'}
                          </Badge>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-lg">
                          <p className="text-xs text-slate-600 mb-1">גישות</p>
                          <p className="text-lg font-bold text-slate-900">
                            {shareLink.access_count || 0}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => setShareLink(null)}
                        variant="outline"
                        className="w-full"
                      >
                        צור קישור נוסף
                      </Button>
                    </motion.div>
                  )}
                </TabsContent>

                {/* Email Tab */}
                <TabsContent value="email" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-slate-900 mb-2 block">
                      שם הנמען
                    </Label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="הזן שם..."
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-900 mb-2 block">
                      כתובת אימייל
                    </Label>
                    <Input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="name@example.com"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-900 mb-2 block">
                      הרשאות גישה
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPermission('view')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          permission === 'view'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <Eye className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-sm">צפייה</p>
                      </button>
                      <button
                        onClick={() => setPermission('edit')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          permission === 'edit'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200'
                        }`}
                      >
                        <Edit className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-sm">עריכה</p>
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateLink}
                    disabled={!recipientEmail || createShareLinkMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
                  >
                    <Mail className="w-5 h-5 ml-2" />
                    שלח הזמנה
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}