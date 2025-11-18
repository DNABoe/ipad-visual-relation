#!/bin/bash

# RelEye Documentation Cleanup Script
# This script moves obsolete documentation files to the docs-archive directory
# Run this to clean up the root directory while preserving historical documentation

echo "🧹 RelEye Documentation Cleanup"
echo "================================"
echo ""
echo "This script will move obsolete documentation files to docs-archive/"
echo "The files will be preserved but removed from the root directory."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

# Create archive directory if it doesn't exist
mkdir -p docs-archive

# Counter for moved files
COUNT=0

# Function to move file if it exists
move_if_exists() {
    if [ -f "$1" ]; then
        mv "$1" docs-archive/
        echo "✓ Moved: $1"
        COUNT=$((COUNT + 1))
    fi
}

echo ""
echo "Moving obsolete deployment guides..."
move_if_exists "BACKEND_DEPLOYMENT_GUIDE.md"
move_if_exists "BACKEND_FIX_README.md"
move_if_exists "CLOUD_API_SETUP.md"
move_if_exists "COMPLETE_DEPLOYMENT_PACKAGE.md"
move_if_exists "DEPLOY_SPACESHIP_ONLY.md"
move_if_exists "DEPLOY_TO_RELEYE.md"
move_if_exists "DEPLOYMENT_ARCHITECTURE_ANALYSIS.md"
move_if_exists "DEPLOYMENT_CHECKLIST.md"
move_if_exists "DEPLOYMENT_COMPATIBILITY.md"
move_if_exists "DEPLOYMENT_FIX.md"
move_if_exists "DEPLOYMENT_FIX_STORAGE.md"
move_if_exists "DEPLOYMENT_INDEX.md"
move_if_exists "DEPLOYMENT_README.md"
move_if_exists "DEPLOYMENT_READY.md"
move_if_exists "DEPLOYMENT_START_HERE.md"
move_if_exists "DEPLOYMENT_SUMMARY.md"
move_if_exists "DEPLOYMENT.md"
move_if_exists "MYSQL_BACKEND_SUMMARY.md"
move_if_exists "MYSQL_DEPLOYMENT_GUIDE.md"
move_if_exists "MYSQL_MIGRATION.md"
move_if_exists "PAGES_DEPLOYMENT_CHECKLIST.md"
move_if_exists "QUICKSTART_DEPLOY.md"
move_if_exists "QUICK_DEPLOY.md"
move_if_exists "QUICK_START.md"
move_if_exists "SIMPLE_CHECKLIST.md"
move_if_exists "SPACESHIP_DEPLOYMENT.md"
move_if_exists "SPACESHIP_ONLY_DEPLOYMENT.md"
move_if_exists "START_HERE_DEPLOYMENT.md"
move_if_exists "START_HERE.md"
move_if_exists "URGENT_READ_ME.md"
move_if_exists "WHICH_GUIDE.md"
move_if_exists "WHERE_TO_TEST.md"
move_if_exists "README_DEPLOYMENT.md"

echo ""
echo "Moving bug fix and troubleshooting logs..."
move_if_exists "AUTH_FIX.md"
move_if_exists "AUTH_PERSISTENCE_FIX.md"
move_if_exists "BACKEND_TEST_CHECKLIST.md"
move_if_exists "BUG_FIXES.md"
move_if_exists "BYPASS_INSTRUCTIONS.md"
move_if_exists "BYPASS_REMOVAL_QUICK_REF.md"
move_if_exists "CANVAS_REFRESH_FIX.md"
move_if_exists "CLEANUP_SUMMARY.md"
move_if_exists "CODE_OPTIMIZATION_SUMMARY.md"
move_if_exists "COLOR_AUDIT_FIX.md"
move_if_exists "COLOR_SYSTEM_FIX.md"
move_if_exists "COMPLETE_RESTORATION.md"
move_if_exists "COMPREHENSIVE_BUG_FIXES.md"
move_if_exists "CRITICAL_BUGS_FIXED.md"
move_if_exists "CRITICAL_SECURITY_FIX.md"
move_if_exists "CROSS_BROWSER_AUTH_FIX.md"
move_if_exists "DEPLOYED_STORAGE_FIX.md"
move_if_exists "DOWNLOAD_FIXES.md"
move_if_exists "FIXES_APPLIED.md"
move_if_exists "FIX_BLACK_SCREEN.md"
move_if_exists "GRID_SETTINGS_FIX.md"
move_if_exists "INVITE_FLOW_FIX.md"
move_if_exists "LIVE_PREVIEW_FIX.md"
move_if_exists "QUICK_FIX_404.md"
move_if_exists "README_API_404.md"
move_if_exists "SETTINGS_FIX.md"
move_if_exists "STORAGE_FIX.md"
move_if_exists "STORAGE_MIGRATION.md"

echo ""
echo "Moving obsolete architecture docs..."
move_if_exists "AUTHENTICATION_ARCHITECTURE_OVERHAUL.md"
move_if_exists "AUTHENTICATION_FLOW.md"
move_if_exists "AUTHENTICATION_SIMPLIFICATION.md"
move_if_exists "AUTH_CLOUD_STORAGE_EXPLANATION.md"
move_if_exists "CLOUD_STORAGE_MIGRATION.md"
move_if_exists "MULTIUSER_ARCHITECTURE_CLEANUP.md"
move_if_exists "RESTORE_AUTHENTICATION.md"
move_if_exists "STORAGE_ARCHITECTURE.md"

echo ""
echo "Moving obsolete design docs..."
move_if_exists "AETHERLINK_DESIGN_SYSTEM.md"
move_if_exists "CSS_STRUCTURE.md"
move_if_exists "WINDOWS_ICON_SETUP.md"

echo ""
echo "Moving other historical files..."
move_if_exists "BACKEND_API_TESTING.md"
move_if_exists "COMPREHENSIVE_SECURITY_ANALYSIS.md"
move_if_exists "DEBUGGING.md"
move_if_exists "DIAGNOSTIC.md"
move_if_exists "IMPROVEMENT_SUGGESTIONS.md"
move_if_exists "INVESTIGATION_SETUP.md"
move_if_exists "PERFORMANCE_REFACTOR_PLAN.md"
move_if_exists "SECURITY_AUDIT.md"
move_if_exists "analysis-review.md"

echo ""
echo "================================"
echo "✨ Cleanup complete!"
echo "📦 Moved $COUNT files to docs-archive/"
echo ""
echo "Current documentation is now organized in:"
echo "  - README.md (overview)"
echo "  - DOCUMENTATION_INDEX.md (index)"
echo "  - PRD.md, ARCHITECTURE.md, DESIGN_SYSTEM.md (core docs)"
echo "  - DEPLOYMENT_GUIDE.md, CPANEL_QUICK_START.md (deployment)"
echo "  - LOCAL_DEVELOPMENT.md, TESTING_GUIDE.md (development)"
echo "  - SECURITY.md, CREDENTIAL_ARCHITECTURE.md (security)"
echo ""
echo "📚 Historical docs preserved in: docs-archive/"
