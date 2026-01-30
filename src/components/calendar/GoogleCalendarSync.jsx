import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Loader2, CheckCircle2, AlertCircle, Link2, Unlink, RefreshCw } from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';

export default function GoogleCalendarSync({ isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userEmail = user?.email;

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setSyncResult(null);
    }
  }, [isOpen]);

  // Listen for OAuth callback messages from popup
  useEffect(() => {
    const handleMessage = async (event) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'GOOGLE_OAUTH_SUCCESS') {
        const { code } = event.data;
        try {
          const res = await base44.functions.invoke('userGoogleCalendar', {
            action: 'exchangeCode',
            code,
            redirectUri: `${window.location.origin}/oauth/callback`,
            userEmail
          });
          if (res.data.success) {
            showSuccess(`חשבון Google חובר בהצלחה! (${res.data.google_email})`);
            checkStatus();
          } else {
            showError('שגיאה בחיבור חשבון Google');
          }
        } catch (e) {
          console.error('Exchange code error:', e);
          showError('שגיאה בחיבור חשבון Google');
        }
        setConnecting(false);
      }
      
      if (event.data?.type === 'GOOGLE_OAUTH_ERROR') {
        showError('התחברות ל-Google בוטלה');
        setConnecting(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkStatus = async () => {
    if (!userEmail) {
      setConnectionStatus({ connected: false });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('userGoogleCalendar', { action: 'status', userEmail });
      setConnectionStatus(res.data);
    } catch (error) {
      console.error('Status check error:', error);
      setConnectionStatus({ connected: false });
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await base44.functions.invoke('userGoogleCalendar', {
        action: 'getAuthUrl',
        redirectUri: `${window.location.origin}/oauth/callback`,
        userEmail
      });
      
      if (res.data.authUrl) {
        // Open popup for OAuth
        const w = 500, h = 600;
        const left = window.screenX + (window.outerWidth - w) / 2;
        const top = window.screenY + (window.outerHeight - h) / 2;
        const popup = window.open(
          res.data.authUrl, 
          'google-oauth', 
          `width=${w},height=${h},left=${left},top=${top},scrollbars=yes`
        );
        
        // Check if popup was blocked
        if (!popup) {
          showError('הדפדפן חסם את החלון הקופץ. אנא אפשר חלונות קופצים עבור אתר זה.');
          setConnecting(false);
        }
      }
    } catch (error) {
      console.error('Get auth URL error:', error);
      showError('שגיאה בהתחלת תהליך החיבור');
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await base44.functions.invoke('userGoogleCalendar', { action: 'sync', userEmail });
      if (res.data.success) {
        setSyncResult(res.data);
        showSuccess(`יובאו ${res.data.imported} אירועים חדשים מ-Google Calendar`);
        queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      } else {
        showError(res.data.message || 'שגיאה בסנכרון');
      }
    } catch (error) {
      console.error('Sync error:', error);
      showError('שגיאה בסנכרון עם Google Calendar');
    }
    setSyncing(false);
  };

  const handleDisconnect = async () => {
    if (!confirm('האם אתה בטוח שברצונך לנתק את חשבון Google?')) return;
    
    setDisconnecting(true);
    try {
      await base44.functions.invoke('userGoogleCalendar', { action: 'disconnect', userEmail });
      showSuccess('חשבון Google נותק בהצלחה');
      setConnectionStatus({ connected: false });
      setSyncResult(null);
    } catch (error) {
      console.error('Disconnect error:', error);
      showError('שגיאה בניתוק חשבון Google');
    }
    setDisconnecting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Google Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : connectionStatus?.connected ? (
            <>
              {/* Connected State */}
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="font-semibold">חשבון Google מחובר!</div>
                  <div className="text-sm">{connectionStatus.google_email}</div>
                </AlertDescription>
              </Alert>

              {syncResult && (
                <Alert className="border-blue-200 bg-blue-50">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <div className="text-sm">
                      יובאו {syncResult.imported} אירועים חדשים מתוך {syncResult.total} אירועים
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm">פעולות זמינות:</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>סנכרן אירועים מ-30 הימים הקרובים</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>אירועים קיימים לא יוכפלו</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSync}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  disabled={syncing}
                >
                  {syncing ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      מסנכרן...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 ml-2" />
                      סנכרן עכשיו
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {disconnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Not Connected State */}
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  חבר את חשבון ה-Google שלך כדי לסנכרן את היומן האישי שלך עם ArchiFlow
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900">מה יקרה אחרי החיבור?</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>תוכל לסנכרן אירועים מהיומן האישי שלך</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>האירועים יופיעו רק בלוח השנה שלך</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>תוכל לנתק את החיבור בכל עת</span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleConnect}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={connecting}
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מתחבר...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 ml-2" />
                    חבר חשבון Google
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
