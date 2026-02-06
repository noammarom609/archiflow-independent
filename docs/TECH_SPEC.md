# ArchiFlow – אפיון טכנולוגי מלא לממשק

> תאריך מסמך: 2026-02-03  
> מקור: ניתוח ריפו מקומי (Frontend/Backend/QA)  
> סטטוס: טיוטה מלאה – ניתנת להעמקה לפי מודולים

---

**1. תקציר ומטרות**  
ArchiFlow היא מערכת ניהול פרויקטים לאדריכלים ומעצבי פנים, הכוללת ניהול פרויקטים לפי שלבים, לקוחות/ספקים, מסמכים, יומן, כספים, ספריית עיצוב, תיעוד פגישות ויכולות AI לתמלול וסיכום.

---

**2. תחומי כיסוי (Scope)**
- אפליקציית Web ראשית (Internal)
- פורטלים תפקידיים (Client/Contractor/Consultant/Supplier)
- דפי Landing ציבוריים
- דפי Public ללא Login (Approval / Contractor Quote / Meeting Booking / Content)
- תמיכה ב־Mobile דרך Capacitor (iOS/Android)

---

**3. סטאק וטכנולוגיות**
Frontend
- React + Vite
- Tailwind CSS + shadcn/ui
- React Router
- React Query

Backend / Data
- Supabase (PostgreSQL + Storage + Edge Functions)
- API wrapper: `archiflow.entities.*`

Auth / RBAC
- Clerk Authentication
- Supabase JWT + RLS
- Role Based Access + `allowed_pages`

Deployment
- Vercel (SPA rewrite)

---

**4. מבנה ניווט ורוטינג**
הניווט מוגדר בקובץ `src/pages.config.js` עם `mainPage: "LandingHome"`.

דפים מרכזיים:
- Dashboard, Projects, Calendar, TimeTracking, Recordings, MeetingSummaries, DesignLibrary, Financials, People, Team, Settings

פורטלים:
- ClientPortal, ContractorPortal, ConsultantPortal, SupplierPortal

Public Pages:
- PublicApproval, PublicContractorQuote, PublicMeetingBooking, PublicContent

Landing Pages:
- LandingHome, LandingAbout, LandingPricing, LandingBlog, LandingContact, LandingPrivacy, LandingTerms

---

**5. RBAC והרשאות**
Roles עיקריים:
- super_admin, admin, architect, project_manager, team_member, employee
- client, contractor, consultant

עקרונות:
- `allowed_pages` גובר על Role Presets
- Auto-approved לרמות ניהול
- משתמש לא מאושר יקבל מסך Pending Approval

---

**6. זרימות עבודה מרכזיות**
מכסה את ה־QA Full Journey:
- Landing / Public
- Login / Logout
- Dashboard
- Projects Workflow (שלבים מלאים)
- Calendar + TimeTracking
- Recordings + AI
- Design Library
- Financials (Proposals/Invoices)
- People/Portals

---

**7. Workflow פרויקטים – שלבים**
- שיחה ראשונה
- הצעת מחיר
- גאנט
- מדידה
- פרוגרמה וקונספט
- סקיצות
- הדמיות
- היתרים
- תוכניות עבודה
- בחירות וכתב כמויות
- ביצוע
- סיום

---

**8. יכולות AI**
- תמלול שיחות (Audio → Text)
- סיכום אוטומטי ותובנות (LLM)
- יצירת תמונות (Generate Image)
- מעקב שימוש AI ברמת פרויקט

---

**9. מודל נתונים (Entities)**
Core Entities:
- Project, Client, Task, Document, Recording
- Proposal, Invoice, Expense, Receipt
- Consultant, Contractor, Supplier, TeamMember
- TimeEntry, CalendarEvent
- Moodboard, DesignAsset
- Notification, Comment, Message
- ProposalTemplate, ProposalClause
- ProjectPermission, ProjectConsultant
- ContractorQuote

AI / Extended:
- AILearning, ProjectAIHistory
- DocumentSignature, ShareLink, ClientAccess

---

**10. אינטגרציות מערכת**
- Supabase Storage (Upload)
- Clerk Auth + Supabase JWT
- Email via Edge Function
- SMS via Edge Function (placeholder)
- Push Notifications
- Google Calendar Sync

---

**11. i18n ו־RTL**
- תרגום מובנה `he` / `en`
- שינוי Direction דינמי (RTL/LTR)

---

**12. אבטחה**
- RLS לכל טבלה
- Multi-tenant לפי `architect_id` / `architect_email`
- דפי Public מוחרגים מאימות

---

**13. בדיקות איכות**
- Playwright E2E
- `qa-full-journey` כולל RBAC, Workflow מלא, מודולים מרכזיים

---

**14. משתני סביבה**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `E2E_SUPABASE_URL`
- `E2E_SUPABASE_ANON_KEY`

---

**15. המלצות להמשך**
- הרחבת אפיון UI/UX למסכים ספציפיים
- מיפוי מלא של סכימת DB מול הקוד
- נספח API Endpoints ו־Edge Functions

---

סוף מסמך
