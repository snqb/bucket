# 📦 Dependency Upgrade Plan - Bucket App

**Date**: November 2025
**Current Status**: 28 packages outdated
**Risk Assessment**: LOW to MEDIUM

---

## 🎯 Executive Summary

### Upgrade Categories

| Category | Count | Risk Level | Priority |
|----------|-------|------------|----------|
| **Patch Updates** | 16 | 🟢 LOW | HIGH |
| **Minor Updates** | 6 | 🟡 MEDIUM | MEDIUM |
| **Major Updates** | 6 | 🔴 HIGH | LOW |

### Recommended Strategy

**3-Phase Incremental Approach**:
1. **Phase 1 (Safe)**: Patch + minor updates (22 packages) - **EXECUTE NOW**
2. **Phase 2 (Careful)**: TinyBase + React 19.2 (3 packages) - **TEST THOROUGHLY**
3. **Phase 3 (Planned)**: Major version jumps (6 packages) - **SEPARATE PRs**

---

## 📊 Detailed Analysis

### Phase 1: Safe Updates (Execute Immediately) ✅

**Risk**: 🟢 LOW - No breaking changes expected
**Estimated Time**: 15 minutes
**Testing Required**: Smoke tests

#### Patch Updates (16 packages)

```bash
# React ecosystem
pnpm add react@19.2.0 react-dom@19.2.0

# Radix UI components
pnpm add @radix-ui/react-dialog@1.1.15 \
         @radix-ui/react-progress@1.1.8 \
         @radix-ui/react-slider@1.3.6 \
         @radix-ui/react-slot@1.2.4

# Type definitions
pnpm add -D @types/react@19.2.2 \
            @types/react-dom@19.2.2 \
            @types/node@20.19.24 \
            @types/qrcode@1.5.6

# Build tools
pnpm add -D typescript@5.9.3 \
            vite@5.4.21 \
            prettier@3.6.2 \
            tailwindcss@3.4.18

# Database
pnpm add better-sqlite3@12.4.1

# Testing
pnpm add -D @testing-library/jest-dom@6.9.1

# Fonts
pnpm add @fontsource-variable/noto-sans-mono@5.2.10
```

**Changes**:
- React 19.1.0 → 19.2.0 (patch release, bug fixes only)
- TypeScript 5.8.3 → 5.9.3 (performance improvements)
- Vite 5.4.19 → 5.4.21 (security patches)
- All Radix UI patches (accessibility improvements)

**Testing Checklist**:
- [ ] `pnpm build` succeeds
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] Dev server starts without errors
- [ ] All keyboard shortcuts work
- [ ] Cemetery restore functionality works
- [ ] Sync button shows spinner correctly

---

### Phase 2: Minor Updates (Test Thoroughly) ⚠️

**Risk**: 🟡 MEDIUM - API additions, potential peer dependency issues
**Estimated Time**: 1 hour
**Testing Required**: Full regression tests

#### TinyBase Update (Critical)

```bash
# TinyBase 6.3.0 → 6.7.2
pnpm add tinybase@6.7.2
```

**Why This Matters**:
- TinyBase is your core data store
- Version 6.7.2 includes performance optimizations
- Check release notes: https://tinybase.org/guides/releases/

**Migration Steps**:
1. Update TinyBase
2. Run all tests: `pnpm test`
3. Verify sync functionality
4. Check MergeableStore compatibility
5. Test cemetery operations
6. Verify localStorage persistence

**Breaking Changes Check**:
```bash
# Read TinyBase changelog for 6.4-6.7
curl -s https://raw.githubusercontent.com/tinyplex/tinybase/main/CHANGELOG.md | head -200
```

**Verification Script**:
```typescript
// test/tinybase-upgrade.test.ts
import { describe, it, expect } from 'vitest';
import { store, createList, createTask, restoreFromCemetery } from '../src/lib/bucket-store';

describe('TinyBase 6.7.2 Compatibility', () => {
  it('creates and retrieves lists', () => {
    const listId = createList('Test List', '📝', '#FF0000');
    const list = store.getRow('lists', listId);
    expect(list).toBeDefined();
    expect(list.title).toBe('Test List');
  });

  it('handles cemetery operations', () => {
    const listId = createList('Temp List');
    const taskId = createTask(listId, 'Test Task');
    deleteTask(taskId, 'testing');

    const cemetery = store.getTable('cemetery');
    expect(Object.keys(cemetery).length).toBeGreaterThan(0);
  });

  it('merges data correctly', () => {
    // Test MergeableStore functionality
    const store1 = createMergeableStore();
    const store2 = createMergeableStore();

    store1.setRow('lists', 'test', { title: 'Test' });
    store2.merge(store1);

    expect(store2.getRow('lists', 'test')).toBeDefined();
  });
});
```

---

### Phase 3: Major Version Upgrades (Planned Separately) 🔴

**Risk**: 🔴 HIGH - Breaking changes guaranteed
**Estimated Time**: 4-8 hours per package
**Testing Required**: Comprehensive

#### 1. Vite 5 → 7 (MAJOR)

```bash
pnpm add -D vite@7.2.2
```

**Breaking Changes**:
- ESM-only (already using)
- Changed plugin API
- New dependency pre-bundling
- Updated rollup options

**Migration Guide**:
```javascript
// vite.config.ts changes needed
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // NEW: Updated build options
  build: {
    target: 'esnext', // Was 'es2015'
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tinybase: ['tinybase']
        }
      }
    }
  },

  // NEW: Optimized deps
  optimizeDeps: {
    include: ['react', 'react-dom', 'tinybase']
  }
});
```

**Testing**:
- [ ] Dev server HMR works
- [ ] Production build succeeds
- [ ] Bundle size acceptable
- [ ] PWA manifest generated
- [ ] Service worker registered

---

#### 2. Tailwind CSS 3 → 4 (MAJOR)

```bash
pnpm add -D tailwindcss@4.1.17
```

**⚠️ WARNING**: Tailwind 4 is a complete rewrite!

**Breaking Changes**:
- New oxide engine (faster)
- Config file format changed
- PostCSS plugin changed
- Some utilities renamed

**Migration Steps**:
1. Read official guide: https://tailwindcss.com/docs/upgrade-guide
2. Run automated migration: `npx @tailwindcss/upgrade`
3. Update `tailwind.config.js` → `tailwind.config.ts`
4. Update PostCSS config
5. Test all UI components

**Config Changes**:
```typescript
// tailwind.config.ts (NEW FORMAT)
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Your custom theme
    }
  }
} satisfies Config;
```

**UI Testing Checklist**:
- [ ] All buttons render correctly
- [ ] Dialog animations work
- [ ] Progress bars styled properly
- [ ] Cemetery UI intact
- [ ] Mobile responsive layouts
- [ ] Dark mode (if implemented)

---

#### 3. Framer Motion 11 → 12 (MAJOR)

```bash
pnpm add framer-motion@12.23.24
```

**Breaking Changes**:
- Animation API changes
- Layout animations updated
- Gesture handling improved

**Files to Review**:
- `src/App.tsx` - Empty state animations
- `src/Task.tsx` - Task animations
- `src/Screen.tsx` - Screen transitions

**Migration**:
```typescript
// BEFORE (Framer Motion 11)
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
>

// AFTER (Framer Motion 12) - Same API!
// Should work without changes, but test thoroughly
```

---

#### 4. Vitest 3 → 4 (MAJOR)

```bash
pnpm add -D vitest@4.0.8 @vitest/ui@4.0.8
```

**Breaking Changes**:
- New snapshot format
- Changed expect API
- Different coverage reporter

**Migration Steps**:
1. Update snapshots: `pnpm test -- -u`
2. Update test config
3. Check coverage reports

---

#### 5. Other Major Updates

**@scure/bip39**: 1.6.0 → 2.0.1
- Crypto library for passphrases
- **CRITICAL**: Test authentication thoroughly!
- May have breaking changes in key derivation

**@types/node**: 20.x → 24.x
- Type definitions only
- Low risk

---

## 🚀 Recommended Execution Plan

### Immediate Actions (This Week)

```bash
#!/bin/bash
# Phase 1: Safe Updates

# 1. Create backup branch
git checkout -b deps/phase1-safe-updates

# 2. Update safe packages
pnpm update

# 3. Run tests
pnpm test:run

# 4. Build production
pnpm build

# 5. If all pass, commit and merge
git add .
git commit -m "chore: update safe dependencies (patch + minor)

- React 19.1 → 19.2 (bug fixes)
- TypeScript 5.8 → 5.9 (performance)
- Vite 5.4.19 → 5.4.21 (security)
- All Radix UI components (accessibility)
- Testing library updates

All tests passing, no breaking changes."

git push origin deps/phase1-safe-updates
```

### Week 2: TinyBase Update

```bash
# Phase 2: TinyBase
git checkout -b deps/phase2-tinybase

pnpm add tinybase@6.7.2

# Critical tests
pnpm test
pnpm build

# Manual testing
# - Create lists
# - Add tasks
# - Delete tasks (cemetery)
# - Restore from cemetery
# - Sync functionality
# - Export data
```

### Month 2: Major Updates (One at a Time)

**Week 1**: Vite 5 → 7
**Week 2**: Tailwind 3 → 4
**Week 3**: Framer Motion 11 → 12
**Week 4**: Vitest 3 → 4

---

## 🧪 Testing Strategy

### Automated Tests

```bash
# Full test suite
pnpm test:run

# Type checking
pnpm exec tsc --noEmit

# Build
pnpm build

# Bundle size check
du -h dist/assets/*.js | sort -h
```

### Manual Testing Checklist

**Core Functionality**:
- [ ] Create new list
- [ ] Add task to list
- [ ] Update task progress (0-100%)
- [ ] Complete task (100% → confetti)
- [ ] Delete task → Cemetery
- [ ] Restore from cemetery
- [ ] Permanently delete from cemetery
- [ ] Export data to JSON
- [ ] Keyboard shortcuts (N, C, M, ←, →, Esc)

**Authentication**:
- [ ] Create new passphrase
- [ ] Login with existing passphrase
- [ ] Skip auth (anonymous session)
- [ ] QR code generation
- [ ] Copy passphrase to clipboard

**Sync**:
- [ ] Sync button shows status
- [ ] Manual sync works
- [ ] Loading spinner during sync
- [ ] Sync error handling

**UI/UX**:
- [ ] Empty state with animations
- [ ] Loading states on buttons
- [ ] Error messages inline
- [ ] Mobile responsive
- [ ] PWA installable

---

## 🔄 Rollback Procedures

### Quick Rollback

```bash
# If Phase 1 fails
git checkout main
git branch -D deps/phase1-safe-updates
pnpm install

# If Phase 2 fails
git revert HEAD
pnpm install
```

### Full Rollback

```bash
# Nuclear option - restore everything
git reset --hard origin/main
rm -rf node_modules
pnpm install
pnpm build
```

---

## 📈 Post-Upgrade Monitoring

### Bundle Size Tracking

```bash
# Before upgrade
pnpm build
du -sh dist/

# After each phase
pnpm build
du -sh dist/

# Alert if > 10% increase
```

### Performance Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Bundle size | 558KB | <600KB | ✅ |
| Gzip size | 187KB | <200KB | ✅ |
| Build time | ~2s | <3s | ✅ |
| Dev server start | <1s | <2s | ✅ |

---

## ✅ Pre-Flight Checklist

Before executing ANY upgrade:

- [ ] All tests passing on main branch
- [ ] Clean working directory (`git status`)
- [ ] Backup branch created
- [ ] Team notified (if applicable)
- [ ] Documentation reviewed
- [ ] Rollback plan understood
- [ ] Time allocated for testing
- [ ] Production deployment not scheduled same day

---

## 🎯 Success Criteria

**Phase 1 Complete When**:
- ✅ All tests pass
- ✅ TypeScript compiles
- ✅ Build succeeds
- ✅ Dev server runs
- ✅ Manual testing passes
- ✅ No console errors
- ✅ Bundle size acceptable

**Phase 2 Complete When**:
- ✅ All Phase 1 criteria
- ✅ TinyBase tests pass
- ✅ Sync works correctly
- ✅ Data persistence verified
- ✅ Cemetery operations work
- ✅ No data loss

**Phase 3 (Each Major Update)**:
- ✅ All previous criteria
- ✅ Migration guide followed
- ✅ Breaking changes addressed
- ✅ Full regression testing
- ✅ Performance benchmarks met
- ✅ Documentation updated

---

## 📚 Resources

### Official Documentation
- **React 19**: https://react.dev/blog/2024/12/05/react-19
- **TinyBase**: https://tinybase.org/guides/releases/
- **Vite 7**: https://vitejs.dev/guide/migration.html
- **Tailwind 4**: https://tailwindcss.com/docs/upgrade-guide
- **Framer Motion 12**: https://www.framer.com/motion/migration/

### Community
- Check GitHub issues for migration problems
- Search Stack Overflow for common errors
- Review changelog for each package

---

## 🚨 Red Flags - STOP IF YOU SEE

- TypeScript errors that can't be resolved
- Build fails with cryptic errors
- Runtime errors in console
- Data loss in TinyBase
- Sync stops working
- Bundle size increases >20%
- Performance degrades noticeably

**If any red flag appears**: ROLLBACK IMMEDIATELY

---

## 📝 Notes

**Why Not Update Everything at Once?**
- Risk mitigation - isolate failures
- Easier debugging - know what broke
- Incremental testing - validate each step
- Team learning - understand changes
- Rollback simplicity - smaller changesets

**Priority Reasoning**:
1. Security patches first (Vite, better-sqlite3)
2. Type safety next (TypeScript, React types)
3. Core functionality (TinyBase) carefully
4. UI/UX improvements (Tailwind, Framer) when stable
5. Dev tools (Vitest) last

---

**Last Updated**: November 2025
**Status**: READY TO EXECUTE PHASE 1
**Owner**: Development Team
