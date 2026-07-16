# Fix: bun not found in Amplify Hosting build environment

## Problem
Amplify Hosting (Amazon Linux 2023) doesn't have `bun` pre-installed. The `amplify.yml` build spec runs `bun install` which fails with `bun: command not found`.

## Fix
Edit `amplify.yml` at line 5 to install `bun` via npm before running `bun install`.

### Current content (line 5-7):
```yaml
    preBuild:
      commands:
        - bun install
```

### Replace with:
```yaml
    preBuild:
      commands:
        - npm install -g bun
        - bun install
```

### Full updated file:
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g bun
        - bun install
    build:
      commands:
        - bun run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

## After applying
1. Commit: `git add amplify.yml && git commit -m "Fix amplify.yml: install bun in preBuild phase"`
2. Push: `git push origin main`
3. Amplify Console will auto-rebuild
