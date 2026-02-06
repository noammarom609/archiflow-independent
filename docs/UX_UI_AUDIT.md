# UX/UI Audit – ArchiFlow

הערות מחקר:
בוצעה סריקת קוד מקיפה. לא הורצה האפליקציה בפועל (אין דפדפן במרחב העבודה). כל מה שנדרש אימות ויזואלי או דאטה אמיתי מסומן "לא ודאי" + דרך אימות.

## 1) תקציר מנהלים (עד 15 שורות)
ציון UX/UI כללי: 67/100.
חוזקות עיקריות:
1. Design System בסיסי קיים (Tailwind + shadcn + טוקנים ב־`tailwind.config.js` ו־`src/globals.css`).
2. מסכים מרכזיים כוללים States מובנים (Dashboard/Recordings עם Skeleton/Empty/Error).
3. בסיס RTL/i18n קיים (`LanguageProvider`, טוקנים, `dir`).

3 בעיות־שורש:
1. טיפול לא אחיד ב־Loading/Error/Empty במסכים כבדי־Data.
2. כפילויות והסתירות סביב Settings/Theme/Language ו־Routes "מתים".
3. חוסרים עקביים בנגישות אינטראקטיבית (כפתורי אייקון, טריגרים שאינם כפתור).

5 פעולות הכי משתלמות עכשיו:
1. ליישר RTL/LTR ברמת ה־Layout וה־Toasts.
2. להחליף אינטראקציות לא נגישות (div clickable, icon-only) ל־Button עם aria.
3. להוסיף Error/Empty states אחידים ל־Calendar/Projects/People/Financials.
4. להסיר/להפנות Routes מתים (/Home, /OAuthCallback כפול).
5. להחליף `confirm` בדיאלוג סטנדרטי עם Undo.

## 2) מפת מוצר (Coverage)
טבלה: Route | שם מסך | מטרת המסך | קבצים עיקריים | רכיבי UI מרכזיים | סטטוס כיסוי
| Route | שם מסך | מטרת המסך | קבצים עיקריים | רכיבי UI מרכזיים | סטטוס כיסוי |
| / | LandingHome | דף בית ציבורי + CTA | `src/pages/LandingHome.jsx`, `src/components/landing/*` | Hero, Features, CTA, Logo3D | Partially (code-only) |
| /LandingHome | LandingHome (Alias) | אותו מסך כמו `/` | `src/pages/LandingHome.jsx` | Hero, CTA | Partially |
| /LandingAbout | LandingAbout | אודות | `src/pages/LandingAbout.jsx` | LandingLayout, CTA | Partially |
| /LandingPricing | LandingPricing | מחירים + FAQ | `src/pages/LandingPricing.jsx` | Pricing cards, Accordion | Partially |
| /LandingBlog | LandingBlog | בלוג/תוכן | `src/pages/LandingBlog.jsx` | Blog cards, CTA | Partially |
| /LandingContact | LandingContact | יצירת קשר | `src/pages/LandingContact.jsx` | Form, CTA | Partially |
| /LandingPrivacy | LandingPrivacy | מדיניות פרטיות | `src/pages/LandingPrivacy.jsx` | Static content | Partially |
| /LandingTerms | LandingTerms | תנאי שימוש | `src/pages/LandingTerms.jsx` | Static content | Partially |
| /PublicApproval | PublicApproval | אישור/חתימה להצעה/מסמך | `src/pages/PublicApproval.jsx` | ProposalPreview, signature canvas | Partially (דורש `id` + `type`) |
| /PublicContractorQuote | PublicContractorQuote | הגשת הצעת קבלן | `src/pages/PublicContractorQuote.jsx` | Quote form, docs preview | Partially (דורש `token` או projectId+contractorId) |
| /PublicMeetingBooking | PublicMeetingBooking | קביעת פגישה | `src/pages/PublicMeetingBooking.jsx` | Slots, form, content | Partially (דורש token/params) |
| /PublicContent | PublicContent | צפייה בתוכן משותף | `src/pages/PublicContent.jsx` | Content card | Partially (דורש id) |
| /OAuthCallback | OAuthCallback | Callback התחברות | `src/pages/OAuthCallback.jsx` | Logic-only | Partially (Auth-only) |
| /Dashboard | Dashboard | סקירה + פעולות מהירות | `src/pages/Dashboard.jsx`, `components/dashboard/*` | Gauges, Matrix, Notifications | Covered (code) |
| /Projects | Projects | ניהול פרויקטים ו־Workflow | `src/pages/Projects.jsx`, `components/projects/*` | WorkflowStepper, Stages, Modals | Covered (code) |
| /Calendar | Calendar | יומן, פגישות, גאנט | `src/pages/Calendar.jsx`, `components/calendar/*` | Month/Week/Agenda/Gantt | Covered (code) |
| /TimeTracking | TimeTracking | ניהול שעות | `src/pages/TimeTracking.jsx`, `components/time-tracking/*` | TimeTracker, Reports | Covered |
| /Recordings | Recordings | הקלטות + ניתוח AI | `src/pages/Recordings.jsx` | RecordingControls, AnalysisResults | Covered |
| /MeetingSummaries | MeetingSummaries | סיכומי פגישות (Upload/AI) | `src/pages/MeetingSummaries.jsx` | Upload, Summary, Distribute | Covered |
| /DesignLibrary | DesignLibrary | ספריית עיצוב | `src/pages/DesignLibrary.jsx` | ContentLibrary, MoodboardEditor | Covered |
| /Financials | Financials | חשבוניות/הוצאות | `src/pages/Financials.jsx` | Tabs, Tables, Dialogs | Covered |
| /Journal | Journal | יומן פרויקט | `src/pages/Journal.jsx` | EntryCard, Timeline | Covered |
| /People | People | אנשי קשר/צוות | `src/pages/People.jsx` | Cards, EntityDetailModal | Covered |
| /Consultants | Consultants | Redirect ל־People | `src/pages/Consultants.jsx` | Redirect spinner | Covered (redirect) |
| /Contractors | Contractors | קבלנים + משימות/מסמכים | `src/pages/Contractors.jsx` | ContractorCard, TaskCard | Covered |
| /ClientPortal | ClientPortal | פורטל לקוח | `src/pages/ClientPortal.jsx` | ClientProjectCard, Approvals | Partially (Role/Data) |
| /ConsultantPortal | ConsultantPortal | פורטל יועץ | `src/pages/ConsultantPortal.jsx` | Tasks, Docs, Messaging | Partially (Role/Data) |
| /ContractorPortal | ContractorPortal | פורטל קבלן + הצעות | `src/pages/ContractorPortal.jsx` | Tasks, Docs, Quotes | Partially (Role/Data) |
| /SupplierPortal | SupplierPortal | פורטל ספק | `src/pages/SupplierPortal.jsx` | Messaging, Docs | Partially (Role/Data) |
| /Team | Team | צוות והרשאות | `src/pages/Team.jsx` | UserTable, Invite/Edit | Covered |
| /UserManagement | UserManagement | ניהול משתמשים מתקדם | `src/pages/UserManagement.jsx` | Tables, Dialogs | Covered |
| /SuperAdminDashboard | SuperAdminDashboard | ניהול מערכת | `src/pages/SuperAdminDashboard.jsx` | Tabs, Admin tools | Covered |
| /Settings | Settings | פרופיל/התראות/שפה | `src/pages/Settings.jsx` | Tabs, Forms, Switches | Covered |
| /ThemeSettings | ThemeSettings | ערכת נושא + שפה | `src/pages/ThemeSettings.jsx` | Theme cards, Language toggles | Covered |
| /Support | Support | מרכז תמיכה | `src/pages/Support.jsx` | FAQ, Contact form | Covered |
| /ProposalTemplates | ProposalTemplates | תבניות להצעה | `src/pages/ProposalTemplates.jsx` | Template editor, Preview | Covered |
| /Home | Home | Placeholder ריק | `src/pages/Home.jsx` | Empty | Covered (empty) |

סטטוס כיסוי: כל המסכים נסקרו בקוד; לא בוצעה בדיקת UI בפועל. מסכים שדורשים דאטה/Role/Token מסומנים Partially.

## 3) ציונים לפי ממדים (0–10)
| ממד | ציון | הערה קצרה |
| ניווט/IA | 7 | Sidebar ברור, אבל כפילויות במסכים/Routes |
| בהירות ויזואלית | 8 | שפה ויזואלית עשירה, מעט עומס |
| CTA & Feedback | 7 | רוב המסכים עם CTA ברור, יש פערים במסכי Data |
| טפסים/שגיאות | 6 | יש validations חלקיים, חסר Error states עקביים |
| נגישות | 5 | פערים בכפתורי אייקון/טריגרים לא נגישים |
| ביצועים נתפסים | 7 | Skeletons קיימים במסכים מרכזיים |
| מובייל/רספונסיביות | 6 | שימוש ב־sm/md, לא אומת בפועל |
| עקביות Design System | 7 | shadcn + tokens, אבל לא אחיד בכל המסכים |
| מיקרוקופי/תוכן | 7 | עברית טובה, לעיתים ארוכה מדי |
סה״כ: 67/100.

## 4) Issues Table
| ID | מסך/Route | אלמנט | תיאור הבעיה | למה זה בעיה (Impact) | Evidence | Severity | Effort | Fix | Acceptance Criteria | Owner Suggestion |
| UX-01 | Global Layout | Root container | `dir="rtl"` קבוע ב־Layout | שובר LTR באנגלית, מבלבל משתמשים | `src/Layout.jsx:369` | P1 | S | לחבר ל־`useLanguage` ולהגדיר `dir` דינמי | כששפה=en אז `dir="ltr"` וה־UI מתהפך | FE |
| UX-02 | Global Toasts | Toaster | `dir="rtl"` קבוע בטוסטים | טוסטים הפוכים באנגלית | `src/App.jsx:93` | P3 | S | `dir` לפי שפה | טוסטים בכיוון נכון לפי שפה | FE |
| UX-03 | /Home | מסך ריק | המסך מחזיר `<div/>` ריק | Dead‑end ומבלבל | `src/pages/Home.jsx:1` | P2 | S | להסיר מ־PAGES או להפנות ל־`/` | `/Home` מפנה ל־`/` או מציג תוכן אמיתי | FE |
| UX-04 | /OAuthCallback | Routing | אותו מסך מופיע גם ב־PAGES וגם כ־Route ייעודי | כפילות/גישה לא צפויה | `src/pages.config.js:114`, `src/App.jsx:85` | P2 | S | להסיר מ־PAGES או להפנות | רק `/oauth/callback` פעיל | FE |
| UX-05 | /Dashboard | Global Search Trigger | טריגר חיפוש הוא `div` עם `onClick` | לא נגיש למקלדת/Screen Reader | `src/pages/Dashboard.jsx:203` | P1 | S | להחליף ל־`Button` עם `aria-label` | ניתן לפתוח חיפוש עם Tab+Enter/Space | FE |
| UX-06 | /Projects | Delete Project | שימוש ב־`confirm()` | UX לא עקבי, אין שליטה/Undo | `src/pages/Projects.jsx:402` | P2 | M | AlertDialog + Undo/Toast | דיאלוג מותאם, נגיש, עם ביטול | FE/Design |
| UX-07 | /Projects | Delete Icon Button | כפתור אייקון בלי `aria-label` | Screen Reader לא יודע מה הפעולה | `src/pages/Projects.jsx:992-996` | P2 | S | להוסיף `aria-label` + Tooltip | SR קורא "מחק פרויקט" | FE |
| UX-08 | /Calendar | View Toggle Buttons | אייקונים בלבד ללא label/pressed | נגישות נמוכה, חוסר בהירות | `src/pages/Calendar.jsx:281-326` | P2 | S | `aria-label` + `aria-pressed` או טקסט | SR מזהה כפתורים ומצב פעיל | FE |
| UX-09 | /Calendar | Loading/Error | אין טיפול Loading/Error ל־queries | כשל נראה כמו "אין נתונים" | `src/pages/Calendar.jsx:101-143` | P2 | M | Skeleton + Error state | בשגיאה מוצג הודעה + Retry | FE |
| UX-10 | /Projects | Invalid Project ID | אם `id` לא קיים מוצג ספינר נצחי | משתמש נתקע | `src/pages/Projects.jsx:891` | P1 | S-M | Empty/Error state עם CTA חזרה | כתובת שגויה מציגה "לא נמצא" | FE |
| UX-11 | /People | Error States | אין טיפול Error ל־queries | שגיאות נראות כמו חוסר נתונים | `src/pages/People.jsx:138-158` | P3 | S | Error UI אחיד | כשל API מציג הודעה | FE |
| UX-12 | /PublicApproval | Signature Canvas | חתימה רק בציור | חסם נגישות למקלדת/מקלדת עזר | `src/pages/PublicApproval.jsx:392` | P1 | M | טופס חתימה טקסטואלי חלופי | ניתן לאשר גם ללא ציור | FE/Design |
| UX-13 | /Settings + /ThemeSettings | כפילות שפה/נושא | שני מסכים שמטפלים באותו דבר | בלבול, מצב לא עקבי (לא ודאי) | `src/pages/Settings.jsx`, `src/pages/ThemeSettings.jsx` | P2 | M | לאחד למסך אחד/סנכרון מלא | שינוי שפה/נושא עובד במקום יחיד | FE/Design |
| UX-14 | Public Pages | Brand Consistency | שימוש בצבעי slate/indigo לא מהטוקנים | פוגע באמון וזהות מותג | `src/pages/PublicApproval.jsx:228` | P3 | M | שימוש ב־`primary/secondary` טוקנים | ציבוריים תואמי מותג | Design/FE |
| UX-15 | Landing/Projects | Image Performance | תמונות חיצוניות ללא lazy/decoding | פוגע ב־CLS ובביצועים | `src/pages/LandingHome.jsx:146-149`, `src/pages/Projects.jsx:796` | P3 | S | `loading="lazy"` + sizes | תמונות נטענות עצלנית | FE |

Accessibility P0: לא זוהו בוודאות מהקוד בלבד. נדרש אימות עם בדיקות מקלדת + Axe.

## 5) סריקות עומק לפי מסכים (Screen-by-screen)
### LandingHome (/ ו־/LandingHome)
מטרה: שיווק ו־CTA להיכנס למוצר.
מה עובד: Hero חזק, CTA ברור, חזות עשירה.
מה שבור/מבלבל: שימוש בתמונות חיצוניות ללא lazy.
States חסרים: אין (סטטי).
המלצות ספציפיות: lazy load + alt תקין; לבדוק CLS במובייל (לא ודאי, אימות דרך Lighthouse).

### LandingAbout (/LandingAbout)
מטרה: סיפור/ערך.
מה עובד: מבנה landing אחיד.
מה שבור/מבלבל: לא ודאי ללא ריצה.
States חסרים: אין.
המלצות ספציפיות: לוודא CTA ממשיך ל־Sign in; בדיקת נגישות כותרות.

### LandingPricing (/LandingPricing)
מטרה: הצגת תמחור.
מה עובד: Cards + FAQ.
מה שבור/מבלבל: לא ודאי אם המחירים אמתיים/מעודכנים.
States חסרים: אין.
המלצות ספציפיות: להוסיף “מה כלול” ברור ו־CTA ראשי.

### LandingBlog (/LandingBlog)
מטרה: תוכן שיווקי.
מה עובד: כרטיסי תוכן.
מה שבור/מבלבל: לא ודאי אם תוכן דינמי.
States חסרים: אין.
המלצות ספציפיות: הוספת חיפוש/פילטר אם יש הרבה פוסטים.

### LandingContact (/LandingContact)
מטרה: ליד/פנייה.
מה עובד: טופס בסיסי.
מה שבור/מבלבל: לא ודאי אם יש Success/Error.
States חסרים: Loading/Success במשלוח.
המלצות ספציפיות: להוסיף state ברור + הודעת הצלחה.

### LandingPrivacy (/LandingPrivacy)
מטרה: מדיניות פרטיות.
מה עובד: תוכן סטטי.
מה שבור/מבלבל: לא ודאי תאריך עדכון.
States חסרים: אין.
המלצות ספציפיות: להציג "עודכן לאחרונה".

### LandingTerms (/LandingTerms)
מטרה: תנאי שימוש.
מה עובד: תוכן סטטי.
מה שבור/מבלבל: לא ודאי תאריך עדכון.
States חסרים: אין.
המלצות ספציפיות: להוסיף תאריך אחרון.

### PublicApproval (/PublicApproval)
מטרה: אישור הצעה/מסמך + חתימה.
מה עובד: Loading/Error/Success קיימים.
מה שבור/מבלבל: חתימה דורשת ציור בלבד.
States חסרים: נגישות חתימה.
המלצות ספציפיות: אופציית חתימה מוקלדת + הודעת שגיאה נגישה.

### PublicContractorQuote (/PublicContractorQuote)
מטרה: קבלן מגיש הצעת מחיר.
מה עובד: טופס + טעינת פרויקט/קבלן.
מה שבור/מבלבל: סטיילינג שונה מהמותג.
States חסרים: לא ודאי לגבי Empty/Invalid token.
המלצות ספציפיות: ליישר טוקנים + הודעת "קישור לא תקין" עקבית.

### PublicMeetingBooking (/PublicMeetingBooking)
מטרה: קביעת פגישה ציבורית.
מה עובד: זרימה מובנית לפי slots.
מה שבור/מבלבל: לא ודאי במובייל.
States חסרים: לא ודאי.
המלצות ספציפיות: להדגיש זמינות/אזור זמן.

### PublicContent (/PublicContent)
מטרה: צפייה בתוכן ציבורי.
מה עובד: Loading/Error קיימים.
מה שבור/מבלבל: עיצוב לא מותגי.
States חסרים: לא ודאי.
המלצות ספציפיות: יישור לטוקנים.

### OAuthCallback (/oauth/callback + /OAuthCallback)
מטרה: טיפול בקולבק התחברות.
מה עובד: קיים route ייעודי.
מה שבור/מבלבל: כפילות route.
States חסרים: הודעת מעבר/שגיאה.
המלצות ספציפיות: להשאיר רק route אחד + state.

### Dashboard (/Dashboard)
מטרה: סקירה ופעולות מהירות.
מה עובד: Skeleton/Error/Empty (לגאוג’ים, מטריצה).
מה שבור/מבלבל: טריגר חיפוש אינו נגיש.
States חסרים: לא ודאי.
המלצות ספציפיות: Button נגיש לחיפוש + קיצורי מקלדת גלויים.

### Projects (/Projects)
מטרה: ניהול פרויקטים + שלבים.
מה עובד: WorkflowStepper, חלוקה לשלבים, CTA.
מה שבור/מבלבל: ספינר נצחי כש־id לא תקין.
States חסרים: Error state ל־queries.
המלצות ספציפיות: Not Found + Error Boundary; AlertDialog למחיקה.

### Calendar (/Calendar)
מטרה: יומן/פגישות/גאנט.
מה עובד: מגוון תצוגות, פילטרים.
מה שבור/מבלבל: כפתורי תצוגה ללא label.
States חסרים: Loading/Error ל־data.
המלצות ספציפיות: Skeleton + Error + aria-pressed.

### TimeTracking (/TimeTracking)
מטרה: דיווח שעות + דוחות.
מה עובד: פילטרים, Timesheet, Export.
מה שבור/מבלבל: לא ודאי במובייל.
States חסרים: Error state ל־queries.
המלצות ספציפיות: Error + Empty סטנדרטי.

### Recordings (/Recordings)
מטרה: הקלטה וניתוח AI + פגישות.
מה עובד: Empty/Skeleton/Error, חלוקת טאב.
מה שבור/מבלבל: לא ודאי לגבי הרשאות במובייל.
States חסרים: לא ודאי.
המלצות ספציפיות: להוסיף הודעת Privacy לפני הקלטה.

### MeetingSummaries (/MeetingSummaries)
מטרה: העלאת הקלטות וסיכום.
מה עובד: חוויית Upload והתקדמות.
מה שבור/מבלבל: לא ודאי לגבי טעינת פרויקטים.
States חסרים: Loading/Error עקביים.
המלצות ספציפיות: לשקף זמן משוער ותור עיבוד.

### DesignLibrary (/DesignLibrary)
מטרה: ספריית עיצוב, moodboards, תוכן.
מה עובד: רכיב ContentLibrary, עורך.
מה שבור/מבלבל: מורכבות גבוהה (לא ודאי UX).
States חסרים: Error state אחיד.
המלצות ספציפיות: סידור ניווט פנימי לפי סוג תוכן.

### Financials (/Financials)
מטרה: חשבוניות/הוצאות/אנליטיקה.
מה עובד: טבלאות, פילוח.
מה שבור/מבלבל: אין Error states.
States חסרים: Error/Empty אחיד.
המלצות ספציפיות: ליישר הודעות שגיאה ושקיפות נתונים.

### Journal (/Journal)
מטרה: יומן פרויקט.
מה עובד: כרטיסים + טיימליין.
מה שבור/מבלבל: לא ודאי זרימת יצירה.
States חסרים: Error/Empty.
המלצות ספציפיות: CTA ברור ליצירה ראשונה.

### People (/People)
מטרה: ניהול אנשי קשר וצוות.
מה עובד: טאבים, פילטרים, מודאלים.
מה שבור/מבלבל: toggles ללא label; אין Error state.
States חסרים: Error.
המלצות ספציפיות: aria-label + Error UI.

### Consultants (/Consultants)
מטרה: Redirect ל־People.
מה עובד: Redirect עם ספינר.
מה שבור/מבלבל: כתובת נשארת?
States חסרים: אין.
המלצות ספציפיות: הוספת הודעה קצרה "המסך מוזג ל־People".

### Contractors (/Contractors)
מטרה: ניהול קבלנים.
מה עובד: כרטיסים, משימות, מסמכים.
מה שבור/מבלבל: לא ודאי רספונסיביות.
States חסרים: Error state.
המלצות ספציפיות: יישור Empty/Loading.

### ClientPortal (/ClientPortal)
מטרה: לקוח רואה פרויקטים/מסמכים/אישורים.
מה עובד: טאביות וסטטוסים.
מה שבור/מבלבל: תלוי הרשאות/דאטה.
States חסרים: לא ודאי.
המלצות ספציפיות: להסביר הרשאות/צפייה.

### ConsultantPortal (/ConsultantPortal)
מטרה: פורטל יועץ.
מה עובד: מסמכים/משימות/הודעות.
מה שבור/מבלבל: לא ודאי.
States חסרים: Error/Empty.
המלצות ספציפיות: CTA ברור להעלאת מסמך ראשון.

### ContractorPortal (/ContractorPortal)
מטרה: פורטל קבלן + הצעות.
מה עובד: מסמכים/משימות/הודעות/חתימות.
מה שבור/מבלבל: לא ודאי.
States חסרים: Error/Empty.
המלצות ספציפיות: מסך מצב "אין עבודות".

### SupplierPortal (/SupplierPortal)
מטרה: פורטל ספקים.
מה עובד: הודעות/מסמכים.
מה שבור/מבלבל: לא ודאי.
States חסרים: Error/Empty.
המלצות ספציפיות: טאביות אחידות עם פורטלים אחרים.

### Team (/Team)
מטרה: ניהול צוות.
מה עובד: טבלה + הזמנה/עריכה.
מה שבור/מבלבל: לא ודאי.
States חסרים: Error/Empty.
המלצות ספציפיות: Empty state עם CTA להזמנה.

### UserManagement (/UserManagement)
מטרה: ניהול משתמשים מתקדם.
מה עובד: טבלאות, פילטרים, דיאלוגים.
מה שבור/מבלבל: לא ודאי.
States חסרים: Error/Empty.
המלצות ספציפיות: להוסיף safeguards למחיקות.

### SuperAdminDashboard (/SuperAdminDashboard)
מטרה: ניהול מערכת.
מה עובד: טאביות ניהול, דיאלוגים.
מה שבור/מבלבל: עומס מידע (לא ודאי).
States חסרים: Error/Empty.
המלצות ספציפיות: חלוקה ל־sections ו־search.

### Settings (/Settings)
מטרה: פרופיל/התראות/שפה.
מה עובד: טפסים, upload תמונה.
מה שבור/מבלבל: כפילות עם ThemeSettings (לא ודאי).
States חסרים: לא ודאי.
המלצות ספציפיות: לאחד מסכים ולחבר לשפה בזמן אמת.

### ThemeSettings (/ThemeSettings)
מטרה: ערכת נושא + שפה.
מה עובד: שינוי שפה מיידי.
מה שבור/מבלבל: כפילות עם Settings.
States חסרים: אין.
המלצות ספציפיות: להחליט מסך אחד.

### Support (/Support)
מטרה: מרכז עזרה.
מה עובד: FAQ, טופס פנייה, מדריכים.
מה שבור/מבלבל: לחצנים בלי פעולה (PDF/וידאו) – לא ודאי.
States חסרים: Success/Error לטופס.
המלצות ספציפיות: להוסיף לינקים אמיתיים + מצב שליחה.

### ProposalTemplates (/ProposalTemplates)
מטרה: תבניות להצעות מחיר.
מה עובד: Editor/Preview.
מה שבור/מבלבל: לא ודאי חוויית גרירה/שמירה.
States חסרים: Error/Empty.
המלצות ספציפיות: אוטוסייב + הודעת שמירה.

### Home (/Home)
מטרה: Placeholder ריק.
מה עובד: כלום.
מה שבור/מבלבל: מסך ריק.
States חסרים: כל המצבים.
המלצות ספציפיות: להסיר מה־Routes או להפנות ל־`/`.

## 6) Quick Wins (Top 10)
1. לקשור `dir` ב־Layout וב־Toaster לשפה פעילה.
2. להפוך טריגר חיפוש בדשבורד ל־Button נגיש.
3. להוסיף `aria-label` לכפתורי אייקון (Calendar, People, Projects).
4. להחליף `confirm()` ב־AlertDialog עם עיצוב אחיד.
5. להוסיף Error state ל־Calendar ו־Projects.
6. להציג "Project not found" כש־`id` לא תקין.
7. להסיר/להפנות `/Home`.
8. להסיר/להסתיר `/OAuthCallback` מה־PAGES.
9. להוסיף אפשרות חתימה מוקלדת ב־PublicApproval.
10. להוסיף `loading="lazy"` לתמונות חיצוניות.

## 7) Big Bets (מהלכים גדולים)
1. State System אחיד ל־Loading/Empty/Error בכל מסכי Data.
2. איחוד מסכי Settings/ThemeSettings למסך הגדרות אחד.
3. סטנדרטיזציה של פורטלים (Client/Contractor/Consultant/Supplier) על בסיס תבנית אחת.
4. תכנית נגישות מלאה (Keyboard, Focus, ARIA, Contrast) עם בדיקות אוטומטיות.
5. ניקוי IA/Routing: הסרת Routes מתים, ארגון ניווט.

## 8) תוכנית ביצוע 7/14/30 ימים
שבוע 1: RTL/LTR, כפתורי אייקון נגישים, החלפת confirm, הסרת Routes מתים.
שבועיים: Error/Empty אחיד ב־Calendar/Projects/People/Financials + Not Found ל־Projects.
30 יום: איחוד Settings, סטנדרטיזציה לפורטלים, אוטומציה לנגישות + מדדי UX.

## 9) QA Checklist לריליס (UX/UI)
- כל Route נטען בהתאם להרשאות.
- Loading/Empty/Error בכל רשימות/טבלאות.
- ניווט מקלדת מלא + Focus states.
- RTL/LTR מתהפך בכל המסכים (כולל Toasts).
- מובייל: ללא overflow, כפתורי מגע 44px+.
- Forms: ולידציה, הודעות שגיאה, מצב Submit.
- Public links: Token invalid => הודעת שגיאה ברורה.
- Destructive actions: דיאלוג אישור + אפשרות ביטול.
- Performance: אין CLS גדול, תמונות lazy.

## Accessibility P0
לא זוהו בוודאות מהקוד בלבד. מומלץ להריץ Axe + בדיקת מקלדת על כל מסך קריטי.

## Next Actions (5 צעדים עכשיו)
1. לאשר כתיבה של `docs/UX_UI_AUDIT.md` ו־`docs/UX_UI_TICKETS.md`.
2. לתקן `dir` ב־`src/Layout.jsx` ו־`src/App.jsx`.
3. להחליף טריגר חיפוש בדשבורד ל־Button נגיש.
4. להוסיף Error/Not Found ל־`/Projects`.
5. להסיר `/Home` ו־`/OAuthCallback` מה־Routes הציבוריים.
