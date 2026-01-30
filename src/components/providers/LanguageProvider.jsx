import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

const translations = {
  he: {
    // Common
    'common.save': 'שמור',
    'common.cancel': 'ביטול',
    'common.delete': 'מחק',
    'common.edit': 'ערוך',
    'common.close': 'סגור',
    'common.search': 'חיפוש',
    'common.filter': 'סנן',
    'common.loading': 'טוען...',
    'common.error': 'שגיאה',
    'common.success': 'הצלחה',
    'common.apply': 'החל',
    'common.reset': 'אפס לברירת מחדל',
    
    // Navigation - Main Menu
    'nav.dashboard': 'לוח בקרה',
    'nav.projects': 'פרויקטים',
    'nav.calendar': 'לוח שנה',
    'nav.team': 'צוות והרשאות',
    'nav.contractors': 'קבלנים ושותפים',
    'nav.consultants': 'יועצים',
    'nav.consultantPortal': 'פורטל יועצים',
    'nav.contractorPortal': 'פורטל קבלנים',
    'nav.supplierPortal': 'פורטל ספקים',
    'nav.clientPortal': 'פורטל לקוח',
    'nav.recordings': 'הקלטות וניתוח',
    'nav.recordingsAdmin': 'בקרת הקלטות (אדמין)',
    'nav.meetingSummaries': 'סיכומי פגישות',
    'nav.journal': 'יומן',
    'nav.designLibrary': 'ספריית תוכן',
    'nav.financials': 'כספים',
    'nav.support': 'עזרה ותמיכה',
    'nav.settings': 'הגדרות',
    'nav.notifications': 'התראות',
    'nav.communication': 'תקשורת',
    'nav.people': 'אנשי קשר וצוות',
    'nav.themeSettings': 'מראה ושפה',
    'nav.timeTracking': 'ניהול שעות',
    'nav.navigateTo': 'נווט ל',
    
    // Layout - User & System
    'layout.loadingSystem': 'טוען מערכת...',
    'layout.user': 'משתמש',
    'layout.darkMode': 'מצב כהה',
    'layout.lightMode': 'מצב בהיר',
    'layout.switchToDark': 'עבור למצב כהה',
    'layout.switchToLight': 'עבור למצב בהיר',
    'layout.newNotifications': 'חדשות',
    'layout.globalSearch': 'חיפוש גלובלי',
    
    // Pending Approval Screen
    'pending.title': 'החשבון בהמתנה לאישור',
    'pending.message': 'תודה שנרשמת ל-ArchiFlow! פרטיך התקבלו בהצלחה וכעת ממתינים לאישור מנהל המערכת.',
    'pending.accountDetails': 'פרטי חשבון',
    'pending.newUser': 'משתמש חדש',
    'pending.checkStatus': 'בדוק סטטוס שוב',
    'pending.logout': 'התנתק וחזור למסך הכניסה',
    
    // Theme Settings Page
    'theme.title': 'מראה ושפה',
    'theme.subtitle': 'התאם אישית את המראה והשפה של האפליקציה',
    'theme.themes': 'ערכות נושא',
    'theme.selectTheme': 'בחר ערכת נושא:',
    'theme.customColor': 'צבע מותאם אישית:',
    'theme.preview': 'תצוגה מקדימה - פלטת צבעים',
    'theme.activeTheme': 'ערכת נושא פעילה:',
    'theme.customColorActive': 'צבע מותאם אישית',
    'theme.exampleElements': 'אלמנטים לדוגמה',
    'theme.typography': 'טיפוגרפיה - Heebo',
    'theme.primaryButton': 'כפתור ראשי',
    'theme.secondaryButton': 'כפתור משני',
    'theme.ghostButton': 'כפתור רוח',
    'theme.primaryTag': 'תגית בצבע ראשי',
    'theme.themeChanged': 'ערכת נושא שונתה בהצלחה',
    'theme.customColorApplied': 'צבע מותאם אושר',
    'theme.resetComplete': 'הגדרות נושא אופסו',
    
    // Language Settings
    'language.title': 'הגדרות שפה',
    'language.selectLanguage': 'בחר שפה:',
    'language.info': 'מידע',
    'language.currentLanguage': 'שפה נוכחית:',
    'language.direction': 'כיווניות:',
    'language.hebrew': 'עברית',
    'language.english': 'English',
    'language.rtl': 'RTL (ימין לשמאל)',
    'language.ltr': 'LTR (Left to Right)',
    'language.changedToHebrew': 'שפה שונתה לעברית',
    'language.changedToEnglish': 'Language changed to English',
    
    // Calendar
    'calendar.title': 'לוח שנה',
    'calendar.subtitle': 'כל האירועים והמשימות במקום אחד',
    'calendar.newEvent': 'אירוע חדש',
    'calendar.sync': 'סנכרן Google Calendar',
    'calendar.today': 'היום',
    'calendar.viewMonth': 'תצוגת חודש',
    'calendar.viewWeek': 'תצוגת שבוע',
    'calendar.viewDay': 'תצוגת יום',
    'calendar.viewAgenda': 'אג\'נדה',
    'calendar.noEvents': 'אין אירועים ביום זה',
    'calendar.statistics': 'סטטיסטיקות',
    'calendar.totalEvents': 'סה״כ אירועים',
    'calendar.meetings': 'פגישות',
    'calendar.tasks': 'משימות',
    'calendar.deadlines': 'דדליינים',
    
    // Event Types
    'eventType.meeting': 'פגישה',
    'eventType.deadline': 'דדליין',
    'eventType.task': 'משימה',
    'eventType.journal': 'יומן',
    'eventType.other': 'אחר',
    
    // Event Form
    'event.title': 'כותרת האירוע',
    'event.description': 'תיאור',
    'event.type': 'סוג אירוע',
    'event.startDate': 'תאריך ושעת התחלה',
    'event.endDate': 'תאריך ושעת סיום',
    'event.allDay': 'אירוע של יום שלם',
    'event.location': 'מיקום',
    'event.attendees': 'משתתפים',
    'event.reminder': 'תזכורת',
    'event.reminderMinutes': 'תזכורת לפני (דקות)',
    'event.requiresApproval': 'דרוש אישור לאירוע',
    'event.exportToGoogle': 'ייצא אוטומטית ל-Google Calendar',
    'event.addEvent': 'הוסף אירוע',
    'event.saving': 'שומר...',
    
    // Messages
    'message.eventAdded': 'אירוע נוסף בהצלחה',
    'message.eventDeleted': 'אירוע נמחק בהצלחה',
    'message.eventError': 'שגיאה בהוספת אירוע',
    'message.syncSuccess': 'יובאו {count} אירועים מ-Google Calendar',
    'message.syncError': 'שגיאה בסנכרון עם Google Calendar',
    
    // Consultants
    'consultants.subtitle': 'ניהול יועצים חיצוניים לפרויקטים',
    'consultants.totalConsultants': 'סה״כ יועצים',
    'consultants.activeConsultants': 'יועצים פעילים',
    'consultants.consultantTypes': 'סוגי יועצים',
    'consultants.averageRating': 'דירוג ממוצע',
    'consultants.addConsultant': 'הוסף יועץ',
    'consultants.searchPlaceholder': 'חפש יועץ לפי שם, חברה או טלפון...',
    'consultants.noConsultants': 'לא נמצאו יועצים',
    'consultants.addFirstConsultant': 'הוסף יועץ ראשון או שנה את מסנני החיפוש',
    'consultants.backToList': 'חזרה לרשימת יועצים',
    'consultants.projects': 'פרויקטים',
    'consultants.details': 'פרטים',
    'consultants.contactInfo': 'פרטי קשר',
    'consultants.additionalInfo': 'מידע נוסף',
    'consultants.type': 'סוג יועץ',
    'consultants.license': 'רישיון',
    'consultants.licenseNumber': 'מספר רישיון',
    'consultants.noProjects': 'אין פרויקטים משויכים',
    'consultants.assignFromProject': 'שייך את היועץ לפרויקט מתוך דף הפרויקט',
    'consultants.project': 'פרויקט',
    'consultants.scopeNotDefined': 'תחום לא הוגדר',
    'consultants.deleteSuccess': 'היועץ נמחק בהצלחה',
    'consultants.deleteError': 'שגיאה במחיקת היועץ',
    'consultants.confirmDelete': 'האם אתה בטוח שברצונך למחוק את היועץ?',
    'consultants.addNewConsultant': 'הוספת יועץ חדש',
    'consultants.consultantName': 'שם היועץ',
    'consultants.fullName': 'שם מלא',
    'consultants.consultantType': 'סוג יועץ',
    'consultants.selectType': 'בחר סוג יועץ...',
    'consultants.company': 'חברה/משרד',
    'consultants.companyName': 'שם החברה',
    'consultants.streetCity': 'רחוב, עיר',
    'consultants.notesPlaceholder': 'הערות נוספות על היועץ...',
    'consultants.requiredFields': 'שם, סוג יועץ וטלפון הם שדות חובה',
    'consultants.addSuccess': 'יועץ נוסף בהצלחה!',
    'consultants.addError': 'שגיאה בהוספת היועץ',
    
    // Common additions
    'common.all': 'הכל',
    'common.active': 'פעילים',
    'common.inactive': 'לא פעיל',
    'common.pending': 'ממתין',
    'common.completed': 'הושלם',
    'common.phone': 'טלפון',
    'common.email': 'אימייל',
    'common.address': 'כתובת',
    'common.notes': 'הערות',
    'common.status': 'סטטוס',
    'common.rating': 'דירוג',
  },
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.apply': 'Apply',
    'common.reset': 'Reset to Default',
    
    // Navigation - Main Menu
    'nav.dashboard': 'Dashboard',
    'nav.projects': 'Projects',
    'nav.calendar': 'Calendar',
    'nav.team': 'Team & Permissions',
    'nav.contractors': 'Contractors & Partners',
    'nav.consultants': 'Consultants',
    'nav.consultantPortal': 'Consultant Portal',
    'nav.contractorPortal': 'Contractor Portal',
    'nav.supplierPortal': 'Supplier Portal',
    'nav.clientPortal': 'Client Portal',
    'nav.recordings': 'Recordings & Analysis',
    'nav.recordingsAdmin': 'Recordings Control (Admin)',
    'nav.meetingSummaries': 'Meeting Summaries',
    'nav.journal': 'Journal',
    'nav.designLibrary': 'Content Library',
    'nav.financials': 'Financials',
    'nav.support': 'Help & Support',
    'nav.settings': 'Settings',
    'nav.notifications': 'Notifications',
    'nav.communication': 'Communication',
    'nav.people': 'Contacts & Team',
    'nav.themeSettings': 'Appearance & Language',
    'nav.timeTracking': 'Time Tracking',
    'nav.navigateTo': 'Navigate to',
    
    // Layout - User & System
    'layout.loadingSystem': 'Loading system...',
    'layout.user': 'User',
    'layout.darkMode': 'Dark Mode',
    'layout.lightMode': 'Light Mode',
    'layout.switchToDark': 'Switch to dark mode',
    'layout.switchToLight': 'Switch to light mode',
    'layout.newNotifications': 'new',
    'layout.globalSearch': 'Global search',
    
    // Pending Approval Screen
    'pending.title': 'Account Pending Approval',
    'pending.message': 'Thank you for registering with ArchiFlow! Your details have been received and are awaiting administrator approval.',
    'pending.accountDetails': 'Account Details',
    'pending.newUser': 'New User',
    'pending.checkStatus': 'Check Status Again',
    'pending.logout': 'Logout and Return to Login',
    
    // Theme Settings Page
    'theme.title': 'Appearance & Language',
    'theme.subtitle': 'Customize the appearance and language of the application',
    'theme.themes': 'Themes',
    'theme.selectTheme': 'Select Theme:',
    'theme.customColor': 'Custom Color:',
    'theme.preview': 'Preview - Color Palette',
    'theme.activeTheme': 'Active Theme:',
    'theme.customColorActive': 'Custom Color',
    'theme.exampleElements': 'Example Elements',
    'theme.typography': 'Typography - Heebo',
    'theme.primaryButton': 'Primary Button',
    'theme.secondaryButton': 'Secondary Button',
    'theme.ghostButton': 'Ghost Button',
    'theme.primaryTag': 'Primary Tag',
    'theme.themeChanged': 'Theme changed successfully',
    'theme.customColorApplied': 'Custom color applied',
    'theme.resetComplete': 'Theme settings reset',
    
    // Language Settings
    'language.title': 'Language Settings',
    'language.selectLanguage': 'Select Language:',
    'language.info': 'Information',
    'language.currentLanguage': 'Current Language:',
    'language.direction': 'Direction:',
    'language.hebrew': 'Hebrew',
    'language.english': 'English',
    'language.rtl': 'RTL (Right to Left)',
    'language.ltr': 'LTR (Left to Right)',
    'language.changedToHebrew': 'Language changed to Hebrew',
    'language.changedToEnglish': 'Language changed to English',
    
    // Calendar
    'calendar.title': 'Calendar',
    'calendar.subtitle': 'All your events and tasks in one place',
    'calendar.newEvent': 'New Event',
    'calendar.sync': 'Sync Google Calendar',
    'calendar.today': 'Today',
    'calendar.viewMonth': 'Month View',
    'calendar.viewWeek': 'Week View',
    'calendar.viewDay': 'Day View',
    'calendar.viewAgenda': 'Agenda',
    'calendar.noEvents': 'No events for this day',
    'calendar.statistics': 'Statistics',
    'calendar.totalEvents': 'Total Events',
    'calendar.meetings': 'Meetings',
    'calendar.tasks': 'Tasks',
    'calendar.deadlines': 'Deadlines',
    
    // Event Types
    'eventType.meeting': 'Meeting',
    'eventType.deadline': 'Deadline',
    'eventType.task': 'Task',
    'eventType.journal': 'Journal',
    'eventType.other': 'Other',
    
    // Event Form
    'event.title': 'Event Title',
    'event.description': 'Description',
    'event.type': 'Event Type',
    'event.startDate': 'Start Date & Time',
    'event.endDate': 'End Date & Time',
    'event.allDay': 'All Day Event',
    'event.location': 'Location',
    'event.attendees': 'Attendees',
    'event.reminder': 'Reminder',
    'event.reminderMinutes': 'Reminder Before (minutes)',
    'event.requiresApproval': 'Requires Approval',
    'event.exportToGoogle': 'Auto-export to Google Calendar',
    'event.addEvent': 'Add Event',
    'event.saving': 'Saving...',
    
    // Messages
    'message.eventAdded': 'Event added successfully',
    'message.eventDeleted': 'Event deleted successfully',
    'message.eventError': 'Error adding event',
    'message.syncSuccess': 'Imported {count} events from Google Calendar',
    'message.syncError': 'Error syncing with Google Calendar',
    
    // Consultants
    'consultants.subtitle': 'Manage external consultants for projects',
    'consultants.totalConsultants': 'Total Consultants',
    'consultants.activeConsultants': 'Active Consultants',
    'consultants.consultantTypes': 'Consultant Types',
    'consultants.averageRating': 'Average Rating',
    'consultants.addConsultant': 'Add Consultant',
    'consultants.searchPlaceholder': 'Search by name, company or phone...',
    'consultants.noConsultants': 'No consultants found',
    'consultants.addFirstConsultant': 'Add your first consultant or change search filters',
    'consultants.backToList': 'Back to consultants list',
    'consultants.projects': 'Projects',
    'consultants.details': 'Details',
    'consultants.contactInfo': 'Contact Information',
    'consultants.additionalInfo': 'Additional Information',
    'consultants.type': 'Consultant Type',
    'consultants.license': 'License',
    'consultants.licenseNumber': 'License Number',
    'consultants.noProjects': 'No assigned projects',
    'consultants.assignFromProject': 'Assign consultant to a project from the project page',
    'consultants.project': 'Project',
    'consultants.scopeNotDefined': 'Scope not defined',
    'consultants.deleteSuccess': 'Consultant deleted successfully',
    'consultants.deleteError': 'Error deleting consultant',
    'consultants.confirmDelete': 'Are you sure you want to delete this consultant?',
    'consultants.addNewConsultant': 'Add New Consultant',
    'consultants.consultantName': 'Consultant Name',
    'consultants.fullName': 'Full Name',
    'consultants.consultantType': 'Consultant Type',
    'consultants.selectType': 'Select consultant type...',
    'consultants.company': 'Company/Firm',
    'consultants.companyName': 'Company Name',
    'consultants.streetCity': 'Street, City',
    'consultants.notesPlaceholder': 'Additional notes about the consultant...',
    'consultants.requiredFields': 'Name, type and phone are required fields',
    'consultants.addSuccess': 'Consultant added successfully!',
    'consultants.addError': 'Error adding consultant',
    
    // Common additions
    'common.all': 'All',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.pending': 'Pending',
    'common.completed': 'Completed',
    'common.phone': 'Phone',
    'common.email': 'Email',
    'common.address': 'Address',
    'common.notes': 'Notes',
    'common.status': 'Status',
    'common.rating': 'Rating',
  },
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('he');

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('archiflow-language');
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    // Update document direction and lang
    document.documentElement.dir = language === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.body.dir = language === 'he' ? 'rtl' : 'ltr';
  }, [language]);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('archiflow-language', lang);
    }
  };

  const t = (key, params = {}) => {
    let translation = translations[language]?.[key] || key;
    
    // Replace parameters in translation
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      translation = translation.replace(`{${paramKey}}`, paramValue);
    });
    
    return translation;
  };

  const value = {
    language,
    changeLanguage,
    t,
    isRTL: language === 'he',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};