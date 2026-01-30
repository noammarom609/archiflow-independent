import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle2,
  Send,
  MapPin
} from 'lucide-react';
import LandingLayout from '../components/landing/LandingLayout';
import { useLandingLanguage } from '../components/landing/LandingLanguageContext';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

// Hero Section
function ContactHero() {
  const { t } = useLandingLanguage();
  const contactT = t('contact');

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#F7F5F2] via-white to-white pt-8 sm:pt-12 pb-8 sm:pb-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] sm:w-[800px] h-[300px] sm:h-[600px] bg-gradient-radial from-[#984E39]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <motion.p 
          className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider mb-3 sm:mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {contactT.hero?.label}
        </motion.p>
        
        <motion.h1 
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-3 sm:mb-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {contactT.hero?.title}
        </motion.h1>

        <motion.p 
          className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-2"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {contactT.hero?.subtitle}
        </motion.p>
      </div>
    </section>
  );
}

// Contact Form
function ContactForm() {
  const { t } = useLandingLanguage();
  const contactT = t('contact');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <motion.div 
        className="text-center py-12"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{contactT.form?.success?.title}</h3>
        <p className="text-gray-600 mb-6">{contactT.form?.success?.subtitle}</p>
        <Button 
          variant="outline" 
          onClick={() => setIsSubmitted(false)}
        >
          {contactT.form?.success?.sendAnother}
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            {contactT.form?.fullName}
          </label>
          <Input
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            className="w-full h-10 sm:h-11"
          />
        </div>
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
            {contactT.form?.email}
          </label>
          <Input
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            className="w-full h-10 sm:h-11"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          {contactT.form?.subject}
        </label>
        <Input
          type="text"
          placeholder={contactT.form?.subjectPlaceholder}
          value={formData.subject}
          onChange={(e) => setFormData({...formData, subject: e.target.value})}
          required
          className="w-full h-10 sm:h-11"
        />
      </div>

      <div>
        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
          {contactT.form?.message}
        </label>
        <Textarea
          placeholder={contactT.form?.messagePlaceholder}
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          required
          rows={4}
          className="w-full text-sm sm:text-base"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-primary hover:bg-primary/90 text-white rounded-full py-5 sm:py-6 text-sm sm:text-base font-semibold shadow-lg shadow-primary/25 group"
      >
        <Send className="w-4 h-4 mx-2" />
        {contactT.form?.send}
      </Button>
    </form>
  );
}

// Contact Info Cards
function ContactInfo() {
  const { t } = useLandingLanguage();
  const contactT = t('contact');

  const infoIcons = [Mail, MessageSquare, Clock];
  const infoColors = [
    'bg-blue-100 text-blue-600',
    'bg-emerald-100 text-emerald-600',
    'bg-[#984E39]/10 text-[#984E39]'
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {contactT.info?.methods?.map((method, index) => {
        const Icon = infoIcons[index];
        return (
          <motion.div
            key={index}
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${infoColors[index]} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{method.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-1 sm:mb-2">{method.description}</p>
              <p className="text-primary font-medium text-sm sm:text-base break-all">{method.value}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Main Contact Section
function ContactSection() {
  const { t } = useLandingLanguage();
  const contactT = t('contact');

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm text-primary border-primary/30">
              {contactT.form?.badge}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              {contactT.form?.title}
            </h2>
            <ContactForm />
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 lg:mt-0"
          >
            <Badge variant="outline" className="mb-3 sm:mb-4 text-xs sm:text-sm text-primary border-primary/30">
              {contactT.info?.badge}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              {contactT.info?.title}
            </h2>
            <ContactInfo />

            {/* Office Location */}
            <motion.div
              className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gray-50 rounded-xl sm:rounded-2xl"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{contactT.info?.office?.title}</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                {contactT.info?.office?.location}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// FAQ Teaser
function FAQTeaser() {
  const { t } = useLandingLanguage();
  const contactT = t('contact');

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <motion.h2 
          className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {contactT.faqTeaser?.title}
        </motion.h2>
        <motion.p 
          className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {contactT.faqTeaser?.subtitle}
        </motion.p>
      </div>
    </section>
  );
}

// Main Component
export default function LandingContact() {
  return (
    <LandingLayout>
      <ContactHero />
      <ContactSection />
      <FAQTeaser />
    </LandingLayout>
  );
}