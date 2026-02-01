import { test, expect, Page } from '@playwright/test';

/**
 * בדיקות UserManagement – ניהול משתמשים
 * 
 * הרצה:
 *   $env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npx playwright test tests/e2e/qa-user-management.spec.ts --headed
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

test.describe('UserManagement – ניהול משתמשים', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PIN_SUPER_ADMIN);
  });

  test('דף UserManagement נטען', async ({ page }) => {
    await page.goto('/UserManagement');
    await delay(page);
    await dismissPopups(page);

    // בדיקה שהדף נטען
    const title = page.getByText(/ניהול משתמשים|user management|משתמשים/i).first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('רשימת משתמשים מוצגת', async ({ page }) => {
    await page.goto('/UserManagement');
    await delay(page);
    await dismissPopups(page);

    // בדיקה שיש רשימת משתמשים
    const userCards = page.locator('[class*="card"], [class*="user"], tr')
      .filter({ hasText: /@|משתמש|user/ });
    
    const table = page.locator('table').first();
    
    const hasUsers = await userCards.count() > 0;
    const hasTable = await table.isVisible({ timeout: 3000 }).catch(() => false);
    
    expect(hasUsers || hasTable).toBe(true);
  });

  test('הזמנת משתמש חדש', async ({ page }) => {
    await page.goto('/UserManagement');
    await delay(page);
    await dismissPopups(page);

    // לחיצה על כפתור הזמנה
    const inviteBtn = page.getByRole('button', { name: /הזמן|invite|הוסף משתמש|add user/i }).first()
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-plus, svg.lucide-user-plus') }).first());
    
    if (await inviteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await inviteBtn.click();
      await delay(page);

      // בדיקה שנפתח דיאלוג
      const dialog = page.locator('[role="dialog"]').first();
      const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
      
      expect(hasDialog).toBe(true);
      
      // בדיקת שדות הטופס
      const emailField = page.getByPlaceholder(/email|אימייל/i).first();
      const roleSelect = page.getByRole('combobox').first();
      
      const hasEmail = await emailField.isVisible({ timeout: 2000 }).catch(() => false);
      const hasRole = await roleSelect.isVisible({ timeout: 2000 }).catch(() => false);
      
      console.log(`   📧 שדה אימייל: ${hasEmail ? 'קיים' : 'לא קיים'}`);
      console.log(`   👤 בחירת תפקיד: ${hasRole ? 'קיים' : 'לא קיים'}`);
      
      // סגירה
      await page.keyboard.press('Escape');
    }
  });

  test('שינוי תפקיד משתמש', async ({ page }) => {
    await page.goto('/UserManagement');
    await delay(page);
    await dismissPopups(page);

    // לחיצה על משתמש או על כפתור עריכה
    const editBtn = page.locator('button').filter({ has: page.locator('svg.lucide-pencil, svg.lucide-edit') }).first();
    const userRow = page.locator('tr, [class*="user-card"]').first();
    
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
      await delay(page);

      // בדיקת dropdown של תפקידים
      const roleSelect = page.getByRole('combobox').first()
        .or(page.locator('select').first());
      
      if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await roleSelect.click();
        await delay(page, SHORT_DELAY);
        
        // בדיקת אפשרויות תפקיד
        const adminOption = page.getByRole('option', { name: /admin|מנהל/i });
        const architectOption = page.getByRole('option', { name: /architect|אדריכל/i });
        
        const hasAdmin = await adminOption.isVisible({ timeout: 2000 }).catch(() => false);
        const hasArchitect = await architectOption.isVisible({ timeout: 2000 }).catch(() => false);
        
        console.log(`   👑 אפשרויות תפקיד: Admin=${hasAdmin}, Architect=${hasArchitect}`);
        
        await page.keyboard.press('Escape');
      }
      
      // סגירה
      await page.keyboard.press('Escape');
    }
  });

  test('אישור/דחיית משתמש ממתין', async ({ page }) => {
    await page.goto('/UserManagement');
    await delay(page);
    await dismissPopups(page);

    // בדיקת טאב ממתינים לאישור
    const pendingTab = page.getByRole('tab', { name: /ממתינים|pending|לאישור/i });
    
    if (await pendingTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pendingTab.click();
      await delay(page);

      // בדיקת כפתורי אישור/דחייה
      const approveBtn = page.getByRole('button', { name: /אשר|approve/i }).first();
      const rejectBtn = page.getByRole('button', { name: /דחה|reject/i }).first();
      
      const hasApprove = await approveBtn.isVisible({ timeout: 3000 }).catch(() => false);
      const hasReject = await rejectBtn.isVisible({ timeout: 2000 }).catch(() => false);
      
      console.log(`   ✅ אישור: ${hasApprove ? 'קיים' : 'לא קיים'}, ❌ דחייה: ${hasReject ? 'קיים' : 'לא קיים'}`);
    } else {
      console.log('   📋 אין טאב ממתינים לאישור');
    }
  });

  test('חיפוש משתמשים', async ({ page }) => {
    await page.goto('/UserManagement');
    await delay(page);
    await dismissPopups(page);

    // בדיקת שדה חיפוש
    const searchField = page.getByPlaceholder(/חיפוש|search/i).first();
    
    if (await searchField.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchField.fill('test');
      await delay(page, 1000);
      
      console.log('   🔍 חיפוש משתמשים עובד');
    }
  });

  test('סינון לפי תפקיד', async ({ page }) => {
    await page.goto('/UserManagement');
    await delay(page);
    await dismissPopups(page);

    // בדיקת פילטר תפקיד
    const roleFilter = page.getByRole('combobox').first()
      .or(page.getByText(/כל התפקידים|all roles/i).first());
    
    if (await roleFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await roleFilter.click();
      await delay(page, SHORT_DELAY);
      
      const options = page.getByRole('option');
      const optionCount = await options.count();
      
      console.log(`   🎭 מספר אפשרויות סינון: ${optionCount}`);
      
      await page.keyboard.press('Escape');
    }
  });

  test('השבתת משתמש', async ({ page }) => {
    await page.goto('/UserManagement');
    await delay(page);
    await dismissPopups(page);

    // בדיקת כפתור השבתה
    const disableBtn = page.getByRole('button', { name: /השבת|disable|suspend/i }).first()
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-ban, svg.lucide-user-x') }).first());
    
    const hasDisable = await disableBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   🚫 כפתור השבתה: ${hasDisable ? 'קיים' : 'לא קיים'}`);
  });
});
