/**
 * Health Check Endpoint
 * 
 * Returns the health status of critical system components:
 * - Database connection
 * - Encryption system
 * - Overall system health
 * 
 * Returns 200 if healthy, 503 if any component is unhealthy
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { encrypt, decrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'ok' | 'error';
  message?: string;
  duration?: number;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database: HealthCheck;
    encryption: HealthCheck;
    system: HealthCheck;
  };
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Simple query to verify database connection
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'ok',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Database check failed',
      duration: Date.now() - start,
    };
  }
}

async function checkEncryption(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    // Test encryption/decryption cycle
    const testData = 'health-check-test-data';
    const encrypted = encrypt(testData);
    const decrypted = decrypt(encrypted);
    
    if (decrypted !== testData) {
      throw new Error('Encryption verification failed');
    }
    
    return {
      status: 'ok',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Encryption check failed',
      duration: Date.now() - start,
    };
  }
}

function checkSystem(): HealthCheck {
  const start = Date.now();
  try {
    // Check critical environment variables
    const requiredEnvVars = ['DATABASE_URL', 'ENCRYPTION_KEY', 'JWT_SECRET'];
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      return {
        status: 'error',
        message: `Missing environment variables: ${missing.join(', ')}`,
        duration: Date.now() - start,
      };
    }
    
    // Check memory usage (warn if over 90%)
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
    
    if (heapUsedPercent > 90) {
      return {
        status: 'error',
        message: `High memory usage: ${heapUsedPercent.toFixed(2)}%`,
        duration: Date.now() - start,
      };
    }
    
    return {
      status: 'ok',
      duration: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'System check failed',
      duration: Date.now() - start,
    };
  }
}

export async function GET(req: NextRequest) {
  try {
    const healthToken = process.env.HEALTHCHECK_TOKEN;
    const authHeader = req.headers.get('authorization');
    const hasElevatedAccess = Boolean(
      healthToken && authHeader === `Bearer ${healthToken}`
    );

    // Run all health checks in parallel
    const [database, encryption, system] = await Promise.all([
      checkDatabase(),
      checkEncryption(),
      checkSystem(),
    ]);
    
    const checks = { database, encryption, system };
    const isHealthy = Object.values(checks).every(check => check.status === 'ok');
    
    const response: Partial<HealthResponse> = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      ...(hasElevatedAccess ? { checks } : {}),
    };

    return NextResponse.json(response, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}
