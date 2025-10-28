# RelEye Deployment Checklist

## ✅ Files Ready for Deployment

All necessary files are configured and ready:

- [x] `.github/workflows/deploy.yml` - GitHub Actions workflow for auto-deployment
- [x] `public/CNAME` - Custom domain configuration (releye.boestad.com)
- [x] `public/.nojekyll` - Ensures GitHub Pages serves all files correctly
- [x] `vite.config.ts` - Configured with correct base path and build settings
- [x] `README.md` - Complete documentation with deployment instructions
- [x] `DEPLOYMENT.md` - Detailed deployment guide
- [x] `.gitignore` - Properly configured (dist folder ignored)

## 📋 Pre-Deployment Checklist

Before pushing to GitHub:

- [ ] All files committed to repository
- [ ] Repository pushed to GitHub
- [ ] Repository is public (or you have GitHub Pages enabled for private repos)

## 🔧 GitHub Configuration Steps

### 1. Enable GitHub Actions
1. Go to repository **Settings** → **Actions** → **General**
2. Under "Workflow permissions":
   - ✅ Select "Read and write permissions"
   - ✅ Check "Allow GitHub Actions to create and approve pull requests"
3. Click **Save**

### 2. Configure GitHub Pages
1. Go to **Settings** → **Pages**
2. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `gh-pages` → `/ (root)`
   - Click **Save**
3. Under "Custom domain":
   - Enter: `releye.boestad.com`
   - Wait for DNS check
   - ✅ Enable "Enforce HTTPS" (after DNS verification)

### 3. Configure DNS at Domain Registrar

Go to your domain registrar (where you manage boestad.com) and add:

**CNAME Record** (Recommended):
```
Type: CNAME
Name: releye
Value: [your-github-username].github.io
TTL: 3600
```

**OR A Records** (Alternative):
```
Type: A
Name: releye
Value: 185.199.108.153

Type: A
Name: releye
Value: 185.199.109.153

Type: A
Name: releye
Value: 185.199.110.153

Type: A
Name: releye
Value: 185.199.111.153
```

## 🚀 Deploy

Once configured, deployment happens automatically:

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Configure deployment"
   git push origin main
   ```

2. **Monitor deployment**:
   - Go to **Actions** tab in GitHub
   - Watch "Deploy to GitHub Pages" workflow
   - Should complete in 2-3 minutes

3. **Verify**:
   - Check **Settings** → **Pages** for live URL
   - Visit https://releye.boestad.com
   - Note: DNS may take 15 min - 48 hours to propagate

## 🔍 Verification Steps

### Check DNS Propagation
```bash
dig releye.boestad.com
nslookup releye.boestad.com
```

Or use online tool: https://dnschecker.org

### Check Deployment Status
1. **Actions Tab**: See workflow runs and status
2. **Settings → Pages**: Verify domain and HTTPS
3. **Browser**: Visit https://releye.boestad.com

### Test Application
- [ ] Login page loads
- [ ] Can create new network
- [ ] Can add persons
- [ ] Can save and load networks
- [ ] All features working
- [ ] No console errors

## 🐛 Common Issues & Solutions

### Workflow Fails
**Solution**: Check Actions tab → Click workflow → View logs
- Usually TypeScript or build errors
- Fix locally and push again

### 404 Page Not Found
**Solution**: Check vite.config.ts has `base: "/"`

### Assets Not Loading
**Solution**: 
- Ensure `public/CNAME` exists
- Verify `public/.nojekyll` exists
- Check browser console for errors

### Custom Domain Not Working
**Solution**:
1. Verify DNS records at registrar
2. Wait for DNS propagation (up to 48h)
3. Re-enter custom domain in GitHub Pages settings
4. Check CNAME file contains only: `releye.boestad.com`

### HTTPS Certificate Issues
**Solution**:
- Wait 10-20 minutes after DNS verification
- GitHub auto-provisions Let's Encrypt certificate
- Check "Enforce HTTPS" in Settings → Pages

## 📊 Post-Deployment

### Monitoring
- Check **Actions** tab for deployment history
- Review **Deployments** section for active deployments
- Monitor **Settings → Pages** for domain status

### Updates
Simply push to main branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

Auto-deployment happens within 2-3 minutes.

### Rollback
If needed:
```bash
git revert HEAD
git push origin main
```

## 📞 Support Resources

- **GitHub Pages Docs**: https://docs.github.com/en/pages
- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **GitHub Status**: https://www.githubstatus.com
- **DNS Checker**: https://dnschecker.org

## ✨ Success Criteria

Your deployment is successful when:

- ✅ GitHub Actions workflow completes without errors
- ✅ Settings → Pages shows "Your site is live"
- ✅ https://releye.boestad.com loads the application
- ✅ HTTPS certificate is active (🔒 in browser)
- ✅ All features work as expected
- ✅ No console errors in browser

---

**Need Help?** Review `DEPLOYMENT.md` for detailed troubleshooting.
