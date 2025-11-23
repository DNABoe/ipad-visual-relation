#!/bin/bash

# RelEye Standalone Deployment Script
# Builds and packages the app for deployment to spaceship.com

set -e  # Exit on error

echo "=================================================="
echo "  RelEye Standalone Deployment"
echo "  Target: releye.boestad.com"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clean previous builds
echo -e "${YELLOW}Step 1: Cleaning previous builds...${NC}"
if [ -d "dist" ]; then
    rm -rf dist
    echo "✓ Removed old dist folder"
fi
if [ -f "releye-deployment.zip" ]; then
    rm -f releye-deployment.zip
    echo "✓ Removed old deployment package"
fi
echo ""

# Step 2: Install dependencies (if needed)
echo -e "${YELLOW}Step 2: Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✓ Dependencies already installed"
fi
echo ""

# Step 3: Build the application
echo -e "${YELLOW}Step 3: Building application...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    echo "Please fix the errors above and try again."
    exit 1
fi

echo -e "${GREEN}✓ Build successful!${NC}"
echo ""

# Step 4: Verify build output
echo -e "${YELLOW}Step 4: Verifying build output...${NC}"
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist folder not found!${NC}"
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ index.html not found in dist!${NC}"
    exit 1
fi

echo "✓ index.html found"

if [ ! -d "dist/assets" ]; then
    echo -e "${RED}❌ assets folder not found in dist!${NC}"
    exit 1
fi

echo "✓ assets folder found"

# Count files
FILE_COUNT=$(find dist -type f | wc -l)
echo "✓ Total files in dist: $FILE_COUNT"
echo ""

# Step 5: Create deployment package
echo -e "${YELLOW}Step 5: Creating deployment package...${NC}"
cd dist
zip -r ../releye-deployment.zip . -q

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create zip file!${NC}"
    cd ..
    exit 1
fi

cd ..
ZIP_SIZE=$(du -h releye-deployment.zip | cut -f1)
echo -e "${GREEN}✓ Deployment package created: releye-deployment.zip ($ZIP_SIZE)${NC}"
echo ""

# Step 6: Create upload instructions
echo -e "${YELLOW}Step 6: Creating upload instructions...${NC}"
cat > UPLOAD_INSTRUCTIONS.txt << 'EOF'
================================================
RelEye Deployment Instructions
================================================

AUTOMATED UPLOAD (Recommended):

Upload the deployment package using the provided script:
  ./upload-to-spaceship.sh

Or follow the manual steps below.

MANUAL UPLOAD:

1. Log in to Spaceship.com cPanel
   https://www.spaceship.com/

2. Navigate to File Manager
   - Click on "File Manager" in cPanel

3. Navigate to your subdomain directory
   - Go to the folder for releye.boestad.com
   - This is typically: public_html/releye or similar

4. Delete old files (IMPORTANT!)
   - Select all files in the directory
   - Click "Delete" and confirm

5. Upload the deployment package
   - Click "Upload"
   - Select "releye-deployment.zip" from your computer
   - Wait for upload to complete

6. Extract the package
   - Go back to File Manager
   - Right-click on "releye-deployment.zip"
   - Select "Extract"
   - Confirm extraction

7. Clean up
   - Delete "releye-deployment.zip" from the server
   - Verify all files are in the root directory (not in a subdirectory)

8. Test the deployment
   - Visit https://releye.boestad.com
   - You should see the first-time setup screen
   - Create an admin account and test functionality

================================================
File Structure (should look like this):
================================================

releye.boestad.com/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].js
  │   ├── index-[hash].css
  │   └── ...other asset files
  └── .nojekyll (if present)

================================================
Troubleshooting:
================================================

Issue: Blank page
Solution: Check browser console (F12) for errors
          Verify all files uploaded correctly

Issue: 404 errors for assets
Solution: Ensure assets/ folder is in the same directory as index.html
          Check file permissions (644 for files, 755 for folders)

Issue: Can't create account
Solution: Check browser console for localStorage errors
          Ensure you're not in private/incognito mode

================================================
Support:
================================================

For issues, check the deployment guide:
  STANDALONE_DEPLOYMENT_GUIDE.md

Or review browser console errors (F12 → Console tab)

================================================
EOF

echo -e "${GREEN}✓ Upload instructions created: UPLOAD_INSTRUCTIONS.txt${NC}"
echo ""

# Final summary
echo "=================================================="
echo -e "${GREEN}  Deployment Package Ready!${NC}"
echo "=================================================="
echo ""
echo "Files created:"
echo "  • releye-deployment.zip ($ZIP_SIZE)"
echo "  • UPLOAD_INSTRUCTIONS.txt"
echo ""
echo "Next steps:"
echo "  1. Read UPLOAD_INSTRUCTIONS.txt"
echo "  2. Upload releye-deployment.zip to spaceship.com cPanel"
echo "  3. Extract it in your releye.boestad.com directory"
echo "  4. Visit https://releye.boestad.com to verify"
echo ""
echo "Or use automated upload:"
echo "  ./upload-to-spaceship.sh"
echo ""
echo -e "${GREEN}Deployment package is ready for upload!${NC}"
echo "=================================================="
