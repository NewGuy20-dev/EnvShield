import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Enable static export for all pages that can be statically generated
    // This helps with build optimization
  },
  
  // Security Headers - Temporarily disabled during build troubleshooting
  // Will be re-enabled via middleware for better compatibility with Next.js 16
  // async headers() {
  //   const cspValue = "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';";
  //   
  //   return [
  //     {
  //       source: '/:path*',
  //       headers: [
  //         {
  //           key: 'Content-Security-Policy',
  //           value: cspValue,
  //         },
  //         {
  //           key: 'X-Frame-Options',
  //           value: 'DENY',
  //         },
  //         {
  //           key: 'X-Content-Type-Options',
  //           value: 'nosniff',
  //         },
  //         {
  //           key: 'X-XSS-Protection',
  //           value: '1; mode=block',
  //         },
  //         {
  //           key: 'Referrer-Policy',
  //           value: 'strict-origin-when-cross-origin',
  //         },
  //         {
  //           key: 'Permissions-Policy',
  //           value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  //         },
  //         {
  //           key: 'Strict-Transport-Security',
  //           value: 'max-age=31536000; includeSubDomains; preload',
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig;
