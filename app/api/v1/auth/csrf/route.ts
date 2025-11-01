/**
 * CSRF Token API Route
 * GET - Get CSRF token for client-side requests
 */

import { getCsrfTokenRoute } from '@/lib/csrf';

export async function GET() {
  return getCsrfTokenRoute();
}
