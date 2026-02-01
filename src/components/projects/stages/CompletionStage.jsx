import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle2, 
  Mail, 
  Star, 
  PartyPopper, 
  Calendar, 
  DollarSign, 
  ArrowLeft,
  Trophy,
  Camera,
  MessageSquare,
  Share2,
  Download,
  ExternalLink,
  Sparkles,
  Heart,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Gift
} from 'lucide-react';
import { sendWhatsApp } from '../../utils/integrations';
import { showSuccess, showError } from '../../utils/notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { archiflow } from '@/api/archiflow';

export default function CompletionStage({ project, onUpdate, onSubStageChange }) {
  const queryClient = useQueryClient();
  const isClosed = project?.completion_date ? true : false;
  const [testimonialNote, setTestimonialNote] = useState('');
  const [showShareOptions, setShowShareOptions] = useState(false);

  // Fetch proposal for budget data
  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals', project?.id],
    queryFn: () => project?.id 
      ? archiflow.entities.Proposal.filter({ project_id: project.id })
      : Promise.resolve([]),
    enabled: !!project?.id,
  });

  // Fetch selected contractor quote
  const { data: selectedQuote } = useQuery({
    queryKey: ['selectedQuote', project?.selected_quote_id],
    queryFn: () => project?.selected_quote_id 
      ? archiflow.entities.ContractorQuote.filter({ id: project.selected_quote_id })
      : Promise.resolve([]),
    enabled: !!project?.selected_quote_id,
    select: (data) => data?.[0],
  });

  // Calculate actual project data
  const approvedProposal = proposals.find(p => p.status === 'approved') || proposals[0];
  const originalBudget = approvedProposal?.total_amount || parseFloat(project?.budget?.replace(/[^\d]/g, '') || 0);
  const actualBudget = selectedQuote?.quote_amount || originalBudget;
  
  // Calculate duration
  const startDate = project?.start_date ? new Date(project.start_date) : null;
  const endDate = project?.completion_date ? new Date(project.completion_date) : new Date();
  const plannedDays = project?.gantt_data?.total_days || 180; // Assuming 180 days default if no gantt
  const actualDays = startDate ? Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) : plannedDays;

  const formatCurrency = (amount) => `₪${Number(amount || 0).toLocaleString()}`;

  const closeProject = async () => {
    try {
      const completionDate = new Date().toISOString();
      if (onUpdate) {
        await onUpdate({ 
          completion_date: completionDate,
          status: 'completion', // Keeping it in completion stage but marked with date
          completion_notes: 'Project closed successfully'
        });
      }

      // Send WhatsApp (using direct window.open if utility fails, but utility is imported)
      let feedbackMessage = `היי ${project.client || ''}, תודה רבה על שבחרתם בנו! 🎉\n\nנשמח לקבל משוב על השירות:\nhttps://archiflow.app/feedback/${project.id}\n\nתמונות לפני/אחרי יתקבלו בברכה!`;
      
      // Include testimonial note if provided
      if (testimonialNote?.trim()) {
        feedbackMessage += `\n\nנקודות שכדאי לציין: ${testimonialNote}`;
      }
      
      try {
        sendWhatsApp(project.client_phone || '', feedbackMessage);
      } catch (e) {
        console.error('WhatsApp error', e);
        window.open(`https://wa.me/?text=${encodeURIComponent(feedbackMessage)}`, '_blank');
      }

      showSuccess('הפרויקט נסגר ובקשת משוב נשלחה! 🎊');
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });

    } catch (error) {
      console.error('Error closing project:', error);
      showError('שגיאה בסגירת הפרויקט');
    }
  };

  // Request photos from client
  const requestPhotos = () => {
    const message = `היי ${project?.client || ''}, אנחנו מסכמים את הפרויקט ונשמח לקבל תמונות איכותיות של התוצאה הסופית! 📸\n\nתמונות לפני/אחרי יעזרו מאוד לפורטפוליו שלנו.\n\nתודה רבה!`;
    try {
      sendWhatsApp(project?.client_phone || '', message);
      showSuccess('בקשה לתמונות נשלחה!');
    } catch (e) {
      console.error('WhatsApp error', e);
      window.open(`https://wa.me/${project?.client_phone?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  // Add to portfolio
  const addToPortfolio = async () => {
    try {
      if (onUpdate) {
        await onUpdate({ 
          in_portfolio: true,
          portfolio_added_date: new Date().toISOString()
        });
      }
      showSuccess('הפרויקט נוסף לפורטפוליו!');
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      showError('שגיאה בהוספה לפורטפוליו');
    }
  };

  // Share functions
  const shareToFacebook = () => {
    const url = `${window.location.origin}/portfolio/${project?.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
  };

  const shareToLinkedIn = () => {
    const url = `${window.location.origin}/portfolio/${project?.id}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
  };

  const shareToInstagram = () => {
    // Instagram doesn't support direct sharing via URL, open profile or show message
    showSuccess('העתק את הלינק ושתף בסטורי או בפוסט באינסטגרם');
    copyProjectLink();
  };

  const copyProjectLink = () => {
    const url = `${window.location.origin}/portfolio/${project?.id}`;
    navigator.clipboard.writeText(url).then(() => {
      showSuccess('הלינק הועתק!');
    }).catch(() => {
      showError('לא ניתן להעתיק');
    });
  };

  // Calculate performance metrics
  const budgetVariance = originalBudget > 0 ? ((actualBudget - originalBudget) / originalBudget * 100) : 0;
  const timeVariance = plannedDays > 0 ? ((actualDays - plannedDays) / plannedDays * 100) : 0;
  const overallScore = Math.min(100, Math.max(0, 100 - Math.abs(budgetVariance) / 2 - Math.abs(timeVariance) / 2));

  return (
    <div className="space-y-6">
      {!isClosed ? (
        <>
          {/* Achievement Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Trophy className="w-8 h-8 text-yellow-300" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">מעולה! הפרויקט הושלם</h2>
                  <p className="text-white/80 mt-1">כל השלבים בוצעו בהצלחה - הגיע הזמן לסגור ולחגוג!</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold">{Math.round(overallScore)}</div>
                <div className="text-sm text-white/70">ציון ביצוע</div>
              </div>
            </div>
          </motion.div>

          {/* Project Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  סיכום הפרויקט
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Budget & Time Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-slate-500" />
                      <p className="text-xs text-slate-500 font-medium">תקציב מקורי</p>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(originalBudget)}</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${actualBudget <= originalBudget ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {actualBudget <= originalBudget ? (
                        <TrendingDown className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                      )}
                      <p className="text-xs text-slate-500 font-medium">תקציב סופי</p>
                    </div>
                    <p className={`text-xl font-bold ${actualBudget <= originalBudget ? 'text-green-700' : 'text-amber-700'}`}>
                      {formatCurrency(actualBudget)}
                    </p>
                    {budgetVariance !== 0 && (
                      <Badge className={`mt-1 ${budgetVariance <= 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {budgetVariance > 0 ? '+' : ''}{budgetVariance.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <p className="text-xs text-slate-500 font-medium">משך מתוכנן</p>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{plannedDays} ימים</p>
                  </div>
                  <div className={`rounded-xl p-4 border ${actualDays <= plannedDays ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <p className="text-xs text-slate-500 font-medium">משך בפועל</p>
                    </div>
                    <p className={`text-xl font-bold ${actualDays <= plannedDays ? 'text-blue-700' : 'text-amber-700'}`}>
                      {actualDays} ימים
                    </p>
                    {timeVariance !== 0 && (
                      <Badge className={`mt-1 ${timeVariance <= 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {timeVariance > 0 ? '+' : ''}{timeVariance.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Performance Score */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      <span className="font-medium text-indigo-900">ציון ביצוע כולל</span>
                    </div>
                    <span className="text-2xl font-bold text-indigo-700">{Math.round(overallScore)}%</span>
                  </div>
                  <Progress value={overallScore} className="h-3" />
                  <p className="text-xs text-indigo-600 mt-2">
                    {overallScore >= 90 && '🏆 מעולה! הפרויקט בוצע בצורה יוצאת מן הכלל'}
                    {overallScore >= 70 && overallScore < 90 && '✨ טוב מאוד! הפרויקט עמד ברוב היעדים'}
                    {overallScore < 70 && '📊 יש מקום לשיפור בפרויקטים הבאים'}
                  </p>
                </div>

                {/* Success Message */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-green-900">הפרויקט הושלם בהצלחה!</h4>
                      <p className="text-sm text-green-700">כל השלבים הושלמו - מוכן לסגירה</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Request Photos & Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-pink-600" />
                  תיעוד ומשוב
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Photo Request */}
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Camera className="w-5 h-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-pink-900">תמונות לפני/אחרי</h4>
                      <p className="text-sm text-pink-700 mt-1">
                        תמונות איכותיות מהפרויקט יעזרו לפורטפוליו ולשיווק העסק
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 border-pink-300 text-pink-700 hover:bg-pink-100"
                        onClick={requestPhotos}
                      >
                        <Camera className="w-4 h-4 ml-2" />
                        בקש תמונות מהלקוח
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Testimonial Note */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-amber-900">הערות למשוב</h4>
                      <p className="text-sm text-amber-700">נקודות שכדאי להזכיר בבקשת המשוב</p>
                    </div>
                  </div>
                  <Textarea
                    placeholder="לדוגמה: הפרויקט הושלם לפני הזמן, הלקוח היה מרוצה במיוחד מ..."
                    value={testimonialNote}
                    onChange={(e) => setTestimonialNote(e.target.value)}
                    className="min-h-[80px] bg-white/70"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Close Project */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-emerald-600" />
                  סגור פרויקט
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-emerald-700">
                  בלחיצה על הכפתור, הפרויקט יסומן כסגור ויישלח ללקוח בקשת משוב אוטומטית בוואטסאפ.
                </p>
                <Button
                  onClick={closeProject}
                  className="w-full bg-gradient-to-l from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 h-14 text-lg shadow-lg"
                >
                  <PartyPopper className="w-5 h-5 ml-2" />
                  סגור פרויקט ושלח בקשת משוב 🎉
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Celebration Card */}
          <Card className="border-0 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 text-white overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center relative">
              {/* Confetti Animation Background */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: ['#FFD700', '#FF69B4', '#87CEEB', '#98FB98'][i % 4],
                      left: `${Math.random() * 100}%`,
                      top: '-10px',
                    }}
                    animate={{
                      y: ['0vh', '100vh'],
                      x: [0, (Math.random() - 0.5) * 100],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                      ease: 'linear',
                    }}
                  />
                ))}
              </div>

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
                className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
              >
                <Trophy className="w-14 h-14 text-yellow-300" />
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl md:text-4xl font-bold mb-3"
              >
                הפרויקט נסגר בהצלחה! 🎉
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-white/90 mb-4"
              >
                כל הכבוד! עוד פרויקט מוצלח בספרים
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm"
              >
                <Calendar className="w-4 h-4" />
                תאריך סגירה: {new Date(project.completion_date).toLocaleDateString('he-IL')}
              </motion.div>
            </CardContent>
          </Card>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">בקשת משוב נשלחה</p>
                  <p className="text-xs text-green-600">WhatsApp + Email</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-auto" />
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-900">משוב הלקוח</p>
                  <p className="text-xs text-amber-600">ממתין לתגובה</p>
                </div>
                <Button size="sm" variant="ghost" className="mr-auto text-amber-600">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-indigo-200 bg-indigo-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Camera className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-indigo-900">תמונות לפני/אחרי</p>
                  <p className="text-xs text-indigo-600">העלה לפורטפוליו</p>
                </div>
                <Button size="sm" variant="ghost" className="mr-auto text-indigo-600">
                  <Download className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Share & Actions */}
          <Card className="border-slate-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">שתף את ההצלחה!</h4>
                    <p className="text-sm text-slate-500">הוסף לפורטפוליו או שתף ברשתות</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addToPortfolio}>
                    <Camera className="w-4 h-4 ml-2" />
                    הוסף לפורטפוליו
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowShareOptions(!showShareOptions)}>
                    <Share2 className="w-4 h-4 ml-2" />
                    שתף
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => window.history.back()}
                  >
                    <ArrowLeft className="w-4 h-4 ml-2" />
                    חזרה לפרויקטים
                  </Button>
                </div>
              </div>

              {/* Share Options */}
              <AnimatePresence>
                {showShareOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <Button size="sm" variant="outline" className="flex-1" onClick={shareToFacebook}>
                        Facebook
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={shareToInstagram}>
                        Instagram
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={shareToLinkedIn}>
                        LinkedIn
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={copyProjectLink}>
                        העתק לינק
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}