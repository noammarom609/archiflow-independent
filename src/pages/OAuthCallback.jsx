import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('מעבד את החיבור...');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage('התחברות ל-Google בוטלה או נכשלה');
      
      // Send error to opener and close
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_OAUTH_ERROR', error }, window.location.origin);
      }
      setTimeout(() => window.close(), 2000);
      return;
    }

    if (code) {
      setStatus('success');
      setMessage('החיבור הצליח! החלון נסגר...');
      
      // Send code to opener
      if (window.opener) {
        window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS', code }, window.location.origin);
      }
      
      // Close window after short delay
      setTimeout(() => window.close(), 1500);
    } else {
      setStatus('error');
      setMessage('לא התקבל קוד אימות');
      setTimeout(() => window.close(), 2000);
    }
  }, [searchParams]);

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

