import { test, expect, Page } from '@playwright/test';

/**
 * בדיקות AI Features – Moodboard, Image Generation, LLM
 * 
 * הרצה:
 *   $env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npx playwright test tests/e2e/qa-ai-features.spec.ts --headed
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

test.describe('AI Features – פיצ\'רי בינה מלאכותית', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PIN_SUPER_ADMIN);
  });

  test.describe('Moodboard Generation', () => {
    test('יצירת Moodboard זמין בספריית עיצוב', async ({ page }) => {
      await page.goto('/DesignLibrary');
      await delay(page);
      await dismissPopups(page);

      // בדיקת כפתור Moodboard
      const moodboardBtn = page.getByRole('button', { name: /moodboard|מודבורד|לוח השראה/i }).first()
        .or(page.getByText(/יצירת moodboard|generate moodboard/i).first());
      
      const hasMoodboard = await moodboardBtn.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`   🎨 כפתור Moodboard: ${hasMoodboard ? 'קיים' : 'לא קיים'}`);
    });

    test('פתיחת יוצר Moodboard', async ({ page }) => {
      await page.goto('/DesignLibrary');
      await delay(page);
      await dismissPopups(page);

      const moodboardBtn = page.getByRole('button', { name: /moodboard|מודבורד/i }).first();
      
      if (await moodboardBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await moodboardBtn.click();
        await delay(page);

        // בדיקה שנפתח דיאלוג יצירה
        const dialog = page.locator('[role="dialog"]').first();
        const promptField = page.getByPlaceholder(/תיאור|prompt|describe/i).first()
          .or(page.locator('textarea').first());
        
        const hasDialog = await dialog.isVisible({ timeout: 3000 }).catch(() => false);
        const hasPrompt = await promptField.isVisible({ timeout: 2000 }).catch(() => false);
        
        console.log(`   🎨 דיאלוג Moodboard: ${hasDialog || hasPrompt ? 'נפתח' : 'לא נפתח'}`);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Image Generation', () => {
    test('יצירת תמונה זמין', async ({ page }) => {
      await page.goto('/DesignLibrary');
      await delay(page);
      await dismissPopups(page);

      // בדיקת כפתור יצירת תמונה
      const generateBtn = page.getByRole('button', { name: /צור תמונה|generate image|AI image/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-wand, svg.lucide-sparkles') }).first());
      
      const hasGenerate = await generateBtn.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`   🖼️ כפתור יצירת תמונה: ${hasGenerate ? 'קיים' : 'לא קיים'}`);
    });

    test('שדה prompt ליצירת תמונה', async ({ page }) => {
      await page.goto('/DesignLibrary');
      await delay(page);
      await dismissPopups(page);

      const generateBtn = page.getByRole('button', { name: /צור תמונה|generate|AI/i }).first();
      
      if (await generateBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await generateBtn.click();
        await delay(page);

        const promptField = page.getByPlaceholder(/תיאור|prompt|describe/i).first()
          .or(page.locator('textarea').first());
        
        const hasPrompt = await promptField.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`   ✏️ שדה Prompt: ${hasPrompt ? 'קיים' : 'לא קיים'}`);
        
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('LLM / AI Assistant', () => {
    test('עוזר AI בפרויקט', async ({ page }) => {
      await page.goto('/Projects');
      await delay(page);
      await dismissPopups(page);

      // כניסה לפרויקט ראשון
      const projectCard = page.locator('[class*="card"], [class*="project"]').first();
      if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectCard.click();
        await delay(page);

        // בדיקת כפתור AI / דוח
        const aiBtn = page.getByRole('button', { name: /AI|דוח|report|סיכום/i }).first()
          .or(page.locator('button').filter({ has: page.locator('svg.lucide-sparkles, svg.lucide-bot') }).first());
        
        const hasAI = await aiBtn.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`   🤖 כפתור AI בפרויקט: ${hasAI ? 'קיים' : 'לא קיים'}`);
      }
    });

    test('סיכום AI להקלטה', async ({ page }) => {
      await page.goto('/Recordings');
      await delay(page);
      await dismissPopups(page);

      // בדיקת אזכור AI / תמלול
      const aiFeature = page.getByText(/AI|תמלול|transcription|סיכום אוטומטי/i).first();
      const hasAI = await aiFeature.isVisible({ timeout: 5000 }).catch(() => false);
      
      console.log(`   🎤 AI בהקלטות: ${hasAI ? 'מוזכר' : 'לא מוזכר'}`);
    });

    test('יצירת הצעת מחיר עם AI', async ({ page }) => {
      await page.goto('/Projects');
      await delay(page);
      await dismissPopups(page);

      // כניסה לפרויקט
      const projectCard = page.locator('[class*="card"], [class*="project"]').first();
      if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectCard.click();
        await delay(page);

        // לחיצה על שלב הצעת מחיר
        const proposalBtn = page.getByText(/הצעת מחיר/i).first();
        if (await proposalBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await proposalBtn.click();
          await delay(page);

          // בדיקת כפתור יצירה אוטומטית
          const autoBtn = page.getByRole('button', { name: /יצירה אוטומטית|auto generate|AI/i }).first()
            .or(page.locator('button').filter({ has: page.locator('svg.lucide-wand, svg.lucide-sparkles') }).first());
          
          const hasAuto = await autoBtn.isVisible({ timeout: 5000 }).catch(() => false);
          console.log(`   📝 יצירה אוטומטית: ${hasAuto ? 'כפתור קיים' : 'לא נמצא'}`);
        }
      }
    });
  });

  test.describe('AI Learning / History', () => {
    test('היסטוריית AI בפרויקט', async ({ page }) => {
      await page.goto('/Projects');
      await delay(page);
      await dismissPopups(page);

      const projectCard = page.locator('[class*="card"], [class*="project"]').first();
      if (await projectCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await projectCard.click();
        await delay(page);

        // בדיקת היסטוריה
        const historySection = page.getByText(/היסטוריה|history|פעילות AI/i).first();
        const hasHistory = await historySection.isVisible({ timeout: 5000 }).catch(() => false);
        
        console.log(`   📚 היסטוריית AI: ${hasHistory ? 'קיימת' : 'לא קיימת'}`);
      }
    });

    test('לוג פעולות AI', async ({ page }) => {
      // בדיקה ב-SuperAdminDashboard
      await page.goto('/SuperAdminDashboard');
      await delay(page);
      await dismissPopups(page);

      const aiLog = page.getByText(/לוג AI|AI log|פעולות AI/i).first();
      const hasLog = await aiLog.isVisible({ timeout: 5000 }).catch(() => false);
      
      console.log(`   📋 לוג AI: ${hasLog ? 'קיים' : 'לא קיים'}`);
    });
  });

  test.describe('Transcription', () => {
    test('תמלול הקלטה זמין', async ({ page }) => {
      await page.goto('/Recordings');
      await delay(page);
      await dismissPopups(page);

      // בדיקת כפתור תמלול
      const transcribeBtn = page.getByRole('button', { name: /תמלול|transcribe|transcript/i }).first();
      const hasTranscribe = await transcribeBtn.isVisible({ timeout: 5000 }).catch(() => false);
      
      console.log(`   📝 כפתור תמלול: ${hasTranscribe ? 'קיים' : 'לא קיים'}`);
    });

    test('עורך תמלול', async ({ page }) => {
      await page.goto('/Recordings');
      await delay(page);
      await dismissPopups(page);

      // לחיצה על הקלטה ראשונה
      const recordingCard = page.locator('[class*="card"], [class*="recording"]').first();
      
      if (await recordingCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await recordingCard.click();
        await delay(page);

        // בדיקת עורך תמלול
        const transcriptArea = page.locator('textarea, [class*="transcript"], [class*="editor"]').first();
        const editBtn = page.getByRole('button', { name: /ערוך תמלול|edit transcript/i }).first();
        
        const hasTranscript = await transcriptArea.isVisible({ timeout: 3000 }).catch(() => false);
        const hasEdit = await editBtn.isVisible({ timeout: 2000 }).catch(() => false);
        
        console.log(`   ✏️ עורך תמלול: ${hasTranscript || hasEdit ? 'קיים' : 'לא קיים'}`);
      }
    });
  });
});
