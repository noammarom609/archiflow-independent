import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { useLandingLanguage } from './LandingLanguageContext';

export default function LandingCTA({ 
  title,
  subtitle,
  buttonText,
  buttonLink = "Dashboard"
}) {
  const { t, isRTL } = useLandingLanguage();
  const ctaT = t('cta');
  
  const displayTitle = title || ctaT.title;
  const displaySubtitle = subtitle || ctaT.subtitle;
  const displayButton = buttonText || ctaT.button;
  return (
    <section className="relative overflow-hidden">
      {/* Gradient Background - ArchiFlow Colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#984E39] via-[#B86B4C] to-[#D4A574]" />
      
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <div className="text-center">
          <motion.h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {displayTitle}
          </motion.h2>
          <motion.p 
            className="text-base sm:text-lg text-white/80 max-w-xl mx-auto mb-6 sm:mb-8 px-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {displaySubtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Button
              asChild
              size="lg"
              className="bg-white text-[#984E39] hover:bg-white/90 rounded-full px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold shadow-xl shadow-black/20 group w-full sm:w-auto max-w-xs sm:max-w-none"
            >
              <Link to={createPageUrl(buttonLink)} className="flex items-center justify-center gap-2">
                {displayButton}
                {isRTL ? (
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}