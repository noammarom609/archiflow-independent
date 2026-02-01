/**
 * Seed 13 Proposal Templates - One for each project type
 * This creates baseline templates for all project types in the system
 */

import { archiflow } from '@/api/archiflow';
import { getCurrentUser } from '@/utils/authHelpers';

// Project type mapping with Hebrew labels
const PROJECT_TYPES_INFO = {
  renovation_apartment: { label: 'שיפוץ - דירה', category: 'residential' },
  new_build_apartment: { label: 'בנייה חדשה - דירה', category: 'residential' },
  renovation_private_house: { label: 'שיפוץ - בית פרטי', category: 'residential' },
  new_build_private_house: { label: 'בנייה חדשה - בית פרטי', category: 'residential' },
  renovation_villa: { label: 'שיפוץ - וילה', category: 'residential' },
  new_build_villa: { label: 'בנייה חדשה - וילה', category: 'residential' },
  renovation_office: { label: 'שיפוץ - משרד/מסחרי', category: 'commercial' },
  new_build_office: { label: 'בנייה חדשה - משרד/מסחרי', category: 'commercial' },
  renovation_restaurant: { label: 'שיפוץ - מסעדה/בית קפה', category: 'commercial' },
  new_build_restaurant: { label: 'בנייה חדשה - מסעדה/בית קפה', category: 'commercial' },
  renovation_retail: { label: 'שיפוץ - חנות/קמעונאות', category: 'commercial' },
  new_build_retail: { label: 'בנייה חדשה - חנות/קמעונאות', category: 'commercial' },
  custom_project: { label: 'פרויקט מותאם אישית', category: 'custom' },
};

// Base items for residential renovation
const residentialRenovationItems = [
  { description: 'פגישת היכרות פרויקט', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת תכנית צרכים (מודבורד)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת לוח השראה (MoodBoard)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת סקיצות קונספט', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'אישור כיוון תכנוני', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת תוכנית חלל-תפר (3-5 חלופות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'אישור תוכניות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות אפיון כלליות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות אדריכליות מפורטות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות פרישה ראשוניות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות פרישה סופיות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות חשמל', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות תקשורת ומולטימדיה', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכנית אינסטלציה', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות מיזוג אוויר', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירות ריצוף וכלים סניטריים (עד 3 פגישות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לספק גופות ותאורה (עד 2 פגישות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירות מטבח וארונות (עד 2 פגישות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירות ריהוט (עד 2 פגישות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירת דלתות (עד 2 פגישות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'פיקוח עליון (6 ביקורים)', quantity: 6, unit: 'ביקורים', unit_price: 0, total: 0 },
];

// Base items for new construction residential
const residentialNewBuildItems = [
  { description: 'פגישת היכרות פרויקט', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת תכנית צרכים (מודבורד)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת לוח השראה (MoodBoard)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת סקיצות קונספט (2-3 חלופות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'אישור כיוון תכנוני', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת תוכנית חלל-תפר (3-5 חלופות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'אישור תוכניות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות אפיון כלליות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות אדריכליות מפורטות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות פרישה ראשוניות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות פרישה סופיות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות חשמל', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות תקשורת ומולטימדיה', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכנית אינסטלציה', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות מיזוג אוויר', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירות ריצוף וכלים סניטריים (עד 6 שעות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לספק תאורות ואביזרים (עד 9 שעות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירות ממקור העשייה למטבח', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירות ריהוט (עד 6 שעות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירת ארונות (עד 4 שעות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירת דלתות (עד 2 שעות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירות הלבשת הבית (עד 6 שעות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'פיקוח עליון (6 שלבים)', quantity: 6, unit: 'ביקורים', unit_price: 0, total: 0 },
];

// Base items for commercial renovation
const commercialRenovationItems = [
  { description: 'פגישת היכרות פרויקט', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת תכנית צרכים (מודבורד)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת לוח השראה (MoodBoard)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת סקיצות קונספט', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'אישור כיוון תכנוני', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת תוכנית חלל-תפר', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'אישור תוכניות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות אפיון כלליות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות אדריכליות מפורטות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות פרישה ראשוניות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות פרישה סופיות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות חשמל', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכנית אינסטלציה', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות מיזוג אוויר', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירות חומרי גמר', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לספקי ריהוט', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'פיקוח עליון (6 ביקורים)', quantity: 6, unit: 'ביקורים', unit_price: 0, total: 0 },
];

// Base items for commercial new build
const commercialNewBuildItems = [
  { description: 'פגישת היכרות פרויקט', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת תכנית צרכים (מודבורד)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת לוח השראה (MoodBoard)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת סקיצות קונספט (2-3 חלופות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'אישור כיוון תכנוני', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'הכנת תוכנית חלל-תפר (3-5 חלופות)', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'אישור תוכניות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות אפיון כלליות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות אדריכליות מפורטות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות פרישה ראשוניות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות פרישה סופיות', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות חשמל', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות תקשורת ומולטימדיה', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכנית אינסטלציה', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'תוכניות מיזוג אוויר', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירות חומרי גמר', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לספקי ריהוט וציוד', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'ליווי לבחירות תאורה מסחרית', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
  { description: 'פיקוח עליון (8 ביקורים)', quantity: 8, unit: 'ביקורים', unit_price: 0, total: 0 },
];

// Get items based on project type
function getItemsForProjectType(projectType) {
  if (projectType.startsWith('renovation_')) {
    if (PROJECT_TYPES_INFO[projectType]?.category === 'commercial') {
      return commercialRenovationItems;
    }
    return residentialRenovationItems;
  }
  if (projectType.startsWith('new_build_')) {
    if (PROJECT_TYPES_INFO[projectType]?.category === 'commercial') {
      return commercialNewBuildItems;
    }
    return residentialNewBuildItems;
  }
  return residentialRenovationItems; // Default for custom
}

// Get description based on project type
function getDescriptionForProjectType(projectType) {
  const info = PROJECT_TYPES_INFO[projectType];
  if (!info) return 'תבנית הצעת מחיר כללית';
  
  if (projectType.startsWith('renovation_')) {
    if (info.category === 'residential') {
      return `שיפוץ מלא של ${info.label.replace('שיפוץ - ', '')} קיים/ת מקונספט ועד מסירה`;
    }
    return `תכנון ועיצוב מחדש למשרד או מסחרי. בתפורט כולל הרייסטות מלא לצרכי האדריכל. תכלילת עבודה מסירותו ופיקוח עליון.`;
  }
  
  if (projectType.startsWith('new_build_')) {
    if (info.category === 'residential') {
      return `התכנון כולל הרייסטות מלאה לצרכי האדריכל. פרוהנגע פעים מחליפה, תכינתיות, תכניות לביצוע וליווי צמוד בבחירות חומרים`;
    }
    return `התכנון כולל רייסוט נבייה מחדש. החלשת השילות, עיצוב פנים מלא וליווי צמוד בבישיות.`;
  }
  
  return 'תבנית הצעת מחיר מותאמת לפרויקט';
}

// Create sections for a template
function createSectionsForProjectType(projectType) {
  const info = PROJECT_TYPES_INFO[projectType];
  const items = getItemsForProjectType(projectType);
  
  return [
    {
      id: 'header',
      type: 'header',
      title: 'כותרת',
      visible: true,
      order: 0,
      content: {
        logo_url: '',
        company_name: 'ArchiFlow',
        tagline: 'Architecture OS',
        contact_info: 'info@archiflow.com | 050-1234567'
      }
    },
    {
      id: 'intro',
      type: 'intro',
      title: 'פתיח',
      visible: true,
      order: 1,
      content: {
        greeting: 'לכבוד {{ClientName}} היקר/ה,',
        text: getIntroTextForProjectType(projectType)
      }
    },
    {
      id: 'services',
      type: 'services',
      title: 'פירוט השירותים',
      visible: true,
      order: 2,
      content: {
        description: getServicesDescriptionForProjectType(projectType),
        items: []
      }
    },
    {
      id: 'pricing',
      type: 'pricing',
      title: 'הצעת מחיר',
      visible: true,
      order: 3,
      content: {
        items: items,
        show_subtotal: true,
        show_vat: true,
        vat_percent: 17
      }
    },
    {
      id: 'terms',
      type: 'terms',
      title: 'תנאים והערות',
      visible: true,
      order: 4,
      content: {
        payment_terms: getPaymentTermsForProjectType(projectType),
        validity: 'הצעה תקפה ל-14 יום',
        notes: getNotesForProjectType(projectType)
      }
    },
    {
      id: 'signature',
      type: 'signature',
      title: 'חתימה',
      visible: true,
      order: 5,
      content: {
        show_date: true,
        show_signature_line: true
      }
    }
  ];
}

function getIntroTextForProjectType(projectType) {
  const info = PROJECT_TYPES_INFO[projectType];
  if (!info) return 'הצעה זו מפרטת את מכלול שירותי התכנון והעיצוב עבורכם.';
  
  if (projectType.startsWith('renovation_')) {
    if (info.category === 'residential') {
      return `הצעה זו מפרטת את מכלול שירותי התכנון והעיצוב לשיפוץ ביתכם. בתפורט את הבית לחדש ומותאם בדיוק לצרכים שלכם.`;
    }
    return `שמחנו להכיר לכם את הצעת המחיר לתכנון ועיצוב ביתכם בהתלהמות שלכם. הצעה זו מפרטת את מכלול שירותי התכנון והעיצוב הנלווים לשיפוץ המשרדים שלכם. אנפרסף את הבית לחדש ומותאם בדיוק לצרכים שלכם הראוכניים שלי הארבע.`;
  }
  
  if (projectType.startsWith('new_build_')) {
    if (info.category === 'residential') {
      return `שמחנו להגיש לכם את הצעת המחיר לתכנון ועיצוב דירה בהתלהמות שלכם. הצעה זו מפרטת את מכלול שירותי התכנון האדריכלי, העיצוב והליווי הנדרשים לתכנון מלא של דירה או בית פרטי חדש – מהקונספט ועד מסירה.`;
    }
    return `התכנון כולל רייסוט נבייה מחדש. החלשת השילות, עיצוב פנים מלא וליווי צמוד בבישיות.`;
  }
  
  return 'הצעה זו מפרטת את מכלול שירותי התכנון והעיצוב עבורכם.';
}

function getServicesDescriptionForProjectType(projectType) {
  const info = PROJECT_TYPES_INFO[projectType];
  if (!info) return 'להלן פירוט השירותים הכלולים בהצעה:';
  
  if (projectType.startsWith('renovation_')) {
    if (info.category === 'residential') {
      return `התכנון כולל הרייסטות מלאה לצרכי האדריכל, תכלילת עבודה מפורטות ופיקוח עליון.`;
    }
    return `התכנון כולל הרייסטות מלאה לצרכי האדריכל, עיצוב פנים, תכלילת עבודה מפורטות ופיקוח עליון.`;
  }
  
  if (projectType.startsWith('new_build_')) {
    if (info.category === 'residential') {
      return `התכנון כולל הרייסטות מלאה לארית הבית של השמשפחה, פרוהנגע פעים מחליפה, תכניות לביצוע וליווי צמוד בבחירות חומרים`;
    }
    return `התכנון כולל הרייסטות מלאה לצרכי האדריכל, עיצוב פנים מלא וליווי צמוד בבישיות.`;
  }
  
  return 'להלן פירוט השירותים הכלולים בהצעה:';
}

function getPaymentTermsForProjectType(projectType) {
  const info = PROJECT_TYPES_INFO[projectType];
  if (!info) return 'לפי התקדמות שלבים';
  
  if (projectType.startsWith('renovation_')) {
    return 'לפי התקדמות שלבים: מקדמה, תכנון, התחלת ביצוע, סיום';
  }
  
  if (projectType.startsWith('new_build_')) {
    return '30% במקדמה, 30% בסיום תכנון, 30% בהחלת ביצוע, 10% במסירה';
  }
  
  return 'לפי התקדמות שלבים';
}

function getNotesForProjectType(projectType) {
  const info = PROJECT_TYPES_INFO[projectType];
  if (!info) return 'לא כולל שינויים ותוספות. הצעה אינו כוללת ישעיות ואגרות.';
  
  if (projectType.startsWith('renovation_')) {
    return 'בשיפוץ קליני אינו מחליף סכסכם בנייה. הצעה אינו כוללת ישעיות ואגרות מדיספסה.';
  }
  
  return 'לא כולל שינויים ותוספות. הצעה אינו כוללת ישעיות ואגרות.';
}

/**
 * Seed all 13 proposal templates
 * @returns {Promise<{success: number, failed: number, errors: string[]}>}
 */
export async function seedAllProposalTemplates() {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
    created: []
  };

  // First, check existing templates by name
  const existingTemplates = await archiflow.entities.ProposalTemplate.list();
  const existingNames = new Set(existingTemplates.map(t => t.name));

  for (const [projectType, info] of Object.entries(PROJECT_TYPES_INFO)) {
    // Skip if template with this name already exists
    if (existingNames.has(info.label)) {
      console.log(`Skipping ${info.label} - template already exists`);
      continue;
    }

    try {
      // Get current user email for architect_email field
      const user = await getCurrentUser(archiflow);
      const architectEmail = user?.email || 'system@archiflow.io';
      
      const template = {
        name: info.label,
        description: getDescriptionForProjectType(projectType),
        project_type: projectType,
        status: 'active',
        is_system: true,
        is_default: projectType === 'renovation_apartment',
        architect_email: architectEmail,  // ✅ Required field
        created_by: architectEmail,        // ✅ Required field
        sections: createSectionsForProjectType(projectType),
        variables: {
          ClientName: 'שם הלקוח',
          ProjectName: 'שם הפרויקט',
          Date: 'תאריך',
          TotalPrice: 'סה"כ מחיר'
        },
        styling: {
          primary_color: '#4338ca',
          font_family: 'Heebo',
          logo_url: ''
        },
        usage_count: 0
      };

      const created = await archiflow.entities.ProposalTemplate.create(template);
      results.success++;
      results.created.push({ type: projectType, id: created.id, name: info.label });
      console.log(`✅ Created template: ${info.label}`);
    } catch (error) {
      results.failed++;
      results.errors.push(`${info.label}: ${error.message}`);
      console.error(`❌ Failed to create template ${info.label}:`, error);
    }
  }

  return results;
}

export default seedAllProposalTemplates;
