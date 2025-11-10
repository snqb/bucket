# 🏗️ Monorepo Migration Plan

## Current State
Single app with everything mixed together:
- React components
- Business logic (TinyBase, auth, sync)
- PWA configuration
- All in one `src/` folder

## Target State
Clean separation:
```
bucket/
├── apps/
│   ├── web/        # PWA (current)
│   └── desktop/    # Tauri (new)
├── packages/
│   ├── core/       # Business logic
│   └── ui/         # React components
```

---

## Phase 1: Setup Monorepo Structure (30 minutes)

### Step 1: Initialize pnpm workspace
```bash
cd /Users/sn/Projects/bucket

# Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF
```

### Step 2: Create folder structure
```bash
# Create apps
mkdir -p apps/web
mkdir -p apps/desktop

# Create packages
mkdir -p packages/core/src/lib
mkdir -p packages/ui/src
mkdir -p packages/config
```

### Step 3: Move existing app to apps/web
```bash
# Move current app files
mv src apps/web/
mv public apps/web/
mv index.html apps/web/
mv vite.config.ts apps/web/
mv tsconfig.json apps/web/
mv postcss.config.js apps/web/ 2>/dev/null || true
mv tailwind.config.js apps/web/

# Copy package.json (will modify later)
cp package.json apps/web/package.json
```

### Step 4: Extract core logic to packages/core

**Move these files:**
```bash
# Business logic (no React!)
mv apps/web/src/lib packages/core/src/
mv apps/web/src/types.ts packages/core/src/

# Keep only React-dependent files in apps/web/src/
```

**Create packages/core/package.json:**
```json
{
  "name": "@bucket/core",
  "version": "0.0.1",
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "tinybase": "6.3.0",
    "@scure/bip39": "^1.5.0"
  }
}
```

**Create packages/core/src/index.ts:**
```typescript
// Re-export everything
export * from './lib/auth';
export * from './lib/storage';
export * from './lib/sync';
export * from './lib/bucket-store';
export * from './lib/persistence';
export * from './types';
```

### Step 5: Extract UI to packages/ui

**Move these files:**
```bash
mv apps/web/src/Screen.tsx packages/ui/src/
mv apps/web/src/Task.tsx packages/ui/src/
mv apps/web/src/Adder.tsx packages/ui/src/
mv apps/web/src/components packages/ui/src/
```

**Create packages/ui/package.json:**
```json
{
  "name": "@bucket/ui",
  "version": "0.0.1",
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./styles": "./src/styles.css"
  },
  "dependencies": {
    "@bucket/core": "workspace:*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-progress": "^1.1.8",
    "framer-motion": "^11.15.0",
    "lucide-react": "^0.468.0"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

**Create packages/ui/src/index.ts:**
```typescript
export { Screen } from './Screen';
export { Task } from './Task';
export { Adder } from './Adder';
export * from './components';
```

### Step 6: Update apps/web to use packages

**apps/web/package.json:**
```json
{
  "name": "@bucket/web",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@bucket/core": "workspace:*",
    "@bucket/ui": "workspace:*",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "wouter": "^3.5.2",
    "vite-plugin-pwa": "^0.17.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.9.3",
    "vite": "^5.4.21"
  }
}
```

**apps/web/src/App.tsx (update imports):**
```typescript
// Before:
import { useAuth, useActions } from './tinybase-hooks';
import Screen from './Screen';
import { Task } from './Task';

// After:
import { useAuth, useActions } from '@bucket/core';
import { Screen, Task } from '@bucket/ui';
```

### Step 7: Setup desktop app (Tauri)

```bash
cd apps/desktop

# Initialize Tauri
pnpm add -D @tauri-apps/cli@latest
pnpm add @tauri-apps/api@latest
pnpm tauri init
```

**apps/desktop/package.json:**
```json
{
  "name": "@bucket/desktop",
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build"
  },
  "dependencies": {
    "@bucket/core": "workspace:*",
    "@bucket/ui": "workspace:*",
    "@tauri-apps/api": "^1.6.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^1.6.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.9.3",
    "vite": "^5.4.21"
  }
}
```

**apps/desktop/src/App.tsx:**
```typescript
import { useAuth, useActions } from '@bucket/core';
import { Screen, Task } from '@bucket/ui';
import '@bucket/ui/styles';

// Desktop-specific features
import { invoke } from '@tauri-apps/api';

function App() {
  // Same UI as web, but with desktop enhancements
  return <YourApp />;
}
```

---

## Phase 2: Root Configuration (10 minutes)

### Root package.json
```json
{
  "name": "bucket-monorepo",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter @bucket/web dev",
    "dev:desktop": "pnpm --filter @bucket/desktop dev",
    "build": "pnpm -r build",
    "build:web": "pnpm --filter @bucket/web build",
    "build:desktop": "pnpm --filter @bucket/desktop build",
    "clean": "pnpm -r clean && rm -rf node_modules"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "prettier": "^3.6.2"
  }
}
```

### Install dependencies
```bash
# Root
pnpm install

# This installs all workspace packages
```

---

## Phase 3: Benefits

### Code Reuse
```typescript
// apps/web/src/App.tsx
import { useStore } from '@bucket/core';
import { Screen } from '@bucket/ui';

// apps/desktop/src/App.tsx
import { useStore } from '@bucket/core';  // Same!
import { Screen } from '@bucket/ui';      // Same!
```

### Independent Deployments
```bash
# Deploy web only
pnpm --filter @bucket/web build

# Build desktop only
pnpm --filter @bucket/desktop build

# Build everything
pnpm build
```

### Easy to Add Platforms
```bash
# Future: Mobile app
mkdir apps/mobile
# Uses same @bucket/core and @bucket/ui!
```

---

## Testing Strategy

### Phase 1: Verify web still works
```bash
cd apps/web
pnpm dev
# Should work exactly as before
```

### Phase 2: Add desktop
```bash
cd apps/desktop
pnpm tauri:dev
# Should show same UI in native window
```

---

## Migration Checklist

- [ ] Create pnpm-workspace.yaml
- [ ] Create folder structure (apps/, packages/)
- [ ] Move current app to apps/web/
- [ ] Extract logic to packages/core/
- [ ] Extract UI to packages/ui/
- [ ] Update imports in apps/web/
- [ ] Test web app works
- [ ] Setup apps/desktop/ with Tauri
- [ ] Test desktop app works
- [ ] Update CI/CD for monorepo

---

## Rollback Plan

If migration fails:
```bash
git stash
git checkout main
# Back to single-app structure
```

---

## Estimated Time

- **Setup structure**: 30 minutes
- **Extract packages**: 45 minutes
- **Fix imports**: 30 minutes
- **Test**: 15 minutes
- **Setup desktop**: 30 minutes

**Total**: ~2.5 hours

**But you get:**
- ✅ Clean architecture
- ✅ Code reuse
- ✅ Easy to add platforms
- ✅ Independent deployments
- ✅ Isolated Tauri in apps/desktop/
