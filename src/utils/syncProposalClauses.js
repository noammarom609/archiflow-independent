// Utility to sync proposal clauses from existing proposals AND templates
// This extracts unique clauses from all proposals and templates and adds them to the clause library

import { archiflow } from '@/api/archiflow';

/**
 * Extract unique clauses from all existing proposals AND templates, add to clause library
 */
export async function syncClausesFromProposals() {
  try {
    // Fetch all proposals with items
    const proposals = await archiflow.entities.Proposal.list();
    
    // Fetch all proposal templates (13 project type templates)
    const templates = await archiflow.entities.ProposalTemplate.list();
    
    // Fetch existing clauses to avoid duplicates
    const existingClauses = await archiflow.entities.ProposalClause.list();
    // Check both title and clause_text for existing clauses
    const existingTexts = new Set(existingClauses.map(c => (c.clause_text || c.title || '').toLowerCase().trim().substring(0, 50)));
    
    // Collect unique clauses from proposals and templates
    const clauseMap = new Map();
    
    // Process proposals
    for (const proposal of proposals) {
      if (!proposal.items || !Array.isArray(proposal.items)) continue;
      
      for (const item of proposal.items) {
        if (!item.description || item.description.length < 10) continue;
        
        // Create a key based on the first 50 characters (to group similar items)
        const key = item.description.substring(0, 50).toLowerCase().trim();
        
        // Skip if already exists
        if (existingTexts.has(key)) continue;
        
        // Determine category from description or item.category
        const category = detectCategory(item.category || item.description);
        
        if (!clauseMap.has(key)) {
          clauseMap.set(key, {
            clause_text: item.description,
            title: extractTitle(item.description),
            category: category,
            default_quantity: item.quantity || 1,
            default_unit: item.unit || 'יח\'',
            default_price: item.unit_price || 0,
          });
        }
      }
    }
    
    // Process templates (13 project type templates)
    console.log(`Processing ${templates.length} templates...`);
    for (const template of templates) {
      // Check template.sections[].content.items (main structure)
      if (template.sections && Array.isArray(template.sections)) {
        for (const section of template.sections) {
          if (section.content && section.content.items && Array.isArray(section.content.items)) {
            console.log(`  Template "${template.name}" section "${section.title}" has ${section.content.items.length} items`);
            for (const item of section.content.items) {
              processItem(item, existingTexts, clauseMap);
            }
          }
        }
      }
      
      // Check template items at root level
      if (template.items && Array.isArray(template.items)) {
        for (const item of template.items) {
          processItem(item, existingTexts, clauseMap);
        }
      }
      
      // Check template default_items
      if (template.default_items && Array.isArray(template.default_items)) {
        for (const item of template.default_items) {
          processItem(item, existingTexts, clauseMap);
        }
      }
      
      // Check template clauses array
      if (template.clauses && Array.isArray(template.clauses)) {
        for (const item of template.clauses) {
          processItem(item, existingTexts, clauseMap);
        }
      }
    }
    
    // Create new clauses
    const newClauses = Array.from(clauseMap.values());
    let created = 0;
    
    for (const clause of newClauses) {
      try {
        await archiflow.entities.ProposalClause.create(clause);
        created++;
      } catch (error) {
        console.warn('Failed to create clause:', clause.title, error);
      }
    }
    
    return {
      success: true,
      created,
      total: newClauses.length,
      existing: existingClauses.length,
      templatesProcessed: templates.length
    };
  } catch (error) {
    console.error('Error syncing clauses:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Process a single item and add to clauseMap if unique
 */
function processItem(item, existingTexts, clauseMap) {
  const desc = item.description || item.clause_text || item.text || item.content || '';
  if (desc.length < 10) return;
  
  const key = desc.substring(0, 50).toLowerCase().trim();
  if (existingTexts.has(key) || clauseMap.has(key)) return;
  
  const category = detectCategory(item.category || desc);
  clauseMap.set(key, {
    clause_text: desc,
    title: extractTitle(desc),
    category: category,
    default_quantity: item.quantity || 1,
    default_unit: item.unit || 'יח\'',
    default_price: item.unit_price || item.price || 0,
  });
}

/**
 * Detect category from description text
 */
function detectCategory(text) {
  if (!text) return 'כללי';
  const lower = text.toLowerCase();
  
  if (lower.includes('ייזום') || lower.includes('מקדמי') || lower.includes('פתיחה') || lower.includes('היכרות')) {
    return 'ייזום';
  }
  if (lower.includes('תכנון') || lower.includes('אדריכלי') || lower.includes('עיצוב') || lower.includes('סקיצ')) {
    return 'תכנון';
  }
  if (lower.includes('רישוי') || lower.includes('היתר') || lower.includes('רשות') || lower.includes('ועדה')) {
    return 'רישוי';
  }
  if (lower.includes('ליווי') || lower.includes('פיקוח') || lower.includes('ביצוע') || lower.includes('קבלן')) {
    return 'ליווי';
  }
  if (lower.includes('סיום') || lower.includes('מסירה') || lower.includes('גמר') || lower.includes('ליקוי')) {
    return 'סיום';
  }
  
  return 'כללי';
}

/**
 * Extract a short title from description
 */
function extractTitle(description) {
  if (!description) return 'סעיף ללא כותרת';
  
  // Take first sentence or first 60 characters
  const firstSentence = description.split(/[.!?]/)[0];
  if (firstSentence.length <= 60) {
    return firstSentence.trim();
  }
  
  // Otherwise take first 60 chars and add ellipsis
  return description.substring(0, 57).trim() + '...';
}

export default syncClausesFromProposals;
