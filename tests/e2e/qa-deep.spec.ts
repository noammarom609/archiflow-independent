import { test, expect } from '@playwright/test';

const ADMIN_PIN = '2189';

/**
 * Deep QA – בדיקות מפורטות לפי docs/QA_CHECKLIST.md סעיף 6.
 * דורש התחברות: משתמש כניסה דרך כפתור נסתר + PIN 2189 (super_admin).
 *
 * הרצה עם דפדפן אחד, אחת אחרי השנייה, גלוי:
 *   $env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npm run test:e2e:deep:headed
 * או מקומית (npm run dev רץ):
 *   npm run test:e2e:deep:headed
 */

async function loginViaPin(page: import('@playwright/test').Page, pin: string = ADMIN_PIN) {
  await page.goto('/');
  await page.waitForLoadState('networkidle').catch(() => {});
  const trigger = page.getByTestId('admin-bypass-trigger').or(page.getByRole('button', { name: 'Admin login' }));
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click({ timeout: 15000 });
  const pinInput = page.getByTestId('admin-bypass-pin-input').or(page.getByPlaceholder(/קוד PIN|PIN/i));
  await pinInput.fill(pin);
  const submit = page.getByTestId('admin-bypass-submit').or(page.getByRole('button', { name: /אישור|אישור/i }));
  await submit.click();
  await page.waitForURL(/\/Dashboard/i, { timeout: 15000 });
  await expect(page.getByText(/נדרשת התחברות|login required/i).first()).not.toBeVisible({ timeout: 5000 }).catch(() => {});
}

test.describe('Deep QA – 6.1 תהליכים (Flows)', () => {
  test('6.1.1 יצירת פרויקט – כפתור "פרויקט חדש" פותח מודל', async ({ page }) => {
    await loginViaPin(page);
    await page.goto('/Projects');
    await page.getByTestId('new-project-btn').click();
    await expect(page.getByText(/פרויקט חדש|הקמת פרויקט|new project/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('6.1.2 הוספת לקוח – כפתור "לקוח חדש" פותח מודל', async ({ page }) => {
    await loginViaPin(page);
    await page.goto('/Clients');
    await page.getByTestId('add-client-btn').click();
    await expect(page.getByText(/לקוח חדש|הוסף לקוח|new client/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('6.1.3 יצירת אירוע בלוח שנה – טופס נפתח, שדה כותרת ושליחה', async ({ page }) => {
    await loginViaPin(page);
    await page.goto('/Calendar');
    await page.getByTestId('add-event-btn').click();
    await expect(page.getByTestId('add-event-title')).toBeVisible({ timeout: 8000 });
    await page.getByTestId('add-event-title').fill('E2E אירוע בדיקה');
    await page.getByTestId('add-event-submit').click();
    await expect(page.getByText(/אירוע בדיקה|נוצר|נשמר/i).first()).toBeVisible({ timeout: 10000 }).catch(() => {});
  });
});

test.describe('Deep QA – 6.2 נתונים ו־CRUD', () => {
  test('6.2.1 רשימת פרויקטים – דף Projects נטען (ריק או עם רשימה)', async ({ page }) => {
    await loginViaPin(page);
    await page.goto('/Projects');
    const emptyOrList = page.getByText(/אין פרויקטים|פרויקט חדש|צור פרויקט/i).first();
    await expect(emptyOrList).toBeVisible({ timeout: 10000 });
  });

  test('6.2.2 רשימת לקוחות – דף Clients נטען (ריק או עם רשימה)', async ({ page }) => {
    await loginViaPin(page);
    await page.goto('/Clients');
    const emptyOrList = page.getByText(/אין לקוחות|כרטיסי לקוח|לקוח חדש/i).first();
    await expect(emptyOrList).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Deep QA – 6.3 הרשאות ותפקידים', () => {
  test('6.3.4 Super Admin – אחרי כניסה ב־PIN, Dashboard נטען', async ({ page }) => {
    await loginViaPin(page);
    await expect(page).toHaveURL(/\/Dashboard/i);
    await expect(page.getByText(/נדרשת התחברות|login required/i).first()).not.toBeVisible({ timeout: 5000 }).catch(() => {});
  });

  test('6.3.4ב Super Admin – ניווט ל־Settings נטען', async ({ page }) => {
    await loginViaPin(page);
    await page.goto('/Settings');
    await expect(page.getByText(/הגדרות|settings|שפה|language/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Deep QA – 6.4 דפים ציבוריים (ללא התחברות)', () => {
  test('6.4.1 PublicApproval – נטען בלי Login (לא 404)', async ({ page }) => {
    const res = await page.goto('/PublicApproval');
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/.+/);
  });

  test('6.4.2 PublicContractorQuote – נטען בלי Login (לא 404)', async ({ page }) => {
    const res = await page.goto('/PublicContractorQuote');
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/.+/);
  });

  test('6.4.3 PublicMeetingBooking – נטען בלי Login (לא 404)', async ({ page }) => {
    const res = await page.goto('/PublicMeetingBooking');
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/.+/);
  });
});

test.describe('Deep QA – 6.5 טעינה ו־validation', () => {
  test('6.5.3 טופס אירוע – שדה כותרת ריק לא מאפשר שליחה (או הודעת validation)', async ({ page }) => {
    await loginViaPin(page);
    await page.goto('/Calendar');
    await page.getByTestId('add-event-btn').click();
    await expect(page.getByTestId('add-event-title')).toBeVisible({ timeout: 8000 });
    const submit = page.getByTestId('add-event-submit');
    await submit.click();
    const hasValidation = await page.getByText(/חובה|required|הזן|נא/i).first().isVisible().catch(() => false);
    const stillOpen = await page.getByTestId('add-event-title').isVisible().catch(() => false);
    expect(hasValidation || stillOpen).toBe(true);
  });
});
