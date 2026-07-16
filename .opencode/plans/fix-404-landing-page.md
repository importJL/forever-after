# Fix: Landing page returns 404 (x-cache: Error from cloudfront)

## Root Cause
The app is deployed on `WEB_COMPUTE` (SSR) platform, but Next.js determined all page routes are `○ (Static)` — no SSR is needed. The SSR Lambda fails at runtime because `require('amplify_outputs.json')` fails (file is gitignored), and `createServerRunner()` receives empty/partial config. CloudFront returns `x-cache: Error from cloudfront` → 404 for all requests.

## Fix

### 1. Update Amplify Console app (via CLI)
- Change platform from `WEB_COMPUTE` → `WEB`
- Remove the custom SPA rule `"<*>": "/index.html"` (set to empty array)
- Keep all environment variables as-is

### 2. Update `src/lib/amplify-config.ts`
Remove the `require()` try/catch pattern. Use env vars directly:

**Current:**
```typescript
try {
  const outputs = require('../../amplify_outputs.json');
  Amplify.configure(outputs, { ssr: true });
} catch {
  Amplify.configure({...fallback...}, { ssr: true });
}
```

**Replace with:**
```typescript
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
```

### 3. Update `src/lib/amplify-server.ts`
Remove the `require()` try/catch in `loadConfig()`. Use env vars directly:

**Current:**
```typescript
function loadConfig() {
  try {
    return require('../../amplify_outputs.json');
  } catch {
    return { ... fallback ... };
  }
}
```

**Replace with:**
```typescript
function loadConfig() {
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
```

### 4. Update `src/app/api/import/route.ts`
Remove the `require()` try/catch IIFE. Use env vars directly:

**Current (lines 8-16):**
```typescript
const outputs = (() => { try { return require('../../../../amplify_outputs.json') } catch { return undefined } })()

const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs ?? { ... fallback ... },
})
```

**Replace with:**
```typescript
const { runWithAmplifyServerContext } = createServerRunner({
  config: {
    Auth: { Cognito: { userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID ?? '', userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID ?? '', identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID ?? '' } },
    API: { GraphQL: { endpoint: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ?? '', region: process.env.NEXT_PUBLIC_AWS_REGION ?? '', defaultAuthMode: 'userPool' as const } },
  },
})
```

(Note: The import route will stop working under `WEB` platform because it's a server-side API route. This is acceptable — file import can be handled client-side as a follow-up.)

### 5. Commit and push
```bash
git add src/lib/amplify-config.ts src/lib/amplify-server.ts src/app/api/import/route.ts
git commit -m "Fix 404: switch to WEB platform, remove require(amplify_outputs.json)"
git push origin main
```

### 6. Update Amplify Console app (via AWS CLI)
```bash
aws amplify update-app --app-id d32vghdquhpv6z --region ap-northeast-1 --platform WEB --custom-rules '[]'
```

### 7. Trigger rebuild
The auto-build will trigger automatically on push (enableAutoBuild is true).
