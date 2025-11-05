# RelEye - Relationship Network Visualization

RelEye is a secure, privacy-focused relationship network visualization tool that enables you to map and understand connections between people, teams, and organizations.

## Features

- 🔒 **Secure**: AES-256-GCM encryption for all network data
- 🌐 **Multi-Device**: Cloud-based user authentication across browsers and devices
- 🔐 **Privacy-First**: Network files stored locally, user credentials in secure cloud database
- 👥 **Multi-User**: Role-based access control (Admin, Editor, Viewer)
- 📊 **Visual Network**: Interactive canvas with drag-and-drop nodes and connections
- 📁 **File Management**: Save and load multiple encrypted network files

## Architecture

### User Authentication (Cloud-Based)
User credentials and account information are stored in a cloud database, allowing access from any browser or device:
- User accounts
- Authentication credentials
- Role assignments
- Invite system

### Network Data (Local Storage)
Network files remain stored locally on each device for privacy and performance:
- Person nodes
- Connection relationships
- Group information
- Network layouts

## Deployment

### Frontend (GitHub Pages)
The frontend is deployed at `https://releye.boestad.com` via GitHub Pages.

### Backend API (Cloud Server)
The backend API must be deployed separately to enable cloud authentication. See [CLOUD_API_SETUP.md](./CLOUD_API_SETUP.md) for detailed instructions.

**Quick Setup:**

1. Set up PostgreSQL database:
```bash
psql -U postgres -d releye -f database-setup.sql
```

2. Install API dependencies:
```bash
npm install --prefix api-server-example.js
```

3. Configure environment variables:
```bash
cp api-env.example .env
# Edit .env with your database credentials
```

4. Start the API server:
```bash
npm start
```

The API should be accessible at `https://releye.boestad.com/api`

## Development

### Frontend Development
```bash
npm install
npm run dev
```

### Testing Cloud Integration
To test cloud authentication locally:
1. Deploy the API server (see above)
2. Update `cloudAuthService.ts` API_BASE_URL to point to your local server
3. Run the frontend with `npm run dev`

### Fallback Behavior
If the cloud API is unavailable, the app automatically falls back to localStorage for user authentication.

## License

MIT License - Copyright GitHub, Inc.
