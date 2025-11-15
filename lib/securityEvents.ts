import prisma from './db';
import { sendSecurityAlertEmail } from './email';
import { logger } from './logger';

const ALERT_COOLDOWN_HOURS = 6;

export type SecurityEventType =
  | 'failed_logins'
  | 'password_reset'
  | 'password_reset_success'
  | 'two_factor_disabled'
  | 'cli_token_created'
  | 'new_session';

export interface SecurityAlertOptions {
  userId: string;
  type: SecurityEventType;
  metadata?: Record<string, any>;
}

export async function queueSecurityAlert({ userId, type, metadata }: SecurityAlertOptions) {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - ALERT_COOLDOWN_HOURS * 60 * 60 * 1000);

    const lastAlert = await prisma.securityAlert.findFirst({
      where: {
        userId,
        type,
        createdAt: { gt: cutoff },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastAlert) {
      return;
    }

    await prisma.securityAlert.create({
      data: {
        userId,
        type,
        metadata,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user?.email) {
      return;
    }

    const details = buildAlertDetails(type, metadata);
    await sendSecurityAlertEmail(user.email, formatAlertType(type), details, user.name || undefined);
  } catch (error) {
    logger.error({ error, userId, type }, 'Failed to queue security alert');
  }
}

function buildAlertDetails(type: SecurityEventType, metadata?: Record<string, any>) {
  switch (type) {
    case 'failed_logins':
      return `Multiple failed login attempts detected from IP ${metadata?.ip || 'unknown'}.`;
    case 'password_reset':
      return `A password reset was requested for your account. If this wasn't you, change your password immediately.`;
    case 'password_reset_success':
      return `Your password was successfully reset. If you didn't perform this action, secure your account now.`;
    case 'two_factor_disabled':
      return `Two-factor authentication was disabled on your account. Consider re-enabling it to keep your account secure.`;
    case 'cli_token_created':
      return `A new CLI token (${metadata?.tokenName || 'unnamed'}) was created from IP ${metadata?.ip || 'unknown'}.`;
    case 'new_session':
      return `A new device signed in: ${metadata?.userAgent || 'Unknown device'} from IP ${metadata?.ip || 'unknown'}.`;
    default:
      return 'Suspicious activity detected on your account.';
  }
}

function formatAlertType(type: SecurityEventType) {
  switch (type) {
    case 'failed_logins':
      return 'Multiple Failed Logins';
    case 'password_reset':
      return 'Password Reset Requested';
    case 'password_reset_success':
      return 'Password Reset Successful';
    case 'two_factor_disabled':
      return 'Two-Factor Authentication Disabled';
    case 'cli_token_created':
      return 'New CLI Token Created';
    case 'new_session':
      return 'New Device Signed In';
    default:
      return 'Security Alert';
  }
}
