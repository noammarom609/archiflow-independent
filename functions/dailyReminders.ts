import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Scheduled function to send daily reminders:
 * - Tasks due today or tomorrow
 * - Meetings happening today
 * Runs daily at 8:00 AM
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Get all tasks that are due today or tomorrow and not completed
    const allTasks = await base44.asServiceRole.entities.Task.list();
    const upcomingTasks = allTasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false;
      const dueDate = task.due_date.split('T')[0];
      return dueDate === todayStr || dueDate === tomorrowStr;
    });

    // Get all calendar events for today
    const allEvents = await base44.asServiceRole.entities.CalendarEvent.list();
    const todayEvents = allEvents.filter(event => {
      if (!event.start_date) return false;
      const eventDate = new Date(event.start_date);
      return eventDate >= today && eventDate < tomorrow;
    });

    const notificationsSent = [];

    // Send task reminders
    for (const task of upcomingTasks) {
      const assignedTo = task.assigned_to || [];
      const isDueToday = task.due_date.split('T')[0] === todayStr;
      
      for (const userEmail of assignedTo) {
        await base44.asServiceRole.functions.invoke('createNotification', {
          user_email: userEmail,
          title: isDueToday ? '⏰ משימה לסיום היום' : '📅 משימה לסיום מחר',
          message: `"${task.title}" ${isDueToday ? 'מגיעה לסיום היום' : 'מגיעה לסיום מחר'}${task.project_name ? ` - ${task.project_name}` : ''}`,
          type: 'task_due_soon',
          priority: isDueToday ? 'high' : 'normal',
          link: task.project_id ? `Projects?id=${task.project_id}&tab=tasks` : 'Dashboard',
          entity_type: 'Task',
          entity_id: task.id,
          metadata: { 
            task_title: task.title,
            due_date: task.due_date,
            is_due_today: isDueToday
          }
        });
        notificationsSent.push({ type: 'task', user: userEmail, task: task.title });
      }
    }

    // Send meeting reminders
    for (const event of todayEvents) {
      const attendees = event.attendees || [];
      const eventTime = new Date(event.start_date);
      const timeStr = eventTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      
      for (const attendeeEmail of attendees) {
        await base44.asServiceRole.functions.invoke('createNotification', {
          user_email: attendeeEmail,
          title: '📅 תזכורת: פגישה היום',
          message: `"${event.title}" בשעה ${timeStr}${event.location ? ` ב${event.location}` : ''}`,
          type: 'meeting_reminder',
          priority: 'normal',
          link: 'Calendar',
          entity_type: 'CalendarEvent',
          entity_id: event.id,
          metadata: { 
            event_title: event.title,
            start_time: event.start_date,
            location: event.location
          }
        });
        notificationsSent.push({ type: 'meeting', user: attendeeEmail, event: event.title });
      }
    }

    return Response.json({ 
      success: true, 
      date: todayStr,
      tasks_found: upcomingTasks.length,
      events_found: todayEvents.length,
      notifications_sent: notificationsSent.length,
      details: notificationsSent
    });

  } catch (error) {
    console.error('Error in dailyReminders:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});