import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import type { NextRequest, NextResponse } from 'next/server';

function loadConfig() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../amplify_outputs.json');
  } catch {
    return {
      Auth: {
        Cognito: {
          userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID ?? '',
          userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ?? '',
          identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID ?? '',
        },
      },
      API: {
        GraphQL: {
          endpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '',
          region: process.env.NEXT_PUBLIC_AWS_REGION ?? '',
          defaultAuthMode: 'userPool' as const,
        },
      },
    };
  }
}

export const { runWithAmplifyServerContext } = createServerRunner({
  config: loadConfig(),
});

export async function isAuthenticated(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('aws-amplify/auth');
    await runWithAmplifyServerContext({
      nextServerContext: { request, response: {} as NextResponse },
      operation: (context) => getCurrentUser(),
    });
    return true;
  } catch {
    return false;
  }
}
