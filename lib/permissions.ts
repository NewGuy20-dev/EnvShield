import { Role } from '@prisma/client';

export function canViewVariables(role?: Role) {
  return Boolean(role); // all members can view masked values
}

export function canViewDecryptedVariables(role?: Role) {
  if (!role) return false;
  return role === Role.OWNER || role === Role.ADMIN || role === Role.DEVELOPER;
}

export function canModifyVariables(role?: Role) {
  if (!role) return false;
  return role === Role.OWNER || role === Role.ADMIN || role === Role.DEVELOPER;
}

export function canManageEnvironments(role?: Role) {
  if (!role) return false;
  return role === Role.OWNER || role === Role.ADMIN;
}

export function canManageTeam(role?: Role) {
  if (!role) return false;
  return role === Role.OWNER || role === Role.ADMIN;
}

export function canDeleteProject(role?: Role) {
  return role === Role.OWNER;
}

export function canManageProject(role?: Role) {
  if (!role) return false;
  return role === Role.OWNER || role === Role.ADMIN;
}

/**
 * Get role hierarchy value (higher = more permissions)
 */
export function getRoleHierarchy(role?: Role): number {
  if (!role) return 0;
  
  const hierarchy = {
    [Role.OWNER]: 4,
    [Role.ADMIN]: 3,
    [Role.DEVELOPER]: 2,
    [Role.VIEWER]: 1,
  };
  
  return hierarchy[role] || 0;
}
