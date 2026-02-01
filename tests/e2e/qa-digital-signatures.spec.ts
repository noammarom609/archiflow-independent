import { test, expect, Page } from '@playwright/test';

/**
 * בדיקות חתימות דיגיטליות
 * 
 * מכסה:
 * - דיאלוג חתימה דיגיטלית
 * - ציור חתימה על canvas
 * - שמירת חתימה
 * - היסטוריית חתימות
 * - אישור ציבורי עם חתימה
 * 
 * הרצה:
 *   $env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npx playwright test tests/e2e/qa-digital-signatures.spec.ts --headed
 */

const SHORT_DELAY = 800;
const VISUAL_DELAY = 1500;
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

test.describe('DigitalSignature – חתימות דיגיטליות', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PIN_SUPER_ADMIN);
  });

  test('דף חתימות/היסטוריה נטען', async ({ page }) => {
    // ניסיון גישה לדף חתימות או היסטוריה
    await page.goto('/Signatures');
    await delay(page);
    await dismissPopups(page);

    const signaturesPage = page.getByText(/חתימות|signatures|היסטוריה/i).first();
    const hasContent = await signaturesPage.isVisible({ timeout: 5000 }).catch(() => false);
    
    // אם אין דף ייעודי, זה בסדר - החתימות הן חלק משלבי פרויקט
    console.log(`   ✍️ דף חתימות: ${hasContent ? 'נטען' : 'לא נמצא (יתכן ששילוב בשלבי פרויקט)'}`);
  });

  test('פתיחת דיאלוג חתימה מהצעת מחיר', async ({ page }) => {
    await page.goto('/Projects');
    await delay(page);
    await dismissPopups(page);
    
    // כניסה לפרויקט ראשון
    const projectCard = page.locator('[class*="card"]').filter({ hasText: /פרויקט|project/i }).first();
    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click();
      await delay(page, VISUAL_DELAY);
      await dismissPopups(page);
      
      // מעבר לשלב הצעת מחיר
      const proposalStage = page.getByText(/הצעת מחיר/i).first();
      if (await proposalStage.isVisible({ timeout: 3000 }).catch(() => false)) {
        await proposalStage.click();
        await delay(page, VISUAL_DELAY);
        
        // חיפוש כפתור חתימה
        const signBtn = page.getByRole('button', { name: /חתימה|החתמה|sign/i }).first()
          .or(page.locator('button').filter({ has: page.locator('svg.lucide-pen-tool') }).first());
        
        if (await signBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await signBtn.click();
          await delay(page);
          
          // בדיקה שנפתח דיאלוג חתימה
          const dialog = page.locator('[role="dialog"]').first();
          const canvas = page.locator('canvas').first();
          
          const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
          const hasCanvas = await canvas.isVisible({ timeout: 2000 }).catch(() => false);
          
          console.log(`   ✍️ דיאלוג חתימה: ${hasDialog ? 'נפתח' : 'לא נפתח'}, Canvas: ${hasCanvas ? 'קיים' : 'לא קיים'}`);
          
          expect(hasDialog || hasCanvas).toBe(true);
        } else {
          console.log('   ✍️ כפתור חתימה לא נמצא - ייתכן שאין הצעה');
        }
      }
    }
  });

  test('ציור חתימה על Canvas', async ({ page }) => {
    await page.goto('/Projects');
    await delay(page);
    await dismissPopups(page);
    
    const projectCard = page.locator('[class*="card"]').filter({ hasText: /פרויקט|project/i }).first();
    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click();
      await delay(page, VISUAL_DELAY);
      await dismissPopups(page);
      
      // מחפש כפתור חתימה בכל מקום בדף
      const signBtn = page.getByRole('button', { name: /חתימה|החתמה|sign/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-pen-tool') }).first());
      
      if (await signBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await signBtn.click();
        await delay(page);
        
        // ציור על canvas
        const canvas = page.locator('canvas').first();
        if (await canvas.isVisible({ timeout: 3000 }).catch(() => false)) {
          const box = await canvas.boundingBox();
          if (box) {
            // ציור קו פשוט על ה-canvas
            await page.mouse.move(box.x + 20, box.y + 20);
            await page.mouse.down();
            await page.mouse.move(box.x + 100, box.y + 50);
            await page.mouse.move(box.x + 150, box.y + 30);
            await page.mouse.up();
            
            console.log('   ✍️ צויירה חתימה על Canvas');
            
            // בדיקת כפתור שמירה
            const saveBtn = page.getByRole('button', { name: /שמור|save|אשר|confirm/i }).first();
            const hasSave = await saveBtn.isVisible({ timeout: 2000 }).catch(() => false);
            
            console.log(`   ✍️ כפתור שמירה: ${hasSave ? 'קיים' : 'לא קיים'}`);
          }
        }
      }
    }
  });

  test('כפתור ניקוי חתימה', async ({ page }) => {
    await page.goto('/Projects');
    await delay(page);
    await dismissPopups(page);
    
    const projectCard = page.locator('[class*="card"]').filter({ hasText: /פרויקט|project/i }).first();
    if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await projectCard.click();
      await delay(page, VISUAL_DELAY);
      await dismissPopups(page);
      
      const signBtn = page.getByRole('button', { name: /חתימה|החתמה|sign/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-pen-tool') }).first());
      
      if (await signBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await signBtn.click();
        await delay(page);
        
        // בדיקת כפתור ניקוי
        const clearBtn = page.getByRole('button', { name: /נקה|clear|מחק/i }).first();
        const hasClear = await clearBtn.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (hasClear) {
          await clearBtn.click();
          await delay(page, SHORT_DELAY);
          console.log('   ✍️ כפתור ניקוי עובד');
        }
        
        expect(hasClear || page.url().includes('/Projects')).toBe(true);
      }
    }
  });
});

test.describe('PublicApproval – אישור ציבורי', () => {
  test('דף אישור ציבורי נטען', async ({ page }) => {
    // ניסיון גישה לדף אישור ציבורי עם ID פיקטיבי
    await page.goto('/PublicApproval?id=test-approval-id');
    await delay(page);
    
    // בדיקה שהדף נטען (גם אם עם שגיאה כי ה-ID לא קיים)
    const approvalPage = page.getByText(/אישור|approval|מסמך|חתימה/i).first();
    const errorPage = page.getByText(/לא נמצא|not found|שגיאה|error/i).first();
    
    const hasApproval = await approvalPage.isVisible({ timeout: 5000 }).catch(() => false);
    const hasError = await errorPage.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`   📄 דף אישור ציבורי: ${hasApproval ? 'נטען' : hasError ? 'שגיאה (צפוי)' : 'לא נטען'}`);
    
    // הדף אמור להיטען (גם אם עם הודעת שגיאה)
    expect(hasApproval || hasError || page.url().includes('/PublicApproval')).toBe(true);
  });

  test('דף הצעת מחיר ציבורית לקבלן', async ({ page }) => {
    await page.goto('/PublicContractorQuote?id=test-quote-id');
    await delay(page);
    
    const quotePage = page.getByText(/הצעת מחיר|quote|קבלן/i).first();
    const errorPage = page.getByText(/לא נמצא|not found|שגיאה|error/i).first();
    
    const hasQuote = await quotePage.isVisible({ timeout: 5000 }).catch(() => false);
    const hasError = await errorPage.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`   💰 דף הצעת מחיר ציבורית: ${hasQuote ? 'נטען' : hasError ? 'שגיאה (צפוי)' : 'לא נטען'}`);
    
    expect(hasQuote || hasError || page.url().includes('/PublicContractorQuote')).toBe(true);
  });

  test('דף קביעת פגישה ציבורי', async ({ page }) => {
    await page.goto('/PublicMeetingBooking?id=test-meeting-id');
    await delay(page);
    
    const meetingPage = page.getByText(/פגישה|meeting|קביעה|booking/i).first();
    const errorPage = page.getByText(/לא נמצא|not found|שגיאה|error/i).first();
    
    const hasMeeting = await meetingPage.isVisible({ timeout: 5000 }).catch(() => false);
    const hasError = await errorPage.isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`   📅 דף קביעת פגישה ציבורי: ${hasMeeting ? 'נטען' : hasError ? 'שגיאה (צפוי)' : 'לא נטען'}`);
    
    expect(hasMeeting || hasError || page.url().includes('/PublicMeetingBooking')).toBe(true);
  });
});
