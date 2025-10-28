#!/bin/bash

# RelEye Deployment Verification Script
# This script checks all deployment prerequisites

echo "🔍 RelEye Deployment Verification"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "📁 Checking Required Files..."
echo ""

# Check workflow file
if [ -f ".github/workflows/deploy.yml" ]; then
    echo -e "${GREEN}✓${NC} .github/workflows/deploy.yml exists"
else
    echo -e "${RED}✗${NC} .github/workflows/deploy.yml MISSING"
    ((ERRORS++))
fi

# Check CNAME files
if [ -f "CNAME" ]; then
    CNAME_CONTENT=$(cat CNAME | tr -d '\n\r')
    if [ "$CNAME_CONTENT" = "releye.boestad.com" ]; then
        echo -e "${GREEN}✓${NC} CNAME exists with correct content"
    else
        echo -e "${RED}✗${NC} CNAME exists but content is: '$CNAME_CONTENT' (should be: releye.boestad.com)"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} CNAME MISSING in root"
    ((ERRORS++))
fi

if [ -f "public/CNAME" ]; then
    CNAME_CONTENT=$(cat public/CNAME | tr -d '\n\r')
    if [ "$CNAME_CONTENT" = "releye.boestad.com" ]; then
        echo -e "${GREEN}✓${NC} public/CNAME exists with correct content"
    else
        echo -e "${YELLOW}⚠${NC} public/CNAME exists but content is: '$CNAME_CONTENT'"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} public/CNAME missing (will be copied from root)"
    ((WARNINGS++))
fi

# Check .nojekyll files
if [ -f ".nojekyll" ]; then
    echo -e "${GREEN}✓${NC} .nojekyll exists"
else
    echo -e "${RED}✗${NC} .nojekyll MISSING in root"
    ((ERRORS++))
fi

if [ -f "public/.nojekyll" ]; then
    echo -e "${GREEN}✓${NC} public/.nojekyll exists"
else
    echo -e "${YELLOW}⚠${NC} public/.nojekyll missing (will be copied from root)"
    ((WARNINGS++))
fi

# Check vite config
if [ -f "vite.config.ts" ]; then
    if grep -q 'base: "/"' vite.config.ts; then
        echo -e "${GREEN}✓${NC} vite.config.ts has correct base path"
    else
        echo -e "${RED}✗${NC} vite.config.ts base path may be incorrect"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} vite.config.ts MISSING"
    ((ERRORS++))
fi

# Check package.json
if [ -f "package.json" ]; then
    if grep -q '"build"' package.json; then
        echo -e "${GREEN}✓${NC} package.json has build script"
    else
        echo -e "${RED}✗${NC} package.json missing build script"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} package.json MISSING"
    ((ERRORS++))
fi

# Check index.html
if [ -f "index.html" ]; then
    if grep -q './src/main.css' index.html && grep -q './src/main.tsx' index.html; then
        echo -e "${GREEN}✓${NC} index.html has correct script/css paths"
    else
        echo -e "${RED}✗${NC} index.html paths may be incorrect"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} index.html MISSING"
    ((ERRORS++))
fi

echo ""
echo "🌐 Checking DNS Configuration..."
echo ""

# Check DNS
if command -v dig &> /dev/null; then
    DIG_OUTPUT=$(dig +short releye.boestad.com)
    if [ -n "$DIG_OUTPUT" ]; then
        echo -e "${GREEN}✓${NC} DNS is configured for releye.boestad.com"
        echo "  Records found: $DIG_OUTPUT"
    else
        echo -e "${YELLOW}⚠${NC} No DNS records found for releye.boestad.com"
        echo "  This may be normal if you just configured DNS (propagation takes time)"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} 'dig' command not available - cannot check DNS"
    echo "  Install dnsutils to check DNS: apt-get install dnsutils"
    ((WARNINGS++))
fi

echo ""
echo "🔨 Checking Build Configuration..."
echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists (dependencies installed)"
else
    echo -e "${YELLOW}⚠${NC} node_modules missing - run 'npm install'"
    ((WARNINGS++))
fi

# Try to check if build works (optional, commented out as it takes time)
# echo ""
# echo "Testing build..."
# if npm run build > /dev/null 2>&1; then
#     echo -e "${GREEN}✓${NC} Build successful"
# else
#     echo -e "${RED}✗${NC} Build failed - check with: npm run build"
#     ((ERRORS++))
# fi

echo ""
echo "=================================="
echo "📊 Summary"
echo "=================================="
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Your deployment configuration looks good."
    echo ""
    echo "Next steps:"
    echo "1. Ensure GitHub Pages source is set to 'GitHub Actions'"
    echo "   (Settings → Pages → Source → GitHub Actions)"
    echo ""
    echo "2. Push to trigger deployment:"
    echo "   git add ."
    echo "   git commit -m 'Deploy RelEye'"
    echo "   git push origin main"
    echo ""
    echo "3. Check Actions tab on GitHub for build status"
    echo ""
    echo "4. Visit https://releye.boestad.com after ~3 minutes"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo ""
    echo "Warnings are usually not critical, but review them."
    echo "You can probably proceed with deployment."
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    fi
    echo ""
    echo "Fix the errors above before deploying."
    echo "See DEPLOYMENT_START_HERE.md for help."
fi

echo ""

exit $ERRORS
