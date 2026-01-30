/**
 * Auto-tagging utility for documents and recordings
 * Provides consistent, context-aware tagging across the application
 */

/**
 * Generate automatic tags based on context
 * @param {Object} context - The context object
 * @param {string} context.type - Type of content: 'recording', 'document', 'upload'
 * @param {string} context.stage - Project stage: 'first_call', 'proposal', 'sketches', etc.
 * @param {string} context.category - Document category
 * @param {string} context.fileName - Original file name
 * @param {Object} context.project - Project object
 * @param {Array<string>} context.customTags - Additional custom tags
 * @returns {Array<string>} Array of tags
 */
export const generateAutoTags = (context = {}) => {
  const tags = [];
  
  // Stage-based tags
  const stageTags = {
    first_call: ['שלב ראשוני', 'איסוף מידע'],
    proposal: ['הצעת מחיר', 'תמחור'],
    gantt: ['תכנון', 'לוח זמנים'],
    sketches: ['סקיצות', 'קונספט'],
    rendering: ['הדמיות', 'ויזואליזציה'],
    technical: ['תוכניות טכניות', 'ביצוע'],
    execution: ['ביצוע', 'קבלנים'],
    completion: ['סיום פרויקט', 'מסירה'],
  };
  
  if (context.stage && stageTags[context.stage]) {
    tags.push(...stageTags[context.stage]);
  }
  
  // Type-based tags
  if (context.type === 'recording') {
    tags.push('הקלטה');
    
    // Sub-type for recordings
    if (context.subType === 'phone_call') {
      tags.push('שיחת טלפון');
    } else if (context.subType === 'meeting') {
      tags.push('פגישה');
    }
  }
  
  // Category-based tags
  const categoryTags = {
    plan: ['תוכנית', 'שרטוט'],
    contract: ['חוזה', 'משפטי'],
    permit: ['היתר', 'רישוי'],
    invoice: ['חשבונית', 'כספים'],
    report: ['דוח', 'ריכוז'],
    photo: ['תמונה', 'תיעוד'],
    specification: ['מפרט', 'טכני'],
    proposal: ['הצעה', 'תמחור'],
    rendering: ['הדמיה', '3D'],
    other: ['כללי'],
  };
  
  if (context.category && categoryTags[context.category]) {
    tags.push(...categoryTags[context.category]);
  }
  
  // File type tags
  if (context.fileName) {
    const ext = context.fileName.split('.').pop()?.toLowerCase();
    const fileTypeTags = {
      pdf: ['PDF'],
      dwg: ['DWG', 'CAD'],
      jpg: ['תמונה'],
      jpeg: ['תמונה'],
      png: ['תמונה'],
      doc: ['Word'],
      docx: ['Word'],
      xls: ['Excel'],
      xlsx: ['Excel'],
    };
    
    if (ext && fileTypeTags[ext]) {
      tags.push(...fileTypeTags[ext]);
    }
  }
  
  // Project-based tags
  if (context.project) {
    if (context.project.name) {
      tags.push(context.project.name);
    }
    if (context.project.client) {
      tags.push(`לקוח: ${context.project.client}`);
    }
  }
  
  // Custom tags
  if (context.customTags && Array.isArray(context.customTags)) {
    tags.push(...context.customTags);
  }
  
  // Remove duplicates and return
  return [...new Set(tags)].filter(Boolean);
};

/**
 * Get default tags for specific recording types
 */
export const getRecordingTags = (recordingType, project, stage) => {
  return generateAutoTags({
    type: 'recording',
    subType: recordingType,
    stage: stage,
    project: project,
  });
};

/**
 * Get default tags for document uploads
 */
export const getDocumentTags = (category, project, stage, fileName) => {
  return generateAutoTags({
    type: 'document',
    category: category,
    stage: stage,
    project: project,
    fileName: fileName,
  });
};