# DNS Configuration Guide for releye.boestad.com

## The Correct DNS Setup

For deploying a GitHub Pages site to a custom subdomain like `releye.boestad.com`, you **must use A records**, not CNAME records.

### Required DNS Records

At your domain registrar (Boestad.com), configure the following DNS records:

```
Type: A
Host: releye
Value: 185.199.108.153
TTL: 3600

Type: A
Host: releye
Value: 185.199.109.153
TTL: 3600

Type: A
Host: releye
Value: 185.199.110.153
TTL: 3600

Type: A
Host: releye
Value: 185.199.111.153
TTL: 3600
```

**You need all four A records** pointing to GitHub Pages' IP addresses.

## Why Not CNAME?

### ❌ INCORRECT (What was in the docs before)
```
Type: CNAME
Host: releye
Value: yourusername.github.io
```

### Why This Doesn't Work
- CNAME records for subdomains can cause issues with GitHub Pages custom domains
- GitHub's official documentation recommends A records for custom subdomains
- A records provide better reliability and performance
- CNAME records are primarily for apex domains or www subdomains

## Verification

After configuring DNS, verify with these commands:

```bash
# Check DNS propagation
dig releye.boestad.com

# Should show output like:
# releye.boestad.com.    3600    IN    A    185.199.108.153
# releye.boestad.com.    3600    IN    A    185.199.109.153
# releye.boestad.com.    3600    IN    A    185.199.110.153
# releye.boestad.com.    3600    IN    A    185.199.111.153
```

Or use online tools:
- https://dnschecker.org/#A/releye.boestad.com
- https://www.whatsmydns.net/#A/releye.boestad.com

## DNS Propagation Timeline

- **Immediately**: Your DNS provider sees the change
- **5-15 minutes**: Most DNS servers worldwide pick up the change
- **Up to 24 hours**: Some DNS servers may cache old records
- **Up to 48 hours**: Maximum theoretical propagation time (rare)

**Tip:** Clear your browser cache and try in incognito mode if you still see old content after DNS changes.

## Troubleshooting

### Issue: "DNS check failed" in GitHub Pages Settings

**Causes:**
1. DNS records not configured at registrar
2. DNS not propagated yet (wait 15-60 minutes)
3. Wrong record type (using CNAME instead of A)
4. Wrong IP addresses in A records

**Solution:**
1. Log into your domain registrar
2. Verify all four A records exist with correct IPs
3. Wait 15-30 minutes for propagation
4. Check DNS with `dig releye.boestad.com`

### Issue: Site loads at yourusername.github.io but not releye.boestad.com

**Causes:**
1. DNS not configured
2. CNAME file missing from repository
3. Custom domain not set in GitHub Pages settings

**Solution:**
1. Verify A records exist at registrar
2. Check that `/CNAME` file contains `releye.boestad.com`
3. Verify Settings → Pages → Custom domain is set
4. Re-run GitHub Actions workflow

### Issue: Certificate errors or "Not Secure" warning

**Causes:**
1. HTTPS not yet provisioned by GitHub
2. DNS recently changed (cert provisioning takes time)

**Solution:**
1. Wait 10-30 minutes after DNS propagation
2. Check "Enforce HTTPS" box in Settings → Pages
3. Wait another 10-20 minutes for certificate provisioning
4. Clear browser cache and reload

## Reference: When to Use CNAME vs A Records

### Use A Records (What We're Using) ✅
- **Custom subdomain**: releye.boestad.com → GitHub Pages
- **Most reliable** for GitHub Pages
- **Official recommendation** from GitHub

### Use CNAME Records (Other Scenarios)
- **Apex domain**: boestad.com → hosting provider
- **www subdomain**: www.boestad.com → boestad.com
- **When target is another domain** (not IP addresses)

## Official GitHub Pages Documentation

For more details, see:
- [Managing a custom domain for GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub Pages IP addresses](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain)

## Quick Reference

| Setting | Value |
|---------|-------|
| Record Type | A (IPv4 Address) |
| Host/Name | `releye` |
| IP Address 1 | `185.199.108.153` |
| IP Address 2 | `185.199.109.153` |
| IP Address 3 | `185.199.110.153` |
| IP Address 4 | `185.199.111.153` |
| TTL | `3600` (or default) |

---

**Last Updated:** January 2025  
**Purpose:** Correct DNS configuration for GitHub Pages custom subdomain deployment
