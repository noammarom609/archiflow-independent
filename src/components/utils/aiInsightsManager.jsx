/**
 * AI Insights Manager
 * ==================
 * מנהל מרכזי לשמירה, מיזוג ותיעוד של ניתוחי AI בפרויקט
 * 
 * לוגיקת מיזוג:
 * - REPLACE: שדות שמתעדכנים (תקציב, לו"ז, sentiment)
 * - APPEND: שדות שמצטברים (צרכים, החלטות, משימות)
 * - SMART_MERGE: שדות שמתמזגים ללא כפילויות (חדרים, חומרים)
 */

import { archiflow } from '@/api/archiflow';

// ============================================
// קונפיגורציית סוגי שדות
// ============================================

const FIELD_CONFIG = {
  // REPLACE - ערך חדש מחליף ישן
  budget_estimate: { type: 'REPLACE' },
  timeline_estimate: { type: 'REPLACE' },
  property_size: { type: 'REPLACE' },
  location_details: { type: 'REPLACE' },
  sentiment: { type: 'REPLACE' },
  summary: { type: 'REPLACE' },
  
  // APPEND - חדש מתווסף לקיים
  client_needs: { type: 'APPEND', uniqueKey: 'value' },
  explicit_needs: { type: 'APPEND', uniqueKey: 'value' },
  implicit_needs: { type: 'APPEND', uniqueKey: 'value' },
  style_preferences: { type: 'APPEND', uniqueKey: 'value' },
  decisions: { type: 'APPEND', uniqueKey: 'value' },
  action_items: { type: 'APPEND', uniqueKey: 'value' },
  concerns: { type: 'APPEND', uniqueKey: 'value' },
  follow_up_questions: { type: 'APPEND', uniqueKey: 'value' },
  key_topics: { type: 'APPEND', uniqueKey: 'value' },
  strategic_recommendations: { type: 'APPEND', uniqueKey: 'value' },
  people_mentioned: { type: 'APPEND', uniqueKey: 'name' },
  financial_mentions: { type: 'APPEND', uniqueKey: 'context' },
  
  // SMART_MERGE - מתמזג ללא כפילויות
  rooms_required: { type: 'SMART_MERGE', uniqueKey: 'value' },
  materials_mentioned: { type: 'SMART_MERGE', uniqueKey: 'value' },
};

// ============================================
// פונקציות מיזוג
// ============================================

/**
 * מיזוג שדה REPLACE - ערך חדש מחליף ישן
 */
function mergeReplace(existing, newValue) {
  if (!newValue || (typeof newValue === 'object' && !newValue.value)) {
    return existing;
  }
  return newValue;
}

/**
 * מיזוג שדה APPEND - מוסיף פריטים חדשים (עם בדיקת כפילויות)
 */
function mergeAppend(existing, newItems, uniqueKey) {
  if (!newItems || !Array.isArray(newItems) || newItems.length === 0) {
    return existing || [];
  }
  
  const existingArray = existing || [];
  const existingValues = new Set(existingArray.map(item => 
    typeof item === 'object' ? item[uniqueKey]?.toLowerCase?.() || item[uniqueKey] : item?.toLowerCase?.() || item
  ));
  
  const newUniqueItems = newItems.filter(item => {
    const value = typeof item === 'object' ? item[uniqueKey] : item;
    const normalizedValue = value?.toLowerCase?.() || value;
    return !existingValues.has(normalizedValue);
  });
  
  return [...existingArray, ...newUniqueItems];
}

/**
 * מיזוג חכם - מונע כפילויות מדויקות
 */
function mergeSmartMerge(existing, newItems, uniqueKey) {
  return mergeAppend(existing, newItems, uniqueKey);
}

// ============================================
// המרת נתוני ניתוח למבנה החדש
// ============================================

/**
 * ממיר נתוני ניתוח גולמיים למבנה ai_insights עם source tracking
 * @param {Object} analysisData - נתוני הניתוח מה-AI
 * @param {Object} source - מידע על המקור
 * @returns {Object} - נתונים במבנה ai_insights
 */
export function convertAnalysisToInsights(analysisData, source) {
  const sourceInfo = {
    type: source.type, // 'phone_call' | 'first_meeting' | 'follow_up_meeting' | 'manual'
    recording_id: source.recordingId || null,
    date: source.date || new Date().toISOString().split('T')[0],
    confidence: source.confidence || 0.85
  };
  
  const insights = {};
  
  // שדות REPLACE - עוטפים עם source
  if (analysisData.budget_estimate || analysisData.budget) {
    insights.budget_estimate = {
      value: analysisData.budget_estimate || analysisData.budget,
      source: sourceInfo
    };
  }
  
  if (analysisData.timeline_estimate || analysisData.timeline) {
    insights.timeline_estimate = {
      value: analysisData.timeline_estimate || analysisData.timeline,
      source: sourceInfo
    };
  }
  
  if (analysisData.property_size || analysisData.size) {
    insights.property_size = {
      value: analysisData.property_size || analysisData.size,
      source: sourceInfo
    };
  }
  
  if (analysisData.location) {
    insights.location_details = {
      value: analysisData.location,
      source: sourceInfo
    };
  }
  
  if (analysisData.sentiment) {
    insights.sentiment = {
      overall: analysisData.sentiment.overall || analysisData.sentiment,
      score: analysisData.sentiment.score || null,
      key_emotions: analysisData.sentiment.key_emotions || [],
      source: sourceInfo
    };
  }
  
  if (analysisData.summary || analysisData.executive_summary) {
    insights.summary = {
      value: analysisData.summary || analysisData.executive_summary,
      source: sourceInfo
    };
  }
  
  // שדות APPEND - ממירים מערכים עם source לכל פריט
  const arrayFields = [
    { from: ['client_needs', 'needs'], to: 'client_needs' },
    { from: ['explicit_needs'], to: 'explicit_needs' },
    { from: ['implicit_needs'], to: 'implicit_needs' },
    { from: ['style_preferences', 'style'], to: 'style_preferences' },
    { from: ['decisions'], to: 'decisions' },
    { from: ['action_items', 'tasks', 'next_steps'], to: 'action_items' },
    { from: ['concerns', 'risks', 'potential_concerns'], to: 'concerns' },
    { from: ['follow_up_questions', 'questions'], to: 'follow_up_questions' },
    { from: ['key_topics', 'topics'], to: 'key_topics' },
    { from: ['strategic_recommendations', 'recommendations'], to: 'strategic_recommendations' },
    { from: ['rooms_required', 'rooms'], to: 'rooms_required' },
    { from: ['materials_mentioned', 'materials'], to: 'materials_mentioned' },
  ];
  
  for (const field of arrayFields) {
    let sourceData = null;
    for (const fromKey of field.from) {
      if (analysisData[fromKey] && Array.isArray(analysisData[fromKey]) && analysisData[fromKey].length > 0) {
        sourceData = analysisData[fromKey];
        break;
      }
    }
    
    if (sourceData) {
      insights[field.to] = sourceData.map(item => {
        // אם כבר יש מבנה עם value, שמור עליו
        if (typeof item === 'object' && item.value) {
          return {
            ...item,
            source: item.source || sourceInfo
          };
        }
        // אם זה מחרוזת פשוטה, המר למבנה
        return {
          value: typeof item === 'string' ? item : item.value || item.task || item.question || item.topic || JSON.stringify(item),
          ...(item.category && { category: item.category }),
          ...(item.priority && { priority: item.priority }),
          ...(item.severity && { severity: item.severity }),
          ...(item.assignee && { assignee: item.assignee }),
          ...(item.deadline && { deadline: item.deadline }),
          ...(item.mentions && { mentions: item.mentions }),
          source: sourceInfo
        };
      });
    }
  }
  
  // people_mentioned - מבנה מיוחד
  if (analysisData.people_mentioned && Array.isArray(analysisData.people_mentioned)) {
    insights.people_mentioned = analysisData.people_mentioned.map(person => ({
      name: person.name || person,
      role: person.role || null,
      source: sourceInfo
    }));
  }
  
  // financial_mentions - מבנה מיוחד
  if (analysisData.financial_mentions || analysisData.financial_data) {
    const financialData = analysisData.financial_mentions || analysisData.financial_data;
    if (Array.isArray(financialData)) {
      insights.financial_mentions = financialData.map(item => ({
        amount: item.amount || null,
        context: item.context || item.description || null,
        source: sourceInfo
      }));
    }
  }
  
  return insights;
}

// ============================================
// פונקציית המיזוג הראשית
// ============================================

/**
 * ממזג נתוני insights חדשים עם קיימים
 * @param {Object} existingInsights - ה-ai_insights הנוכחי בפרויקט
 * @param {Object} newInsights - הנתונים החדשים למיזוג
 * @returns {Object} - { mergedInsights, changedFields, stats }
 */
export function mergeInsights(existingInsights, newInsights) {
  const existing = existingInsights || {};
  const merged = { ...existing };
  const changedFields = [];
  const stats = { items_added: 0, items_updated: 0, items_unchanged: 0 };
  
  for (const [field, newValue] of Object.entries(newInsights)) {
    if (!newValue) continue;
    
    const config = FIELD_CONFIG[field];
    if (!config) {
      // שדה לא מוכר - פשוט מעתיק
      merged[field] = newValue;
      changedFields.push(field);
      continue;
    }
    
    const existingValue = existing[field];
    
    switch (config.type) {
      case 'REPLACE':
        const replacedValue = mergeReplace(existingValue, newValue);
        if (JSON.stringify(replacedValue) !== JSON.stringify(existingValue)) {
          merged[field] = replacedValue;
          changedFields.push(field);
          if (existingValue) {
            stats.items_updated++;
          } else {
            stats.items_added++;
          }
        } else {
          stats.items_unchanged++;
        }
        break;
        
      case 'APPEND':
      case 'SMART_MERGE':
        const mergedArray = config.type === 'APPEND' 
          ? mergeAppend(existingValue, newValue, config.uniqueKey)
          : mergeSmartMerge(existingValue, newValue, config.uniqueKey);
        
        const addedCount = mergedArray.length - (existingValue?.length || 0);
        if (addedCount > 0) {
          merged[field] = mergedArray;
          changedFields.push(field);
          stats.items_added += addedCount;
        } else {
          stats.items_unchanged++;
        }
        break;
    }
  }
  
  // עדכון תאריך עדכון אחרון
  merged.last_updated = new Date().toISOString();
  
  return { mergedInsights: merged, changedFields, stats };
}

// ============================================
// שמירת Snapshot להיסטוריה
// ============================================

/**
 * שומר snapshot להיסטוריה
 * @param {Object} params
 */
async function saveHistorySnapshot(params) {
  const {
    projectId,
    projectName,
    sourceType,
    recordingId,
    previousInsights,
    newValues,
    changedFields,
    stats,
    triggeredBy
  } = params;
  
  // יצירת תיאור השינויים
  const changesSummary = generateChangesSummary(changedFields, stats);
  
  // שמירה ב-ProjectAIHistory Entity
  const historyRecord = await archiflow.entities.ProjectAIHistory.create({
    project_id: projectId,
    project_name: projectName,
    timestamp: new Date().toISOString(),
    source_type: sourceType,
    source_recording_id: recordingId || null,
    triggered_by: triggeredBy || null,
    changes_summary: changesSummary,
    fields_changed: changedFields,
    previous_snapshot: previousInsights || {},
    new_values: newValues,
    merge_stats: stats
  });
  
  return historyRecord;
}

/**
 * מייצר תיאור טקסטואלי של השינויים
 */
function generateChangesSummary(changedFields, stats) {
  const parts = [];
  
  if (stats.items_added > 0) {
    parts.push(`נוספו ${stats.items_added} פריטים`);
  }
  if (stats.items_updated > 0) {
    parts.push(`עודכנו ${stats.items_updated} שדות`);
  }
  
  if (parts.length === 0) {
    return 'אין שינויים';
  }
  
  const fieldNames = changedFields.slice(0, 3).map(f => translateFieldName(f)).join(', ');
  const moreCount = changedFields.length > 3 ? ` ועוד ${changedFields.length - 3}` : '';
  
  return `${parts.join(', ')} (${fieldNames}${moreCount})`;
}

/**
 * תרגום שמות שדות לעברית
 */
function translateFieldName(field) {
  const translations = {
    budget_estimate: 'תקציב',
    timeline_estimate: 'לו"ז',
    property_size: 'גודל נכס',
    location_details: 'מיקום',
    sentiment: 'סנטימנט',
    summary: 'סיכום',
    client_needs: 'צרכים',
    explicit_needs: 'צרכים מפורשים',
    implicit_needs: 'צרכים סמויים',
    style_preferences: 'העדפות סגנון',
    decisions: 'החלטות',
    action_items: 'משימות',
    concerns: 'חששות',
    follow_up_questions: 'שאלות המשך',
    key_topics: 'נושאים',
    strategic_recommendations: 'המלצות',
    rooms_required: 'חדרים',
    materials_mentioned: 'חומרים',
    people_mentioned: 'אנשים',
    financial_mentions: 'כספים'
  };
  return translations[field] || field;
}

// ============================================
// הפונקציה הראשית - שמירת AI Insights לפרויקט
// ============================================

/**
 * שומר ניתוחי AI לפרויקט עם מיזוג והיסטוריה
 * 
 * @param {Object} params
 * @param {string} params.projectId - מזהה הפרויקט
 * @param {Object} params.analysisData - נתוני הניתוח הגולמיים מה-AI
 * @param {Object} params.source - מידע על המקור
 * @param {string} params.source.type - 'phone_call' | 'first_meeting' | 'follow_up_meeting' | 'manual'
 * @param {string} params.source.recordingId - מזהה ההקלטה (אופציונלי)
 * @param {string} params.source.date - תאריך (אופציונלי, ברירת מחדל היום)
 * @param {string} params.triggeredBy - אימייל המשתמש
 * 
 * @returns {Object} - { success, project, historyRecord, stats }
 */
export async function saveProjectAIInsights(params) {
  const { projectId, analysisData, source, triggeredBy } = params;
  
  try {
    // 1. טעינת הפרויקט הנוכחי
    const [project] = await archiflow.entities.Project.filter({ id: projectId });
    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    // 2. שמירת ה-snapshot הקודם (אם קיים)
    const previousInsights = project.ai_insights || {};
    
    // 3. המרת נתוני הניתוח למבנה החדש
    const newInsights = convertAnalysisToInsights(analysisData, source);
    
    // 4. מיזוג הנתונים
    const { mergedInsights, changedFields, stats } = mergeInsights(previousInsights, newInsights);
    
    // אם אין שינויים, לא צריך לעשות כלום
    if (changedFields.length === 0) {
      return {
        success: true,
        project,
        historyRecord: null,
        stats,
        message: 'אין שינויים חדשים'
      };
    }
    
    // 5. שמירת Snapshot להיסטוריה
    const historyRecord = await saveHistorySnapshot({
      projectId,
      projectName: project.name,
      sourceType: source.type,
      recordingId: source.recordingId,
      previousInsights,
      newValues: newInsights,
      changedFields,
      stats,
      triggeredBy
    });
    
    // 6. עדכון ה-history המקוצר בפרויקט
    const insightsHistory = project.ai_insights_history || [];
    insightsHistory.push({
      timestamp: new Date().toISOString(),
      source_type: source.type,
      recording_id: source.recordingId || null,
      changes_summary: historyRecord.changes_summary,
      snapshot_id: historyRecord.id
    });
    
    // שמירת רק 20 רשומות אחרונות בפרויקט (היסטוריה מלאה ב-Entity)
    const trimmedHistory = insightsHistory.slice(-20);
    
    // 7. עדכון הפרויקט
    await archiflow.entities.Project.update(projectId, {
      ai_insights: mergedInsights,
      ai_insights_history: trimmedHistory,
      // עדכון גם את השדות הישנים לתאימות אחורה
      ai_summary: convertToLegacyFormat(mergedInsights)
    });
    
    // 8. טעינת הפרויקט המעודכן
    const [updatedProject] = await archiflow.entities.Project.filter({ id: projectId });
    
    console.log(`[AIInsightsManager] Saved insights for project ${projectId}:`, {
      changedFields,
      stats,
      historyId: historyRecord.id
    });
    
    return {
      success: true,
      project: updatedProject,
      historyRecord,
      stats,
      changedFields,
      message: `נשמרו ${stats.items_added} פריטים חדשים, עודכנו ${stats.items_updated} שדות`
    };
    
  } catch (error) {
    console.error('[AIInsightsManager] Error saving insights:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ממיר למבנה הישן לתאימות אחורה
 */
function convertToLegacyFormat(insights) {
  return {
    client_needs: (insights.client_needs || []).map(item => item.value || item),
    decisions: (insights.decisions || []).map(item => item.value || item),
    action_items: (insights.action_items || []).map(item => item.value || item),
    budget_estimate: insights.budget_estimate?.value || '',
    timeline_estimate: insights.timeline_estimate?.value || '',
    style_preferences: (insights.style_preferences || []).map(item => item.value || item)
  };
}

// ============================================
// פונקציות עזר נוספות
// ============================================

/**
 * קבלת היסטוריית שינויים מלאה לפרויקט
 */
export async function getProjectInsightsHistory(projectId) {
  const history = await archiflow.entities.ProjectAIHistory.filter(
    { project_id: projectId },
    '-timestamp',
    50
  );
  return history;
}

/**
 * שחזור snapshot קודם
 */
export async function restoreInsightsSnapshot(projectId, snapshotId) {
  const [snapshot] = await archiflow.entities.ProjectAIHistory.filter({ id: snapshotId });
  if (!snapshot || snapshot.project_id !== projectId) {
    throw new Error('Snapshot not found or does not belong to this project');
  }
  
  // שמירת ה-snapshot הנוכחי לפני שחזור
  await saveProjectAIInsights({
    projectId,
    analysisData: {}, // ריק - רק כדי ליצור snapshot
    source: { type: 'system', date: new Date().toISOString().split('T')[0] },
    triggeredBy: 'system_restore'
  });
  
  // שחזור
  await archiflow.entities.Project.update(projectId, {
    ai_insights: snapshot.previous_snapshot,
    ai_summary: convertToLegacyFormat(snapshot.previous_snapshot)
  });
  
  return { success: true };
}

export default {
  saveProjectAIInsights,
  convertAnalysisToInsights,
  mergeInsights,
  getProjectInsightsHistory,
  restoreInsightsSnapshot
};