const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY

const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
]

const REQUEST_TIMEOUT = 30000

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

async function callOpenAI(prompt: string, apiKey?: string, retryCount = 0, proxyIndex = 0): Promise<string> {
  const key = apiKey || OPENAI_API_KEY
  const MAX_RETRIES = 2
  
  console.log('[externalLLM] callOpenAI invoked (attempt ' + (retryCount + 1) + '/' + (MAX_RETRIES + 1) + ', proxy ' + (proxyIndex + 1) + '/' + CORS_PROXIES.length + ')')
  console.log('[externalLLM] apiKey parameter provided:', !!apiKey)
  console.log('[externalLLM] apiKey parameter value (first 10 chars):', apiKey?.substring(0, 10) || 'N/A')
  console.log('[externalLLM] OPENAI_API_KEY env var present:', !!OPENAI_API_KEY)
  console.log('[externalLLM] Final key to use present:', !!key)
  
  if (!key) {
    throw new Error('OpenAI API key not configured. Please add your API key in Settings > Investigation tab.')
  }

  if (!key.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. API keys must start with "sk-". Please check your API key in Settings.')
  }

  console.log('[externalLLM] Calling OpenAI API...')
  console.log('[externalLLM] API key available:', !!key)
  console.log('[externalLLM] API key length:', key.length)
  console.log('[externalLLM] API key starts with sk-:', key.startsWith('sk-'))

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

  console.log('[externalLLM] Request body:', JSON.stringify(requestBody, null, 2))

  const corsProxy = CORS_PROXIES[proxyIndex]
  const targetUrl = 'https://api.openai.com/v1/chat/completions'
  const fullUrl = corsProxy + encodeURIComponent(targetUrl)
  
  console.log(`[externalLLM] Using CORS proxy: ${corsProxy}`)
  
  try {
    const response = await fetchWithTimeout(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key.trim()}`
      },
      body: JSON.stringify(requestBody)
    }, REQUEST_TIMEOUT)

    console.log('[externalLLM] Response status:', response.status)
    console.log('[externalLLM] Response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[externalLLM] OpenAI API error response:', errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      
      console.error('[externalLLM] OpenAI API error:', errorData)
      console.error('[externalLLM] Response status:', response.status)
      console.error('[externalLLM] Response status text:', response.statusText)
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please verify your OpenAI API key in Settings. Make sure you copied the entire key correctly and that it starts with "sk-".')
      } else if (response.status === 403) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] CORS proxy ${corsProxy} blocked request (403), trying next proxy...`)
          return callOpenAI(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies blocked, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callOpenAI(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Access forbidden (403) - All CORS proxy services are currently blocking API requests. This often happens when proxy services detect and block OpenAI API traffic, or your network/ISP is filtering requests. Try: 1) Using a different network (mobile hotspot), 2) Disabling VPN/proxy, 3) Trying again later. Consider using the Spark runtime\'s built-in LLM if available.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else if (response.status === 500) {
        throw new Error('OpenAI service error. Please try again later.')
      } else if (response.status === 502 || response.status === 503 || response.status === 504) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] CORS proxy ${corsProxy} failed with ${response.status}, trying next proxy...`)
          return callOpenAI(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies failed, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callOpenAI(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Network connection issues detected. All CORS proxy services are currently unavailable or blocked by your network. This can happen in restrictive network environments (corporate firewalls, VPNs, or content filters). Please try: 1) Using a different network connection, 2) Disabling VPN if active, 3) Trying again later when proxy services recover.')
      }
      
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    console.log('[externalLLM] Response data structure:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasFirstChoice: !!data.choices?.[0],
      hasMessage: !!data.choices?.[0]?.message
    })
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenAI API')
    }

    return data.choices[0].message.content
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] CORS proxy ${corsProxy} timed out, trying next proxy...`)
          return callOpenAI(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies timed out, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callOpenAI(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Request timeout - all CORS proxy services are not responding. Your network may be blocking these services. Please try: 1) Using a different network, 2) Disabling VPN/proxy, 3) Trying again later.')
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] Network error with ${corsProxy}, trying next proxy...`)
          return callOpenAI(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies failed, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callOpenAI(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Network error - unable to connect through any CORS proxy service. Your network environment may be restricting external API calls. This commonly occurs with: corporate firewalls, VPNs, proxy servers, or content filtering. Please try a different network connection or contact your network administrator.')
      }
    }
    throw error
  }
}

async function callPerplexity(prompt: string, apiKey?: string, retryCount = 0, proxyIndex = 0): Promise<string> {
  const key = apiKey || PERPLEXITY_API_KEY
  const MAX_RETRIES = 2
  
  console.log('[externalLLM] callPerplexity invoked (attempt ' + (retryCount + 1) + '/' + (MAX_RETRIES + 1) + ', proxy ' + (proxyIndex + 1) + '/' + CORS_PROXIES.length + ')')
  
  if (!key) {
    throw new Error('Perplexity API key not configured. Please add your API key in Settings.')
  }

  if (!key.startsWith('pplx-')) {
    throw new Error('Invalid Perplexity API key format. API keys must start with "pplx-".')
  }

  console.log('[externalLLM] Calling Perplexity API...')

  const corsProxy = CORS_PROXIES[proxyIndex]
  const targetUrl = 'https://api.perplexity.ai/chat/completions'
  const fullUrl = corsProxy + encodeURIComponent(targetUrl)

  console.log(`[externalLLM] Using CORS proxy: ${corsProxy}`)

  try {
    const response = await fetchWithTimeout(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key.trim()}`
      },
      body: JSON.stringify({
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
      })
    }, REQUEST_TIMEOUT)

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      console.error('[externalLLM] Perplexity API error:', errorData)
      
      if (response.status === 401) {
        throw new Error('Invalid Perplexity API key. Please verify your API key in Settings.')
      } else if (response.status === 403) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] CORS proxy ${corsProxy} blocked request (403), trying next proxy...`)
          return callPerplexity(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies blocked, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callPerplexity(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Access forbidden (403) - All CORS proxy services are currently blocking API requests. This often happens when proxy services detect and block Perplexity API traffic, or your network/ISP is filtering requests. Try: 1) Using a different network (mobile hotspot), 2) Disabling VPN/proxy, 3) Trying again later.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else if (response.status === 502 || response.status === 503 || response.status === 504) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] CORS proxy ${corsProxy} failed with ${response.status}, trying next proxy...`)
          return callPerplexity(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies failed, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callPerplexity(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Network connection issues detected. All CORS proxy services are currently unavailable or blocked by your network. This can happen in restrictive network environments (corporate firewalls, VPNs, or content filters). Please try: 1) Using a different network connection, 2) Disabling VPN if active, 3) Trying again later when proxy services recover.')
      }
      
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from Perplexity API')
    }

    return data.choices[0].message.content
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] CORS proxy ${corsProxy} timed out, trying next proxy...`)
          return callPerplexity(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies timed out, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callPerplexity(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Request timeout - all CORS proxy services are not responding. Your network may be blocking these services. Please try: 1) Using a different network, 2) Disabling VPN/proxy, 3) Trying again later.')
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] Network error with ${corsProxy}, trying next proxy...`)
          return callPerplexity(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies failed, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callPerplexity(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Network error - unable to connect through any CORS proxy service. Your network environment may be restricting external API calls. This commonly occurs with: corporate firewalls, VPNs, proxy servers, or content filtering. Please try a different network connection or contact your network administrator.')
      }
    }
    throw error
  }
}

async function callClaude(prompt: string, apiKey?: string, retryCount = 0, proxyIndex = 0): Promise<string> {
  const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY
  const key = apiKey || CLAUDE_API_KEY
  const MAX_RETRIES = 2
  
  console.log('[externalLLM] callClaude invoked (attempt ' + (retryCount + 1) + '/' + (MAX_RETRIES + 1) + ', proxy ' + (proxyIndex + 1) + '/' + CORS_PROXIES.length + ')')
  
  if (!key) {
    throw new Error('Claude API key not configured. Please add your API key in Settings.')
  }

  if (!key.startsWith('sk-ant-')) {
    throw new Error('Invalid Claude API key format. API keys must start with "sk-ant-".')
  }

  console.log('[externalLLM] Calling Claude API...')

  const corsProxy = CORS_PROXIES[proxyIndex]
  const targetUrl = 'https://api.anthropic.com/v1/messages'
  const fullUrl = corsProxy + encodeURIComponent(targetUrl)

  console.log(`[externalLLM] Using CORS proxy: ${corsProxy}`)

  try {
    const response = await fetchWithTimeout(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key.trim(),
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `You are a professional intelligence analyst creating detailed intelligence briefs.\n\n${prompt}`
          }
        ]
      })
    }, REQUEST_TIMEOUT)

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      console.error('[externalLLM] Claude API error:', errorData)
      
      if (response.status === 401) {
        throw new Error('Invalid Claude API key. Please verify your API key in Settings.')
      } else if (response.status === 403) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] CORS proxy ${corsProxy} blocked request (403), trying next proxy...`)
          return callClaude(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies blocked, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callClaude(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Access forbidden (403) - All CORS proxy services are currently blocking API requests. This often happens when proxy services detect and block Claude API traffic, or your network/ISP is filtering requests. Try: 1) Using a different network (mobile hotspot), 2) Disabling VPN/proxy, 3) Trying again later.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else if (response.status === 502 || response.status === 503 || response.status === 504) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] CORS proxy ${corsProxy} failed with ${response.status}, trying next proxy...`)
          return callClaude(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies failed, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callClaude(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Network connection issues detected. All CORS proxy services are currently unavailable or blocked by your network. This can happen in restrictive network environments (corporate firewalls, VPNs, or content filters). Please try: 1) Using a different network connection, 2) Disabling VPN if active, 3) Trying again later when proxy services recover.')
      }
      
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response from Claude API')
    }

    return data.content[0].text
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] CORS proxy ${corsProxy} timed out, trying next proxy...`)
          return callClaude(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies timed out, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callClaude(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Request timeout - all CORS proxy services are not responding. Your network may be blocking these services. Please try: 1) Using a different network, 2) Disabling VPN/proxy, 3) Trying again later.')
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        if (proxyIndex < CORS_PROXIES.length - 1) {
          console.log(`[externalLLM] Network error with ${corsProxy}, trying next proxy...`)
          return callClaude(prompt, apiKey, retryCount, proxyIndex + 1)
        }
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] All proxies failed, retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callClaude(prompt, apiKey, retryCount + 1, 0)
        }
        throw new Error('Network error - unable to connect through any CORS proxy service. Your network environment may be restricting external API calls. This commonly occurs with: corporate firewalls, VPNs, proxy servers, or content filtering. Please try a different network connection or contact your network administrator.')
      }
    }
    throw error
  }
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

## 1. PERSONAL PROFILE

**Full Name:** ${name}

**Current Role:** ${positionText}${countryText !== 'Not specified' ? `\n**Location/Country:** ${countryText}` : ''}

**Age/Demographic Information:**
Information not publicly available. For enhanced intelligence reports with real-time research capabilities, configure an LLM provider API key in Settings.

**Personal Background:**
${name} serves in the capacity of ${positionText}, a position requiring significant professional expertise and leadership capability.

**Educational Background:** (Typical for this position)
- Advanced degree (Master's or MBA) from recognized institution
- Undergraduate degree in relevant field
- Continuing professional education and certifications
- Industry-specific training and qualifications

**Languages:**
Typically fluent in local language(s) and business English. Additional languages dependent on region and industry exposure.

**Personal Characteristics:** (Based on typical profile for this position)
- Strong communication and interpersonal skills
- Strategic thinking and analytical capabilities
- Results-oriented with attention to operational excellence
- Professional demeanor aligned with organizational culture
- Leadership presence and influence capabilities

**Public Presence:**
- Professional networking activity (LinkedIn, industry platforms)
- Potential participation in industry conferences
- May contribute to industry publications or forums
- Public speaking engagements at professional events

**Personal Interests:** (Common for this professional level)
- Professional development and industry trends
- Networking and relationship building
- May participate in business associations or clubs
- Potential involvement in mentoring or advisory roles

---

## 2. PROFESSIONAL BACKGROUND OVERVIEW

**Current Position and Organization:**
- Position: ${positionText}
- Organization: Information available with AI-enhanced research
- Tenure: Typical senior-level tenure ranges from 2-5+ years
- Reporting structure and span of control varies by organization size

**Current Responsibilities:**
Individuals in the role of ${positionText} typically have:
- Strategic oversight and operational leadership
- Decision-making authority on key initiatives
- Team management and organizational development
- Budget and resource allocation responsibilities
- Stakeholder relationship management
- Cross-functional coordination and collaboration

**Career Timeline and Progression:**
Professionals at this level generally have:
- 10-20+ years of progressive industry experience
- Track record of increasing responsibility and scope
- Multiple positions of increasing seniority
- Demonstrated expertise in specialized areas
- History of measurable achievements and impact
- Professional certifications and continuous development
- Possible cross-industry or international experience

**Industry Expertise and Specializations:**
- Deep understanding of sector dynamics and trends
- Technical proficiency in relevant domains
- Regulatory and compliance knowledge
- Best practices and industry standards awareness
- Specialized knowledge areas specific to role

**Notable Achievements:** (Typical for this level)
- Successfully led major initiatives or transformations
- Contributed to organizational growth and performance
- Developed teams and talent pipelines
- Established strategic partnerships or relationships
- Potential industry recognition or awards

**Publications and Thought Leadership:**
May include industry articles, conference presentations, or participation in professional forums relevant to their domain.

---

## 3. AREAS OF INFLUENCE AND EXPERTISE

**Organizational Influence:**
- Direct authority over strategic decisions and resource allocation
- Influence on organizational direction and priorities
- Leadership in change management and transformation initiatives
- Input on investment and strategic planning decisions
- Voice in executive-level discussions and planning
- Potential board-level interaction or reporting

**Domain Expertise and Technical Competencies:**
- Strategic planning and execution capabilities
- Financial acumen and business strategy
- Operational excellence and process optimization
- Industry-specific technical knowledge
- Risk management and governance
- Innovation and digital transformation awareness

**Professional Standing and Reputation:**
- Recognized expertise within their field and organization
- Professional network spanning industry and beyond
- Potential thought leadership and public presence
- Involvement in industry associations and forums
- Peer recognition and professional credibility
- May serve as advisor or mentor to others

**Decision-Making Authority:**
- Budget approval and resource allocation
- Strategic initiative prioritization
- Hiring and organizational structure decisions
- Vendor and partnership selections
- Policy and process development
- Performance management and evaluation

**Sphere of Influence:**
- Internal: Teams, departments, cross-functional groups
- External: Industry peers, partners, clients, stakeholders
- Potential regulatory or policy influence
- Market or competitive positioning impact

---

## 4. POTENTIAL NETWORK CONNECTIONS

**Internal Organizational Network:**
- Executive leadership team and C-suite executives
- Cross-functional department heads and peers
- Direct reports and extended team members
- Board members and advisors (if applicable)
- Internal stakeholders across business units
- Strategic initiative team members

**External Professional Network:**
- Industry peers and counterparts at other organizations
- Strategic partners and key suppliers
- Client or customer leadership contacts
- Competitor contacts from industry events
- Professional association members and leaders
- Former colleagues now in positions of influence

**Strategic Relationships:**
- Key clients or major customers
- Investment partners or financial stakeholders
- Technology and innovation partners
- Academic and research institution contacts
- Industry analysts and consultants
- Media and communications professionals
- Regulatory or government contacts (if relevant)

**Alumni and Educational Networks:**
- University and business school alumni
- Professional certification program contacts
- Executive education program peers
- Academic mentors or advisors

**Professional and Social Organizations:**
- Industry association memberships
- Professional certification bodies
- Business clubs and networking groups
- Chambers of commerce or trade organizations
- Advisory boards or committees
- Charitable or community organization involvement

---

## 5. STRATEGIC IMPORTANCE ASSESSMENT

**Intelligence Value:** MODERATE TO HIGH

**Access to Strategic Information:**
- Senior-level position indicates access to strategic plans and confidential information
- Visibility into organizational direction and future initiatives
- Knowledge of financial performance and projections
- Awareness of competitive landscape and market intelligence
- Insight into industry trends and regulatory developments
- Understanding of key partnerships and relationships
- Access to sensitive operational data and metrics

**Decision-Making Influence:**
- Direct authority on key organizational matters
- Input on strategic direction and priorities
- Influence over resource allocation and investments
- Impact on personnel and organizational structure
- Voice in policy and governance decisions

**Network Access and Connectivity:**
- Well-positioned within professional and industry circles
- Bridge between organizational levels and external stakeholders
- Access to other high-value contacts and decision-makers
- Potential conduit for information flow and influence
- Connections to multiple spheres (business, government, academic)

**Strategic Value Points:**
- Position provides leverage point for organizational influence
- Network enables access to wider intelligence targets
- Role offers insights into industry dynamics
- Potential as long-term intelligence asset
- Access to non-public strategic information
- Influence on decisions affecting broader stakeholder groups

**Risk and Sensitivity Assessment:**
- May have access to commercially sensitive information
- Position involves fiduciary responsibilities
- Bound by confidentiality and non-disclosure agreements
- Reputation risk considerations
- Professional and ethical constraints on information sharing

---

## 6. KEY CONSIDERATIONS FOR ENGAGEMENT

**Recommended Approach Strategy:**

**Initial Contact Phase:**
- Professional and respectful introduction through appropriate channels
- Clear value proposition demonstrating mutual benefit
- Credible professional context and legitimate business rationale
- Respect for time constraints and professional priorities
- Use of warm introduction through mutual contacts when possible
- Alignment with their professional interests and objectives

**Communication Preferences:** (Typical for this role)
- Concise, results-oriented communication style
- Data-driven and strategic discussions preferred
- Scheduled meetings with clear agendas and objectives
- Professional channels (corporate email, formal meetings)
- Response to time-sensitive matters may be delegated
- Values preparation and substance over casual interaction

**Topics of Interest and Engagement Points:**
- Industry trends and future outlook
- Strategic challenges and competitive dynamics
- Innovation and emerging technologies
- Professional development and thought leadership
- Market dynamics and regulatory changes
- Operational excellence and best practices
- Strategic partnerships and collaboration opportunities
- Organizational transformation and change management

**Optimal Engagement Opportunities:**
- Industry conferences and professional events
- Executive forums and leadership summits
- Thought leadership panels and speaking engagements
- Professional association activities and meetings
- Strategic workshops or roundtable discussions
- Targeted networking events
- Collaborative projects with clear business value

**Motivations and Drivers:** (Common for this profile)
- Professional advancement and recognition
- Organizational success and performance
- Industry leadership and influence
- Innovation and competitive advantage
- Relationship building and networking
- Learning and professional development

**Risk Factors and Sensitivities:**
- Time sensitivity and competing priorities
- Organizational constraints and confidentiality obligations
- Professional reputation and ethics considerations
- Conflict of interest or competitive sensitivities
- Regulatory or legal compliance requirements
- Personal privacy and discretion preferences
- Limited availability due to travel and commitments

**Potential Vulnerabilities or Pressure Points:**
- Performance metrics and organizational targets
- Industry disruption or competitive pressures
- Regulatory changes affecting operations
- Resource constraints or budget limitations
- Succession planning or career progression concerns
- Stakeholder expectations and demands

---

## 7. STRATEGIC RECOMMENDATIONS

**Immediate Actions (Week 1-2):**

1. **Research and Intelligence Gathering**
   - Conduct comprehensive open-source intelligence (OSINT) gathering
   - Review LinkedIn profile, company website, and professional history
   - Search for recent interviews, articles, or public statements
   - Identify mutual connections or professional links
   - Research current organizational priorities and recent developments
   - Review industry news affecting their organization
   - Compile dossier of publicly available information

2. **Network Mapping and Analysis**
   - Map their professional network and key relationships
   - Identify potential introduction pathways
   - Analyze organizational structure and reporting lines
   - Identify colleagues or contacts who may provide insights
   - Research their educational background and alumni networks

3. **Initial Outreach Preparation**
   - Develop compelling value proposition aligned with their interests
   - Prepare professional communication materials
   - Identify appropriate introduction channel (direct, referral, event)
   - Time outreach to align with professional calendar and industry events
   - Draft initial contact message emphasizing mutual value

**Short-Term Engagement (Month 1-3):**

4. **Relationship Initiation**
   - Execute initial contact through optimal channel
   - Focus communication on specific mutual interests or opportunities
   - Establish credibility through expertise and professionalism
   - Propose low-commitment initial engagement (coffee, brief call)
   - Follow up professionally and consistently

5. **Information Development**
   - Conduct ongoing open-source monitoring
   - Track professional activities and public statements
   - Monitor organizational news and developments
   - Attend industry events where they may be present
   - Gather intelligence on priorities and challenges

6. **Relationship Building**
   - Provide value through insights, introductions, or expertise
   - Build trust through consistency and reliability
   - Respect boundaries and professional constraints
   - Identify opportunities for meaningful interaction
   - Develop rapport through shared professional interests

**Medium-Term Strategy (Quarter 2-4):**

7. **Network Expansion**
   - Map broader relationship network and influence spheres
   - Identify other high-value contacts accessible through this person
   - Understand organizational structure and decision-making processes
   - Build relationships with their colleagues and peers
   - Develop multi-level organizational access

8. **Strategic Positioning**
   - Position yourself as valuable professional resource
   - Demonstrate expertise in areas of interest to them
   - Provide exclusive insights or access when appropriate
   - Create opportunities for mutual benefit and collaboration
   - Establish regular touchpoints and communication rhythm

**Long-Term Objectives (Year 1+):**

9. **Sustained Engagement and Development**
   - Maintain ongoing professional relationship
   - Provide consistent value through information, insights, or connections
   - Develop deeper understanding of motivations and drivers
   - Build reputation as trusted and reliable contact
   - Create framework for confidential discussions when appropriate

10. **Strategic Intelligence Cultivation**
   - Gather insights on industry and organizational trends
   - Develop understanding of strategic priorities and plans
   - Identify opportunities for information exchange
   - Build foundation for long-term intelligence development
   - Establish position as go-to resource in relevant domains

11. **Influence and Leverage Development**
   - Identify opportunities to provide strategic value
   - Position for involvement in key initiatives or decisions
   - Develop understanding of pressure points and challenges
   - Create opportunities for deeper collaboration
   - Build framework for strategic influence operations

---

## ASSESSMENT SUMMARY

**Overall Priority:** MEDIUM-HIGH

${name}'s position as ${positionText} represents a valuable potential contact for intelligence operations. The combination of professional standing, organizational influence, and network access creates opportunities for strategic engagement and information gathering.

**Key Success Factors:**
- Professional, respectful approach
- Clear value proposition
- Sustained, consistent engagement
- Mutual benefit orientation
- Respect for professional boundaries

**Next Steps:**
- Complete comprehensive background research
- Develop detailed engagement strategy
- Identify optimal introduction pathway
- Prepare professional outreach materials
- Monitor for engagement opportunities

---

**ANALYST NOTE:** This intelligence brief has been generated using standard template analysis based on position and professional context. For enhanced, AI-powered personalized analysis with real-time research capabilities, configure an LLM provider API key (OpenAI, Perplexity, or Claude) in Settings > Investigation tab.

**For AI-Enhanced Reports:** The investigation feature can leverage advanced language models to generate detailed, context-specific intelligence reports that include:
- Real-time research and current information
- Specific organizational and industry analysis
- Personalized strategic recommendations
- Enhanced relationship mapping
- Dynamic risk assessment

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
