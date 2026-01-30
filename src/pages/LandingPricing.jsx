import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowRight, 
  ArrowLeft,
  Clock, 
  BarChart3, 
  TrendingUp,
  Calculator,
  Zap,
  Shield,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import LandingLayout from '../components/landing/LandingLayout';
import LandingCTA from '../components/landing/LandingCTA';
import { useLandingLanguage } from '../components/landing/LandingLanguageContext';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

// Hero Section
function PricingHero() {
  const { t } = useLandingLanguage();
  const pricingT = t('pricing');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F5F2] via-white to-white pt-8 sm:pt-12 pb-8 sm:pb-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[300px] sm:h-[600px] bg-gradient-radial from-[#984E39]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="outline" className="mb-4 sm:mb-6 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium border-[#984E39]/30 text-[#984E39] bg-[#984E39]/5">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
            {pricingT.hero?.badge}
          </Badge>
        </motion.div>

        <motion.h1 
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-3 sm:mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {pricingT.hero?.title}
        </motion.h1>

        <motion.p 
          className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {pricingT.hero?.subtitle}
        </motion.p>
      </div>
    </section>
  );
}

// Pricing Card Section
function PricingCard() {
  const { t, isRTL } = useLandingLanguage();
  const pricingT = t('pricing');
  const [billingCycle, setBillingCycle] = useState('monthly');

  const featureIcons = [BarChart3, TrendingUp, Calculator, Zap, Shield];

  const price = billingCycle === 'monthly' ? '₪199' : '₪149';
  const originalPrice = billingCycle === 'monthly' ? '₪299' : '₪199';
  const saveText = billingCycle === 'monthly' 
    ? pricingT.card?.saveMonthly 
    : pricingT.card?.saveYearly;

  return (
    <section className="py-8 sm:py-12 bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <motion.div 
          className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xl p-5 sm:p-6 md:p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Trial Badge */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <Badge variant="outline" className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium border-[#984E39]/30 text-[#984E39] bg-[#984E39]/5">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
              {pricingT.card?.trialBadge}
            </Badge>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="bg-gray-100 rounded-full p-1 flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  billingCycle === 'monthly' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {pricingT.card?.monthly}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  billingCycle === 'yearly' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {pricingT.card?.yearly}
              </button>
            </div>
          </div>

          {/* Launch Sale Badge */}
          <div className="flex justify-center mb-3 sm:mb-4">
            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 px-3 sm:px-4 py-1 text-xs sm:text-sm">
              {pricingT.card?.launchSale}
            </Badge>
          </div>

          {/* Price */}
          <div className="text-center mb-2">
            <span className="text-xl sm:text-2xl text-gray-400 line-through mx-1 sm:mx-2">{originalPrice}</span>
            <span className="text-4xl sm:text-5xl font-bold text-gray-900">{price}</span>
            <span className="text-gray-500 text-base sm:text-lg">{pricingT.card?.perMonth}</span>
          </div>
          <p className="text-center text-emerald-600 font-medium mb-2 text-sm sm:text-base">
            {saveText}
          </p>
          <p className="text-center text-gray-500 text-xs sm:text-sm mb-6 sm:mb-8">
            {pricingT.card?.afterTrial}
          </p>

          {/* Key Features */}
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            {pricingT.card?.features?.map((feature, index) => {
              const Icon = featureIcons[index];
              return (
                <div key={index} className="flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#984E39]/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-[#984E39]" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{feature.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-500">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* What's Included */}
          <div className="mb-6 sm:mb-8">
            <h4 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">{pricingT.card?.included?.title}</h4>
            <div className="space-y-2 sm:space-y-3">
              {pricingT.card?.included?.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-2 sm:gap-3">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <Button
            asChild
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-5 sm:py-6 text-sm sm:text-base font-semibold shadow-lg shadow-primary/25 group"
          >
            <Link to={createPageUrl('Dashboard')} className="flex items-center justify-center gap-2">
              {pricingT.card?.cta}
              {isRTL ? (
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </Link>
          </Button>

          <p className="text-center text-gray-500 text-xs sm:text-sm mt-3 sm:mt-4">
            {pricingT.card?.noCreditCard}
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// FAQ Section
function FAQSection() {
  const { t } = useLandingLanguage();
  const pricingT = t('pricing');

  return (
    <section className="py-12 sm:py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.p 
          className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-2 sm:mb-3 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {pricingT.faq?.label}
        </motion.p>
        <motion.h2 
          className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-8 sm:mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {pricingT.faq?.title}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {pricingT.faq?.items?.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-white border border-gray-100 rounded-lg sm:rounded-xl px-4 sm:px-6 shadow-sm"
              >
                <AccordionTrigger className="text-start font-semibold text-gray-900 hover:no-underline py-4 sm:py-5 text-sm sm:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4 sm:pb-5 text-sm sm:text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}

// Main Component
export default function LandingPricing() {
  return (
    <LandingLayout>
      <PricingHero />
      <PricingCard />
      <FAQSection />
      <LandingCTA />
    </LandingLayout>
  );
}