import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Upload, 
  Send, 
  Users,
  CheckCircle2,
  Loader2,
  Eye,
  Calendar,
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  Star,
  Signature,
  Trash2,
  Plus,
  Image,
  Download
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/notifications';
import { addDocumentToClientHistory, addStageChangeToClientHistory } from '../../utils/clientHistoryHelper';
import DigitalSignatureDialog from '../../signature/DigitalSignatureDialog';
import DocumentUploadDialog from '../documents/DocumentUploadDialog';
import DocumentPreviewDialog from '../documents/DocumentPreviewDialog';
import AddQuoteDialog from '../quotes/AddQuoteDialog';
import ProjectMeetingSchedulerModal from '../scheduling/ProjectMeetingSchedulerModal';

const subStages = [
  { id: 'upload', label: 'העלאת תוכניות', icon: Upload, description: 'העלאה ואישור לקוח + חתימה' },
  { id: 'send_contractors', label: 'שליחה לקבלנים', icon: Users, description: 'בחירת 3 קבלנים ושליחה' },
  { id: 'compare_quotes', label: 'השוואת הצעות', icon: FileText, description: 'קבלת הצעות, השוואה ואישור' },
];

export default function TechnicalPlansStage({ project, onUpdate, onSubStageChange, currentSubStage }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  
  const [activeSubStage, setActiveSubStage] = useState('upload');
  const [completedSubStages, setCompletedSubStages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingRemote, setIsSendingRemote] = useState(false);
  const [selectedContractors, setSelectedContractors] = useState(project?.selected_contractors || []);
  const [preparationNotes, setPreparationNotes] = useState('');
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [documentToSign, setDocumentToSign] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAddQuoteDialog, setShowAddQuoteDialog] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);

  // Track if change came from parent to prevent loops
  const isExternalChange = useRef(false);

  // Sync from parent Stepper when sub-stage is clicked there
  useEffect(() => {
    if (currentSubStage) {
      const reverseMap = {
        'upload_plans': 'upload',
        'send_contractors': 'send_contractors',
        'compare_quotes': 'compare_quotes',
      };
      const mappedSubStage = reverseMap[currentSubStage];
      if (mappedSubStage && mappedSubStage !== activeSubStage) {
        isExternalChange.current = true;
        setActiveSubStage(mappedSubStage);
      }
    }
  }, [currentSubStage]);

  // Notify parent of sub-stage changes (only if internal change)
  useEffect(() => {
    if (isExternalChange.current) {
      isExternalChange.current = false;
      return;
    }
    if (onSubStageChange) {
      const subStageMap = {
        'upload': 'upload_plans',
        'send_contractors': 'send_contractors',
        'compare_quotes': 'compare_quotes',
      };
      onSubStageChange(subStageMap[activeSubStage] || activeSubStage);
    }
  }, [activeSubStage]);

  // Initialize based on project data
  useEffect(() => {
    const completed = [];
    if (project?.technical_approved) {
      completed.push('upload');
    }
    if (project?.selected_contractors?.length >= 3) {
      completed.push('upload', 'send_contractors');
    }
    if (project?.selected_quote_id) {
      completed.push('upload', 'send_contractors', 'compare_quotes');
    }
    setCompletedSubStages([...new Set(completed)]);

    // Set active to first incomplete
    if (!completed.includes('upload')) {
      setActiveSubStage('upload');
    } else if (!completed.includes('send_contractors')) {
      setActiveSubStage('send_contractors');
    } else if (!completed.includes('compare_quotes')) {
      setActiveSubStage('compare_quotes');
    }
  }, [project?.technical_approved, project?.selected_contractors, project?.selected_quote_id]);

  // Fetch documents for this project
  const { data: documents = [] } = useQuery({
    queryKey: ['projectDocuments', project?.name, 'technical'],
    queryFn: () => base44.entities.Document.filter({ 
      project_name: project?.name,
      category: 'specification'
    }),
    enabled: !!project?.name
  });

  // Fetch contractors
  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => base44.entities.Contractor.filter({ status: 'active' }),
  });

  // Fetch quotes for this project
  const { data: quotes = [] } = useQuery({
    queryKey: ['contractorQuotes', project?.id],
    queryFn: () => base44.entities.ContractorQuote.filter({ project_id: project?.id }),
    enabled: !!project?.id
  });

  // Delete document mutation
  const deleteDocMutation = useMutation({
    mutationFn: (docId) => base44.entities.Document.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectDocuments'] });
      showSuccess('הקובץ נמחק בהצלחה');
    },
    onError: () => showError('שגיאה במחיקת הקובץ'),
  });

  const handleSendRemoteApproval = async () => {
    if (!project?.client_email) {
      showError('לא נמצא אימייל ללקוח');
      return;
    }
    
    setIsSendingRemote(true);
    try {
      const approvalUrl = `${window.location.origin}/PublicApproval?id=${project.id}&type=technical`;
      
      await base44.integrations.Core.SendEmail({
        to: project.client_email,
        subject: `תוכניות עבודה לאישור - ${project.name}`,
        body: `שלום ${project.client},

תוכניות העבודה עבור פרויקט "${project.name}" מוכנות לצפייה ולאישור.

לחץ על הלינק הבא לצפייה ואישור:
${approvalUrl}

בברכה,
ArchiFlow`
      });
      
      showSuccess('זימון לאישור נשלח ללקוח במייל!');
    } catch (error) {
      console.error('Remote send error:', error);
      showError('שגיאה בשליחת המייל');
    } finally {
      setIsSendingRemote(false);
    }
  };

  const handleRequestSignature = () => {
    if (documents.length === 0) {
      showError('אין תוכניות לחתימה');
      return;
    }
    setDocumentToSign({
      id: documents[0].id,
      title: `תוכניות עבודה - ${project?.name}`,
      file_type: 'specification',
      project_id: project?.id
    });
    setShowSignatureDialog(true);
  };

  const handleSignatureComplete = async () => {
    setShowSignatureDialog(false);
    
    // Update project
    if (onUpdate) {
      await onUpdate({ 
        technical_approved: true,
        technical_signature_id: 'signed_' + Date.now()
      });
    }

    // Add to client history
    if (project?.client_id) {
      await addDocumentToClientHistory(
        project.client_id,
        { id: documents[0]?.id, title: 'תוכניות עבודה', category: 'technical' },
        project,
        true
      );
    }

    showSuccess('התוכניות אושרו וחתומות!');
    setCompletedSubStages(prev => [...new Set([...prev, 'upload'])]);
    setActiveSubStage('send_contractors');
  };

  const toggleContractor = (contractorId) => {
    setSelectedContractors(prev => {
      if (prev.includes(contractorId)) {
        return prev.filter(id => id !== contractorId);
      }
      if (prev.length >= 3) {
        showError('ניתן לבחור עד 3 קבלנים');
        return prev;
      }
      return [...prev, contractorId];
    });
  };

  const sendToContractors = async () => {
    if (selectedContractors.length === 0) {
      showError('בחר לפחות קבלן אחד');
      return;
    }

    setIsSending(true);
    try {
      // Get selected contractor details
      const selectedContractorDetails = contractors.filter(c => selectedContractors.includes(c.id));

      // Filter out contractors that already have a quote request
      const existingQuotes = await base44.entities.ContractorQuote.filter({ project_id: project?.id });
      const contractorsToSkip = existingQuotes.map(q => q.contractor_id);
      
      const newContractors = selectedContractorDetails.filter(c => !contractorsToSkip.includes(c.id));

      if (newContractors.length === 0) {
        showSuccess('בקשות כבר נשלחו לכל הקבלנים שנבחרו');
        setActiveSubStage('compare_quotes');
        setIsSending(false);
        return;
      }

      let sentCount = 0;

      // Create quote requests for each NEW contractor
      for (const contractor of newContractors) {
        const token = crypto.randomUUID();
        
        await base44.entities.ContractorQuote.create({
          project_id: String(project?.id),
          project_name: project?.name,
          contractor_id: String(contractor.id),
          contractor_name: contractor.name,
          contractor_specialty: contractor.specialty,
          document_ids: documents.map(d => d.id),
          status: 'requested',
          request_date: new Date().toISOString().split('T')[0],
          token: token
        });

        // Send email to contractor with link to quote submission (using token)
        if (contractor.email) {
          const quoteUrl = `${window.location.origin}${window.location.pathname}#/PublicContractorQuote?token=${token}`;
          
          await base44.integrations.Core.SendEmail({
            to: contractor.email,
            subject: `בקשה להצעת מחיר - ${project?.name}`,
            body: `שלום ${contractor.name},

אנו מבקשים הצעת מחיר עבור פרויקט: ${project?.name}

לצפייה בתוכניות והגשת הצעת מחיר, לחץ על הלינק הבא:
${quoteUrl}

נודה לקבלת הצעתך תוך 3 ימי עסקים.

בברכה,
ArchiFlow`
          });
          sentCount++;
        }
      }

      // Update project selected contractors if list changed
      const updatedSelection = [...new Set([...(project?.selected_contractors || []), ...selectedContractors])];
      if (onUpdate && updatedSelection.length !== (project?.selected_contractors?.length || 0)) {
        await onUpdate({ selected_contractors: updatedSelection });
      }

      queryClient.invalidateQueries({ queryKey: ['contractorQuotes'] });
      
      if (sentCount > 0) {
        showSuccess(`נשלחו ${sentCount} בקשות חדשות לקבלנים!`);
      } else {
        showSuccess('הבקשות נוצרו במערכת (לא נשלחו מיילים לקבלנים ללא כתובת)');
      }
      
      setCompletedSubStages(prev => [...new Set([...prev, 'send_contractors'])]);
      setActiveSubStage('compare_quotes');

    } catch (error) {
      console.error('Error sending to contractors:', error);
      showError('שגיאה בשליחה לקבלנים');
    } finally {
      setIsSending(false);
    }
  };

  const selectQuote = async (quoteId) => {
    try {
      // Update the selected quote status
      await base44.entities.ContractorQuote.update(quoteId, { status: 'selected' });

      // Update project
      if (onUpdate) {
        await onUpdate({ 
          selected_quote_id: quoteId,
          status: 'execution'
        });
      }

      // Add to client history
      if (project?.client_id) {
        await addStageChangeToClientHistory(project.client_id, 'execution', project);
      }

      queryClient.invalidateQueries({ queryKey: ['contractorQuotes'] });
      showSuccess('הצעת מחיר נבחרה! ממשיכים לשלב הביצוע');
      setCompletedSubStages(prev => [...new Set([...prev, 'compare_quotes'])]);

    } catch (error) {
      console.error('Error selecting quote:', error);
      showError('שגיאה בבחירת הצעה');
    }
  };

  const renderSubStageContent = () => {
    switch (activeSubStage) {
      case 'upload':
        return (
          <div className="space-y-6">
            {/* Upload Section */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Upload className="w-5 h-5 text-orange-600" />
                  העלאת תוכניות עבודה
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-orange-500 cursor-pointer transition-colors"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="font-medium text-slate-700">לחץ להעלאת תוכניות עבודה</p>
                  <p className="text-sm text-slate-500 mt-1">PDF, שרטוטים, תוכניות אדריכליות</p>
                </div>

                {/* Uploaded Documents List */}
                {documents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-900 text-sm">קבצים שהועלו ({documents.length}):</h4>
                    {documents.map((doc) => {
                      const DocIcon = doc.file_type === 'image' ? Image : FileText;
                      return (
                        <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center overflow-hidden flex-shrink-0">
                            {doc.file_type === 'image' || doc.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img src={doc.file_url} alt={doc.title} className="w-full h-full object-cover" />
                            ) : (
                              <DocIcon className="w-5 h-5 text-orange-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs">{doc.file_size}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setPreviewDoc(doc)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteDocMutation.mutate(doc.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Approval Actions */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  {project?.technical_approved ? (
                    <div className="bg-green-50 rounded-xl p-4 flex items-center gap-3 border border-green-100">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-green-900">התוכניות אושרו וחתומות!</h4>
                        <p className="text-sm text-green-700">ניתן להמשיך לשלב הבא</p>
                      </div>
                    </div>
                  ) : documents.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        onClick={handleRequestSignature}
                        className="bg-orange-600 hover:bg-orange-700 h-12"
                      >
                        <Signature className="w-4 h-4 ml-2" />
                        החתמה במקום (עכשיו)
                      </Button>
                      <Button 
                        onClick={handleSendRemoteApproval}
                        disabled={isSendingRemote}
                        variant="outline"
                        className="h-12 border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        {isSendingRemote ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Send className="w-4 h-4 ml-2" />}
                        שלח לאישור מרחוק (מייל)
                      </Button>
                    </div>
                  )}

                  {project?.technical_approved && (
                    <Button 
                      onClick={() => {
                        setCompletedSubStages(prev => [...new Set([...prev, 'upload'])]);
                        setActiveSubStage('send_contractors');
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 h-12 mt-2"
                    >
                      המשך לשליחה לקבלנים
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'send_contractors':
        return (
          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-orange-600" />
                  בחירת קבלנים לקבלת הצעות
                </CardTitle>
                <p className="text-sm text-slate-500 mt-1">בחר עד 3 קבלנים לשליחת התוכניות</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {contractors.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>אין קבלנים במערכת</p>
                    <p className="text-sm">הוסף קבלנים בעמוד "קבלנים ושותפים"</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contractors.map((contractor) => {
                      const isSelected = selectedContractors.includes(contractor.id);
                      return (
                        <motion.div
                          key={contractor.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-orange-500 bg-orange-50' 
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          onClick={() => toggleContractor(contractor.id)}
                        >
                          <div className="flex items-center gap-4">
                            <Checkbox checked={isSelected} />
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-slate-500" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-900">{contractor.name}</h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500" />
                                  {contractor.rating || 'N/A'}
                                </span>
                                <span>{contractor.specialty}</span>
                              </div>
                            </div>
                            {contractor.phone && (
                              <div className="text-sm text-slate-500">
                                <Phone className="w-4 h-4 inline ml-1" />
                                {contractor.phone}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-slate-600">
                    נבחרו: <strong>{selectedContractors.length}/3</strong> קבלנים
                  </span>
                  <Button 
                    onClick={sendToContractors}
                    disabled={selectedContractors.length === 0 || isSending}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-2" />
                        שלח בקשה להצעות מחיר
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'compare_quotes':
        const receivedQuotes = quotes.filter(q => q.status === 'received' || q.quote_amount);
        const pendingQuotes = quotes.filter(q => q.status === 'requested' && !q.quote_amount);

        return (
          <div className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-orange-600" />
                  השוואת הצעות מחיר
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Actions */}
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddQuoteDialog(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    הוסף הצעה ידנית
                  </Button>
                </div>

                {/* Pending Quotes */}
                {pendingQuotes.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-4">
                    <h4 className="font-medium text-amber-900 mb-2">ממתין להצעות:</h4>
                    <div className="space-y-2">
                      {pendingQuotes.map(quote => (
                        <div key={quote.id} className="flex items-center gap-2 text-sm text-amber-800">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {quote.contractor_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Received Quotes */}
                {receivedQuotes.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">הצעות שהתקבלו:</h4>
                    {receivedQuotes
                      .sort((a, b) => (a.quote_amount || 0) - (b.quote_amount || 0))
                      .map((quote, index) => (
                        <motion.div
                          key={quote.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`p-4 rounded-xl border-2 ${
                            index === 0 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {index === 0 && (
                                <Badge className="bg-green-600 text-white">מומלץ</Badge>
                              )}
                              <div>
                                <h4 className="font-semibold text-slate-900">{quote.contractor_name}</h4>
                                <p className="text-sm text-slate-600">{quote.contractor_specialty}</p>
                              </div>
                            </div>
                            <div className="text-left">
                              <p className="text-2xl font-bold text-orange-700">
                                ₪{(quote.quote_amount || 0).toLocaleString()}
                              </p>
                              {quote.timeline_days && (
                                <p className="text-sm text-slate-500">{quote.timeline_days} ימים</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-4">
                            <Button 
                              onClick={() => selectQuote(quote.id)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 ml-2" />
                              בחר הצעה זו
                            </Button>
                            {quote.quote_file_url && (
                              <Button variant="outline" asChild>
                                <a href={quote.quote_file_url} target="_blank" rel="noopener noreferrer">
                                  <Eye className="w-4 h-4 ml-2" />
                                  צפה
                                </a>
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                  </div>
                ) : pendingQuotes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>אין הצעות מחיר</p>
                    <p className="text-sm">שלח בקשות לקבלנים בשלב הקודם</p>
                  </div>
                ) : null}

                {/* Schedule Meeting */}
                {receivedQuotes.length > 0 && (
                  <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-indigo-900">שלח קישור לתיאום פגישה עם הלקוח</h4>
                      <p className="text-sm text-indigo-700">אפשר ללקוח לבחור מועד לסקירת ההצעות ובחירה משותפת</p>
                    </div>
                    <Button 
                      onClick={() => setShowMeetingScheduler(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      שלח קישור תיאום
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Stage Navigation */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">תוכניות עבודה</h2>
              <p className="text-sm text-slate-500 font-normal">העלאה, שליחה לקבלנים והשוואת הצעות</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {subStages.map((subStage) => {
              const Icon = subStage.icon;
              const isActive = activeSubStage === subStage.id;
              const isCompleted = completedSubStages.includes(subStage.id);
              
              return (
                <button
                  key={subStage.id}
                  onClick={() => setActiveSubStage(subStage.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all whitespace-nowrap ${
                    isActive 
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : isCompleted
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-orange-500' : isCompleted ? 'bg-green-500' : 'bg-slate-200'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    )}
                  </div>
                  <span className="text-sm font-medium">{subStage.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sub-Stage Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubStage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderSubStageContent()}
        </motion.div>
      </AnimatePresence>

      {/* Signature Dialog */}
      {showSignatureDialog && documentToSign && (
        <DigitalSignatureDialog
          isOpen={showSignatureDialog}
          onClose={() => {
            setShowSignatureDialog(false);
            handleSignatureComplete();
          }}
          document={documentToSign}
          signerInfo={{
            id: project?.client_id || 'client',
            name: project?.client || 'לקוח',
            role: 'client'
          }}
        />
      )}

      {/* Helper Dialogs */}
      <DocumentUploadDialog
        isOpen={showUploadDialog}
        onClose={() => {
          setShowUploadDialog(false);
          queryClient.invalidateQueries({ queryKey: ['projectDocuments'] });
        }}
        project={project}
        presetCategory="specification"
        categoryLabel="תוכניות עבודה"
      />

      <DocumentPreviewDialog 
        document={previewDoc} 
        onClose={() => setPreviewDoc(null)} 
      />

      <AddQuoteDialog
        isOpen={showAddQuoteDialog}
        onClose={() => setShowAddQuoteDialog(false)}
        project={project}
        contractors={contractors}
      />

      {/* Meeting Scheduler Modal */}
      <ProjectMeetingSchedulerModal
        isOpen={showMeetingScheduler}
        onClose={() => setShowMeetingScheduler(false)}
        project={project}
        meetingTitle={`פגישת סקירת הצעות קבלנים - ${project?.name || ''}`}
        meetingContext={`סקירה והשוואת הצעות מחיר מקבלנים עם ${project?.client || 'הלקוח'}`}
      />
    </div>
  );
}