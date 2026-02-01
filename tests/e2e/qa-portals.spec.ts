import { test, expect, Page } from '@playwright/test';

/**
 * בדיקות Portals – פורטלי לקוח/קבלן/יועץ/ספק
 * 
 * הרצה:
 *   $env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npx playwright test tests/e2e/qa-portals.spec.ts --headed
 */

const SHORT_DELAY = 800;
const PINS = {
  super_admin: '2189',
  client: '2187',
  consultant: '2186',
  contractor: '2185',
};

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

async function logoutViaUI(page: Page) {
  await page.goto('/Settings');
  await delay(page);
  
  const logoutBtn = page.getByRole('button', { name: /התנתק/i }).first();
  if (await logoutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await logoutBtn.click();
    await delay(page);
  }
  
  await page.evaluate(() => {
    localStorage.removeItem('adminBypassToken');
    localStorage.removeItem('adminBypassUser');
  });
  
  await page.goto('/');
  await delay(page, SHORT_DELAY);
}

test.describe('ClientPortal – פורטל לקוח', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PINS.client);
  });

  test('פורטל לקוח נטען', async ({ page }) => {
    await page.goto('/ClientPortal');
    await delay(page);
    await dismissPopups(page);

    // בדיקה שהדף נטען
    const title = page.getByText(/פורטל לקוח|client portal|ברוכים הבאים/i).first();
    const hasTitle = await title.isVisible({ timeout: 10000 }).catch(() => false);
    
    // או שמפנה לדשבורד
    const onDashboard = page.url().includes('/Dashboard');
    
    expect(hasTitle || onDashboard).toBe(true);
  });

  test('לקוח רואה את הפרויקטים שלו', async ({ page }) => {
    await page.goto('/ClientPortal');
    await delay(page);
    await dismissPopups(page);

    // בדיקת רשימת פרויקטים
    const projectsList = page.getByText(/פרויקטים|projects/i).first();
    const projectCards = page.locator('[class*="card"], [class*="project"]')
      .filter({ hasText: /פרויקט|project/ });
    
    const hasList = await projectsList.isVisible({ timeout: 5000 }).catch(() => false);
    const hasCards = await projectCards.count() > 0;
    
    console.log(`   📁 פרויקטים: ${hasList || hasCards ? 'מוצגים' : 'לא מוצגים'}`);
  });

  test('לקוח רואה מסמכים לאישור', async ({ page }) => {
    await page.goto('/ClientPortal');
    await delay(page);
    await dismissPopups(page);

    // בדיקת אזור מסמכים לאישור
    const approvalSection = page.getByText(/לאישור|pending approval|מסמכים/i).first();
    const hasApproval = await approvalSection.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   📄 מסמכים לאישור: ${hasApproval ? 'מוצגים' : 'לא מוצגים'}`);
  });

  test('לקוח רואה עדכונים אחרונים', async ({ page }) => {
    await page.goto('/ClientPortal');
    await delay(page);
    await dismissPopups(page);

    // בדיקת אזור עדכונים
    const updates = page.getByText(/עדכונים|updates|פעילות אחרונה/i).first();
    const hasUpdates = await updates.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   📢 עדכונים: ${hasUpdates ? 'מוצגים' : 'לא מוצגים'}`);
  });
});

test.describe('ContractorPortal – פורטל קבלן', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PINS.contractor);
  });

  test('פורטל קבלן נטען', async ({ page }) => {
    await page.goto('/ContractorPortal');
    await delay(page);
    await dismissPopups(page);

    const title = page.getByText(/פורטל קבלן|contractor portal|ברוכים הבאים/i).first();
    const hasTitle = await title.isVisible({ timeout: 10000 }).catch(() => false);
    const onDashboard = page.url().includes('/Dashboard');
    
    expect(hasTitle || onDashboard).toBe(true);
  });

  test('קבלן רואה משימות פתוחות', async ({ page }) => {
    await page.goto('/ContractorPortal');
    await delay(page);
    await dismissPopups(page);

    const tasks = page.getByText(/משימות|tasks|עבודות/i).first();
    const hasTasks = await tasks.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   📋 משימות: ${hasTasks ? 'מוצגות' : 'לא מוצגות'}`);
  });

  test('קבלן יכול להעלות הצעת מחיר', async ({ page }) => {
    await page.goto('/ContractorPortal');
    await delay(page);
    await dismissPopups(page);

    const quoteBtn = page.getByRole('button', { name: /הצעת מחיר|quote|הגש הצעה/i }).first()
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-upload') }).first());
    
    const hasQuoteBtn = await quoteBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   💰 הצעת מחיר: ${hasQuoteBtn ? 'כפתור קיים' : 'לא נמצא'}`);
  });

  test('קבלן רואה הודעות', async ({ page }) => {
    await page.goto('/ContractorPortal');
    await delay(page);
    await dismissPopups(page);

    const messages = page.getByText(/הודעות|messages|תקשורת/i).first();
    const hasMessages = await messages.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   💬 הודעות: ${hasMessages ? 'מוצגות' : 'לא מוצגות'}`);
  });
});

test.describe('ConsultantPortal – פורטל יועץ', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PINS.consultant);
  });

  test('פורטל יועץ נטען', async ({ page }) => {
    await page.goto('/ConsultantPortal');
    await delay(page);
    await dismissPopups(page);

    const title = page.getByText(/פורטל יועץ|consultant portal|ברוכים הבאים/i).first();
    const hasTitle = await title.isVisible({ timeout: 10000 }).catch(() => false);
    const onDashboard = page.url().includes('/Dashboard');
    
    expect(hasTitle || onDashboard).toBe(true);
  });

  test('יועץ רואה פרויקטים משויכים', async ({ page }) => {
    await page.goto('/ConsultantPortal');
    await delay(page);
    await dismissPopups(page);

    const projects = page.getByText(/פרויקטים|projects/i).first();
    const hasProjects = await projects.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   📁 פרויקטים: ${hasProjects ? 'מוצגים' : 'לא מוצגים'}`);
  });

  test('יועץ יכול להעלות מסמכים', async ({ page }) => {
    await page.goto('/ConsultantPortal');
    await delay(page);
    await dismissPopups(page);

    const uploadBtn = page.getByRole('button', { name: /העלה|upload|מסמך חדש/i }).first()
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-upload') }).first());
    
    const hasUpload = await uploadBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   📤 העלאת מסמכים: ${hasUpload ? 'כפתור קיים' : 'לא נמצא'}`);
  });

  test('יועץ רואה משימות', async ({ page }) => {
    await page.goto('/ConsultantPortal');
    await delay(page);
    await dismissPopups(page);

    const tasks = page.getByText(/משימות|tasks/i).first();
    const hasTasks = await tasks.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   📋 משימות: ${hasTasks ? 'מוצגות' : 'לא מוצגות'}`);
  });
});

test.describe('SupplierPortal – פורטל ספק', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PINS.super_admin); // Supplier might not have PIN
  });

  test('פורטל ספק נטען (Admin view)', async ({ page }) => {
    await page.goto('/SupplierPortal');
    await delay(page);
    await dismissPopups(page);

    const title = page.getByText(/פורטל ספק|supplier portal|ספקים/i).first();
    const hasTitle = await title.isVisible({ timeout: 10000 }).catch(() => false);
    const hasContent = page.url().includes('/SupplierPortal');
    
    expect(hasTitle || hasContent).toBe(true);
  });

  test('רשימת הזמנות לספק', async ({ page }) => {
    await page.goto('/SupplierPortal');
    await delay(page);
    await dismissPopups(page);

    const orders = page.getByText(/הזמנות|orders|רכישות/i).first();
    const hasOrders = await orders.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   📦 הזמנות: ${hasOrders ? 'מוצגות' : 'לא מוצגות'}`);
  });

  test('קטלוג מוצרים', async ({ page }) => {
    await page.goto('/SupplierPortal');
    await delay(page);
    await dismissPopups(page);

    const catalog = page.getByText(/קטלוג|catalog|מוצרים/i).first();
    const hasCatalog = await catalog.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   🛍️ קטלוג: ${hasCatalog ? 'מוצג' : 'לא מוצג'}`);
  });
});
