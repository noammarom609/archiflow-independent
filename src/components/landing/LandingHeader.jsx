import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';
import { Menu, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLandingLanguage } from './LandingLanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { name: 'LandingHome', key: 'home' },
  { name: 'LandingAbout', key: 'about' },
  { name: 'LandingPricing', key: 'pricing' },
  { name: 'LandingBlog', key: 'blog' },
  { name: 'LandingContact', key: 'contact' },
];

export default function LandingHeader() {
  const { t, isRTL } = useLandingLanguage();
  const headerT = t('header');
  const { user, isAuthenticated, navigateToLogin } = useAuth();

  const isLoggedIn = isAuthenticated;
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (pageName) => {
    return location.pathname.includes(pageName.toLowerCase().replace('landing', ''));
  };

  return (
    <>
      <motion.header
        dir={isRTL ? 'rtl' : 'ltr'}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' 
            : 'bg-gradient-to-b from-[#F7F5F2] to-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <Link to={createPageUrl('LandingHome')} className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden bg-[#F7F5F2] shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img 
                  src="/archiflow-logoV2.png" 
                  alt="ArchiFlow" 
                  className="w-full h-full object-cover"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">ArchiFlow</span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium tracking-wider uppercase hidden xs:block">
                  Architecture OS
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={createPageUrl(item.name)}
                  className={`text-sm font-medium transition-colors relative group ${
                    isActive(item.name)
                      ? 'text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {headerT.nav?.[item.key] || item.key}
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isActive(item.name) ? 1 : 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                </Link>
              ))}
            </nav>

            {/* Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              <LanguageSwitcher />
              {isLoggedIn ? (
                <Button
                  asChild
                  className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-lg shadow-primary/25"
                >
                  <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
                    {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                    {headerT.backToDashboard}
                  </Link>
                </Button>
              ) : (
                <>
                  <button
                    onClick={navigateToLogin}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {headerT.signIn}
                  </button>
                  <Button
                    asChild
                    className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-lg shadow-primary/25"
                  >
                    <Link to={createPageUrl('Dashboard')}>
                      {headerT.getStarted}
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="תפריט"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div 
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="absolute top-16 sm:top-20 left-3 right-3 sm:left-4 sm:right-4 bg-white rounded-2xl shadow-xl p-4 sm:p-6 max-h-[80vh] overflow-y-auto"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
            >
              <nav className="flex flex-col gap-1" dir={isRTL ? 'rtl' : 'ltr'}>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.name)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-base font-medium py-3 px-3 rounded-xl transition-colors ${
                      isActive(item.name)
                        ? 'text-primary bg-primary/5'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {headerT.nav?.[item.key] || item.key}
                  </Link>
                ))}
                <hr className="my-3" />
                <div className="py-2">
                  <LanguageSwitcher className="justify-center" />
                </div>
                <hr className="my-3" />
                {isLoggedIn ? (
                  <Button
                    asChild
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl h-12 mt-2"
                  >
                    <Link to={createPageUrl('Dashboard')} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2">
                      {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                      {headerT.backToDashboard}
                    </Link>
                  </Button>
                ) : (
                  <div className="space-y-2 mt-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigateToLogin();
                      }}
                      className="w-full text-base font-medium text-gray-600 py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      {headerT.signIn}
                    </button>
                    <Button
                      asChild
                      className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl h-12"
                    >
                      <Link to={createPageUrl('Dashboard')} onClick={() => setMobileMenuOpen(false)}>
                        {headerT.getStarted}
                      </Link>
                    </Button>
                  </div>
                )}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}