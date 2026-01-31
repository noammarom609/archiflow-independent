import { test, expect } from '@playwright/test';

/**
 * QA מלא מול Production – https://archiflow-independent.vercel.app
 *
 * הרצה מול Production:
 *   PLAYWRIGHT_BASE_URL=https://archiflow-independent.vercel.app npm run test:e2e
 * או (Windows PowerShell):
 *   $env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npm run test:e2e
 *
 * משתמש ב־baseURL מהקונפיגורציה (PLAYWRIGHT_BASE_URL או localhost:5173).
 */

test.describe('QA Production – דפי נחיתה (Landing)', () => {
  test('1.1 דף בית נטען – כותרת, לוגו, CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ArchiFlow|ארכיפלו/i);
    await expect(page.getByRole('heading', { level: 1 }).or(page.locator('h1'))).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/ArchiFlow|ארכיפלו/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('1.2 ניווט: בית → אודות → תמחור → בלוג → צור קשר', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation').first();
    await expect(nav).toBeVisible({ timeout: 8000 });

    const aboutLink = nav.getByRole('link', { name: /אודות|about/i });
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await expect(page).toHaveURL(/\/(LandingAbout|about)/i);
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 });

    await page.goto('/');
    const pricingLink = page.getByRole('navigation').first().getByRole('link', { name: /תמחור|pricing/i });
    await expect(pricingLink).toBeVisible();
    await pricingLink.click();
    await expect(page).toHaveURL(/\/(LandingPricing|pricing)/i);

    await page.goto('/');
    const contactLink = page.getByRole('navigation').first().getByRole('link', { name: /צור קשר|contact/i });
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(page).toHaveURL(/\/(LandingContact|contact)/i);
  });

  test('1.3 כפתור "התחל עכשיו" / "התחל בחינם" קיים', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /התחל|start|get started/i }).or(
      page.getByRole('button', { name: /התחל|start/i })
    );
    await expect(cta.first()).toBeVisible({ timeout: 8000 });
  });

  test('1.4 כפתור "התחברות" קיים', async ({ page }) => {
    await page.goto('/');
    const signIn = page.getByRole('link', { name: /התחברות|sign in/i }).or(
      page.getByRole('button', { name: /התחברות|sign in/i })
    );
    await expect(signIn.first()).toBeVisible({ timeout: 8000 });
  });

  test('1.6 פוטר – קישורים מדיניות פרטיות ותנאי שימוש', async ({ page }) => {
    await page.goto('/');
    const privacyLink = page.getByRole('link', { name: /מדיניות פרטיות|privacy/i });
    const termsLink = page.getByRole('link', { name: /תנאי שימוש|terms/i });
    await expect(privacyLink.first()).toBeVisible({ timeout: 8000 });
    await expect(termsLink.first()).toBeVisible({ timeout: 5000 });
  });

  test('1.7 גישה ישירה ל־/LandingAbout – אין 404', async ({ page }) => {
    const res = await page.goto('/LandingAbout');
    expect(res?.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible({ timeout: 8000 });
  });

  test('1.7ב גישה ישירה ל־/LandingPrivacy – אין 404', async ({ page }) => {
    const res = await page.goto('/LandingPrivacy');
    expect(res?.status()).toBe(200);
    await expect(page.getByText(/מדיניות פרטיות|privacy policy/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('1.7ג גישה ישירה ל־/LandingTerms – אין 404', async ({ page }) => {
    const res = await page.goto('/LandingTerms');
    expect(res?.status()).toBe(200);
    await expect(page.getByText(/תנאי שימוש|terms of use/i).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe('QA Production – אימות (Auth)', () => {
  test('2.1 לחיצה על "התחברות" – מעבר ל־Login (Clerk או מסך התחברות)', async ({ page }) => {
    await page.goto('/');
    const signIn = page.getByRole('link', { name: /התחברות|sign in/i }).or(
      page.getByRole('button', { name: /התחברות|sign in/i })
    ).first();
    await signIn.click();
    await page.waitForURL(/\/(sign-in|login|clerk)|accounts\.clerk/i, { timeout: 15000 }).catch(() => {});
    const hasLoginScreen = await page.getByText(/התחברות|sign in|log in|נדרשת התחברות/i).first().isVisible().catch(() => false);
    expect(hasLoginScreen).toBe(true);
  });
});

test.describe('QA Production – נתיבים מוגנים', () => {
  test('3.7 גישה ל־/Dashboard בלי התחברות – מסך "נדרשת התחברות"', async ({ page }) => {
    await page.goto('/Dashboard');
    await expect(page.getByText(/נדרשת התחברות|login required|sign in/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('QA Production – SPA ו־טכני', () => {
  test('5.2 SPA – /LandingPricing נטען (לא 404)', async ({ page }) => {
    const res = await page.goto('/LandingPricing');
    expect(res?.status()).toBe(200);
    await expect(page.locator('body')).toContainText(/.+/);
  });

  test('5.2ב SPA – /LandingContact נטען (לא 404)', async ({ page }) => {
    const res = await page.goto('/LandingContact');
    expect(res?.status()).toBe(200);
  });

  test('5.3 דף ראשי – טעינה ללא שגיאה קריטית', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForLoadState('domcontentloaded');
    const critical = errors.filter((m) => /useLandingLanguage must be used within|Cannot read propert/i.test(m));
    expect(critical.length).toBe(0);
  });
});
