import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Calendar, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/utils/notifications';
import ClientEmailDialog from '../ClientEmailDialog';
import AddEventDialog from '@/components/calendar/AddEventDialog';
import { useQueryClient } from '@tanstack/react-query';

export default function ClientUpdates({ project, onUpdate }) {
  const queryClient = useQueryClient();
  const [updateMessage, setUpdateMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);

  const sendClientUpdate = async () => {
    if (!updateMessage.trim()) {
      showError('הזן הודעה לשליחה');
      return;
    }

    if (!project?.client_email) {
      setShowEmailDialog(true);
      return;
    }

    await sendEmailToClient(project.client_email);
  };

  const sendEmailToClient = async (emailAddress) => {
    setIsSending(true);
    try {
      await base44.integrations.Core.SendEmail({
        to: emailAddress,
        subject: `עדכון פרויקט - ${project.name}`,
        body: `שלום ${project.client},

${updateMessage}

בברכה,
ArchiFlow`
      });

      showSuccess('עדכון נשלח ללקוח!');
      setUpdateMessage('');
    } catch (error) {
      console.error('Error sending update:', error);
      showError('שגיאה בשליחת עדכון');
    } finally {
      setIsSending(false);
    }
  };

  const handleEmailSubmit = async (email) => {
    try {
      if (project?.client_id) {
        await base44.entities.Client.update(project.client_id, { email });
        if (onUpdate) await onUpdate({ client_email: email });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
      await sendEmailToClient(email);
      setShowEmailDialog(false);
    } catch (error) {
      console.error('Error updating client email:', error);
      showError('שגיאה בעדכון האימייל');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="w-5 h-5 text-red-600" />
            שליחת עדכון ללקוח
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={updateMessage}
            onChange={(e) => setUpdateMessage(e.target.value)}
            placeholder="כתוב עדכון על התקדמות הפרויקט..."
            className="min-h-[150px]"
          />

          <div className="flex gap-3">
            <Button
              onClick={sendClientUpdate}
              disabled={isSending || !updateMessage.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  שלח עדכון במייל
                </>
              )}
            </Button>
          </div>

          <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between mt-4">
            <div>
              <h4 className="font-medium text-indigo-900">תיאום פגישת עדכון</h4>
              <p className="text-sm text-indigo-700">קבע פגישה ביומן הפרויקט</p>
            </div>
            <Button 
              variant="outline" 
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
              onClick={() => setShowEventDialog(true)}
            >
              <Calendar className="w-4 h-4 ml-2" />
              תאם פגישה
            </Button>
          </div>
        </CardContent>
      </Card>

      <ClientEmailDialog
        isOpen={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        onSubmit={handleEmailSubmit}
        clientName={project?.client}
        isLoading={isSending}
      />

      {/* Add Event Dialog */}
      <AddEventDialog 
        isOpen={showEventDialog}
        onClose={() => setShowEventDialog(false)}
        initialDate={new Date()}
        prefilledData={{
            title: `פגישת עדכון - ${project?.name}`,
            description: `פגישת עדכון סטטוס לפרויקט ${project?.name} עם הלקוח ${project?.client}`,
            project_id: project?.id,
            attendees: [project?.client_email].filter(Boolean)
        }}
      />
    </div>
  );
}