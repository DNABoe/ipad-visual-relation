#!/bin/bash

# RelEye FTP Upload Script (Optional - requires lftp)
# This script automates uploading to spaceship.com via FTP

echo "=================================================="
echo "  RelEye FTP Upload (Optional)"
echo "=================================================="
echo ""

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo "❌ lftp is not installed."
    echo ""
    echo "To install lftp:"
    echo "  • Ubuntu/Debian: sudo apt-get install lftp"
    echo "  • macOS: brew install lftp"
    echo "  • Windows: Use WSL or FileZilla GUI instead"
    echo ""
    echo "Alternatively, upload manually via cPanel File Manager."
    echo "See UPLOAD_INSTRUCTIONS.txt for details."
    exit 1
fi

# Check if deployment package exists
if [ ! -f "releye-deployment.zip" ]; then
    echo "❌ releye-deployment.zip not found!"
    echo ""
    echo "Please run the build script first:"
    echo "  ./deploy-standalone.sh"
    exit 1
fi

echo "This script requires your spaceship.com FTP credentials."
echo ""
echo "⚠️  IMPORTANT: This script is OPTIONAL!"
echo "You can also upload manually via cPanel File Manager."
echo "See UPLOAD_INSTRUCTIONS.txt for manual steps."
echo ""
read -p "Continue with FTP upload? (y/N): " CONTINUE

if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
    echo "Upload cancelled. Use manual upload via cPanel instead."
    exit 0
fi

echo ""
echo "Enter your spaceship.com FTP credentials:"
read -p "FTP Host (e.g., ftp.yourdomain.com): " FTP_HOST
read -p "FTP Username: " FTP_USER
read -sp "FTP Password: " FTP_PASS
echo ""
read -p "Remote directory (e.g., /public_html/releye): " REMOTE_DIR

echo ""
echo "Connecting to $FTP_HOST..."
echo ""

# Create FTP script
FTP_SCRIPT=$(cat << EOF
set ftp:ssl-allow no
open -u $FTP_USER,$FTP_PASS $FTP_HOST
cd $REMOTE_DIR
lcd dist
mirror --reverse --delete --verbose --exclude .git/ --exclude node_modules/
bye
EOF
)

# Execute FTP upload
echo "$FTP_SCRIPT" | lftp

if [ $? -eq 0 ]; then
    echo ""
    echo "=================================================="
    echo "  ✓ Upload Successful!"
    echo "=================================================="
    echo ""
    echo "Next steps:"
    echo "  1. Visit https://releye.boestad.com"
    echo "  2. Verify the site loads correctly"
    echo "  3. Test login and functionality"
    echo ""
else
    echo ""
    echo "=================================================="
    echo "  ❌ Upload Failed"
    echo "=================================================="
    echo ""
    echo "Please try manual upload via cPanel File Manager."
    echo "See UPLOAD_INSTRUCTIONS.txt for instructions."
    exit 1
fi
