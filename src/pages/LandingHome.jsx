import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/AuthContext';
import { 
  ArrowRight, 
  ArrowLeft,
  FolderKanban, 
  Calculator, 
  Mic, 
  Sparkles,
  Shield,
  Lock,
  FileCheck,
  TrendingUp
} from 'lucide-react';
import LandingLayout from '../components/landing/LandingLayout';
import LandingCTA from '../components/landing/LandingCTA';
import { useLandingLanguage } from '../components/landing/LandingLanguageContext';
import Logo3D from '../components/landing/Logo3D';

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
function HeroSection() {
  const { t, isRTL } = useLandingLanguage();
  const homeT = t('home');
  const navigate = useNavigate();
  const { isAuthenticated, navigateToLogin } = useAuth();

  const handleSignIn = () => {
    if (isAuthenticated) {
      navigate(createPageUrl('Dashboard'));
    } else {
      navigateToLogin();
    }
  };

  return (
    <section className="relative pt-8 sm:pt-12 pb-12 sm:pb-20" style={{ zIndex: 0, overflow: 'visible' }}>
      {/* Background gradient - behind everything */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F7F5F2] via-white to-white pointer-events-none" style={{ zIndex: 0 }} />
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[300px] sm:h-[600px] bg-gradient-radial from-[#984E39]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content - Right side */}
          <div className="max-w-3xl lg:order-2 relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm font-medium border-[#984E39]/30 text-[#984E39] bg-[#984E39]/5">
              <Sparkles className="w-3.5 h-3.5 mr-2" />
              {homeT.hero?.badge}
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {homeT.hero?.title}
            {/* Line break on mobile only to avoid logo overlap */}
            <br className="lg:hidden" />
            <span className="lg:hidden"> </span>
            <span className="hidden lg:inline"> </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#984E39] to-[#D4A574]">
              {homeT.hero?.titleHighlight}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed mb-6 sm:mb-8 max-w-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {homeT.hero?.subtitle}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8 sm:mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold shadow-lg shadow-primary/25 group w-full sm:w-auto"
              onClick={handleSignIn}
            >
              <span className="flex items-center justify-center gap-2">
                {homeT.hero?.cta}
                {isRTL ? (
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="text-gray-600 hover:text-gray-900 text-sm sm:text-base"
              onClick={handleSignIn}
            >
              {homeT.hero?.signIn}
            </Button>
          </motion.div>

          {/* Social Proof */}
          <motion.div 
            className="flex items-center gap-3 sm:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="flex -space-x-2">
              {[
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop',
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="User"
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-gray-600">
              <span className="font-semibold text-gray-900">500+</span> {homeT.hero?.socialProof}
            </p>
          </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const { t } = useLandingLanguage();
  const homeT = t('home');

  const featureIcons = [FolderKanban, Calculator, Mic, Sparkles];
  const featureColors = [
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600',
    'bg-[#984E39]/10 text-[#984E39]',
    'bg-amber-100 text-amber-600'
  ];

  return (
    <section className="relative py-12 sm:py-16 md:py-24 overflow-visible">
      {/* Background layer - below the 3D model */}
      <div className="absolute inset-0 bg-white pointer-events-none" style={{ zIndex: 0 }} />
      {/* Content layer - above the 3D model */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6" style={{ position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12 md:mb-16">
          <div>
            <motion.p 
              className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2 sm:mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {homeT.features?.label}
            </motion.p>
            <motion.h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {homeT.features?.title}
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
              {homeT.features?.subtitle}
            </motion.p>
          </div>
        </div>

        {/* Features Grid */}
        <motion.div 
          className="grid sm:grid-cols-2 gap-4 sm:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {homeT.features?.items?.map((feature, index) => {
            const Icon = featureIcons[index];
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${featureColors[index]} flex items-center justify-center mb-3 sm:mb-5`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

// How it Works Section
function HowItWorksSection() {
  const { t } = useLandingLanguage();
  const homeT = t('home');

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <motion.p 
            className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2 sm:mb-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {homeT.howItWorks?.label}
          </motion.p>
          <motion.h2 
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {homeT.howItWorks?.title}
          </motion.h2>
        </div>

        {/* Steps */}
        <motion.div 
          className="grid sm:grid-cols-3 gap-8 sm:gap-6 md:gap-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {homeT.howItWorks?.steps?.map((step, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="text-center"
            >
              <span className="text-5xl sm:text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-primary/30 to-primary/10">
                {step.number}
              </span>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mt-2 sm:mt-4 mb-2 sm:mb-3">{step.title}</h3>
              <p className="text-sm sm:text-base text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// Security Section
function SecuritySection() {
  const { t } = useLandingLanguage();
  const homeT = t('home');

  const securityIcons = [Lock, Shield, FileCheck];

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div>
            <motion.p 
              className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2 sm:mb-3"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {homeT.security?.label}
            </motion.p>
            <motion.h2 
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              {homeT.security?.title}
            </motion.h2>
            <motion.p 
              className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              {homeT.security?.subtitle}
            </motion.p>

            <motion.div 
              className="space-y-3 sm:space-y-4"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {homeT.security?.features?.map((feature, index) => {
                const Icon = securityIcons[index];
                return (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Dashboard Preview Card */}
          <motion.div
            className="relative mt-8 lg:mt-0"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-100 p-4 sm:p-6 max-w-sm mx-auto">
              {/* Mini dashboard preview */}
              <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-100 rounded mb-4 sm:mb-6" />
              
              <div className="bg-gradient-to-br from-primary/5 to-[#D4A574]/10 rounded-lg sm:rounded-xl p-4 sm:p-5 mb-3 sm:mb-4">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">
                    {homeT.security?.dashboardPreview?.projectHealth}
                  </span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">87</div>
                <div className="text-xs sm:text-sm text-emerald-600 font-medium">
                  {homeT.security?.dashboardPreview?.improvement}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <span className="text-[10px] sm:text-xs text-gray-500 block mb-1">
                    {homeT.security?.dashboardPreview?.revenue}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">₪24,500</span>
                </div>
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                  <span className="text-[10px] sm:text-xs text-gray-500 block mb-1">
                    {homeT.security?.dashboardPreview?.projects}
                  </span>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">34</span>
                </div>
              </div>
            </div>

            {/* Decorative elements - hidden on small screens */}
            <div className="hidden sm:block absolute -z-10 -top-8 -right-8 w-64 h-64 bg-[#984E39]/10 rounded-full blur-3xl" />
            <div className="hidden sm:block absolute -z-10 -bottom-8 -left-8 w-48 h-48 bg-[#D4A574]/20 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Logo Section Component - uses language context (must be inside LandingLayout)
function LogoSection() {
  const { isRTL } = useLandingLanguage();
  
  return (
    <>
      {/* Mobile: Simple floating logo image - position changes based on language direction */}
      <div 
        className={`lg:hidden absolute top-28 z-[1] pointer-events-none ${
          isRTL ? 'left-8' : 'right-8'
        }`}
      >
        <motion.img
          src="/archiflow-logoV2-BG remove.png"
          alt="ArchiFlow Logo"
          className="w-36 h-36 sm:w-40 sm:h-40 object-contain"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Desktop: 3D Logo - shown only on lg+ screens, position flips based on language */}
      <div 
        className="absolute pointer-events-none hidden lg:block" 
        style={{ 
          top: 0,
          left: 0,
          right: 0,
          height: '1000px',
          zIndex: 1,
          margin: 0,
          padding: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          overflow: 'visible'
        }}
      >
        <div className="relative w-full h-full max-w-7xl mx-auto px-4 sm:px-6" style={{ background: 'transparent', overflow: 'visible', height: '100%' }}>
          <div 
            className="absolute top-[350px] w-[150%] h-[1600px]"
            style={{
              // Position logo on LEFT for RTL (Hebrew), on RIGHT for LTR (English)
              ...(isRTL 
                ? { left: 'calc(1rem + 240px)' } 
                : { right: 'calc(1rem + 240px)' }
              ),
              margin: 0,
              padding: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              boxShadow: 'none',
              overflow: 'visible',
              transform: `translate(${isRTL ? '-50%' : '50%'}, -50%)`
            }}
          >
            <Logo3D className="w-full h-full" />
          </div>
        </div>
      </div>
    </>
  );
}

// Main Component
export default function LandingHome() {
  return (
    <LandingLayout>
      <div className="relative overflow-visible">
        <LogoSection />
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SecuritySection />
        <LandingCTA />
      </div>
    </LandingLayout>
  );
}