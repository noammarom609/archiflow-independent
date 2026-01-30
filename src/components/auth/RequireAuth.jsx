import React from 'react';
import { Link } from 'react-router-dom';
import { SignIn, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { createPageUrl } from '../../utils';
import { useAuth } from '@/lib/AuthContext';

export default function RequireAuth({ children }) {
  const { isAuthenticated, isLoadingAuth, navigateToLogin } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-muted-foreground animate-pulse">טוען...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" dir="rtl">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/30 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/30 rounded-full blur-3xl"></div>
        </div>

        {/* Logo - Top Right - Clickable to go to Landing Home */}
        <Link to={createPageUrl('LandingHome')} className="absolute top-8 right-8 flex items-center gap-4 z-10 hover:opacity-80 transition-opacity">
          <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg bg-[#F7F5F2] flex-shrink-0">
            <img 
              src="/archiflow-logoV2.png" 
              alt="ArchiFlow" 
              className="w-full h-full object-cover"
              style={{ mixBlendMode: 'multiply' }}
            />
          </div>
          <div className="text-right flex flex-col justify-center">
            <h1 className="text-xl font-bold text-foreground tracking-tight leading-tight">ArchiFlow</h1>
            <p className="text-xs text-muted-foreground font-medium tracking-wider uppercase">מערכת הפעלה לאדריכלים</p>
          </div>
        </Link>

        <motion.div 
          className="max-w-md w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 text-center relative z-20 border border-white/50"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg 
              className="w-10 h-10 text-primary" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">נדרשת התחברות</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            כדי לגשת לעמוד זה, עליך להתחבר למערכת
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={navigateToLogin}
              className="w-full h-12 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              התחברות
            </Button>
            <p className="text-sm text-muted-foreground">
              אין לך חשבון?{' '}
              <button 
                onClick={navigateToLogin}
                className="text-primary hover:underline font-medium"
              >
                הרשמה
              </button>
            </p>
            <Button 
              variant="ghost"
              asChild
              className="w-full h-10 text-muted-foreground hover:text-foreground"
            >
              <Link to={createPageUrl('LandingHome')} className="flex items-center justify-center gap-2">
                <ArrowRight className="w-4 h-4" />
                חזרה לדף הבית
              </Link>
            </Button>
          </div>
        </motion.div>
        
        <div className="absolute bottom-8 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ArchiFlow Systems. All rights reserved.
        </div>
      </div>
    );
  }

  return children;
}