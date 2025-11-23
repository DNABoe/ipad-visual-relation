# RelEye - Relationship Network Visualization

RelEye is a powerful relationship network visualization tool that allows you to map and understand connections between people, teams, and organizations.

## Features

- **Visual Network Mapping**: Create and manage relationship networks with an intuitive canvas interface
- **Person Management**: Track individuals with photos, positions, scores, and detailed notes
- **Group Organization**: Organize people into color-coded groups for easy visual categorization
- **File Attachments**: Attach documents, images, and files to person profiles
- **Activity Logging**: Automatic tracking of all changes and modifications
- **Investigation Reports**: Generate professional intelligence briefs (AI-powered in Spark environment)
- **Export/Import**: Save and load network files with password protection
- **Flexible Storage**: Works with both Spark KV storage and browser localStorage

## Running the Application

### In Spark Environment (Enhanced Features)
When running in the Spark runtime environment, RelEye has access to:
- ✅ Spark KV persistent storage
- ✅ AI-powered investigation reports using GPT-4
- ✅ Enhanced data persistence

Simply run the application in your Spark environment as usual.

### Standalone Mode (Outside Spark)
RelEye can also run as a standalone web application with graceful feature degradation:
- ✅ Full network visualization and management
- ✅ All person and group features
- ✅ File attachments and notes
- ✅ Export/Import functionality
- ⚠️ Uses browser localStorage instead of Spark KV
- ⚠️ Investigation reports use static templates instead of AI

#### Running Standalone

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

## Storage Architecture

RelEye uses a flexible storage abstraction that automatically detects and uses the best available storage mechanism:

1. **Spark Runtime**: Prioritizes `window.spark.kv` for persistence
2. **Fallback**: Automatically falls back to browser `localStorage` when Spark is unavailable
3. **Graceful Degradation**: All core features work regardless of storage mechanism

## Investigation Feature

### In Spark Environment
The investigation feature uses AI (GPT-4) to generate detailed, personalized intelligence reports based on:
- Person's name and position
- Country of operation
- Contextual analysis of role and influence

### Standalone Mode
Investigation generates a professional intelligence brief template with:
- Standard analysis framework
- Position-based insights
- Industry context
- Engagement recommendations
- Note indicating AI features require Spark environment

## Data Persistence

All user data is stored locally:
- **Spark Environment**: Data persists in Spark KV storage
- **Standalone**: Data persists in browser localStorage
- **File Export**: Networks can be exported as encrypted JSON files with password protection

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Type checking
tsc --noEmit

# Linting
npm run lint

# Build for production
npm run build
```

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **jsPDF** - PDF generation
- **Sonner** - Toast notifications
- **Phosphor Icons** - Icon library

## Browser Compatibility

RelEye works in all modern browsers that support:
- ES2020+
- localStorage API
- Canvas API
- File API

For the best experience, use the latest version of:
- Chrome/Edge
- Firefox
- Safari

## License

Private - All rights reserved
