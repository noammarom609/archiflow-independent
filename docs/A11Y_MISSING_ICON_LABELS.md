# סריקת כפתורי אייקון – מקומות שחסר aria-label

סריקה אחרי יישום TKT-06. הרשימה מציינת קבצים ושורות שבהן יש `Button` עם `size="icon"` (או כפתור אייקון דומה) **בלי** `aria-label` / `aria-pressed` במקום.

**יישום (2025):** כל הרשימה below יושמה – נוספו `aria-label` (ומפתחות `a11y.*` ב־LanguageProvider) בכל הכפתורים הרלוונטיים, כולל: הגדרות והתראות (Layout), כפתורים ראשיים בדאשבורד, דף ניהול פרויקטים, לוח שנה, ניהול משימות, ניהול והקלטת פגישות, ספריית תוכן, דפי תקשורת וכספים. אייקונים בתוך כפתורים סומנו ב־`aria-hidden`.

---

## 1. קבצים עם כפתורי אייקון ללא aria-label

### `src/components/projects/portfolio/PortfolioStageView.jsx`
- **שורה 319:** `<Button variant="ghost" size="icon" asChild>` – קישור צפייה במסמך (Eye). יש להוסיף `aria-label` על ה־`<a>` או על ה־Button (אם אפשר להעביר ל־Button ללא asChild).

### `src/components/library/ContentLibrary.jsx`
- **412:** כפתור תפריט (MoreVertical) ב־DropdownMenuTrigger.
- **493:** כפתור עריכה (Edit).
- **496:** כפתור שליחה (Send).
- **501:** כפתור תפריט (MoreVertical) ב־DropdownMenuTrigger.

### `src/components/leads/LeadFollowUpSection.jsx`
- **407:** כפתור אייקון (כנראה תפריט/פעולות).

### `src/pages/SuperAdminDashboard.jsx`
- **375:** כפתור אייקון (מחיקה/פעולה).
- **440:** כפתור אייקון.

### `src/components/library/moodboard/PropertiesPanel.jsx`
- **163:** כפתור שכפל – יש `title="שכפל"`, חסר `aria-label`.
- **166:** כפתור מחק – יש `title="מחק"`, חסר `aria-label`.

### `src/components/settings/SystemSettingsTab.jsx`
- **163:** `<Button onClick={addItem} size="icon" variant="outline">` – כפתור הוספת פריט.

### `src/components/projects/documents/ProjectDocumentsManager.jsx`
- **184:** כפתור הוספת תיקייה.
- **423:** כפתור הורדה.
- **426:** כפתור מחיקה.

### `src/components/library/moodboard_new/MoodboardEditor.jsx` (גרסה חדשה של העורך)
- **1137:** כפתור סגור.
- **1206:** Undo.
- **1215:** Redo.
- **1285:** ייצוא תמונה.
- **1711:** Zoom out.
- **1717:** Zoom in.

### `src/components/share/ShareDocumentDialog.jsx`
- **125:** כפתור סגור (X).

### `src/pages/TimeTracking.jsx`
- **355:** ניווט שבוע אחורה.
- **359:** ניווט שבוע קדימה.

### `src/pages/DesignLibrary.jsx`
- **1484:** כפתור אייקון.
- **1593:** כפתור אייקון.

### `src/components/time-tracking/TimeEntryRow.jsx`
- **187:** כפתור אייקון.

### `src/components/team/TeamMemberCard.jsx`
- **90:** כפתור אייקון.

### `src/components/library/moodboard_new/FloatingToolbar.jsx`
- **160:** צבע טקסט – יש `title`, חסר `aria-label`.
- **195:** שקיפות – יש `title`, חסר `aria-label`.
- **226:** סדר שכבות – יש `title`, חסר `aria-label`.
- **250:** יישור – יש `title`, חסר `aria-label`.
- **305:** שכפל – יש `title`, חסר `aria-label`.
- **334:** אפשרויות נוספות – יש `title`, חסר `aria-label`.

### `src/components/proposals/canvas/FreeformCanvas.jsx`
- **200:** Zoom out.
- **213:** Zoom in.

### `src/components/proposals/canvas/ElementPropertiesPanel.jsx`
- **72:** כפתור סגור.

### `src/components/proposals/PageTabs.jsx`
- **176:** כפתור אייקון (opacity-0 group-hover) – כנראה תפריט/פעולות.

### `src/components/library/content/VideoEditor.jsx`
- **225:** skipBackward.
- **239:** skipForward.
- **245:** toggleMute.

### `src/components/library/content/RichTextEditor.jsx`
- **149, 152:** Undo, Redo.
- **186, 189, 192, 195:** Bold, Italic, Underline, StrikeThrough.
- **204, 229:** כפתורים (צבע/רקע).
- **256, 259, 262, 265:** יישור (ימין, מרכז, שמאל, full).
- **272, 275, 278:** כותרות H1, H2, H3.
- **285, 288, 291:** רשימות ו־blockquote.
- **298, 301:** הוספת/הסרת קישור.
- **308:** copyToClipboard.

### `src/components/library/content/ImageEditor.jsx`
- **138, 141, 145, 148:** סיבוב/הפיכה – יש `title`, חסר `aria-label`.

### `src/components/calendar/MeetingScheduler/SchedulerModeOverlay.jsx`
- **38:** כפתור ביטול (onCancel).

### `src/components/calendar/WeekView.jsx`
- **77:** שבוע קודם.
- **80:** שבוע הבא.

### `src/components/calendar/MeetingScheduler/SchedulerWeekView.jsx`
- **119:** שבוע קודם.
- **122:** שבוע הבא.

### `src/components/projects/tasks/TaskListView.jsx`
- **177:** כפתור אייקון.

### `src/components/projects/tasks/TaskKanbanView.jsx`
- **98:** כפתור אייקון.

### `src/components/library/MoodboardDetailView.jsx`
- **194:** כפתור אייקון.

### `src/components/contractors/ContractorTable.jsx`
- **136:** כפתור אייקון.

### `src/components/clients/ClientTable.jsx`
- **117:** כפתור אייקון.

### `src/components/calendar/DayView.jsx`
- **51:** יום קודם.
- **54:** יום הבא.

### `src/components/calendar/AgendaView.jsx`
- **76:** שבוע קודם.
- **79:** שבוע הבא.

### `src/components/admin/UserTable.jsx`
- **190:** כפתור אייקון.

---

## 3. סיכום לפי עדיפות

1. **ניווט (Calendar, TimeTracking):** WeekView, DayView, AgendaView, SchedulerWeekView, TimeTracking – כפתורי חודש/שבוע/יום קודם והבא.
2. **דיאלוגים ופאנלים:** ShareDocumentDialog, ElementPropertiesPanel, SchedulerModeOverlay – כפתור סגור/ביטול.
3. **ספריית תוכן ועורכים:** ContentLibrary, VideoEditor, RichTextEditor, ImageEditor – תפריטים ופעולות עריכה.
4. **פרויקטים ומסמכים:** ProjectDocumentsManager, PortfolioStageView – צפייה, הורדה, מחיקה, תיקיות.
5. **טבלאות וכרטיסים:** ClientTable, ContractorTable, UserTable, TeamMemberCard, TaskListView, TaskKanbanView, LeadFollowUpSection – כפתורי תפריט/פעולות.
6. **Moodboard (ישן + חדש):** MoodboardEditor (שתי הגרסאות), PropertiesPanel, FloatingToolbar, MoodboardDetailView.
7. **אחר:** SuperAdminDashboard, SystemSettingsTab, DesignLibrary, TimeEntryRow, PageTabs, FreeformCanvas.

---

## 4. המלצה

- להוסיף בכל הכפתורים האלה לפחות `aria-label` (או `aria-pressed` בטגלים).
- להשתמש במפתחות קיימים מ־`LanguageProvider` (למשל `a11y.*`) או להוסיף מפתחות חדשים לפי צורך.
- בכפתורים עם `title` בלבד – להעתיק את התוכן ל־`aria-label` (ו־`title` יכול להישאר ל־tooltip).
