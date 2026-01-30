import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle2, 
  FileText, 
  Download,
  Eye,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  User,
  PenTool,
  Trash2
} from 'lucide-react';
import { showSuccess, showError } from '../components/utils/notifications';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import ProposalPreviewCard from '@/components/proposals/ProposalPreviewCard';
import DocumentPreviewDialog from '@/components/projects/documents/DocumentPreviewDialog';

export default function PublicApproval() {
  const urlParams = new URLSearchParams(window.location.search);
  const approvalId = urlParams.get('id');
  const type = urlParams.get('type') || 'proposal';
  
  const [isApproving, setIsApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [clientName, setClientName] = useState('');
  const [comments, setComments] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  
  // Signature Canvas State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);

  // Initialize canvas context
  React.useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [!approved]); // Re-run when approved state changes (if we re-render form)

  // Drawing functions
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // Prevent scrolling on touch
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setIsSignatureEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsSignatureEmpty(true);
  };

  // Fetch all data via serverless function (secure - no service token exposed)
  const { data: publicData, isLoading, error: fetchError } = useQuery({
    queryKey: ['publicApprovalData', approvalId, type],
    queryFn: async () => {
      // Use invoke syntax for calling backend functions
      const response = await base44.functions.invoke('getPublicProposal', {
        id: approvalId,
        type: type
      });
      
      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch data');
      }
      
      return data;
    },
    enabled: !!approvalId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const project = publicData?.project;
  const proposal = publicData?.proposal;
  const template = publicData?.template;
  const documents = publicData?.documents || [];

  const typeLabels = {
    sketches: 'סקיצות',
    renderings: 'הדמיות',
    technical: 'תוכניות טכניות',
    proposal: 'הצעת מחיר'
  };

  const handleApprove = async () => {
    if (!clientName.trim()) {
      showError('יש להזין שם לחתימה');
      return;
    }

    if (isSignatureEmpty) {
      showError('יש לחתום בתיבה הייעודית');
      return;
    }

    setIsApproving(true);
    try {
      // Get signature image
      const signatureData = canvasRef.current.toDataURL('image/png');

      // Submit approval via serverless function (secure - no service token exposed)
      // Use invoke syntax for calling backend functions
      const response = await base44.functions.invoke('submitPublicApproval', {
        projectId: project.id,
        type: type,
        clientName: clientName,
        comments: comments,
        proposalId: proposal?.id,
        signatureData: signatureData
      });

      const data = response.data;
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit approval');
      }

      setApproved(true);
      showSuccess('האישור נשמר בהצלחה!');

    } catch (error) {
      console.error('Error approving:', error);
      showError('שגיאה באישור: ' + (error.message || 'Unknown error'));
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">שגיאה בטעינת הנתונים</h2>
            <p className="text-slate-600 mb-4">לא הצלחנו לטעון את פרטי הפרויקט</p>
            <p className="text-xs text-slate-500 bg-slate-100 p-3 rounded-lg font-mono text-left" dir="ltr">
              {fetchError?.message || 'Unknown error'}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              נסה שוב
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">לינק לא תקין</h2>
            <p className="text-slate-600">הלינק שהתקבל אינו תקף או שהפג תוקפו</p>
            <p className="text-xs text-slate-500 mt-3">
              Project ID: {approvalId || 'חסר'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6" dir="rtl">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');
          * { font-family: 'Heebo', sans-serif; }
        `}
      </style>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-lg flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">ArchiFlow</h1>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">אישור {typeLabels[type]}</h2>
          <p className="text-slate-600">פרויקט: {project.name}</p>
        </motion.div>

        {approved ? (
          /* Success State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-green-500 bg-green-50">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-green-800 mb-3">תודה על האישור!</h3>
                <p className="text-lg text-green-700 mb-2">ה{typeLabels[type]} אושרו בהצלחה</p>
                <p className="text-sm text-green-600">תאריך אישור: {format(new Date(), 'PPP', { locale: he })}</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Approval Form */
          <>
            {/* Content Preview - Proposal or Documents */}
            {type === 'proposal' && proposal ? (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    הצעת מחיר לאישור
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div id="proposal-content">
                    <ProposalPreviewCard 
                      proposalData={proposal}
                      project={project}
                      template={template}
                      formatCurrency={(amount) => `₪${(amount || 0).toLocaleString()}`}
                      signatureData={null}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    {typeLabels[type]} לאישור
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>אין קבצים להצגה</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.map((doc) => {
                        const isImage = doc.file_type === 'image' || doc.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                        return (
                          <div key={doc.id} className="border rounded-xl overflow-hidden bg-white hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                              {isImage ? (
                                <img src={doc.file_url} alt={doc.title} className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-16 h-16 text-slate-400" />
                              )}
                            </div>
                            <div className="p-4">
                              <p className="font-medium text-slate-900 mb-2 truncate">{doc.title}</p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setPreviewDoc(doc)}
                                  className="flex-1"
                                >
                                  <Eye className="w-4 h-4 ml-1" />
                                  צפה
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = doc.file_url;
                                    link.download = doc.title;
                                    link.click();
                                  }}
                                  className="flex-1"
                                >
                                  <Download className="w-4 h-4 ml-1" />
                                  הורד
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Approval Form */}
            <Card className="border-indigo-200 bg-gradient-to-br from-white to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                  אישור וחתימה דיגיטלית
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    בחתימה על טופס זה, אני מאשר/ת שראיתי וסקרתי את ה{typeLabels[type]} והם מקובלים עליי.
                    החתימה הדיגיטלית מחייבת ותישמר במערכת.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    שם מלא לחתימה *
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="הזן שם מלא"
                      className="pr-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    חתימה דיגיטלית *
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 bg-white">
                    <canvas
                      ref={canvasRef}
                      width={600} // This will be scaled by CSS
                      height={200}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-[150px] cursor-crosshair bg-slate-50 rounded touch-none"
                      style={{ touchAction: 'none' }}
                    />
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSignature}
                      disabled={isSignatureEmpty}
                      className="text-xs"
                    >
                      <Trash2 className="w-3 h-3 ml-1" />
                      נקה חתימה
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    הערות (אופציונלי)
                  </label>
                  <Textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="הוסף הערות או שינויים מבוקשים..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>תאריך: {format(new Date(), 'PPP', { locale: he })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>פרויקט: {project.name}</span>
                  </div>
                </div>

                <Button
                  onClick={handleApprove}
                  disabled={isApproving || !clientName.trim()}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-lg"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      שומר אישור...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 ml-2" />
                      אשר וחתום דיגיטלית
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 mt-8">
          <p>מופעל על ידי ArchiFlow - מערכת ניהול פרויקטים לאדריכלים</p>
        </div>
      </div>

      {/* Preview Dialog */}
      {previewDoc && (
        <DocumentPreviewDialog 
          document={previewDoc} 
          onClose={() => setPreviewDoc(null)} 
        />
      )}
    </div>
  );
}