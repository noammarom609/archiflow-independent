import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Sparkles, Loader2, Wand2, RefreshCw, FileText, Lightbulb, Settings2 } from 'lucide-react';
import { archiflow } from '@/api/archiflow';

// Context definitions for smart AI generation
const contextDefinitions = {
  heading: {
    label: 'כותרת',
    contexts: [
      { value: 'proposal_title', label: 'כותרת הצעת מחיר', description: 'כותרת ראשית להצעה' },
      { value: 'section_title', label: 'כותרת סעיף', description: 'כותרת לחלק בהצעה' },
      { value: 'company_slogan', label: 'סלוגן חברה', description: 'משפט שיווקי קצר' },
    ]
  },
  intro: {
    label: 'פתיח',
    contexts: [
      { value: 'first_meeting', label: 'לאחר פגישה ראשונה', description: 'פתיח ללקוח חדש שנפגשתם איתו' },
      { value: 'returning_client', label: 'לקוח חוזר', description: 'פתיח ללקוח קיים' },
      { value: 'referral', label: 'הפניה', description: 'פתיח ללקוח שהגיע בהמלצה' },
      { value: 'cold_proposal', label: 'הצעה יזומה', description: 'פתיח ללקוח שלא היה קשר קודם' },
    ]
  },
  description: {
    label: 'תיאור',
    contexts: [
      { value: 'interior_design', label: 'עיצוב פנים', description: 'שירותי עיצוב פנים' },
      { value: 'architecture', label: 'אדריכלות', description: 'שירותי אדריכלות' },
      { value: 'renovation', label: 'שיפוץ', description: 'עבודות שיפוץ' },
      { value: 'consulting', label: 'ייעוץ', description: 'שירותי ייעוץ מקצועי' },
      { value: 'project_management', label: 'ניהול פרויקט', description: 'ניהול וליווי פרויקט' },
    ]
  },
  terms: {
    label: 'תנאים',
    contexts: [
      { value: 'payment_schedule', label: 'לוח תשלומים', description: 'פריסת תשלומים' },
      { value: 'project_timeline', label: 'לוחות זמנים', description: 'זמני ביצוע ואבני דרך' },
      { value: 'cancellation', label: 'ביטול והחזרים', description: 'תנאי ביטול' },
      { value: 'liability', label: 'אחריות', description: 'תנאי אחריות' },
      { value: 'general_terms', label: 'תנאים כלליים', description: 'תנאים סטנדרטיים' },
    ]
  },
  summary: {
    label: 'סיכום',
    contexts: [
      { value: 'call_to_action', label: 'קריאה לפעולה', description: 'סיכום עם דחיפה לסגירה' },
      { value: 'next_steps', label: 'צעדים הבאים', description: 'מה קורה אחרי אישור' },
      { value: 'value_summary', label: 'סיכום ערך', description: 'הדגשת היתרונות' },
    ]
  },
  text: {
    label: 'טקסט',
    contexts: [
      { value: 'about_us', label: 'אודותינו', description: 'תיאור החברה' },
      { value: 'methodology', label: 'מתודולוגיה', description: 'שיטת העבודה' },
      { value: 'portfolio_intro', label: 'הקדמה לתיק עבודות', description: 'הצגת עבודות קודמות' },
      { value: 'free_text', label: 'טקסט חופשי', description: 'כתיבה לפי הנחיות' },
    ]
  },
};

/**
 * AI Content Generator Button - כפתור קטן ליצירת תוכן AI
 */
export function AIGenerateButton({ onGenerate, fieldType = 'text', disabled = false, sectionTitle = '' }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        <Sparkles className="w-3 h-3" />
        צור עם AI
      </Button>
      
      <AIContentDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onGenerate={(content) => {
          onGenerate(content);
          setIsOpen(false);
        }}
        fieldType={fieldType}
        sectionTitle={sectionTitle}
      />
    </>
  );
}

/**
 * AI Content Dialog - דיאלוג מתקדם ליצירת תוכן
 */
function AIContentDialog({ isOpen, onClose, onGenerate, fieldType, sectionTitle = '' }) {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('professional');
  const [context, setContext] = useState('');
  const [styleExample, setStyleExample] = useState('');
  const [useStyleExample, setUseStyleExample] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('quick');

  const fieldConfig = contextDefinitions[fieldType] || contextDefinitions.text;

  const toneOptions = [
    { value: 'professional', label: 'מקצועי', description: 'ניסוח עניני וברור' },
    { value: 'friendly', label: 'ידידותי', description: 'טון חם ונגיש' },
    { value: 'formal', label: 'רשמי', description: 'שפה מכובדת ומדויקת' },
    { value: 'persuasive', label: 'משכנע', description: 'דגש על יתרונות ופעולה' },
    { value: 'creative', label: 'יצירתי', description: 'ניסוח מקורי ובולט' },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedContent('');
    
    try {
      const systemPrompt = buildAdvancedPrompt(fieldType, tone, context, styleExample, useStyleExample);
      const userPrompt = prompt.trim() || getAutoPrompt(fieldType, context);
      
      const result = await archiflow.integrations.Core.InvokeLLM({
        prompt: `${systemPrompt}\n\nההנחיות מהמשתמש: ${userPrompt}`,
        response_json_schema: {
          type: 'object',
          properties: {
            content: { type: 'string', description: 'התוכן שנוצר בעברית' }
          },
          required: ['content']
        }
      });
      
      setGeneratedContent(result.content || '');
    } catch (error) {
      console.error('AI generation error:', error);
      setGeneratedContent('שגיאה ביצירת התוכן. נסה שוב.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseContent = () => {
    if (generatedContent) {
      onGenerate(generatedContent);
    }
  };

  const handleClose = () => {
    setPrompt('');
    setGeneratedContent('');
    setContext('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            יצירת {fieldConfig.label} עם AI
          </DialogTitle>
          <DialogDescription>
            בחר הקשר מדויק וה-AI ייצור תוכן רלוונטי ומותאם
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="w-full">
            <TabsTrigger value="quick" className="flex-1 gap-1 text-xs">
              <Wand2 className="w-3.5 h-3.5" />יצירה מהירה
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1 gap-1 text-xs">
              <Settings2 className="w-3.5 h-3.5" />הגדרות מתקדמות
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4 mt-4">
            {/* Context Selection */}
            <div>
              <Label className="text-sm flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                הקשר התוכן
              </Label>
              <Select value={context} onValueChange={setContext}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר הקשר..." />
                </SelectTrigger>
                <SelectContent>
                  {fieldConfig.contexts.map(ctx => (
                    <SelectItem key={ctx.value} value={ctx.value}>
                      <div className="flex flex-col">
                        <span>{ctx.label}</span>
                        <span className="text-xs text-slate-500">{ctx.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tone Selection */}
            <div>
              <Label className="text-sm">טון הכתיבה</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {toneOptions.slice(0, 3).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setTone(opt.value)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      tone === opt.value 
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Prompt */}
            <div>
              <Label className="text-sm">הנחיות נוספות (אופציונלי)</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={getPlaceholder(fieldType, context)}
                className="mt-1 min-h-[60px]"
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4 mt-4">
            {/* All Tones */}
            <div>
              <Label className="text-sm">טון הכתיבה</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-xs text-slate-500">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style Example */}
            <div className="border border-slate-200 rounded-lg p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  למד מדוגמה
                </Label>
                <Switch checked={useStyleExample} onCheckedChange={setUseStyleExample} />
              </div>
              {useStyleExample && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">הדבק טקסט שאתה אוהב וה-AI ילמד את הסגנון</p>
                  <Textarea
                    value={styleExample}
                    onChange={(e) => setStyleExample(e.target.value)}
                    placeholder="הדבק כאן דוגמה לטקסט בסגנון שאתה רוצה..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
              )}
            </div>

            {/* Context & Prompt */}
            <div>
              <Label className="text-sm">הקשר התוכן</Label>
              <Select value={context} onValueChange={setContext}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="בחר הקשר..." />
                </SelectTrigger>
                <SelectContent>
                  {fieldConfig.contexts.map(ctx => (
                    <SelectItem key={ctx.value} value={ctx.value}>{ctx.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">הנחיות מפורטות</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="תאר בפירוט מה אתה רוצה..."
                className="mt-1 min-h-[80px]"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Generate / Results */}
        <div className="space-y-3 pt-2">
          {!generatedContent ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              {isGenerating ? 'יוצר תוכן...' : 'צור תוכן'}
            </Button>
          ) : (
            <>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 max-h-48 overflow-y-auto">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{generatedContent}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerate} disabled={isGenerating} className="flex-1 gap-2">
                  <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  צור מחדש
                </Button>
                <Button onClick={handleUseContent} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Sparkles className="w-4 h-4" />
                  השתמש בתוכן
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * AI Image Generator - יצירת תמונות AI
 */
export function AIImageGenerator({ onImageGenerated, currentImageUrl }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setGeneratedUrl('');
    
    try {
      const result = await archiflow.integrations.Core.GenerateImage({
        prompt: `Professional business image for a proposal document, high quality, clean design: ${prompt}`,
        existing_image_urls: currentImageUrl ? [currentImageUrl] : undefined
      });
      
      setGeneratedUrl(result.url || '');
    } catch (error) {
      console.error('AI image generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseImage = () => {
    if (generatedUrl) {
      onImageGenerated(generatedUrl);
      setIsOpen(false);
      setPrompt('');
      setGeneratedUrl('');
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="w-4 h-4" />
        צור תמונה עם AI
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              יצירת תמונה עם AI
            </DialogTitle>
            <DialogDescription>
              תאר את התמונה שאתה רוצה וה-AI ייצור אותה
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm">תאר את התמונה</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="לדוגמה: משרד אדריכלים מודרני עם שולחן עבודה גדול, חלונות גדולים ואור טבעי"
                className="mt-1 min-h-[80px]"
              />
            </div>

            {!generatedUrl && (
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                {isGenerating ? 'יוצר תמונה... (10-15 שניות)' : 'צור תמונה'}
              </Button>
            )}

            {generatedUrl && (
              <div className="space-y-3">
                <Label className="text-sm">תמונה שנוצרה:</Label>
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <img src={generatedUrl} alt="AI Generated" className="w-full h-48 object-cover" />
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setGeneratedUrl(''); handleGenerate(); }} disabled={isGenerating} className="flex-1 gap-2">
                    <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    צור מחדש
                  </Button>
                  <Button onClick={handleUseImage} className="flex-1 gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Sparkles className="w-4 h-4" />
                    השתמש בתמונה
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper functions
function buildAdvancedPrompt(fieldType, tone, context, styleExample, useStyleExample) {
  const toneInstructions = {
    professional: 'כתוב בטון מקצועי ועניני. משפטים ברורים וממוקדים.',
    friendly: 'כתוב בטון ידידותי וחם. נגיש ומזמין.',
    formal: 'כתוב בטון רשמי ומכובד. שפה מדויקת ומכבדת.',
    persuasive: 'כתוב בטון משכנע. הדגש יתרונות והניע לפעולה.',
    creative: 'כתוב בסגנון יצירתי ומקורי. בלוט מהרגיל.',
  };

  const contextInstructions = {
    // Heading contexts
    proposal_title: 'צור כותרת ראשית מרשימה להצעת מחיר. 5-8 מילים.',
    section_title: 'צור כותרת קצרה וברורה לסעיף. 3-5 מילים.',
    company_slogan: 'צור סלוגן קצר וקליט. 4-7 מילים.',
    // Intro contexts
    first_meeting: 'פתיח ללקוח חדש שכבר נפגשתם. התייחס לפגישה ולהתרשמות החיובית.',
    returning_client: 'פתיח ללקוח קיים. הזכר את שיתוף הפעולה הקודם.',
    referral: 'פתיח ללקוח שהגיע בהמלצה. הזכר את הממליץ והודה.',
    cold_proposal: 'פתיח להצעה יזומה. הצג את עצמך ואת הערך שאתה מציע.',
    // Description contexts
    interior_design: 'תאר שירותי עיצוב פנים מקצועיים. התמקד בתהליך העבודה והתוצאה.',
    architecture: 'תאר שירותי אדריכלות. הדגש תכנון, חדשנות ופונקציונליות.',
    renovation: 'תאר עבודות שיפוץ. התמקד באיכות הביצוע ולוחות הזמנים.',
    consulting: 'תאר שירותי ייעוץ. הדגש את המומחיות והערך המוסף.',
    project_management: 'תאר ניהול פרויקט. הדגש פיקוח, תיאום ושליטה בתקציב.',
    // Terms contexts
    payment_schedule: 'הצג לוח תשלומים ברור. פרט את השלבים ואחוזי התשלום.',
    project_timeline: 'פרט לוחות זמנים ואבני דרך. היה ספציפי ומציאותי.',
    cancellation: 'נסח תנאי ביטול הוגנים. כלול דמי ביטול ומועדים.',
    liability: 'נסח תנאי אחריות ברורים. פרט מה כלול ומה לא.',
    general_terms: 'נסח תנאים כלליים סטנדרטיים להצעה.',
    // Summary contexts
    call_to_action: 'סיכום עם קריאה ברורה לפעולה. עודד לאשר את ההצעה.',
    next_steps: 'פרט מה קורה לאחר אישור ההצעה. היה ברור ומרגיע.',
    value_summary: 'סכם את היתרונות והערך. הדגש מה הלקוח מרוויח.',
    // Text contexts
    about_us: 'כתוב על החברה. הדגש ניסיון, ערכים והישגים.',
    methodology: 'תאר את שיטת העבודה. הדגש מקצועיות ותהליך מסודר.',
    portfolio_intro: 'הקדמה לתיק עבודות. הדגש מגוון וקשר לפרויקט הנוכחי.',
    free_text: 'כתוב טקסט חופשי בהתאם להנחיות המשתמש.',
  };

  let systemPrompt = `אתה כותב תוכן מקצועי להצעות מחיר בעברית.
${toneInstructions[tone] || toneInstructions.professional}
${context && contextInstructions[context] ? contextInstructions[context] : ''}
הקפד על עברית תקנית, ניסוח ברור ותוכן רלוונטי.`;

  if (useStyleExample && styleExample.trim()) {
    systemPrompt += `

דוגמה לסגנון הכתיבה הרצוי (למד מהסגנון והטון, לא מהתוכן):
"""
${styleExample.trim()}
"""

כתוב בסגנון דומה לדוגמה - אותו טון, אותה מבניות משפטים, אותה רמת פורמליות.`;
  }

  return systemPrompt;
}

function getAutoPrompt(fieldType, context) {
  const autoPrompts = {
    proposal_title: 'צור כותרת מרשימה להצעת מחיר לפרויקט עיצוב פנים',
    section_title: 'צור כותרת לסעיף בהצעת מחיר',
    company_slogan: 'צור סלוגן לסטודיו לעיצוב פנים ואדריכלות',
    first_meeting: 'כתוב פתיח להצעת מחיר לאחר פגישה ראשונה מוצלחת',
    returning_client: 'כתוב פתיח להצעת מחיר ללקוח חוזר',
    referral: 'כתוב פתיח להצעת מחיר ללקוח שהגיע בהמלצה',
    cold_proposal: 'כתוב פתיח להצעת מחיר יזומה',
    interior_design: 'תאר שירותי עיצוב פנים מקיפים',
    architecture: 'תאר שירותי אדריכלות מקצועיים',
    renovation: 'תאר שירותי שיפוץ ובנייה',
    consulting: 'תאר שירותי ייעוץ אדריכלי',
    project_management: 'תאר שירותי ניהול וליווי פרויקט',
    payment_schedule: 'צור לוח תשלומים סטנדרטי לפרויקט',
    project_timeline: 'צור לוח זמנים לפרויקט עיצוב',
    cancellation: 'נסח תנאי ביטול הוגנים',
    liability: 'נסח סעיף אחריות',
    general_terms: 'נסח תנאים כלליים להצעה',
    call_to_action: 'כתוב סיכום עם קריאה לפעולה',
    next_steps: 'פרט את הצעדים הבאים לאחר אישור',
    value_summary: 'סכם את היתרונות של ההצעה',
    about_us: 'כתוב על הסטודיו והניסיון שלנו',
    methodology: 'תאר את שיטת העבודה שלנו',
    portfolio_intro: 'כתוב הקדמה לתיק העבודות',
    free_text: 'כתוב טקסט מקצועי',
  };
  return autoPrompts[context] || autoPrompts.free_text;
}

function getPlaceholder(fieldType, context) {
  if (context) {
    return 'ה-AI יכתוב לפי ההקשר שבחרת. הוסף פרטים ספציפיים אם תרצה...';
  }
  const placeholders = {
    heading: 'לדוגמה: הצעת מחיר לעיצוב דירת 4 חדרים בתל אביב',
    intro: 'לדוגמה: הצעה לשיפוץ מטבח ללקוח פרטי',
    summary: 'לדוגמה: סיכום הצעה לפרויקט עיצוב משרדים',
    description: 'לדוגמה: תיאור שירותי תכנון אדריכלי מלא',
    terms: 'לדוגמה: תנאי תשלום ל-3 תשלומים',
    text: 'תאר את התוכן שאתה רוצה...',
  };
  return placeholders[fieldType] || placeholders.text;
}