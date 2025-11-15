/**
 * Email Service with Resend
 * 
 * Handles all email sending functionality including:
 * - Email verification
 * - Password reset
 * - Team invitations
 * - Security alerts
 */

import { Resend } from 'resend';
import { logger } from './logger';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'EnvShield <noreply@envshield.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Resend
 */
async function sendEmail({ to, subject, html, text }: EmailOptions) {
  if (!resend) {
    logger.warn({ to, subject }, 'Resend not configured, email would have been sent');
    return { success: false, message: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    logger.info({ to, subject, id: result.data?.id }, 'Email sent successfully');
    return { success: true, id: result.data?.id };
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to send email');
    return { success: false, error };
  }
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Send email verification code
 */
export async function sendVerificationEmail(email: string, code: string, name?: string) {
  const subject = 'Verify your EnvShield account';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .code { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 EnvShield</h1>
            <p>Verify Your Email Address</p>
          </div>
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>Thanks for signing up for EnvShield! To complete your registration, please verify your email address by entering this code:</p>
            <div class="code">${code}</div>
            <p>Or click the button below:</p>
            <a href="${APP_URL}/verify-email?code=${code}" class="button">Verify Email</a>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>EnvShield - Secure Environment Variable Management</p>
            <p>&copy; ${new Date().getFullYear()} EnvShield. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string, name?: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  const subject = 'Reset your EnvShield password';
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 EnvShield</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>We received a request to reset your EnvShield password. Click the button below to reset it:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <p>This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you're concerned about your account's security.</p>
            </div>
            <p>For security reasons, we'll never ask you for your password via email.</p>
          </div>
          <div class="footer">
            <p>EnvShield - Secure Environment Variable Management</p>
            <p>&copy; ${new Date().getFullYear()} EnvShield. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send project invitation email
 */
export async function sendProjectInviteEmail(
  email: string,
  inviterName: string,
  projectName: string,
  role: string,
  inviteUrl: string
) {
  const subject = `You've been invited to join ${projectName} on EnvShield`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .info-box { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 EnvShield</h1>
            <p>Project Invitation</p>
          </div>
          <div class="content">
            <p>Hi there,</p>
            <p><strong>${inviterName}</strong> has invited you to join the project <strong>${projectName}</strong> on EnvShield.</p>
            <div class="info-box">
              <p><strong>Project:</strong> ${projectName}</p>
              <p><strong>Your Role:</strong> ${role}</p>
              <p><strong>Invited by:</strong> ${inviterName}</p>
            </div>
            <p>Click the button below to accept the invitation:</p>
            <a href="${inviteUrl}" class="button">Accept Invitation</a>
            <p>Or copy and paste this link:</p>
            <p style="word-break: break-all; color: #667eea;">${inviteUrl}</p>
            <p>This invitation will expire in 7 days.</p>
          </div>
          <div class="footer">
            <p>EnvShield - Secure Environment Variable Management</p>
            <p>&copy; ${new Date().getFullYear()} EnvShield. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send team invitation email (legacy)
 */
export async function sendTeamInvitationEmail(
  email: string,
  inviterName: string,
  projectName: string,
  role: string,
  inviteToken: string
) {
  const inviteUrl = `${APP_URL}/invites/${inviteToken}/accept`;
  return sendProjectInviteEmail(email, inviterName, projectName, role, inviteUrl);
}

/**
 * Send security alert email
 */
export async function sendSecurityAlertEmail(
  email: string,
  alertType: string,
  details: string,
  name?: string
) {
  const subject = `Security Alert: ${alertType}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Security Alert</h1>
            <p>${alertType}</p>
          </div>
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>We detected unusual activity on your EnvShield account:</p>
            <div class="alert">
              <strong>${details}</strong>
            </div>
            <p>If this was you, no action is needed. If you don't recognize this activity, we recommend:</p>
            <ul>
              <li>Change your password immediately</li>
              <li>Review your active sessions</li>
              <li>Enable two-factor authentication</li>
              <li>Contact support if you need assistance</li>
            </ul>
            <a href="${APP_URL}/settings/security" class="button">Review Security Settings</a>
          </div>
          <div class="footer">
            <p>EnvShield - Secure Environment Variable Management</p>
            <p>&copy; ${new Date().getFullYear()} EnvShield. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send weekly audit digest email
 */
export async function sendAuditDigestEmail(
  email: string,
  projectName: string,
  stats: {
    variableChanges: number;
    newMembers: number;
    loginAttempts: number;
  },
  name?: string
) {
  const subject = `Weekly Activity Digest for ${projectName}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .stats { display: flex; justify-content: space-around; margin: 30px 0; }
          .stat { text-align: center; background: white; padding: 20px; border-radius: 8px; flex: 1; margin: 0 10px; }
          .stat-number { font-size: 32px; font-weight: bold; color: #6366f1; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Weekly Activity Digest</h1>
            <p>${projectName}</p>
          </div>
          <div class="content">
            <p>Hi ${name || 'there'},</p>
            <p>Here's a summary of activity in <strong>${projectName}</strong> over the past week:</p>
            <div class="stats">
              <div class="stat">
                <div class="stat-number">${stats.variableChanges}</div>
                <div>Variable Changes</div>
              </div>
              <div class="stat">
                <div class="stat-number">${stats.newMembers}</div>
                <div>New Members</div>
              </div>
              <div class="stat">
                <div class="stat-number">${stats.loginAttempts}</div>
                <div>Login Attempts</div>
              </div>
            </div>
            <p>View detailed audit logs for more information:</p>
            <a href="${APP_URL}/projects/${projectName}/audit" class="button">View Audit Logs</a>
          </div>
          <div class="footer">
            <p>EnvShield - Secure Environment Variable Management</p>
            <p>To unsubscribe from these emails, update your notification preferences</p>
            <p>&copy; ${new Date().getFullYear()} EnvShield. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}
