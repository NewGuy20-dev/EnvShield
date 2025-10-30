/**
 * Sentry Configuration for Client-Side Error Tracking
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Adjust sample rate for production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Set sampling rate for profiling
    profilesSampleRate: 0.1,
    
    // Environment
    environment: process.env.NODE_ENV,
    
    // Capture unhandled promise rejections
    integrations: [],
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive data from error events
      if (event.request) {
        delete event.request.cookies;
        
        // Mask authorization headers
        if (event.request.headers) {
          if ('authorization' in event.request.headers) {
            event.request.headers.authorization = '[Filtered]';
          }
          if ('cookie' in event.request.headers) {
            event.request.headers.cookie = '[Filtered]';
          }
        }
      }
      
      // Filter out certain errors
      if (event.exception) {
        const error = hint.originalException;
        
        // Ignore network errors
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as Error).message;
          if (message.includes('Network request failed') || 
              message.includes('Failed to fetch')) {
            return null;
          }
        }
      }
      
      return event;
    },
  });
}
