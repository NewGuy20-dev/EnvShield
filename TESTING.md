# Testing Guide for EnvShield

## Overview

EnvShield uses **Jest** as the testing framework with **React Testing Library** for component testing. The test suite focuses on critical security utilities and business logic.

## Running Tests

```bash
# Run tests in watch mode (development)
npm test

# Run tests once with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

## Test Structure

```
lib/
├── __tests__/
│   ├── encryption.test.ts      # Encryption/decryption tests
│   ├── permissions.test.ts     # RBAC permission tests
│   └── validation.test.ts      # Zod schema validation tests
```

## Coverage Requirements

The project enforces **70% minimum coverage** across:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## Test Categories

### 1. Encryption Tests (`lib/__tests__/encryption.test.ts`)

Tests for AES-256-GCM encryption utilities:

- ✅ Encrypt and decrypt correctness
- ✅ Different IVs for same input (security)
- ✅ Empty strings, long strings, special characters
- ✅ Unicode character support
- ✅ Storage format (JSON serialization)
- ✅ Error handling for tampered data
- ✅ Security properties (IV length, tag length, base64 encoding)

**Critical**: These tests ensure secrets are properly encrypted and cannot be tampered with.

### 2. Permission Tests (`lib/__tests__/permissions.test.ts`)

Tests for RBAC (Role-Based Access Control):

- ✅ View variables (all roles)
- ✅ View decrypted variables (OWNER, ADMIN, DEVELOPER only)
- ✅ Modify variables (OWNER, ADMIN, DEVELOPER only)
- ✅ Manage environments (OWNER, ADMIN only)
- ✅ Manage team (OWNER, ADMIN only)
- ✅ Delete project (OWNER only)
- ✅ Role hierarchy enforcement
- ✅ Edge cases (null, undefined, invalid roles)

**Critical**: These tests ensure proper authorization and prevent privilege escalation.

### 3. Validation Tests (`lib/__tests__/validation.test.ts`)

Tests for Zod schema validation:

- ✅ Registration schema (email, password, name)
- ✅ Login schema
- ✅ Project creation schema
- ✅ Environment creation schema
- ✅ Variable creation schema (KEY format: `^[A-Z0-9_]+$`)
- ✅ Variable update schema
- ✅ Edge cases (empty strings, too long, invalid formats)

**Critical**: These tests ensure input validation prevents injection attacks and data corruption.

## Writing New Tests

### Unit Test Template

```typescript
import { myFunction } from '../myModule';

describe('My Module', () => {
  describe('myFunction', () => {
    it('should do something correctly', () => {
      const input = 'test';
      const result = myFunction(input);
      expect(result).toBe('expected-output');
    });

    it('should handle edge cases', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

### Component Test Template

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const { user } = render(<MyComponent />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

## Test Environment

- **Environment**: `jest-environment-jsdom` (for React components)
- **Setup File**: `jest.setup.js` (mocks environment variables)
- **Module Mapping**: `@/` maps to project root

### Environment Variables (Test)

```javascript
// jest.setup.js
process.env.ENCRYPTION_KEY = '64-hex-character-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
```

## Best Practices

### ✅ DO

- **Test public interfaces** (functions, components)
- **Use descriptive test names** (`it('should reject invalid email')`)
- **Test edge cases** (null, undefined, empty, very long)
- **Test error handling** (throw, reject, error messages)
- **Mock external dependencies** (database, APIs)
- **Test security-critical code** (encryption, auth, permissions)

### ❌ DON'T

- **Test implementation details** (private functions, internal state)
- **Test third-party libraries** (assume they work)
- **Write brittle tests** (over-mocking, snapshot abuse)
- **Ignore edge cases** (always test boundaries)
- **Skip error paths** (test both success and failure)

## Debugging Tests

```bash
# Run specific test file
npm test -- encryption.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="encrypt"

# Run tests with verbose output
npm test -- --verbose

# Update snapshots (if using)
npm test -- -u
```

## CI/CD Integration

Tests run automatically in CI via:

```bash
npm run test:ci
```

This command:
- Runs all tests once (no watch mode)
- Generates coverage report
- Exits with non-zero code if tests fail

## Coverage Report

After running `npm run test:coverage`, view the HTML report:

```bash
open coverage/lcov-report/index.html
```

Coverage thresholds are defined in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

## Troubleshooting

### "Cannot find module '@/lib/...'"

Make sure `jest.config.js` has correct module mapping:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### "ReferenceError: TextEncoder is not defined"

Add to `jest.setup.js`:

```javascript
global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;
```

### Database Connection Errors

Mock Prisma in tests:

```typescript
jest.mock('@/lib/db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}));
```

## Next Steps

### Expand Test Coverage

1. **API Route Tests**: Test Next.js API handlers
2. **Integration Tests**: Test full request/response flows
3. **E2E Tests**: Add Playwright for browser testing
4. **Component Tests**: Test React components with RTL

### Example Priorities

- [ ] Test rate limiting middleware
- [ ] Test authentication middleware
- [ ] Test variable encryption in API routes
- [ ] Test RBAC enforcement in API routes
- [ ] Test CLI commands (unit)
- [ ] Test React components (dashboard, forms)

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated**: October 30, 2025  
**Maintainer**: EnvShield Team
