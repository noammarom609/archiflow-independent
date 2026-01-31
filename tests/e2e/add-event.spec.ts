import { test, expect } from '@playwright/test';

/**
 * E2E: הוספת אירוע ללוח שנה (Add Event flow)
 *
 * דרישות:
 * - האפליקציה רצה ב־localhost:5173 (או PLAYWRIGHT_BASE_URL)
 * - משתמש מחובר – דף לוח שנה מציג את כפתור "חדש" (add-event-btn).
 *   אם מופיע "נדרשת התחברות", יש להתחבר ידנית ואז להריץ את הבדיקה.
 */
test.describe('Add calendar event', () => {
  test('open dialog, fill title and description, submit', async ({ page }) => {
    await page.goto('/Calendar');

    // דרוש משתמש מחובר. אם כפתור "חדש" לא מופיע תוך 8s – כנראה מסך התחברות.
    const addBtn = page.getByTestId('add-event-btn');
    await addBtn.click({ timeout: 8000 });

    // הטופס נפתח – כותרת ותיאור
    const titleInput = page.getByTestId('add-event-title');
    await titleInput.fill('פגישת בדיקה E2E');

    const descriptionInput = page.getByLabel(/תיאור/i);
    await descriptionInput.fill('נוצר על ידי Playwright');

    // שליחה
    const submitBtn = page.getByTestId('add-event-submit');
    await submitBtn.click();

    // וידוא: הודעת הצלחה או שהאירוע מופיע (לפי מה שהאפליקציה מציגה)
    await expect(
      page.getByText(/אירוע נוסף בהצלחה|פגישת בדיקה E2E/i)
    ).toBeVisible({ timeout: 15000 });
  });
});
