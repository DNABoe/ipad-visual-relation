# RelEye Deployment Guide

## Overview

RelEye is configured to automatically deploy to `releye.boestad.com` using GitHub Pages and GitHub Actions.

## Files Required for Deployment

All necessary files are already in place:

### 1. GitHub Actions Workflow
**Location**: `.github/workflows/deploy.yml`

This workflow:
- Triggers on every push to `main` branch
- Can also be manually triggered
- Builds the application using `npm run build`
- Deploys to GitHub Pages
- Uses Node.js 20 for consistency

### 2. CNAME File
**Location**: `CNAME` (root directory)

Contains: `releye.boestad.com`

This tells GitHub Pages to serve the site at your custom domain.

### 3. Vite Configuration
**Location**: `vite.config.ts`

Key settings:
- `base: "/"` - Ensures assets load correctly
- `outDir: "dist"` - Standard output directory for GitHub Pages
- `emptyOutDir: true` - Cleans before each build

### 4. Package.json Scripts
**Location**: `package.json`

Build script: `"build": "tsc -b --noCheck && vite build"`

## GitHub Repository Setup

### Step 1: Enable GitHub Actions

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Actions** → **General**
3. Under "Workflow permissions", select:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

### Step 2: Configure GitHub Pages

1. Go to **Settings** → **Pages**
2. Under "Build and deployment":
   - **Source**: **GitHub Actions** (NOT "Deploy from a branch")
   
   ⚠️ **CRITICAL**: Must select "GitHub Actions" as the source. This is the most common mistake that causes a black screen!

3. Under "Custom domain":
   - Enter: `releye.boestad.com`
   - Click **Save**
   - ✅ Enforce HTTPS (will be enabled after DNS verification)

### Step 3: Configure DNS

You need to configure DNS records at your domain registrar (where you manage boestad.com):

#### Option A: CNAME Record (Recommended)
```
Type: CNAME
Name: releye
Value: [your-github-username].github.io
TTL: 3600 (or auto)
```

#### Option B: A Records
If you prefer A records or need apex domain support:
```
Type: A
Name: releye
Value: 185.199.108.153
TTL: 3600

Type: A
Name: releye
Value: 185.199.109.153
TTL: 3600

Type: A
Name: releye
Value: 185.199.110.153
TTL: 3600

Type: A
Name: releye
Value: 185.199.111.153
TTL: 3600
```

### Step 4: Verify Deployment

1. Push to the `main` branch:
   ```bash
   git add .
   git commit -m "Configure deployment"
   git push origin main
   ```

2. Check the **Actions** tab in your repository
   - You should see the "Deploy to GitHub Pages" workflow running
   - Wait for it to complete (usually 2-3 minutes)

3. Once workflow completes:
   - Go back to **Settings** → **Pages**
   - You should see: "Your site is live at https://releye.boestad.com"

4. DNS propagation may take 15 minutes to 48 hours
   - Check with: `dig releye.boestad.com`
   - Or use: https://dnschecker.org

## Troubleshooting

### Build Fails

**Check the Actions log**:
1. Go to Actions tab
2. Click on the failed workflow
3. Check the build step logs

Common issues:
- TypeScript errors: The build script uses `--noCheck` flag, but severe errors may still fail
- Missing dependencies: Run `npm install` locally to verify
- Memory issues: GitHub Actions has 7GB RAM limit

### Assets Not Loading (404s)

**Check vite.config.ts**:
- Ensure `base: "/"` is set correctly
- If using a subdirectory, change to `base: "/subdirectory/"`

### Custom Domain Not Working

1. **Verify DNS**:
   ```bash
   dig releye.boestad.com
   nslookup releye.boestad.com
   ```

2. **Check CNAME file**:
   - Must be in root directory
   - Must contain only: `releye.boestad.com`
   - No http://, no trailing slash

3. **GitHub Pages Custom Domain**:
   - Go to Settings → Pages
   - Re-enter the custom domain if needed
   - Wait for DNS check to pass

### HTTPS Not Working

- HTTPS is automatically provisioned by GitHub
- May take 10-20 minutes after DNS verification
- Check "Enforce HTTPS" in Settings → Pages once available

## Manual Deployment

If you need to deploy manually without GitHub Actions:

1. Build locally:
   ```bash
   npm run build
   ```

2. Install gh-pages:
   ```bash
   npm install -g gh-pages
   ```

3. Deploy:
   ```bash
   gh-pages -d dist
   ```

## Environment-Specific Builds

The application uses `spark.kv` for local storage, which works client-side. No environment variables or backend configuration needed.

All encryption and data handling happens in the browser.

## Continuous Deployment

Every commit to `main` triggers automatic deployment:

1. Developer pushes to `main`
2. GitHub Actions workflow starts
3. Installs dependencies (`npm ci`)
4. Builds application (`npm run build`)
5. Uploads build artifacts
6. Deploys to GitHub Pages
7. Site is live at `https://releye.boestad.com`

Average deployment time: 2-3 minutes

## Security Considerations

### HTTPS
- Always enforced on GitHub Pages
- Automatic certificate from Let's Encrypt
- Renewed automatically

### Content Security
- All data processing happens client-side
- No server to secure
- Encryption keys never leave the user's device

### Deployment Security
- GitHub Actions uses secure, isolated runners
- Dependencies verified via package-lock.json
- No secrets needed for deployment

## Updates and Maintenance

### Updating Dependencies
```bash
npm update
npm audit fix
git add package*.json
git commit -m "Update dependencies"
git push
```

### Updating the Application
Simply commit and push changes to `main`:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

The site updates automatically within 2-3 minutes.

### Rollback
To rollback to a previous version:
```bash
git revert HEAD
git push origin main
```

Or redeploy a specific commit:
```bash
git checkout <commit-hash>
git push -f origin main
```

## Monitoring

### Check Deployment Status
- **Actions Tab**: See all deployments and their status
- **Settings → Pages**: Verify live URL and domain status
- **Deployments**: See deployment history

### View Logs
1. Go to Actions tab
2. Click on any workflow run
3. Expand build/deploy steps to see logs

## Performance

### Build Optimization
The production build:
- Minifies JavaScript and CSS
- Tree-shakes unused code
- Optimizes images
- Generates source maps (optional, currently disabled)

### Caching
GitHub Pages automatically:
- Caches static assets
- Uses CDN for global distribution
- Compresses content with gzip/brotli

### Expected Performance
- First Load: < 2s on 4G
- Time to Interactive: < 3s
- Lighthouse Score: 90+ (Performance)

## Support

For deployment issues:
- Check GitHub Actions logs
- Review GitHub Pages status: https://www.githubstatus.com
- Verify DNS configuration
- Check browser console for errors

---

**Last Updated**: 2024
**Maintained by**: D Boestad
