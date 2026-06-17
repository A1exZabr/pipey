import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Upload source maps for better stack traces
  org: process.env.SENTRY_ORG || 'pipey',
  project: process.env.SENTRY_PROJECT || 'pipey-frontend',
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Suppress source map upload warnings when no auth token
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Automatically tree-shake Sentry SDK when DSN is empty
  disableLogger: true,

  // Tunnel Sentry events through the Next.js app to avoid ad blockers
  tunnelRoute: '/monitoring',
});
