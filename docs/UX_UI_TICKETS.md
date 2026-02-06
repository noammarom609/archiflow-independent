# UX/UI Tickets – ArchiFlow

TKT-01 – Dynamic RTL/LTR Direction
Description: לחבר את ה־Layout וה־Toaster לשפה הפעילה במקום `dir="rtl"` קבוע.
Acceptance Criteria: כששפה=en אז `dir="ltr"` ב־Layout וב־Toasts; כששפה=he אז `dir="rtl"`.
Severity/Effort: P1 / S
Screen/Route: Global (`src/Layout.jsx`, `src/App.jsx`)

TKT-02 – Dashboard Search Accessible Trigger
Description: להחליף טריגר חיפוש שהוא `div` ל־`button`/`Button` עם `aria-label` ותמיכה ב־Enter/Space.
Acceptance Criteria: ניתן לפתוח חיפוש עם Tab+Enter/Space; SR מקריא תיאור.
Severity/Effort: P1 / S
Screen/Route: /Dashboard

TKT-03 – Project Delete Confirmation Dialog
Description: להחליף `confirm()` בדיאלוג AlertDialog סטנדרטי עם טקסט ברור.
Acceptance Criteria: דיאלוג נגיש עם Confirm/Cancel; אין שימוש ב־`confirm()`.
Severity/Effort: P2 / M
Screen/Route: /Projects

TKT-04 – Projects Not Found State
Description: להציג Empty/Error כש־`id` לא קיים או query נכשל.
Acceptance Criteria: `/Projects?id=bad` מציג מסך "לא נמצא" עם CTA חזרה לרשימה.
Severity/Effort: P1 / S-M
Screen/Route: /Projects

TKT-05 – Calendar Loading/Error States
Description: להוסיף Skeleton/Error עבור אירועים/משימות/יומן.
Acceptance Criteria: בזמן טעינה מוצג Skeleton; בשגיאה מוצג Error + Retry.
Severity/Effort: P2 / M
Screen/Route: /Calendar

TKT-06 – Icon Buttons A11y Labels
Description: להוסיף `aria-label`/`aria-pressed` לכפתורי אייקון (Calendar, People, Projects ועוד).
Acceptance Criteria: כל כפתור אייקון נקרא נכון ע"י SR ומציג מצב פעיל.
Severity/Effort: P2 / S
Screen/Route: /Calendar, /People, /Projects

TKT-07 – Remove or Redirect /Home Route
Description: להסיר /Home מ־PAGES או להפנות ל־`/`.
Acceptance Criteria: `/Home` לא מציג מסך ריק.
Severity/Effort: P2 / S
Screen/Route: /Home

TKT-08 – OAuthCallback Route Cleanup
Description: להסיר OAuthCallback מ־PAGES או להפנות כך שרק `/oauth/callback` פעיל.
Acceptance Criteria: `/OAuthCallback` לא נגיש; `/oauth/callback` ממשיך לעבוד.
Severity/Effort: P2 / S
Screen/Route: /OAuthCallback

TKT-09 – Public Approval Accessible Signature
Description: להוסיף אפשרות חתימה מוקלדת/טקסטואלית בנוסף ל־canvas.
Acceptance Criteria: ניתן לאשר גם ללא ציור; נגיש למקלדת.
Severity/Effort: P1 / M
Screen/Route: /PublicApproval

TKT-10 – Unify Theme & Language Settings
Description: לאחד את /Settings ו־/ThemeSettings למסך אחד או לסנכרן מלא.
Acceptance Criteria: שינוי שפה/נושא עובד במקום יחיד ומעודכן מיידית.
Severity/Effort: P2 / M
Screen/Route: /Settings, /ThemeSettings

TKT-11 – Align Public Pages With Brand Tokens
Description: להחליף slate/indigo לצבעי טוקנים (`primary/secondary`).
Acceptance Criteria: Public pages משתמשים בטוקנים אחידים.
Severity/Effort: P3 / M
Screen/Route: /PublicApproval, /PublicContractorQuote, /PublicMeetingBooking, /PublicContent

TKT-12 – Lazy Load External Images
Description: להוסיף `loading="lazy"` + `decoding="async"` לתמונות חיצוניות.
Acceptance Criteria: תמונות נטענות עצלנית; CLS קטן יותר.
Severity/Effort: P3 / S
Screen/Route: /LandingHome, /Projects
