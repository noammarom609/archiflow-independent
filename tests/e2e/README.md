# ArchiFlow E2E (Playwright)

בדיקות מקצה־לקצה עם Playwright – לחיצות, מילוי טפסים, וידוא UI.

## הרצה

```bash
# headless (ברירת מחדל) – מול localhost:5173
npm run test:e2e

# דפדפן גלוי
npm run test:e2e:headed

# מצב UI של Playwright
npm run test:e2e:ui
```

## הרצת כל בדיקות ה־QA מול Production

מול **https://archiflow-independent.vercel.app** (ללא הפעלת שרת מקומי):

**Windows (PowerShell):**
```powershell
$env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npm run test:e2e:prod
```

**Windows (Cmd):**
```cmd
set PLAYWRIGHT_BASE_URL=https://archiflow-independent.vercel.app && npm run test:e2e:prod
```

**Linux / macOS:**
```bash
PLAYWRIGHT_BASE_URL=https://archiflow-independent.vercel.app npm run test:e2e:prod
```

או להריץ עם **דפדפן אחד** (אחת אחרי השנייה, גלוי):
```powershell
$env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npm run test:e2e:headed:one
```

## Deep QA (סעיף 6 ב־docs/QA_CHECKLIST.md)

בדיקות מפורטות – דורשות התחברות דרך **כפתור נסתר** בפוטר + **PIN 2189** (super_admin).

**הרצה עם דפדפן אחד, גלוי:**
```powershell
$env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npm run test:e2e:deep:headed
```

**הרצה headless:**
```powershell
$env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npm run test:e2e:deep
```

**PINים לטסטים (כפתור נסתר בפוטר):**
- `2189` – super_admin
- `2188` – אדריכל (architect)
- `2187` – לקוח (client)
- `2186` – יועץ (consultant)
- `2185` – קבלן (contractor)

## בדיקה רציפה אחת (QA Journey)

בדיקה **אחת** שמריצה דפדפן **פתוח לאורך כל הריצה**: מתחברת לכל תפקיד (super_admin → architect → client → consultant → contractor), מבצעת משימות לפי תפקיד, מתנתקת ועוברת לתפקיד הבא – **בלי לסגור את הדפדפן**.

```powershell
$env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npm run test:e2e:journey:headed
```

## דרישות

1. **שרת רץ** – `npm run dev` ב־localhost:5173 (או הגדר `PLAYWRIGHT_BASE_URL`).
2. **בדיקת לוח שנה (add-event)** – משתמש **מחובר**. אם לא מחובר, הבדיקה תדלג עם הודעה.

## איך להריץ את בדיקת "הוסף אירוע"

1. הפעל: `npm run dev`
2. בדפדפן: התחבר למערכת, עבור ללוח שנה
3. בטרמינל: `npm run test:e2e:headed` (תראה את הדפדפן והבדיקה תרוץ)

## Selectors יציבים

בקוד יש `data-testid` לאלמנטים קריטיים:

- `add-event-btn` – כפתור "חדש" בדף לוח שנה
- `add-event-title` – שדה כותרת בטופס אירוע
- `add-event-submit` – כפתור "הוסף אירוע" / שמירה
- `admin-bypass-trigger` – כפתור נסתר (נקודה) בפוטר לכניסת PIN
- `admin-bypass-pin-input` – שדה הזנת PIN
- `admin-bypass-submit` – כפתור "אישור" בדיאלוג PIN
- `new-project-btn` – כפתור "פרויקט חדש" בדף Projects
- `add-client-btn` – כפתור "לקוח חדש" בדף Clients
- `logout-btn` – כפתור "התנתק" בדף Settings

כדי להוסיף בדיקות – הוסף `data-testid` לקומפוננטות והשתמש ב־`page.getByTestId('...')`.

## קבצי בדיקה

| קובץ | תיאור | פקודת הרצה |
|------|-------|------------|
| `qa-full-journey.spec.ts` | בדיקה רציפה מלאה - כל התפקידים והזרימות | `npm run test:e2e:full:headed` |
| `qa-project-stages.spec.ts` | **חדש!** בדיקות כל שלבי פרויקט (הקלטה, גנט, הצעות, בחירות, היתרים, ביצוע, סיום, מדידה) | `npx playwright test qa-project-stages --headed` |
| `qa-digital-signatures.spec.ts` | **חדש!** בדיקות חתימות דיגיטליות (canvas, שמירה, דפים ציבוריים) | `npx playwright test qa-digital-signatures --headed` |
| `qa-messaging.spec.ts` | **חדש!** בדיקות מערכת הודעות (קבלנים, יועצים, מנהל) | `npx playwright test qa-messaging --headed` |
| `qa-portals.spec.ts` | בדיקות פורטלים (לקוח/קבלן/יועץ/ספק) + הגשת הצעות מחיר | `npx playwright test qa-portals --headed` |
| `qa-timer-only.spec.ts` | בדיקת טיימר בלבד | `npx playwright test qa-timer-only --headed` |
| `qa-financials.spec.ts` | בדיקות פיננסים - הוצאות, חשבוניות, קבלות | `npx playwright test qa-financials --headed` |
| `qa-journal.spec.ts` | בדיקות יומן רשומות | `npx playwright test qa-journal --headed` |
| `qa-meeting-summaries.spec.ts` | בדיקות סיכומי פגישות עם AI | `npx playwright test qa-meeting-summaries --headed` |
| `qa-user-management.spec.ts` | בדיקות ניהול משתמשים | `npx playwright test qa-user-management --headed` |
| `qa-proposal-templates.spec.ts` | בדיקות תבניות הצעות מחיר | `npx playwright test qa-proposal-templates --headed` |
| `qa-notifications.spec.ts` | בדיקות מערכת התראות | `npx playwright test qa-notifications --headed` |
| `qa-ai-features.spec.ts` | בדיקות פיצ'רי AI (moodboard, image gen) | `npx playwright test qa-ai-features --headed` |
| `qa-misc-pages.spec.ts` | בדיקות דפים נוספים (Team, Support, Blog, ThemeSettings, SuperAdmin) | `npx playwright test qa-misc-pages --headed` |

### בדיקות חדשות (01/02/2026)

הוספנו בדיקות מקיפות לפיצ'רים שתוקנו:

1. **qa-project-stages.spec.ts** - 35 בדיקות לכל שלבי ניהול פרויקט:
   - FirstMeetingSubStage: הקלטה, צ'קליסט
   - GanttStage: יצירת AI, סנכרון לוח שנה, אבני דרך
   - ProposalStage: הצעות, חתימה, הנחה/מע"מ
   - SelectionsStage: עריכה, ולידציה, סטטוסים
   - PermitsStage: העלאה, לינק רישוי, דילוג
   - ExecutionStage: התקדמות, משימות
   - CompletionStage: תמונות, פורטפוליו, שיתוף
   - SurveyStage: טאבים, מחיקת קבצים

2. **qa-digital-signatures.spec.ts** - 8 בדיקות לחתימות דיגיטליות:
   - פתיחת דיאלוג חתימה
   - ציור על Canvas
   - כפתור ניקוי
   - דפים ציבוריים (PublicApproval, PublicContractorQuote)

3. **qa-messaging.spec.ts** - 8 בדיקות למערכת הודעות:
   - הודעות קבלנים
   - הודעות יועצים
   - תצוגת מנהל

### הרצת כל הבדיקות יחד

```powershell
$env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npx playwright test tests/e2e/ --headed
```

### הרצת בדיקה ספציפית

```powershell
$env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npx playwright test tests/e2e/qa-financials.spec.ts --headed
```

## תוצאות

- דוח HTML: `npx playwright show-report` אחרי הרצה
- צילומי מסך: ב־`test-results/` כשהבדיקה נכשלת
- Trace: `npx playwright show-trace trace.zip` לניתוח כשלים
