import { Amplify } from 'aws-amplify';

let configured = false;

export function configureAmplify() {
  if (configured) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const outputs = require('../../amplify_outputs.json');
    Amplify.configure(outputs, { ssr: true });
  } catch {
    Amplify.configure(
      {
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
            defaultAuthMode: 'userPool',
          },
        },
      },
      { ssr: true },
    );
  }

  configured = true;
}
