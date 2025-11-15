/**
 * Variable Search API Route
 * GET - Search variables across projects with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUserFromRequest } from '@/lib/authMiddleware';
import { canViewDecryptedVariables } from '@/lib/permissions';
import { handleApiError, PermissionError } from '@/lib/errors';
import { decryptFromStorage } from '@/lib/encryption';
import { z } from 'zod';

const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  projectId: z.string().optional(),
  environmentId: z.string().optional(),
  role: z.enum(['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']).optional(),
  updatedBy: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  decrypt: z.string().transform(val => val === 'true').optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 50, 100)).optional(),
});

interface SearchResult {
  id: string;
  key: string;
  value: string;
  description?: string;
  environment: {
    id: string;
    name: string;
    slug: string;
  };
  project: {
    id: string;
    name: string;
    slug: string;
  };
  updatedAt: Date;
  canDecrypt: boolean;
}

interface Facet {
  projects: Array<{ id: string; name: string; count: number }>;
  environments: Array<{ id: string; name: string; count: number }>;
  roles: Array<{ role: string; count: number }>;
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const auth = await getAuthenticatedUserFromRequest(req);
    if (!auth) {
      throw new PermissionError('Authentication required');
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const params = searchQuerySchema.parse({
      q: searchParams.get('q'),
      projectId: searchParams.get('projectId'),
      environmentId: searchParams.get('environmentId'),
      role: searchParams.get('role'),
      updatedBy: searchParams.get('updatedBy'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      decrypt: searchParams.get('decrypt'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    // Get all projects user has access to
    const userProjects = await prisma.projectMember.findMany({
      where: { userId: auth.user.id },
      select: {
        projectId: true,
        role: true,
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (userProjects.length === 0) {
      return NextResponse.json({
        results: [],
        facets: {
          projects: [],
          environments: [],
          roles: [],
        },
        pagination: {
          page: 1,
          limit: params.limit || 50,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Build project filter
    const projectIds = params.projectId
      ? [params.projectId]
      : userProjects.map(m => m.projectId);

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (params.dateFrom) {
      dateFilter.gte = new Date(params.dateFrom);
    }
    if (params.dateTo) {
      dateFilter.lte = new Date(params.dateTo);
    }

    // Build WHERE clause
    const whereClause: any = {
      environment: {
        projectId: { in: projectIds },
      },
      OR: [
        {
          key: {
            contains: params.q,
            mode: 'insensitive' as const,
          },
        },
        {
          description: {
            contains: params.q,
            mode: 'insensitive' as const,
          },
        },
      ],
    };

    if (params.environmentId) {
      whereClause.environmentId = params.environmentId;
    }

    if (Object.keys(dateFilter).length > 0) {
      whereClause.updatedAt = dateFilter;
    }

    // Get total count
    const totalCount = await prisma.variable.count({
      where: whereClause,
    });

    // Calculate pagination
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch variables with related data
    const variables = await prisma.variable.findMany({
      where: whereClause,
      include: {
        environment: {
          select: {
            id: true,
            name: true,
            slug: true,
            project: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Process results and check permissions
    const results: SearchResult[] = [];
    const projectRoleMap = new Map(
      userProjects.map(m => [m.projectId, m.role])
    );

    for (const variable of variables) {
      const projectRole = projectRoleMap.get(variable.environment.project.id);
      const canDecrypt = projectRole ? canViewDecryptedVariables(projectRole) : false;

      let value = '••••••••'; // Default masked
      if (params.decrypt && canDecrypt) {
        try {
          value = decryptFromStorage(variable.value);
        } catch (error) {
          value = '[Decryption failed]';
        }
      } else if (canDecrypt) {
        // Show partial value
        try {
          const decrypted = decryptFromStorage(variable.value);
          value = decrypted.length > 20 ? `${decrypted.slice(0, 20)}...` : decrypted;
        } catch {
          value = '[Error]';
        }
      }

      results.push({
        id: variable.id,
        key: variable.key,
        value,
        description: variable.description || undefined,
        environment: {
          id: variable.environment.id,
          name: variable.environment.name,
          slug: variable.environment.slug,
        },
        project: {
          id: variable.environment.project.id,
          name: variable.environment.project.name,
          slug: variable.environment.project.slug,
        },
        updatedAt: variable.updatedAt,
        canDecrypt,
      });
    }

    // Generate facets for filtering
    const facets: Facet = {
      projects: [],
      environments: [],
      roles: [],
    };

    // Project facets
    const projectCounts = await prisma.variable.groupBy({
      by: ['environmentId'],
      where: whereClause,
      _count: true,
    });

    const envMap = new Map<string, { projectId: string; envId: string; envName: string }>();
    for (const v of variables) {
      envMap.set(v.environmentId, {
        projectId: v.environment.project.id,
        envId: v.environment.id,
        envName: v.environment.name,
      });
    }

    const projectFacetMap = new Map<string, { name: string; count: number }>();
    for (const count of projectCounts) {
      const env = envMap.get(count.environmentId);
      if (env) {
        const existing = projectFacetMap.get(env.projectId) || { name: '', count: 0 };
        if (!existing.name) {
          const project = variables.find(v => v.environment.project.id === env.projectId);
          existing.name = project?.environment.project.name || '';
        }
        existing.count += count._count;
        projectFacetMap.set(env.projectId, existing);
      }
    }

    facets.projects = Array.from(projectFacetMap.entries()).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count,
    }));

    // Log audit event if decrypt flag used
    if (params.decrypt) {
      await prisma.auditLog.create({
        data: {
          projectId: projectIds[0] || userProjects[0].projectId,
          userId: auth.user.id,
          action: 'SEARCH_VARIABLES_DECRYPT',
          entityType: 'VARIABLE',
          metadata: {
            query: params.q,
            resultCount: results.length,
          },
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          userAgent: req.headers.get('user-agent') || undefined,
        },
      });
    }

    return NextResponse.json({
      results,
      facets,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
