/**
 * Unit tests for security events and alerts
 */

import prisma from '../db';
import { sendSecurityAlertEmail } from '../email';
import { queueSecurityAlert } from '../securityEvents';

jest.mock('../db', () => {
  const securityAlert = {
    findFirst: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'alert-1' }),
  };

  const user = {
    findUnique: jest.fn().mockResolvedValue({
      email: 'user@example.com',
      name: 'Test User',
    }),
  };

  return {
    __esModule: true,
    default: {
      securityAlert,
      user,
    },
  };
});

jest.mock('../email', () => ({
  __esModule: true,
  sendSecurityAlertEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('securityEvents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should queue and send an oauth_unlinked security alert with correct details', async () => {
    await queueSecurityAlert({
      userId: 'user-1',
      type: 'oauth_unlinked',
      metadata: {
        provider: 'github',
        ip: '203.0.113.10',
      },
    });

    const prismaAny = prisma as any;
    const sendEmail = sendSecurityAlertEmail as jest.Mock;

    // Should create a new SecurityAlert record
    expect(prismaAny.securityAlert.create).toHaveBeenCalledTimes(1);
    expect(prismaAny.securityAlert.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        type: 'oauth_unlinked',
      }),
    });

    // Should load the user to send an email
    expect(prismaAny.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { email: true, name: true },
    });

    // Should send an email with the new alert type and details
    expect(sendEmail).toHaveBeenCalledTimes(1);
    const [email, subject, body] = sendEmail.mock.calls[0];

    expect(email).toBe('user@example.com');
    expect(subject).toBe('OAuth Account Unlinked');
    expect(body).toContain('github');
    expect(body).toContain('203.0.113.10');
  });
});
