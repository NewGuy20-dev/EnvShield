import { Role } from '@prisma/client';

export function canViewVariables(role?: Role) {
  return Boolean(role); // all members can view masked values
}

export function canViewDecryptedVariables(role?: Role) {
  return [Role.OWNER, Role.ADMIN, Role.DEVELOPER].includes(role!);
}

export function canModifyVariables(role?: Role) {
  return [Role.OWNER, Role.ADMIN, Role.DEVELOPER].includes(role!);
}

export function canManageEnvironments(role?: Role) {
  return [Role.OWNER, Role.ADMIN].includes(role!);
}

export function canManageTeam(role?: Role) {
  return [Role.OWNER, Role.ADMIN].includes(role!);
}

export function canDeleteProject(role?: Role) {
  return role === Role.OWNER;
}
