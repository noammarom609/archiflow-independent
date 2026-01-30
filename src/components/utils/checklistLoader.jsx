import { archiflow } from '@/api/archiflow';

/**
 * Project Types Configuration
 * Maps project_type enum values to display labels and checklist keys
 * 
 * Categories:
 * - Apartments: דירות (שיפוץ/בנייה חדשה)
 * - Offices: משרדים (שיפוץ/בנייה חדשה)
 * - Private Houses: בתים פרטיים (שיפוץ/בנייה חדשה)
 * - Commercial: מסחרי (מסעדות, חנויות, וכו')
 * - Custom: פרויקט מותאם אישית
 */
export const PROJECT_TYPES = {
  // === דירות ===
  renovation_apartment: {
    key: 'renovation_apartment',
    label: 'תכנון שיפוץ + עיצוב דירה',
    shortLabel: 'שיפוץ דירה',
    icon: 'Home',
    category: 'residential',
    checklistKey: 'first_meeting_checklist_renovation_apartment'
  },
  new_build_apartment: {
    key: 'new_build_apartment',
    label: 'בנייה חדשה + עיצוב דירה',
    shortLabel: 'בנייה דירה',
    icon: 'Building',
    category: 'residential',
    checklistKey: 'first_meeting_checklist_new_build_apartment'
  },
  
  // === בתים פרטיים ===
  renovation_private_house: {
    key: 'renovation_private_house',
    label: 'תכנון שיפוץ + עיצוב בית פרטי',
    shortLabel: 'שיפוץ בית פרטי',
    icon: 'Home',
    category: 'residential',
    checklistKey: 'first_meeting_checklist_renovation_private_house'
  },
  new_build_private_house: {
    key: 'new_build_private_house',
    label: 'בנייה חדשה + עיצוב בית פרטי',
    shortLabel: 'בנייה בית פרטי',
    icon: 'Castle',
    category: 'residential',
    checklistKey: 'first_meeting_checklist_new_build_private_house'
  },
  
  // === וילות ===
  renovation_villa: {
    key: 'renovation_villa',
    label: 'תכנון שיפוץ + עיצוב וילה',
    shortLabel: 'שיפוץ וילה',
    icon: 'Castle',
    category: 'residential',
    checklistKey: 'first_meeting_checklist_renovation_villa'
  },
  new_build_villa: {
    key: 'new_build_villa',
    label: 'בנייה חדשה + עיצוב וילה',
    shortLabel: 'בנייה וילה',
    icon: 'Castle',
    category: 'residential',
    checklistKey: 'first_meeting_checklist_new_build_villa'
  },
  
  // === משרדים ===
  renovation_office: {
    key: 'renovation_office',
    label: 'תכנון שיפוץ + עיצוב משרד',
    shortLabel: 'שיפוץ משרד',
    icon: 'Briefcase',
    category: 'commercial',
    checklistKey: 'first_meeting_checklist_renovation_office'
  },
  new_build_office: {
    key: 'new_build_office',
    label: 'בנייה חדשה + עיצוב משרד',
    shortLabel: 'בנייה משרד',
    icon: 'Building2',
    category: 'commercial',
    checklistKey: 'first_meeting_checklist_new_build_office'
  },
  
  // === מסחרי - מסעדות/בתי קפה ===
  renovation_restaurant: {
    key: 'renovation_restaurant',
    label: 'תכנון שיפוץ + עיצוב מסעדה/בית קפה',
    shortLabel: 'שיפוץ מסעדה',
    icon: 'UtensilsCrossed',
    category: 'commercial',
    checklistKey: 'first_meeting_checklist_renovation_restaurant'
  },
  new_build_restaurant: {
    key: 'new_build_restaurant',
    label: 'בנייה חדשה + עיצוב מסעדה/בית קפה',
    shortLabel: 'בנייה מסעדה',
    icon: 'UtensilsCrossed',
    category: 'commercial',
    checklistKey: 'first_meeting_checklist_new_build_restaurant'
  },
  
  // === מסחרי - חנויות/קמעונאות ===
  renovation_retail: {
    key: 'renovation_retail',
    label: 'תכנון שיפוץ + עיצוב חנות/קמעונאות',
    shortLabel: 'שיפוץ חנות',
    icon: 'Store',
    category: 'commercial',
    checklistKey: 'first_meeting_checklist_renovation_retail'
  },
  new_build_retail: {
    key: 'new_build_retail',
    label: 'בנייה חדשה + עיצוב חנות/קמעונאות',
    shortLabel: 'בנייה חנות',
    icon: 'Store',
    category: 'commercial',
    checklistKey: 'first_meeting_checklist_new_build_retail'
  },
  
  // === פרויקט מותאם אישית (ברירת מחדל) ===
  custom_project: {
    key: 'custom_project',
    label: 'פרויקט מותאם אישית',
    shortLabel: 'פרויקט מותאם',
    icon: 'Sparkles',
    category: 'custom',
    checklistKey: 'first_meeting_checklist_custom',
    isDefault: true
  }
};

/**
 * Project Categories for grouping in UI
 */
export const PROJECT_CATEGORIES = {
  residential: {
    label: 'מגורים',
    icon: 'Home',
    types: ['renovation_apartment', 'new_build_apartment', 'renovation_private_house', 'new_build_private_house', 'renovation_villa', 'new_build_villa']
  },
  commercial: {
    label: 'מסחרי',
    icon: 'Building2',
    types: ['renovation_office', 'new_build_office', 'renovation_restaurant', 'new_build_restaurant', 'renovation_retail', 'new_build_retail']
  },
  custom: {
    label: 'מותאם אישית',
    icon: 'Sparkles',
    types: ['custom_project']
  }
};

// Default fallback checklists
const defaultPhoneCallChecklist = [
  { id: 'intro', item: 'הצגה עצמית והמשרד', checked: false, notes: '' },
  { id: 'project_type', item: 'סוג הפרויקט (שיפוץ/בניה/עיצוב)', checked: false, notes: '' },
  { id: 'location', item: 'מיקום הנכס', checked: false, notes: '' },
  { id: 'size', item: 'גודל הנכס (מ"ר)', checked: false, notes: '' },
  { id: 'budget_range', item: 'טווח תקציבי משוער', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים רצוי', checked: false, notes: '' },
  { id: 'urgency', item: 'דחיפות הפרויקט', checked: false, notes: '' },
  { id: 'decision_makers', item: 'מקבלי ההחלטות', checked: false, notes: '' },
  { id: 'how_found', item: 'איך הגיעו אלינו', checked: false, notes: '' },
  { id: 'main_goals', item: 'מטרות עיקריות', checked: false, notes: '' },
  { id: 'concerns', item: 'חששות או שאלות', checked: false, notes: '' },
  { id: 'next_step', item: 'קביעת פגישה/שלב הבא', checked: false, notes: '' },
];

// Default checklist for generic first meeting (backward compatibility)
const defaultMeetingChecklist = [
  { id: 'budget', item: 'תקציב ומסגרת כספית', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים רצוי', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי מועדף', checked: false, notes: '' },
  { id: 'rooms', item: 'חדרים/אזורים לטיפול', checked: false, notes: '' },
  { id: 'family', item: 'הרכב המשפחה/משתמשים', checked: false, notes: '' },
  { id: 'special_needs', item: 'צרכים מיוחדים (נגישות, חיות מחמד וכו׳)', checked: false, notes: '' },
  { id: 'priorities', item: 'סדרי עדיפויות', checked: false, notes: '' },
  { id: 'references', item: 'רפרנסים והשראות', checked: false, notes: '' },
  { id: 'colors', item: 'צבעים מועדפים/לא רצויים', checked: false, notes: '' },
  { id: 'materials', item: 'חומרים מועדפים', checked: false, notes: '' },
  { id: 'storage', item: 'צרכי אחסון', checked: false, notes: '' },
  { id: 'lighting', item: 'העדפות תאורה', checked: false, notes: '' },
];

// =====================================================
// DEFAULT CHECKLISTS BY PROJECT TYPE
// =====================================================

/**
 * צ'קליסט: תכנון שיפוץ + עיצוב דירה
 * מתמקד במצב קיים, הריסות, שיפוצים, ועיצוב פנים
 */
const defaultRenovationApartmentChecklist = [
  { id: 'current_state', item: 'מצב הנכס הקיים (גיל, מצב תחזוקה)', checked: false, notes: '' },
  { id: 'ownership', item: 'בעלות על הנכס (שכירות/בעלות)', checked: false, notes: '' },
  { id: 'permits', item: 'צורך בהיתרים ואישורים', checked: false, notes: '' },
  { id: 'demolition', item: 'הריסות נדרשות (קירות, ריצוף)', checked: false, notes: '' },
  { id: 'electrical', item: 'שדרוג חשמל ותשתיות', checked: false, notes: '' },
  { id: 'plumbing', item: 'שינויים באינסטלציה', checked: false, notes: '' },
  { id: 'hvac', item: 'מיזוג אוויר וחימום', checked: false, notes: '' },
  { id: 'windows', item: 'החלפת חלונות ודלתות', checked: false, notes: '' },
  { id: 'kitchen', item: 'שיפוץ/עיצוב מטבח', checked: false, notes: '' },
  { id: 'bathrooms', item: 'שיפוץ/עיצוב חדרי רחצה', checked: false, notes: '' },
  { id: 'flooring', item: 'סוג ריצוף מועדף', checked: false, notes: '' },
  { id: 'storage', item: 'פתרונות אחסון', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי מועדף', checked: false, notes: '' },
  { id: 'colors', item: 'פלטת צבעים', checked: false, notes: '' },
  { id: 'furniture', item: 'ריהוט קיים לשמור/להחליף', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב כולל לשיפוץ', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים ומועד כניסה', checked: false, notes: '' },
  { id: 'living_during', item: 'מגורים בזמן השיפוץ', checked: false, notes: '' },
  { id: 'family', item: 'הרכב המשפחה וצרכים', checked: false, notes: '' },
  { id: 'special_needs', item: 'צרכים מיוחדים (נגישות, חיות מחמד)', checked: false, notes: '' },
];

/**
 * צ'קליסט: בנייה חדשה + עיצוב דירה
 * מתמקד בתכנון מאפס, שיתוף עם קבלן, ובחירות מוקדמות
 */
const defaultNewBuildApartmentChecklist = [
  { id: 'plot_status', item: 'סטטוס המגרש/הפרויקט', checked: false, notes: '' },
  { id: 'builder', item: 'קבלן/יזם הבנייה', checked: false, notes: '' },
  { id: 'delivery_date', item: 'מועד מסירה צפוי', checked: false, notes: '' },
  { id: 'changes_allowed', item: 'שינויים מותרים מהקבלן', checked: false, notes: '' },
  { id: 'apartment_plan', item: 'תוכנית הדירה הנוכחית', checked: false, notes: '' },
  { id: 'layout_changes', item: 'שינויי תכנון רצויים', checked: false, notes: '' },
  { id: 'electrical_points', item: 'נקודות חשמל ותקשורת', checked: false, notes: '' },
  { id: 'plumbing_changes', item: 'שינויים באינסטלציה', checked: false, notes: '' },
  { id: 'hvac_planning', item: 'תכנון מיזוג אוויר', checked: false, notes: '' },
  { id: 'flooring', item: 'בחירת ריצוף', checked: false, notes: '' },
  { id: 'kitchen_design', item: 'תכנון ועיצוב מטבח', checked: false, notes: '' },
  { id: 'bathrooms_design', item: 'תכנון ועיצוב חדרי רחצה', checked: false, notes: '' },
  { id: 'doors_windows', item: 'דלתות וחלונות (שדרוגים)', checked: false, notes: '' },
  { id: 'storage', item: 'פתרונות אחסון מובנים', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי כללי', checked: false, notes: '' },
  { id: 'colors', item: 'פלטת צבעים', checked: false, notes: '' },
  { id: 'lighting', item: 'תכנון תאורה', checked: false, notes: '' },
  { id: 'smart_home', item: 'בית חכם ואוטומציה', checked: false, notes: '' },
  { id: 'outdoor', item: 'מרפסות וחללים חיצוניים', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב לשינויים ועיצוב', checked: false, notes: '' },
  { id: 'family', item: 'הרכב המשפחה וצרכים', checked: false, notes: '' },
  { id: 'special_needs', item: 'צרכים מיוחדים', checked: false, notes: '' },
];

/**
 * צ'קליסט: תכנון שיפוץ + עיצוב משרד
 * מתמקד בצרכים עסקיים, פונקציונליות, ומיתוג
 */
const defaultRenovationOfficeChecklist = [
  { id: 'business_type', item: 'סוג העסק ותחום פעילות', checked: false, notes: '' },
  { id: 'employees', item: 'מספר עובדים (נוכחי/צפוי)', checked: false, notes: '' },
  { id: 'current_state', item: 'מצב המשרד הקיים', checked: false, notes: '' },
  { id: 'lease_status', item: 'סטטוס השכירות/בעלות', checked: false, notes: '' },
  { id: 'landlord_approval', item: 'אישורים נדרשים מבעל הנכס', checked: false, notes: '' },
  { id: 'workstations', item: 'תחנות עבודה וסידור', checked: false, notes: '' },
  { id: 'meeting_rooms', item: 'חדרי ישיבות (כמות וגודל)', checked: false, notes: '' },
  { id: 'reception', item: 'אזור קבלה/המתנה', checked: false, notes: '' },
  { id: 'kitchen_break', item: 'מטבחון ואזור מנוחה', checked: false, notes: '' },
  { id: 'storage_archive', item: 'אחסון וארכיב', checked: false, notes: '' },
  { id: 'server_room', item: 'חדר שרתים/תקשורת', checked: false, notes: '' },
  { id: 'electrical', item: 'תשתיות חשמל ורשת', checked: false, notes: '' },
  { id: 'hvac', item: 'מיזוג ואוורור', checked: false, notes: '' },
  { id: 'acoustics', item: 'אקוסטיקה ופרטיות', checked: false, notes: '' },
  { id: 'lighting', item: 'תאורה (טבעית/מלאכותית)', checked: false, notes: '' },
  { id: 'branding', item: 'מיתוג ושילוט', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי (פורמלי/קז׳ואל)', checked: false, notes: '' },
  { id: 'colors', item: 'צבעי מותג', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב לשיפוץ', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים והפרעה לעבודה', checked: false, notes: '' },
  { id: 'accessibility', item: 'נגישות לבעלי מוגבלויות', checked: false, notes: '' },
];

/**
 * צ'קליסט: בנייה חדשה + עיצוב משרד
 * מתמקד בתכנון מאפס לחלל עסקי
 */
const defaultNewBuildOfficeChecklist = [
  { id: 'business_type', item: 'סוג העסק ותחום פעילות', checked: false, notes: '' },
  { id: 'employees', item: 'מספר עובדים (נוכחי/צפוי)', checked: false, notes: '' },
  { id: 'growth_plan', item: 'תוכניות צמיחה', checked: false, notes: '' },
  { id: 'building_status', item: 'סטטוס הבניין/הפרויקט', checked: false, notes: '' },
  { id: 'delivery_date', item: 'מועד מסירה צפוי', checked: false, notes: '' },
  { id: 'shell_core', item: 'מצב המסירה (שלד/גמר)', checked: false, notes: '' },
  { id: 'floor_plan', item: 'תוכנית הקומה', checked: false, notes: '' },
  { id: 'layout_planning', item: 'תכנון חלוקה פנימית', checked: false, notes: '' },
  { id: 'open_vs_closed', item: 'חלל פתוח מול משרדים סגורים', checked: false, notes: '' },
  { id: 'workstations', item: 'תחנות עבודה וריהוט', checked: false, notes: '' },
  { id: 'meeting_rooms', item: 'חדרי ישיבות', checked: false, notes: '' },
  { id: 'executive_offices', item: 'משרדי הנהלה', checked: false, notes: '' },
  { id: 'reception', item: 'אזור קבלה/לובי', checked: false, notes: '' },
  { id: 'kitchen_break', item: 'מטבח ואזור רווחה', checked: false, notes: '' },
  { id: 'infrastructure', item: 'תשתיות (חשמל, רשת, מיזוג)', checked: false, notes: '' },
  { id: 'lighting', item: 'תכנון תאורה', checked: false, notes: '' },
  { id: 'acoustics', item: 'פתרונות אקוסטיים', checked: false, notes: '' },
  { id: 'branding', item: 'מיתוג וזהות חזותית', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי', checked: false, notes: '' },
  { id: 'sustainability', item: 'קיימות ובנייה ירוקה', checked: false, notes: '' },
  { id: 'smart_office', item: 'משרד חכם ואוטומציה', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב כולל', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים', checked: false, notes: '' },
  { id: 'accessibility', item: 'נגישות', checked: false, notes: '' },
];

// =====================================================
// NEW PROJECT TYPE CHECKLISTS
// =====================================================

/**
 * צ'קליסט: תכנון שיפוץ + עיצוב בית פרטי
 * מתמקד במבנים צמודי קרקע עם חצר וחללים חיצוניים
 */
const defaultRenovationPrivateHouseChecklist = [
  { id: 'current_state', item: 'מצב הבית הקיים (גיל, מצב תחזוקה)', checked: false, notes: '' },
  { id: 'ownership', item: 'בעלות על הנכס', checked: false, notes: '' },
  { id: 'plot_size', item: 'גודל המגרש ושטח בנוי', checked: false, notes: '' },
  { id: 'floors', item: 'מספר קומות', checked: false, notes: '' },
  { id: 'permits', item: 'צורך בהיתרים (תוספת בנייה, שינויים)', checked: false, notes: '' },
  { id: 'structural', item: 'שינויים קונסטרוקטיביים', checked: false, notes: '' },
  { id: 'demolition', item: 'הריסות נדרשות', checked: false, notes: '' },
  { id: 'additions', item: 'תוספות בנייה מתוכננות', checked: false, notes: '' },
  { id: 'electrical', item: 'שדרוג חשמל ותשתיות', checked: false, notes: '' },
  { id: 'plumbing', item: 'שינויים באינסטלציה', checked: false, notes: '' },
  { id: 'hvac', item: 'מיזוג אוויר וחימום', checked: false, notes: '' },
  { id: 'insulation', item: 'בידוד תרמי ואקוסטי', checked: false, notes: '' },
  { id: 'kitchen', item: 'שיפוץ/עיצוב מטבח', checked: false, notes: '' },
  { id: 'bathrooms', item: 'שיפוץ/עיצוב חדרי רחצה', checked: false, notes: '' },
  { id: 'outdoor', item: 'חצר ופיתוח חוץ', checked: false, notes: '' },
  { id: 'pool', item: 'בריכה/ג\'קוזי', checked: false, notes: '' },
  { id: 'parking', item: 'חניה וגישה לרכב', checked: false, notes: '' },
  { id: 'security', item: 'מערכות אבטחה', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי מועדף', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב כולל לשיפוץ', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים ומועד כניסה', checked: false, notes: '' },
  { id: 'living_during', item: 'מגורים בזמן השיפוץ', checked: false, notes: '' },
  { id: 'family', item: 'הרכב המשפחה וצרכים', checked: false, notes: '' },
  { id: 'special_needs', item: 'צרכים מיוחדים (נגישות, חיות מחמד)', checked: false, notes: '' },
];

/**
 * צ'קליסט: בנייה חדשה + עיצוב בית פרטי
 */
const defaultNewBuildPrivateHouseChecklist = [
  { id: 'plot_status', item: 'סטטוס המגרש (בבעלות/רכישה)', checked: false, notes: '' },
  { id: 'plot_size', item: 'גודל המגרש', checked: false, notes: '' },
  { id: 'building_rights', item: 'זכויות בנייה ותב"ע', checked: false, notes: '' },
  { id: 'floors_plan', item: 'מספר קומות מתוכנן', checked: false, notes: '' },
  { id: 'total_area', item: 'שטח בנייה מבוקש', checked: false, notes: '' },
  { id: 'architect', item: 'אדריכל מתכנן (יש/צריך)', checked: false, notes: '' },
  { id: 'structural', item: 'קונסטרוקטור', checked: false, notes: '' },
  { id: 'rooms_program', item: 'תוכנית חדרים (מספר חדרים, שימושים)', checked: false, notes: '' },
  { id: 'master_suite', item: 'סוויטת הורים', checked: false, notes: '' },
  { id: 'kids_rooms', item: 'חדרי ילדים', checked: false, notes: '' },
  { id: 'guest_unit', item: 'יחידת אירוח/הורים', checked: false, notes: '' },
  { id: 'kitchen', item: 'תכנון ועיצוב מטבח', checked: false, notes: '' },
  { id: 'living_areas', item: 'אזורי מגורים (סלון, פינת אוכל)', checked: false, notes: '' },
  { id: 'outdoor', item: 'חצר ופיתוח חוץ', checked: false, notes: '' },
  { id: 'pool', item: 'בריכה/ג\'קוזי', checked: false, notes: '' },
  { id: 'parking', item: 'חניה (מקורה/לא)', checked: false, notes: '' },
  { id: 'smart_home', item: 'בית חכם ואוטומציה', checked: false, notes: '' },
  { id: 'sustainability', item: 'בנייה ירוקה וחסכון אנרגיה', checked: false, notes: '' },
  { id: 'security', item: 'ממ"ד ומערכות אבטחה', checked: false, notes: '' },
  { id: 'style', item: 'סגנון אדריכלי ועיצובי', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב כולל', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים', checked: false, notes: '' },
  { id: 'family', item: 'הרכב המשפחה וצרכים', checked: false, notes: '' },
];

/**
 * צ'קליסט: וילה (שיפוץ) - בתים גדולים ויוקרתיים
 */
const defaultRenovationVillaChecklist = [
  { id: 'current_state', item: 'מצב הוילה הקיים', checked: false, notes: '' },
  { id: 'total_area', item: 'שטח הוילה (מ"ר)', checked: false, notes: '' },
  { id: 'plot_size', item: 'גודל המגרש', checked: false, notes: '' },
  { id: 'floors', item: 'מספר קומות', checked: false, notes: '' },
  { id: 'structural', item: 'שינויים קונסטרוקטיביים', checked: false, notes: '' },
  { id: 'additions', item: 'תוספות בנייה', checked: false, notes: '' },
  { id: 'master_suite', item: 'סוויטת מאסטר', checked: false, notes: '' },
  { id: 'guest_rooms', item: 'חדרי אורחים/סוויטות', checked: false, notes: '' },
  { id: 'entertainment', item: 'אזורי בילוי (קולנוע ביתי, חדר משחקים)', checked: false, notes: '' },
  { id: 'wine_cellar', item: 'מרתף יין', checked: false, notes: '' },
  { id: 'gym', item: 'חדר כושר/ספא', checked: false, notes: '' },
  { id: 'pool', item: 'בריכה ואזור רחצה', checked: false, notes: '' },
  { id: 'outdoor_kitchen', item: 'מטבח חוץ/אזור ברביקיו', checked: false, notes: '' },
  { id: 'landscaping', item: 'גינון ופיתוח נוף', checked: false, notes: '' },
  { id: 'smart_home', item: 'בית חכם ואוטומציה מתקדמת', checked: false, notes: '' },
  { id: 'security', item: 'מערכות אבטחה מתקדמות', checked: false, notes: '' },
  { id: 'staff_quarters', item: 'חדר עוזרת/מטפלת', checked: false, notes: '' },
  { id: 'parking', item: 'חניה (מספר מקומות)', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי יוקרתי', checked: false, notes: '' },
  { id: 'materials', item: 'חומרי גמר יוקרתיים', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב כולל', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים', checked: false, notes: '' },
  { id: 'family', item: 'הרכב המשפחה', checked: false, notes: '' },
];

/**
 * צ'קליסט: וילה (בנייה חדשה)
 */
const defaultNewBuildVillaChecklist = [
  { id: 'plot_status', item: 'סטטוס המגרש', checked: false, notes: '' },
  { id: 'plot_size', item: 'גודל המגרש', checked: false, notes: '' },
  { id: 'building_rights', item: 'זכויות בנייה ותב"ע', checked: false, notes: '' },
  { id: 'total_area', item: 'שטח בנייה מתוכנן', checked: false, notes: '' },
  { id: 'floors_plan', item: 'מספר קומות', checked: false, notes: '' },
  { id: 'architectural_style', item: 'סגנון אדריכלי', checked: false, notes: '' },
  { id: 'master_suite', item: 'סוויטת מאסטר יוקרתית', checked: false, notes: '' },
  { id: 'bedrooms', item: 'חדרי שינה נוספים', checked: false, notes: '' },
  { id: 'guest_suite', item: 'סוויטת אורחים', checked: false, notes: '' },
  { id: 'living_spaces', item: 'אזורי מגורים (סלון, פינת משפחה)', checked: false, notes: '' },
  { id: 'kitchen', item: 'מטבח שף', checked: false, notes: '' },
  { id: 'entertainment', item: 'אזורי בילוי (קולנוע, משחקים)', checked: false, notes: '' },
  { id: 'wine_cellar', item: 'מרתף יין', checked: false, notes: '' },
  { id: 'gym_spa', item: 'ספא וחדר כושר', checked: false, notes: '' },
  { id: 'pool', item: 'בריכה (מחוממת, אינסוף)', checked: false, notes: '' },
  { id: 'outdoor', item: 'פיתוח חוץ וגינון', checked: false, notes: '' },
  { id: 'smart_home', item: 'בית חכם מתקדם', checked: false, notes: '' },
  { id: 'sustainability', item: 'בנייה ירוקה ואנרגיה מתחדשת', checked: false, notes: '' },
  { id: 'security', item: 'אבטחה וממ"ד', checked: false, notes: '' },
  { id: 'staff', item: 'חדרי צוות/עוזרת', checked: false, notes: '' },
  { id: 'parking', item: 'חניה ומוסך', checked: false, notes: '' },
  { id: 'materials', item: 'חומרי גמר יוקרתיים', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב כולל', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים', checked: false, notes: '' },
  { id: 'family', item: 'הרכב המשפחה וצרכים', checked: false, notes: '' },
];

/**
 * צ'קליסט: מסעדה/בית קפה (שיפוץ)
 */
const defaultRenovationRestaurantChecklist = [
  { id: 'business_concept', item: 'קונספט המסעדה/בית קפה', checked: false, notes: '' },
  { id: 'cuisine_type', item: 'סוג המטבח', checked: false, notes: '' },
  { id: 'seating_capacity', item: 'מספר מקומות ישיבה', checked: false, notes: '' },
  { id: 'current_state', item: 'מצב הנכס הקיים', checked: false, notes: '' },
  { id: 'lease_status', item: 'סטטוס השכירות', checked: false, notes: '' },
  { id: 'kitchen_commercial', item: 'מטבח תעשייתי (ציוד נדרש)', checked: false, notes: '' },
  { id: 'bar', item: 'בר (אלכוהול/קפה)', checked: false, notes: '' },
  { id: 'ventilation', item: 'מערכת אוורור וסינון', checked: false, notes: '' },
  { id: 'electrical', item: 'תשתיות חשמל (מטבח, תאורה)', checked: false, notes: '' },
  { id: 'plumbing', item: 'אינסטלציה (מטבח, שירותים)', checked: false, notes: '' },
  { id: 'toilets', item: 'שירותי לקוחות (נגישות)', checked: false, notes: '' },
  { id: 'storage', item: 'אזורי אחסון וקירור', checked: false, notes: '' },
  { id: 'outdoor_seating', item: 'ישיבה חיצונית', checked: false, notes: '' },
  { id: 'branding', item: 'מיתוג ושילוט', checked: false, notes: '' },
  { id: 'lighting', item: 'תאורה ואווירה', checked: false, notes: '' },
  { id: 'acoustics', item: 'אקוסטיקה', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי', checked: false, notes: '' },
  { id: 'health_regs', item: 'תקנות בריאות ורישוי', checked: false, notes: '' },
  { id: 'fire_safety', item: 'בטיחות אש', checked: false, notes: '' },
  { id: 'accessibility', item: 'נגישות לבעלי מוגבלויות', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים ומועד פתיחה', checked: false, notes: '' },
];

/**
 * צ'קליסט: מסעדה/בית קפה (בנייה חדשה)
 */
const defaultNewBuildRestaurantChecklist = [
  { id: 'business_concept', item: 'קונספט המסעדה/בית קפה', checked: false, notes: '' },
  { id: 'cuisine_type', item: 'סוג המטבח', checked: false, notes: '' },
  { id: 'target_audience', item: 'קהל יעד', checked: false, notes: '' },
  { id: 'location', item: 'מיקום ונגישות', checked: false, notes: '' },
  { id: 'space_size', item: 'גודל השטח', checked: false, notes: '' },
  { id: 'seating_capacity', item: 'מספר מקומות ישיבה', checked: false, notes: '' },
  { id: 'kitchen_design', item: 'תכנון מטבח תעשייתי', checked: false, notes: '' },
  { id: 'bar_design', item: 'תכנון בר', checked: false, notes: '' },
  { id: 'service_flow', item: 'תהליך שירות ותנועה', checked: false, notes: '' },
  { id: 'storage', item: 'אזורי אחסון וקירור', checked: false, notes: '' },
  { id: 'outdoor_seating', item: 'ישיבה חיצונית', checked: false, notes: '' },
  { id: 'infrastructure', item: 'תשתיות (חשמל, מים, גז, אוורור)', checked: false, notes: '' },
  { id: 'toilets', item: 'שירותים (כולל נגישות)', checked: false, notes: '' },
  { id: 'branding', item: 'מיתוג וזהות חזותית', checked: false, notes: '' },
  { id: 'lighting', item: 'תכנון תאורה', checked: false, notes: '' },
  { id: 'acoustics', item: 'אקוסטיקה', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי', checked: false, notes: '' },
  { id: 'furniture', item: 'ריהוט וכלים', checked: false, notes: '' },
  { id: 'health_regs', item: 'רישוי ותקנות בריאות', checked: false, notes: '' },
  { id: 'fire_safety', item: 'בטיחות אש', checked: false, notes: '' },
  { id: 'accessibility', item: 'נגישות', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב כולל', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים', checked: false, notes: '' },
];

/**
 * צ'קליסט: חנות/קמעונאות (שיפוץ)
 */
const defaultRenovationRetailChecklist = [
  { id: 'business_type', item: 'סוג העסק/מוצרים', checked: false, notes: '' },
  { id: 'brand', item: 'מותג וזהות', checked: false, notes: '' },
  { id: 'current_state', item: 'מצב החנות הקיים', checked: false, notes: '' },
  { id: 'lease_status', item: 'סטטוס השכירות', checked: false, notes: '' },
  { id: 'space_size', item: 'גודל השטח', checked: false, notes: '' },
  { id: 'storefront', item: 'חזית וויטרינה', checked: false, notes: '' },
  { id: 'display', item: 'אזורי תצוגה', checked: false, notes: '' },
  { id: 'fitting_rooms', item: 'חדרי מדידה (אם רלוונטי)', checked: false, notes: '' },
  { id: 'checkout', item: 'אזור קופה ותשלום', checked: false, notes: '' },
  { id: 'storage', item: 'אחסון ומחסן', checked: false, notes: '' },
  { id: 'lighting', item: 'תאורה (כללית ותצוגה)', checked: false, notes: '' },
  { id: 'signage', item: 'שילוט פנימי וחיצוני', checked: false, notes: '' },
  { id: 'flooring', item: 'ריצוף', checked: false, notes: '' },
  { id: 'fixtures', item: 'מתקני תצוגה וריהוט', checked: false, notes: '' },
  { id: 'security', item: 'מערכות אבטחה', checked: false, notes: '' },
  { id: 'pos_system', item: 'מערכת קופה ותוכנה', checked: false, notes: '' },
  { id: 'accessibility', item: 'נגישות', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים', checked: false, notes: '' },
];

/**
 * צ'קליסט: חנות/קמעונאות (בנייה חדשה)
 */
const defaultNewBuildRetailChecklist = [
  { id: 'business_type', item: 'סוג העסק/מוצרים', checked: false, notes: '' },
  { id: 'brand', item: 'מותג וזהות', checked: false, notes: '' },
  { id: 'target_audience', item: 'קהל יעד', checked: false, notes: '' },
  { id: 'location', item: 'מיקום (קניון/רחוב)', checked: false, notes: '' },
  { id: 'space_size', item: 'גודל השטח', checked: false, notes: '' },
  { id: 'storefront', item: 'תכנון חזית וכניסה', checked: false, notes: '' },
  { id: 'layout', item: 'תכנון זרימת לקוחות', checked: false, notes: '' },
  { id: 'display_zones', item: 'אזורי תצוגה', checked: false, notes: '' },
  { id: 'fitting_rooms', item: 'חדרי מדידה', checked: false, notes: '' },
  { id: 'checkout', item: 'אזור קופות', checked: false, notes: '' },
  { id: 'storage', item: 'אחסון ומחסן', checked: false, notes: '' },
  { id: 'lighting', item: 'תכנון תאורה', checked: false, notes: '' },
  { id: 'signage', item: 'שילוט', checked: false, notes: '' },
  { id: 'fixtures', item: 'מתקני תצוגה', checked: false, notes: '' },
  { id: 'infrastructure', item: 'תשתיות (חשמל, מיזוג)', checked: false, notes: '' },
  { id: 'security', item: 'אבטחה ומצלמות', checked: false, notes: '' },
  { id: 'pos_system', item: 'מערכות טכנולוגיות', checked: false, notes: '' },
  { id: 'accessibility', item: 'נגישות', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים', checked: false, notes: '' },
];

/**
 * צ'קליסט: פרויקט מותאם אישית (ברירת מחדל גנרית)
 */
const defaultCustomProjectChecklist = [
  { id: 'project_description', item: 'תיאור הפרויקט', checked: false, notes: '' },
  { id: 'project_goals', item: 'מטרות עיקריות', checked: false, notes: '' },
  { id: 'space_type', item: 'סוג החלל', checked: false, notes: '' },
  { id: 'space_size', item: 'גודל השטח (מ"ר)', checked: false, notes: '' },
  { id: 'current_state', item: 'מצב נוכחי', checked: false, notes: '' },
  { id: 'ownership', item: 'בעלות/שכירות', checked: false, notes: '' },
  { id: 'permits', item: 'צורך בהיתרים', checked: false, notes: '' },
  { id: 'structural', item: 'שינויים מבניים', checked: false, notes: '' },
  { id: 'electrical', item: 'תשתיות חשמל', checked: false, notes: '' },
  { id: 'plumbing', item: 'אינסטלציה', checked: false, notes: '' },
  { id: 'hvac', item: 'מיזוג ואוורור', checked: false, notes: '' },
  { id: 'style', item: 'סגנון עיצובי מועדף', checked: false, notes: '' },
  { id: 'colors', item: 'צבעים מועדפים', checked: false, notes: '' },
  { id: 'materials', item: 'חומרים מועדפים', checked: false, notes: '' },
  { id: 'special_requirements', item: 'דרישות מיוחדות', checked: false, notes: '' },
  { id: 'accessibility', item: 'נגישות', checked: false, notes: '' },
  { id: 'budget', item: 'תקציב כולל', checked: false, notes: '' },
  { id: 'timeline', item: 'לוח זמנים', checked: false, notes: '' },
  { id: 'stakeholders', item: 'בעלי עניין ומקבלי החלטות', checked: false, notes: '' },
  { id: 'references', item: 'רפרנסים והשראות', checked: false, notes: '' },
];

/**
 * Get default checklist by project type
 * @param {string} projectType - one of PROJECT_TYPES keys
 * @returns {Array} default checklist items
 */
export function getDefaultChecklistByType(projectType) {
  switch (projectType) {
    // דירות
    case 'renovation_apartment':
      return defaultRenovationApartmentChecklist;
    case 'new_build_apartment':
      return defaultNewBuildApartmentChecklist;
    
    // בתים פרטיים
    case 'renovation_private_house':
      return defaultRenovationPrivateHouseChecklist;
    case 'new_build_private_house':
      return defaultNewBuildPrivateHouseChecklist;
    
    // וילות
    case 'renovation_villa':
      return defaultRenovationVillaChecklist;
    case 'new_build_villa':
      return defaultNewBuildVillaChecklist;
    
    // משרדים
    case 'renovation_office':
      return defaultRenovationOfficeChecklist;
    case 'new_build_office':
      return defaultNewBuildOfficeChecklist;
    
    // מסעדות/בתי קפה
    case 'renovation_restaurant':
      return defaultRenovationRestaurantChecklist;
    case 'new_build_restaurant':
      return defaultNewBuildRestaurantChecklist;
    
    // חנויות/קמעונאות
    case 'renovation_retail':
      return defaultRenovationRetailChecklist;
    case 'new_build_retail':
      return defaultNewBuildRetailChecklist;
    
    // פרויקט מותאם אישית
    case 'custom_project':
      return defaultCustomProjectChecklist;
    
    default:
      return defaultMeetingChecklist;
  }
}

/**
 * Load checklist from SystemSettings or return default
 * @param {string} settingKey - checklist setting key
 * @returns {Promise<Array>} checklist items with checked/notes fields
 */
export async function loadChecklist(settingKey) {
  // ✅ CRITICAL: Validate settingKey before any operations
  if (!settingKey || typeof settingKey !== 'string') {
    console.warn('Invalid settingKey provided to loadChecklist:', settingKey);
    return defaultMeetingChecklist;
  }
  
  try {
    const settings = await archiflow.entities.SystemSettings.filter({ setting_key: settingKey });
    
    if (settings && settings.length > 0 && settings[0].setting_value) {
      // Convert from DB format (no checked/notes) to UI format
      const settingValue = settings[0].setting_value;
      
      // ✅ Safety check: ensure setting_value is an array
      if (!Array.isArray(settingValue)) {
        console.warn('Invalid setting_value format:', settingValue);
        throw new Error('Invalid checklist format');
      }
      
      return settingValue
        .filter(item => item && typeof item === 'object') // Filter out invalid items
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(item => ({
          id: item.id || '',
          item: item.item || '',
          order: item.order || 0,
          checked: false,
          notes: ''
        }));
    }
  } catch (error) {
    console.warn(`Failed to load ${settingKey}, using defaults:`, error);
  }
  
  // Return defaults if DB query failed or no settings found
  if (settingKey === 'phone_call_checklist') {
    return defaultPhoneCallChecklist;
  }
  
  // Check if it's a project-type specific checklist
  // ✅ Safety check: ensure settingKey is a string before calling .replace()
  if (settingKey && typeof settingKey === 'string') {
    const projectType = settingKey.replace('first_meeting_checklist_', '');
    if (PROJECT_TYPES[projectType]) {
      return getDefaultChecklistByType(projectType);
    }
  }
  
  // Fallback to generic meeting checklist
  return defaultMeetingChecklist;
}

/**
 * Load checklist by project type
 * First tries to load from SystemSettings, then falls back to defaults
 * @param {string} projectType - one of PROJECT_TYPES keys
 * @returns {Promise<Array>} checklist items
 */
export async function loadChecklistByProjectType(projectType) {
  // ✅ Safety check: validate projectType
  if (!projectType || typeof projectType !== 'string') {
    console.warn(`Invalid project type: ${projectType}, using default`);
    return defaultMeetingChecklist;
  }
  
  const typeConfig = PROJECT_TYPES[projectType];
  if (!typeConfig) {
    console.warn(`Unknown project type: ${projectType}, using default`);
    return defaultMeetingChecklist;
  }
  
  return loadChecklist(typeConfig.checklistKey);
}

/**
 * Save checklist to SystemSettings
 * @param {string} settingKey - checklist setting key
 * @param {Array} items - checklist items
 * @param {string} description - optional description
 */
export async function saveChecklist(settingKey, items, description = '') {
  try {
    // Convert to DB format (with order, without checked/notes)
    const dbItems = items.map((item, index) => ({
      id: item.id,
      item: item.item,
      order: index
    }));
    
    // Check if setting already exists
    const existing = await archiflow.entities.SystemSettings.filter({ setting_key: settingKey });
    
    if (existing && existing.length > 0) {
      await archiflow.entities.SystemSettings.update(existing[0].id, {
        setting_value: dbItems,
        description: description || existing[0].description
      });
    } else {
      await archiflow.entities.SystemSettings.create({
        setting_key: settingKey,
        setting_value: dbItems,
        description
      });
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to save checklist ${settingKey}:`, error);
    throw error;
  }
}

// Export defaults for use in settings
export {
  defaultPhoneCallChecklist,
  defaultMeetingChecklist,
  // דירות
  defaultRenovationApartmentChecklist,
  defaultNewBuildApartmentChecklist,
  // בתים פרטיים
  defaultRenovationPrivateHouseChecklist,
  defaultNewBuildPrivateHouseChecklist,
  // וילות
  defaultRenovationVillaChecklist,
  defaultNewBuildVillaChecklist,
  // משרדים
  defaultRenovationOfficeChecklist,
  defaultNewBuildOfficeChecklist,
  // מסעדות
  defaultRenovationRestaurantChecklist,
  defaultNewBuildRestaurantChecklist,
  // קמעונאות
  defaultRenovationRetailChecklist,
  defaultNewBuildRetailChecklist,
  // מותאם אישית
  defaultCustomProjectChecklist
};