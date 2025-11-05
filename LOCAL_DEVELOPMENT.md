# Local Development Guide

This guide helps you set up RelEye for local development with cloud authentication.

## Quick Start with Docker

The easiest way to test cloud authentication locally is using Docker Compose.

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed

### Step 1: Start the Backend

```bash
docker-compose up -d
```

This will:
- Start PostgreSQL database on port 5432
- Run database migrations automatically
- Start API server on port 3000

Check if everything is running:
```bash
docker-compose ps
```

### Step 2: Start the Frontend

```bash
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### Step 3: Test the Setup

Visit `http://localhost:5173` in your browser. You should see the "First Time Setup" screen since this is a fresh database.

Create an admin account and start using the app!

### Verify Cloud Storage

Open browser console (F12) and look for:
```
[UserRegistry] Cloud storage: AVAILABLE ✓
```

If you see this, cloud authentication is working!

## Manual Setup (Without Docker)

### Step 1: Set Up PostgreSQL

Install PostgreSQL:
```bash
# macOS
brew install postgresql
brew services start postgresql

# Linux
sudo apt install postgresql
sudo systemctl start postgresql
```

Create database:
```bash
createdb releye
psql releye < database-setup.sql
```

### Step 2: Configure API

Create `.env` file in project root:
```env
DATABASE_URL=postgresql://localhost:5432/releye
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

### Step 3: Start API Server

```bash
node api-server-example.js
```

Or use nodemon for auto-reload:
```bash
npm install -g nodemon
nodemon api-server-example.js
```

### Step 4: Start Frontend

In a new terminal:
```bash
npm run dev
```

## Testing Without Cloud Storage

If you don't want to set up the backend, the app will automatically fall back to localStorage:

```bash
npm run dev
```

The app will work normally, but user data won't sync across devices/browsers.

## Useful Commands

### View API Logs
```bash
docker-compose logs -f api
```

### View Database Logs
```bash
docker-compose logs -f postgres
```

### Access Database Shell
```bash
docker-compose exec postgres psql -U releye_user -d releye
```

### Stop All Services
```bash
docker-compose down
```

### Reset Database
```bash
docker-compose down -v
docker-compose up -d
```

## Testing API Endpoints

Use the test script:
```bash
chmod +x test-cloud-api.sh
./test-cloud-api.sh http://localhost:3000/api
```

Or test manually with curl:

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Check First Time Setup
```bash
curl http://localhost:3000/api/auth/first-time
```

### Get All Users
```bash
curl http://localhost:3000/api/users
```

## Debugging

### Frontend Not Connecting to API

1. Check API is running:
```bash
curl http://localhost:3000/api/health
```

2. Check browser console for errors

3. Verify CORS settings in `.env`

### Database Connection Errors

1. Check PostgreSQL is running:
```bash
docker-compose ps
# or
pg_isready
```

2. Verify DATABASE_URL in `.env`

3. Check database logs:
```bash
docker-compose logs postgres
```

### Fallback to Local Storage

If you see this in console:
```
[UserRegistry] Cloud storage check failed, using local storage
```

The app is working, but using localStorage instead of cloud API. This is expected if the API isn't running.

## IDE Setup

### VS Code

Recommended extensions:
- ESLint
- Prettier
- PostgreSQL (for database queries)
- REST Client (for testing API)

### Database GUI

Connect to PostgreSQL using:
- DBeaver
- pgAdmin
- TablePlus

Connection details:
- Host: localhost
- Port: 5432
- Database: releye
- User: releye_user
- Password: releye_password (if using Docker)

## Hot Reload

Both frontend and backend support hot reload:

- **Frontend**: Vite automatically reloads on file changes
- **Backend**: Use nodemon for auto-reload on API changes

## Environment Variables

Create a `.env` file in project root:

```env
# Frontend (VITE_ prefix required)
VITE_API_URL=http://localhost:3000/api

# Backend (for api-server-example.js)
DATABASE_URL=postgresql://releye_user:releye_password@localhost:5432/releye
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Troubleshooting

### Port Already in Use

If port 3000 or 5173 is already in use:

**Frontend:**
```bash
# Vite will prompt for a different port automatically
npm run dev
```

**Backend:**
```bash
# Change PORT in .env
PORT=3001 node api-server-example.js
```

### CORS Errors

Make sure CORS_ORIGIN in backend `.env` matches your frontend URL exactly:
```env
CORS_ORIGIN=http://localhost:5173
```

### Database Migration Errors

Reset and reapply:
```bash
docker-compose down -v
docker-compose up -d
```

## Next Steps

Once your local setup is working:

1. Make your changes
2. Test thoroughly
3. Commit to Git
4. Deploy to production (see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md))
