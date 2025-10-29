import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { compare, hash } from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/db';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tokenName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const parsed = bodySchema.parse(data);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await compare(parsed.password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate API token with esh_ prefix
    const tokenPlain = 'esh_' + crypto.randomBytes(24).toString('hex');
    const tokenHash = await hash(tokenPlain, 12);

    // Set expiration to 1 year from now
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create token in database
    await prisma.apiToken.create({
      data: {
        userId: user.id,
        token: tokenHash,
        name: parsed.tokenName ?? 'CLI Token',
        expiresAt,
      },
    });

    return NextResponse.json({
      token: tokenPlain,
      expiresAt: expiresAt.toISOString(),
      message: 'Authentication successful',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid request data', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('CLI auth error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
