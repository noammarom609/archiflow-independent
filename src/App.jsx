import { useEffect } from 'react';
import './App.css'
import { Toaster as SonnerToaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import OAuthCallback from './pages/OAuthCallback';
import { initCapacitor } from '@/lib/capacitor-utils';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle specific authentication errors
  // Note: 'auth_required' is handled by RequireAuth component in Layout,
  // so we don't auto-redirect here (which would break public pages)
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // For 'auth_required' and other errors, let the router/Layout handle it
    // Public pages will render without auth, protected pages will show login prompt
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  // Initialize Capacitor for native apps
  useEffect(() => {
    initCapacitor();
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <Routes>
            {/* OAuth Callback - Outside of authenticated routes */}
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            {/* All other routes */}
            <Route path="*" element={<AuthenticatedApp />} />
          </Routes>
        </Router>
        {/* Single unified toast system */}
        <SonnerToaster 
          position="top-center"
          dir="rtl"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'Heebo, sans-serif',
            },
          }}
        />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
