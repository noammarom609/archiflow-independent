# בעיות בדף לוח שנה – הסבר ותיקון

## מה אתה רואה בקונסול

1. **401 Unauthorized** – בקשות ל-Supabase נכשלות:
   - `meeting_slots?select=*&status=eq.pending_approval`
   - `notifications?select=*&order=created_date.desc&limit=50`

2. **PGRST301** – הודעת השגיאה:
   - `"None of the keys was able to decode the JWT"`
   - `"No suitable key or wrong key type"`

---

## למה זה קורה

### הזרימה הנוכחית

1. אתה מתחבר עם **Clerk** (אימות משתמשים).
2. האפליקציה מקבלת מ-Clerk **JWT** (תבנית בשם `supabase`).
3. כל קריאה ל-Supabase (meeting_slots, notifications, calendar_events וכו') נשלחת עם ה-header:
   ```
   Authorization: Bearer <Clerk JWT>
   ```
4. **Supabase (PostgREST)** מנסה לאמת את ה-JWT עם **מפתח החתימה שלו** (מה-dashboard של Supabase).
5. ה-JWT נחתם על ידי **Clerk** עם מפתח אחר – ולכן Supabase לא מצליח לאמת אותו.
6. התוצאה: **401** ו-**PGRST301** – "אין מפתח שמצליח לפענח/לאמת את ה-JWT".

במילים פשוטות: **ה-JWT של Clerk נחתם עם מפתח אחד, ו-Supabase מחפש מפתח אחר –所以他们 לא תואמים.**

---

## איך RLS משתמש ב-JWT

ב-DB יש פונקציות כמו `public.jwt_email()` שמקבלות את המייל מה-JWT (למשל `request.jwt.claims`).  
כש-Supabase לא מצליח לפענח את ה-JWT, `request.jwt.claims` לא מוגדר, ו-RLS מחזיר "אין הרשאה" – ולכן אתה מקבל 401 על טבלאות כמו `meeting_slots` ו-`notifications`.

---

## הפתרון: לסנכרן את מפתח החתימה בין Clerk ל-Supabase

צריך ש-**Clerk** יחתום את ה-JWT עם **אותו מפתח** ש-Supabase משתמש בו לאימות.

### צעד 1: ב-Supabase Dashboard – איזה מפתח להעתיק

ב-Supabase יש כמה סוגי מפתחות. **המפתח שאנחנו צריכים** הוא זה ש-PostgREST משתמש בו כדי **לאמת** את ה-JWT שנשלח בבקשות (ה-Bearer token).

- **אל תשתמש ב:**  
  - **JWT Signing Keys** → Current Key (מפתח **ECC P-256**) – זה מפתח א-סימטרי, לא מתאים כאן.  
  - **KEY ID** (ה-UUID כמו `1540238E-261E-4B12-...`) – זה מזהה מפתח, לא הסוד עצמו.

- **השתמש בזה:**  
  1. עבור לטאב **"Legacy JWT Secret"** (לא "JWT Signing Keys").  
  2. בשדה **"Legacy JWT secret (still used)"** – לחץ על **Reveal**.  
  3. **העתק את כל המחרוזת** שמופיעה (מחרוזת ארוכה – הסוד האמיתי).  
  4. את **המחרוזת הזו** תדביק ב-Clerk (בשלב הבא).

### צעד 2: ב-Clerk Dashboard

1. היכנס ל-Clerk → הפרויקט שלך → **JWT Templates**.
2. מצא או צור תבנית בשם **supabase** (כמו שהקוד משתמש: `getToken({ template: 'supabase' })`).
3. הפעל **Custom signing key** (או "Use custom signing key").
4. הדבק את **אותו Shared Secret** שהעתקת מ-Supabase.
5. וודא שב-JWT יש claim של **email** (למשל `email` או `primary_email_address`) – כי `jwt_email()` קורא מהם.

### צעד 3: בדיקה

1. התנתק והתחבר מחדש באפליקציה (כדי לקבל JWT חדש מ-Clerk).
2. רענן את דף לוח השנה ובדוק שוב את הקונסול – ה-401 ו-PGRST301 אמורים להיעלם אם המפתחות תואמים.

---

## סיכום

| בעיה           | סיבה                                      | תיקון                                      |
|----------------|-------------------------------------------|--------------------------------------------|
| 401 Unauthorized | Supabase דוחה את הבקשה כי ה-JWT לא מאומת | לסנכרן מפתח חתימה בין Clerk ל-Supabase    |
| PGRST301        | Supabase לא מצליח לפענח/לאמת את ה-JWT    | אותו תיקון – Clerk יחתום עם המפתח של Supabase |

אחרי סנכרון המפתחות, דף לוח השנה (וגם meeting_slots ו-notifications) אמורים לעבוד בלי 401 ו-PGRST301.
