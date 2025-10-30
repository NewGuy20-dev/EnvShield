/**
 * Unit tests for permissions/RBAC utilities
 */

import { Role } from '@prisma/client';
import {
  canViewVariables,
  canViewDecryptedVariables,
  canModifyVariables,
  canManageEnvironments,
  canManageTeam,
  canDeleteProject,
  canManageProject,
  getRoleHierarchy,
} from '../permissions';

describe('Permissions Utils', () => {
  describe('canViewVariables', () => {
    it('should allow all roles to view variables', () => {
      expect(canViewVariables(Role.OWNER)).toBe(true);
      expect(canViewVariables(Role.ADMIN)).toBe(true);
      expect(canViewVariables(Role.DEVELOPER)).toBe(true);
      expect(canViewVariables(Role.VIEWER)).toBe(true);
    });

    it('should deny access without role', () => {
      expect(canViewVariables(undefined)).toBe(false);
      expect(canViewVariables(null as any)).toBe(false);
    });
  });

  describe('canViewDecryptedVariables', () => {
    it('should allow OWNER, ADMIN, and DEVELOPER to view decrypted values', () => {
      expect(canViewDecryptedVariables(Role.OWNER)).toBe(true);
      expect(canViewDecryptedVariables(Role.ADMIN)).toBe(true);
      expect(canViewDecryptedVariables(Role.DEVELOPER)).toBe(true);
    });

    it('should deny VIEWER access to decrypted values', () => {
      expect(canViewDecryptedVariables(Role.VIEWER)).toBe(false);
    });

    it('should deny access without role', () => {
      expect(canViewDecryptedVariables(undefined)).toBe(false);
    });
  });

  describe('canModifyVariables', () => {
    it('should allow OWNER, ADMIN, and DEVELOPER to modify variables', () => {
      expect(canModifyVariables(Role.OWNER)).toBe(true);
      expect(canModifyVariables(Role.ADMIN)).toBe(true);
      expect(canModifyVariables(Role.DEVELOPER)).toBe(true);
    });

    it('should deny VIEWER from modifying variables', () => {
      expect(canModifyVariables(Role.VIEWER)).toBe(false);
    });

    it('should deny access without role', () => {
      expect(canModifyVariables(undefined)).toBe(false);
    });
  });

  describe('canManageEnvironments', () => {
    it('should allow OWNER and ADMIN to manage environments', () => {
      expect(canManageEnvironments(Role.OWNER)).toBe(true);
      expect(canManageEnvironments(Role.ADMIN)).toBe(true);
    });

    it('should deny DEVELOPER and VIEWER from managing environments', () => {
      expect(canManageEnvironments(Role.DEVELOPER)).toBe(false);
      expect(canManageEnvironments(Role.VIEWER)).toBe(false);
    });

    it('should deny access without role', () => {
      expect(canManageEnvironments(undefined)).toBe(false);
    });
  });

  describe('canManageTeam', () => {
    it('should allow OWNER and ADMIN to manage team', () => {
      expect(canManageTeam(Role.OWNER)).toBe(true);
      expect(canManageTeam(Role.ADMIN)).toBe(true);
    });

    it('should deny DEVELOPER and VIEWER from managing team', () => {
      expect(canManageTeam(Role.DEVELOPER)).toBe(false);
      expect(canManageTeam(Role.VIEWER)).toBe(false);
    });

    it('should deny access without role', () => {
      expect(canManageTeam(undefined)).toBe(false);
    });
  });

  describe('canDeleteProject', () => {
    it('should allow only OWNER to delete project', () => {
      expect(canDeleteProject(Role.OWNER)).toBe(true);
    });

    it('should deny all other roles from deleting project', () => {
      expect(canDeleteProject(Role.ADMIN)).toBe(false);
      expect(canDeleteProject(Role.DEVELOPER)).toBe(false);
      expect(canDeleteProject(Role.VIEWER)).toBe(false);
    });

    it('should deny access without role', () => {
      expect(canDeleteProject(undefined)).toBe(false);
    });
  });

  describe('canManageProject', () => {
    it('should allow OWNER and ADMIN to manage project', () => {
      expect(canManageProject(Role.OWNER)).toBe(true);
      expect(canManageProject(Role.ADMIN)).toBe(true);
    });

    it('should deny DEVELOPER and VIEWER from managing project', () => {
      expect(canManageProject(Role.DEVELOPER)).toBe(false);
      expect(canManageProject(Role.VIEWER)).toBe(false);
    });
  });

  describe('getRoleHierarchy', () => {
    it('should return correct hierarchy value', () => {
      expect(getRoleHierarchy(Role.OWNER)).toBe(4);
      expect(getRoleHierarchy(Role.ADMIN)).toBe(3);
      expect(getRoleHierarchy(Role.DEVELOPER)).toBe(2);
      expect(getRoleHierarchy(Role.VIEWER)).toBe(1);
    });

    it('should return 0 for undefined role', () => {
      expect(getRoleHierarchy(undefined)).toBe(0);
    });
  });

  describe('Role hierarchy', () => {
    it('should establish correct permission hierarchy', () => {
      const roles = [Role.OWNER, Role.ADMIN, Role.DEVELOPER, Role.VIEWER];
      
      // OWNER should have highest permissions
      const ownerPerms = [
        canViewVariables(Role.OWNER),
        canViewDecryptedVariables(Role.OWNER),
        canModifyVariables(Role.OWNER),
        canManageEnvironments(Role.OWNER),
        canManageTeam(Role.OWNER),
        canDeleteProject(Role.OWNER),
      ];
      expect(ownerPerms.every(p => p === true)).toBe(true);
      
      // VIEWER should have lowest permissions
      const viewerPerms = [
        canViewDecryptedVariables(Role.VIEWER),
        canModifyVariables(Role.VIEWER),
        canManageEnvironments(Role.VIEWER),
        canManageTeam(Role.VIEWER),
        canDeleteProject(Role.VIEWER),
      ];
      expect(viewerPerms.every(p => p === false)).toBe(true);
      expect(canViewVariables(Role.VIEWER)).toBe(true); // Can only view masked
    });

    it('should enforce OWNER > ADMIN > DEVELOPER > VIEWER hierarchy', () => {
      expect(getRoleHierarchy(Role.OWNER)).toBeGreaterThan(getRoleHierarchy(Role.ADMIN));
      expect(getRoleHierarchy(Role.ADMIN)).toBeGreaterThan(getRoleHierarchy(Role.DEVELOPER));
      expect(getRoleHierarchy(Role.DEVELOPER)).toBeGreaterThan(getRoleHierarchy(Role.VIEWER));
    });
  });

  describe('Edge cases', () => {
    it('should handle null and undefined consistently', () => {
      const checkFunctions = [
        canViewVariables,
        canViewDecryptedVariables,
        canModifyVariables,
        canManageEnvironments,
        canManageTeam,
        canDeleteProject,
      ];

      checkFunctions.forEach(fn => {
        expect(fn(undefined)).toBe(false);
        expect(fn(null as any)).toBe(false);
      });
    });

    it('should be type-safe with Role enum', () => {
      // This test verifies TypeScript compilation
      const role: Role = Role.OWNER;
      expect(canViewVariables(role)).toBe(true);
    });
  });
});
