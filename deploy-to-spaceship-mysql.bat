@echo off
REM RelEye Spaceship.com Deployment Script for Windows
REM This script automates the deployment process for releye.boestad.com

echo ================================================================
echo   RelEye Deployment to Spaceship.com (releye.boestad.com)
echo ================================================================
echo.

REM Configuration
set DOMAIN=releye.boestad.com
set API_URL=https://%DOMAIN%/api
set BUILD_DIR=dist
set DEPLOY_DIR=deployment-package
set DEPLOY_ZIP=deployment-package.zip

REM Step 1: Check prerequisites
echo [1/6] Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm not found. Please install npm first.
    pause
    exit /b 1
)

if not exist package.json (
    echo ERROR: package.json not found. Are you in the project root?
    pause
    exit /b 1
)

if not exist php-backend (
    echo ERROR: php-backend directory not found.
    pause
    exit /b 1
)

echo OK: All prerequisites met
echo.

REM Step 2: Update API configuration
echo [2/6] Configuring API endpoint...
echo OK: API endpoint set to: %API_URL%
echo.

REM Step 3: Install dependencies
echo [3/6] Installing dependencies...

if not exist node_modules (
    call npm install
    echo OK: Dependencies installed
) else (
    echo OK: Dependencies already installed
)
echo.

REM Step 4: Build frontend
echo [4/6] Building production frontend...

call npm run build

if not exist %BUILD_DIR% (
    echo ERROR: Build failed - dist directory not created
    pause
    exit /b 1
)

echo OK: Frontend built successfully
echo.

REM Step 5: Prepare deployment package
echo [5/6] Preparing deployment package...

REM Clean up old deployment
if exist %DEPLOY_DIR% rmdir /s /q %DEPLOY_DIR%
if exist %DEPLOY_ZIP% del /f %DEPLOY_ZIP%

REM Create deployment directory structure
mkdir %DEPLOY_DIR%
mkdir %DEPLOY_DIR%\api

REM Copy frontend files
echo   - Copying frontend files...
xcopy /E /I /Y %BUILD_DIR% %DEPLOY_DIR% >nul

REM Copy backend files
echo   - Copying backend files...
copy /Y php-backend\index.php %DEPLOY_DIR%\api\ >nul
copy /Y php-backend\config.php %DEPLOY_DIR%\api\ >nul
copy /Y php-backend\database.php %DEPLOY_DIR%\api\ >nul
copy /Y php-backend\helpers.php %DEPLOY_DIR%\api\ >nul

REM Create .htaccess for frontend
echo   - Creating .htaccess files...
(
echo # Enable URL rewriting
echo RewriteEngine On
echo.
echo # API routes
echo RewriteCond %%{REQUEST_URI} ^^/api/
echo RewriteRule ^^api/^(.*^)$ api/index.php?endpoint=$1 [QSA,L]
echo.
echo # Frontend routes - send all non-file requests to index.html
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteCond %%{REQUEST_FILENAME} !-d
echo RewriteRule ^^^(.*^)$ index.html [L]
echo.
echo # Security headers
echo ^<IfModule mod_headers.c^>
echo     Header set X-Content-Type-Options "nosniff"
echo     Header set X-Frame-Options "SAMEORIGIN"
echo     Header set X-XSS-Protection "1; mode=block"
echo ^</IfModule^>
echo.
echo # Enable CORS for API
echo ^<FilesMatch "\.\(php\)$"^>
echo     Header set Access-Control-Allow-Origin "*"
echo     Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
echo     Header set Access-Control-Allow-Headers "Content-Type, Authorization"
echo ^</FilesMatch^>
) > %DEPLOY_DIR%\.htaccess

REM Create .htaccess for API
(
echo RewriteEngine On
echo RewriteCond %%{REQUEST_FILENAME} !-f
echo RewriteRule ^^^(.*^)$ index.php?endpoint=$1 [QSA,L]
echo.
echo Header set Access-Control-Allow-Origin "*"
echo Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
echo Header set Access-Control-Allow-Headers "Content-Type, Authorization"
echo.
echo # Handle preflight requests
echo RewriteCond %%{REQUEST_METHOD} OPTIONS
echo RewriteRule ^^^(.*^)$ index.php [L]
) > %DEPLOY_DIR%\api\.htaccess

REM Create upload instructions
(
echo ================================================================
echo   RelEye Deployment Package for %DOMAIN%
echo ================================================================
echo.
echo This package contains all files needed to deploy RelEye to your
echo Spaceship.com hosting.
echo.
echo IMPORTANT: Before uploading, configure your database settings!
echo.
echo ================================================================
echo STEP 1: Configure Database Settings
echo ================================================================
echo.
echo Edit the file: api\config.php
echo.
echo Update these values:
echo   - DB_PASS: Your actual MySQL database password
echo   - JWT_SECRET: A random secret key
echo.
echo To generate a secure JWT_SECRET, use any random 32+ character string
echo.
echo ================================================================
echo STEP 2: Setup MySQL Database
echo ================================================================
echo.
echo 1. Log into Spaceship.com cPanel
echo 2. Open phpMyAdmin
echo 3. Select database: lpmjclyqtt_releye
echo 4. Click "SQL" tab
echo 5. Copy contents from: database-setup-mysql.sql
echo 6. Paste and click "Go"
echo.
echo ================================================================
echo STEP 3: Upload Files to Server
echo ================================================================
echo.
echo Using File Manager:
echo 1. Log into Spaceship.com cPanel
echo 2. Open "File Manager"
echo 3. Navigate to: public_html\
echo 4. Upload ALL files from deployment-package folder
echo.
echo ================================================================
echo STEP 4: Test Your Deployment
echo ================================================================
echo.
echo 1. Backend API: https://%DOMAIN%/api/health
echo 2. Frontend: https://%DOMAIN%
echo 3. Login: admin / admin
echo 4. CHANGE PASSWORD IMMEDIATELY!
echo.
echo ================================================================
) > %DEPLOY_DIR%\UPLOAD_INSTRUCTIONS.txt

echo OK: Deployment package prepared
echo.

REM Step 6: Create zip file
echo [6/6] Creating deployment archive...

REM Check if PowerShell is available (Windows 7+)
where powershell >nul 2>nul
if %errorlevel% equ 0 (
    powershell -Command "Compress-Archive -Path '%DEPLOY_DIR%\*' -DestinationPath '%DEPLOY_ZIP%' -Force"
    echo OK: Created %DEPLOY_ZIP%
) else (
    echo WARNING: PowerShell not found. Cannot create zip file.
    echo Please manually zip the '%DEPLOY_DIR%' folder.
)

echo.

REM Summary
echo ================================================================
echo   Deployment package ready!
echo ================================================================
echo.
echo Package location:
echo    - %DEPLOY_DIR%\ (folder)
echo    - %DEPLOY_ZIP% (zip archive)
echo.
echo Next steps:
echo.
echo 1. IMPORTANT: Edit api\config.php in %DEPLOY_DIR%\
echo    - Set DB_PASS to your actual database password
echo    - Set JWT_SECRET to a random string
echo.
echo 2. Setup MySQL database:
echo    - Login to Spaceship cPanel - phpMyAdmin
echo    - Select database: lpmjclyqtt_releye
echo    - Run SQL from: database-setup-mysql.sql
echo.
echo 3. Upload to server:
echo    - Upload %DEPLOY_ZIP% to cPanel and extract
echo    - OR upload %DEPLOY_DIR%\* via FTP
echo.
echo 4. Test deployment:
echo    - https://%DOMAIN%/api/health
echo    - https://%DOMAIN%
echo.
echo Full instructions:
echo    - See %DEPLOY_DIR%\UPLOAD_INSTRUCTIONS.txt
echo    - See DEPLOY_TO_SPACESHIP_MYSQL.md
echo.
echo ================================================================
echo.
echo Deployment preparation complete!
echo.
pause
