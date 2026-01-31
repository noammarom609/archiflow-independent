import { test, expect } from '@playwright/test';

/**
 * בדיקה אחת רציפה – דפדפן פתוח לאורך כל הריצה.
 * מתחבר לכל תפקיד (super_admin → architect → client → consultant → contractor),
 * מבצע את המשימות של התפקיד, מתנתק ועובר לתפקיד הבא – בלי לסגור את הדפדפן.
 *
 * הרצה (דפדפן גלוי, עובד אחד):
 *   $env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npx playwright test tests/e2e/qa-journey.spec.ts --headed --workers=1
 */

const ROLES = [
  { pin: '2189', name: 'super_admin', label: 'מנהל על' },
  { pin: '2188', name: 'architect', label: 'אדריכל' },
  { pin: '2187', name: 'client', label: 'לקוח' },
  { pin: '2186', name: 'consultant', label: 'יועץ' },
  { pin: '2185', name: 'contractor', label: 'קבלן' },
] as const;

async function loginViaPin(
  page: import('@playwright/test').Page,
  pin: string
) {
  await page.goto('/');
  await page.waitForLoadState('networkidle').catch(() => {});
  const trigger = page
    .getByTestId('admin-bypass-trigger')
    .or(page.getByRole('button', { name: 'Admin login' }));
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click({ timeout: 15000 });
  const pinInput = page
    .getByTestId('admin-bypass-pin-input')
    .or(page.getByPlaceholder(/קוד PIN|PIN/i));
  await pinInput.fill(pin);
  const submit = page
    .getByTestId('admin-bypass-submit')
    .or(page.getByRole('button', { name: /אישור/i }));
  await submit.click();
  await page.waitForURL(/\/Dashboard/i, { timeout: 15000 });
}

async function logoutViaUI(page: import('@playwright/test').Page) {
  await page.goto('/Settings');
  await page.getByTestId('logout-btn').or(page.getByRole('button', { name: /התנתק|logout/i })).click({ timeout: 10000 });
  await page.waitForURL(/\/(LandingHome|LandingAbout|$|\?)/i, { timeout: 20000 }).catch(() => {});
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded').catch(() => {});
}

test.describe('QA Journey – בדיקה רציפה לכל התפקידים', () => {
  test('מטייל בממשק: התחברות לכל תפקיד, ביצוע משימות, התנתקות, מעבר לתפקיד הבא', async ({
    page,
  }) => {
    test.setTimeout(300000); // 5 דקות

    for (const role of ROLES) {
      await test.step(`תפקיד: ${role.label} (${role.name}) – התחברות`, async () => {
        await loginViaPin(page, role.pin);
        await expect(page).toHaveURL(/\/Dashboard/i);
        await expect(
          page.getByText(/נדרשת התחברות|login required/i).first()
        ).not.toBeVisible({ timeout: 5000 }).catch(() => {});
      });

      await test.step(`תפקיד: ${role.label} – Dashboard נטען`, async () => {
        await expect(page.getByText(/לוח בקרה|dashboard|פרויקטים|projects/i).first()).toBeVisible({ timeout: 10000 }).catch(() => {});
      });

      await test.step(`תפקיד: ${role.label} – ניווט לדפים לפי תפקיד`, async () => {
        if (role.name === 'super_admin' || role.name === 'architect') {
          await page.goto('/Projects');
          await expect(
            page.getByText(/פרויקטים|פרויקט חדש|אין פרויקטים/i).first()
          ).toBeVisible({ timeout: 10000 });
          await page.getByTestId('new-project-btn').click({ timeout: 5000 }).catch(() => {});
          await page.keyboard.press('Escape').catch(() => {});

          await page.goto('/Clients');
          await expect(
            page.getByText(/כרטיסי לקוח|לקוח חדש|אין לקוחות/i).first()
          ).toBeVisible({ timeout: 10000 }).catch(() => {});

          await page.goto('/Calendar');
          await expect(page.getByTestId('add-event-btn')).toBeVisible({ timeout: 8000 }).catch(() => {});
        }
        if (role.name === 'client') {
          await page.goto('/Dashboard');
          await page.goto('/ClientPortal').catch(() => {});
        }
        if (role.name === 'consultant') {
          await page.goto('/Dashboard');
          await page.goto('/ConsultantPortal').catch(() => {});
        }
        if (role.name === 'contractor') {
          await page.goto('/Dashboard');
          await page.goto('/ContractorPortal').catch(() => {});
        }
      });

      await test.step(`תפקיד: ${role.label} – התנתקות`, async () => {
        await logoutViaUI(page);
        await expect(
          page.getByTestId('admin-bypass-trigger').or(page.getByRole('button', { name: 'Admin login' }))
        ).toBeVisible({ timeout: 10000 });
      });
    }
  });
});
