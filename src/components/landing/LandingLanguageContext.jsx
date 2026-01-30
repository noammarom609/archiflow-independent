import React, { createContext, useContext, useState, useEffect } from 'react';
import { landingTranslations } from './landingTranslations';

const LandingLanguageContext = createContext(null);

export function useLandingLanguage() {
  const context = useContext(LandingLanguageContext);
  if (!context) {
    throw new Error('useLandingLanguage must be used within LandingLanguageProvider');
  }
  return context;
}

export function LandingLanguageProvider({ children }) {
  const [language, setLanguageState] = useState('he');

  useEffect(() => {
    // Load saved language from localStorage
    const saved = localStorage.getItem('landingLanguage');
    if (saved && (saved === 'he' || saved === 'en')) {
      setLanguageState(saved);
    }

    // Listen for language changes from other components
    const handleLanguageChange = () => {
      const newLang = localStorage.getItem('landingLanguage');
      if (newLang && (newLang === 'he' || newLang === 'en')) {
        setLanguageState(newLang);
      }
    };

    window.addEventListener('landingLanguageChange', handleLanguageChange);
    return () => window.removeEventListener('landingLanguageChange', handleLanguageChange);
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('landingLanguage', lang);
    window.dispatchEvent(new Event('landingLanguageChange'));
  };

  const t = (section) => {
    return landingTranslations[section]?.[language] || landingTranslations[section]?.en || {};
  };

  const isRTL = language === 'he';

  return (
    <LandingLanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LandingLanguageContext.Provider>
  );
}