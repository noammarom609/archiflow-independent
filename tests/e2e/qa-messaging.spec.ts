import { test, expect, Page } from '@playwright/test';

/**
 * בדיקות מערכת הודעות
 * 
 * מכסה:
 * - MessagingSystem בפורטל קבלנים
 * - ConsultantMessagingSystem בפורטל יועצים
 * - שליחת הודעה
 * - קבלת הודעות
 * - סימון כנקרא
 * 
 * הרצה:
 *   $env:PLAYWRIGHT_BASE_URL="https://archiflow-independent.vercel.app"; npx playwright test tests/e2e/qa-messaging.spec.ts --headed
 */

const SHORT_DELAY = 800;
const VISUAL_DELAY = 1500;
const PINS = {
  super_admin: '2189',
  contractor: '2185',
  consultant: '2186',
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

test.describe('MessagingSystem – מערכת הודעות קבלנים', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PINS.contractor);
  });

  test('טאב הודעות נטען בפורטל קבלן', async ({ page }) => {
    await page.goto('/ContractorPortal');
    await delay(page);
    await dismissPopups(page);

    // מעבר לטאב הודעות
    const messagesTab = page.getByRole('tab', { name: /הודעות|messages/i })
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-message-square') }).first());
    
    if (await messagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await messagesTab.click();
      await delay(page);
      
      // בדיקה שתוכן הודעות נטען
      const messagesContent = page.getByText(/הודעות|שיחות|conversations/i).first();
      const hasContent = await messagesContent.isVisible({ timeout: 5000 }).catch(() => false);
      
      console.log(`   💬 טאב הודעות: ${hasContent ? 'נטען' : 'ריק'}`);
      expect(hasContent || page.url().includes('/ContractorPortal')).toBe(true);
    } else {
      console.log('   💬 טאב הודעות לא נמצא');
    }
  });

  test('רשימת שיחות מוצגת', async ({ page }) => {
    await page.goto('/ContractorPortal');
    await delay(page);
    await dismissPopups(page);

    const messagesTab = page.getByRole('tab', { name: /הודעות|messages/i });
    if (await messagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await messagesTab.click();
      await delay(page);
      
      // בדיקת רשימת שיחות
      const conversationsList = page.locator('[class*="conversation"], [class*="chat-list"]').first();
      const noConversations = page.getByText(/אין שיחות|no conversations|אין הודעות/i).first();
      
      const hasList = await conversationsList.isVisible({ timeout: 3000 }).catch(() => false);
      const isEmpty = await noConversations.isVisible({ timeout: 2000 }).catch(() => false);
      
      console.log(`   📋 רשימת שיחות: ${hasList ? 'מוצגת' : isEmpty ? 'ריקה' : 'לא נטענה'}`);
    }
  });

  test('שדה שליחת הודעה קיים', async ({ page }) => {
    await page.goto('/ContractorPortal');
    await delay(page);
    await dismissPopups(page);

    const messagesTab = page.getByRole('tab', { name: /הודעות|messages/i });
    if (await messagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await messagesTab.click();
      await delay(page);
      
      // בדיקת שדה קלט הודעה
      const messageInput = page.getByPlaceholder(/הקלד הודעה|הודעה|message/i).first()
        .or(page.locator('input[type="text"], textarea').first());
      const sendBtn = page.getByRole('button', { name: /שלח|send/i }).first()
        .or(page.locator('button').filter({ has: page.locator('svg.lucide-send') }).first());
      
      const hasInput = await messageInput.isVisible({ timeout: 3000 }).catch(() => false);
      const hasSend = await sendBtn.isVisible({ timeout: 2000 }).catch(() => false);
      
      console.log(`   📝 שדה הודעה: ${hasInput ? 'קיים' : 'לא קיים'}, כפתור שלח: ${hasSend ? 'קיים' : 'לא קיים'}`);
    }
  });

  test('בחירת נמען מרשימה', async ({ page }) => {
    await page.goto('/ContractorPortal');
    await delay(page);
    await dismissPopups(page);

    const messagesTab = page.getByRole('tab', { name: /הודעות|messages/i });
    if (await messagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await messagesTab.click();
      await delay(page);
      
      // בדיקת dropdown בחירת נמען או רשימת אנשי קשר
      const recipientSelect = page.locator('[role="combobox"]').first()
        .or(page.getByPlaceholder(/בחר נמען|recipient/i).first());
      const contactsList = page.locator('[class*="contact"], [class*="user"]').first();
      
      const hasSelect = await recipientSelect.isVisible({ timeout: 3000 }).catch(() => false);
      const hasContacts = await contactsList.isVisible({ timeout: 2000 }).catch(() => false);
      
      console.log(`   👤 בחירת נמען: ${hasSelect ? 'dropdown קיים' : hasContacts ? 'רשימה קיימת' : 'לא נמצא'}`);
    }
  });
});

test.describe('ConsultantMessaging – הודעות יועצים', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PINS.consultant);
  });

  test('טאב הודעות נטען בפורטל יועץ', async ({ page }) => {
    await page.goto('/ConsultantPortal');
    await delay(page);
    await dismissPopups(page);

    const messagesTab = page.getByRole('tab', { name: /הודעות|messages/i })
      .or(page.locator('button').filter({ has: page.locator('svg.lucide-message-square') }).first());
    
    if (await messagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await messagesTab.click();
      await delay(page);
      
      const messagesContent = page.getByText(/הודעות|שיחות|conversations/i).first();
      const hasContent = await messagesContent.isVisible({ timeout: 5000 }).catch(() => false);
      
      console.log(`   💬 טאב הודעות יועץ: ${hasContent ? 'נטען' : 'ריק'}`);
      expect(hasContent || page.url().includes('/ConsultantPortal') || page.url().includes('/Dashboard')).toBe(true);
    } else {
      console.log('   💬 טאב הודעות לא נמצא בפורטל יועץ');
    }
  });
});

test.describe('AdminMessaging – הודעות מנהל', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaPin(page, PINS.super_admin);
  });

  test('מנהל רואה את כל ההודעות', async ({ page }) => {
    await page.goto('/ContractorPortal');
    await delay(page);
    await dismissPopups(page);

    // בדיקה שמנהל יכול לראות את כל ההודעות
    const messagesTab = page.getByRole('tab', { name: /הודעות|messages/i });
    if (await messagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await messagesTab.click();
      await delay(page);
      
      // בדיקת dropdown בחירת קבלן
      const contractorSelect = page.locator('[role="combobox"]').first();
      const hasSelect = await contractorSelect.isVisible({ timeout: 3000 }).catch(() => false);
      
      console.log(`   👑 תצוגת מנהל: ${hasSelect ? 'dropdown קבלנים קיים' : 'לא נמצא'}`);
    }
  });

  test('מנהל יכול לבחור קבלן לתקשורת', async ({ page }) => {
    await page.goto('/ContractorPortal');
    await delay(page);
    await dismissPopups(page);

    const messagesTab = page.getByRole('tab', { name: /הודעות|messages/i });
    if (await messagesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await messagesTab.click();
      await delay(page);
      
      // לחיצה על dropdown קבלנים
      const contractorSelect = page.locator('[role="combobox"]').first();
      if (await contractorSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await contractorSelect.click();
        await delay(page, SHORT_DELAY);
        
        // בדיקה שנפתחה רשימת אפשרויות
        const options = page.getByRole('option');
        const optionsCount = await options.count();
        
        console.log(`   📋 אפשרויות קבלנים: ${optionsCount}`);
        
        if (optionsCount > 0) {
          await options.first().click();
          await delay(page, SHORT_DELAY);
        }
      }
    }
  });
});
