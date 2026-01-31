import React from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import LandingLayout from '../components/landing/LandingLayout';
import { useLandingLanguage } from '../components/landing/LandingLanguageContext';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function LandingPrivacyContent() {
  const { t, language } = useLandingLanguage();
  const footerT = t('footer');
  const legalT = t('legal');
  const content = legalT?.privacy;
  const dateLocale = language === 'he' ? 'he-IL' : 'en-GB';

  if (!content) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-gray-900">{footerT?.privacyPolicy || 'מדיניות פרטיות'}</h1>
        <p className="mt-4 text-gray-600">תוכן מדיניות הפרטיות ייטען כאן.</p>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F5F2] via-white to-white pt-8 sm:pt-12 pb-16 sm:pb-24">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[300px] bg-gradient-radial from-[#984E39]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex items-center gap-3 mb-6"
        >
          <Shield className="w-10 h-10 text-[#984E39]" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {footerT?.privacyPolicy || 'מדיניות פרטיות'}
          </h1>
        </motion.div>

        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-sm text-gray-500 mb-8"
        >
          {legalT?.lastUpdated} {new Date().toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' })}
        </motion.p>

        <motion.p
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="text-base sm:text-lg text-gray-600 leading-relaxed mb-10"
        >
          {content.intro}
        </motion.p>

        <div className="space-y-8">
          {content.sections?.map((section, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.05 }}
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{section.title}</h2>
              <p className="text-gray-600 leading-relaxed">{section.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPrivacy() {
  return (
    <LandingLayout>
      <LandingPrivacyContent />
    </LandingLayout>
  );
}
