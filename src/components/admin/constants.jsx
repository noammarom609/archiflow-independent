/**
 * User Roles and Permissions Configuration
 * ==========================================
 * 
 * Role Hierarchy (from highest to lowest):
 * 1. super_admin - Full system access, can manage all architects and users
 * 2. admin - System admin, full access within their scope
 * 3. architect - Main architect, manages their clients/contractors/consultants
 * 4. project_manager - Manages projects and team
 * 5. team_member - Office team member with limited access
 * 6. employee - Office employee
 * 7. client - External client with portal access only
 * 8. contractor - External contractor/supplier with portal access only
 * 9. consultant - External consultant with portal access only
 * 
 * Approval Flow:
 * - super_admin/admin/architect: Auto-approved
 * - All others: Require approval from architect or admin
 */

// All available application roles
export const APP_ROLES = [
  { value: 'super_admin', label: 'מנהל על', description: 'גישה מלאה לכל המערכת', tier: 1 },
  { value: 'admin', label: 'מנהל מערכת', description: 'גישה מלאה לכל הדפים', tier: 2 },
  { value: 'architect', label: 'אדריכל ראשי', description: 'ניהול פרויקטים ומשתמשים', tier: 3 },
  { value: 'project_manager', label: 'מנהל פרויקט', description: 'ניהול פרויקטים וצוות', tier: 4 },
  { value: 'team_member', label: 'איש צוות', description: 'עובד משרד עם גישה מוגבלת', tier: 5 },
  { value: 'employee', label: 'עובד משרד', description: 'גישה לפרויקטים וכספים', tier: 6 },
  { value: 'client', label: 'לקוח', description: 'גישה לפורטל לקוחות בלבד', tier: 7 },
  { value: 'contractor', label: 'קבלן / ספק', description: 'גישה לפורטל קבלנים בלבד', tier: 7 },
  { value: 'consultant', label: 'יועץ', description: 'גישה לפורטל יועצים בלבד', tier: 7 },
];

// Roles that require approval before accessing the system
export const ROLES_REQUIRING_APPROVAL = ['client', 'contractor', 'consultant', 'employee', 'team_member'];

// Roles that are auto-approved
export const AUTO_APPROVED_ROLES = ['super_admin', 'admin', 'architect', 'project_manager'];

// Roles that can approve other users
export const APPROVER_ROLES = ['super_admin', 'admin', 'architect'];

// Roles that can invite other users
export const INVITER_ROLES = ['super_admin', 'admin', 'architect', 'project_manager'];

// Roles that can manage (edit/delete) other users
export const MANAGER_ROLES = ['super_admin', 'admin', 'architect'];

// All available pages in the system
export const AVAILABLE_PAGES = [
  { id: 'Dashboard', label: 'לוח בקרה', icon: 'LayoutDashboard' },
  { id: 'Projects', label: 'פרויקטים', icon: 'FolderKanban' },
  { id: 'People', label: 'אנשי קשר וצוות', icon: 'Users' },
  { id: 'Calendar', label: 'לוח שנה', icon: 'Calendar' },
  { id: 'TimeTracking', label: 'ניהול שעות', icon: 'Clock' },
  { id: 'MeetingSummaries', label: 'סיכומי פגישות', icon: 'FileAudio' },
  { id: 'Recordings', label: 'בקרת הקלטות (אדמין)', icon: 'Mic' },
  { id: 'Journal', label: 'יומן', icon: 'BookOpen' },
  { id: 'ContractorPortal', label: 'פורטל קבלנים', icon: 'Building2' },
  { id: 'ConsultantPortal', label: 'פורטל יועצים', icon: 'HardHat' },
  { id: 'ClientPortal', label: 'פורטל לקוחות', icon: 'User' },
  { id: 'DesignLibrary', label: 'ספריית עיצוב', icon: 'Palette' },
  { id: 'Financials', label: 'כספים', icon: 'Banknote' },
  { id: 'UserManagement', label: 'ניהול משתמשים', icon: 'UserCog' },
  { id: 'SuperAdminDashboard', label: 'לוח בקרה מנהל על', icon: 'Shield' },
  { id: 'Support', label: 'תמיכה', icon: 'HelpCircle' },
];

// Default page access per role
export const ROLE_PRESETS = {
  super_admin: AVAILABLE_PAGES.map(p => p.id), // All pages (including Recordings admin)
  admin: AVAILABLE_PAGES.filter(p => !['SuperAdminDashboard', 'Recordings'].includes(p.id)).map(p => p.id), // All except SuperAdmin and Recordings admin
  architect: [
    'Dashboard', 'Projects', 'People', 'Calendar', 'TimeTracking', 'MeetingSummaries', 'Journal',
    'DesignLibrary', 'Financials', 'UserManagement', 'Support'
  ],
  project_manager: [
    'Dashboard', 'Projects', 'People', 'Calendar', 'TimeTracking', 'MeetingSummaries', 'Journal',
    'DesignLibrary', 'Support'
  ],
  team_member: [
    'Dashboard', 'Projects', 'Calendar', 'TimeTracking', 'MeetingSummaries', 'DesignLibrary', 'Support'
  ],
  employee: [
    'Dashboard', 'Projects', 'People', 'Calendar', 'TimeTracking', 'MeetingSummaries', 'DesignLibrary', 'Financials', 'Support'
  ],
  client: ['ClientPortal', 'Support'],
  contractor: ['ContractorPortal', 'Support'],
  consultant: ['ConsultantPortal', 'Support'],
};

// User status options
export const USER_STATUSES = [
  { value: 'active', label: 'פעיל', color: 'green' },
  { value: 'pending_approval', label: 'ממתין לאישור', color: 'yellow' },
  { value: 'suspended', label: 'מושעה', color: 'red' },
  { value: 'inactive', label: 'לא פעיל', color: 'gray' },
];

// Approval status options
export const APPROVAL_STATUSES = [
  { value: 'pending', label: 'ממתין', color: 'yellow' },
  { value: 'approved', label: 'מאושר', color: 'green' },
  { value: 'rejected', label: 'נדחה', color: 'red' },
];

// Entity user_status options (for Client, Contractor, Consultant, TeamMember)
export const ENTITY_USER_STATUSES = [
  { value: 'not_invited', label: 'לא הוזמן', color: 'gray' },
  { value: 'invited', label: 'הוזמן', color: 'blue' },
  { value: 'active', label: 'פעיל', color: 'green' },
  { value: 'disabled', label: 'מושבת', color: 'red' },
];

// Helper function to get role label
export const getRoleLabel = (roleValue) => {
  const role = APP_ROLES.find(r => r.value === roleValue);
  return role?.label || roleValue;
};

// Helper function to get role by value
export const getRoleByValue = (roleValue) => {
  return APP_ROLES.find(r => r.value === roleValue);
};

// Helper function to check if role requires approval
export const roleRequiresApproval = (roleValue) => {
  return ROLES_REQUIRING_APPROVAL.includes(roleValue);
};

// Helper function to check if role can approve others
export const canApproveUsers = (roleValue) => {
  return APPROVER_ROLES.includes(roleValue);
};

// Helper function to check if role can invite others
export const canInviteUsers = (roleValue) => {
  return INVITER_ROLES.includes(roleValue);
};

// Helper function to check if role can manage others
export const canManageUsers = (roleValue) => {
  return MANAGER_ROLES.includes(roleValue);
};

// Helper function to get default pages for a role
export const getDefaultPagesForRole = (roleValue) => {
  return ROLE_PRESETS[roleValue] || ['Support'];
};

// Get roles that the current user can assign to others
export const getAssignableRoles = (currentUserRole) => {
  const currentRoleTier = APP_ROLES.find(r => r.value === currentUserRole)?.tier || 999;
  
  // Can only assign roles at same level or lower (higher tier number)
  return APP_ROLES.filter(role => {
    // super_admin can assign any role
    if (currentUserRole === 'super_admin') return true;
    // Others can only assign roles at their level or lower
    return role.tier >= currentRoleTier;
  });
};
