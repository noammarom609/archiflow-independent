import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  HelpCircle,
  Mail,
  Phone,
  MessageCircle,
  Book,
  Video,
  FileText,
  Send,
  CheckCircle2,
  Lightbulb,
  Settings,
  Users,
  Calendar,
  FolderKanban,
  Mic,
  Palette,
  PenTool,
  DollarSign,
  LayoutGrid,
  Sparkles,
  Link2,
  Image,
  ClipboardList,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { showSuccess } from '../components/utils/notifications';
import { base44 } from '@/api/base44Client';
import PageHeader from '../components/layout/PageHeader';

const faqs = [
  {
    category: 'התחלה מהירה',
    icon: Lightbulb,
    questions: [
      {
        q: 'איך יוצרים פרויקט חדש?',
        a: 'לחץ על "פרויקט חדש" בדף הפרויקטים. מלא את פרטי הלקוח (שם, טלפון, אימייל), פרטי הפרויקט (שם, כתובת, סוג), ותקציב משוער. המערכת תיצור אוטומטית את כל שלבי הפרויקט ותפתח בשלב "שיחה ראשונה".',
      },
      {
        q: 'מה ההבדל בין תצוגת כרטיסיות לתצוגת רשימה?',
        a: 'בדף הפרויקטים יש שתי תצוגות: תצוגת כרטיסיות (Grid) מציגה כל פרויקט ככרטיס עם תמונה וסיכום, מתאימה לסקירה מהירה. תצוגת רשימה (List) מציגה טבלה מפורטת עם כל הפרטים, מתאימה לניהול כמויות גדולות.',
      },
      {
        q: 'איך מנווטים בין שלבי הפרויקט?',
        a: 'בעמוד הפרויקט, בצד ימין מופיעים כל השלבים בסרגל אנכי. לחץ על כל שלב כדי לעבור אליו. שלבים שהושלמו מסומנים בירוק, השלב הנוכחי מודגש, ושלבים עתידיים אפורים.',
      },
    ],
  },
  {
    category: 'שלבי הפרויקט',
    icon: FolderKanban,
    questions: [
      {
        q: 'מהם 10 שלבי הפרויקט במערכת?',
        a: '1. שיחה ראשונה - תיעוד שיחת טלפון ופגישה ראשונית\n2. הצעת מחיר - יצירה, שליחה ואישור הצעה\n3. מדידה - תיאום מדידה ותוכניות מצב קיים\n4. פרוגרמה וקונספט - הגדרת צרכים ולוח השראה\n5. גאנט - לוח זמנים ואבני דרך\n6. סקיצות - תכנון ראשוני ואישור\n7. הדמיות - הדמיות 3D ואישור\n8. תוכניות טכניות - סט תוכניות מלא\n9. ביצוע - ליווי הפרויקט בשטח\n10. סיום - מסירה ותיעוד',
      },
      {
        q: 'איך מעבירים פרויקט לשלב הבא?',
        a: 'כל שלב מכיל תת-שלבים שצריך להשלים. כשכל תת-השלבים הושלמו, השלב מסומן כ"הושלם" ותוכל לעבור לשלב הבא. חלק מהשלבים דורשים אישור לקוח (כמו הצעת מחיר, סקיצות, הדמיות).',
      },
      {
        q: 'מה קורה בשלב "שיחה ראשונה"?',
        a: 'שלב זה כולל שלושה תת-שלבים: 1) שיחת טלפון - תיעוד שיחה ראשונית, 2) פגישה פרונטלית - תיאום והקלטת פגישה, 3) כרטיס לקוח - מילוי פרטים מלאים. ניתן להקליט שיחות והמערכת תתמלל אותן אוטומטית עם AI.',
      },
    ],
  },
  {
    category: 'הצעות מחיר',
    icon: FileText,
    questions: [
      {
        q: 'איך יוצרים הצעת מחיר?',
        a: 'בשלב "הצעת מחיר" יש שלוש אפשרויות: 1) מתבנית - בחר תבנית מוכנה והתאם אותה, 2) מ-AI - המערכת תייצר הצעה אוטומטית לפי פרטי הפרויקט, 3) ידנית - צור הצעה מאפס. לאחר היצירה תוכל לערוך סעיפים, מחירים ותנאים.',
      },
      {
        q: 'מהן תבניות הצעות המחיר הזמינות?',
        a: 'המערכת כוללת 4 תבניות מובנות: 1) תכנון מלא - משרד/מעטפת (בנייה חדשה), 2) תכנון מלא - דירה/בית (בנייה חדשה), 3) תכנון מלא - משרד/מעטפת (שיפוץ), 4) תכנון מלא - דירה/בית (שיפוץ). כל תבנית כוללת סעיפים מותאמים לסוג הפרויקט.',
      },
      {
        q: 'איך שולחים הצעה ללקוח לאישור וחתימה?',
        a: 'לחץ על "שלח הצעה ללקוח" - תיפתח חלונית לשליחת מייל עם קישור ייעודי. הלקוח יקבל קישור ציבורי שבו הוא יכול לצפות בהצעה המלאה, להזין שם לחתימה, ולאשר דיגיטלית. החתימה נשמרת במערכת ומעדכנת את סטטוס הפרויקט אוטומטית.',
      },
      {
        q: 'איך מורידים PDF של הצעה חתומה?',
        a: 'לאחר שהלקוח חתם, יופיע כפתור "הורד PDF חתום". המערכת תחפש קובץ PDF שנשמר, ואם אין - תייצר PDF מהתצוגה הנוכחית. הקובץ יורד אוטומטית למחשב שלך.',
      },
    ],
  },
  {
    category: 'ספריית עיצוב ולוחות השראה',
    icon: Palette,
    questions: [
      {
        q: 'מה כוללת ספריית העיצוב?',
        a: 'הספרייה כוללת 4 סוגי תוכן: 1) נכסי עיצוב - תמונות רהיטים, חומרים, טקסטורות, 2) לוחות השראה (Moodboards) - לוחות ויזואליים לפרויקטים, 3) תבניות הצעות מחיר - לניהול תבניות, 4) פריטי תוכן - תמונות ומסמכים לשיתוף עם לקוחות.',
      },
      {
        q: 'איך יוצרים לוח השראה (Moodboard)?',
        a: 'לחץ על "לוח חדש" בלשונית "לוחות השראה". ייפתח עורך ויזואלי מתקדם שבו תוכל: לגרור תמונות מהספרייה, להוסיף טקסט וצבעים, לשנות גודל ומיקום אלמנטים, לבחור גודל לוח (A4, Full HD, Instagram ועוד). ניתן לייצא כתמונה או PDF.',
      },
      {
        q: 'איך העורך הויזואלי עובד?',
        a: 'העורך כולל: סרגל כלים עליון (Zoom, Undo/Redo, Export), פאנל שכבות בצד, תצוגת Minimap, Smart Guides ליישור אוטומטי, ובחירה מרובה עם Ctrl+גרירה. ניתן לבחור גודל לוח מוגדר מראש או מותאם אישית.',
      },
    ],
  },
  {
    category: 'הקלטות וניתוח AI',
    icon: Mic,
    questions: [
      {
        q: 'איך מקליטים פגישה עם לקוח?',
        a: 'בשלב "שיחה ראשונה" או בעמוד "הקלטות וניתוח", לחץ על "התחל הקלטה". המערכת תקליט את השיחה, ולאחר סיום תתמלל אוטומטית עם AI. התמלול נשמר ומקושר לפרויקט.',
      },
      {
        q: 'מה המערכת מחלצת מההקלטה?',
        a: 'ה-AI מחלץ תובנות חשובות: תקציב שנזכר, העדפות סגנון, דרישות מיוחדות, תאריכי יעד, משימות לביצוע, ונקודות מפתח מהשיחה. המידע מוצג בכרטיס מסודר וניתן לעריכה.',
      },
      {
        q: 'האם ניתן להעלות הקלטה קיימת?',
        a: 'כן, ניתן להעלות קבצי אודיו (MP3, WAV, M4A) או וידאו (MP4). המערכת תעבד את הקובץ, תתמלל אותו, ותחלץ תובנות. מתאים להקלטות שבוצעו בטלפון או במכשיר חיצוני.',
      },
    ],
  },
  {
    category: 'חתימות דיגיטליות',
    icon: PenTool,
    questions: [
      {
        q: 'איך עובדת החתימה הדיגיטלית?',
        a: 'כששולחים מסמך לאישור (הצעת מחיר, סקיצות, הדמיות), הלקוח מקבל קישור ציבורי. בעמוד האישור הוא רואה את המסמך, מזין שם מלא לחתימה, ולוחץ "אשר וחתום דיגיטלית". החתימה נשמרת עם תאריך, שעה וכתובת IP.',
      },
      {
        q: 'האם החתימה הדיגיטלית מחייבת משפטית?',
        a: 'החתימה הדיגיטלית יוצרת רשומה מתועדת של האישור, כולל זמן, שם החותם, ומידע מזהה. עם זאת, לצרכים משפטיים מחייבים במיוחד, מומלץ להתייעץ עם עורך דין לגבי דרישות ספציפיות בתחומך.',
      },
      {
        q: 'איך רואים מסמכים שנחתמו?',
        a: 'בכל שלב שדורש אישור (הצעה, סקיצות, הדמיות, תוכניות טכניות), לאחר החתימה יופיע אייקון "אושרה ונחתמה" בירוק. ניתן להוריד את ה-PDF החתום או לצפות בפרטי החתימה.',
      },
    ],
  },
  {
    category: 'לוח שנה ופגישות',
    icon: Calendar,
    questions: [
      {
        q: 'איך מסנכרנים עם Google Calendar?',
        a: 'בעמוד "לוח שנה", לחץ על "סנכרן Google Calendar". תתבקש לאשר גישה לחשבון Google שלך. לאחר האישור, כל האירועים יסונכרנו דו-כיוונית - שינויים במערכת יעודכנו ב-Google ולהפך.',
      },
      {
        q: 'איך יוצרים קישור לקביעת פגישה?',
        a: 'בעמוד "לוח שנה" או בתוך פרויקט, לחץ על "צור קישור לקביעת פגישה". תוכל להגדיר: משכי פגישה אפשריים, שעות פנויות, וחיבור לפרויקט. שלח את הקישור ללקוח והוא יוכל לבחור מועד מהזמינות שלך.',
      },
      {
        q: 'מה התצוגות הזמינות בלוח השנה?',
        a: 'יש 4 תצוגות: חודש - סקירה כללית, שבוע - תכנון שבועי מפורט, יום - לוח זמנים יומי, אג\'נדה - רשימת אירועים כרונולוגית. בנוסף יש תצוגת גאנט לפרויקטים עם אבני דרך.',
      },
    ],
  },
  {
    category: 'כספים ותקציבים',
    icon: DollarSign,
    questions: [
      {
        q: 'מה כולל דף הכספים?',
        a: 'דף הכספים מציג: סיכום כללי (הכנסות, הוצאות, יתרה), מעקב גבייה לפי פרויקט, רשימת חשבוניות וקבלות, הוצאות לספקים, ודוחות תקופתיים. הנתונים מוצגים בגרפים וטבלאות.',
      },
      {
        q: 'איך מתעדים תשלום מלקוח?',
        a: 'לחץ על "הוסף קבלה", בחר את הפרויקט, הזן סכום ותאריך, וצרף קובץ קבלה במידת הצורך. המערכת תעדכן אוטומטית את אחוז הגבייה ואת היתרה לגבייה.',
      },
      {
        q: 'איך עוקבים אחר תקציב פרויקט?',
        a: 'בכל פרויקט יש סיכום תקציבי שמציג: תקציב מאושר (מההצעה), הוצאות שתועדו, תשלומים שהתקבלו, ויתרה. המערכת מתריעה כשמתקרבים לחריגה מהתקציב.',
      },
    ],
  },
  {
    category: 'קבלנים ושותפים',
    icon: Users,
    questions: [
      {
        q: 'איך מוסיפים קבלן למערכת?',
        a: 'בעמוד "קבלנים ושותפים", לחץ "הוסף קבלן". מלא: שם, טלפון, אימייל, תחום התמחות (נגרות, חשמל, אינסטלציה וכו\'), ותעריף. ניתן להוסיף הערות אישיות ולדרג קבלנים לפי ניסיון קודם.',
      },
      {
        q: 'איך שולחים בקשה להצעת מחיר לקבלן?',
        a: 'בעמוד הקבלן או בשלב "ביצוע" בפרויקט, לחץ "שלח בקשה להצעת מחיר". בחר את הפרויקט, צרף מסמכים רלוונטיים (תוכניות, פרטים), וכתוב הודעה. הקבלן יקבל מייל עם קישור לפורטל הקבלנים.',
      },
      {
        q: 'מה הקבלן רואה בפורטל שלו?',
        a: 'בפורטל הקבלנים, הקבלן רואה: רשימת פרויקטים שהוזמן אליהם, מסמכים ותוכניות לצפייה/הורדה, אפשרות להעלות הצעת מחיר, וצ\'אט ישיר עם האדריכל. כל התקשורת נשמרת ומתועדת.',
      },
    ],
  },
  {
    category: 'יומן דיגיטלי',
    icon: Book,
    questions: [
      {
        q: 'מה היומן הדיגיטלי?',
        a: 'היומן הוא מקום מרכזי לתיעוד כל מה שקורה בעסק: פגישות, החלטות, רעיונות, ביקורי שטח, ועוד. כל רשומה מתויגת עם תאריך, פרויקט, וקטגוריה, וניתן לצרף תמונות ומסמכים.',
      },
      {
        q: 'איך מחברים רשומת יומן לפרויקט?',
        a: 'בעת יצירת רשומה, בחר את הפרויקט הרלוונטי מהרשימה. הרשומה תופיע גם בהיסטוריה של הפרויקט וגם ביומן הכללי. ניתן לסנן רשומות לפי פרויקט ספציפי.',
      },
      {
        q: 'האם ניתן לשתף רשומות עם לקוחות?',
        a: 'כן, סמן רשומה כ"משותף עם לקוח" והיא תופיע בפורטל הלקוחות שלו. מתאים לתיעוד התקדמות, צילומי שטח, והחלטות שקיבלתם יחד.',
      },
    ],
  },
];

const quickGuides = [
  {
    title: 'מסע לקוח מלא - מפגישה ראשונה ועד מסירה',
    icon: FolderKanban,
    duration: '20 דקות',
    color: 'indigo',
    description: 'הזרימה המלאה של פרויקט במערכת ArchiFlow',
    steps: [
      { title: '1. יצירת פרויקט', desc: 'לחץ "פרויקט חדש", מלא פרטי לקוח ופרויקט. המערכת תיצור מבנה של 10 שלבים אוטומטית.' },
      { title: '2. שיחה ראשונה', desc: 'תעד שיחת טלפון, קבע פגישה פרונטלית, הקלט את הפגישה ותן ל-AI לתמלל ולחלץ תובנות.' },
      { title: '3. הצעת מחיר', desc: 'צור הצעה מתבנית או מ-AI, ערוך סעיפים ומחירים, שלח ללקוח לחתימה דיגיטלית.' },
      { title: '4. מדידה ופרוגרמה', desc: 'תאם מדידה, העלה תוכניות מצב קיים, הגדר צרכים ויצר לוח השראה.' },
      { title: '5. גאנט ותכנון', desc: 'בנה לוח זמנים עם אבני דרך, סנכרן עם Google Calendar.' },
      { title: '6. סקיצות והדמיות', desc: 'העלה סקיצות, שלח לאישור לקוח, הכן הדמיות 3D וקבל אישור סופי.' },
      { title: '7. תוכניות טכניות', desc: 'העלה סט תוכניות מלא (חשמל, אינסטלציה, נגרות), שתף עם קבלנים.' },
      { title: '8. ביצוע ופיקוח', desc: 'נהל קבלנים, תעד ביקורי שטח ביומן, אשר עבודות ועקוב אחר תשלומים.' },
      { title: '9. סיום ומסירה', desc: 'ערוך סיור מסירה, תעד ליקויים, קבל חתימת לקוח וארכב את התיק.' },
    ],
  },
  {
    title: 'יצירת הצעת מחיר מושלמת',
    icon: FileText,
    duration: '10 דקות',
    color: 'blue',
    description: 'מדריך מלא ליצירת, עריכת ושליחת הצעות מחיר',
    steps: [
      { title: '1. בחירת שיטת יצירה', desc: 'מתבנית מוכנה (מומלץ), מ-AI שייצר אוטומטית, או ידנית מאפס.' },
      { title: '2. בחירת תבנית', desc: 'בחר מ-4 תבניות: בנייה חדשה/שיפוץ × דירה/משרד. כל תבנית כוללת סעיפים מותאמים.' },
      { title: '3. עריכת סעיפים', desc: 'הוסף, הסר או ערוך סעיפים. עדכן כמויות ומחירים. הוסף הערות והסתייגויות.' },
      { title: '4. הגדרת תנאים', desc: 'קבע תנאי תשלום, תוקף ההצעה, ואי-כלולים.' },
      { title: '5. תצוגה מקדימה', desc: 'בדוק איך ההצעה תיראה ללקוח. וודא שכל הפרטים נכונים.' },
      { title: '6. שליחה לאישור', desc: 'לחץ "שלח הצעה ללקוח". הלקוח יקבל מייל עם קישור לצפייה וחתימה.' },
      { title: '7. מעקב וחתימה', desc: 'עקוב אחר סטטוס (נשלח/נצפה/נחתם). לאחר חתימה - הורד PDF חתום.' },
    ],
  },
  {
    title: 'עבודה עם לוחות השראה (Moodboards)',
    icon: Image,
    duration: '12 דקות',
    color: 'purple',
    description: 'יצירת לוחות השראה מקצועיים עם העורך הויזואלי',
    steps: [
      { title: '1. יצירת לוח חדש', desc: 'בספריית העיצוב → לוחות השראה → "לוח חדש". בחר שם ופרויקט מקושר.' },
      { title: '2. בחירת גודל לוח', desc: 'בחר מגדלים מוכנים: A4, A3, Full HD, 4K, Instagram, Pinterest, או מותאם אישית.' },
      { title: '3. הוספת תמונות', desc: 'גרור תמונות מהספרייה או מהמחשב. שנה גודל עם ידיות בפינות.' },
      { title: '4. הוספת טקסט וצבעים', desc: 'הוסף כותרות, תיאורים, ודוגמיות צבע. עצב גופן, גודל וצבע.' },
      { title: '5. סידור ויישור', desc: 'השתמש ב-Smart Guides ליישור אוטומטי. נעל שכבות כדי למנוע זזה בטעות.' },
      { title: '6. ייצוא ושיתוף', desc: 'ייצא כתמונה (PNG/JPG) או PDF. שתף קישור לצפייה עם לקוח.' },
    ],
  },
  {
    title: 'הקלטה וניתוח AI של פגישות',
    icon: Mic,
    duration: '8 דקות',
    color: 'green',
    description: 'איך להפיק את המקסימום מהקלטות עם בינה מלאכותית',
    steps: [
      { title: '1. התחלת הקלטה', desc: 'בשלב "שיחה ראשונה" או בעמוד "הקלטות", לחץ "התחל הקלטה". אשר גישה למיקרופון.' },
      { title: '2. במהלך ההקלטה', desc: 'המערכת מציגה גל קול וזמן. דבר בבירור ליד המיקרופון.' },
      { title: '3. סיום ועיבוד', desc: 'לחץ "סיים הקלטה". המערכת תעבד את האודיו ותתמלל אוטומטית (לוקח 1-3 דקות).' },
      { title: '4. צפייה בתמלול', desc: 'התמלול מוצג עם חותמות זמן. ניתן לערוך ולתקן טעויות.' },
      { title: '5. תובנות AI', desc: 'ה-AI מחלץ: תקציב, העדפות סגנון, דרישות, תאריכים, ומשימות. סקור ואשר.' },
      { title: '6. קישור לפרויקט', desc: 'חבר את ההקלטה והתובנות לפרויקט. המידע זמין לצפייה בכל שלב.' },
    ],
  },
  {
    title: 'ניהול קבלנים ובקשות מחיר',
    icon: Users,
    duration: '10 דקות',
    color: 'amber',
    description: 'תקשורת יעילה עם קבלנים וספקים',
    steps: [
      { title: '1. הוספת קבלנים', desc: 'בעמוד "קבלנים ושותפים" → "הוסף קבלן". מלא פרטים, תחום התמחות, ותעריף.' },
      { title: '2. שליחת בקשה להצעה', desc: 'בחר קבלן, לחץ "שלח בקשה", בחר פרויקט, צרף תוכניות, וכתוב הודעה.' },
      { title: '3. קבלת הצעות', desc: 'הקבלן מעלה הצעה בפורטל שלו. תקבל התראה ותוכל לצפות בהצעה.' },
      { title: '4. השוואה ובחירה', desc: 'השווה הצעות מקבלנים שונים, בחר את המתאים, ושלח אישור.' },
      { title: '5. מעקב ביצוע', desc: 'בשלב "ביצוע" - סמן משימות שהושלמו, תעד ביקורי שטח, אשר עבודות.' },
      { title: '6. תשלומים', desc: 'תעד תשלומים לקבלנים בעמוד "כספים". צרף חשבוניות ועקוב אחר יתרות.' },
    ],
  },
  {
    title: 'לוח שנה וסנכרון Google',
    icon: Calendar,
    duration: '6 דקות',
    color: 'rose',
    description: 'ניהול זמן יעיל עם לוח שנה חכם',
    steps: [
      { title: '1. סנכרון Google Calendar', desc: 'לחץ "סנכרן Google", אשר גישה. כל האירועים יסונכרנו דו-כיוונית.' },
      { title: '2. יצירת אירועים', desc: 'לחץ על תאריך, בחר סוג (פגישה/דדליין/משימה), מלא פרטים וקבע תזכורת.' },
      { title: '3. קישור לפרויקט', desc: 'חבר אירועים לפרויקטים ספציפיים. האירועים יופיעו גם בתצוגת הגאנט.' },
      { title: '4. תצוגות שונות', desc: 'עבור בין חודש/שבוע/יום/אג\'נדה. כל תצוגה מתאימה למטרה אחרת.' },
      { title: '5. קישור לקביעת פגישה', desc: 'צור קישור ציבורי ושלח ללקוח. הוא יבחר מועד מהזמינות שלך.' },
    ],
  },
];

export default function Support() {
  const [formData, setFormData] = useState({
    subject: '',
    category: 'technical',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await base44.integrations.Core.SendEmail({
        to: 'support@archiflow.com',
        subject: `פנייה חדשה: ${formData.subject}`,
        body: `קטגוריה: ${formData.category}\n\n${formData.message}`,
      });
      
      setSubmitted(true);
      showSuccess('הפנייה נשלחה בהצלחה! נחזור אליך בקרוב');
      
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ subject: '', category: 'technical', message: '' });
      }, 3000);
    } catch (error) {
      console.error('Failed to submit support request:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <PageHeader 
          title="מרכז עזרה ותמיכה" 
          subtitle="מדריכים, שאלות נפוצות וכל מה שצריך לדעת על ArchiFlow"
          icon="💡"
        />

        {/* System Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Sparkles className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-foreground mb-2">ברוכים הבאים ל-ArchiFlow</h3>
                  <p className="text-muted-foreground mb-4">
                    מערכת ניהול פרויקטים מקיפה לאדריכלים ומעצבי פנים. 
                    נהל את כל שלבי הפרויקט - מהפגישה הראשונה ועד המסירה - במקום אחד.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-background">
                      <FolderKanban className="w-3 h-3 ml-1" />
                      10 שלבי פרויקט
                    </Badge>
                    <Badge variant="outline" className="bg-background">
                      <FileText className="w-3 h-3 ml-1" />
                      הצעות מחיר + AI
                    </Badge>
                    <Badge variant="outline" className="bg-background">
                      <Palette className="w-3 h-3 ml-1" />
                      לוחות השראה
                    </Badge>
                    <Badge variant="outline" className="bg-background">
                      <Mic className="w-3 h-3 ml-1" />
                      הקלטות + תמלול
                    </Badge>
                    <Badge variant="outline" className="bg-background">
                      <PenTool className="w-3 h-3 ml-1" />
                      חתימות דיגיטליות
                    </Badge>
                    <Badge variant="outline" className="bg-background">
                      <Calendar className="w-3 h-3 ml-1" />
                      לוח שנה + Google
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="border-border bg-card hover:shadow-soft-organic-hover transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft-organic">
                    <MessageCircle className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">צ'אט חי</h3>
                    <p className="text-sm text-muted-foreground mb-2">זמינים א'-ה' 9:00-18:00</p>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic">
                      פתח צ'אט
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border bg-card hover:shadow-soft-organic-hover transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-archiflow-forest-green rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft-organic">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">טלפון</h3>
                    <p className="text-sm text-muted-foreground mb-2">03-1234567</p>
                    <Button size="sm" variant="outline" className="border-archiflow-forest-green text-archiflow-forest-green hover:bg-archiflow-forest-green/10 shadow-soft-organic">
                      התקשר עכשיו
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="border-border bg-card hover:shadow-soft-organic-hover transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft-organic">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">אימייל</h3>
                    <p className="text-sm text-muted-foreground mb-2">support@archiflow.com</p>
                    <Button size="sm" variant="outline" className="border-secondary text-secondary hover:bg-secondary/10 shadow-soft-organic">
                      שלח מייל
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - FAQs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Guides */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Video className="w-5 h-5 text-primary" />
                    מדריכים מפורטים
                    <Badge variant="secondary" className="mr-2">{quickGuides.length} מדריכים</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {quickGuides.map((guide, index) => {
                      const Icon = guide.icon;
                      const [expanded, setExpanded] = React.useState(false);
                      
                      const colorClasses = {
                        indigo: 'from-primary/20 to-primary/30 group-hover:from-primary group-hover:to-primary/80 border-primary/30 hover:border-primary',
                        blue: 'from-archiflow-taupe/20 to-archiflow-taupe/30 group-hover:from-archiflow-taupe group-hover:to-archiflow-taupe/80 border-archiflow-taupe/30 hover:border-archiflow-taupe',
                        purple: 'from-secondary/20 to-secondary/30 group-hover:from-secondary group-hover:to-secondary/80 border-secondary/30 hover:border-secondary',
                        green: 'from-archiflow-forest-green/20 to-archiflow-forest-green/30 group-hover:from-archiflow-forest-green group-hover:to-archiflow-forest-green/80 border-archiflow-forest-green/30 hover:border-archiflow-forest-green',
                        amber: 'from-archiflow-terracotta/20 to-archiflow-terracotta/30 group-hover:from-archiflow-terracotta group-hover:to-archiflow-terracotta/80 border-archiflow-terracotta/30 hover:border-archiflow-terracotta',
                        rose: 'from-archiflow-espresso/20 to-archiflow-espresso/30 group-hover:from-archiflow-espresso group-hover:to-archiflow-espresso/80 border-archiflow-espresso/30 hover:border-archiflow-espresso',
                      };
                      
                      return (
                        <div
                          key={index}
                          className={`p-5 border-2 rounded-xl transition-all cursor-pointer group ${colorClasses[guide.color]}`}
                          onClick={() => setExpanded(!expanded)}
                        >
                          <div className="flex items-start gap-4 mb-3">
                            <div className={`w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${colorClasses[guide.color].split(' ')[0]} ${colorClasses[guide.color].split(' ')[1]}`}>
                              <Icon className="w-6 h-6 text-foreground group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-foreground text-base mb-1">{guide.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{guide.description}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  <Calendar className="w-3 h-3 ml-1" />
                                  {guide.duration}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {guide.steps.length} צעדים
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <AnimatePresence>
                            {expanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="pt-4 mt-4 border-t border-border space-y-3">
                                  {guide.steps.map((step, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-card/80 rounded-lg">
                                      <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-sm text-foreground">
                                        {idx + 1}
                                      </div>
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-foreground text-sm mb-1">{step.title}</h5>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                          
                          <div className="mt-3 text-center">
                            <Button variant="ghost" size="sm" className="text-xs">
                              {expanded ? 'הסתר פרטים ▲' : 'הצג מדריך מלא ▼'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* FAQ Sections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    שאלות נפוצות (FAQ)
                    <Badge variant="secondary" className="mr-2">{faqs.reduce((acc, s) => acc + s.questions.length, 0)} שאלות</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {faqs.map((section, sectionIndex) => {
                    const Icon = section.icon;
                    return (
                      <div key={sectionIndex} id={`faq-section-${sectionIndex}`}>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="font-semibold text-foreground">{section.category}</h3>
                          <Badge variant="outline" className="text-xs">{section.questions.length}</Badge>
                        </div>
                        <Accordion type="single" collapsible className="w-full">
                          {section.questions.map((faq, faqIndex) => (
                            <AccordionItem key={faqIndex} value={`${sectionIndex}-${faqIndex}`}>
                              <AccordionTrigger className="text-right hover:text-primary text-foreground text-sm">
                                {faq.q}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground leading-relaxed text-sm whitespace-pre-line">
                                {faq.a}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Contact Form & Resources */}
          <div className="space-y-6">
            {/* Quick Navigation */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-foreground text-base">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    ניווט מהיר
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {faqs.map((section, idx) => {
                    const Icon = section.icon;
                    return (
                      <Button 
                        key={idx} 
                        variant="ghost" 
                        className="w-full justify-start text-sm h-9"
                        onClick={() => {
                          const element = document.getElementById(`faq-section-${idx}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                      >
                        <Icon className="w-4 h-4 ml-2 text-primary" />
                        {section.category}
                        <Badge variant="outline" className="mr-auto text-xs">{section.questions.length}</Badge>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Card className="sticky top-8 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Mail className="w-5 h-5 text-primary" />
                    פנייה לתמיכה
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    לא מצאת תשובה? שלח לנו פנייה ונחזור אליך בהקדם
                  </p>
                </CardHeader>
                <CardContent>
                  {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="subject">נושא</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="תאר בקצרה את הבעיה"
                          required
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="category">קטגוריה</Label>
                        <select
                          id="category"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full mt-2 px-3 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="technical">תקלה טכנית</option>
                          <option value="feature">בקשת תכונה חדשה</option>
                          <option value="proposal">הצעות מחיר וחתימות</option>
                          <option value="moodboard">לוחות השראה ועיצוב</option>
                          <option value="recordings">הקלטות וניתוח AI</option>
                          <option value="billing">שאלה בנושא חיוב</option>
                          <option value="general">שאלה כללית</option>
                        </select>
                      </div>

                      <div>
                        <Label htmlFor="message">הודעה</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          placeholder="פרט את הבעיה או השאלה שלך..."
                          required
                          rows={6}
                          className="mt-2"
                        />
                      </div>

                      <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft-organic hover:shadow-soft-organic-hover">
                        <Send className="w-4 h-4 ml-2" />
                        שלח פנייה
                      </Button>
                    </form>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 text-center"
                    >
                      <div className="w-16 h-16 bg-archiflow-forest-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-archiflow-forest-green" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">הפנייה נשלחה!</h3>
                      <p className="text-sm text-muted-foreground">
                        נחזור אליך בתוך 24 שעות
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Resources */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Book className="w-5 h-5 text-primary" />
                    משאבים נוספים
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="w-4 h-4 ml-2" />
                    מדריך משתמש מלא (PDF)
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Video className="w-4 h-4 ml-2" />
                    סרטוני הדרכה
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <ClipboardList className="w-4 h-4 ml-2" />
                    רשימת קיצורי מקלדת
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Sparkles className="w-4 h-4 ml-2" />
                    מה חדש? (עדכונים)
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    <Link2 className="w-4 h-4 ml-2" />
                    API ואינטגרציות
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Version Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="border-border bg-muted/30">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    ArchiFlow v2.0
                  </p>
                  <p className="text-xs text-muted-foreground">
                    עודכן לאחרונה: ינואר 2026
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
