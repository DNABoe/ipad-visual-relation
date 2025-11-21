# GitHub Pages Deployment Checklist for releye.boestad.com

## Prerequisites Verification

- [ ] You have admin access to the GitHub repository
- [ ] You have access to DNS settings for boestad.com domain
- [ ] Node.js 20+ is available (for local testing)

## Part 1: GitHub Repository Settings

### Actions Configuration
1. [ ] Go to repository **Settings**
2. [ ] Click **Actions** in left sidebar
3. [ ] Click **General**
4. [ ] Scroll to "Workflow permissions"
5. [ ] Select **"Read and write permissions"**
6. [ ] Check **"Allow GitHub Actions to create and approve pull requests"**
7. [ ] Click **Save**

### Pages Configuration (CRITICAL)
1. [ ] Go to repository **Settings**
2. [ ] Click **Pages** in left sidebar
3. [ ] Under "Build and deployment":
   - **Source**: Select **"GitHub Actions"** (NOT "Deploy from a branch")
   - This is the most common mistake - must be GitHub Actions!
4. [ ] Under "Custom domain":
   - [ ] Enter: `releye.boestad.com`
   - [ ] Click **Save**
   - [ ] Wait for DNS check (may show pending - that's OK for now)
5. [ ] Under "Enforce HTTPS":
   - [ ] This will be enabled automatically after DNS verification
   - [ ] Don't worry if it's not available immediately

## Part 2: DNS Configuration

### At Your Domain Registrar (boestad.com)

**For custom subdomain (releye.boestad.com), use A records:**

1. [ ] Log into your domain registrar's DNS management
2. [ ] Add ALL FOUR A records:
   - Type: A, Name: `releye`, Value: `185.199.108.153`, TTL: 3600
   - Type: A, Name: `releye`, Value: `185.199.109.153`, TTL: 3600
   - Type: A, Name: `releye`, Value: `185.199.110.153`, TTL: 3600
   - Type: A, Name: `releye`, Value: `185.199.111.153`, TTL: 3600
3. [ ] Save all DNS records

**Note:** GitHub Pages custom domains require A records pointing to GitHub's IP addresses. CNAME records only work for apex domains (boestad.com) or when using www subdomain.

### Verify DNS Configuration
```bash
# Wait 5-10 minutes after DNS changes, then run:
dig releye.boestad.com

# You should see A records showing the GitHub IPs above
```

## Part 3: Repository Files Verification

### Check Required Files Exist
1. [ ] `.github/workflows/deploy.yml` exists
2. [ ] `CNAME` file exists in root with content: `releye.boestad.com`
3. [ ] `.nojekyll` file exists in root
4. [ ] `vite.config.ts` has `base: "/"`
5. [ ] `package.json` has build script
6. [ ] `public/CNAME` exists with content: `releye.boestad.com`
7. [ ] `public/.nojekyll` exists

All these files are already configured - just verify they haven't been deleted.

## Part 4: Trigger Deployment

### Manual Workflow Trigger (Recommended for First Deploy)
1. [ ] Go to repository **Actions** tab
2. [ ] Click "Deploy to GitHub Pages" workflow in left sidebar
3. [ ] Click **"Run workflow"** button (top right)
4. [ ] Select `main` branch
5. [ ] Click green **"Run workflow"** button
6. [ ] Wait for workflow to start (refreshes in ~5 seconds)

### OR Push to Trigger Automatic Deploy
```bash
# Make a small change (or empty commit)
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

## Part 5: Monitor Deployment

### Watch GitHub Actions
1. [ ] Go to **Actions** tab
2. [ ] Click on the running workflow
3. [ ] Watch the **build** job:
   - [ ] Checkout ✓
   - [ ] Setup Node ✓
   - [ ] Install dependencies ✓
   - [ ] Build ✓
   - [ ] Copy CNAME to dist ✓
   - [ ] Copy .nojekyll to dist ✓
   - [ ] Upload artifact ✓
4. [ ] Watch the **deploy** job:
   - [ ] Deploy to GitHub Pages ✓

### Expected Timeline
- Build job: 2-3 minutes
- Deploy job: 30-60 seconds
- Total: ~3-4 minutes

## Part 6: Verification

### Immediate (After Workflow Completes)
1. [ ] Go to **Settings** → **Pages**
2. [ ] You should see: "Your site is published at https://releye.boestad.com"
   - Note: May show "Your site is ready to be published" if DNS not propagated yet
3. [ ] Check the green checkmark next to custom domain
   - If red X, DNS not configured correctly yet

### After DNS Propagation (15 min - 48 hours)
1. [ ] Visit `https://releye.boestad.com`
2. [ ] Verify the site loads (not GitHub 404 page)
3. [ ] Check browser console for errors (F12 → Console)
4. [ ] Test the application functionality:
   - [ ] Login screen appears
   - [ ] Can create/load networks
   - [ ] No asset loading errors (404s)

### DNS Propagation Check
```bash
# Check from different DNS servers
nslookup releye.boestad.com 8.8.8.8
nslookup releye.boestad.com 1.1.1.1

# Or use online tools:
# https://dnschecker.org/#A/releye.boestad.com
# https://www.whatsmydns.net/#A/releye.boestad.com
```

## Part 7: Enable HTTPS (After DNS Works)

1. [ ] Go to **Settings** → **Pages**
2. [ ] Wait for "Enforce HTTPS" checkbox to become available
3. [ ] Check **"Enforce HTTPS"**
4. [ ] Wait 10-20 minutes for certificate provisioning
5. [ ] Verify `https://releye.boestad.com` works

## Troubleshooting Common Issues

### Issue: Black Screen / White Screen
**Likely causes:**
- [ ] Check browser console (F12) for errors
- [ ] Verify `vite.config.ts` has `base: "/"`
- [ ] Check Network tab - are assets loading? (200 OK?)
- [ ] Clear browser cache and hard reload (Ctrl+Shift+R)

### Issue: GitHub 404 Page
**Likely causes:**
- [ ] Pages source is set to "GitHub Actions" (not branch)
- [ ] Workflow completed successfully
- [ ] CNAME file exists in deployed `dist` folder
- [ ] DNS is propagated (check with `dig` command)

### Issue: "DNS check failed" in Pages Settings
**Likely causes:**
- [ ] DNS not configured at registrar
- [ ] DNS not propagated yet (wait 1-24 hours)
- [ ] Wrong DNS record type or value
- [ ] CNAME file content doesn't match custom domain

### Issue: Workflow Fails at Build Step
**Likely causes:**
- [ ] Check Actions logs for specific error
- [ ] Test build locally: `npm install && npm run build`
- [ ] Check for TypeScript errors
- [ ] Verify all dependencies are in package.json

### Issue: Assets Return 404
**Likely causes:**
- [ ] Wrong `base` in vite.config.ts
- [ ] Assets not in `public` or `src/assets` folders
- [ ] Import paths incorrect (should use `@/` alias)

### Issue: Custom Domain Keeps Resetting
**Likely causes:**
- [ ] CNAME file missing from build output
- [ ] Workflow not copying CNAME to dist folder
- [ ] Check workflow has "Copy CNAME to dist" step

## Testing Locally Before Deploy

```bash
# Install dependencies
npm install

# Build production version
npm run build

# Preview production build locally
npm run preview

# Visit http://localhost:4173 and test thoroughly
```

## After Successful Deployment

### Ongoing Maintenance
- [ ] Every push to `main` auto-deploys (2-3 min delay)
- [ ] Monitor Actions tab for failed builds
- [ ] Keep dependencies updated (`npm update`)
- [ ] Check https://www.githubstatus.com for GitHub outages

### Performance Monitoring
- [ ] Test with Lighthouse (F12 → Lighthouse tab)
- [ ] Target: Performance 90+
- [ ] Check loading time on 4G network
- [ ] Verify mobile responsiveness

### Security
- [ ] HTTPS enforced ✓
- [ ] All data stored client-side ✓
- [ ] No secrets in repository ✓
- [ ] Regular dependency updates

## Emergency Rollback

If deployment breaks the site:

```bash
# Option 1: Revert last commit
git revert HEAD
git push origin main

# Option 2: Deploy specific working commit
git log  # find working commit hash
git checkout <commit-hash>
git push -f origin main  # force push (use carefully)

# Option 3: Stop auto-deployment
# Disable workflow in: .github/workflows/deploy.yml
# Or disable in Settings → Actions
```

## Support Resources

- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **Custom Domain Docs**: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
- **Vite Deployment Guide**: https://vitejs.dev/guide/static-deploy.html
- **GitHub Status**: https://www.githubstatus.com
- **DNS Checker**: https://dnschecker.org

## Summary - Most Common Mistake

**90% of "black screen" issues are caused by:**

1. Pages source set to "Deploy from a branch" instead of "GitHub Actions"
2. DNS not properly configured or not propagated yet
3. Missing CNAME file in build output
4. Wrong `base` path in vite.config.ts

**Always check these four things first!**

---

**Last Updated**: 2024  
**Version**: Beta 0.5  
**Maintained by**: D Boestad
