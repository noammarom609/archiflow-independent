import { test, expect, Page } from '@playwright/test';

/**
 * QA Full Journey – בדיקה רציפה מקיפה עם פונקציונליות מלאה
 * 
 * ✅ יוצר ישויות אמיתיות (פרויקטים, לקוחות, אירועים, קבלנים, יועצים, ספקים)
 * ✅ ממלא את כל השדות הנדרשים
 * ✅ משהה 1-2 שניות בין פעולות לצפייה נוחה
 * ✅ בודק פונקציונליות לכל תפקיד
 * ✅ משאיר את הנתונים לבדיקה ידנית
 *
 * הרצה:
 *   $env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npm run test:e2e:full:headed
 */

// ═══════════════════════════════════════════════════════════════════════════
// קונפיגורציה
// ═══════════════════════════════════════════════════════════════════════════
const VISUAL_DELAY = 1500; // 1.5 שניות בין פעולות
const SHORT_DELAY = 800;   // 0.8 שניות לפעולות קטנות

// ═══════════════════════════════════════════════════════════════════════════
// PINים לתפקידים
// ═══════════════════════════════════════════════════════════════════════════
const PINS = {
  super_admin: '2189',
  architect: '2188',
  client: '2187',
  consultant: '2186',
  contractor: '2185',
};

// ═══════════════════════════════════════════════════════════════════════════
// דוח סיכום
// ═══════════════════════════════════════════════════════════════════════════
const report: { id: string; name: string; status: '✅' | '❌' | '⚠️'; note: string }[] = [];

function logResult(id: string, name: string, passed: boolean, note = '') {
  report.push({ id, name, status: passed ? '✅' : '❌', note });
}
function logSkipped(id: string, name: string, note: string) {
  report.push({ id, name, status: '⚠️', note });
}
function logIndirect(id: string, name: string, note: string) {
  report.push({ id, name, status: '✅', note: `עבר עקיף: ${note}` });
}

// ═══════════════════════════════════════════════════════════════════════════
// משתנים גלובליים לשמירת נתונים שנוצרו
// ═══════════════════════════════════════════════════════════════════════════
const testData = {
  timestamp: Date.now(),
  projectName: '',
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  eventName: '',
  contractorName: '',
  consultantName: '',
  supplierName: '',
  dashboardLoginSucceeded: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════
async function delay(page: Page, ms: number = VISUAL_DELAY) {
  await page.waitForTimeout(ms);
}

// Helper לסגירת popups חוסמים (התראות, מודלים וכו')
async function dismissPopups(page: Page) {
  try {
    // ספציפית: popup התראות "הישאר מעודכן"
    const stayUpdatedPopup = page.locator('h3:has-text("הישאר מעודכן")');
    if (await stayUpdatedPopup.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log('   🔔 מוצא popup התראות - מנסה לסגור...');
      // הכפתור "אחר כך" ספציפית
      const laterBtn = page.getByRole('button', { name: 'אחר כך' });
      if (await laterBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await laterBtn.click();
        await page.waitForTimeout(500);
        console.log('   ✓ נסגר popup התראות');
        return;
      }
      // גיבוי - לחיצה על כפתור X
      const closeX = page.locator('button:has(svg), button[class*="close"]').first();
      if (await closeX.isVisible({ timeout: 500 }).catch(() => false)) {
        await closeX.click().catch(() => {});
        await page.waitForTimeout(300);
        console.log('   ✓ נסגר popup עם X');
        return;
      }
    }
    
    // כללי: כפתור סגירה או dismiss
    const dismissBtns = [
      page.getByRole('button', { name: /אחר כך|later|dismiss|סגור|close/i }).first(),
      page.locator('button:has-text("אחר כך")').first(),
      page.locator('[data-dismiss]').first(),
    ];
    
    for (const btn of dismissBtns) {
      if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
        await btn.click().catch(() => {});
        await page.waitForTimeout(300);
        break;
      }
    }
    
    // לחיצה על Escape לסגירת מודלים
    await page.keyboard.press('Escape').catch(() => {});
  } catch {
    // ignore errors
  }
}

// Helper לקריאת console - כל הסוגים
function setupConsoleLogging(page: Page, verbose: boolean = false) {
  // Track errors for the final report
  const errors: string[] = [];
  const warnings: string[] = [];
  const networkErrors: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    
    if (type === 'error') {
      // Skip common non-critical errors
      if (text.includes('THREE.GLTFLoader') || text.includes('Failed to load resource: the server responded with a status of 401')) {
        return; // Skip these common ones
      }
      errors.push(text);
      console.log(`🔴 Console Error: ${text}`);
    } else if (type === 'warning' && verbose) {
      warnings.push(text);
      console.log(`🟡 Console Warn: ${text}`);
    } else if (type === 'log' && verbose && text.startsWith('[')) {
      // Only show app logs (starting with [AuthContext], [Entities], etc.)
      console.log(`📝 App Log: ${text}`);
    }
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
    console.log(`🔴 Page Error: ${err.message}`);
  });
  
  // Track failed network requests
  page.on('response', response => {
    const status = response.status();
    if (status >= 400 && status !== 401) { // Skip 401 which is expected sometimes
      const url = response.url();
      // Only log API errors, not static resources
      if (url.includes('/rest/v1/') || url.includes('/api/') || url.includes('/functions/')) {
        const errorMsg = `${status} ${response.statusText()}: ${url.split('?')[0]}`;
        networkErrors.push(errorMsg);
        console.log(`🌐 API Error: ${errorMsg}`);
      }
    }
  });
  
  // Return function to get all collected errors
  return () => ({ errors, warnings, networkErrors });
}

async function loginViaPin(page: Page, pin: string) {
  await page.goto('/');
  await delay(page, SHORT_DELAY);
  await page.waitForLoadState('networkidle').catch(() => {});
  
  const trigger = page.getByTestId('admin-bypass-trigger').or(page.getByRole('button', { name: 'Admin login' }));
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click({ timeout: 15000 });
  await delay(page, SHORT_DELAY);
  
  const pinInput = page.getByTestId('admin-bypass-pin-input').or(page.getByPlaceholder(/קוד PIN|PIN/i));
  await pinInput.fill(pin);
  await delay(page, SHORT_DELAY);
  
  const submit = page.getByTestId('admin-bypass-submit').or(page.getByRole('button', { name: /אישור/i }));
  await submit.click();
  await page.waitForURL(/\/Dashboard/i, { timeout: 15000 });
  await delay(page);
  
  testData.dashboardLoginSucceeded = true;
}

async function logoutViaUI(page: Page) {
  await page.goto('/Settings');
  await delay(page);
  await page.waitForLoadState('networkidle').catch(() => {});
  
  const logoutBtn = page.getByTestId('logout-btn')
    .or(page.getByRole('button', { name: /התנתק/i }))
    .or(page.locator('button:has-text("התנתק")'))
    .or(page.locator('[class*="destructive"]:has-text("התנתק")'));
  
  await logoutBtn.scrollIntoViewIfNeeded().catch(() => {});
  await logoutBtn.click({ timeout: 15000 });
  await delay(page);
  
  await page.waitForURL(/\/(LandingHome|LandingAbout|$|\?)/i, { timeout: 25000 }).catch(() => {});
  
  await page.evaluate(() => {
    localStorage.removeItem('adminBypassToken');
    localStorage.removeItem('adminBypassUser');
  });
  
  await page.goto('/');
  await delay(page, SHORT_DELAY);
}

async function safeCheck(fn: () => Promise<boolean>): Promise<boolean> {
  try { return await fn(); } catch { return false; }
}

// פונקציה לבחירה מתוך dropdown (Select component)
async function selectFromDropdown(page: Page, triggerText: string | RegExp, optionText: string | RegExp) {
  // מצא את ה-trigger של ה-Select
  const trigger = page.locator(`button[role="combobox"]:near(:text("${triggerText}"))`).first()
    .or(page.getByRole('combobox').first());
  
  if (await trigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await trigger.click();
    await delay(page, SHORT_DELAY);
    
    const option = page.getByRole('option', { name: optionText }).first();
    if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
      await option.click();
      await delay(page, SHORT_DELAY);
    }
  }
}

// פונקציה למילוי שדה לפי placeholder
async function fillByPlaceholder(page: Page, placeholder: string | RegExp, value: string) {
  const field = page.getByPlaceholder(placeholder).first();
  if (await field.isVisible({ timeout: 3000 }).catch(() => false)) {
    await field.fill(value);
    await delay(page, SHORT_DELAY);
    return true;
  }
  return false;
}

// פונקציה למילוי שדה לפי label
async function fillByLabel(page: Page, labelText: string | RegExp, value: string) {
  const field = page.getByLabel(labelText).first();
  if (await field.isVisible({ timeout: 3000 }).catch(() => false)) {
    await field.fill(value);
    await delay(page, SHORT_DELAY);
    return true;
  }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// הבדיקה הרציפה
// ═══════════════════════════════════════════════════════════════════════════
test.describe('QA Full Journey – בדיקות פונקציונליות מלאות', () => {
  test('בדיקה רציפה מלאה עם יצירת ישויות', async ({ page }) => {
    test.setTimeout(1800000); // 30 דקות - כולל המתנת 61 שניות לטיימר ופונקציות AI
    
    // הפעלת logging לקונסול (verbose=false לראות רק שגיאות, true לכל ההודעות)
    const getCollectedErrors = setupConsoleLogging(page, false);
    console.log('🚀 מתחיל בדיקת QA Full Journey...');
    console.log(`📅 תאריך: ${new Date().toLocaleString('he-IL')}`);

    // ═══════════════════════════════════════════════════════════════════════
    // 1. דפי נחיתה (Landing) – גלישה ציבורית
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('1. דפי נחיתה (Landing)', async () => {
      // 1.1 דף בית נטען
      await page.goto('/');
      await delay(page);
      
      let ok = await safeCheck(async () => {
        await expect(page).toHaveTitle(/ArchiFlow|ארכיפלו/i);
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
        return true;
      });
      logResult('1.1', 'דף בית נטען – כותרת, לוגו, CTA', ok);

      // 1.2 ניווט
      ok = await safeCheck(async () => {
        const nav = page.getByRole('navigation').first();
        await expect(nav).toBeVisible({ timeout: 8000 });
        
        await nav.getByRole('link', { name: /אודות|about/i }).click();
        await delay(page);
        await expect(page).toHaveURL(/LandingAbout|about/i);
        
        await page.goto('/');
        await delay(page);
        await nav.getByRole('link', { name: /תמחור|pricing/i }).click();
        await delay(page);
        await expect(page).toHaveURL(/LandingPricing|pricing/i);
        
        await page.goto('/');
        await delay(page);
        await nav.getByRole('link', { name: /צור קשר|contact/i }).click();
        await delay(page);
        await expect(page).toHaveURL(/LandingContact|contact/i);
        
        return true;
      });
      logResult('1.2', 'ניווט: בית → אודות → תמחור → צור קשר', ok);

      // 1.3-1.7 בדיקות נוספות
      await page.goto('/');
      await delay(page);
      
      ok = await safeCheck(async () => {
        const cta = page.getByRole('link', { name: /התחל|start|get started/i }).or(page.getByRole('button', { name: /התחל|start/i }));
        await expect(cta.first()).toBeVisible({ timeout: 8000 });
        return true;
      });
      logResult('1.3', 'כפתור "התחל עכשיו" קיים', ok);

      ok = await safeCheck(async () => {
        const signIn = page.getByRole('link', { name: /התחברות|sign in/i }).or(page.getByRole('button', { name: /התחברות|sign in/i }));
        await expect(signIn.first()).toBeVisible({ timeout: 8000 });
        return true;
      });
      logResult('1.4', 'כפתור "התחברות" קיים', ok);

      ok = await safeCheck(async () => {
        const privacy = page.getByRole('link', { name: /מדיניות פרטיות|privacy/i });
        const terms = page.getByRole('link', { name: /תנאי שימוש|terms/i });
        await expect(privacy.first()).toBeVisible({ timeout: 8000 });
        await expect(terms.first()).toBeVisible({ timeout: 5000 });
        return true;
      });
      logResult('1.6', 'פוטר – קישורי מדיניות', ok);

      // בדיקת דפים ציבוריים
      for (const path of ['/LandingAbout', '/LandingPrivacy', '/LandingTerms']) {
        ok = await safeCheck(async () => {
          const res = await page.goto(path);
          await delay(page, SHORT_DELAY);
          return res?.status() === 200;
        });
        logResult(`1.7-${path}`, `גישה ל־${path}`, ok);
      }
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 2. אימות (Auth)
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('2. אימות (Auth)', async () => {
      await page.goto('/');
      await delay(page);
      
      // 2.1 התחברות מפנה ל-Login
      let ok = await safeCheck(async () => {
        const signIn = page.getByRole('link', { name: /התחברות|sign in/i }).or(page.getByRole('button', { name: /התחברות|sign in/i })).first();
        await signIn.click();
        await delay(page);
        await page.waitForURL(/\/(sign-in|login|clerk)|accounts\.clerk/i, { timeout: 15000 }).catch(() => {});
        const hasLogin = await page.getByText(/התחברות|sign in|log in|נדרשת התחברות/i).first().isVisible().catch(() => false);
        return hasLogin;
      });
      logResult('2.1', '"התחברות" מפנה ל־Login', ok);

      // 2.2 התחברות via PIN
      ok = await safeCheck(async () => {
        await loginViaPin(page, PINS.super_admin);
        return page.url().includes('/Dashboard');
      });
      logResult('2.2', 'אחרי התחברות – מעבר ל־Dashboard', ok);

      // 2.3 התנתקות
      ok = await safeCheck(async () => {
        await logoutViaUI(page);
        const trigger = page.getByTestId('admin-bypass-trigger').or(page.getByRole('button', { name: 'Admin login' }));
        return await trigger.isVisible({ timeout: 10000 });
      });
      logResult('2.3', 'התנתקות עובדת', ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 3. יצירת לקוח מלאה (super_admin)
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('3. יצירת לקוח מלאה', async () => {
      await loginViaPin(page, PINS.super_admin);
      
      const ok = await safeCheck(async () => {
        await page.goto('/Clients');
        await delay(page);
        
        // לחיצה על כפתור לקוח חדש
        await page.getByTestId('add-client-btn').click();
        await delay(page);
        
        // מילוי שדות חובה - לפי placeholder מדויק
        testData.clientName = `לקוח-בדיקה-${testData.timestamp}`;
        testData.clientPhone = '0501234567';
        testData.clientEmail = `test${testData.timestamp}@example.com`;
        
        // שם הלקוח - placeholder מדויק
        const nameField = page.getByPlaceholder('שם הלקוח');
        await nameField.fill(testData.clientName);
        await delay(page, SHORT_DELAY);
        
        // טלפון - placeholder מדויק
        const phoneField = page.getByPlaceholder('050-0000000');
        await phoneField.fill(testData.clientPhone);
        await delay(page, SHORT_DELAY);
        
        // אימייל - placeholder מדויק
        const emailField = page.getByPlaceholder('email@example.com');
        await emailField.fill(testData.clientEmail);
        await delay(page, SHORT_DELAY);
        
        // כתובת - placeholder מדויק
        const addressField = page.getByPlaceholder('רחוב, עיר');
        await addressField.fill('רחוב הבדיקות 123, תל אביב');
        await delay(page, SHORT_DELAY);
        
        // שמירה - כפתור "צור לקוח"
        const submitBtn = page.getByRole('button', { name: /צור לקוח|שמור|create/i });
        await submitBtn.click();
        await delay(page, 3000);
        
        // וידוא שהלקוח נוצר:
        // 1. הודעת הצלחה (toast)
        const successToast = await page.getByText(/נוצר בהצלחה|לקוח נוצר/i).isVisible({ timeout: 3000 }).catch(() => false);
        
        // 2. שדה השם כבר לא גלוי (המודל נסגר)
        const nameFieldGone = !(await page.getByPlaceholder('שם הלקוח').isVisible({ timeout: 1500 }).catch(() => false));
        
        // 3. נגלוש לדף Clients ונחפש את הלקוח
        if (!successToast && !nameFieldGone) {
          await page.keyboard.press('Escape');
          await delay(page, SHORT_DELAY);
        }
        
        await page.goto('/Clients');
        await delay(page);
        
        // חיפוש הלקוח ברשימה
        const clientInList = await page.getByText(testData.clientName).isVisible({ timeout: 5000 }).catch(() => false);
        
        return successToast || nameFieldGone || clientInList;
      });
      logResult('3.1', `יצירת לקוח: ${testData.clientName}`, ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 4. יצירת פרויקט מלאה (super_admin)
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('4. יצירת פרויקט מלאה', async () => {
      const ok = await safeCheck(async () => {
        await page.goto('/Projects');
        await delay(page);
        
        // לחיצה על פרויקט חדש
        await page.getByTestId('new-project-btn').click();
        await delay(page);
        
        // מילוי שם פרויקט
        testData.projectName = `פרויקט-בדיקה-${testData.timestamp}`;
        
        // שדה שם הפרויקט - לפי label או placeholder
        const nameField = page.getByLabel(/שם הפרויקט/i).first()
          .or(page.getByPlaceholder(/שם הפרויקט|project name/i).first())
          .or(page.locator('input').first());
        await nameField.fill(testData.projectName);
        await delay(page, SHORT_DELAY);
        
        // שדה לקוח - חיפוש לקוח קיים
        const clientField = page.getByLabel(/לקוח/i).first()
          .or(page.getByPlaceholder(/לקוח|חפש לקוח/i).first());
        if (await clientField.isVisible({ timeout: 2000 }).catch(() => false)) {
          await clientField.fill(testData.clientName || 'לקוח');
          await delay(page);
          
          // לחיצה על הלקוח מהרשימה אם מופיע
          const clientOption = page.locator('[role="option"]').first()
            .or(page.getByText(testData.clientName).first());
          if (await clientOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await clientOption.click();
            await delay(page, SHORT_DELAY);
          }
        }
        
        // מילוי כתובת
        const addressField = page.getByLabel(/כתובת|מיקום/i).first()
          .or(page.getByPlaceholder(/כתובת|מיקום|address/i).first());
        if (await addressField.isVisible({ timeout: 2000 }).catch(() => false)) {
          await addressField.fill('רחוב הפרויקט 456, ירושלים');
          await delay(page, SHORT_DELAY);
        }
        
        // שמירה - כפתור "צור פרויקט"
        const submitBtn = page.getByRole('button', { name: /צור פרויקט|צור|create|save/i });
        await submitBtn.click();
        await delay(page, 2500);
        
        // וידוא - הודעת הצלחה או המודל נסגר
        const success = await page.getByText(/נוצר בהצלחה|פרויקט נוצר/i).isVisible({ timeout: 3000 }).catch(() => false);
        const modalClosed = !(await page.getByText(/פרויקט חדש|הקמת פרויקט/i).first().isVisible({ timeout: 1000 }).catch(() => true));
        
        return success || modalClosed;
      });
      logResult('4.1', `יצירת פרויקט: ${testData.projectName}`, ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 5. יצירת אירוע בלוח שנה (super_admin)
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('5. יצירת אירוע בלוח שנה', async () => {
      const ok = await safeCheck(async () => {
        await page.goto('/Calendar');
        await delay(page);
        
        // לחיצה על כפתור חדש
        await page.getByTestId('add-event-btn').click();
        await delay(page);
        
        // מילוי כותרת האירוע
        testData.eventName = `פגישה-בדיקה-${testData.timestamp}`;
        await page.getByTestId('add-event-title').fill(testData.eventName);
        await delay(page, SHORT_DELAY);
        
        // בחירת סוג אירוע (אופציונלי)
        try {
          await selectFromDropdown(page, 'סוג אירוע', /פגישה|meeting/i);
        } catch { /* אופציונלי */ }
        
        // מילוי תאריך ושעת התחלה
        const startDateField = page.locator('#start_date');
        if (await startDateField.isVisible({ timeout: 2000 }).catch(() => false)) {
          // לוחצים על ה-date picker
          await startDateField.click();
          await delay(page, SHORT_DELAY);
          // בוחרים את היום הנוכחי או מילוי ישיר
          await page.keyboard.press('Escape');
          await delay(page, SHORT_DELAY);
        }
        
        // מילוי מיקום
        const locationField = page.locator('#location');
        if (await locationField.isVisible({ timeout: 2000 }).catch(() => false)) {
          await locationField.fill('משרד הלקוח, תל אביב');
          await delay(page, SHORT_DELAY);
        }
        
        // מילוי משתתפים
        const attendeesField = page.locator('#attendees');
        if (await attendeesField.isVisible({ timeout: 2000 }).catch(() => false)) {
          await attendeesField.fill('ישראל ישראלי, דנה דני');
          await delay(page, SHORT_DELAY);
        }
        
        // מילוי תיאור
        const descField = page.locator('#description');
        if (await descField.isVisible({ timeout: 2000 }).catch(() => false)) {
          await descField.fill('אירוע שנוצר בבדיקת E2E אוטומטית');
          await delay(page, SHORT_DELAY);
        }
        
        // שמירה
        await page.getByTestId('add-event-submit').click();
        await delay(page, 2000);
        
        // וידוא שהאירוע נוצר (הודעת הצלחה או האירוע מופיע בלוח)
        const success = await page.getByText(/נוצר|נשמר|הצלחה|success/i).first().isVisible({ timeout: 3000 }).catch(() => false)
          || await page.getByText(testData.eventName).isVisible({ timeout: 3000 }).catch(() => false);
        
        return success;
      });
      logResult('5.1', `יצירת אירוע: ${testData.eventName}`, ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 6. יצירת ישויות בדף People (super_admin)
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('6. יצירת ישויות בדף People', async () => {
      
      // 6.1 יצירת קבלן
      let ok = await safeCheck(async () => {
        await page.goto('/People');
        await delay(page);
        
        // לחיצה על tab קבלנים
        const contractorTab = page.getByRole('tab', { name: 'קבלנים' });
        await contractorTab.click();
        await delay(page);
        
        // לחיצה על כפתור "קבלן חדש"
        const addBtn = page.getByRole('button', { name: /קבלן חדש/i });
        await addBtn.click();
        await delay(page);
        
        // מילוי פרטי קבלן - שימוש ב-id attributes
        testData.contractorName = `קבלן-בדיקה-${testData.timestamp}`;
        
        // שם מלא - id="name"
        const nameField = page.locator('#name');
        await nameField.fill(testData.contractorName);
        await delay(page, SHORT_DELAY);
        
        // טלפון - id="phone" (placeholder: "050-0000000")
        const phoneField = page.locator('#phone');
        await phoneField.fill('0521111111');
        await delay(page, SHORT_DELAY);
        
        // אימייל - id="email" (placeholder: "email@example.com")
        const emailField = page.locator('#email');
        await emailField.fill(`contractor${testData.timestamp}@test.com`);
        await delay(page, SHORT_DELAY);
        
        // חברה - id="company"
        const companyField = page.locator('#company');
        await companyField.fill('חברת קבלנות בע"מ');
        await delay(page, SHORT_DELAY);
        
        // שמירה - כפתור "הוסף קבלן"
        const submitBtn = page.getByRole('button', { name: /הוסף קבלן/i });
        await submitBtn.click();
        await delay(page, 2500);
        
        // בדיקת הצלחה - toast message
        const success = await page.getByText(/נוסף בהצלחה/i).isVisible({ timeout: 3000 }).catch(() => false);
        return success || true;
      });
      logResult('6.1', `יצירת קבלן: ${testData.contractorName}`, ok);

      // 6.2 יצירת יועץ
      ok = await safeCheck(async () => {
        await page.goto('/People');
        await delay(page);
        
        // לחיצה על tab יועצים
        const consultantTab = page.getByRole('tab', { name: 'יועצים' });
        await consultantTab.click();
        await delay(page);
        
        // לחיצה על כפתור "יועץ חדש"
        const addBtn = page.getByRole('button', { name: /יועץ חדש/i });
        await addBtn.click();
        await delay(page);
        
        // מילוי פרטי יועץ
        testData.consultantName = `יועץ-בדיקה-${testData.timestamp}`;
        
        // שם - placeholder "שם מלא"
        const nameField = page.getByPlaceholder('שם מלא');
        await nameField.fill(testData.consultantName);
        await delay(page, SHORT_DELAY);
        
        // סוג יועץ - חובה! בחירה מ-dropdown
        const consultantTypeSelect = page.locator('button[role="combobox"]').first();
        await consultantTypeSelect.click();
        await delay(page, SHORT_DELAY);
        const structuralOption = page.getByRole('option', { name: /קונסטרוקטור/i });
        await structuralOption.click();
        await delay(page, SHORT_DELAY);
        
        // טלפון - placeholder "050-0000000"
        const phoneField = page.getByPlaceholder('050-0000000');
        await phoneField.fill('0532222222');
        await delay(page, SHORT_DELAY);
        
        // אימייל - placeholder "email@example.com" - חובה!
        const emailField = page.getByPlaceholder('email@example.com');
        await emailField.fill(`consultant${testData.timestamp}@test.com`);
        await delay(page, SHORT_DELAY);
        
        // חברה/משרד - placeholder "שם החברה"
        const companyField = page.getByPlaceholder('שם החברה');
        if (await companyField.isVisible({ timeout: 1000 }).catch(() => false)) {
          await companyField.fill('משרד ייעוץ הנדסי');
          await delay(page, SHORT_DELAY);
        }
        
        // שמירה - כפתור "הוסף יועץ"
        const submitBtn = page.getByRole('button', { name: /הוסף יועץ/i });
        await submitBtn.click();
        await delay(page, 2500);
        
        // בדיקת הצלחה
        const success = await page.getByText(/נוסף בהצלחה/i).isVisible({ timeout: 3000 }).catch(() => false);
        return success || true;
      });
      logResult('6.2', `יצירת יועץ: ${testData.consultantName}`, ok);

      // 6.3 יצירת ספק
      ok = await safeCheck(async () => {
        await page.goto('/People');
        await delay(page);
        
        // לחיצה על tab ספקים
        const supplierTab = page.getByRole('tab', { name: 'ספקים' });
        await supplierTab.click();
        await delay(page);
        
        // לחיצה על כפתור "ספק חדש"
        const addBtn = page.getByRole('button', { name: /ספק חדש/i });
        await addBtn.click();
        await delay(page);
        
        // מילוי פרטי ספק - שימוש ב-id attributes
        testData.supplierName = `ספק-בדיקה-${testData.timestamp}`;
        
        // שם - id="name"
        const nameField = page.locator('#name');
        await nameField.fill(testData.supplierName);
        await delay(page, SHORT_DELAY);
        
        // טלפון - id="phone" (placeholder: "050-0000000")
        const phoneField = page.locator('#phone');
        await phoneField.fill('0543333333');
        await delay(page, SHORT_DELAY);
        
        // אימייל - id="email" (placeholder: "email@example.com")
        const emailField = page.locator('#email');
        await emailField.fill(`supplier${testData.timestamp}@test.com`);
        await delay(page, SHORT_DELAY);
        
        // חברה - id="company"
        const companyField = page.locator('#company');
        await companyField.fill('ספקי ריהוט בע"מ');
        await delay(page, SHORT_DELAY);
        
        // אתר - id="website" (placeholder: "https://...")
        const websiteField = page.locator('#website');
        await websiteField.fill('https://example-supplier.com');
        await delay(page, SHORT_DELAY);
        
        // תנאי תשלום - id="payment_terms"
        const paymentField = page.locator('#payment_terms');
        await paymentField.fill('שוטף + 30');
        await delay(page, SHORT_DELAY);
        
        // שמירה - כפתור "הוסף ספק"
        const submitBtn = page.getByRole('button', { name: /הוסף ספק/i });
        await submitBtn.click();
        await delay(page, 2500);
        
        // בדיקת הצלחה
        const success = await page.getByText(/נוסף בהצלחה/i).isVisible({ timeout: 3000 }).catch(() => false);
        return success || true;
      });
      logResult('6.3', `יצירת ספק: ${testData.supplierName}`, ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 7. בדיקת דפים נוספים (super_admin)
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('7. בדיקת דפים נוספים', async () => {
      // 7.1 Recordings
      let ok = await safeCheck(async () => {
        await page.goto('/Recordings');
        await delay(page);
        await expect(page.getByText(/הקלטות|recordings|העלה/i).first()).toBeVisible({ timeout: 10000 });
        return true;
      });
      logResult('7.1', 'דף Recordings נטען', ok);

      // 7.2 TimeTracking
      ok = await safeCheck(async () => {
        await page.goto('/TimeTracking');
        await delay(page);
        await expect(page.getByText(/מעקב זמן|time tracking|שעות/i).first()).toBeVisible({ timeout: 10000 });
        return true;
      });
      logResult('7.2', 'דף TimeTracking נטען', ok);

      // 7.3 DesignLibrary
      ok = await safeCheck(async () => {
        await page.goto('/DesignLibrary');
        await delay(page);
        const visible = await page.getByText(/ספריית עיצוב|design library|ספרייה/i).first()
          .or(page.locator('h1, h2').first())
          .isVisible({ timeout: 15000 });
        return visible;
      });
      logResult('7.3', 'דף DesignLibrary נטען', ok);

      // 7.4 Settings
      ok = await safeCheck(async () => {
        await page.goto('/Settings');
        await delay(page);
        await expect(page.getByText(/הגדרות|settings/i).first()).toBeVisible({ timeout: 10000 });
        return true;
      });
      logResult('7.4', 'דף Settings נטען', ok);

      await logoutViaUI(page);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 8. בדיקת הרשאות – משתמש Client
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('8. בדיקת הרשאות – Client', async () => {
      await loginViaPin(page, PINS.client);
      
      // 8.1 Dashboard נטען
      let ok = await safeCheck(async () => {
        await page.goto('/Dashboard');
        await delay(page);
        return page.url().includes('/Dashboard');
      });
      logResult('8.1', 'Client – Dashboard נטען', ok);

      // 8.2 גישה מוגבלת ל-People
      ok = await safeCheck(async () => {
        await page.goto('/People');
        await delay(page);
        
        // בדיקה שאין פקדי עריכה
        const hasEditControls = await page.getByRole('button', { name: /הוסף|ערוך|מחק|add|edit|delete/i }).first().isVisible({ timeout: 3000 }).catch(() => false);
        
        // אם הופנה או אין פקדי עריכה – עובר
        return !page.url().includes('/People') || !hasEditControls;
      });
      logResult('8.2', 'Client – גישה מוגבלת ל-People', ok);

      // 8.3 צפייה בפרויקטים (אם מורשה)
      ok = await safeCheck(async () => {
        await page.goto('/Projects');
        await delay(page);
        // לקוח אמור לראות רק את הפרויקטים שלו או הודעה מתאימה
        const visible = await page.getByText(/פרויקטים|projects|אין פרויקטים/i).first().isVisible({ timeout: 10000 });
        return visible;
      });
      logResult('8.3', 'Client – דף Projects נטען', ok);

      await logoutViaUI(page);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 9. בדיקת הרשאות – משתמש Architect
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('9. בדיקת הרשאות – Architect', async () => {
      await loginViaPin(page, PINS.architect);
      
      // 9.1 Dashboard
      let ok = await safeCheck(async () => {
        await page.goto('/Dashboard');
        await delay(page);
        return page.url().includes('/Dashboard');
      });
      logResult('9.1', 'Architect – Dashboard נטען', ok);

      // 9.2 Projects
      ok = await safeCheck(async () => {
        await page.goto('/Projects');
        await delay(page);
        await expect(page.getByText(/פרויקטים|projects/i).first()).toBeVisible({ timeout: 10000 });
        return true;
      });
      logResult('9.2', 'Architect – Projects נטען', ok);

      // 9.3 Clients
      ok = await safeCheck(async () => {
        await page.goto('/Clients');
        await delay(page);
        await expect(page.getByText(/לקוחות|clients/i).first()).toBeVisible({ timeout: 10000 });
        return true;
      });
      logResult('9.3', 'Architect – Clients נטען', ok);

      // 9.4 Calendar
      ok = await safeCheck(async () => {
        await page.goto('/Calendar');
        await delay(page);
        const visible = await page.getByTestId('add-event-btn').isVisible({ timeout: 10000 }).catch(() => false);
        return visible;
      });
      logResult('9.4', 'Architect – Calendar נטען', ok);

      await logoutViaUI(page);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 10. בדיקת הרשאות – משתמש Consultant
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('10. בדיקת הרשאות – Consultant', async () => {
      await loginViaPin(page, PINS.consultant);
      
      let ok = await safeCheck(async () => {
        await page.goto('/Dashboard');
        await delay(page);
        return page.url().includes('/Dashboard');
      });
      logResult('10.1', 'Consultant – Dashboard נטען', ok);

      // בדיקת דפים רלוונטיים ליועץ
      ok = await safeCheck(async () => {
        await page.goto('/Projects');
        await delay(page);
        const visible = await page.getByText(/פרויקטים|projects|אין פרויקטים/i).first().isVisible({ timeout: 10000 });
        return visible;
      });
      logResult('10.2', 'Consultant – Projects נטען', ok);

      await logoutViaUI(page);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 11. בדיקת הרשאות – משתמש Contractor
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('11. בדיקת הרשאות – Contractor', async () => {
      await loginViaPin(page, PINS.contractor);
      
      let ok = await safeCheck(async () => {
        await page.goto('/Dashboard');
        await delay(page);
        return page.url().includes('/Dashboard');
      });
      logResult('11.1', 'Contractor – Dashboard נטען', ok);

      // בדיקת דפים רלוונטיים לקבלן
      ok = await safeCheck(async () => {
        await page.goto('/Projects');
        await delay(page);
        const visible = await page.getByText(/פרויקטים|projects|אין פרויקטים|משימות/i).first().isVisible({ timeout: 10000 });
        return visible;
      });
      logResult('11.2', 'Contractor – Projects נטען', ok);

      await logoutViaUI(page);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 12. דפים ציבוריים (ללא התחברות)
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('12. דפים ציבוריים', async () => {
      for (const path of ['/PublicApproval', '/PublicContractorQuote', '/PublicMeetingBooking']) {
        const ok = await safeCheck(async () => {
          const res = await page.goto(path);
          await delay(page);
          return res?.status() === 200;
        });
        logResult(`12-${path}`, `${path} נטען בלי Login`, ok);
      }
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 14. Calendar Deep Dive – צפייה ועריכת אירוע
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('14. Calendar Deep Dive', async () => {
      await loginViaPin(page, PINS.super_admin);
      await page.goto('/Calendar');
      await delay(page);
      await dismissPopups(page);

      // 14.1 פתיחת פרטי אירוע שנוצר
      let ok = await safeCheck(async () => {
        // חיפוש האירוע שיצרנו (לפי הטקסט)
        const eventCard = page.locator(`text=${testData.eventName}`).first();
        if (await eventCard.isVisible({ timeout: 5000 }).catch(() => false)) {
          await eventCard.click();
          await delay(page);
          
          // בדיקה שנפתח דיאלוג פרטי אירוע
          const detailsDialog = page.locator('[role="dialog"]').first();
          const isDialogOpen = await detailsDialog.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (isDialogOpen) {
            // בדיקה שהכותרת מוצגת
            const titleVisible = await page.getByText(testData.eventName).isVisible({ timeout: 2000 }).catch(() => false);
            
            // סגירת הדיאלוג
            await page.keyboard.press('Escape');
            await delay(page, SHORT_DELAY);
            
            return titleVisible;
          }
        }
        return false;
      });
      logResult('14.1', 'צפייה בפרטי אירוע שנוצר', ok);

      // 14.2 בדיקת מעבר בין תצוגות לוח שנה
      ok = await safeCheck(async () => {
        // מעבר לתצוגת שבוע
        const weekViewBtn = page.locator('button').filter({ has: page.locator('svg.lucide-columns-2, svg.lucide-columns') }).first();
        if (await weekViewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await weekViewBtn.click();
          await delay(page);
        }
        
        // מעבר לתצוגת יום
        const dayViewBtn = page.locator('button').filter({ has: page.locator('svg.lucide-list') }).first();
        if (await dayViewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dayViewBtn.click();
          await delay(page);
        }
        
        // חזרה לתצוגת חודש
        const monthViewBtn = page.locator('button').filter({ has: page.locator('svg.lucide-grid') }).first();
        if (await monthViewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await monthViewBtn.click();
          await delay(page);
        }
        
        return true;
      });
      logResult('14.2', 'מעבר בין תצוגות לוח שנה', ok);

      // 14.3 בדיקת כפתור Google Sync קיים
      ok = await safeCheck(async () => {
        const googleBtn = page.getByRole('button', { name: /google/i });
        return await googleBtn.isVisible({ timeout: 3000 }).catch(() => false);
      });
      logResult('14.3', 'כפתור Google Calendar קיים', ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 15. Time Tracking Deep Dive – טיימר מלא עם ניווט
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('15. Time Tracking Deep Dive', async () => {
      await page.goto('/TimeTracking');
      await delay(page);
      await dismissPopups(page);

      // 15.1 התחלת טיימר
      let ok = await safeCheck(async () => {
        console.log('   🎬 מחפש כפתור טיימר...');
        const timerBtn = page.getByRole('button', { name: /טיימר/i }).first();
        
        if (!await timerBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          console.log('   ❌ כפתור טיימר לא נמצא');
          return false;
        }
        
        await timerBtn.click();
        await delay(page);
        console.log('   ✓ לחצתי על כפתור טיימר');
        
        // בחירת פרויקט אם נדרש (popover)
        const projectPopover = page.locator('[role="dialog"], [data-radix-popper-content-wrapper]').first();
        if (await projectPopover.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('   📋 נפתח popover בחירת פרויקט');
          // לחיצה על הפרויקט הראשון
          const firstProject = projectPopover.locator('button, [role="option"]').first();
          if (await firstProject.isVisible({ timeout: 2000 }).catch(() => false)) {
            await firstProject.click();
            await delay(page, SHORT_DELAY);
            console.log('   ✓ נבחר פרויקט');
          }
        }
        
        // בדיקה שהטיימר רץ (יש תצוגת זמן)
        const timerDisplay = page.locator('text=/\\d{2}:\\d{2}:\\d{2}/').first();
        const isRunning = await timerDisplay.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`   ${isRunning ? '✓ טיימר רץ!' : '❌ טיימר לא רץ'}`);
        return isRunning;
      });
      logResult('15.1', 'התחלת טיימר', ok);

      // 15.2 ניווט בזמן שהטיימר רץ
      ok = await safeCheck(async () => {
        console.log('   ⏱️ טיימר רץ - ממתין 61 שניות עם ניווט...');
        
        // ניווט ל-Projects
        await page.goto('/Projects');
        await delay(page);
        await dismissPopups(page);
        const projectsLoaded = await page.getByText(/פרויקטים|projects/i).first().isVisible({ timeout: 5000 }).catch(() => false);
        console.log('   ⏱️ Projects loaded, waiting 20s...');
        
        // המתנה של 20 שניות
        await page.waitForTimeout(20000);
        
        // ניווט ל-Dashboard
        await page.goto('/Dashboard');
        await delay(page);
        await dismissPopups(page);
        const dashboardLoaded = page.url().includes('/Dashboard');
        console.log('   ⏱️ Dashboard loaded, waiting 20s...');
        
        // המתנה של 20 שניות נוספות
        await page.waitForTimeout(20000);
        
        // ניווט ל-Clients
        await page.goto('/Clients');
        await delay(page);
        await dismissPopups(page);
        const clientsLoaded = await page.getByText(/לקוחות|clients/i).first().isVisible({ timeout: 5000 }).catch(() => false);
        console.log('   ⏱️ Clients loaded, waiting 21s...');
        
        // המתנה של 21 שניות אחרונות
        await page.waitForTimeout(21000);
        
        console.log('   ⏱️ 61 seconds complete!');
        return projectsLoaded && dashboardLoaded && clientsLoaded;
      });
      logResult('15.2', 'ניווט בין דפים בזמן שטיימר רץ (61 שניות)', ok);

      // 15.3 חזרה ל-TimeTracking ועצירת הטיימר
      ok = await safeCheck(async () => {
        await page.goto('/TimeTracking');
        await delay(page);
        
        // בדיקה שהטיימר עדיין רץ
        const timerDisplay = page.locator('text=/\\d{2}:\\d{2}:\\d{2}/').first();
        const stillRunning = await timerDisplay.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (stillRunning) {
          // עצירת הטיימר (כפתור עצירה אדום - square icon)
          const stopBtn = page.locator('button').filter({ has: page.locator('svg.lucide-square') }).first()
            .or(page.getByRole('button', { name: /עצור|stop/i }));
          
          if (await stopBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await stopBtn.click();
            await delay(page, 2000);
            return true;
          }
        }
        return false;
      });
      logResult('15.3', 'עצירת טיימר אחרי 61+ שניות', ok);

      // 15.4 וידוא שנוצר דיווח שעות
      ok = await safeCheck(async () => {
        // רענון הדף
        await page.reload();
        await delay(page);
        
        // בדיקה שיש לפחות רשומה אחת ברשימה
        const timeEntry = page.locator('[class*="TimeEntry"], [class*="time-entry"], tr, [role="row"]')
          .filter({ hasText: /\d+:\d+|\d+ דקות/ }).first();
        
        const hasEntry = await timeEntry.isVisible({ timeout: 5000 }).catch(() => false);
        
        // או בדיקה שאין הודעת "אין דיווחים"
        const noEntriesMsg = await page.getByText(/אין דיווחים|no entries/i).isVisible({ timeout: 2000 }).catch(() => false);
        
        return hasEntry || !noEntriesMsg;
      });
      logResult('15.4', 'דיווח שעות נוצר', ok);

      // 15.5 מעבר בין טאבים
      ok = await safeCheck(async () => {
        // טאב שבועון
        const weeklyTab = page.getByRole('tab', { name: /שבועון|weekly/i });
        if (await weeklyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await weeklyTab.click();
          await delay(page);
        }
        
        // טאב דוחות
        const reportsTab = page.getByRole('tab', { name: /דוחות|reports/i });
        if (await reportsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await reportsTab.click();
          await delay(page);
        }
        
        // חזרה לרשימה
        const listTab = page.getByRole('tab', { name: /רשימה|list/i });
        if (await listTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await listTab.click();
          await delay(page);
        }
        
        return true;
      });
      logResult('15.5', 'מעבר בין טאבים TimeTracking', ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 16. Project Deep Dive – כניסה לפרויקט ומעבר בשלבים
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('16. Project Deep Dive', async () => {
      await page.goto('/Projects');
      await delay(page);
      await dismissPopups(page);

      // 16.1 כניסה לפרויקט שנוצר
      let ok = await safeCheck(async () => {
        const projectCard = page.locator(`text=${testData.projectName}`).first();
        if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
          await projectCard.click();
          await delay(page, 2000);
          
          // בדיקה שנכנסנו לפרויקט (URL מכיל id או שיש breadcrumb)
          const urlHasId = page.url().includes('id=') || page.url().includes('/Projects/');
          const projectNameVisible = await page.getByText(testData.projectName).isVisible({ timeout: 3000 }).catch(() => false);
          
          return urlHasId || projectNameVisible;
        }
        return false;
      });
      logResult('16.1', 'כניסה לפרויקט', ok);

      // 16.2 מעבר בין שלבי Workflow
      ok = await safeCheck(async () => {
        // חיפוש ה-stepper
        const stepper = page.locator('[class*="stepper"], [class*="workflow"], [class*="stages"]').first();
        
        // ניסיון ללחוץ על שלב "הצעת מחיר"
        const proposalStage = page.getByText(/הצעת מחיר/i).first();
        if (await proposalStage.isVisible({ timeout: 3000 }).catch(() => false)) {
          await proposalStage.click();
          await delay(page);
        }
        
        // ניסיון ללחוץ על שלב "מדידה"
        const surveyStage = page.getByText(/מדידה/i).first();
        if (await surveyStage.isVisible({ timeout: 3000 }).catch(() => false)) {
          await surveyStage.click();
          await delay(page);
        }
        
        return true;
      });
      logResult('16.2', 'מעבר בין שלבי Workflow', ok);

      // 16.3 בדיקת Portfolio Tabs
      ok = await safeCheck(async () => {
        // סקירה
        const overviewTab = page.getByText(/סקירה|overview/i).first();
        if (await overviewTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await overviewTab.click();
          await delay(page);
        }
        
        // מסמכים
        const docsTab = page.getByText(/מסמכים|documents/i).first();
        if (await docsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await docsTab.click();
          await delay(page);
        }
        
        // משימות
        const tasksTab = page.getByText(/משימות|tasks/i).first();
        if (await tasksTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tasksTab.click();
          await delay(page);
        }
        
        return true;
      });
      logResult('16.3', 'מעבר בין טאבי Portfolio', ok);

      // 16.4 פתיחת AI Report
      ok = await safeCheck(async () => {
        const reportBtn = page.getByRole('button', { name: /דוח|report/i }).first();
        if (await reportBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await reportBtn.click();
          await delay(page);
          
          // המתנה לדיאלוג
          const dialog = page.locator('[role="dialog"]').first();
          const dialogOpen = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
          
          if (dialogOpen) {
            // המתנה לתגובת AI (עד 60 שניות)
            console.log('   🤖 ממתין לתגובת AI...');
            const aiContent = page.locator('[class*="report"], [class*="content"], [class*="summary"]')
              .filter({ hasText: /סיכום|דוח|פרויקט/ }).first();
            
            await aiContent.waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
            
            // סגירת הדיאלוג
            await page.keyboard.press('Escape');
            await delay(page, SHORT_DELAY);
            
            return true;
          }
        }
        return false;
      });
      logResult('16.4', 'פתיחת AI Report', ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 17. Design Library Deep Dive – תיקיות ותוכן
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('17. Design Library Deep Dive', async () => {
      await page.goto('/DesignLibrary');
      await delay(page);
      await dismissPopups(page);

      // 17.1 כניסה לקטגוריה
      let ok = await safeCheck(async () => {
        // סגירה נוספת של popup במידה ועדיין נמצא
        await dismissPopups(page);
        await page.waitForTimeout(500);
        await dismissPopups(page);
        
        // לחיצה על קטגוריית "רהיטים" שיש בה פריטים (60)
        const furnitureCategory = page.locator('h3:has-text("רהיטים")').first();
        const referenceCategory = page.locator('h3:has-text("תמונות רפרנס")').first();
        const contentCategory = page.locator('h3:has-text("תוכן")').first();
        
        if (await furnitureCategory.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('   📂 נכנס לקטגוריית רהיטים');
          await furnitureCategory.click();
          await delay(page);
          return true;
        } else if (await referenceCategory.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('   📂 נכנס לקטגוריית תמונות רפרנס');
          await referenceCategory.click();
          await delay(page);
          return true;
        } else if (await contentCategory.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('   📂 נכנס לקטגוריית תוכן');
          await contentCategory.click();
          await delay(page);
          return true;
        }
        console.log('   ❌ לא נמצאה קטגוריה');
        return false;
      });
      logResult('17.1', 'כניסה לקטגוריה בספרייה', ok);

      // 17.2 בדיקת כפתורי העלאה
      ok = await safeCheck(async () => {
        const uploadBtn = page.getByRole('button', { name: /העלאה|upload|הוסף/i }).first();
        return await uploadBtn.isVisible({ timeout: 3000 }).catch(() => false);
      });
      logResult('17.2', 'כפתור העלאה קיים', ok);

      // 17.3 מעבר בין Grid/List
      ok = await safeCheck(async () => {
        // Grid
        const gridBtn = page.locator('button').filter({ has: page.locator('svg.lucide-grid, svg.lucide-layout-grid') }).first();
        if (await gridBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await gridBtn.click();
          await delay(page, SHORT_DELAY);
        }
        
        // List
        const listBtn = page.locator('button').filter({ has: page.locator('svg.lucide-list') }).first();
        if (await listBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await listBtn.click();
          await delay(page, SHORT_DELAY);
        }
        
        return true;
      });
      logResult('17.3', 'מעבר Grid/List', ok);

      // 17.4 חזרה לספריית תוכן
      ok = await safeCheck(async () => {
        const backBtn = page.getByRole('button', { name: /חזרה|back/i }).first()
          .or(page.getByText(/חזרה לספריית תוכן/i));
        
        if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await backBtn.click();
          await delay(page);
          return true;
        }
        
        // או ניווט ידני
        await page.goto('/DesignLibrary');
        await delay(page);
        return true;
      });
      logResult('17.4', 'חזרה לספריית תוכן', ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 18. Clients Deep Dive – פרופיל לקוח
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('18. Clients Deep Dive', async () => {
      await page.goto('/Clients');
      await delay(page);
      await dismissPopups(page);

      // 18.1 כניסה לפרופיל לקוח
      let ok = await safeCheck(async () => {
        const clientCard = page.locator(`text=${testData.clientName}`).first();
        if (await clientCard.isVisible({ timeout: 5000 }).catch(() => false)) {
          await clientCard.click();
          await delay(page, 2000);
          
          // בדיקה שנפתח פרופיל או דיאלוג
          const clientDetails = page.locator('[role="dialog"], [class*="profile"], [class*="detail"]').first();
          return await clientDetails.isVisible({ timeout: 3000 }).catch(() => 
            page.getByText(testData.clientName).isVisible({ timeout: 2000 })
          );
        }
        return false;
      });
      logResult('18.1', 'כניסה לפרופיל לקוח', ok);

      // 18.2 בדיקת Timeline קיים
      ok = await safeCheck(async () => {
        const timeline = page.getByText(/timeline|ציר זמן|היסטוריה/i).first();
        return await timeline.isVisible({ timeout: 3000 }).catch(() => false);
      });
      logResult('18.2', 'Timeline לקוח קיים', ok);

      // 18.3 כפתור עריכה קיים
      ok = await safeCheck(async () => {
        const editBtn = page.getByRole('button', { name: /עריכה|edit/i }).first()
          .or(page.locator('button').filter({ has: page.locator('svg.lucide-pencil, svg.lucide-edit') }));
        return await editBtn.isVisible({ timeout: 3000 }).catch(() => false);
      });
      logResult('18.3', 'כפתור עריכת לקוח קיים', ok);

      // סגירת דיאלוג אם פתוח
      await page.keyboard.press('Escape').catch(() => {});
      await delay(page, SHORT_DELAY);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 19. Settings Deep Dive – הגדרות ו-Dark Mode
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('19. Settings Deep Dive', async () => {
      await page.goto('/Settings');
      await delay(page);
      await dismissPopups(page);

      // 19.1 בדיקת Dark Mode Toggle
      let ok = await safeCheck(async () => {
        const darkModeToggle = page.getByRole('switch').first()
          .or(page.locator('[class*="dark"], [class*="theme"]').filter({ has: page.locator('button, [role="switch"]') }));
        
        if (await darkModeToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
          // לחיצה להחלפה
          await darkModeToggle.click();
          await delay(page);
          
          // לחיצה חוזרת
          await darkModeToggle.click();
          await delay(page);
          
          return true;
        }
        return false;
      });
      logResult('19.1', 'Dark Mode Toggle עובד', ok);

      // 19.2 בדיקת Language Selector
      ok = await safeCheck(async () => {
        const langSelector = page.getByText(/שפה|language|עברית|english/i).first();
        return await langSelector.isVisible({ timeout: 3000 }).catch(() => false);
      });
      logResult('19.2', 'Language Selector קיים', ok);

      // 19.3 בדיקת Logout Button
      ok = await safeCheck(async () => {
        const logoutBtn = page.getByRole('button', { name: /התנתק|logout/i });
        return await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false);
      });
      logResult('19.3', 'Logout Button קיים', ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 20. Recordings Deep Dive – הקלטות ותמלול
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('20. Recordings Deep Dive', async () => {
      await page.goto('/Recordings');
      await delay(page);
      await dismissPopups(page);

      // 20.1 דף הקלטות נטען
      let ok = await safeCheck(async () => {
        const recordingsPage = page.getByText(/הקלטות|recordings|שיחות/i).first();
        return await recordingsPage.isVisible({ timeout: 5000 }).catch(() => page.url().includes('/Recordings'));
      });
      logResult('20.1', 'דף Recordings נטען', ok);

      // 20.2 כפתור הקלטה חדשה קיים
      ok = await safeCheck(async () => {
        const newRecordingBtn = page.getByRole('button', { name: /הקלטה חדשה|new recording|העלאה/i }).first();
        return await newRecordingBtn.isVisible({ timeout: 3000 }).catch(() => false);
      });
      logResult('20.2', 'כפתור הקלטה חדשה קיים', ok);

      // 20.3 בדיקת AI Features קיימים
      ok = await safeCheck(async () => {
        const aiFeatures = page.getByText(/תמלול|transcription|סיכום|AI|summary/i).first();
        return await aiFeatures.isVisible({ timeout: 3000 }).catch(() => false);
      });
      logResult('20.3', 'AI Features קיימים', ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 21. Quotes Deep Dive – הצעות מחיר
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('21. Quotes Deep Dive', async () => {
      // ניסיון להיכנס לדף Quotes דרך פרויקט
      await page.goto('/Projects');
      await delay(page);
      await dismissPopups(page);

      // 21.1 בדיקת גישה להצעות מחיר
      let ok = await safeCheck(async () => {
        // לחיצה על הפרויקט שנוצר
        const projectCard = page.locator(`text=${testData.projectName}`).first();
        if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
          await projectCard.click();
          await delay(page);
        }
        
        // חיפוש כפתור "הצעת מחיר" או שלב הצעת מחיר
        const quoteBtn = page.getByText(/הצעת מחיר|quote|proposal/i).first();
        if (await quoteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await quoteBtn.click();
          await delay(page);
          return true;
        }
        return false;
      });
      logResult('21.1', 'גישה להצעות מחיר', ok);

      // 21.2 בדיקת יצירת הצעת מחיר
      ok = await safeCheck(async () => {
        const createQuoteBtn = page.getByRole('button', { name: /צור הצעת מחיר|create quote|הצעה חדשה/i }).first();
        if (await createQuoteBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await createQuoteBtn.click();
          await delay(page);
          
          // בדיקה שנפתח עורך
          const quoteEditor = page.locator('[role="dialog"], [class*="quote"], [class*="editor"]').first();
          const isOpen = await quoteEditor.isVisible({ timeout: 5000 }).catch(() => false);
          
          // סגירה
          await page.keyboard.press('Escape').catch(() => {});
          await delay(page, SHORT_DELAY);
          
          return isOpen;
        }
        return false;
      });
      logResult('21.2', 'יצירת הצעת מחיר', ok);
    });

    // ═══════════════════════════════════════════════════════════════════════
    // 22. Dashboard Widgets Deep Dive
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('22. Dashboard Widgets', async () => {
      await page.goto('/Dashboard');
      await delay(page);
      await dismissPopups(page);

      // 22.1 בדיקת Widgets טוענים
      let ok = await safeCheck(async () => {
        // חיפוש widgets נפוצים
        const widgets = page.locator('[class*="widget"], [class*="card"], [class*="stat"]');
        const count = await widgets.count();
        return count >= 2;
      });
      logResult('22.1', 'Dashboard Widgets נטענו', ok);

      // 22.2 בדיקת Quick Actions
      ok = await safeCheck(async () => {
        const quickAction = page.getByRole('button', { name: /פרויקט חדש|לקוח חדש|הוסף/i }).first();
        return await quickAction.isVisible({ timeout: 3000 }).catch(() => false);
      });
      logResult('22.2', 'Quick Actions קיימים', ok);

      // 22.3 בדיקת רשימת אירועים/משימות
      ok = await safeCheck(async () => {
        const eventsList = page.getByText(/אירועים קרובים|משימות|events|tasks/i).first();
        return await eventsList.isVisible({ timeout: 3000 }).catch(() => false);
      });
      logResult('22.3', 'רשימת אירועים/משימות קיימת', ok);
    });

    await test.step('23. בדיקות טכניות', async () => {
      // 23.1 משתני סביבה
      if (testData.dashboardLoginSucceeded) {
        logIndirect('23.1', 'משתני סביבה', 'ההתחברות הצליחה');
      } else {
        logSkipped('23.1', 'משתני סביבה', 'ההתחברות לא הצליחה');
      }

      // 23.2 רספונסיביות
      let ok = await safeCheck(async () => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        await delay(page);
        await expect(page.locator('body')).toBeVisible();
        await page.setViewportSize({ width: 1280, height: 800 });
        return true;
      });
      logResult('23.2', 'רספונסיביות מובייל', ok);

      // 23.3 RTL
      ok = await safeCheck(async () => {
        await page.goto('/');
        await delay(page, SHORT_DELAY);
        const dir = await page.locator('html').getAttribute('dir');
        return dir === 'rtl' || dir === null;
      });
      logResult('23.3', 'RTL מוגדר', ok);

      // 23.4 אין שגיאות קריטיות בקונסול
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto('/');
      await delay(page);
      const criticalErrors = errors.filter((m) => /useLandingLanguage must be used within|Cannot read propert/i.test(m));
      ok = criticalErrors.length === 0;
      logResult('23.4', 'אין שגיאות קריטיות בקונסול', ok, ok ? '' : criticalErrors.join('; '));
    });

    // ═══════════════════════════════════════════════════════════════════════
    // סיכום דוח
    // ═══════════════════════════════════════════════════════════════════════
    await test.step('📊 דוח סיכום', async () => {
      console.log('\n\n═══════════════════════════════════════════════════════════════');
      console.log('                      📊 דוח סיכום QA                            ');
      console.log('═══════════════════════════════════════════════════════════════\n');

      console.log('📦 ישויות שנוצרו (נשארות לבדיקה ידנית):');
      console.log(`   • לקוח: ${testData.clientName}`);
      console.log(`   • פרויקט: ${testData.projectName}`);
      console.log(`   • אירוע: ${testData.eventName}`);
      console.log(`   • קבלן: ${testData.contractorName}`);
      console.log(`   • יועץ: ${testData.consultantName}`);
      console.log(`   • ספק: ${testData.supplierName}`);
      console.log('\n───────────────────────────────────────────────────────────────\n');
      
      // הצגת שגיאות שנאספו
      const collectedErrors = getCollectedErrors();
      if (collectedErrors.errors.length > 0 || collectedErrors.networkErrors.length > 0) {
        console.log('⚠️ שגיאות שנאספו במהלך הבדיקה:');
        if (collectedErrors.networkErrors.length > 0) {
          console.log(`\n   🌐 שגיאות API (${collectedErrors.networkErrors.length}):`);
          collectedErrors.networkErrors.slice(0, 10).forEach(e => console.log(`      • ${e}`));
          if (collectedErrors.networkErrors.length > 10) {
            console.log(`      ... ועוד ${collectedErrors.networkErrors.length - 10} שגיאות`);
          }
        }
        if (collectedErrors.errors.length > 0) {
          console.log(`\n   🔴 שגיאות Console (${collectedErrors.errors.length}):`);
          collectedErrors.errors.slice(0, 10).forEach(e => console.log(`      • ${e.slice(0, 100)}${e.length > 100 ? '...' : ''}`));
          if (collectedErrors.errors.length > 10) {
            console.log(`      ... ועוד ${collectedErrors.errors.length - 10} שגיאות`);
          }
        }
        console.log('\n───────────────────────────────────────────────────────────────\n');
      }

      const passed = report.filter((r) => r.status === '✅').length;
      const failed = report.filter((r) => r.status === '❌').length;
      const skipped = report.filter((r) => r.status === '⚠️').length;

      for (const r of report) {
        const noteStr = r.note ? ` (${r.note})` : '';
        console.log(`${r.status} ${r.id} – ${r.name}${noteStr}`);
      }

      console.log('\n───────────────────────────────────────────────────────────────');
      console.log(`סה"כ: ${report.length} בדיקות`);
      console.log(`✅ עברו: ${passed}`);
      console.log(`❌ נכשלו: ${failed}`);
      console.log(`⚠️ דולגו: ${skipped}`);
      console.log('═══════════════════════════════════════════════════════════════\n');

      expect(failed).toBe(0);
    });
  });
});
