/**
 * Sentry Configuration for Server-Side Error Tracking
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Adjust sample rate for production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Environment
    environment: process.env.NODE_ENV,
    
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive environment variables
      if (event.contexts && event.contexts.runtime) {
        delete event.contexts.runtime.environment;
      }
      
      // Remove encryption keys from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            const filtered = { ...breadcrumb.data };
            // Remove sensitive fields
            ['ENCRYPTION_KEY', 'JWT_SECRET', 'DATABASE_URL', 'password', 'token', 'secret'].forEach(key => {
              if (key in filtered) {
                filtered[key] = '[Filtered]';
              }
            });
            return { ...breadcrumb, data: filtered };
          }
          return breadcrumb;
        });
      }
      
      return event;
    },
  });
}
