@echo off
REM RelEye Deployment Verification Script (Windows)
REM This script checks all deployment prerequisites

echo.
echo RelEye Deployment Verification
echo ==================================
echo.

set ERRORS=0
set WARNINGS=0

echo Checking Required Files...
echo.

REM Check workflow file
if exist ".github\workflows\deploy.yml" (
    echo [OK] .github\workflows\deploy.yml exists
) else (
    echo [ERROR] .github\workflows\deploy.yml MISSING
    set /a ERRORS+=1
)

REM Check CNAME file
if exist "CNAME" (
    echo [OK] CNAME exists
) else (
    echo [ERROR] CNAME MISSING in root
    set /a ERRORS+=1
)

if exist "public\CNAME" (
    echo [OK] public\CNAME exists
) else (
    echo [WARN] public\CNAME missing
    set /a WARNINGS+=1
)

REM Check .nojekyll files
if exist ".nojekyll" (
    echo [OK] .nojekyll exists
) else (
    echo [ERROR] .nojekyll MISSING in root
    set /a ERRORS+=1
)

if exist "public\.nojekyll" (
    echo [OK] public\.nojekyll exists
) else (
    echo [WARN] public\.nojekyll missing
    set /a WARNINGS+=1
)

REM Check vite config
if exist "vite.config.ts" (
    echo [OK] vite.config.ts exists
) else (
    echo [ERROR] vite.config.ts MISSING
    set /a ERRORS+=1
)

REM Check package.json
if exist "package.json" (
    echo [OK] package.json exists
) else (
    echo [ERROR] package.json MISSING
    set /a ERRORS+=1
)

REM Check index.html
if exist "index.html" (
    echo [OK] index.html exists
) else (
    echo [ERROR] index.html MISSING
    set /a ERRORS+=1
)

echo.
echo Checking Build Configuration...
echo.

REM Check if node_modules exists
if exist "node_modules" (
    echo [OK] node_modules exists
) else (
    echo [WARN] node_modules missing - run 'npm install'
    set /a WARNINGS+=1
)

echo.
echo ==================================
echo Summary
echo ==================================
echo.

if %ERRORS%==0 (
    if %WARNINGS%==0 (
        echo [OK] All checks passed!
        echo.
        echo Your deployment configuration looks good.
        echo.
        echo Next steps:
        echo 1. Ensure GitHub Pages source is set to 'GitHub Actions'
        echo    ^(Settings - Pages - Source - GitHub Actions^)
        echo.
        echo 2. Push to trigger deployment:
        echo    git add .
        echo    git commit -m "Deploy RelEye"
        echo    git push origin main
        echo.
        echo 3. Check Actions tab on GitHub for build status
        echo.
        echo 4. Visit https://releye.boestad.com after ~3 minutes
    ) else (
        echo [WARN] %WARNINGS% warning(s) found
        echo.
        echo Warnings are usually not critical.
        echo You can probably proceed with deployment.
    )
) else (
    echo [ERROR] %ERRORS% error(s) found
    if %WARNINGS% GTR 0 (
        echo [WARN] %WARNINGS% warning(s) found
    )
    echo.
    echo Fix the errors above before deploying.
    echo See DEPLOYMENT_START_HERE.md for help.
)

echo.
pause
