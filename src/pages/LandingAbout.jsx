import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  BarChart3, 
  Lightbulb, 
  Users,
  CheckCircle2
} from 'lucide-react';
import LandingLayout from '../components/landing/LandingLayout';
import LandingCTA from '../components/landing/LandingCTA';
import { useLandingLanguage } from '../components/landing/LandingLanguageContext';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

// Hero Section
function AboutHero() {
  const { t } = useLandingLanguage();
  const aboutT = t('about');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F5F2] via-white to-white pt-8 sm:pt-12 pb-12 sm:pb-20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[300px] sm:h-[600px] bg-gradient-radial from-[#984E39]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl">
          <motion.p 
            className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-3 sm:mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {aboutT.hero?.label}
          </motion.p>
          
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {aboutT.hero?.title}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#984E39] to-[#D4A574]">
              {aboutT.hero?.titleHighlight}
            </span>
          </motion.h1>

          <motion.p 
            className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {aboutT.hero?.subtitle}
          </motion.p>

          {/* Stats */}
          <motion.div 
            className="grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-8 md:gap-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {aboutT.hero?.stats?.map((stat, index) => (
              <div key={index} className="text-center sm:text-start">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#984E39] to-[#D4A574]">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Values Section
function ValuesSection() {
  const { t } = useLandingLanguage();
  const aboutT = t('about');

  const valueIcons = [Heart, BarChart3, Lightbulb, Users];
  const valueColors = [
    'bg-rose-100 text-rose-600',
    'bg-blue-100 text-blue-600',
    'bg-amber-100 text-amber-600',
    'bg-emerald-100 text-emerald-600'
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12 md:mb-16">
          <div>
            <motion.p 
              className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2 sm:mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {aboutT.values?.label}
            </motion.p>
            <motion.h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {aboutT.values?.title}
            </motion.h2>
          </div>
          <div className="flex items-end">
            <motion.p 
              className="text-base sm:text-lg text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              {aboutT.values?.subtitle}
            </motion.p>
          </div>
        </div>

        {/* Values Grid */}
        <motion.div 
          className="grid sm:grid-cols-2 gap-4 sm:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {aboutT.values?.items?.map((value, index) => {
            const Icon = valueIcons[index];
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${valueColors[index]} flex items-center justify-center mb-3 sm:mb-5`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{value.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{value.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// Story Section
function StorySection() {
  const { t } = useLandingLanguage();
  const aboutT = t('about');

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
          {/* Story */}
          <div>
            <motion.p 
              className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2 sm:mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {aboutT.story?.label}
            </motion.p>
            <motion.h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {aboutT.story?.title}
            </motion.h2>
            
            <motion.div 
              className="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-600 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              {aboutT.story?.paragraphs?.map((para, index) => (
                <p key={index}>{para}</p>
              ))}
            </motion.div>
          </div>

          {/* Mission */}
          <div className="mt-4 lg:mt-0">
            <motion.div 
              className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 p-5 sm:p-6 md:p-8 shadow-sm"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2 sm:mb-3">
                {aboutT.story?.mission?.label}
              </p>
              <p className="text-base sm:text-lg text-gray-900 font-medium mb-4 sm:mb-6 leading-relaxed">
                {aboutT.story?.mission?.text}
              </p>
              
              <div className="space-y-2 sm:space-y-3">
                {aboutT.story?.mission?.points?.map((point, index) => (
                  <div key={index} className="flex items-start sm:items-center gap-2 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0" />
                    <span className="text-sm sm:text-base text-gray-600">{point}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Why Now Section
function WhyNowSection() {
  const { t } = useLandingLanguage();
  const aboutT = t('about');

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <motion.p 
          className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2 sm:mb-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {aboutT.whyNow?.label}
        </motion.p>
        <motion.h2 
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {aboutT.whyNow?.title}
        </motion.h2>
        
        <motion.div 
          className="space-y-4 sm:space-y-6 text-base sm:text-lg text-gray-600 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {aboutT.whyNow?.paragraphs?.map((para, index) => (
            <p key={index}>{para}</p>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Main Component
export default function LandingAbout() {
  return (
    <LandingLayout>
      <AboutHero />
      <ValuesSection />
      <StorySection />
      <WhyNowSection />
      <LandingCTA />
    </LandingLayout>
  );
}