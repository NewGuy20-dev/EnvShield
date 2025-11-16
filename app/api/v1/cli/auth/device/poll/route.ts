import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/db'
import { applyRateLimit, cliLimiter, getClientIdentifier } from '@/lib/rateLimit'
import { handleApiError } from '@/lib/errors'
import { decryptFromStorage } from '@/lib/encryption'

const pollSchema = z.object({
  deviceCode: z.string().min(1),
})

export async function GET(req: NextRequest) {
  try {
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

    const url = new URL(req.url)
    const { deviceCode } = pollSchema.parse({
      deviceCode: url.searchParams.get('deviceCode'),
    })

    const session = await prisma.cliDeviceSession.findUnique({
      where: { deviceCode },
    })

    if (!session) {
      return NextResponse.json(
        { status: 'expired', message: 'Session not found or expired' },
        { status: 410 }
      )
    }

    const now = new Date()
    if (
      session.expiresAt <= now ||
      ['EXPIRED', 'CONSUMED', 'CANCELLED'].includes(session.status)
    ) {
      if (!['EXPIRED', 'CONSUMED', 'CANCELLED'].includes(session.status)) {
        await prisma.cliDeviceSession.update({
          where: { id: session.id },
          data: { status: 'EXPIRED' },
        })
      }
      return NextResponse.json(
        { status: 'expired', message: 'Session expired' },
        { status: 410 }
      )
    }

    if (session.status === 'PENDING') {
      return NextResponse.json({ status: 'pending' })
    }

    if (session.status === 'APPROVED') {
      if (!session.encryptedToken || !session.tokenId) {
        return NextResponse.json({ status: 'pending' })
      }

      const tokenPlain = decryptFromStorage(session.encryptedToken)

      const token = await prisma.apiToken.findUnique({
        where: { id: session.tokenId },
        select: { expiresAt: true },
      })

      await prisma.cliDeviceSession.update({
        where: { id: session.id },
        data: {
          status: 'CONSUMED',
          encryptedToken: null,
          consumedAt: new Date(),
        },
      })

      return NextResponse.json({
        status: 'approved',
        token: tokenPlain,
        tokenId: session.tokenId,
        tokenName: session.tokenName,
        expiresAt: token?.expiresAt?.toISOString(),
      })
    }

    return NextResponse.json({ status: 'pending' })
  } catch (error) {
    return handleApiError(error)
  }
}