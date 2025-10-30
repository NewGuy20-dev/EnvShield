/**
 * Webhooks System
 * 
 * Sends HTTP callbacks to registered endpoints when events occur
 */

import { createHmac } from 'crypto';
import { logger } from './logger';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: any;
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: string[];
  headers?: Record<string, string>;
  retryAttempts?: number;
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Send webhook with retry logic
 */
export async function sendWebhook(
  config: WebhookConfig,
  payload: WebhookPayload,
  attempt: number = 1
): Promise<{ success: boolean; response?: any; error?: any }> {
  const maxAttempts = config.retryAttempts || 3;
  
  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, config.secret);
    
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-EnvShield-Signature': signature,
        'X-EnvShield-Event': payload.event,
        'X-EnvShield-Timestamp': payload.timestamp,
        'User-Agent': 'EnvShield-Webhooks/1.0',
        ...config.headers,
      },
      body: payloadString,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    logger.info(
      {
        event: payload.event,
        url: config.url,
        status: response.status,
        attempt,
      },
      'Webhook delivered successfully'
    );

    return {
      success: true,
      response: {
        status: response.status,
        statusText: response.statusText,
      },
    };
  } catch (error) {
    logger.error(
      {
        event: payload.event,
        url: config.url,
        error,
        attempt,
        maxAttempts,
      },
      'Webhook delivery failed'
    );

    // Retry with exponential backoff
    if (attempt < maxAttempts) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
      logger.info({ delay, attempt: attempt + 1 }, 'Retrying webhook delivery');
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return sendWebhook(config, payload, attempt + 1);
    }

    return {
      success: false,
      error,
    };
  }
}

/**
 * Webhook events
 */
export const WebhookEvents = {
  // Variable events
  VARIABLE_CREATED: 'variable.created',
  VARIABLE_UPDATED: 'variable.updated',
  VARIABLE_DELETED: 'variable.deleted',
  
  // Project events
  PROJECT_CREATED: 'project.created',
  PROJECT_UPDATED: 'project.updated',
  PROJECT_DELETED: 'project.deleted',
  
  // Environment events
  ENVIRONMENT_CREATED: 'environment.created',
  ENVIRONMENT_UPDATED: 'environment.updated',
  ENVIRONMENT_DELETED: 'environment.deleted',
  
  // Member events
  MEMBER_INVITED: 'member.invited',
  MEMBER_JOINED: 'member.joined',
  MEMBER_REMOVED: 'member.removed',
  MEMBER_ROLE_CHANGED: 'member.role_changed',
  
  // Security events
  LOGIN_FAILED: 'security.login_failed',
  TOKEN_CREATED: 'security.token_created',
  TOKEN_REVOKED: 'security.token_revoked',
  PASSWORD_CHANGED: 'security.password_changed',
};

/**
 * Trigger webhook for registered events
 */
export async function triggerWebhook(
  webhooks: WebhookConfig[],
  event: string,
  data: any
) {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const relevantWebhooks = webhooks.filter(webhook =>
    webhook.events.includes(event) || webhook.events.includes('*')
  );

  if (relevantWebhooks.length === 0) {
    logger.debug({ event }, 'No webhooks registered for event');
    return;
  }

  logger.info(
    { event, webhookCount: relevantWebhooks.length },
    'Triggering webhooks'
  );

  // Send webhooks in parallel
  const results = await Promise.allSettled(
    relevantWebhooks.map(webhook => sendWebhook(webhook, payload))
  );

  const successCount = results.filter(
    r => r.status === 'fulfilled' && r.value.success
  ).length;
  const failureCount = results.length - successCount;

  logger.info(
    { event, total: results.length, success: successCount, failed: failureCount },
    'Webhook delivery complete'
  );
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  
  // Use constant-time comparison to prevent timing attacks
  return timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  
  return result === 0;
}
