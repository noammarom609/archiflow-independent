import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTheme, THEMES } from '../components/providers/ThemeProvider';
import { useLanguage } from '../components/providers/LanguageProvider';
import { Palette, Globe, Check, RotateCcw, Sparkles } from 'lucide-react';
import { showSuccess } from '../components/utils/notifications';

export default function ThemeSettings() {
  const { currentTheme, customColors, changeTheme, updateCustomColors, resetTheme, getCurrentPrimaryColor } = useTheme();
  const { language, changeLanguage, t, isRTL } = useLanguage();
  
  // Initialize custom color from current state
  const [customColor, setCustomColor] = useState(getCurrentPrimaryColor());
  
  // Update custom color input when theme changes
  useEffect(() => {
    setCustomColor(getCurrentPrimaryColor());
  }, [currentTheme, getCurrentPrimaryColor]);

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
    showSuccess(t('theme.themeChanged'));
  };

  const handleLanguageChange = (lang) => {
    changeLanguage(lang);
    showSuccess(lang === 'he' ? t('language.changedToHebrew') : t('language.changedToEnglish'));
  };

  const handleCustomColorApply = () => {
    updateCustomColors({ primary: customColor });
    showSuccess(t('theme.customColorApplied'));
  };

  const handleReset = () => {
    resetTheme();
    setCustomColor(THEMES.terracotta.primary);
    showSuccess(t('theme.resetComplete'));
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // THEME PRESETS - Dynamically built from THEMES constant
  // ═══════════════════════════════════════════════════════════════════════════
  const organicThemePresets = Object.values(THEMES).map(theme => ({
    name: theme.name,
    label: theme.name === 'terracotta' ? `${theme.label} (ברירת מחדל)` : theme.label,
    preview: theme.primary,
  }));
  
  // Check if custom color is currently active (not a preset theme)
  const isCustomColorActive = customColors.primary && 
    !Object.values(THEMES).some(t => t.primary.toLowerCase() === customColors.primary.toLowerCase());

  return (
    <div className="min-h-screen bg-background p-8 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="mb-12 border-b border-border pb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center shadow-organic">
              <Palette className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-light text-foreground tracking-tight">{t('theme.title')}</h1>
              <p className="text-muted-foreground font-light text-lg">{t('theme.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Theme Settings */}
          <Card className="border-border shadow-organic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Palette className="w-5 h-5 text-primary" />
                {t('theme.themes')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-4 block text-foreground">{t('theme.selectTheme')}</Label>
                <div className="grid grid-cols-2 gap-4">
                  {organicThemePresets.map((theme) => {
                    const isActive = currentTheme === theme.name && !isCustomColorActive;
                    return (
                      <motion.button
                        key={theme.name}
                        onClick={() => handleThemeChange(theme.name)}
                        className={`
                          p-5 rounded-xl border-2 transition-all text-right group
                          ${isActive 
                            ? 'border-primary bg-primary/5 shadow-organic' 
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                        aria-label={`בחר ערכת נושא ${theme.label}`}
                        aria-pressed={isActive}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-foreground">{theme.label}</span>
                          {isActive && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div 
                          className="w-full h-10 rounded-lg shadow-organic transition-transform group-hover:scale-105" 
                          style={{ backgroundColor: theme.preview }}
                          aria-hidden="true"
                        />
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <Label htmlFor="custom-color" className="mb-3 block text-foreground">
                  {t('theme.customColor')}
                </Label>
                <div className="flex gap-3">
                  <Input
                    id="custom-color"
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-20 h-12 cursor-pointer rounded-xl border-border"
                    aria-label={t('theme.customColor')}
                  />
                  <Input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="flex-1 border-border bg-card"
                    placeholder="#984E39"
                    aria-label={t('theme.customColor')}
                  />
                  <Button 
                    onClick={handleCustomColorApply}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-organic"
                  >
                    {t('common.apply')}
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleReset}
                className={`w-full border-border text-muted-foreground hover:text-foreground hover:bg-muted ${isRTL ? '' : ''}`}
              >
                <RotateCcw className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('common.reset')}
              </Button>
            </CardContent>
          </Card>

          {/* Language Settings */}
          <Card className="border-border shadow-organic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Globe className="w-5 h-5 text-primary" />
                {t('language.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-4 block text-foreground">{t('language.selectLanguage')}</Label>
                <div className="space-y-4">
                  <motion.button
                    onClick={() => handleLanguageChange('he')}
                    className={`
                      w-full p-5 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'}
                      ${language === 'he' 
                        ? 'border-primary bg-primary/5 shadow-organic' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                    aria-label={t('language.hebrew')}
                    aria-pressed={language === 'he'}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">🇮🇱</span>
                        <div>
                          <div className="font-semibold text-foreground">{t('language.hebrew')}</div>
                          <div className="text-sm text-muted-foreground">Hebrew - RTL</div>
                        </div>
                      </div>
                      {language === 'he' && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={() => handleLanguageChange('en')}
                    className={`
                      w-full p-5 rounded-xl border-2 transition-all ${isRTL ? 'text-right' : 'text-left'}
                      ${language === 'en' 
                        ? 'border-primary bg-primary/5 shadow-organic' 
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                    aria-label={t('language.english')}
                    aria-pressed={language === 'en'}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">🇺🇸</span>
                        <div>
                          <div className="font-semibold text-foreground">{t('language.english')}</div>
                          <div className="text-sm text-muted-foreground">English - LTR</div>
                        </div>
                      </div>
                      {language === 'en' && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </motion.button>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h4 className="font-semibold text-foreground mb-4">{t('language.info')}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">{t('language.currentLanguage')}</span>
                    <span className="font-semibold text-foreground">
                      {language === 'he' ? t('language.hebrew') : t('language.english')}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">{t('language.direction')}</span>
                    <span className="font-semibold text-foreground">
                      {isRTL ? t('language.rtl') : t('language.ltr')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview - Dynamic Color Palette */}
          <Card className="lg:col-span-2 border-border shadow-organic">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                {t('theme.preview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Current Active Theme Highlight */}
              <div className="mb-6 p-4 rounded-xl border-2 border-primary/30 bg-primary/5">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-xl shadow-organic-lg transition-all duration-300"
                    style={{ backgroundColor: getCurrentPrimaryColor() }}
                  />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('theme.activeTheme')}</p>
                    <p className="text-xl font-semibold text-foreground">
                      {isCustomColorActive 
                        ? t('theme.customColorActive') 
                        : THEMES[currentTheme]?.label || 'טרקוטה'}
                    </p>
                    <p className="text-sm font-mono text-muted-foreground">
                      {getCurrentPrimaryColor()}
                    </p>
                  </div>
                </div>
              </div>

              {/* All Theme Colors Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {organicThemePresets.map((theme) => {
                  const isActive = currentTheme === theme.name && !isCustomColorActive;
                  return (
                    <motion.div 
                      key={theme.name}
                      className={`p-6 rounded-xl shadow-organic relative overflow-hidden transition-all duration-300 ${
                        isActive ? 'ring-2 ring-offset-2 ring-primary' : ''
                      }`}
                      style={{ backgroundColor: theme.preview }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isActive && (
                        <div className="absolute top-2 left-2 bg-white/90 rounded-full p-1">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div className="text-white font-semibold mb-1">{theme.label.replace(' (ברירת מחדל)', '')}</div>
                      <div className="text-white text-sm opacity-80 font-mono">{theme.preview}</div>
                    </motion.div>
                  );
                })}
              </div>
              
              {/* Custom Color Preview (if active) */}
              {isCustomColorActive && (
                <motion.div 
                  className="mt-4 p-6 rounded-xl shadow-organic-lg ring-2 ring-offset-2 ring-primary relative overflow-hidden"
                  style={{ backgroundColor: customColors.primary }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} bg-white/90 rounded-full p-1`}>
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-white font-semibold mb-1">{t('theme.customColorActive')}</div>
                  <div className="text-white text-sm opacity-80 font-mono">{customColors.primary}</div>
                </motion.div>
              )}
              
              {/* Typography Preview */}
              <div className="mt-8 pt-6 border-t border-border">
                <h4 className="font-semibold text-foreground mb-4">{t('theme.typography')}</h4>
                <div className="space-y-3">
                  <p className="text-3xl font-light text-foreground">
                    {isRTL ? 'כותרת ראשית - Font Light' : 'Main Heading - Font Light'}
                  </p>
                  <p className="text-xl font-medium text-primary">
                    {isRTL ? 'כותרת משנית בצבע ראשי' : 'Secondary Heading in Primary Color'}
                  </p>
                  <p className="text-base text-muted-foreground">
                    {isRTL 
                      ? 'טקסט גוף - Font Regular. זהו טקסט לדוגמה המציג את הפונט העברי Heebo בגודל רגיל.'
                      : 'Body text - Font Regular. This is sample text showing the Heebo font at regular size.'}
                  </p>
                </div>
              </div>

              {/* Live UI Elements Preview */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-foreground mb-4">{t('theme.exampleElements')}</h4>
                <div className="flex flex-wrap gap-4">
                  <Button>{t('theme.primaryButton')}</Button>
                  <Button variant="outline">{t('theme.secondaryButton')}</Button>
                  <Button variant="ghost">{t('theme.ghostButton')}</Button>
                  <div className="px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium">
                    {t('theme.primaryTag')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}