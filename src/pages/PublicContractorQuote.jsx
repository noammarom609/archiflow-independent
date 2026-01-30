import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  FileText,
  Download,
  Eye,
  Send,
  AlertCircle,
  Loader2,
  Building2,
  User,
  DollarSign,
  Calendar,
  CheckCircle2,
  Ruler,
  Calculator,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '../components/utils/notifications';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function PublicContractorQuote() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  // Fallback for old links
  const legacyProjectId = urlParams.get('projectId');
  const legacyContractorId = urlParams.get('contractorId');

  const [quoteData, setQuoteData] = useState({
    quote_amount: '',
    timeline_days: '',
    payment_terms: '',
    notes: '',
    items: [],
    // Area-based estimation fields
    use_area_calculation: false,
    project_area_sqm: '',
    price_per_sqm: '',
    estimation_unit: 'total' // total, sqm, lm (linear meter)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Auto-calculate total when using area-based estimation
  const calculateTotal = () => {
    if (quoteData.use_area_calculation && quoteData.project_area_sqm && quoteData.price_per_sqm) {
      return parseFloat(quoteData.project_area_sqm) * parseFloat(quoteData.price_per_sqm);
    }
    return quoteData.quote_amount ? parseFloat(quoteData.quote_amount) : 0;
  };

  // Fetch Quote by Token
  const { data: quoteRequest, isLoading: loadingQuote } = useQuery({
    queryKey: ['publicQuoteRequest', token],
    queryFn: async () => {
      if (!token) return null;
      const quotes = await archiflow.asServiceRole.entities.ContractorQuote.filter({ token });
      return quotes[0];
    },
    enabled: !!token
  });

  const projectId = quoteRequest?.project_id || legacyProjectId;
  const contractorId = quoteRequest?.contractor_id || legacyContractorId;

  // Fetch project
  const { data: project, isLoading: loadingProject, error: projectError } = useQuery({
    queryKey: ['publicProject', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      try {
        const projects = await archiflow.asServiceRole.entities.Project.filter({ id: projectId });
        return projects[0];
      } catch (error) {
        console.error('Error fetching project:', error);
        throw error;
      }
    },
    enabled: !!projectId,
    retry: 1
  });

  // Fetch contractor
  const { data: contractor, isLoading: loadingContractor, error: contractorError } = useQuery({
    queryKey: ['publicContractor', contractorId],
    queryFn: async () => {
      if (!contractorId) return null;
      try {
        const contractors = await archiflow.asServiceRole.entities.Contractor.filter({ id: contractorId });
        return contractors[0];
      } catch (error) {
        console.error('Error fetching contractor:', error);
        throw error;
      }
    },
    enabled: !!contractorId,
    retry: 1
  });

  // Fetch technical documents
  const { data: documents = [] } = useQuery({
    queryKey: ['projectTechnicalDocs', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return archiflow.asServiceRole.entities.Document.filter({ 
        project_id: String(projectId),
        category: 'specification'
      });
    },
    enabled: !!projectId
  });

  const handleSubmit = async () => {
    // Validate based on estimation type
    const hasValidAmount = quoteData.use_area_calculation 
      ? (quoteData.project_area_sqm && quoteData.price_per_sqm)
      : quoteData.quote_amount;
    
    if (!hasValidAmount || !quoteData.timeline_days) {
      showError('יש למלא מחיר ומשך ביצוע');
      return;
    }

    // Calculate final amount
    const finalAmount = quoteData.use_area_calculation 
      ? calculateTotal()
      : parseFloat(quoteData.quote_amount);

    setIsSubmitting(true);
    try {
      // Prepare quote data with area estimation details
      const quotePayload = {
        quote_amount: finalAmount,
        timeline_days: parseInt(quoteData.timeline_days),
        payment_terms: quoteData.payment_terms,
        notes: quoteData.notes,
        // Area estimation fields
        estimation_type: quoteData.use_area_calculation ? quoteData.estimation_unit : 'total',
        project_area: quoteData.use_area_calculation ? parseFloat(quoteData.project_area_sqm) : null,
        price_per_unit: quoteData.use_area_calculation ? parseFloat(quoteData.price_per_sqm) : null,
        status: 'received',
        response_date: new Date().toISOString().split('T')[0]
      };

      // If we have a quoteRequest (from token), update it.
      // If not (legacy link), create a new one.
      
      if (quoteRequest) {
        await archiflow.asServiceRole.entities.ContractorQuote.update(quoteRequest.id, quotePayload);
      } else {
        await archiflow.asServiceRole.entities.ContractorQuote.create({
          project_id: String(projectId),
          project_name: project?.name,
          contractor_id: String(contractorId),
          contractor_name: contractor?.name,
          ...quotePayload,
          submitted_date: new Date().toISOString().split('T')[0]
        });
      }

      setSubmitted(true);
      showSuccess('הצעת המחיר נשלחה בהצלחה!');

      // Send notification to architect about the received quote
      if (project?.created_by || project?.architect_id) {
        const architectId = project.created_by || project.architect_id;
        try {
          // Create in-app notification
          await archiflow.asServiceRole.entities.Notification.create({
            user_id: architectId,
            title: '📩 הצעת קבלן התקבלה',
            message: `${contractor?.name || 'קבלן'} שלח הצעה בסך ₪${parseFloat(quoteData.quote_amount).toLocaleString()} לפרויקט "${project?.name}"`,
            type: 'contractor_quote',
            link: `/Projects?id=${projectId}`,
            is_read: false,
            created_date: new Date().toISOString()
          });
          
          // Send push notification
          await archiflow.functions.invoke('sendPushNotification', {
            userId: architectId,
            title: '📩 הצעת קבלן התקבלה',
            body: `${contractor?.name || 'קבלן'} שלח הצעה לפרויקט "${project?.name}"`,
            url: `/Projects?id=${projectId}`,
            tag: 'contractor_quote'
          });
        } catch (notifError) {
          console.error('Failed to send notification:', notifError);
          // Don't fail the quote submission if notification fails
        }
      }

    } catch (error) {
      console.error('Error submitting quote:', error);
      showError('שגיאה בשליחת הצעת המחיר');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProject || loadingContractor || loadingQuote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  if (projectError || contractorError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">שגיאה בטעינת הנתונים</h2>
            <p className="text-slate-600 mb-4">לא הצלחנו לטעון את הנתונים הנדרשים</p>
            <p className="text-xs text-slate-500 bg-slate-100 p-3 rounded-lg font-mono text-left" dir="ltr">
              {(projectError?.message || contractorError?.message) || 'Unknown error'}
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

  if (!project || !contractor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-200">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">לינק לא תקין</h2>
            <p className="text-slate-600">הלינק שהתקבל אינו תקף</p>
            <p className="text-xs text-slate-500 mt-3">
              Access Token: {token || 'חסר'}
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
          className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-lg flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">ArchiFlow</h1>
                <p className="text-sm text-slate-600">בקשה להצעת מחיר</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
            <div>
              <p className="text-sm text-slate-500">פרויקט</p>
              <p className="font-semibold text-slate-900">{project.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">קבלן</p>
              <p className="font-semibold text-slate-900">{contractor.name}</p>
            </div>
          </div>
        </motion.div>

        {submitted ? (
          /* Success State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-green-500 bg-green-50">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-green-800 mb-3">תודה!</h3>
                <p className="text-lg text-green-700">הצעת המחיר נשלחה בהצלחה</p>
                <p className="text-sm text-green-600 mt-2">נחזור אליך בהקדם</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Technical Documents */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  תוכניות טכניות
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <p className="text-center py-6 text-slate-500">אין תוכניות להצגה</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <span className="flex-1 font-medium">{doc.title}</span>
                        <Button size="sm" variant="outline" onClick={() => window.open(doc.file_url, '_blank')}>
                          <Eye className="w-4 h-4 ml-1" />
                          צפה
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          const link = document.createElement('a');
                          link.href = doc.file_url;
                          link.download = doc.title;
                          link.click();
                        }}>
                          <Download className="w-4 h-4 ml-1" />
                          הורד
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quote Form */}
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>הגשת הצעת מחיר</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Estimation Type Toggle */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-indigo-600" />
                      <Label className="font-medium text-slate-700">שיטת חישוב</Label>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm ${!quoteData.use_area_calculation ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                        סכום כולל
                      </span>
                      <Switch
                        checked={quoteData.use_area_calculation}
                        onCheckedChange={(checked) => setQuoteData({...quoteData, use_area_calculation: checked})}
                      />
                      <span className={`text-sm ${quoteData.use_area_calculation ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>
                        לפי מ"ר
                      </span>
                    </div>
                  </div>
                </div>

                {/* Area-based calculation fields */}
                {quoteData.use_area_calculation ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          יחידת מידה
                        </label>
                        <Select
                          value={quoteData.estimation_unit}
                          onValueChange={(value) => setQuoteData({...quoteData, estimation_unit: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sqm">מ"ר (מטר רבוע)</SelectItem>
                            <SelectItem value="lm">מ"א (מטר אורך)</SelectItem>
                            <SelectItem value="unit">יחידה</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          כמות ({quoteData.estimation_unit === 'sqm' ? 'מ"ר' : quoteData.estimation_unit === 'lm' ? 'מ"א' : 'יחידות'}) *
                        </label>
                        <div className="relative">
                          <Ruler className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            type="number"
                            value={quoteData.project_area_sqm}
                            onChange={(e) => setQuoteData({...quoteData, project_area_sqm: e.target.value})}
                            placeholder="0"
                            className="pr-10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          מחיר ל{quoteData.estimation_unit === 'sqm' ? 'מ"ר' : quoteData.estimation_unit === 'lm' ? 'מ"א' : 'יחידה'} (₪) *
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            type="number"
                            value={quoteData.price_per_sqm}
                            onChange={(e) => setQuoteData({...quoteData, price_per_sqm: e.target.value})}
                            placeholder="0"
                            className="pr-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Calculated Total */}
                    {quoteData.project_area_sqm && quoteData.price_per_sqm && (
                      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <div className="flex items-center justify-between">
                          <span className="text-indigo-700 font-medium">סה"כ מחושב:</span>
                          <div className="text-left">
                            <span className="text-2xl font-bold text-indigo-900">
                              ₪{calculateTotal().toLocaleString()}
                            </span>
                            <p className="text-xs text-indigo-600">
                              {quoteData.project_area_sqm} {quoteData.estimation_unit === 'sqm' ? 'מ"ר' : quoteData.estimation_unit === 'lm' ? 'מ"א' : 'יח\''} × ₪{parseFloat(quoteData.price_per_sqm).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* Standard total amount input */
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      מחיר מוצע (₪) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        type="number"
                        value={quoteData.quote_amount}
                        onChange={(e) => setQuoteData({...quoteData, quote_amount: e.target.value})}
                        placeholder="0"
                        className="pr-10"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    משך ביצוע (ימים) *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="number"
                      value={quoteData.timeline_days}
                      onChange={(e) => setQuoteData({...quoteData, timeline_days: e.target.value})}
                      placeholder="0"
                      className="pr-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    תנאי תשלום
                  </label>
                  <Input
                    value={quoteData.payment_terms}
                    onChange={(e) => setQuoteData({...quoteData, payment_terms: e.target.value})}
                    placeholder="לדוגמה: 50% מקדמה, 50% בסיום"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    הערות והבהרות
                  </label>
                  <Textarea
                    value={quoteData.notes}
                    onChange={(e) => setQuoteData({...quoteData, notes: e.target.value})}
                    placeholder="הוסף הערות נוספות להצעה..."
                    className="min-h-[120px]"
                  />
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!quoteData.quote_amount && !(quoteData.use_area_calculation && quoteData.project_area_sqm && quoteData.price_per_sqm)) || !quoteData.timeline_days}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      שולח...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 ml-2" />
                      שלח הצעת מחיר
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
    </div>
  );
}