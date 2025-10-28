# FIX BLACK SCREEN ON releye.boestad.com

## The #1 Most Common Issue: Wrong Pages Source

If you see a black screen at releye.boestad.com, **90% chance** it's this:

### GO TO GITHUB NOW:

1. **Your Repository** → **Settings** → **Pages**

2. Look for **"Build and deployment"** section

3. Under **"Source"**, it probably says:
   - ❌ "Deploy from a branch" 
   
   **THIS IS WRONG!**

4. **Change it to:**
   - ✅ **"GitHub Actions"**

5. Click **Save** if needed

6. Go to **Actions** tab → Click **"Run workflow"** → **"Run workflow"** button

7. Wait 3 minutes, then visit https://releye.boestad.com

---

## The #2 Most Common Issue: DNS Not Configured

If the above didn't fix it, check your DNS at your domain registrar:

### Quick DNS Test
```bash
dig releye.boestad.com
```

**Should show either:**
- CNAME pointing to `[your-github-username].github.io`, OR
- A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153

**If DNS is wrong**, add this at your domain registrar:
```
Type: CNAME
Name: releye
Value: [your-github-username].github.io
```

DNS can take up to 48 hours to propagate.

---

## The #3 Most Common Issue: Workflow Failed

1. Go to **Actions** tab
2. Check if the latest workflow has a red X (failed)
3. Click on it to see the error
4. If build failed, run locally to debug:
   ```bash
   npm install
   npm run build
   ```

---

## Still Not Working?

### Check All These:

1. **Pages Settings**:
   - [ ] Source: "GitHub Actions" ✓
   - [ ] Custom domain: "releye.boestad.com" ✓
   - [ ] DNS check: Green checkmark ✓

2. **Actions Tab**:
   - [ ] Latest workflow: Green checkmark ✓
   - [ ] No errors in build logs ✓

3. **DNS**:
   - [ ] Configured at registrar ✓
   - [ ] Propagated (check with `dig`) ✓

4. **Browser**:
   - [ ] Hard reload: Ctrl+Shift+R ✓
   - [ ] Check Console (F12) for errors ✓
   - [ ] Check Network tab for 404s ✓

---

## Quick Reference Commands

```bash
# Check DNS
dig releye.boestad.com

# Check from Google DNS
nslookup releye.boestad.com 8.8.8.8

# Test build locally
npm install
npm run build
npm run preview
# Visit http://localhost:4173

# Force new deployment
git commit --allow-empty -m "Force deploy"
git push origin main
```

---

## Need More Help?

See `PAGES_DEPLOYMENT_CHECKLIST.md` for complete step-by-step guide.

**The issue is almost certainly one of these three. Check them in order!**
