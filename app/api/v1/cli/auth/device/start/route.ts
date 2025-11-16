import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import prisma from '@/lib/db'
import { applyRateLimit, cliLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { handleApiError } from '@/lib/errors'
import { logSecurityEvent } from '@/lib/logger'

const startSchema = z.object({
  tokenName: z.string().max(128).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const identifier = getClientIdentifier(req)
    const rate = await applyRateLimit(identifier, cliLimiter, 30, 60 * 1000)
    if (!rate.success) {
      logSecurityEvent('cli_rate_limit_exceeded', 'medium', {
        identifier,
        endpoint: '/api/v1/cli/auth/device/start',
      })
      return NextResponse.json(
        {
          error: 'Too many CLI authentication attempts',
          message: 'Please try again in a minute',
        },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = startSchema.parse(body)

    const deviceCode = crypto.randomBytes(24).toString('hex')
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000)

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verificationUrl = `${baseUrl}/cli/login?code=${encodeURIComponent(deviceCode)}`

    await prisma.cliDeviceSession.create({
      data: {
        deviceCode,
        userCode: null,
        status: 'PENDING',
        expiresAt,
        clientIp: identifier,
        userAgent: req.headers.get('user-agent') || null,
        tokenName: parsed.tokenName ?? 'CLI Token',
      },
    })

    logSecurityEvent('cli_device_start', 'low', {
      deviceCode,
      ip: identifier,
    })

    return NextResponse.json({
      deviceCode,
      verificationUrl,
      expiresAt: expiresAt.toISOString(),
      pollInterval: 5,
      tokenName: parsed.tokenName ?? 'CLI Token',
    })
  } catch (error) {
    return handleApiError(error)
  }
}