/**
 * Role Helper Functions
 * ======================
 * Centralized functions for checking user roles and permissions.
 * Use these functions instead of direct role checks to ensure consistency.
 */

import { 
  ROLE_PRESETS, 
  AUTO_APPROVED_ROLES, 
  APPROVER_ROLES,
  INVITER_ROLES,
  MANAGER_ROLES,
  getDefaultPagesForRole
} from '@/components/admin/constants';

/**
 * Check if user is a super admin
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isSuperAdmin = (user) => {
  return user?.app_role === 'super_admin';
};

/**
 * Check if user is an admin (includes super_admin)
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isAdmin = (user) => {
  return user?.role === 'admin' || 
         user?.app_role === 'admin' || 
         isSuperAdmin(user);
};

/**
 * Check if user is an architect (includes admin and super_admin)
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isArchitect = (user) => {
  return user?.app_role === 'architect' || isAdmin(user);
};

/**
 * Check if user is a project manager or higher
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isProjectManager = (user) => {
  return user?.app_role === 'project_manager' || isArchitect(user);
};

/**
 * Check if user is internal (not a client/contractor/consultant)
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isInternalUser = (user) => {
  const internalRoles = ['super_admin', 'admin', 'architect', 'project_manager', 'team_member', 'employee'];
  return internalRoles.includes(user?.app_role);
};

/**
 * Check if user is an external portal user
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isPortalUser = (user) => {
  const portalRoles = ['client', 'contractor', 'consultant'];
  return portalRoles.includes(user?.app_role);
};

/**
 * Check if user is auto-approved (doesn't need manual approval)
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isAutoApproved = (user) => {
  return AUTO_APPROVED_ROLES.includes(user?.app_role) || 
         user?.role === 'admin';
};

/**
 * Check if user can approve other users
 * @param {object} user - User object
 * @returns {boolean}
 */
export const canApprove = (user) => {
  return APPROVER_ROLES.includes(user?.app_role) || 
         user?.role === 'admin';
};

/**
 * Check if user can invite other users
 * @param {object} user - User object
 * @returns {boolean}
 */
export const canInvite = (user) => {
  return INVITER_ROLES.includes(user?.app_role) || 
         user?.role === 'admin';
};

/**
 * Check if user can manage (edit/delete) other users
 * @param {object} user - User object
 * @returns {boolean}
 */
export const canManage = (user) => {
  return MANAGER_ROLES.includes(user?.app_role) || 
         user?.role === 'admin';
};

/**
 * Check if user is approved and active
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isApprovedAndActive = (user) => {
  // Auto-approved roles don't need to check approval_status
  if (isAutoApproved(user)) return true;
  
  return user?.approval_status === 'approved' && 
         user?.status === 'active';
};

/**
 * Check if user is pending approval
 * @param {object} user - User object
 * @returns {boolean}
 */
export const isPendingApproval = (user) => {
  // Auto-approved roles are never pending
  if (isAutoApproved(user)) return false;
  
  return user?.approval_status === 'pending' || 
         user?.status === 'pending_approval';
};

/**
 * Check if user has access to a specific page
 * @param {object} user - User object
 * @param {string} pageName - Name of the page to check
 * @returns {boolean}
 */
export const hasPageAccess = (user, pageName) => {
  if (!user) return false;
  
  // Super admin and platform admin have access to everything
  if (isSuperAdmin(user) || user?.role === 'admin') return true;
  
  // Check if user has explicit allowed_pages
  if (user.allowed_pages && user.allowed_pages.length > 0) {
    return user.allowed_pages.includes(pageName);
  }
  
  // Fall back to role presets
  const rolePages = ROLE_PRESETS[user.app_role];
  if (rolePages) {
    return rolePages.includes(pageName);
  }
  
  // Default: deny access if no permissions defined
  return false;
};

/**
 * Get the portal page for a user based on their role
 * @param {object} user - User object
 * @returns {string|null} - Portal page name or null
 */
export const getPortalPage = (user) => {
  switch (user?.app_role) {
    case 'client': return 'ClientPortal';
    case 'contractor': return 'ContractorPortal';
    case 'consultant': return 'ConsultantPortal';
    default: return null;
  }
};

/**
 * Get the default landing page for a user based on their role
 * @param {object} user - User object
 * @returns {string} - Default page name
 */
export const getDefaultPage = (user) => {
  // Portal users go to their portal
  const portalPage = getPortalPage(user);
  if (portalPage) return portalPage;
  
  // Everyone else goes to Dashboard
  return 'Dashboard';
};

/**
 * Check if current user can manage target user
 * Based on role hierarchy - can only manage users at same level or below
 * @param {object} currentUser - Current user object
 * @param {object} targetUser - Target user object
 * @returns {boolean}
 */
export const canManageUser = (currentUser, targetUser) => {
  if (!currentUser || !targetUser) return false;
  
  // Super admin can manage anyone
  if (isSuperAdmin(currentUser)) return true;
  
  // Admin can manage anyone except super_admin
  if (isAdmin(currentUser) && !isSuperAdmin(targetUser)) return true;
  
  // Architect can manage their own users (client/contractor/consultant/team_member)
  if (currentUser.app_role === 'architect') {
    const manageableRoles = ['client', 'contractor', 'consultant', 'team_member', 'employee'];
    return manageableRoles.includes(targetUser.app_role);
  }
  
  return false;
};

/**
 * Check if a record belongs to the current user (multi-tenant check)
 * @param {object} currentUser - Current user object
 * @param {object} record - Record to check
 * @returns {boolean}
 */
export const isOwnRecord = (currentUser, record) => {
  if (!currentUser || !record) return false;
  
  // Super admin owns everything
  if (isSuperAdmin(currentUser)) return true;
  
  const myEmail = currentUser.email?.toLowerCase();
  const myId = currentUser.id;
  
  return (
    record.architect_id === myId ||
    record.created_by?.toLowerCase() === myEmail ||
    record.architect_email?.toLowerCase() === myEmail ||
    record.approved_by?.toLowerCase() === myEmail
  );
};

/**
 * Filter records based on multi-tenant rules
 * @param {array} records - Array of records
 * @param {object} currentUser - Current user object
 * @returns {array} - Filtered records
 */
export const filterByOwnership = (records, currentUser) => {
  if (!records || !currentUser) return [];
  
  // Super admin sees everything
  if (isSuperAdmin(currentUser)) return records;
  
  return records.filter(record => isOwnRecord(currentUser, record));
};

/**
 * Get role display info (label, color, icon)
 * @param {string} roleValue - Role value
 * @returns {object} - Role display info
 */
export const getRoleDisplayInfo = (roleValue) => {
  const roleInfo = {
    super_admin: { label: 'מנהל על', color: 'bg-purple-100 text-purple-800', icon: 'Shield' },
    admin: { label: 'מנהל מערכת', color: 'bg-red-100 text-red-800', icon: 'Crown' },
    architect: { label: 'אדריכל', color: 'bg-indigo-100 text-indigo-800', icon: 'Building2' },
    project_manager: { label: 'מנהל פרויקט', color: 'bg-blue-100 text-blue-800', icon: 'UserCog' },
    team_member: { label: 'איש צוות', color: 'bg-cyan-100 text-cyan-800', icon: 'Users' },
    employee: { label: 'עובד משרד', color: 'bg-gray-100 text-gray-800', icon: 'Briefcase' },
    client: { label: 'לקוח', color: 'bg-green-100 text-green-800', icon: 'User' },
    contractor: { label: 'קבלן / ספק', color: 'bg-orange-100 text-orange-800', icon: 'HardHat' },
    consultant: { label: 'יועץ', color: 'bg-teal-100 text-teal-800', icon: 'GraduationCap' },
  };
  
  return roleInfo[roleValue] || { label: roleValue, color: 'bg-gray-100 text-gray-800', icon: 'User' };
};

/**
 * Get status display info (label, color)
 * @param {string} status - Status value
 * @returns {object} - Status display info
 */
export const getStatusDisplayInfo = (status) => {
  const statusInfo = {
    active: { label: 'פעיל', color: 'bg-green-100 text-green-800' },
    pending: { label: 'ממתין', color: 'bg-yellow-100 text-yellow-800' },
    pending_approval: { label: 'ממתין לאישור', color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'מאושר', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'נדחה', color: 'bg-red-100 text-red-800' },
    suspended: { label: 'מושעה', color: 'bg-red-100 text-red-800' },
    inactive: { label: 'לא פעיל', color: 'bg-gray-100 text-gray-800' },
    invited: { label: 'הוזמן', color: 'bg-blue-100 text-blue-800' },
    not_invited: { label: 'לא הוזמן', color: 'bg-gray-100 text-gray-800' },
  };
  
  return statusInfo[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
};
