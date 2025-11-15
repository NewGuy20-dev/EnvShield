/**
 * Weekly Audit Digest Script
 * 
 * Sends a weekly summary of project activity to project owners and admins.
 * Can be run manually or scheduled via cron/GitHub Actions.
 * 
 * Usage:
 *   npx tsx scripts/send-weekly-digest.ts --project <slug>  # For specific project
 *   npx tsx scripts/send-weekly-digest.ts --all             # For all projects
 *   npx tsx scripts/send-weekly-digest.ts --dry-run         # Preview without sending
 */

import { Command } from 'commander';
import prisma from '../lib/db';
import { sendAuditDigestEmail } from '../lib/email';
import { logger } from '../lib/logger';

interface DigestStats {
  variableChanges: number;
  newMembers: number;
  loginAttempts: number;
  topUsers: Array<{ name: string; actions: number }>;
  totalActions: number;
}

interface ProjectDigest {
  projectId: string;
  projectName: string;
  projectSlug: string;
  stats: DigestStats;
  recipients: Array<{ email: string; name: string | null }>;
}

const SEVEN_DAYS_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

/**
 * Generate digest statistics for a project
 */
async function generateProjectStats(projectId: string): Promise<DigestStats> {
  // Get audit logs for the last 7 days
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      projectId,
      createdAt: {
        gte: SEVEN_DAYS_AGO,
      },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Count variable changes (create, update, delete actions on variables)
  const variableChanges = auditLogs.filter((log) =>
    log.entityType === 'variable' &&
    ['create', 'update', 'delete'].includes(log.action)
  ).length;

  // Count new members added
  const newMembers = auditLogs.filter((log) =>
    log.entityType === 'project_member' && log.action === 'create'
  ).length;

  // Count login attempts (from security logs, approximate)
  const loginAttempts = auditLogs.filter((log) =>
    log.action === 'login' || log.action === 'session_created'
  ).length;

  // Calculate top users by action count
  const userActions = new Map<string, { name: string; count: number }>();
  auditLogs.forEach((log) => {
    const userName = log.user.name || log.user.email;
    const current = userActions.get(userName) || { name: userName, count: 0 };
    userActions.set(userName, { ...current, count: current.count + 1 });
  });

  const topUsers = Array.from(userActions.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ name, count }) => ({ name, actions: count }));

  return {
    variableChanges,
    newMembers,
    loginAttempts,
    topUsers,
    totalActions: auditLogs.length,
  };
}

/**
 * Get project owners and admins who should receive the digest
 */
async function getDigestRecipients(projectId: string) {
  const members = await prisma.projectMember.findMany({
    where: {
      projectId,
      role: {
        in: ['OWNER', 'ADMIN'],
      },
    },
    include: {
      user: {
        select: {
          email: true,
          name: true,
          emailVerified: true,
        },
      },
    },
  });

  return members
    .filter((member) => member.user.emailVerified)
    .map((member) => ({
      email: member.user.email,
      name: member.user.name,
    }));
}

/**
 * Generate digest for a single project
 */
async function generateProjectDigest(projectId: string): Promise<ProjectDigest | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!project) {
    logger.warn({ projectId }, 'Project not found');
    return null;
  }

  const stats = await generateProjectStats(projectId);
  const recipients = await getDigestRecipients(projectId);

  if (recipients.length === 0) {
    logger.info({ projectId, projectName: project.name }, 'No verified recipients for digest');
    return null;
  }

  return {
    projectId: project.id,
    projectName: project.name,
    projectSlug: project.slug,
    stats,
    recipients,
  };
}

/**
 * Send digest email to recipients
 */
async function sendDigest(digest: ProjectDigest, dryRun: boolean): Promise<void> {
  logger.info(
    {
      project: digest.projectName,
      recipients: digest.recipients.length,
      stats: digest.stats,
    },
    'Sending weekly digest'
  );

  if (dryRun) {
    console.log('\n========================================');
    console.log(`Project: ${digest.projectName}`);
    console.log(`Recipients: ${digest.recipients.map(r => r.email).join(', ')}`);
    console.log(`Stats:`);
    console.log(`  - Total Actions: ${digest.stats.totalActions}`);
    console.log(`  - Variable Changes: ${digest.stats.variableChanges}`);
    console.log(`  - New Members: ${digest.stats.newMembers}`);
    console.log(`  - Login Attempts: ${digest.stats.loginAttempts}`);
    if (digest.stats.topUsers.length > 0) {
      console.log(`  - Top Users:`);
      digest.stats.topUsers.forEach(u => {
        console.log(`    • ${u.name}: ${u.actions} actions`);
      });
    }
    console.log('========================================\n');
    return;
  }

  // Send email to each recipient
  for (const recipient of digest.recipients) {
    try {
      await sendAuditDigestEmail(
        recipient.email,
        digest.projectName,
        {
          variableChanges: digest.stats.variableChanges,
          newMembers: digest.stats.newMembers,
          loginAttempts: digest.stats.loginAttempts,
        },
        recipient.name || undefined
      );

      logger.info(
        { email: recipient.email, project: digest.projectName },
        'Digest email sent successfully'
      );
    } catch (error) {
      logger.error(
        { error, email: recipient.email, project: digest.projectName },
        'Failed to send digest email'
      );
    }
  }

  // Update project's digestSentAt timestamp (if we add this field)
  // await prisma.project.update({
  //   where: { id: digest.projectId },
  //   data: { digestSentAt: new Date() },
  // });
}

/**
 * Main execution function
 */
async function main() {
  const program = new Command();

  program
    .name('send-weekly-digest')
    .description('Send weekly audit digest emails to project owners and admins')
    .option('-p, --project <slug>', 'Send digest for specific project by slug')
    .option('-a, --all', 'Send digest for all projects')
    .option('-d, --dry-run', 'Preview digests without sending emails')
    .parse(process.argv);

  const options = program.opts();

  if (!options.project && !options.all) {
    console.error('Error: Must specify either --project <slug> or --all');
    process.exit(1);
  }

  const dryRun = options.dryRun || false;

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No emails will be sent\n');
  }

  try {
    let projectIds: string[] = [];

    if (options.project) {
      // Single project by slug
      const project = await prisma.project.findUnique({
        where: { slug: options.project },
        select: { id: true },
      });

      if (!project) {
        console.error(`Error: Project with slug "${options.project}" not found`);
        process.exit(1);
      }

      projectIds = [project.id];
      logger.info({ slug: options.project }, 'Processing single project');
    } else {
      // All projects
      const projects = await prisma.project.findMany({
        select: { id: true },
      });
      projectIds = projects.map(p => p.id);
      logger.info({ count: projectIds.length }, 'Processing all projects');
    }

    let sentCount = 0;
    let skippedCount = 0;

    for (const projectId of projectIds) {
      const digest = await generateProjectDigest(projectId);
      
      if (!digest) {
        skippedCount++;
        continue;
      }

      // Skip projects with no activity
      if (digest.stats.totalActions === 0) {
        logger.info({ project: digest.projectName }, 'Skipping project with no activity');
        skippedCount++;
        continue;
      }

      await sendDigest(digest, dryRun);
      sentCount++;

      // Add delay to avoid rate limiting (100ms between emails)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n✅ Digest generation complete');
    console.log(`   Sent: ${sentCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    
    if (!process.env.RESEND_API_KEY && !dryRun) {
      console.warn('\n⚠️  Warning: RESEND_API_KEY not configured. Emails were logged but not sent.');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to send weekly digests');
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
