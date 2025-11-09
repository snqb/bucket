# 🚀 Dependency Upgrade - Quick Start

## TL;DR

```bash
# Safe updates (recommended NOW)
./scripts/upgrade-phase1.sh

# Or manual
pnpm update
pnpm test
pnpm build
```

---

## 📋 What Needs Upgrading?

**28 packages outdated** (as of November 2025)

### ✅ Safe to Update NOW (Phase 1)
- React 19.1 → 19.2 (bug fixes)
- TypeScript 5.8 → 5.9 (performance)
- Vite 5.4.19 → 5.4.21 (security)
- All Radix UI components
- Testing libraries

**Risk**: 🟢 LOW
**Time**: 15 minutes
**Breaking Changes**: None

### ⚠️ Update Carefully (Phase 2)
- TinyBase 6.3 → 6.7.2

**Risk**: 🟡 MEDIUM
**Time**: 1 hour
**Breaking Changes**: Possible

### 🔴 Plan Separately (Phase 3)
- Vite 5 → 7 (MAJOR)
- Tailwind 3 → 4 (MAJOR REWRITE!)
- Framer Motion 11 → 12
- Vitest 3 → 4

**Risk**: 🔴 HIGH
**Time**: 4-8 hours each
**Breaking Changes**: Guaranteed

---

## 🎯 Recommended Actions

### This Week: Execute Phase 1

```bash
# Automated script (recommended)
./scripts/upgrade-phase1.sh

# Manual approach
pnpm update
pnpm build
pnpm test
```

**Then test**:
- [ ] Create list
- [ ] Add task
- [ ] Delete → Cemetery → Restore
- [ ] Keyboard shortcuts (N, C, M, ←, →, Esc)
- [ ] Export data
- [ ] Sync button

### Next Week: TinyBase (Phase 2)

```bash
git checkout -b deps/tinybase-update
pnpm add tinybase@6.7.2
pnpm test
pnpm build

# Critical: Test data operations!
```

### Next Month: Major Updates (Phase 3)

One at a time, separate PRs, full testing.

---

## ⚡ Quick Commands

```bash
# Check what's outdated
pnpm outdated

# Update all safe packages
pnpm update

# Update specific package
pnpm add <package>@latest

# Rollback if problems
git checkout package.json pnpm-lock.yaml
pnpm install
```

---

## 🧪 Testing After Upgrade

```bash
# All tests
pnpm test:run

# Type check
pnpm exec tsc --noEmit

# Build
pnpm build

# Dev server
pnpm run dev
```

---

## 🆘 If Something Breaks

```bash
# Quick rollback
git checkout package.json pnpm-lock.yaml
pnpm install
pnpm build

# Nuclear option
git reset --hard origin/main
rm -rf node_modules
pnpm install
```

---

## 📚 Full Documentation

See `DEPENDENCY_UPGRADE_PLAN.md` for complete details:
- Detailed breaking changes analysis
- Migration guides for each package
- Compatibility matrix
- Post-upgrade monitoring
- Red flags to watch for

---

## ✅ Success Criteria

**Phase 1 done when**:
- ✅ Build passes
- ✅ TypeScript compiles
- ✅ Tests pass
- ✅ Manual testing works
- ✅ Bundle size < 600KB

---

**Questions?** Check the full plan: `DEPENDENCY_UPGRADE_PLAN.md`
