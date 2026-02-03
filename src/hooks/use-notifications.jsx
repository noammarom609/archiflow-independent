import { useCallback } from 'react';
import { archiflow } from '@/api/archiflow';

/**
 * Central hook for sending push notifications
 * This hook provides methods to send notifications to users based on various events
 */
export function useNotifications() {
  
  /**
   * Helper to resolve email from client_id
   * @param {string} clientId - The client UUID
   * @returns {Promise<string|null>} - The client's email or null
   */
  const resolveClientEmail = async (clientId) => {
    try {
      const client = await archiflow.entities.Client.get(clientId);
      return client?.email || null;
    } catch (err) {
      console.warn('[Notifications] Could not resolve client email:', err);
      return null;
    }
  };

  /**
   * Send a push notification to a specific user
   * @param {string} userIdOrEmail - The user ID, client ID, or email to send notification to
   * @param {Object} notification - Notification content
   * @param {string} notification.title - Notification title
   * @param {string} notification.body - Notification body
   * @param {string} notification.url - URL to open when clicked
   * @param {string} notification.type - Notification type for tracking
   */
  const sendToUser = useCallback(async (userIdOrEmail, notification) => {
    if (!userIdOrEmail) {
      console.warn('[Notifications] No userIdOrEmail provided, skipping notification');
      return { success: false, error: 'No userIdOrEmail' };
    }

    // Determine if it's an email or ID (UUID)
    let isEmail = typeof userIdOrEmail === 'string' && userIdOrEmail.includes('@');
    let targetEmail = isEmail ? userIdOrEmail.toLowerCase() : null;
    
    // If not an email, try to resolve from clients table (client_id -> email)
    if (!isEmail && typeof userIdOrEmail === 'string') {
      console.log('[Notifications] Resolving client email from ID:', userIdOrEmail);
      targetEmail = await resolveClientEmail(userIdOrEmail);
      if (targetEmail) {
        console.log('[Notifications] Resolved client email:', targetEmail);
        isEmail = true;
      }
    }
    
    try {
      // Create in-app notification record (non-blocking)
      // IMPORTANT: Always use user_email, not user_id, because user_id has a foreign key
      // constraint to the users table. Clerk user IDs may not exist in that table.
      const notificationData = {
        title: notification.title,
        message: notification.body,
        notification_type: notification.type || 'general',
        link: notification.url,
        is_read: false,
        // Always use email to avoid FK constraint violation on user_id
        user_email: targetEmail
      };
      
      // Only create notification if we have an email identifier
      if (!targetEmail) {
        console.warn('[Notifications] Skipping in-app notification - could not resolve email');
      } else {
        archiflow.entities.Notification.create(notificationData)
          .catch(err => console.warn('[Notifications] Failed to create in-app notification:', err));
      }

      // Push notification only when we have email (edge function looks up by email/userId in auth)
      if (targetEmail) {
        try {
          await archiflow.functions.invoke('sendPushNotification', {
            userEmail: targetEmail,
            userId: null,
            title: notification.title,
            body: notification.body,
            url: notification.url || '/',
            tag: notification.type || 'archiflow-notification'
          });
        } catch (pushErr) {
          // Non-blocking: "User not found" is normal when recipient has no push subscription
          console.warn('[Notifications] Push send skipped or failed:', pushErr?.data?.message || pushErr?.message);
        }
      }

      console.log('[Notifications] Sent to user:', targetEmail || userIdOrEmail);
      return { success: true };
    } catch (error) {
      console.error('[Notifications] Error sending to user:', error);
      // Don't throw - notifications should be non-blocking
      return { success: false, error };
    }
  }, []);

  /**
   * Send notification to multiple users
   */
  const sendToUsers = useCallback(async (userIds, notification) => {
    const results = await Promise.all(
      userIds.map(userId => sendToUser(userId, notification))
    );
    return results;
  }, [sendToUser]);

  /**
   * Notification Templates - Pre-built notifications for common events
   */
  const templates = {
    // ===== PROPOSALS =====
    
    /**
     * Client approved a proposal
     */
    proposalApproved: (data) => ({
      title: '🎉 הצעת מחיר אושרה!',
      body: `${data.clientName} אישר/ה את הצעת המחיר לפרויקט "${data.projectName}"`,
      url: `/Projects?id=${data.projectId}`,
      type: 'proposal_approved',
      data
    }),

    /**
     * Proposal sent to client
     */
    proposalSent: (data) => ({
      title: '📄 הצעת מחיר חדשה',
      body: `התקבלה הצעת מחיר לפרויקט "${data.projectName}" - לחץ לצפייה ואישור`,
      url: data.approvalUrl || `/PublicApproval?id=${data.projectId}&type=proposal`,
      type: 'proposal_sent',
      data
    }),

    /**
     * Proposal rejected
     */
    proposalRejected: (data) => ({
      title: '❌ הצעת מחיר נדחתה',
      body: `${data.clientName} דחה/תה את הצעת המחיר לפרויקט "${data.projectName}"`,
      url: `/Projects?id=${data.projectId}`,
      type: 'proposal_rejected',
      data
    }),

    // ===== DOCUMENTS =====
    
    /**
     * New document uploaded
     */
    documentUploaded: (data) => ({
      title: '📎 מסמך חדש הועלה',
      body: `מסמך "${data.documentTitle}" הועלה לפרויקט "${data.projectName}"`,
      url: `/Projects?id=${data.projectId}`,
      type: 'document_uploaded',
      data
    }),

    /**
     * Sketches approved
     */
    sketchesApproved: (data) => ({
      title: '✅ סקיצות אושרו!',
      body: `${data.clientName} אישר/ה את הסקיצות לפרויקט "${data.projectName}"`,
      url: `/Projects?id=${data.projectId}`,
      type: 'sketches_approved',
      data
    }),

    /**
     * Renderings approved
     */
    renderingsApproved: (data) => ({
      title: '✅ הדמיות אושרו!',
      body: `${data.clientName} אישר/ה את ההדמיות לפרויקט "${data.projectName}"`,
      url: `/Projects?id=${data.projectId}`,
      type: 'renderings_approved',
      data
    }),

    /**
     * Technical plans approved
     */
    technicalApproved: (data) => ({
      title: '✅ תוכניות טכניות אושרו!',
      body: `${data.clientName} אישר/ה את התוכניות הטכניות לפרויקט "${data.projectName}"`,
      url: `/Projects?id=${data.projectId}`,
      type: 'technical_approved',
      data
    }),

    // ===== MEETINGS =====
    
    /**
     * New meeting scheduled
     */
    meetingScheduled: (data) => ({
      title: '📅 פגישה חדשה נקבעה',
      body: data.projectName 
        ? `"${data.meetingTitle}" לפרויקט "${data.projectName}" ב-${data.date} בשעה ${data.time}`
        : `"${data.meetingTitle}" ב-${data.date} בשעה ${data.time}`,
      url: '/Calendar',
      type: 'meeting_scheduled',
      data
    }),

    /**
     * Meeting reminder
     */
    meetingReminder: (data) => ({
      title: '⏰ תזכורת לפגישה',
      body: `"${data.meetingTitle}" מתחילה בעוד ${data.timeUntil}`,
      url: '/Calendar',
      type: 'meeting_reminder',
      requireInteraction: true,
      data
    }),

    /**
     * Meeting request from client
     */
    meetingRequest: (data) => ({
      title: '📨 בקשת פגישה חדשה',
      body: `${data.clientName} מבקש/ת לקבוע פגישה - "${data.meetingTitle}"`,
      url: '/Calendar',
      type: 'meeting_request',
      data
    }),

    /**
     * Meeting approved
     */
    meetingApproved: (data) => ({
      title: '✅ הפגישה אושרה!',
      body: `הפגישה "${data.meetingTitle}" אושרה ל-${data.date}`,
      url: '/Calendar',
      type: 'meeting_approved',
      data
    }),

    // ===== PROJECTS =====
    
    /**
     * Project stage changed
     */
    stageChanged: (data) => ({
      title: '📋 עדכון בפרויקט',
      body: `פרויקט "${data.projectName}" עבר לשלב: ${data.stageName}`,
      url: `/Projects?id=${data.projectId}`,
      type: 'stage_changed',
      data
    }),

    /**
     * Task completed
     */
    taskCompleted: (data) => ({
      title: '✅ משימה הושלמה',
      body: `המשימה "${data.taskTitle}" בפרויקט "${data.projectName}" הושלמה`,
      url: `/Projects?id=${data.projectId}`,
      type: 'task_completed',
      data
    }),

    /**
     * New project created
     */
    projectCreated: (data) => ({
      title: '🆕 פרויקט חדש',
      body: `פרויקט חדש נוצר: "${data.projectName}"`,
      url: `/Projects?id=${data.projectId}`,
      type: 'project_created',
      data
    }),

    // ===== PAYMENTS =====
    
    /**
     * Payment received
     */
    paymentReceived: (data) => ({
      title: '💰 תשלום התקבל!',
      body: `התקבל תשלום של ${data.amount} מ-${data.clientName}`,
      url: '/Financials',
      type: 'payment_received',
      data
    }),

    // ===== COMMENTS =====
    
    /**
     * New comment from client
     */
    newComment: (data) => ({
      title: '💬 הערה חדשה',
      body: `${data.clientName}: "${data.preview}"`,
      url: `/Projects?id=${data.projectId}`,
      type: 'new_comment',
      data
    }),

    // ===== CONTRACTORS =====
    
    /**
     * Contractor quote received
     */
    contractorQuote: (data) => ({
      title: '📩 הצעת קבלן התקבלה',
      body: `${data.contractorName} שלח הצעה לפרויקט "${data.projectName}"`,
      url: `/Projects?id=${data.projectId}`,
      type: 'contractor_quote',
      data
    }),

    /**
     * Contractor assigned to project
     */
    contractorAssigned: (data) => ({
      title: '🔧 הוקצית לפרויקט חדש',
      body: `הוקצית לפרויקט "${data.projectName}" - ${data.taskDescription || 'פרטים נוספים בקרוב'}`,
      url: '/ContractorPortal',
      type: 'contractor_assigned',
      data
    }),

    /**
     * Quote selected/approved
     */
    quoteSelected: (data) => ({
      title: '✅ הצעתך נבחרה!',
      body: `הצעת המחיר שלך לפרויקט "${data.projectName}" נבחרה`,
      url: '/ContractorPortal',
      type: 'quote_selected',
      data
    }),

    // ===== CONSULTANTS =====

    /**
     * Consultant document received
     */
    consultantDocument: (data) => ({
      title: '📋 מסמך יועץ התקבל',
      body: `${data.consultantName} העלה "${data.documentTitle}" לפרויקט "${data.projectName}"`,
      url: `/Projects?id=${data.projectId}`,
      type: 'consultant_document',
      data
    }),

    /**
     * Consultant assigned to project
     */
    consultantAssigned: (data) => ({
      title: '🏛️ הוקצית לפרויקט חדש',
      body: `הוקצית לפרויקט "${data.projectName}" - ${data.scope || 'פרטים נוספים בקרוב'}`,
      url: '/ConsultantPortal',
      type: 'consultant_assigned',
      data
    }),

    /**
     * Consultant task assigned
     */
    consultantTask: (data) => ({
      title: '📝 משימה חדשה',
      body: `קיבלת משימה חדשה: "${data.taskTitle}" בפרויקט "${data.projectName}"`,
      url: '/ConsultantPortal',
      type: 'consultant_task',
      data
    }),

    /**
     * Consultant report due reminder
     */
    consultantReportDue: (data) => ({
      title: '⏰ תזכורת: דו"ח ממתין',
      body: `דו"ח "${data.reportTitle}" לפרויקט "${data.projectName}" צפוי להגשה`,
      url: '/ConsultantPortal',
      type: 'consultant_report_due',
      requireInteraction: true,
      data
    }),

    // ===== INVOICES & PAYMENTS =====

    /**
     * Invoice created
     */
    invoiceCreated: (data) => ({
      title: '📄 חשבונית חדשה',
      body: `חשבונית בסך ₪${data.amount?.toLocaleString()} לפרויקט "${data.projectName}"`,
      url: data.invoiceUrl || '/Financials',
      type: 'invoice_created',
      data
    }),

    /**
     * Payment reminder
     */
    paymentReminder: (data) => ({
      title: '⏰ תזכורת תשלום',
      body: `תזכורת: חשבונית בסך ₪${data.amount?.toLocaleString()} ממתינה לתשלום`,
      url: '/Financials',
      type: 'payment_reminder',
      requireInteraction: true,
      data
    }),

    // ===== PROJECT MILESTONES =====

    /**
     * Project milestone reached
     */
    milestoneCompleted: (data) => ({
      title: '🎯 אבן דרך הושלמה!',
      body: `"${data.milestoneName}" בפרויקט "${data.projectName}" הושלמה בהצלחה`,
      url: `/Projects?id=${data.projectId}`,
      type: 'milestone_completed',
      data
    }),

    /**
     * Welcome new user
     */
    welcomeUser: (data) => ({
      title: '👋 ברוכים הבאים ל-ArchiFlow!',
      body: data.architectName 
        ? `${data.architectName} הזמין אותך להצטרף למערכת`
        : 'ברוכים הבאים למערכת ניהול הפרויקטים',
      url: data.portalUrl || '/',
      type: 'welcome',
      data
    })
  };

  /**
   * Helper to send a template notification
   * @param {string} templateName - Name of the template
   * @param {string|string[]} userIds - User ID(s) to send to
   * @param {Object} data - Data for the template
   */
  const sendTemplate = useCallback(async (templateName, userIds, data) => {
    const template = templates[templateName];
    if (!template) {
      console.error('[Notifications] Unknown template:', templateName);
      return { success: false, error: 'Unknown template' };
    }

    const notification = template(data);
    
    if (Array.isArray(userIds)) {
      return sendToUsers(userIds, notification);
    } else {
      return sendToUser(userIds, notification);
    }
  }, [templates, sendToUser, sendToUsers]);

  return {
    sendToUser,
    sendToUsers,
    sendTemplate,
    templates
  };
}

export default useNotifications;
