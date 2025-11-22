#!/bin/bash

# Cleanup script for removing 143 obsolete files from old MySQL/backend architecture
# Created after migration to Spark KV architecture

set -e

echo "=================================================="
echo "  RelEye Documentation Cleanup"
echo "  Removing obsolete MySQL/backend files"
echo "=================================================="
echo ""

# Counter
count=0
total=0

# Read files from list
while IFS= read -r file; do
  if [ -z "$file" ]; then
    continue
  fi
  
  total=$((total + 1))
  
  if [ -e "$file" ]; then
    if [ -d "$file" ]; then
      rm -rf "$file"
      echo "✓ Deleted directory: $file"
    else
      rm -f "$file"
      echo "✓ Deleted file: $file"
    fi
    count=$((count + 1))
  else
    echo "  Skipped (not found): $file"
  fi
done < OBSOLETE_FILES_TO_DELETE.txt

echo ""
echo "=================================================="
echo "  Cleanup Complete!"
echo "  Deleted: $count / $total files"
echo "=================================================="
echo ""
echo "Remaining documentation:"
echo "  ✓ README.md"
echo "  ✓ PRD.md"
echo "  ✓ DESIGN_SYSTEM.md"
echo "  ✓ AETHERLINK_DESIGN_SYSTEM.md"
echo "  ✓ STORAGE_ARCHITECTURE.md (current)"
echo "  ✓ WINDOWS_ICON_SETUP.md"
echo "  ✓ LICENSE"
echo "  ✓ CLEANUP_COMPLETE.md (summary)"
echo ""

# Clean up the cleanup files themselves
echo "Removing cleanup helper files..."
rm -f OBSOLETE_FILES_TO_DELETE.txt
rm -f CLEANUP_INSTRUCTIONS.md
rm -f cleanup-obsolete-docs.sh

echo "✓ Done!"
echo ""
