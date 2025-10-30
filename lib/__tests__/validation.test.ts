/**
 * Unit tests for validation schemas
 */

import {
  registerSchema,
  loginSchema,
  createProjectSchema,
  createEnvironmentSchema,
  createVariableSchema,
  updateVariableSchema,
} from '../validation';

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
      };
      
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'John Doe',
      };
      
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: 'short',
        name: 'John Doe',
      };
      
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('should allow optional name', () => {
      const validData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
      };
      
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'SecurePass123!',
      };
      
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password',
      };
      
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'user@example.com',
      };
      
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe('createProjectSchema', () => {
    it('should validate correct project data', () => {
      const validData = {
        name: 'My Project',
        description: 'A test project',
      };
      
      expect(() => createProjectSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        description: 'Description',
      };
      
      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should reject too long name', () => {
      const invalidData = {
        name: 'a'.repeat(256),
        description: 'Description',
      };
      
      expect(() => createProjectSchema.parse(invalidData)).toThrow();
    });

    it('should allow optional description', () => {
      const validData = {
        name: 'My Project',
      };
      
      expect(() => createProjectSchema.parse(validData)).not.toThrow();
    });
  });

  describe('createEnvironmentSchema', () => {
    it('should validate correct environment data', () => {
      const validData = {
        name: 'Production',
        description: 'Production environment',
      };
      
      expect(() => createEnvironmentSchema.parse(validData)).not.toThrow();
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
      };
      
      expect(() => createEnvironmentSchema.parse(invalidData)).toThrow();
    });

    it('should trim whitespace', () => {
      const data = {
        name: '  Development  ',
        description: '  Dev env  ',
      };
      
      const result = createEnvironmentSchema.parse(data);
      expect(result.name).toBe('Development');
      expect(result.description).toBe('Dev env');
    });
  });

  describe('createVariableSchema', () => {
    it('should validate correct variable data', () => {
      const validData = {
        key: 'DATABASE_URL',
        value: 'postgresql://localhost:5432/db',
        description: 'Database connection string',
      };
      
      expect(() => createVariableSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid key format', () => {
      const invalidKeys = [
        { key: 'lowercase', reason: 'lowercase' },
        { key: 'with-dashes', reason: 'dashes' },
        { key: 'with spaces', reason: 'spaces' },
        { key: 'with.dots', reason: 'dots' },
        { key: '123START', reason: 'starts with number' },
        { key: '', reason: 'empty' },
      ];
      
      invalidKeys.forEach(({ key, reason }) => {
        const data = { key, value: 'test-value' };
        expect(() => createVariableSchema.parse(data)).toThrow();
      });
    });

    it('should accept valid key formats', () => {
      const validKeys = [
        'DATABASE_URL',
        'API_KEY',
        'SECRET_123',
        'MY_VAR',
        'VAR_WITH_MULTIPLE_UNDERSCORES',
        'A', // Single letter is valid
      ];
      
      validKeys.forEach(key => {
        const data = { key, value: 'test-value' };
        expect(() => createVariableSchema.parse(data)).not.toThrow();
      });
    });

    it('should reject empty value', () => {
      const invalidData = {
        key: 'MY_VAR',
        value: '',
      };
      
      expect(() => createVariableSchema.parse(invalidData)).toThrow();
    });

    it('should allow optional description', () => {
      const validData = {
        key: 'MY_VAR',
        value: 'my-value',
      };
      
      expect(() => createVariableSchema.parse(validData)).not.toThrow();
    });

    it('should reject too long key', () => {
      const invalidData = {
        key: 'A'.repeat(256),
        value: 'value',
      };
      
      expect(() => createVariableSchema.parse(invalidData)).toThrow();
    });
  });

  describe('updateVariableSchema', () => {
    it('should validate partial updates', () => {
      const validUpdates = [
        { value: 'new-value' },
        { description: 'new description' },
        { value: 'new-value', description: 'new description' },
      ];
      
      validUpdates.forEach(update => {
        expect(() => updateVariableSchema.parse(update)).not.toThrow();
      });
    });

    it('should reject empty value', () => {
      const invalidData = {
        value: '',
      };
      
      expect(() => updateVariableSchema.parse(invalidData)).toThrow();
    });

    it('should allow empty description', () => {
      const validData = {
        description: '',
      };
      
      expect(() => updateVariableSchema.parse(validData)).not.toThrow();
    });

    it('should reject updates with no fields', () => {
      const invalidData = {};
      
      // Should throw because at least one field is required
      expect(() => updateVariableSchema.parse(invalidData)).toThrow();
    });
  });

  describe('Integration tests', () => {
    it('should validate complete user registration flow', () => {
      const users = [
        { email: 'user1@example.com', password: 'Pass123!@#', name: 'User One' },
        { email: 'user2@test.com', password: 'SecurePassword1' },
        { email: 'admin@company.co.uk', password: 'AdminPass999', name: 'Admin' },
      ];
      
      users.forEach(user => {
        expect(() => registerSchema.parse(user)).not.toThrow();
      });
    });

    it('should validate complete project setup flow', () => {
      const project = createProjectSchema.parse({
        name: 'MyApp',
        description: 'My application',
      });
      
      const environment = createEnvironmentSchema.parse({
        name: 'Production',
        description: 'Prod env',
      });
      
      const variable = createVariableSchema.parse({
        key: 'DATABASE_URL',
        value: 'postgresql://...',
        description: 'DB connection',
      });
      
      expect(project).toBeDefined();
      expect(environment).toBeDefined();
      expect(variable).toBeDefined();
    });
  });
});
