# Deploying RelEye as a Standalone Application

This guide explains how to deploy RelEye outside the Spark runtime environment.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- A web server or hosting platform (optional for production)

## Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

## Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

   This creates an optimized production build in the `dist/` directory.

2. **Preview the build locally**
   ```bash
   npm run preview
   ```

## Deployment Options

### Option 1: Static Hosting (Recommended)

Deploy the `dist/` folder to any static hosting service:

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

#### GitHub Pages
```bash
# Build the project
npm run build

# Deploy to gh-pages branch
npx gh-pages -d dist
```

### Option 2: Traditional Web Server

Copy the `dist/` folder to your web server:

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Apache Configuration (.htaccess)
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Option 3: Docker

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t releye .
docker run -p 80:80 releye
```

## Important Considerations

### Storage Limitations

When running standalone, RelEye uses browser localStorage which has limitations:

- **Storage Limit**: Typically 5-10MB per domain
- **User-Specific**: Each user's data is stored locally in their browser
- **No Sync**: Data doesn't sync across devices
- **Clearable**: Users can clear browser data

### Feature Differences

| Feature | Spark Environment | Standalone |
|---------|------------------|------------|
| Network Visualization | ✅ | ✅ |
| Person/Group Management | ✅ | ✅ |
| File Attachments | ✅ | ✅ |
| Activity Logging | ✅ | ✅ |
| Export/Import | ✅ | ✅ |
| Data Persistence | Spark KV | localStorage |
| Investigation (AI) | ✅ GPT-4 | ⚠️ Template |
| Multi-User | ✅ | ❌ |
| Cross-Device Sync | ✅ | ❌ |

### User Authentication

The standalone version includes a single-user authentication system that:
- Stores credentials in localStorage
- Provides basic session management
- Does NOT include multi-user support
- Should NOT be used for sensitive production data

**For production use with real user data, deploy in the Spark environment.**

## Environment Variables

The application automatically detects its runtime environment. No configuration needed.

## Troubleshooting

### Build Errors

If you encounter errors about missing `@github/spark` dependencies:

1. The build system is designed to handle missing Spark packages gracefully
2. Ensure you're using Node 18+
3. Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

### Storage Errors

If users report storage issues:

1. Check browser console for localStorage errors
2. Advise users to enable cookies/storage in browser settings
3. Check that browser isn't in private/incognito mode
4. Verify storage quota isn't exceeded

### White Screen After Deployment

1. Check browser console for errors
2. Verify base path in `vite.config.ts` matches your deployment path
3. Ensure all assets are loading correctly (check Network tab)
4. Verify `.htaccess` or nginx config for SPA routing

## Performance Optimization

The production build is already optimized, but you can:

1. **Enable Compression** on your web server (gzip/brotli)
2. **Use CDN** for faster global delivery
3. **Enable Caching** for static assets
4. **Monitor Bundle Size** with `npm run build -- --stats`

## Security Considerations

When deploying standalone:

1. **Always use HTTPS** in production
2. **Set security headers** (CSP, X-Frame-Options, etc.)
3. **Don't store sensitive data** - localStorage is not encrypted
4. **Use file encryption** feature for exported networks
5. **Regular backups** - remind users to export their networks

## Support

For issues specific to standalone deployment, ensure:
- You're using the latest build
- Browser localStorage is enabled
- JavaScript is enabled
- Browser is up-to-date

For enhanced features and production use with sensitive data, deploy in the Spark environment.
