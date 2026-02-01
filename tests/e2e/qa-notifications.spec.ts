import { test, expect, Page } from '@playwright/test';

/**
 * בדיקות Notifications – מערכת התראות ו-Push
 * 
 * הרצה:
 *   $env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npx playwright test tests/e2e/qa-notifications.spec.ts --headed
 */

const SHORT_DELAY = 800;
const PIN_SUPER_ADMIN = '2189';

async function delay(page: Page, ms: number = 1500) {
  await page.waitForTimeout(ms);
}

async function dismissPopups(page: Page) {
  try {
    const laterBtn = page.locator('button:has-text("אחר כך")').first();
    if (await laterBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await laterBtn.click({ force: true });
      await page.waitForTimeout(400);
    }
  } catch { /* ignore */ }
}

async function loginViaPin(page: Page, pin: string) {
  await page.goto('/');
  await delay(page, SHORT_DELAY);
  await page.waitForLoadState('networkidle').catch(() => {});

  const trigger = page.getByTestId('admin-bypass-trigger').or(page.getByRole('button', { name: 'Admin login' }));
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click({ timeout: 15000, force: true });
  await delay(page, SHORT_DELAY);

  const pinInput = page.getByTestId('admin-bypass-pin-input').or(page.getByPlaceholder(/קוד PIN|PIN/i));
  await pinInput.fill(pin);
  await delay(page, SHORT_DELAY);

  const submit = page.getByTestId('admin-bypass-submit').or(page.getByRole('button', { name: /אישור/i }));
  await submit.click();
  await page.waitForURL(/\/Dashboard/i, { timeout: 15000 });
  await delay(page);
}

test.describe('Notifications – מערכת התראות', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PIN_SUPER_ADMIN);
  });

  test('כפתור התראות מוצג בסרגל', async ({ page }) => {
    await page.goto('/Dashboard');
    await delay(page);
    await dismissPopups(page);

    // בדיקת כפתור פעמון
    const bellBtn = page.locator('button').filter({ has: page.locator('svg.lucide-bell') }).first();
    const notifBtn = page.getByRole('button', { name: /התראות|notifications/i }).first();
    
    const hasBell = await bellBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const hasNotifBtn = await notifBtn.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasBell || hasNotifBtn).toBe(true);
  });

  test('פתיחת תפריט התראות', async ({ page }) => {
    await page.goto('/Dashboard');
    await delay(page);
    await dismissPopups(page);

    const bellBtn = page.locator('button').filter({ has: page.locator('svg.lucide-bell') }).first();
    
    if (await bellBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bellBtn.click();
      await delay(page);

      // בדיקה שנפתח dropdown/panel
      const dropdown = page.locator('[class*="dropdown"], [class*="popover"], [role="menu"]').first();
      const notifList = page.getByText(/התראות|notifications|עדכונים/i).first();
      
      const hasDropdown = await dropdown.isVisible({ timeout: 3000 }).catch(() => false);
      const hasList = await notifList.isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasDropdown || hasList).toBe(true);
    }
  });

  test('הצגת התראות לא נקראות', async ({ page }) => {
    await page.goto('/Dashboard');
    await delay(page);
    await dismissPopups(page);

    // בדיקת badge על כפתור ההתראות
    const badge = page.locator('[class*="badge"], [class*="indicator"]')
      .filter({ hasText: /\d+/ }).first();
    
    const bellWithBadge = page.locator('button:has(svg.lucide-bell):has([class*="badge"], [class*="dot"])').first();
    
    const hasBadge = await badge.isVisible({ timeout: 3000 }).catch(() => false);
    const hasDot = await bellWithBadge.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`   🔔 Badge התראות: ${hasBadge || hasDot ? 'מוצג' : 'לא מוצג'}`);
  });

  test('סימון התראה כנקראה', async ({ page }) => {
    await page.goto('/Dashboard');
    await delay(page);
    await dismissPopups(page);

    const bellBtn = page.locator('button').filter({ has: page.locator('svg.lucide-bell') }).first();
    
    if (await bellBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bellBtn.click();
      await delay(page);

      // לחיצה על התראה ראשונה
      const firstNotif = page.locator('[class*="notification"], [class*="item"]').first();
      
      if (await firstNotif.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstNotif.click();
        await delay(page);
        console.log('   ✓ נלחץ על התראה');
      }
    }
  });

  test('סימון כל ההתראות כנקראו', async ({ page }) => {
    await page.goto('/Dashboard');
    await delay(page);
    await dismissPopups(page);

    const bellBtn = page.locator('button').filter({ has: page.locator('svg.lucide-bell') }).first();
    
    if (await bellBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bellBtn.click();
      await delay(page);

      // כפתור "סמן הכל כנקרא"
      const markAllBtn = page.getByRole('button', { name: /סמן הכל|mark all|נקרא/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-check-check') }).first());
      
      const hasMarkAll = await markAllBtn.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`   ✅ כפתור סימון הכל: ${hasMarkAll ? 'קיים' : 'לא קיים'}`);
    }
  });

  test('הגדרות Push Notifications', async ({ page }) => {
    await page.goto('/Settings');
    await delay(page);
    await dismissPopups(page);

    // בדיקת אזור הגדרות התראות
    const pushSettings = page.getByText(/התראות push|push notifications|הודעות מערכת/i).first();
    const notifToggle = page.locator('[role="switch"]').first();
    
    const hasPushSettings = await pushSettings.isVisible({ timeout: 5000 }).catch(() => false);
    const hasToggle = await notifToggle.isVisible({ timeout: 3000 }).catch(() => false);
    
    console.log(`   🔔 הגדרות Push: ${hasPushSettings || hasToggle ? 'קיימות' : 'לא נמצאו'}`);
  });

  test('popup הפעלת התראות (אם מופיע)', async ({ page }) => {
    // לפני dismiss - בודקים אם יש popup התראות
    await page.goto('/Dashboard');
    await delay(page, SHORT_DELAY);

    // בדיקת popup התראות
    const notifPopup = page.getByText(/הישאר מעודכן|enable notifications/i).first();
    const enableBtn = page.getByRole('button', { name: /הפעל|enable/i }).first();
    const laterBtn = page.getByRole('button', { name: /אחר כך|later/i }).first();
    
    const hasPopup = await notifPopup.isVisible({ timeout: 3000 }).catch(() => false);
    const hasEnable = await enableBtn.isVisible({ timeout: 2000 }).catch(() => false);
    const hasLater = await laterBtn.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`   📬 Popup התראות: ${hasPopup ? 'מוצג' : 'לא מוצג'}`);
    console.log(`   ✅ כפתור הפעל: ${hasEnable ? 'קיים' : 'לא קיים'}`);
    console.log(`   ⏰ כפתור אחר כך: ${hasLater ? 'קיים' : 'לא קיים'}`);
    
    // סגירת הפופאפ
    if (hasLater) {
      await laterBtn.click();
    }
  });

  test('התראות בזמן אמת (WebSocket)', async ({ page }) => {
    await page.goto('/Dashboard');
    await delay(page);
    await dismissPopups(page);

    // בדיקה בסיסית - הדף נטען ללא שגיאות WebSocket
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('WebSocket')) {
        errors.push(msg.text());
      }
    });
    
    await delay(page, 3000); // המתנה לבדיקת WebSocket
    
    const noWsErrors = errors.length === 0;
    console.log(`   🔌 WebSocket: ${noWsErrors ? 'ללא שגיאות' : `${errors.length} שגיאות`}`);
  });
});
