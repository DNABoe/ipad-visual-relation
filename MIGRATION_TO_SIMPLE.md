# Migration to Simplified Architecture

## What Changed

RelEye has been simplified from a complex two-component architecture to a single GitHub Pages deployment.

### Old Architecture (Complex)
- ❌ Separate Node.js/Express backend server
- ❌ PostgreSQL database setup and management
- ❌ API endpoint configuration
- ❌ Server hosting and maintenance
- ❌ Database backups and migrations
- ❌ Complex deployment process

### New Architecture (Simple)
- ✅ Single GitHub Pages deployment
- ✅ Spark KV for user data (GitHub-backed)
- ✅ No server or database to manage
- ✅ Automatic scaling via GitHub
- ✅ Free hosting
- ✅ Simple deployment process

## Migration Steps

### If You Haven't Deployed Yet

Great news! You can skip all the backend setup documentation. Just follow:
1. [SIMPLE_DEPLOYMENT_GUIDE.md](./SIMPLE_DEPLOYMENT_GUIDE.md)

### If You Already Have a Backend Deployed

You can safely **decommission your backend server**:

1. **Deploy the new frontend** following [SIMPLE_DEPLOYMENT_GUIDE.md](./SIMPLE_DEPLOYMENT_GUIDE.md)
2. **Note**: Existing users in your PostgreSQL database will NOT be migrated
3. On first access, you'll go through first-time setup again
4. Invite users again using the new system
5. Once verified working, you can shut down your backend server
6. **Important**: Network files were always stored locally, so no data loss there

### Data Migration (Optional)

If you need to preserve existing users from your PostgreSQL database:

1. Export users from PostgreSQL:
```sql
SELECT user_id, email, name, role, password_hash, created_at, login_count, can_investigate
FROM users;
```

2. Create a migration script (not included) that:
   - Converts PostgreSQL data to RegisteredUser format
   - Uses `spark.kv.set('releye-users', users)` to import
   - Can be run once in browser console

3. Or simply re-create admin account and re-invite users (simpler approach)

## What Stays the Same

- **Network files**: Still stored locally in browser localStorage
- **Encryption**: Still AES-256-GCM
- **File format**: .enc.releye files are unchanged
- **User interface**: Identical functionality
- **Multi-user features**: Invites, roles, permissions all work the same
- **Security**: Same password hashing, encryption standards

## Benefits of Migration

1. **Simpler Deployment**: One command vs. server setup
2. **No Maintenance**: GitHub handles infrastructure
3. **Better Reliability**: GitHub Pages uptime
4. **Cost Savings**: No server hosting costs
5. **Easier Updates**: Push to main branch = deployed
6. **Scales Automatically**: GitHub handles traffic

## Files You Can Ignore/Delete

All these backend-related files are no longer needed:

```
api-server-example.js
api-server-mysql.js
api-package.json
api-package-mysql.json
api-env.example
api-env-mysql.example
database-setup.sql
database-setup-mysql.sql
docker-compose.yml
docker-compose.production.yml
Dockerfile.api
deploy-backend.sh
deploy-mysql-backend.sh
deploy-with-docker.sh
auto-deploy-backend.sh
verify-deployment.sh
verify-deployment.bat
test-cloud-api.sh
php-backend/ (entire directory)
```

Documentation files you can ignore:
```
BACKEND_*.md
CLOUD_*.md
CPANEL_*.md
DEPLOYMENT_*.md (except new guide)
MYSQL_*.md
API_*.md
AUTH_*_FIX.md
URGENT_READ_ME.md
(and many others - see docs-archive/)
```

## Troubleshooting After Migration

### "Cannot connect to API" errors
- These error messages are from old code
- They can be safely ignored
- The app works without backend API now

### Users can't log in
- First-time setup creates new admin
- Re-invite users via new invite system
- Old PostgreSQL users won't auto-migrate

### Network files missing
- Network files were always stored locally
- They remain in browser localStorage
- No migration needed for network data

## Questions?

See [SIMPLE_DEPLOYMENT_GUIDE.md](./SIMPLE_DEPLOYMENT_GUIDE.md) for deployment help.
