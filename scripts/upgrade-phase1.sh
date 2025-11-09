#!/bin/bash
set -e

# Bucket Dependencies Upgrade - Phase 1 (Safe Updates)
# This script updates all patch and minor versions with no breaking changes

echo "🚀 Bucket Dependencies Upgrade - Phase 1"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if on clean branch
if [[ -n $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create backup branch
BRANCH_NAME="deps/phase1-safe-updates-$(date +%Y%m%d)"
echo "📌 Creating backup branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"

# Pre-upgrade tests
echo ""
echo "🧪 Running pre-upgrade tests..."
echo "================================"

echo "📝 TypeScript compilation..."
pnpm exec tsc --noEmit || {
    echo -e "${RED}❌ TypeScript check failed before upgrade!${NC}"
    exit 1
}

echo "🏗️  Production build..."
pnpm build > /dev/null 2>&1 || {
    echo -e "${RED}❌ Build failed before upgrade!${NC}"
    exit 1
}

echo -e "${GREEN}✅ Pre-upgrade checks passed${NC}"
echo ""

# Backup current bundle size
BEFORE_SIZE=$(du -sk dist 2>/dev/null | cut -f1 || echo "0")

# Phase 1: Safe Updates
echo "📦 Updating dependencies..."
echo "============================"

# React ecosystem
echo "  → React 19.1.0 → 19.2.0"
pnpm add react@19.2.0 react-dom@19.2.0 --silent

# Radix UI components
echo "  → Radix UI components (accessibility patches)"
pnpm add @radix-ui/react-dialog@1.1.15 \
         @radix-ui/react-progress@1.1.8 \
         @radix-ui/react-slider@1.3.6 \
         @radix-ui/react-slot@1.2.4 --silent

# Type definitions
echo "  → TypeScript type definitions"
pnpm add -D @types/react@19.2.2 \
            @types/react-dom@19.2.2 \
            @types/node@20.19.24 \
            @types/qrcode@1.5.6 --silent

# Build tools
echo "  → Build tools (TypeScript, Vite, Prettier)"
pnpm add -D typescript@5.9.3 \
            vite@5.4.21 \
            prettier@3.6.2 \
            tailwindcss@3.4.18 --silent

# Database
echo "  → better-sqlite3 (security patch)"
pnpm add better-sqlite3@12.4.1 --silent

# Testing
echo "  → Testing libraries"
pnpm add -D @testing-library/jest-dom@6.9.1 --silent

# Fonts
echo "  → Fonts"
pnpm add @fontsource-variable/noto-sans-mono@5.2.10 --silent

echo -e "${GREEN}✅ Dependencies updated${NC}"
echo ""

# Post-upgrade verification
echo "🔍 Running post-upgrade verification..."
echo "======================================="

# TypeScript check
echo "📝 TypeScript compilation..."
pnpm exec tsc --noEmit || {
    echo -e "${RED}❌ TypeScript check failed after upgrade!${NC}"
    echo "Run 'git diff package.json' to see changes"
    echo "Consider rolling back: git checkout main && pnpm install"
    exit 1
}
echo -e "${GREEN}✅ TypeScript passes${NC}"

# Build
echo "🏗️  Production build..."
pnpm build > /dev/null 2>&1 || {
    echo -e "${RED}❌ Build failed after upgrade!${NC}"
    echo "Rolling back..."
    git checkout package.json pnpm-lock.yaml
    pnpm install
    exit 1
}
echo -e "${GREEN}✅ Build succeeds${NC}"

# Bundle size check
AFTER_SIZE=$(du -sk dist | cut -f1)
SIZE_DIFF=$((AFTER_SIZE - BEFORE_SIZE))
SIZE_PERCENT=$((SIZE_DIFF * 100 / BEFORE_SIZE))

echo ""
echo "📊 Bundle Size Analysis"
echo "======================="
echo "Before: ${BEFORE_SIZE}KB"
echo "After:  ${AFTER_SIZE}KB"

if [ $SIZE_DIFF -gt 0 ]; then
    echo -e "Change: ${RED}+${SIZE_DIFF}KB (+${SIZE_PERCENT}%)${NC}"
    if [ $SIZE_PERCENT -gt 10 ]; then
        echo -e "${RED}⚠️  Bundle size increased by more than 10%!${NC}"
    fi
else
    echo -e "Change: ${GREEN}${SIZE_DIFF}KB (${SIZE_PERCENT}%)${NC}"
fi

# Dev server check
echo ""
echo "🖥️  Checking dev server..."
timeout 10 bash -c 'pnpm run dev > /dev/null 2>&1' && {
    echo -e "${GREEN}✅ Dev server starts${NC}"
} || {
    echo -e "${YELLOW}⚠️  Could not verify dev server (timeout or already running)${NC}"
}

# Success summary
echo ""
echo "========================================="
echo -e "${GREEN}✅ Phase 1 Upgrade Complete!${NC}"
echo "========================================="
echo ""
echo "Updated packages:"
echo "  • React: 19.1.0 → 19.2.0"
echo "  • TypeScript: 5.8.3 → 5.9.3"
echo "  • Vite: 5.4.19 → 5.4.21"
echo "  • Radix UI: All components to latest patch"
echo "  • Type definitions: Updated"
echo "  • Testing libraries: Updated"
echo ""
echo "Next steps:"
echo "  1. Manual testing (see DEPENDENCY_UPGRADE_PLAN.md)"
echo "  2. Run tests: pnpm test"
echo "  3. Test in browser: pnpm run dev"
echo "  4. If all good: git commit && git push"
echo ""
echo "To rollback:"
echo "  git checkout main"
echo "  git branch -D $BRANCH_NAME"
echo "  pnpm install"
echo ""
