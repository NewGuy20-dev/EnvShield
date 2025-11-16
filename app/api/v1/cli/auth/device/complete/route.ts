import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import crypto from 'crypto'
import { hash } from 'bcryptjs'
import { applyRateLimit, cliLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { handleApiError, AuthError, ValidationError } from '@/lib/errors'
import { logSecurityEvent } from '@/lib/logger'
import { MAX_API_TOKENS_PER_USER } from '@/lib/constants'
import { queueSecurityAlert } from '@/lib/securityEvents'
import { encryptForStorage } from '@/lib/encryption'
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware'

const completeSchema = z.object({
  deviceCode: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUserFromRequest(req)
    if (!authResult || authResult.authMethod !== 'session') {
      throw new AuthError('Authentication required')
    }
    const userId = authResult.user.id

    const identifier = getClientIdentifier(req)
    const rate = await applyRateLimit(identifier, cliLimiter, 60, 60 * 1000)
    if (!rate.success) {
      return NextResponse.json(
        {
          error: 'Too many CLI authentication attempts',
          message: 'Please try again in a minute',
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { deviceCode } = completeSchema.parse(body)

    const session = await prisma.cliDeviceSession.findUnique({
      where: { deviceCode },
    })
    if (!session) {
      throw new ValidationError('Device session not found')
    }

    const now = new Date()
    if (
      session.expiresAt <= now ||
      ['EXPIRED', 'CONSUMED', 'CANCELLED'].includes(session.status)
    ) {
      throw new ValidationError('Device session expired')
    }

    if (session.status === 'APPROVED' && session.tokenId) {
      return NextResponse.json({
        status: 'ok',
        message: 'CLI login already approved.',
      })
    }

    const tokenPlain = 'esh_' + crypto.randomBytes(24).toString('hex')
    const tokenDigest = crypto.createHash('sha256').update(tokenPlain).digest('hex')
    const tokenHash = await hash(tokenPlain, 12)

    const activeTokens = await prisma.apiToken.count({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    })
    if (activeTokens >= MAX_API_TOKENS_PER_USER) {
      throw new ValidationError(
        `You already have ${MAX_API_TOKENS_PER_USER} active tokens. Revoke an existing token first.`
      )
    }

    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const token = await prisma.apiToken.create({
      data: {
        userId,
        tokenDigest,
        tokenHash,
        name: session.tokenName ?? 'CLI Token',
        expiresAt,
      },
    })

    const encryptedToken = encryptForStorage(tokenPlain)

    await prisma.cliDeviceSession.update({
      where: { id: session.id },
      data: {
        status: 'APPROVED',
        userId,
        tokenId: token.id,
        tokenName: token.name ?? 'CLI Token',
        encryptedToken,
        approvedAt: new Date(),
      },
    })

    logSecurityEvent('cli_device_approved', 'medium', {
      userId,
      deviceCode,
    })

    await queueSecurityAlert({
      userId,
      type: 'cli_token_created',
      metadata: {
        tokenName: token.name ?? 'CLI Token',
        ip: identifier,
      },
    })

    return NextResponse.json({
      status: 'ok',
      message: 'CLI login approved. You can return to your terminal.',
    })
  } catch (error) {
    return handleApiError(error)
  }
}