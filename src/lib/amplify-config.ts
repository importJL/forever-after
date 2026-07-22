import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json';

let configured = false;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Set it in Amplify Console Environment Variables or in .env.local`
    );
  }
  return value;
}

function buildAmplifyConfig() {
  return {
    version: '1.4',
    auth: {
      user_pool_id: requireEnv('NEXT_PUBLIC_USER_POOL_ID'),
      aws_region: requireEnv('NEXT_PUBLIC_AWS_REGION'),
      user_pool_client_id: requireEnv('NEXT_PUBLIC_USER_POOL_CLIENT_ID'),
      identity_pool_id: requireEnv('NEXT_PUBLIC_IDENTITY_POOL_ID'),
      mfa_methods: [],
      standard_required_attributes: ['email'],
      username_attributes: ['email'],
      user_verification_types: ['email'],
      groups: [
        { admin: { precedence: 0 } },
        { full: { precedence: 1 } },
        { readwrite: { precedence: 2 } },
        { readonly: { precedence: 3 } },
      ],
      mfa_configuration: 'NONE',
      password_policy: {
        min_length: 8,
        require_lowercase: true,
        require_numbers: true,
        require_symbols: true,
        require_uppercase: true,
      },
      unauthenticated_identities_enabled: true,
    },
    data: {
      url: requireEnv('NEXT_PUBLIC_GRAPHQL_ENDPOINT'),
      aws_region: requireEnv('NEXT_PUBLIC_AWS_REGION'),
      default_authorization_type: 'AMAZON_COGNITO_USER_POOLS',
      authorization_types: ['AWS_IAM'],
      model_introspection: outputs.data.model_introspection,
    },
  };
}

export function configureAmplify() {
  if (configured) return;
  Amplify.configure(buildAmplifyConfig(), { ssr: true });
  configured = true;
}
