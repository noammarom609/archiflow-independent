import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { useLandingLanguage } from './LandingLanguageContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const productLinks = [
  { name: 'LandingAbout', key: 'about' },
  { name: 'LandingPricing', key: 'pricing' },
  { name: 'LandingBlog', key: 'blog' },
  { name: 'LandingContact', key: 'contact' },
];

export default function LandingFooter() {
  const { t, isRTL } = useLandingLanguage();
  const footerT = t('footer');
  const headerT = t('header');
  const navigate = useNavigate();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleHiddenAdminLogin = () => {
    setShowPinDialog(true);
    setPin('');
    setError('');
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setError('יש להזין קוד בן 4 ספרות');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // PIN -> role for E2E / dev bypass (docs/QA_CHECKLIST.md)
    const PIN_ROLES = {
      '2189': { app_role: 'super_admin', role: 'admin', email: 'admin@archiflow.io', full_name: 'Super Admin' },
      '2188': { app_role: 'architect', role: 'user', email: 'architect@archiflow.io', full_name: 'אדריכל בדיקה' },
      '2187': { app_role: 'client', role: 'user', email: 'client@archiflow.io', full_name: 'לקוח בדיקה' },
      '2186': { app_role: 'consultant', role: 'user', email: 'consultant@archiflow.io', full_name: 'יועץ בדיקה' },
      '2185': { app_role: 'contractor', role: 'user', email: 'contractor@archiflow.io', full_name: 'קבלן בדיקה' },
    };
    
    const roleData = PIN_ROLES[pin];
    if (roleData) {
      console.log('[AdminBypass] PIN correct, role:', roleData.app_role);
      
      // Generate a valid UUID v4 for testing (deterministic per role for consistency)
      const roleUUIDs = {
        'super_admin': '00000000-0000-4000-a000-000000000001',
        'architect': '00000000-0000-4000-a000-000000000002',
        'client': '00000000-0000-4000-a000-000000000003',
        'consultant': '00000000-0000-4000-a000-000000000004',
        'contractor': '00000000-0000-4000-a000-000000000005',
      };
      
      const bypassToken = `admin_bypass_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const bypassUser = {
        id: roleUUIDs[roleData.app_role] || '00000000-0000-4000-a000-000000000099',
        email: roleData.email,
        full_name: roleData.full_name,
        role: roleData.role,
        app_role: roleData.app_role,
        approval_status: 'approved',
        architect_id: roleUUIDs[roleData.app_role] || '00000000-0000-4000-a000-000000000099',
        architect_email: roleData.email,
      };
      
      localStorage.setItem('adminBypassToken', bypassToken);
      localStorage.setItem('adminBypassUser', JSON.stringify(bypassUser));
      
      setShowPinDialog(false);
      setLoading(false);
      navigate(createPageUrl('Dashboard'));
      window.location.reload();
    } else {
      console.log('[AdminBypass] Invalid PIN entered:', pin);
      setError('קוד שגוי');
      setLoading(false);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 sm:gap-3 mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden bg-[#F7F5F2] shadow-sm flex-shrink-0">
                <img 
                  src="/archiflow-logoV2.png" 
                  alt="ArchiFlow" 
                  className="w-full h-full object-cover"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">ArchiFlow</span>
                <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium tracking-wider uppercase">
                  Architecture OS
                </span>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm mb-4 sm:mb-6">
              {footerT.description}
            </p>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <a href="mailto:support@archiflow.io" className="text-sm hover:text-primary transition-colors break-all">
                support@archiflow.io
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">{footerT.product}</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={createPageUrl(link.name)}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {headerT.nav?.[link.key] || link.key}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">{footerT.legal}</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to={createPageUrl('LandingPrivacy')}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {footerT.privacyPolicy}
                </Link>
              </li>
              <li>
                <Link
                  to={createPageUrl('LandingTerms')}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {footerT.termsOfService}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            {/* Hidden admin login button - appears as a small dot (E2E: admin-bypass-trigger) */}
            <button
              data-testid="admin-bypass-trigger"
              onClick={handleHiddenAdminLogin}
              className="w-2 h-2 rounded-full bg-gray-200 hover:bg-gray-400 transition-colors opacity-30 hover:opacity-100"
              aria-label="Admin login"
            />
            <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-right">
              © {new Date().getFullYear()} {footerT.copyright}
            </p>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 text-center sm:text-left">
            {footerT.builtWith}
          </p>
        </div>
      </div>
      {/* Hidden PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="max-w-xs" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center">גישת מערכת</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Input
                data-testid="admin-bypass-pin-input"
                type={showPin ? "text" : "password"}
                maxLength={4}
                placeholder="הזן קוד PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                className="text-center text-2xl tracking-widest pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {/* Show entered PIN for debugging */}
            <p className="text-xs text-gray-400 text-center">
              קוד שהוזן: {pin || '----'}
            </p>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <Button
              data-testid="admin-bypass-submit"
              onClick={handlePinSubmit}
              disabled={loading || pin.length !== 4}
              className="w-full"
            >
              {loading ? 'מאמת...' : 'אישור'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}