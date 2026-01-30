import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { archiflow } from '@/api/archiflow';
import { useAuth } from '@/lib/AuthContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('מעבד את החיבור...');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    // Handle error case immediately
    if (error) {
      setStatus('error');
      setMessage('התחברות ל-Google בוטלה או נכשלה');
      
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_OAUTH_ERROR', error }, window.location.origin);
        setTimeout(() => window.close(), 2000);
      } else {
        setTimeout(() => navigate('/Calendar'), 2000);
      }
      return;
    }

    // Handle no code case
    if (!code) {
      setStatus('error');
      setMessage('לא התקבל קוד אימות');
      if (window.opener) {
        setTimeout(() => window.close(), 2000);
      } else {
        setTimeout(() => navigate('/Calendar'), 2000);
      }
      return;
    }

    // If we have an opener (popup mode), send message and close
    if (window.opener) {
      setStatus('success');
      setMessage('החיבור הצליח! החלון נסגר...');
      window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', code }, window.location.origin);
      setTimeout(() => window.close(), 1500);
      return;
    }

    // No opener - we're in a regular tab, need to wait for user then exchange
    // Don't do anything here - wait for user to be available in the next effect
  }, [searchParams, navigate]);

  // Separate effect to handle code exchange when user is available (for non-popup mode)
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    // Only run this if we have a code, no error, no opener, and user is loaded
    if (!code || error || window.opener || !user?.email) {
      return;
    }

    // Don't run again if we already processed
    if (status === 'success' || status === 'error') {
      return;
    }

    const exchangeCode = async () => {
      setStatus('processing');
      setMessage('מחבר את חשבון Google...');
      
      try {
        console.log('[OAuthCallback] Exchanging code for user:', user.email);
        const res = await archiflow.functions.invoke('userGoogleCalendar', {
          action: 'exchangeCode',
          code,
          redirectUri: `${window.location.origin}/oauth/callback`,
          userEmail: user.email
        });
        
        console.log('[OAuthCallback] Exchange response:', res);
        
        if (res.data?.success) {
          setStatus('success');
          setMessage(`החיבור הצליח! (${res.data.google_email || 'חשבון Google'})`);
          setTimeout(() => navigate('/Calendar'), 2000);
        } else {
          setStatus('error');
          setMessage(res.data?.error || 'שגיאה בחיבור חשבון Google');
          setTimeout(() => navigate('/Calendar'), 3000);
        }
      } catch (err) {
        console.error('[OAuthCallback] Exchange error:', err);
        setStatus('error');
        setMessage('שגיאה בחיבור חשבון Google');
        setTimeout(() => navigate('/Calendar'), 3000);
      }
    };

    exchangeCode();
  }, [searchParams, user, navigate, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-sm mx-4">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-800 mb-2">מעבד...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-green-800 mb-2">החיבור הצליח!</h2>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-red-800 mb-2">שגיאה</h2>
          </>
        )}
        
        <p className="text-slate-600">{message}</p>
        <p className="text-sm text-slate-400 mt-4">החלון ייסגר אוטומטית</p>
      </div>
    </div>
  );
}

