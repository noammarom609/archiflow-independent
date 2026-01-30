import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, Mail, Send, Calendar, FileText } from 'lucide-react';
import { useProjectData } from '../ProjectDataContext';
import { sendWhatsApp, openGoogleCalendar } from '../../utils/integrations';
import { showSuccess } from '../../utils/notifications';

export default function LeadOnboardingStage() {
  const { projectData, updateStage } = useProjectData();
  const { callNotes, clientData } = projectData.lead;

  return (
    <div className="space-y-6">
      {/* First Call Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-indigo-600" />
              תיעוד שיחה ראשונה
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="call-notes">הערות מהשיחה</Label>
              <Textarea
                id="call-notes"
                value={callNotes}
                onChange={(e) => updateStage('lead', { callNotes: e.target.value })}
                placeholder="רשום את הדברים החשובים מהשיחה עם הלקוח..."
                className="mt-2 min-h-[120px]"
              />
            </div>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={() => showSuccess('התיעוד נשמר בהצלחה ✓')}
            >
              <FileText className="w-4 h-4 ml-2" />
              שמור תיעוד
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Needs Assessment Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              כרטיס לקוח - הערכת צרכים
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="budget">תקציב משוער</Label>
              <Input
                id="budget"
                type="text"
                value={clientData.budget}
                onChange={(e) => updateStage('lead', { clientData: { ...clientData, budget: e.target.value } })}
                placeholder="₪450,000"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="style">סגנון מועדף</Label>
              <Input
                id="style"
                type="text"
                value={clientData.style}
                onChange={(e) => updateStage('lead', { clientData: { ...clientData, style: e.target.value } })}
                placeholder="מודרני, מינימליסטי, סקנדינבי..."
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="deadline">מועד רצוי למסירה</Label>
              <Input
                id="deadline"
                type="date"
                value={clientData.deadline}
                onChange={(e) => updateStage('lead', { clientData: { ...clientData, deadline: e.target.value } })}
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Automation Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              פעולות אוטומטיות
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 justify-start"
              onClick={() => {
                const message = `שלום, תודה על השיחה!\n\nנרגשים להתחיל לעבוד על הפרויקט שלכם.\n\nסיכום:\n• תקציב: ${clientData.budget || 'לא צוין'}\n• סגנון: ${clientData.style || 'לא צוין'}\n• מועד רצוי: ${clientData.deadline || 'לא צוין'}\n\nנחזור אליכם בקרוב עם הצעת מחיר מפורטת.\n\nבברכה,\nצוות ArchiFlow`;
                sendWhatsApp('', message);
                showSuccess('הודעת WhatsApp נשלחה ללקוח');
              }}
            >
              <Mail className="w-4 h-4 ml-2" />
              שלח סיכום היכרות (Email + WhatsApp)
            </Button>
            <Button 
              className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 justify-start"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(10, 0, 0, 0);
                
                const endTime = new Date(tomorrow);
                endTime.setHours(11, 0, 0, 0);
                
                openGoogleCalendar({
                  title: 'פגישת היכרות - פרויקט שיפוץ',
                  description: `פגישת היכרות ראשונית עם הלקוח\n\nתקציב: ${clientData.budget}\nסגנון: ${clientData.style}`,
                  location: 'משרד ArchiFlow',
                  startDate: tomorrow,
                  endDate: endTime,
                });
                showSuccess('אירוע נוסף ליומן Google Calendar');
              }}
            >
              <Calendar className="w-4 h-4 ml-2" />
              תזמן פגישה ראשונה (סנכרון Google Calendar)
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}