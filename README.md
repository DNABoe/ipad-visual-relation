# RelEye - Relationship Network Visualization

RelEye is a powerful relationship network visualization tool that allows you to map and understand connections between people, teams, and organizations.

## Features

- **Visual Network Mapping**: Create and manage relationship networks with an intuitive canvas interface
- **Person Management**: Track individuals with photos, positions, scores, and detailed notes
- **Group Organization**: Organize people into color-coded groups for easy visual categorization
- **File Attachments**: Attach documents, images, and files to person profiles
- **Activity Logging**: Automatic tracking of all changes and modifications
- **AI-Powered Investigation Reports**: Generate professional intelligence briefs using ChatGPT, Perplexity AI, or Spark LLM
- **Export/Import**: Save and load network files with password protection
- **Flexible Storage**: Works with both Spark KV storage and browser localStorage

## Running the Application

### In Spark Environment
When running in the Spark runtime environment, RelEye has access to:
- ✅ Spark KV persistent storage
- ✅ AI-powered investigation reports using Spark's built-in LLM
- ✅ Enhanced data persistence

Simply run the application in your Spark environment as usual.

### Standalone Mode (Outside Spark)
RelEye can also run as a standalone web application:
- ✅ Full network visualization and management
- ✅ All person and group features
- ✅ File attachments and notes
- ✅ Export/Import functionality
- ✅ **AI-powered investigation reports with ChatGPT or Perplexity** (see setup below)
- ⚠️ Uses browser localStorage instead of Spark KV

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

The investigation feature generates professional intelligence reports using AI. **Now works outside Spark runtime!**

### AI Provider Options

1. **ChatGPT (OpenAI)** - Fast, reliable, cost-effective
2. **Perplexity AI** - Web-enhanced research with current information
3. **Spark LLM** - Built-in when running in Spark environment

### Quick Setup

1. **Get an API key:**
   - OpenAI: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Perplexity: [https://www.perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)

2. **For local development:**
   ```bash
   cp .env.example .env
   # Edit .env and add your API key
   ```
   
3. **For deployed sites:**
   - Add `VITE_OPENAI_API_KEY` and/or `VITE_PERPLEXITY_API_KEY` as GitHub repository secrets
   - Redeploy your site

4. **Test it:**
   - Open any person card → Investigate tab
   - Enter a country and click "Investigate"
   - Get an AI-generated intelligence brief!

**For detailed setup instructions, see [INVESTIGATION_SETUP.md](INVESTIGATION_SETUP.md)**

### Features

**In Spark Environment or with API keys configured:**
- AI-generated intelligence reports analyzing:
  - Professional background and career trajectory
  - Areas of influence and expertise
  - Potential network connections
  - Strategic importance assessment
  - Engagement recommendations
- Personalized based on name, position, and country
- Professional PDF export

**Without API keys (fallback):**
- Structured template-based reports
- Professional formatting
- Standard intelligence framework
- Note indicating AI features require configuration

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
