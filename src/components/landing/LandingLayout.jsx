import React from 'react';
import LandingHeader from './LandingHeader';
import LandingFooter from './LandingFooter';
import { LandingLanguageProvider, useLandingLanguage } from './LandingLanguageContext';

function LandingLayoutContent({ children }) {
  const { isRTL } = useLandingLanguage();
  
  return (
    <div className="min-h-screen bg-white overflow-visible" dir={isRTL ? 'rtl' : 'ltr'}>
      <LandingHeader />
      <main className="pt-20 overflow-visible">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}

export default function LandingLayout({ children }) {
  return (
    <LandingLanguageProvider>
      <LandingLayoutContent>{children}</LandingLayoutContent>
    </LandingLanguageProvider>
  );
}