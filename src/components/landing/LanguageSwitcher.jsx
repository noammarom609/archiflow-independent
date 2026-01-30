import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLandingLanguage } from './LandingLanguageContext';

export default function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage } = useLandingLanguage();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4 text-gray-500" />
      <div className="bg-gray-100 rounded-full p-0.5 flex">
        <motion.button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            language === 'en' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          EN
        </motion.button>
        <motion.button
          onClick={() => setLanguage('he')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
            language === 'he' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          עב
        </motion.button>
      </div>
    </div>
  );
}