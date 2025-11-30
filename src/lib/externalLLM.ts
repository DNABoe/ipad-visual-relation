const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY

const REQUEST_TIMEOUT = 60000

const CORS_PROXIES = [
  {
    name: 'AllOrigins',
    url: (targetUrl: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    type: 'prepend' as const
  },
  {
    name: 'CORSProxy.io',
    url: (targetUrl: string) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    type: 'prepend' as const
  },
  {
    name: 'CORS Anywhere',
    url: (targetUrl: string) => `https://cors-anywhere.herokuapp.com/${targetUrl}`,
    type: 'prepend' as const
  }
]

const CUSTOM_PROXY_URL = import.meta.env.VITE_PROXY_URL

const API_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  perplexity: 'https://api.perplexity.ai/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages'
}

export function isLLMAvailable(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }
    const w = window as any
    const hasSparkLLM = !!(w.spark && w.spark.llm && typeof w.spark.llm === 'function')
    const hasAPIKeys = !!(OPENAI_API_KEY || PERPLEXITY_API_KEY)
    
    return hasSparkLLM || hasAPIKeys
  } catch {
    return false
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - the server took too long to respond')
    }
    throw error
  }
}

async function callOpenAI(prompt: string, apiKey?: string): Promise<string> {
  const key = apiKey || OPENAI_API_KEY
  
  console.log('[externalLLM] callOpenAI invoked')
  console.log('[externalLLM] apiKey parameter provided:', !!apiKey)
  console.log('[externalLLM] OPENAI_API_KEY env var present:', !!OPENAI_API_KEY)
  console.log('[externalLLM] Final key to use present:', !!key)
  
  if (!key) {
    throw new Error('OpenAI API key not configured. Please add your API key in Settings > Investigation tab.')
  }

  if (!key.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. API keys must start with "sk-". Please check your API key in Settings.')
  }

  console.log('[externalLLM] Calling OpenAI API via CORS proxies...')

  const requestBody = {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a professional intelligence analyst creating detailed intelligence briefs.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000
  }

  console.log('[externalLLM] Request prepared')

  if (CUSTOM_PROXY_URL) {
    console.log('[externalLLM] Attempting custom proxy first:', CUSTOM_PROXY_URL)
    try {
      const response = await fetchWithTimeout(CUSTOM_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'openai',
          apiKey: key.trim(),
          payload: requestBody
        })
      }, REQUEST_TIMEOUT)

      if (response.ok) {
        const data = await response.json()
        if (data.content) {
          console.log('[externalLLM] Success via custom proxy')
          return data.content
        }
      }
      console.log('[externalLLM] Custom proxy failed, trying public CORS proxies...')
    } catch (error) {
      console.log('[externalLLM] Custom proxy error, trying public CORS proxies...', error)
    }
  }

  for (const proxy of CORS_PROXIES) {
    try {
      console.log(`[externalLLM] Attempting ${proxy.name}...`)
      
      const targetUrl = API_ENDPOINTS.openai
      const proxyUrl = proxy.url(targetUrl)
      
      const response = await fetchWithTimeout(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key.trim()}`
        },
        body: JSON.stringify(requestBody)
      }, REQUEST_TIMEOUT)

      console.log(`[externalLLM] ${proxy.name} response status:`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[externalLLM] ${proxy.name} error response:`, errorText)
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please verify your OpenAI API key in Settings.')
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your API key permissions.')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        
        continue
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      
      if (!content) {
        console.error(`[externalLLM] ${proxy.name} returned invalid response format`)
        continue
      }

      console.log(`[externalLLM] ✓ Success via ${proxy.name}`)
      return content
      
    } catch (error) {
      console.error(`[externalLLM] ${proxy.name} failed:`, error)
      if (error instanceof Error && 
          (error.message.includes('Invalid API key') || 
           error.message.includes('Access forbidden') ||
           error.message.includes('Rate limit'))) {
        throw error
      }
      continue
    }
  }

  throw new Error('All CORS proxies failed. Please try again later or deploy your own proxy server.')
}

async function callPerplexity(prompt: string, apiKey?: string): Promise<string> {
  const key = apiKey || PERPLEXITY_API_KEY
  
  console.log('[externalLLM] callPerplexity invoked')
  
  if (!key) {
    throw new Error('Perplexity API key not configured. Please add your API key in Settings.')
  }

  if (!key.startsWith('pplx-')) {
    throw new Error('Invalid Perplexity API key format. API keys must start with "pplx-".')
  }

  console.log('[externalLLM] Calling Perplexity API via CORS proxies...')

  const requestBody = {
    model: 'llama-3.1-sonar-small-128k-online',
    messages: [
      {
        role: 'system',
        content: 'You are a professional intelligence analyst creating detailed intelligence briefs based on current, up-to-date information.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]
  }

  if (CUSTOM_PROXY_URL) {
    console.log('[externalLLM] Attempting custom proxy first:', CUSTOM_PROXY_URL)
    try {
      const response = await fetchWithTimeout(CUSTOM_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'perplexity',
          apiKey: key.trim(),
          payload: requestBody
        })
      }, REQUEST_TIMEOUT)

      if (response.ok) {
        const data = await response.json()
        if (data.content) {
          console.log('[externalLLM] Success via custom proxy')
          return data.content
        }
      }
      console.log('[externalLLM] Custom proxy failed, trying public CORS proxies...')
    } catch (error) {
      console.log('[externalLLM] Custom proxy error, trying public CORS proxies...', error)
    }
  }

  for (const proxy of CORS_PROXIES) {
    try {
      console.log(`[externalLLM] Attempting ${proxy.name}...`)
      
      const targetUrl = API_ENDPOINTS.perplexity
      const proxyUrl = proxy.url(targetUrl)
      
      const response = await fetchWithTimeout(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key.trim()}`
        },
        body: JSON.stringify(requestBody)
      }, REQUEST_TIMEOUT)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[externalLLM] ${proxy.name} error response:`, errorText)
        
        if (response.status === 401) {
          throw new Error('Invalid Perplexity API key. Please verify your API key in Settings.')
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your API key permissions.')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        
        continue
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      
      if (!content) {
        console.error(`[externalLLM] ${proxy.name} returned invalid response format`)
        continue
      }

      console.log(`[externalLLM] ✓ Success via ${proxy.name}`)
      return content
      
    } catch (error) {
      console.error(`[externalLLM] ${proxy.name} failed:`, error)
      if (error instanceof Error && 
          (error.message.includes('Invalid') || 
           error.message.includes('Access forbidden') ||
           error.message.includes('Rate limit'))) {
        throw error
      }
      continue
    }
  }

  throw new Error('All CORS proxies failed. Please try again later or deploy your own proxy server.')
}

async function callClaude(prompt: string, apiKey?: string): Promise<string> {
  const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY
  const key = apiKey || CLAUDE_API_KEY
  
  console.log('[externalLLM] callClaude invoked')
  
  if (!key) {
    throw new Error('Claude API key not configured. Please add your API key in Settings.')
  }

  if (!key.startsWith('sk-ant-')) {
    throw new Error('Invalid Claude API key format. API keys must start with "sk-ant-".')
  }

  console.log('[externalLLM] Calling Claude API via CORS proxies...')

  const requestBody = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are a professional intelligence analyst creating detailed intelligence briefs.\n\n${prompt}`
      }
    ]
  }

  if (CUSTOM_PROXY_URL) {
    console.log('[externalLLM] Attempting custom proxy first:', CUSTOM_PROXY_URL)
    try {
      const response = await fetchWithTimeout(CUSTOM_PROXY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'claude',
          apiKey: key.trim(),
          payload: requestBody
        })
      }, REQUEST_TIMEOUT)

      if (response.ok) {
        const data = await response.json()
        if (data.content) {
          console.log('[externalLLM] Success via custom proxy')
          return data.content
        }
      }
      console.log('[externalLLM] Custom proxy failed, trying public CORS proxies...')
    } catch (error) {
      console.log('[externalLLM] Custom proxy error, trying public CORS proxies...', error)
    }
  }

  for (const proxy of CORS_PROXIES) {
    try {
      console.log(`[externalLLM] Attempting ${proxy.name}...`)
      
      const targetUrl = API_ENDPOINTS.claude
      const proxyUrl = proxy.url(targetUrl)
      
      const response = await fetchWithTimeout(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key.trim(),
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      }, REQUEST_TIMEOUT)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[externalLLM] ${proxy.name} error response:`, errorText)
        
        if (response.status === 401) {
          throw new Error('Invalid Claude API key. Please verify your API key in Settings.')
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your API key permissions.')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        
        continue
      }

      const data = await response.json()
      const content = data.content?.[0]?.text
      
      if (!content) {
        console.error(`[externalLLM] ${proxy.name} returned invalid response format`)
        continue
      }

      console.log(`[externalLLM] ✓ Success via ${proxy.name}`)
      return content
      
    } catch (error) {
      console.error(`[externalLLM] ${proxy.name} failed:`, error)
      if (error instanceof Error && 
          (error.message.includes('Invalid') || 
           error.message.includes('Access forbidden') ||
           error.message.includes('Rate limit'))) {
        throw error
      }
      continue
    }
  }

  throw new Error('All CORS proxies failed. Please try again later or deploy your own proxy server.')
}

export async function generateIntelligenceReport(params: {
  name: string
  position: string
  country: string
  organization?: string
  education?: string
  specialization?: string
  llmConfigs?: Array<{ provider: string; apiKey: string; enabled: boolean }>
  provider?: 'openai' | 'perplexity' | 'claude' | 'auto'
  investigationSettings?: {
    personalInfo: boolean
    workAndCV: boolean
    mediaPresence: boolean
    socialMedia: boolean
    approachAnalysis: boolean
  }
}): Promise<string> {
  const { 
    name, 
    position, 
    country, 
    organization, 
    education, 
    specialization, 
    provider = 'auto', 
    llmConfigs = [],
    investigationSettings = {
      personalInfo: true,
      workAndCV: true,
      mediaPresence: false,
      socialMedia: false,
      approachAnalysis: false,
    }
  } = params

  console.log('[externalLLM] Starting intelligence report generation...')
  console.log('[externalLLM] Parameters:', {
    name,
    position,
    country,
    organization,
    education,
    specialization,
    provider,
    hasLLMConfigs: llmConfigs.length > 0,
    enabledProviders: llmConfigs.filter(c => c.enabled).map(c => c.provider),
    investigationSettings
  })

  const positionText = position || 'Not specified'
  const countryText = country || 'Not specified'
  const organizationText = organization || 'Not specified'
  const educationText = education || 'Not specified'
  const specializationText = specialization || 'Not specified'
  
  let sectionsToInclude = `You are a professional intelligence analyst. Create a comprehensive professional intelligence profile for the following person:

Name: ${name}
Position: ${positionText}
Organization: ${organizationText}
Country: ${countryText}
Education: ${educationText}
Specialization/Expertise: ${specializationText}

Please provide a detailed analysis with the following sections:
`

  if (investigationSettings.personalInfo) {
    sectionsToInclude += `
1. PERSONAL PROFILE (DEEP SEARCH)
   - Full name and current role
   - Age or approximate age range (if publicly available)
   - Nationality and place of birth (if known)
   - Current residence/location
   - Family background and personal situation (if publicly available)
   - Languages spoken
   - Educational background (institutions, degrees, year of graduation)
   - Notable academic achievements or credentials
   - Professional certifications and qualifications
   - Key personal characteristics and communication style
   - Personal interests, hobbies, or public activities
   - Personal values and belief systems (if publicly stated)
   - Life history and significant life events
   - Personal achievements outside of work
   - Community involvement and charitable activities
   - Personal brand and reputation
   - Any public controversies or noteworthy incidents
`
  }

  if (investigationSettings.workAndCV) {
    sectionsToInclude += `
2. PROFESSIONAL BACKGROUND & CAREER ANALYSIS
   - Complete career timeline with exact dates
   - Current employer/organization and exact tenure
   - Current responsibilities and scope of authority
   - Detailed analysis of all previous positions and organizations
   - Career progression, transitions, and key achievements
   - Industry experience and specializations
   - Notable projects or initiatives led (with outcomes)
   - Publications, patents, or significant contributions
   - Professional reputation and credibility in the field
   - Awards, honors, or recognition received
   - Board memberships or advisory roles
   - Professional network and key collaborations
   - Career gaps or transitions and their significance
   - Salary range and compensation trends (if publicly available)
   - Career trajectory analysis and future potential
`
  }

  if (investigationSettings.mediaPresence) {
    sectionsToInclude += `
3. MEDIA PRESENCE & PUBLIC VISIBILITY ANALYSIS
   - Comprehensive analysis of media appearances
   - Television, radio, and podcast interviews
   - Print media coverage (newspapers, magazines)
   - Online news and digital publications
   - Speaking engagements at conferences and events
   - Webinars, virtual summits, and online presentations
   - Media sentiment analysis (positive, neutral, negative coverage)
   - Frequency and consistency of media appearances
   - Key messages and talking points in media
   - Media relationships and go-to journalists/outlets
   - Press releases and official statements
   - Crisis communication and media handling
   - Thought leadership pieces and opinion articles
   - Media training and public speaking skills assessment
   - Comparison to industry peers in media visibility
   - Trends in media presence over time
`
  }

  if (investigationSettings.socialMedia) {
    sectionsToInclude += `
4. SOCIAL MEDIA (SoMe) PRESENCE & DIGITAL FOOTPRINT
   - Detailed analysis of all social media platforms
   - LinkedIn profile, activity, and engagement metrics
   - Twitter/X presence, follower count, and influence score
   - Facebook, Instagram, and other platform presence
   - Posting frequency and content themes
   - Engagement rates and audience interaction patterns
   - Follower demographics and reach analysis
   - Content strategy and messaging consistency
   - Influencer status and thought leadership on social media
   - Network connections and key relationships
   - Hashtag usage and trending topic participation
   - Response to comments and community management
   - Controversies or negative sentiment on social platforms
   - Personal vs. professional social media separation
   - Digital reputation and online reviews
   - Social media activity patterns (times, days, frequency)
   - Comparison to industry benchmarks
`
  }

  if (investigationSettings.approachAnalysis) {
    sectionsToInclude += `
5. AI-POWERED APPROACH STRATEGY & ENGAGEMENT RECOMMENDATIONS
   - Detailed strategic recommendations for approaching this person
   - Best communication channels and methods
   - Optimal times and contexts for contact
   - Topics of interest and passion points
   - Conversation starters and ice breakers
   - Shared interests or common ground opportunities
   - Values alignment and resonance points
   - Potential concerns or sensitivities to avoid
   - Decision-making style and preferences
   - Influence tactics most likely to be effective
   - Building trust and rapport strategies
   - Long-term relationship development roadmap
   - Networking path and mutual connections to leverage
   - Event or venue suggestions for meeting
   - Gift ideas or gestures that would be appreciated
   - Topics to discuss for building credibility
   - Areas where you can provide value to them
   - Timing strategy for various engagement types
   - Red flags and approaches to avoid
   - Cultural considerations and preferences
`
  }

  sectionsToInclude += `
${investigationSettings.personalInfo || investigationSettings.workAndCV || investigationSettings.mediaPresence || investigationSettings.socialMedia || investigationSettings.approachAnalysis ? '' : `
1. BASIC PROFILE OVERVIEW
   - Name and position
   - Organization and location
   - Brief professional summary
`}

6. AREAS OF INFLUENCE AND EXPERTISE
   - Domain-specific expertise and specializations
   - Technical skills and competencies
   - Organizational influence and decision-making power
   - Industry standing and thought leadership
   - Key competencies and skill areas
   - Areas of innovation or unique contributions
   - Influence on industry trends or standards

7. POTENTIAL NETWORK CONNECTIONS
   - Professional relationships and networks
   - Key colleagues and collaborators
   - Organizational contacts and stakeholders
   - Industry associations and affiliations
   - Strategic partnerships and collaborations
   - Mentors or influential contacts
   - Former colleagues in positions of influence
   - Social and professional club memberships
   - Alumni networks and connections

8. STRATEGIC IMPORTANCE ASSESSMENT
   - Value to intelligence operations
   - Access to strategic information
   - Level of decision-making authority
   - Influence on key organizational/industry decisions
   - Potential as source or contact
   - Unique access or capabilities
   - Strategic vulnerabilities or pressure points

9. KEY CONSIDERATIONS FOR ENGAGEMENT
   - Recommended approach strategies
   - Communication preferences and style
   - Topics of interest and expertise
   - Potential engagement opportunities
   - Known values, motivations, or drivers
   - Risk factors and considerations
   - Potential sensitivities or red lines
   - Optimal timing and context for engagement

Format your response as a professional intelligence brief with clear section headings and detailed, actionable analysis. Be thorough, realistic, and focused on strategic intelligence value. Include specific details where publicly available, and clearly indicate when information is based on typical patterns for similar roles rather than specific facts about this individual. 

IMPORTANT: The depth and comprehensiveness of your analysis should match the investigation scope selected. For sections marked as DEEP SEARCH or with specific analysis requests, provide significantly more detail, examples, and specific information.`

  const promptText = sectionsToInclude

  const hasSparkLLM = typeof window !== 'undefined' && 
    !!(window as any).spark && 
    typeof (window as any).spark.llm === 'function'
  
  console.log('[externalLLM] Available providers:', {
    hasSparkLLM,
    hasLLMConfigs: llmConfigs.length > 0,
    enabledConfigs: llmConfigs.filter(c => c.enabled).length
  })

  const enabledConfigs = llmConfigs.filter(c => c.enabled)

  try {
    if (provider === 'claude' || (provider === 'auto' && enabledConfigs.find(c => c.provider === 'claude'))) {
      const claudeConfig = enabledConfigs.find(c => c.provider === 'claude')
      if (claudeConfig) {
        console.log('[externalLLM] Using Claude API...')
        return await callClaude(promptText, claudeConfig.apiKey)
      }
    }
    
    if (provider === 'perplexity' || (provider === 'auto' && enabledConfigs.find(c => c.provider === 'perplexity'))) {
      const perplexityConfig = enabledConfigs.find(c => c.provider === 'perplexity')
      if (perplexityConfig) {
        console.log('[externalLLM] Using Perplexity API...')
        return await callPerplexity(promptText, perplexityConfig.apiKey)
      }
    }
    
    if (provider === 'openai' || (provider === 'auto' && enabledConfigs.find(c => c.provider === 'openai'))) {
      const openaiConfig = enabledConfigs.find(c => c.provider === 'openai')
      if (openaiConfig) {
        console.log('[externalLLM] Using OpenAI API...')
        return await callOpenAI(promptText, openaiConfig.apiKey)
      }
    }
    
    if (hasSparkLLM) {
      console.log('[externalLLM] Using Spark LLM API...')
      const prompt = (window.spark.llmPrompt as any)`${promptText}`
      const report = await window.spark.llm(prompt, 'gpt-4o-mini')
      console.log('[externalLLM] Report generated successfully')
      return report
    }
    
    console.log('[externalLLM] No LLM provider available, generating static report')
    return generateStaticReport({ name, position, country })
    
  } catch (error) {
    console.error('[externalLLM] Error generating report:', error)
    
    if (error instanceof Error) {
      throw new Error(`Failed to generate investigation report: ${error.message}`)
    }
    
    throw new Error('Failed to generate investigation report. Please try again.')
  }
}

function generateStaticReport(params: {
  name: string
  position: string
  country: string
}): string {
  const { name, position, country } = params
  
  const positionText = position || 'Not specified'
  const countryText = country || 'Not specified'
  
  return `# INTELLIGENCE BRIEF

**Subject:** ${name}
**Position:** ${positionText}
**Country:** ${countryText}
**Report Generated:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
**Classification:** Confidential

---

## ANALYST NOTE

This intelligence brief has been generated using standard template analysis based on position and professional context. For enhanced, AI-powered personalized analysis with real-time research capabilities, configure an LLM provider API key (OpenAI, Perplexity, or Claude) in Settings > Investigation tab.

**For AI-Enhanced Reports:** The investigation feature can leverage advanced language models to generate detailed, context-specific intelligence reports.

**To Enable:** Add your preferred LLM provider API key in the Settings menu under the Investigation tab.

---

**Report Classification:** Confidential  
**Distribution:** Restricted  
**Validity:** Current as of generation date`
}

export async function generateAIInsights(params: {
  workspace: any
  metrics: any
  topNodes: any[]
  apiKey?: string
  llmConfigs?: Array<{ provider: string; apiKey: string; enabled: boolean }>
}): Promise<{
  insights: string[]
  centerOfGravity: {
    person: any
    score: number
    reasoning: string
  }
  strategicRecommendations: string[]
}> {
  const { workspace, metrics, topNodes } = params

  console.log('[externalLLM] Generating advanced network insights using client-side analysis...')

  return generateEnhancedInsights(workspace, metrics, topNodes)
}

function calculateBetweennessCentrality(workspace: any, personId: string): number {
  const visiblePersons = workspace.persons.filter((p: any) => !p.hidden)
  const personIds = visiblePersons.map((p: any) => p.id)
  
  if (!personIds.includes(personId)) return 0
  
  const adjacency = new Map<string, Set<string>>()
  personIds.forEach(id => adjacency.set(id, new Set()))
  
  workspace.connections.forEach((conn: any) => {
    if (personIds.includes(conn.fromPersonId) && personIds.includes(conn.toPersonId)) {
      adjacency.get(conn.fromPersonId)?.add(conn.toPersonId)
      adjacency.get(conn.toPersonId)?.add(conn.fromPersonId)
    }
  })
  
  let betweenness = 0
  
  for (let s of personIds) {
    if (s === personId) continue
    
    const stack: string[] = []
    const paths = new Map<string, string[][]>()
    const dist = new Map<string, number>()
    const sigma = new Map<string, number>()
    
    personIds.forEach(id => {
      paths.set(id, [])
      dist.set(id, -1)
      sigma.set(id, 0)
    })
    
    dist.set(s, 0)
    sigma.set(s, 1)
    
    const queue = [s]
    
    while (queue.length > 0) {
      const v = queue.shift()!
      stack.push(v)
      
      const neighbors = adjacency.get(v) || new Set()
      for (let w of neighbors) {
        if (dist.get(w)! < 0) {
          queue.push(w)
          dist.set(w, dist.get(v)! + 1)
        }
        
        if (dist.get(w) === dist.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!)
          paths.get(w)!.push([...paths.get(v)!, v])
        }
      }
    }
    
    const delta = new Map<string, number>()
    personIds.forEach(id => delta.set(id, 0))
    
    while (stack.length > 0) {
      const w = stack.pop()!
      for (let path of paths.get(w)!) {
        if (path.includes(personId)) {
          delta.set(personId, delta.get(personId)! + 1)
        }
      }
    }
    
    betweenness += delta.get(personId)!
  }
  
  const normalization = (personIds.length - 1) * (personIds.length - 2) / 2
  return normalization > 0 ? betweenness / normalization : 0
}

function findCommunityBridges(workspace: any): string[] {
  const bridges: string[] = []
  const groupMap = new Map<string, string[]>()
  
  workspace.persons.filter((p: any) => !p.hidden).forEach((p: any) => {
    const groupId = p.groupId || 'ungrouped'
    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, [])
    }
    groupMap.get(groupId)!.push(p.id)
  })
  
  workspace.persons.filter((p: any) => !p.hidden).forEach((p: any) => {
    const personGroup = p.groupId || 'ungrouped'
    const connections = workspace.connections.filter((c: any) => 
      c.fromPersonId === p.id || c.toPersonId === p.id
    )
    
    const externalConnections = connections.filter((c: any) => {
      const otherId = c.fromPersonId === p.id ? c.toPersonId : c.fromPersonId
      const otherPerson = workspace.persons.find((person: any) => person.id === otherId)
      const otherGroup = otherPerson?.groupId || 'ungrouped'
      return otherGroup !== personGroup
    })
    
    if (externalConnections.length >= 2) {
      bridges.push(p.id)
    }
  })
  
  return bridges
}

function generateEnhancedInsights(workspace: any, metrics: any, topNodes: any[]) {
  const insights: string[] = []
  const visiblePersons = workspace.persons.filter((p: any) => !p.hidden)
  
  const connectionCounts = new Map<string, number>()
  workspace.connections.forEach((conn: any) => {
    connectionCounts.set(conn.fromPersonId, (connectionCounts.get(conn.fromPersonId) || 0) + 1)
    connectionCounts.set(conn.toPersonId, (connectionCounts.get(conn.toPersonId) || 0) + 1)
  })
  
  const bridges = findCommunityBridges(workspace)
  
  if (bridges.length > 0) {
    const bridgePersons = visiblePersons.filter((p: any) => bridges.includes(p.id))
    const topBridge = bridgePersons.sort((a, b) => 
      (connectionCounts.get(b.id) || 0) - (connectionCounts.get(a.id) || 0)
    )[0]
    insights.push(`${topBridge?.name || 'Key individual'} serves as a critical bridge between groups, controlling information flow across organizational boundaries`)
  }
  
  if (metrics.isolatedNodes > 0) {
    const isolatedRatio = metrics.isolatedNodes / metrics.totalNodes
    if (isolatedRatio > 0.2) {
      insights.push(`Significant network fragmentation: ${metrics.isolatedNodes} isolated nodes (${Math.round(isolatedRatio * 100)}%) represent high-priority integration targets`)
    } else {
      insights.push(`${metrics.isolatedNodes} isolated nodes detected - potential for strategic outreach to expand network coverage`)
    }
  }
  
  if (metrics.avgConnectionsPerNode < 2) {
    insights.push('Sparse network topology suggests early-stage relationship development - focus on building foundational connections')
  } else if (metrics.avgConnectionsPerNode > 5) {
    insights.push(`Highly interconnected network (avg ${metrics.avgConnectionsPerNode.toFixed(1)} connections/node) enables rapid information propagation and influence cascades`)
  }
  
  const advocateRatio = metrics.totalNodes > 0 ? metrics.advocateNodes / metrics.totalNodes : 0
  if (advocateRatio > 0.3) {
    const advocateConnections = visiblePersons
      .filter((p: any) => p.advocate)
      .reduce((sum, p) => sum + (connectionCounts.get(p.id) || 0), 0)
    insights.push(`Advocate network comprises ${Math.round(advocateRatio * 100)}% of nodes with ${advocateConnections} connections - exceptional leverage for influence operations`)
  } else if (advocateRatio > 0.15) {
    insights.push(`Moderate advocate presence (${Math.round(advocateRatio * 100)}%) provides opportunities for message amplification through trusted voices`)
  }
  
  const reportCoverage = metrics.totalNodes > 0 ? metrics.nodesWithReports / metrics.totalNodes : 0
  if (reportCoverage < 0.3) {
    const criticalGaps = topNodes.slice(0, 3).filter((n: any) => !n.hasReport)
    if (criticalGaps.length > 0) {
      insights.push(`Critical intelligence gaps: ${criticalGaps.length} of top 3 most-connected nodes lack investigation reports - immediate priority for OSINT collection`)
    }
  } else if (reportCoverage > 0.7) {
    insights.push(`Superior intelligence coverage (${Math.round(reportCoverage * 100)}%) enables predictive analysis and comprehensive strategic planning`)
  }
  
  const sentimentAnalysis = {
    positive: visiblePersons.filter((p: any) => p.frameColor === 'green').length,
    negative: visiblePersons.filter((p: any) => p.frameColor === 'red').length,
    neutral: visiblePersons.filter((p: any) => p.frameColor === 'white' || !p.frameColor).length,
    caution: visiblePersons.filter((p: any) => p.frameColor === 'orange').length
  }
  
  const totalScored = sentimentAnalysis.positive + sentimentAnalysis.negative + sentimentAnalysis.neutral + sentimentAnalysis.caution
  if (totalScored > 0) {
    if (sentimentAnalysis.negative > totalScored * 0.4) {
      insights.push(`Network sentiment risk: ${sentimentAnalysis.negative} hostile contacts (${Math.round(sentimentAnalysis.negative / totalScored * 100)}%) require counter-influence strategies`)
    } else if (sentimentAnalysis.positive > totalScored * 0.5) {
      insights.push(`Favorable network climate with ${sentimentAnalysis.positive} positive relationships (${Math.round(sentimentAnalysis.positive / totalScored * 100)}%) supporting engagement operations`)
    }
  }
  
  if (workspace.groups.length > 1) {
    const largestGroup = workspace.groups.map((g: any) => ({
      group: g,
      size: visiblePersons.filter((p: any) => p.groupId === g.id).length
    })).sort((a, b) => b.size - a.size)[0]
    
    if (largestGroup.size > metrics.totalNodes * 0.4) {
      insights.push(`${largestGroup.group.name} dominates network structure (${largestGroup.size} members, ${Math.round(largestGroup.size / metrics.totalNodes * 100)}%) - primary target for organizational influence`)
    } else {
      insights.push(`Balanced group distribution across ${workspace.groups.length} entities enables multi-vector engagement strategies`)
    }
  }
  
  const strongConnections = workspace.connections.filter((c: any) => c.weight === 'thick').length
  if (strongConnections > 0) {
    const strongRatio = strongConnections / metrics.totalConnections
    insights.push(`${strongConnections} high-strength relationships identified (${Math.round(strongRatio * 100)}% of total) - priority channels for critical communications`)
  }

  let centerPerson = topNodes[0]?.person
  let centerScore = 70
  let centerReasoning = `${centerPerson?.name} identified through connection analysis`
  
  const scoredCandidates = topNodes.slice(0, 5).map((node: any) => {
    const p = node.person
    let score = 0
    let factors: string[] = []
    
    score += Math.min(node.connectionCount * 5, 25)
    if (node.connectionCount >= 5) {
      factors.push(`${node.connectionCount} connections`)
    }
    
    score += Math.min((node.connectionStrength / 2), 15)
    
    if (p.score >= 8) {
      score += 20
      factors.push('high-value target (score ' + p.score + ')')
    } else if (p.score >= 5) {
      score += 10
    }
    
    if (p.advocate) {
      score += 15
      factors.push('advocate status')
    }
    
    if (bridges.includes(p.id)) {
      score += 20
      factors.push('inter-group bridge')
    }
    
    const hasReport = p.attachments?.some((att: any) => 
      att.name.startsWith('Investigation_') && att.type === 'application/pdf'
    )
    if (hasReport) {
      score += 10
      factors.push('intelligence available')
    }
    
    if (p.position && (
      p.position.toLowerCase().includes('director') ||
      p.position.toLowerCase().includes('head') ||
      p.position.toLowerCase().includes('chief') ||
      p.position.toLowerCase().includes('president') ||
      p.position.toLowerCase().includes('vp')
    )) {
      score += 15
      factors.push('senior leadership position')
    }
    
    return { person: p, score, factors, connectionCount: node.connectionCount }
  })
  
  const bestCandidate = scoredCandidates.sort((a, b) => b.score - a.score)[0]
  
  if (bestCandidate) {
    centerPerson = bestCandidate.person
    centerScore = Math.min(bestCandidate.score, 98)
    
    const reasonParts = [`${centerPerson.name} represents the network's center of gravity due to`]
    
    if (bestCandidate.factors.length > 0) {
      reasonParts.push(bestCandidate.factors.join(', '))
    }
    
    if (bridges.includes(centerPerson.id)) {
      reasonParts.push('This individual uniquely connects disparate network segments, making them a critical control point for information flow and influence operations.')
    } else if (bestCandidate.connectionCount >= 5) {
      reasonParts.push(`With ${bestCandidate.connectionCount} direct connections, they serve as a primary network hub with exceptional reach and influence potential.`)
    }
    
    if (centerPerson.advocate && centerPerson.score >= 7) {
      reasonParts.push('The combination of advocate status and high strategic value creates a force-multiplier effect for engagement operations.')
    }
    
    centerReasoning = reasonParts.join('. ') + '.'
  }
  
  const recommendations: string[] = []
  
  if (centerPerson) {
    const centerHasReport = centerPerson.attachments?.some((att: any) => 
      att.name.startsWith('Investigation_') && att.type === 'application/pdf'
    )
    
    if (centerHasReport) {
      recommendations.push(`Leverage existing intelligence on ${centerPerson.name} to develop personalized engagement strategy targeting their known interests and influence pathways`)
    } else {
      recommendations.push(`Priority action: Conduct comprehensive intelligence gathering on ${centerPerson.name} to enable targeted engagement at network's center of gravity`)
    }
  }
  
  if (bridges.length > 0) {
    const topBridges = visiblePersons
      .filter((p: any) => bridges.includes(p.id))
      .sort((a, b) => (connectionCounts.get(b.id) || 0) - (connectionCounts.get(a.id) || 0))
      .slice(0, 3)
      .map((p: any) => p.name)
    
    recommendations.push(`Deploy bridge node strategy: Focus on ${topBridges.join(', ')} to maximize cross-group influence and information flow control`)
  }
  
  if (advocateRatio > 0.2) {
    recommendations.push('Activate advocate network through coordinated messaging campaigns to create organic influence cascades across connected nodes')
  } else if (metrics.advocateNodes > 0) {
    recommendations.push('Expand advocate base by converting high-connection neutral nodes through targeted relationship development')
  }
  
  const reportGaps = topNodes.filter((n: any) => !n.hasReport).length
  if (reportGaps > 0) {
    recommendations.push(`Close intelligence gaps: ${reportGaps} high-connectivity nodes lack investigation reports - prioritize OSINT collection to enable informed engagement`)
  }
  
  if (metrics.isolatedNodes > 0) {
    recommendations.push(`Execute network expansion protocol: Systematically integrate ${metrics.isolatedNodes} isolated nodes through existing network connections to strengthen overall structure`)
  }
  
  if (sentimentAnalysis.negative > sentimentAnalysis.positive && sentimentAnalysis.negative > 2) {
    recommendations.push('Implement counter-influence operations to neutralize hostile nodes and convert neutral contacts to favorable positions')
  }
  
  if (strongConnections > 0) {
    recommendations.push('Prioritize high-strength relationship channels for time-sensitive communications and critical information operations')
  }
  
  if (workspace.groups.length > 1) {
    recommendations.push('Exploit group structure through targeted multi-channel approach: simultaneous engagement across organizational boundaries to maximize strategic impact')
  }
  
  return {
    insights: insights.length > 0 ? insights : ['Network analysis complete - review metrics for strategic planning'],
    centerOfGravity: {
      person: centerPerson,
      score: centerScore,
      reasoning: centerReasoning
    },
    strategicRecommendations: recommendations.length > 0 ? recommendations : [
      'Focus engagement efforts on high-connectivity nodes to maximize network reach',
      'Develop intelligence reports for nodes currently lacking investigation data',
      'Monitor isolated nodes for integration opportunities'
    ]
  }
}

function generateStaticInsights(workspace: any, metrics: any, topNodes: any[]) {
  return generateEnhancedInsights(workspace, metrics, topNodes)
}
