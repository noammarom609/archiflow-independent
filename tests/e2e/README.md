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

## תוצאות

- דוח HTML: `npx playwright show-report` אחרי הרצה
- צילומי מסך: ב־`test-results/` כשהבדיקה נכשלת
- Trace: `npx playwright show-trace trace.zip` לניתוח כשלים
