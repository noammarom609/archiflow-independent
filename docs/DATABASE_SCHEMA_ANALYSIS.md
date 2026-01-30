# ניתוח סכימת מסד הנתונים - ArchiFlow
## תאריך: 30 ינואר 2026

### ✅ עדכון: המיגרציות הוחלו בהצלחה!

**מיגרציות שנוספו והוחלו:**
- `015_add_critical_missing_entities.sql` - 4 טבלאות קריטיות
- `016_add_specialized_entities.sql` - 5 טבלאות ייעודיות  
- `017_add_ai_tracking_entities.sql` - 2 טבלאות AI

**סה"כ נוספו 11 טבלאות חדשות למסד הנתונים.**

---

### סיכום מקורי
ניתוח השוואתי בין הסכימה המלאה (archiflow-schema-2026-01-30.json) לבין המבנה הקיים במסד הנתונים.

---

## ישויות קיימות בסכימה ובקוד
הישויות הבאות מופיעות גם בסכימה וגם ב-`src/api/archiflow.js`:

1. ✅ **User** - משתמש במערכת
2. ✅ **Client** - לקוח
3. ✅ **Contractor** - קבלן/שותף
4. ✅ **Consultant** - יועץ
5. ✅ **Supplier** - ספק
6. ✅ **TeamMember** - איש צוות
7. ✅ **Project** - פרויקט
8. ✅ **Task** - משימה
9. ✅ **Document** - מסמך
10. ✅ **Recording** - הקלטה
11. ✅ **Notification** - התראה
12. ✅ **Invoice** - חשבונית
13. ✅ **Expense** - הוצאה
14. ✅ **Proposal** - הצעת מחיר
15. ✅ **CalendarEvent** - אירוע ביומן
16. ✅ **TimeEntry** - דיווח שעות
17. ✅ **ProposalTemplate** - תבנית הצעת מחיר (קיים בקוד)
18. ✅ **ProposalClause** - סעיף בהצעת מחיר (קיים בקוד)
19. ✅ **ProjectConsultant** - קישור יועץ לפרויקט (קיים בקוד וב-migration 006)
20. ✅ **Comment** - תגובה (קיים בקוד)
21. ✅ **Message** - הודעה (קיים בקוד)
22. ✅ **JournalEntry** - יומן עבודה (קיים בקוד)
23. ✅ **Moodboard** - לוח השראה (קיים בקוד)
24. ✅ **DesignAsset** - נכס עיצובי (קיים בקוד)
25. ✅ **ContentItem** - פריט תוכן (קיים בקוד)
26. ✅ **ProjectPermission** - הרשאות פרויקט (קיים בקוד)
27. ✅ **MeetingSlot** - חלון פגישה (קיים בקוד)
28. ✅ **PushSubscription** - מנוי להתראות דחיפה (קיים בקוד)
29. ✅ **ContractorQuote** - הצעת מחיר מקבלן (קיים בקוד)
30. ✅ **ConsultantTask** - משימת יועץ (קיים בקוד)
31. ✅ **SystemSettings** - הגדרות מערכת (קיים בקוד)
32. ✅ **TranscriptionCorrection** - תיקון תמלול (קיים בקוד)
33. ✅ **UserGoogleToken** - טוקן Google של משתמש (קיים בקוד)
34. ✅ **Receipt** - קבלה (קיים בקוד)

---

## ישויות שמופיעות בסכימה אך חסרות בקוד

### 1. **RecordingFolder** (תיקיית הקלטות) ⚠️
**מופיע ב:** `allEntityNames` בסכימה (שורה 1719)
**חסר ב:** `archiflow.js` entityMap

**תיאור**: תיקיית הקלטות לארגון וקיבוץ הקלטות לפי פרויקטים או נושאים
**שדות צפויים** (לא מוגדרים בסכימה, אך משתמעים מההקשר):
- `id` - מזהה ייחודי
- `name` - שם התיקייה
- `project_id` - קישור לפרויקט
- `description` - תיאור
- `created_at`, `updated_at`
- `architect_id`, `architect_email`

**התייחסות בקוד הקיים**:
- Recording entity מכיל שדות: `folder_id`, `folder_name` (שורות 1152-1158 בסכימה)
- אין הגדרה של הישות עצמה

---

### 2. **PushSubscription** (מנוי להתראות דחיפה) ✅
**מצב**: קיים בקוד ב-`archiflow.js` (שורה 40)
**חסר**: הגדרת השדות בסכימה המלאה

---

### 3. **ContractorDocument** (מסמך קבלן) ⚠️
**מופיע ב:** `allEntityNames` בסכימה (שורה 1730)
**חסר ב:** `archiflow.js` entityMap

**תיאור**: מסמכים שקשורים לקבלנים (חוזים, אישורים, תעודות)
**שדות צפויים**:
- `id` - מזהה ייחודי
- `contractor_id` - קישור לקבלן
- `title` - כותרת המסמך
- `description` - תיאור
- `file_url` - קישור לקובץ
- `file_type` - סוג הקובץ
- `category` - קטגוריה (contract, certificate, insurance, etc.)
- `expiry_date` - תאריך תפוגה
- `status` - סטטוס (active, expired, archived)
- `created_at`, `updated_at`
- `architect_id`, `architect_email`

---

### 4. **ConsultantMessage** (הודעת יועץ) ⚠️
**מופיע ב:** `allEntityNames` בסכימה (שורה 1724)
**חסר ב:** `archiflow.js` entityMap

**תיאור**: הודעות ספציפיות ליועצים (נפרדות מהודעות רגילות)
**שדות צפויים**:
- `id` - מזהה ייחודי
- `consultant_id` - קישור ליועץ
- `project_id` - קישור לפרויקט (אופציונלי)
- `from_user_id` - שולח ההודעה
- `message` - תוכן ההודעה
- `read` - האם נקראה
- `read_date` - תאריך קריאה
- `created_at`, `updated_at`
- `architect_id`, `architect_email`

---

### 5. **ConsultantDocument** (מסמך יועץ) ⚠️
**מופיע ב:** `allEntityNames` בסכימה (שורה 1725)
**חסר ב:** `archiflow.js` entityMap

**תיאור**: מסמכים שקשורים ליועצים (דוחות, חוות דעת, תוכניות)
**שדות צפויים**:
- `id` - מזהה ייחודי
- `consultant_id` - קישור ליועץ
- `project_id` - קישור לפרויקט
- `title` - כותרת המסמך
- `description` - תיאור
- `file_url` - קישור לקובץ
- `file_type` - סוג הקובץ
- `category` - קטגוריה (report, plan, opinion, etc.)
- `status` - סטטוס (draft, submitted, approved)
- `created_at`, `updated_at`
- `architect_id`, `architect_email`

---

### 6. **ShareLink** (קישור שיתוף) ⚠️
**מופיע ב:** `allEntityNames` בסכימה (שורה 1737)
**חסר ב:** `archiflow.js` entityMap

**תיאור**: קישורי שיתוף למסמכים או פרויקטים עם גישה מוגבלת
**שדות צפויים**:
- `id` - מזהה ייחודי
- `token` - טוקן ייחודי לקישור
- `entity_type` - סוג הישות (project, document, proposal, etc.)
- `entity_id` - מזהה הישות
- `expires_at` - תאריך תפוגה
- `password` - סיסמה (אופציונלי)
- `access_count` - מספר גישות
- `max_access` - מספר גישות מקסימלי
- `permissions` - הרשאות (view, download, comment)
- `created_by` - יוצר הקישור
- `created_at`, `updated_at`
- `architect_id`, `architect_email`

---

### 7. **ClientAccess** (גישת לקוח) ⚠️
**מופיע ב:** `allEntityNames` בסכימה (שורה 1738)
**חסר ב:** `archiflow.js` entityMap

**תיאור**: ניהול גישה של לקוחות למסמכים ופרויקטים
**שדות צפויים**:
- `id` - מזהה ייחודי
- `client_id` - קישור ללקוח
- `project_id` - קישור לפרויקט
- `access_level` - רמת גישה (view, comment, approve)
- `allowed_sections` - מערך של מקטעים מותרים
- `expires_at` - תאריך תפוגה
- `last_access` - גישה אחרונה
- `created_at`, `updated_at`
- `architect_id`, `architect_email`

---

### 8. **DocumentSignature** (חתימה על מסמך) ⚠️
**מופיע ב:** `allEntityNames` בסכימה (שורה 1739)
**חסר ב:** `archiflow.js` entityMap

**תיאור**: חתימות דיגיטליות על מסמכים (חוזים, הצעות מחיר)
**שדות צפויים**:
- `id` - מזהה ייחודי
- `document_id` - קישור למסמך או proposal_id
- `entity_type` - סוג הישות (proposal, contract, document)
- `entity_id` - מזהה הישות
- `signer_name` - שם החותם
- `signer_email` - אימייל החותם
- `signature_data` - נתוני החתימה (base64 או URL)
- `signature_type` - סוג חתימה (digital, drawn, uploaded)
- `ip_address` - כתובת IP
- `signed_at` - תאריך חתימה
- `created_at`, `updated_at`
- `architect_id`, `architect_email`

**הערה**: ישות Proposal מכילה שדה `signature_id` (שורה 1497 בסכימה)

---

### 9. **CADFile** (קובץ CAD) ⚠️
**מופיע ב:** `allEntityNames` בסכימה (שורה 1744)
**חסר ב:** `archiflow.js` entityMap

**תיאור**: קבצי CAD (DWG, DXF, SKP, etc.) עם מטא-דאטה
**שדות צפויים**:
- `id` - מזהה ייחודי
- `project_id` - קישור לפרויקט
- `title` - כותרת
- `description` - תיאור
- `file_url` - קישור לקובץ
- `file_type` - סוג קובץ (dwg, dxf, skp, rvt, etc.)
- `file_size` - גודל הקובץ
- `version` - מספר גרסה
- `stage` - שלב בפרויקט (survey, concept, technical, etc.)
- `thumbnail_url` - תמונה ממוזערת
- `created_at`, `updated_at`
- `architect_id`, `architect_email`

---

### 10. **ProjectSelection** (בחירות פרויקט) ⚠️
**מופיע ב:** `allEntityNames` בסכימה (שורה 1745)
**חסר ב:** `archiflow.js` entityMap

**תיאור**: מעקב אחר בחירות חומרים ומוצרים לפרויקט
**שדות צפויים**:
- `id` - מזהה ייחודי
- `project_id` - קישור לפרויקט
- `category` - קטגוריה (flooring, lighting, furniture, etc.)
- `item_name` - שם הפריט
- `supplier_id` - קישור לספק
- `supplier_name` - שם הספק
- `model_number` - מספר דגם
- `price` - מחיר
- `quantity` - כמות
- `total_cost` - עלות כוללת
- `status` - סטטוס (pending, approved, ordered, delivered)
- `notes` - הערות
- `image_url` - תמונה
- `specification_url` - קישור למפרט
- `approved_by` - מאשר
- `approved_date` - תאריך אישור
- `created_at`, `updated_at`
- `architect_id`, `architect_email`

---

### 11. **AILearning** (למידת AI) ⚠️
**מופיע ב:** `allEntityNames` בסכימה (שורה 1751)
**חסר ב:** `archiflow.js` entityMap

**תיאור**: מעקב אחר למידה ושיפורים של מודלי AI
**שדות צפויים**:
- `id` - מזהה ייחודי
- `architect_id` - קישור לאדריכל
- `architect_email` - אימייל האדריכל
- `learning_type` - סוג למידה (transcription_correction, preference_pattern, style_recognition, etc.)
- `context` - הקשר (project, client, general)
- `input_data` - נתוני קלט (JSON)
- `correction_data` - נתוני תיקון (JSON)
- `feedback_score` - ציון משוב
- `applied` - האם יושם
- `created_at`, `updated_at`

---

### 12. **ProjectAIHistory** (היסטוריית AI של פרויקט) ⚠️
**מופיע ב:** `allEntityNames` בסכימה (שורה 1752)
**חסר ב:** `archiflow.js` entityMap

**תיאור**: מעקב אחר כל פעולות AI שבוצעו בפרויקט
**שדות צפויים**:
- `id` - מזהה ייחודי
- `project_id` - קישור לפרויקט
- `action_type` - סוג פעולה (transcription, analysis, generation, suggestion, etc.)
- `input_data` - נתוני קלט (JSON)
- `output_data` - נתוני פלט (JSON)
- `model_used` - מודל שנעשה בו שימוש
- `tokens_used` - מספר טוקנים
- `cost` - עלות
- `status` - סטטוס (success, failed, partial)
- `error_message` - הודעת שגיאה
- `created_at`
- `architect_id`, `architect_email`

**הערה**: ישות Project מכילה שדות:
- `ai_insights` (שורה 831)
- `ai_insights_history` (שורה 836)

---

## שדות חסרים בישויות קיימות

### User (משתמש)
השוואה לסכימה (שורות 7-91):

#### שדות קיימים בסכימה שצריך לוודא שקיימים ב-DB:
- ✅ `app_role` - תפקיד באפליקציה (enum)
- ✅ `allowed_pages` - רשימת דפים מורשים (array)
- ✅ `approval_status` - סטטוס אישור (enum: pending, approved, rejected)
- ✅ `status` - סטטוס משתמש (enum: active, pending_approval, suspended)
- ✅ `architect_id` - מזהה האדריכל המנהל
- ✅ `architect_email` - אימייל האדריכל
- ✅ `phone` - טלפון
- ✅ `avatar_url` - תמונת פרופיל
- ✅ `approved_by` - מי אישר
- ✅ `approved_date` - תאריך אישור
- ✅ `last_login` - כניסה אחרונה
- ✅ `google_refresh_token` - Google OAuth refresh token

**פעולה נדרשת**: יש לבדוק שכל השדות הללו קיימים בטבלת users.

---

### Client (לקוח)
השוואה לסכימה (שורות 92-243):

#### שדות שכנראה קיימים (לפי הקוד):
- ✅ `full_name`, `email`, `phone`, `address`, `city`, `company`
- ✅ `profession`, `family_status`, `adults_count`, `children_count`, `children_ages`, `pets`
- ✅ `status`, `source`, `referral_source`, `first_contact_date`
- ✅ `projects` (array), `preferences`, `personal_preferences`, `ai_insights`
- ✅ `notes`, `avatar_url`, `lifetime_value`, `timeline`
- ✅ `architect_id`, `architect_email`, `approval_status`, `approved_by`, `approved_date`

**פעולה נדרשת**: בדיקת קיום כל השדות בטבלה.

---

### Contractor (קבלן)
השוואה לסכימה (שורות 244-360):

#### שדות שנוספו במיגרציות אחרונות:
- ✅ `approval_status` (migration 006)
- ✅ `status` (migration 007)
- ✅ `projects_completed` (migration 008)
- ✅ `rating` (migration 008)
- ✅ `type` (migration 009)
- ✅ `architect_email` nullable (migration 010)
- ✅ `created_by` nullable (migration 011)

#### שדות שצריך לוודא:
- ✅ `user_status` - סטטוס הזמנה (enum: not_invited, invited, active, disabled)
- ✅ `approved_by` - מזהה מאשר
- ✅ `approved_date` - תאריך אישור
- ✅ `name`, `specialty`, `company`, `phone`, `email`
- ✅ `hourly_rate`, `notes`, `avatar_url`

**פעולה נדרשת**: בדיקת קיום כל השדות.

---

### Consultant (יועץ)
השוואה לסכימה (שורות 361-483):

#### שדות שנוספו במיגרציות אחרונות:
- ✅ `approval_status` (migration 006)
- ✅ `status` (migration 007)
- ✅ `architect_email` nullable (migration 014)
- ✅ `created_by` nullable (migration 014)

#### שדות שצריך לוודא:
- ✅ `user_status` - סטטוס משתמש (enum: not_invited, invited, active, disabled)
- ✅ `user_invited_at` - תאריך הזמנה
- ✅ `user_activated_at` - תאריך הפעלה
- ✅ `approved_by` - אימייל מאשר
- ✅ `approved_at` - תאריך אישור
- ✅ `name`, `consultant_type`, `email`, `phone`, `company`
- ✅ `license_number`, `address`, `notes`, `rating`
- ✅ `projects_count`, `avatar_url`

**פעולה נדרשת**: בדיקת קיום כל השדות.

---

### Supplier (ספק)
השוואה לסכימה (שורות 484-605):

#### שדות שנוספו במיגרציות אחרונות:
- ✅ `approval_status` (migration 006)
- ✅ `category` (migration 007)
- ✅ `status`, `rating`, `orders_completed`, `delivery_time`, `payment_terms` (migration 012)
- ✅ `website`, `address` (migration 013)
- ✅ `architect_email`, `created_by` nullable (migration 012)

#### שדות שצריך לוודא:
- ✅ `user_status` - סטטוס הזמנה (enum)
- ✅ `approved_by` - מזהה מאשר
- ✅ `approved_date` - תאריך אישור
- ✅ `name`, `company`, `phone`, `email`
- ✅ `notes`, `avatar_url`

**פעולה נדרשת**: בדיקת קיום כל השדות.

---

### TeamMember (איש צוות)
השוואה לסכימה (שורות 606-709):

#### שדות שצריך לוודא:
- ✅ `full_name`, `email`, `phone`, `role`
- ✅ `permissions` (object)
- ✅ `avatar_url`, `department`, `status`, `hourly_rate`
- ✅ `specialties` (array), `projects_assigned` (array), `notes`
- ✅ `architect_id`, `architect_email`
- ✅ `approval_status`, `approved_by`, `approved_date`

**פעולה נדרשת**: בדיקת קיום כל השדות בטבלת team_members.

---

### Project (פרויקט)
השוואה לסכימה (שורות 710-892):

#### שדות רבים - צריך לוודא את כולם:
- ✅ שדות בסיסיים: `name`, `project_type`, `location`, `timeline`, `budget`, `status`, `sub_stage`
- ✅ פרטי לקוח: `client_id`, `client`, `client_email`, `client_phone`
- ✅ `image`, `description`, `start_date`, `end_date`, `notes`
- ✅ שדות הקלטה: `first_call_recording_id`, `first_meeting_recording_id`
- ✅ צ'קליסטים: `phone_call_checklist`, `client_needs_checklist`
- ✅ `program_data`, `survey_files`
- ✅ AI: `ai_insights`, `ai_insights_history`
- ✅ `proposal_id`, `gantt_data`
- ✅ אישורים: `sketches_approved`, `renderings_approved`, `technical_approved`
- ✅ היתרים: `permit_skipped`, `permit_documents`, `permit_number`
- ✅ ביצוע: `selected_contractors`, `execution_notes`
- ✅ סיום: `completion_date`, `client_feedback`

**פעולה נדרשת**: בדיקת קיום כל השדות.

---

### Task (משימה)
השוואה לסכימה (שורות 893-1000):

#### שדות שצריך לוודא:
- ✅ `title`, `description`, `project_id`, `project_name`
- ✅ `contractor_id`, `contractor_name`
- ✅ `assigned_to` (array)
- ✅ `status` (enum), `priority` (enum)
- ✅ תאריכים: `start_date`, `due_date`, `completed_date`
- ✅ עלויות: `estimated_hours`, `actual_hours`, `estimated_cost`, `actual_cost`
- ✅ אישור: `approval_required`, `approved_by`
- ✅ `notes`, `dependencies` (array), `progress`

**פעולה נדרשת**: בדיקת קיום כל השדות.

---

### Document (מסמך)
השוואה לסכימה (שורות 1001-1096):

#### שדות שצריך לוודא:
- ✅ `title`, `description`, `file_url`, `file_type`, `file_size`
- ✅ `category`, `folder_name`
- ✅ `project_id`, `project_name`, `recording_id`, `contractor_id`
- ✅ `shared_with` (array), `tags` (array)
- ✅ `version`, `status`

**פעולה נדרשת**: בדיקת קיום כל השדות.

---

### Recording (הקלטה)
השוואה לסכימה (שורות 1097-1168):

#### שדות שצריך לוודא:
- ✅ `title`, `audio_url`, `duration`
- ✅ `transcription`, `analysis`, `deep_analysis`, `advanced_insights`
- ✅ `status` (enum), `error_message`
- ✅ `project_id`, `project_name`
- ✅ `folder_id`, `folder_name` (אבל RecordingFolder חסרה כישות!)
- ✅ `distribution_log` (array)

**פעולה נדרשת**: בדיקת קיום כל השדות + יצירת RecordingFolder.

---

### Notification (התראה)
השוואה לסכימה (שורות 1169-1257):

#### שדות שצריך לוודא:
- ✅ `user_id`, `user_email`, `title`, `message`
- ✅ `type` (enum רחב מאוד - 21 ערכים!)
- ✅ `link`, `is_read`, `read_date`
- ✅ `priority` (enum)
- ✅ `entity_type`, `entity_id`, `metadata` (object)

**פעולה נדרשת**: בדיקת קיום כל השדות.

---

### Invoice (חשבונית)
השוואה לסכימה (שורות 1258-1319):

#### שדות שצריך לוודא:
- ✅ `invoice_number`, `project_id`, `project_name`, `client_name`
- ✅ `amount`, `status` (enum)
- ✅ תאריכים: `issue_date`, `due_date`, `paid_date`
- ✅ `description`, `notes`

**פעולה נדרשת**: בדיקת קיום כל השדות בטבלת invoices.

---

### Expense (הוצאה)
השוואה לסכימה (שורות 1320-1379):

#### שדות שצריך לוודא:
- ✅ `description`, `category` (enum), `amount`, `expense_date`
- ✅ `project_id`, `project_name`
- ✅ `contractor_id`, `contractor_name`
- ✅ `receipt_url`, `notes`

**פעולה נדרשת**: בדיקת קיום כל השדות.

---

### Proposal (הצעת מחיר)
השוואה לסכימה (שורות 1380-1520):

#### שדות רבים שצריך לוודא:
- ✅ `title`, `proposal_number`
- ✅ `project_id`, `project_name`, `client_id`, `client_name`, `client_email`
- ✅ `type` (enum), `status` (enum), `template_id`
- ✅ `scope_of_work`, `items` (array)
- ✅ חישובים: `subtotal`, `discount_percent`, `discount_amount`, `vat_percent`, `vat_amount`, `total_amount`
- ✅ תשלום: `payment_terms`, `payment_schedule` (array)
- ✅ תוקף: `validity_days`, `valid_until`
- ✅ `terms_and_conditions`, `notes`
- ✅ `ai_generated`, `signature_id`
- ✅ תאריכים: `approved_date`, `sent_date`
- ✅ `pdf_url`

**פעולה נדרשת**: בדיקת קיום כל השדות.

---

### CalendarEvent (אירוע ביומן)
השוואה לסכימה (שורות 1521-1606):

#### שדות שצריך לוודא:
- ✅ `title`, `description`, `event_type` (enum)
- ✅ תאריכים: `start_date`, `end_date`, `all_day`
- ✅ `location`, `attendees` (array)
- ✅ `project_id`, `task_id`
- ✅ תזכורת: `reminder`, `reminder_minutes`
- ✅ `color`, `status` (enum), `completed`
- ✅ `google_calendar_id`

**פעולה נדרשת**: בדיקת קיום כל השדות.

---

### TimeEntry (דיווח שעות)
השוואה לסכימה (שורות 1607-1706):

#### שדות שצריך לוודא:
- ✅ `project_id`, `project_name`
- ✅ `user_id`, `user_name`, `user_email`
- ✅ `task_id`, `task_name`
- ✅ `stage` (enum - שלבי הפרויקט)
- ✅ `date`, `start_time`, `end_time`, `duration_minutes`
- ✅ `description`, `billable`, `source` (enum)
- ✅ `architect_id`, `architect_email`

**פעולה נדרשת**: בדיקת קיום כל השדות בטבלת time_entries.

---

## סיכום פעולות נדרשות

### 🚨 דחיפות גבוהה - ישויות חסרות לחלוטין:
1. **RecordingFolder** - נדרש! Recording מפנה אליה
2. **DocumentSignature** - נדרש! Proposal מפנה אליה
3. **ShareLink** - פיצ'ר חשוב לשיתוף
4. **ClientAccess** - פיצ'ר חשוב לגישת לקוחות

### ⚠️ חשוב - ישויות ייעודיות:
5. **ContractorDocument** - עבור ניהול קבלנים
6. **ConsultantMessage** - עבור תקשורת עם יועצים
7. **ConsultantDocument** - עבור ניהול מסמכי יועצים
8. **CADFile** - עבור קבצי CAD מיוחדים
9. **ProjectSelection** - עבור מעקב בחירות חומרים

### 💡 נחמד להוסיף - ניתוח ולמידה:
10. **AILearning** - מעקב למידת AI
11. **ProjectAIHistory** - היסטוריית פעולות AI

### ✅ פעולות אימות:
12. **בדיקת שדות** - לכל ישות קיימת, לוודא שכל השדות מהסכימה קיימים בטבלת DB

---

## המלצות

### שלב 1 - תיקון דחוף (ישויות חסרות קריטיות)
יצירת מיגרציה `015_add_critical_missing_entities.sql` עבור:
- RecordingFolder
- DocumentSignature
- ShareLink
- ClientAccess

### שלב 2 - השלמת ישויות ייעודיות
יצירת מיגרציה `016_add_specialized_entities.sql` עבור:
- ContractorDocument
- ConsultantMessage
- ConsultantDocument
- CADFile
- ProjectSelection

### שלב 3 - ישויות AI
יצירת מיגרציה `017_add_ai_tracking_entities.sql` עבור:
- AILearning
- ProjectAIHistory

### שלב 4 - אימות שדות
סקריפט בדיקה שיעבור על כל הטבלאות ויוודא קיום שדות.

---

## הערות נוספות

1. **Multi-tenancy**: רוב הטבלאות צריכות `architect_id` ו-`architect_email` לצורך הפרדת נתונים
2. **RLS Policies**: כל טבלה חדשה צריכה מדיניות RLS מתאימה
3. **Indexes**: שדות שנעשה בהם חיפוש תכוף צריכים אינדקסים
4. **created_by**: שדה שמופיע בהרבה טבלאות - לוודא עקביות
5. **Timestamps**: `created_at`, `updated_at` סטנדרטיים
