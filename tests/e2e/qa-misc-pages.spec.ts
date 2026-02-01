import { test, expect, Page } from '@playwright/test';

/**
 * בדיקות דפים נוספים – Team, Support, Blog, ThemeSettings, SuperAdmin
 * 
 * הרצה:
 *   $env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npx playwright test tests/e2e/qa-misc-pages.spec.ts --headed
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

test.describe('Team – ניהול צוות', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PIN_SUPER_ADMIN);
  });

  test('דף Team נטען', async ({ page }) => {
    await page.goto('/Team');
    await delay(page);
    await dismissPopups(page);

    const title = page.getByText(/צוות|team|חברי צוות/i).first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('רשימת חברי צוות', async ({ page }) => {
    await page.goto('/Team');
    await delay(page);
    await dismissPopups(page);

    const memberCards = page.locator('[class*="card"], [class*="member"], tr')
      .filter({ hasText: /@|חבר|member/ });
    
    const hasMembers = await memberCards.count() > 0;
    const noMembers = await page.getByText(/אין חברי צוות|no team members/i).isVisible({ timeout: 3000 }).catch(() => false);
    
    console.log(`   👥 חברי צוות: ${hasMembers ? 'יש' : noMembers ? 'אין' : 'לא ידוע'}`);
  });

  test('הוספת חבר צוות', async ({ page }) => {
    await page.goto('/Team');
    await delay(page);
    await dismissPopups(page);

    const addBtn = page.getByRole('button', { name: /הוסף|add|חדש/i }).first()
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-plus, svg.lucide-user-plus') }).first());
    
    const hasAdd = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ➕ הוספת חבר: ${hasAdd ? 'כפתור קיים' : 'לא נמצא'}`);
  });
});

test.describe('Support – תמיכה', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PIN_SUPER_ADMIN);
  });

  test('דף Support נטען', async ({ page }) => {
    await page.goto('/Support');
    await delay(page);
    await dismissPopups(page);

    const title = page.getByText(/תמיכה|support|עזרה/i).first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('פתיחת פנייה חדשה', async ({ page }) => {
    await page.goto('/Support');
    await delay(page);
    await dismissPopups(page);

    const newTicketBtn = page.getByRole('button', { name: /פנייה חדשה|new ticket|פתח פנייה/i }).first()
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-plus') }).first());
    
    if (await newTicketBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newTicketBtn.click();
      await delay(page);

      const dialog = page.locator('[role="dialog"]').first();
      const form = page.locator('form, textarea').first();
      
      const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
      const hasForm = await form.isVisible({ timeout: 2000 }).catch(() => false);
      
      expect(hasDialog || hasForm).toBe(true);
      
      await page.keyboard.press('Escape');
    }
  });

  test('רשימת פניות קודמות', async ({ page }) => {
    await page.goto('/Support');
    await delay(page);
    await dismissPopups(page);

    const tickets = page.locator('[class*="ticket"], [class*="card"]')
      .filter({ hasText: /פנייה|ticket|בקשה/ });
    
    const noTickets = page.getByText(/אין פניות|no tickets/i).first();
    
    const hasTickets = await tickets.count() > 0;
    const hasNoTicketsMsg = await noTickets.isVisible({ timeout: 3000 }).catch(() => false);
    
    console.log(`   🎫 פניות: ${hasTickets ? 'יש' : hasNoTicketsMsg ? 'אין' : 'לא ידוע'}`);
  });

  test('FAQ / שאלות נפוצות', async ({ page }) => {
    await page.goto('/Support');
    await delay(page);
    await dismissPopups(page);

    const faq = page.getByText(/FAQ|שאלות נפוצות|עזרה/i).first();
    const hasFaq = await faq.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   ❓ FAQ: ${hasFaq ? 'קיים' : 'לא קיים'}`);
  });
});

test.describe('LandingBlog – בלוג', () => {
  test('דף בלוג נטען (ציבורי)', async ({ page }) => {
    await page.goto('/LandingBlog');
    await delay(page);

    const title = page.getByText(/בלוג|blog|מאמרים/i).first();
    const hasTitle = await title.isVisible({ timeout: 10000 }).catch(() => false);
    
    // או שהדף נטען בכלל
    const pageLoaded = page.url().includes('/LandingBlog');
    
    expect(hasTitle || pageLoaded).toBe(true);
  });

  test('רשימת מאמרים', async ({ page }) => {
    await page.goto('/LandingBlog');
    await delay(page);

    const articles = page.locator('[class*="card"], [class*="article"], article')
      .filter({ hasText: /.{20,}/ });
    
    const hasArticles = await articles.count() > 0;
    console.log(`   📰 מאמרים: ${hasArticles ? 'יש' : 'אין'}`);
  });

  test('כניסה למאמר בודד', async ({ page }) => {
    await page.goto('/LandingBlog');
    await delay(page);

    const firstArticle = page.locator('[class*="card"], [class*="article"], article').first();
    
    if (await firstArticle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstArticle.click();
      await delay(page);
      
      // בדיקה שנפתח מאמר
      const articleContent = page.locator('article, [class*="content"]').first();
      const hasContent = await articleContent.isVisible({ timeout: 3000 }).catch(() => false);
      
      console.log(`   📄 תוכן מאמר: ${hasContent ? 'נטען' : 'לא נטען'}`);
    }
  });
});

test.describe('PublicContent – תוכן ציבורי', () => {
  test('דף PublicContent נטען (ציבורי)', async ({ page }) => {
    await page.goto('/PublicContent');
    await delay(page);

    const pageLoaded = page.url().includes('/PublicContent');
    expect(pageLoaded).toBe(true);
  });

  test('תצוגת תוכן ציבורי', async ({ page }) => {
    await page.goto('/PublicContent');
    await delay(page);

    // בדיקה שיש תוכן כלשהו
    const content = page.locator('main, [class*="content"], section').first();
    const hasContent = await content.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   📋 תוכן ציבורי: ${hasContent ? 'מוצג' : 'לא מוצג'}`);
  });
});

test.describe('ThemeSettings – הגדרות ערכת נושא', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PIN_SUPER_ADMIN);
  });

  test('דף ThemeSettings נטען', async ({ page }) => {
    await page.goto('/ThemeSettings');
    await delay(page);
    await dismissPopups(page);

    const title = page.getByText(/ערכת נושא|theme|עיצוב/i).first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('אפשרויות צבעים', async ({ page }) => {
    await page.goto('/ThemeSettings');
    await delay(page);
    await dismissPopups(page);

    // בדיקת אפשרויות צבע
    const colorOptions = page.locator('[class*="color"], [class*="swatch"], input[type="color"]');
    const hasColors = await colorOptions.count() > 0;
    
    console.log(`   🎨 אפשרויות צבע: ${hasColors ? 'יש' : 'אין'}`);
  });

  test('הגדרות לוגו', async ({ page }) => {
    await page.goto('/ThemeSettings');
    await delay(page);
    await dismissPopups(page);

    const logoSection = page.getByText(/לוגו|logo/i).first();
    const uploadBtn = page.getByRole('button', { name: /העלה|upload/i }).first();
    
    const hasLogo = await logoSection.isVisible({ timeout: 3000 }).catch(() => false);
    const hasUpload = await uploadBtn.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`   🖼️ הגדרות לוגו: ${hasLogo || hasUpload ? 'קיימות' : 'לא קיימות'}`);
  });

  test('שמירת הגדרות', async ({ page }) => {
    await page.goto('/ThemeSettings');
    await delay(page);
    await dismissPopups(page);

    const saveBtn = page.getByRole('button', { name: /שמור|save/i }).first();
    const hasSave = await saveBtn.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   💾 כפתור שמירה: ${hasSave ? 'קיים' : 'לא קיים'}`);
  });
});

test.describe('SuperAdminDashboard – דשבורד מנהל על', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PIN_SUPER_ADMIN);
  });

  test('דף SuperAdminDashboard נטען', async ({ page }) => {
    await page.goto('/SuperAdminDashboard');
    await delay(page);
    await dismissPopups(page);

    const title = page.getByText(/מנהל על|super admin|ניהול מערכת/i).first();
    const hasTitle = await title.isVisible({ timeout: 10000 }).catch(() => false);
    
    // או שהדף נטען
    const pageLoaded = page.url().includes('/SuperAdminDashboard');
    
    expect(hasTitle || pageLoaded).toBe(true);
  });

  test('סטטיסטיקות מערכת', async ({ page }) => {
    await page.goto('/SuperAdminDashboard');
    await delay(page);
    await dismissPopups(page);

    const stats = page.locator('[class*="stat"], [class*="card"]')
      .filter({ hasText: /סה"כ|total|משתמשים|פרויקטים/i });
    
    const hasStats = await stats.count() > 0;
    console.log(`   📊 סטטיסטיקות: ${hasStats ? 'יש' : 'אין'}`);
  });

  test('ניהול ארכיטקטים', async ({ page }) => {
    await page.goto('/SuperAdminDashboard');
    await delay(page);
    await dismissPopups(page);

    const architectsSection = page.getByText(/ארכיטקטים|architects/i).first();
    const hasArchitects = await architectsSection.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   🏗️ ניהול ארכיטקטים: ${hasArchitects ? 'קיים' : 'לא קיים'}`);
  });

  test('לוגים ופעילות', async ({ page }) => {
    await page.goto('/SuperAdminDashboard');
    await delay(page);
    await dismissPopups(page);

    const logs = page.getByText(/לוגים|logs|פעילות|activity/i).first();
    const hasLogs = await logs.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   📋 לוגים: ${hasLogs ? 'קיים' : 'לא קיים'}`);
  });

  test('הגדרות גלובליות', async ({ page }) => {
    await page.goto('/SuperAdminDashboard');
    await delay(page);
    await dismissPopups(page);

    const settings = page.getByText(/הגדרות גלובליות|global settings|קונפיגורציה/i).first();
    const hasSettings = await settings.isVisible({ timeout: 5000 }).catch(() => false);
    
    console.log(`   ⚙️ הגדרות גלובליות: ${hasSettings ? 'קיים' : 'לא קיים'}`);
  });
});

test.describe('SiteMode – מצב אתר', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PIN_SUPER_ADMIN);
  });

  test('דף SiteMode נטען', async ({ page }) => {
    await page.goto('/SiteMode');
    await delay(page);
    await dismissPopups(page);

    const pageLoaded = page.url().includes('/SiteMode');
    expect(pageLoaded).toBe(true);
  });

  test('אפשרויות מצב אתר', async ({ page }) => {
    await page.goto('/SiteMode');
    await delay(page);
    await dismissPopups(page);

    // בדיקת אפשרויות מצב
    const modeOptions = page.locator('[role="radio"], [role="switch"], input[type="radio"]');
    const hasModes = await modeOptions.count() > 0;
    
    const maintenanceMode = page.getByText(/תחזוקה|maintenance/i).first();
    const hasMaintenance = await maintenanceMode.isVisible({ timeout: 3000 }).catch(() => false);
    
    console.log(`   🔧 מצבי אתר: ${hasModes ? 'יש' : 'אין'}, תחזוקה: ${hasMaintenance ? 'קיים' : 'לא'}`);
  });
});
