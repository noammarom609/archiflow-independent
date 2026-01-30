import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { 
  Upload, 
  Eye, 
  CheckCircle2,
  FileText,
  Send,
  Calendar,
  Loader2,
  Download,
  Trash2,
  Image
} from 'lucide-react';
import { showSuccess, showError } from '../../../utils/notifications';
import { useNotifications } from '@/hooks/use-notifications';
import DocumentUploadDialog from '../../documents/DocumentUploadDialog';
import DocumentPreviewDialog from '../../documents/DocumentPreviewDialog';

export default function DocumentApprovalSubStage({ 
  type, 
  typeLabel, 
  project, 
  activeSubStage,
  onComplete, 
  onUpdate 
}) {
  const queryClient = useQueryClient();
  const { sendToUser } = useNotifications();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // Get category based on type
  const getCategory = () => {
    if (type === 'sketches') return 'plan';
    if (type === 'renderings') return 'rendering';
    if (type === 'technical') return 'specification';
    return 'other';
  };

  // Get tags based on type
  const getDefaultTags = () => {
    if (type === 'sketches') return ['סקיצה', 'תכנון', 'עיצוב'];
    if (type === 'renderings') return ['הדמיה', 'ויזואליזציה', '3D'];
    if (type === 'technical') return ['תוכנית טכנית', 'מפרט', 'שרטוט'];
    return [];
  };

  const { data: documents = [] } = useQuery({
    queryKey: ['projectDocuments', project?.id, type],
    queryFn: () => base44.entities.Document.filter({ 
      project_id: project?.id,
      category: getCategory()
    }),
    enabled: !!project?.id
  });

  // Delete document mutation
  const deleteDocMutation = useMutation({
    mutationFn: (docId) => base44.entities.Document.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectDocuments', project?.id, type] });
      showSuccess('הקובץ נמחק בהצלחה');
    },
    onError: () => showError('שגיאה במחיקת הקובץ'),
  });

  const sendToClient = async () => {
    if (!project?.client_email) {
      showError('לא נמצא אימייל ללקוח');
      return;
    }

    setIsSending(true);

    try {
      // Create approval link
      const approvalUrl = `${window.location.origin}/PublicApproval?id=${project.id}&type=${type}`;
      
      await base44.integrations.Core.SendEmail({
        to: project.client_email,
        subject: `${typeLabel} מוכנים לאישור - ${project.name}`,
        body: `שלום ${project.client},

${typeLabel} עבור פרויקט "${project.name}" מוכנים לצפייה ולאישור.

לחץ על הלינק הבא לצפייה ואישור:
${approvalUrl}

בברכה,
ArchiFlow`
      });

      // Send push notification to client if they have a user account
      if (project?.client_id) {
        const notificationTitles = {
          sketches: '📐 סקיצות חדשות מוכנות!',
          renderings: '🎨 הדמיות חדשות מוכנות!',
          technical: '📋 תוכניות טכניות מוכנות!'
        };
        
        sendToUser(project.client_id, {
          title: notificationTitles[type] || `${typeLabel} מוכנים`,
          body: `${typeLabel} לפרויקט "${project.name}" מוכנים לצפייה ואישור`,
          url: approvalUrl,
          type: `${type}_ready`
        });
      }

      showSuccess('זימון לאישור נשלח ללקוח במייל!');
      onComplete('upload');
    } catch (error) {
      showError('שגיאה בשליחת הזימון');
    } finally {
      setIsSending(false);
    }
  };

  const handleApprove = async () => {
    try {
      // Create signature record with full metadata
      const signatureRecord = await base44.entities.DocumentSignature.create({
        document_id: documents[0]?.id || 'approval',
        document_title: `אישור ${typeLabel} - ${project?.name}`,
        document_type: type,
        signer_id: project?.client_id || 'client',
        signer_name: project?.client || 'לקוח',
        signer_role: 'client',
        signature_data: 'digital_approval',
        timestamp: new Date().toISOString(),
        verified: true,
        project_id: project?.id,
        ip_address: 'N/A',
        notes: `אישור ${typeLabel} לפרויקט ${project?.name}`
      });

      // Update project with approval and signature ID
      await onUpdate({ 
        [`${type}_approved`]: true,
        [`${type}_signature_id`]: signatureRecord.id
      });

      // Determine next stage based on type
      const nextStageMap = {
        sketches: 'rendering',
        renderings: 'technical',
        technical: 'execution'
      };

      if (nextStageMap[type]) {
        await onUpdate({ status: nextStageMap[type] });
      }

      showSuccess(`${typeLabel} אושרו וחתומים!`);
      onComplete('approve');
    } catch (error) {
      console.error('Error approving:', error);
      showError('שגיאה באישור');
    }
  };

  // Upload
  if (activeSubStage === 'upload') {
    const UploadIcon = type === 'renderings' ? Image : type === 'technical' ? FileText : Upload;
    
    return (
      <>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UploadIcon className="w-5 h-5 text-indigo-600" />
              העלאת {typeLabel}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div 
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-500 cursor-pointer transition-all"
              onClick={() => setShowUploadDialog(true)}
            >
              <UploadIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="font-medium text-slate-700">לחץ להעלאת {typeLabel}</p>
              <p className="text-sm text-slate-500 mt-1">
                {type === 'technical' ? 'תוכניות אדריכליות, חשמל, אינסטלציה' : 
                 type === 'renderings' ? 'הדמיות 3D, ויזואליזציות' : 
                 'סקיצות ראשוניות, רישומים'}
              </p>
            </div>

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
                          <DocIcon className="w-5 h-5 text-indigo-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">{doc.file_size}</Badge>
                          {doc.tags?.length > 0 && (
                            <span className="text-xs text-slate-500">
                              {doc.tags.slice(0, 2).join(', ')}
                            </span>
                          )}
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
                          disabled={deleteDocMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {documents.length > 0 && (
              <Button onClick={sendToClient} disabled={isSending} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {isSending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Send className="w-4 h-4 ml-2" />}
                שלח עדכון ללקוח
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <DocumentUploadDialog
          isOpen={showUploadDialog}
          onClose={() => {
            setShowUploadDialog(false);
            // Refresh documents list after upload
            queryClient.invalidateQueries({ queryKey: ['projectDocuments', project?.id, type] });
          }}
          project={project}
          presetCategory={getCategory()}
          categoryLabel={typeLabel}
        />

        {/* Preview Dialog */}
        <DocumentPreviewDialog 
          document={previewDoc} 
          onClose={() => setPreviewDoc(null)} 
        />
      </>
    );
  }

  // Present
  if (activeSubStage === 'present') {
    return (
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5 text-indigo-600" />
            הצגה ללקוח
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              const DocIcon = doc.file_type === 'image' ? Image : FileText;
              return (
                <div 
                  key={doc.id} 
                  className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-all group"
                  onClick={() => setPreviewDoc(doc)}
                >
                  <div className="h-32 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                    {doc.file_type === 'image' || doc.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img src={doc.file_url} alt={doc.title} className="w-full h-full object-cover" />
                    ) : (
                      <DocIcon className="w-12 h-12 text-slate-400" />
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                    </div>
                  </div>
                  <div className="p-3 bg-white">
                    <p className="font-medium truncate text-slate-700">{doc.title}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-3">
            <Button onClick={sendToClient} disabled={isSending || !project?.client_email} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שולח זימון...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  שלח זימון לפגישה במייל
                </>
              )}
            </Button>

            <Button onClick={() => onComplete('present')} variant="outline" className="w-full">
              המשך לאישור
              <CheckCircle2 className="w-4 h-4 mr-2" />
            </Button>
          </div>
        </CardContent>

        {/* Preview Dialog */}
        <DocumentPreviewDialog 
          document={previewDoc} 
          onClose={() => setPreviewDoc(null)} 
        />
      </Card>
    );
  }

  // Approve
  if (activeSubStage === 'approve') {
    const isApproved = project?.[`${type}_approved`];
    const signatureId = project?.[`${type}_signature_id`];

    return (
      <Card className={`border-2 overflow-hidden ${isApproved ? 'border-green-500' : 'border-slate-200'}`}>
        {/* Progress Steps */}
        <div className="flex items-center bg-slate-50 border-b border-slate-200">
          {['העלאה', 'הצגה', 'אישור'].map((step, idx) => (
            <div 
              key={step}
              className={`flex-1 py-3 px-4 text-center text-sm font-medium relative ${
                idx < 2 || isApproved 
                  ? 'bg-green-50 text-green-700' 
                  : idx === 2 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {idx < 2 || isApproved ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">{idx + 1}</span>
                )}
                {step}
              </div>
            </div>
          ))}
        </div>

        <CardContent className={`p-6 ${isApproved ? 'bg-gradient-to-br from-green-50 to-emerald-50' : ''}`}>
          {isApproved ? (
            <div className="text-center py-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-800 mb-2">{typeLabel} אושרו!</h3>
              <p className="text-green-700 mb-4">החתימה הדיגיטלית נשמרה במערכת</p>
              
              <div className="inline-flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-green-200 text-sm">
                <span className="text-slate-500">מזהה חתימה:</span>
                <code className="bg-green-100 px-2 py-0.5 rounded text-green-800 font-mono text-xs">
                  {signatureId?.slice(0, 12)}...
                </code>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Documents summary */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{documents.length} קבצים להצגה לאישור</p>
                  <p className="text-sm text-slate-500">לקוח: {project?.client || 'לא צוין'}</p>
                </div>
                <Badge className="bg-amber-100 text-amber-800">ממתין לאישור</Badge>
              </div>

              {/* Approval terms */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-medium text-amber-900 mb-2">תנאי אישור</h4>
                <p className="text-amber-800 text-sm">
                  בלחיצה על "אשר עם חתימה דיגיטלית" אני מאשר/ת שראיתי את ה{typeLabel} והם מקובלים עליי.
                  החתימה הדיגיטלית מחייבת ותישמר במערכת.
                </p>
              </div>

              {/* Approve button */}
              <Button onClick={handleApprove} className="w-full h-14 bg-gradient-to-l from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg">
                <CheckCircle2 className="w-5 h-5 ml-2" />
                אשר עם חתימה דיגיטלית
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}