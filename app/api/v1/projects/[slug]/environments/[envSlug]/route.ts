import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getAuthenticatedUserFromRequest } from "@/lib/authMiddleware";
import { canViewDecryptedVariables } from "@/lib/permissions";
import { decryptFromStorage } from "@/lib/encryption";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string; envSlug: string }> }
) {
  try {
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const params = await context.params;

    // Find project and check membership
    const project = await prisma.project.findUnique({
      where: { slug: params.slug },
      include: {
        members: {
          where: { userId: auth.user.id },
        },
        environments: {
          where: { slug: params.envSlug },
          include: {
            variables: {
              orderBy: { key: 'asc' },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const member = project.members[0];
    if (!member) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const environment = project.environments[0];
    if (!environment) {
      return NextResponse.json({ message: "Environment not found" }, { status: 404 });
    }

    // Check if user has permission to view decrypted variables
    const canViewDecrypted = canViewDecryptedVariables(member.role);

    const variables = environment.variables.map((v) => {
      let value = v.value;
      let decrypted = '';
      let error = null;

      // Try to decrypt
      try {
        decrypted = decryptFromStorage(v.value);
      } catch (err) {
        logger.error({ error: err, variableKey: v.key }, `Failed to decrypt variable`);
        error = 'Decryption failed';
      }

      // Mask value if user doesn't have permission to view decrypted
      if (!canViewDecrypted && !error) {
        if (decrypted.length <= 4) {
          value = '••••';
        } else {
          // Show first 2 and last 2 characters
          value = `${decrypted.substring(0, 2)}${'•'.repeat(Math.min(8, decrypted.length - 4))}${decrypted.substring(decrypted.length - 2)}`;
        }
      } else {
        value = decrypted;
      }

      return {
        id: v.id,
        key: v.key,
        value: error ? '' : value,
        description: v.description,
        updatedAt: v.updatedAt.toISOString(),
        error: error,
        masked: !canViewDecrypted && !error,
      };
    });

    return NextResponse.json({
      variables,
      canViewDecrypted,
      environment: {
        id: environment.id,
        name: environment.name,
        slug: environment.slug,
        description: environment.description,
      },
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
      },
    });
  } catch (error) {
    logger.error({ error }, "Get variables error");
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
