# Edge Functions Setup Guide

## הבעיה
Edge Functions מחזירות שגיאת 401 (Unauthorized). זה קורה כי:
1. הפונקציות לא פרוסות ב-Supabase
2. חסרים Secrets נדרשים

## פריסת Edge Functions

### 1. התקנת Supabase CLI
```bash
npm install -g supabase
```

### 2. התחברות לפרויקט
```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. הגדרת Secrets
הוסף את ה-secrets הבאים בדשבורד של Supabase תחת Project Settings > Edge Functions > Secrets:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

לקבלת Google OAuth credentials:
1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. צור פרויקט חדש או בחר קיים
3. הפעל את Google Calendar API
4. צור OAuth 2.0 credentials
5. הוסף את ה-redirect URI: `https://YOUR_APP_URL/oauth/callback`

### 4. פריסת הפונקציות
```bash
# פריסת כל הפונקציות
supabase functions deploy

# או פריסת פונקציה ספציפית
supabase functions deploy user-google-calendar
supabase functions deploy check-user-by-email
```

### 5. אימות שהפונקציות פרוסות
עבור ל-Supabase Dashboard > Edge Functions ווודא שהפונקציות מופיעות עם סטטוס Active.

## בדיקת Secrets
כדי לוודא שה-secrets מוגדרים נכון, הרץ:
```bash
supabase secrets list
```

## Troubleshooting

### 401 Unauthorized
- וודא שה-functions פרוסות
- וודא שה-anon key נכון ב-.env
- בדוק את ה-CORS headers בפונקציה

### 500 Internal Server Error
- בדוק שכל ה-secrets מוגדרים
- בדוק logs: `supabase functions logs user-google-calendar`

### Google Calendar לא עובד
- וודא שה-GOOGLE_CLIENT_ID וה-GOOGLE_CLIENT_SECRET מוגדרים
- וודא שה-redirect URI מוגדר נכון ב-Google Console
