const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

const REQUEST_TIMEOUT = 60000

const CORS_PROXIES = [
  {
    name: 'AllOrigins',
    url: (targetUrl: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    type: 'prepend' as const,
    enabled: true
  },
  {
    name: 'CORSProxy.io',
    url: (targetUrl: string) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    type: 'prepend' as const,
    enabled: true
  },
  {
    name: 'CORS.SH',
    url: (targetUrl: string) => `https://cors.sh/${targetUrl}`,
    type: 'prepend' as const,
    enabled: true
  },
  {
    name: 'ThingProxy',
    url: (targetUrl: string) => `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
    type: 'prepend' as const,
    enabled: true
  },
  {
    name: 'Proxy6.dev',
    url: (targetUrl: string) => `https://proxy6.dev/api/proxy?url=${encodeURIComponent(targetUrl)}`,
    type: 'prepend' as const,
    enabled: false
  }
]

const CUSTOM_PROXY_URL = import.meta.env.VITE_PROXY_URL
const DIRECT_API_MODE = import.meta.env.VITE_DIRECT_API_MODE === 'true'

const API_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  perplexity: 'https://api.perplexity.ai/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: (apiKey: string) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
}

async function callDirectAPI(
  url: string,
  options: RequestInit,
  provider: string
): Promise<Response> {
  console.log(`[externalLLM] Attempting direct API call to ${provider}...`)
  
  try {
    const response = await fetchWithTimeout(url, options, REQUEST_TIMEOUT)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[externalLLM] Direct ${provider} API error:`, errorText)
      
      if (response.status === 401) {
        throw new Error(`Invalid ${provider} API key. Please verify your API key in Settings.`)
      } else if (response.status === 403) {
        throw new Error(`Access forbidden for ${provider} API. Check your API key permissions and billing status.`)
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded for ${provider}. Please try again later.`)
      }
      
      throw new Error(`${provider} API request failed with status ${response.status}`)
    }
    
    console.log(`[externalLLM] ✓ Direct ${provider} API call successful`)
    return response
    
  } catch (error) {
    if (error instanceof Error && error.name === 'TypeError' && error.message.includes('CORS')) {
      console.error(`[externalLLM] CORS error with direct ${provider} API - falling back to proxy mode`)
      throw new Error(`CORS_ERROR`)
    }
    throw error
  }
}

export function isLLMAvailable(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }
    const w = window as any
    const hasSparkLLM = !!(w.spark && w.spark.llm && typeof w.spark.llm === 'function')
    const hasAPIKeys = !!(OPENAI_API_KEY || PERPLEXITY_API_KEY || GEMINI_API_KEY)
    
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

async function callOpenAI(prompt: string, apiKey?: string, useDirectMode?: boolean): Promise<string> {
  const key = apiKey || OPENAI_API_KEY
  const directMode = useDirectMode ?? DIRECT_API_MODE
  
  console.log('[externalLLM] callOpenAI invoked')
  console.log('[externalLLM] apiKey parameter provided:', !!apiKey)
  console.log('[externalLLM] OPENAI_API_KEY env var present:', !!OPENAI_API_KEY)
  console.log('[externalLLM] Final key to use present:', !!key)
  console.log('[externalLLM] Direct API mode:', directMode)
  
  if (!key) {
    throw new Error('OpenAI API key not configured. Please add your API key in Settings > Investigation tab.')
  }

  if (!key.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. API keys must start with "sk-". Please check your API key in Settings.')
  }

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

  if (directMode) {
    try {
      const response = await callDirectAPI(
        API_ENDPOINTS.openai,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key.trim()}`
          },
          body: JSON.stringify(requestBody)
        },
        'OpenAI'
      )

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      
      if (!content) {
        throw new Error('Invalid response format from OpenAI API')
      }

      return content
    } catch (error) {
      if (error instanceof Error && error.message === 'CORS_ERROR') {
        console.log('[externalLLM] Direct mode failed due to CORS, falling back to proxy mode')
      } else {
        throw error
      }
    }
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

  const enabledProxies = CORS_PROXIES.filter(p => p.enabled)
  
  for (const proxy of enabledProxies) {
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
        console.error(`[externalLLM] ${proxy.name} error status:`, response.status)
        console.error(`[externalLLM] ${proxy.name} error headers:`, Object.fromEntries(response.headers.entries()))
        
        if (response.status === 401) {
          throw new Error('Invalid API key. Please verify your OpenAI API key in Settings > Investigation tab.')
        } else if (response.status === 403) {
          console.error('[externalLLM] 403 Forbidden - Common causes:')
          console.error('[externalLLM]   1. API key lacks necessary permissions')
          console.error('[externalLLM]   2. OpenAI account billing not set up or expired')
          console.error('[externalLLM]   3. CORS proxy blocking the request')
          console.error('[externalLLM]   4. API key has insufficient credits')
          
          throw new Error('Access forbidden. Please check your API key permissions:\n\n' +
            '1. Ensure your OpenAI account has billing set up and active credits\n' +
            '2. Verify the API key has proper permissions (not restricted)\n' +
            '3. Check that your OpenAI account is in good standing\n' +
            '4. Your API key may need to be regenerated from OpenAI dashboard')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a few minutes.')
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

  throw new Error('Unable to connect to OpenAI API. All CORS proxies failed.\n\n' +
    'Most common causes:\n' +
    '• Your OpenAI account needs billing set up with active credits\n' +
    '• API key permissions are restricted\n' +
    '• Network firewall blocking API access\n\n' +
    'Solutions:\n' +
    '1. Visit platform.openai.com to verify billing is active\n' +
    '2. Check that your API key has usage permissions\n' +
    '3. Try regenerating your API key from OpenAI dashboard\n' +
    '4. Ensure you have sufficient credits in your account')
}

async function callPerplexity(prompt: string, apiKey?: string, useDirectMode?: boolean): Promise<string> {
  const key = apiKey || PERPLEXITY_API_KEY
  const directMode = useDirectMode ?? DIRECT_API_MODE
  
  console.log('[externalLLM] callPerplexity invoked')
  console.log('[externalLLM] Direct API mode:', directMode)
  
  if (!key) {
    throw new Error('Perplexity API key not configured. Please add your API key in Settings.')
  }

  if (!key.startsWith('pplx-')) {
    throw new Error('Invalid Perplexity API key format. API keys must start with "pplx-".')
  }

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

  if (directMode) {
    try {
      const response = await callDirectAPI(
        API_ENDPOINTS.perplexity,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key.trim()}`
          },
          body: JSON.stringify(requestBody)
        },
        'Perplexity'
      )

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      
      if (!content) {
        throw new Error('Invalid response format from Perplexity API')
      }

      return content
    } catch (error) {
      if (error instanceof Error && error.message === 'CORS_ERROR') {
        console.log('[externalLLM] Direct mode failed due to CORS, falling back to proxy mode')
      } else {
        throw error
      }
    }
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

  const enabledProxies = CORS_PROXIES.filter(p => p.enabled)

  for (const proxy of enabledProxies) {
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

  throw new Error('Unable to connect to Perplexity API. All CORS proxies failed.\n\n' +
    'Please verify:\n' +
    '• Your Perplexity API key is valid and active\n' +
    '• Your account has sufficient credits\n' +
    '• API key format is correct (should start with "pplx-")\n\n' +
    'Visit perplexity.ai/settings/api to check your API key status.')
}

async function callClaude(prompt: string, apiKey?: string, useDirectMode?: boolean): Promise<string> {
  const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY
  const key = apiKey || CLAUDE_API_KEY
  const directMode = useDirectMode ?? DIRECT_API_MODE
  
  console.log('[externalLLM] callClaude invoked')
  console.log('[externalLLM] Direct API mode:', directMode)
  
  if (!key) {
    throw new Error('Claude API key not configured. Please add your API key in Settings.')
  }

  if (!key.startsWith('sk-ant-')) {
    throw new Error('Invalid Claude API key format. API keys must start with "sk-ant-".')
  }

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

  if (directMode) {
    try {
      const response = await callDirectAPI(
        API_ENDPOINTS.claude,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': key.trim(),
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(requestBody)
        },
        'Claude'
      )

      const data = await response.json()
      const content = data.content?.[0]?.text
      
      if (!content) {
        throw new Error('Invalid response format from Claude API')
      }

      return content
    } catch (error) {
      if (error instanceof Error && error.message === 'CORS_ERROR') {
        console.log('[externalLLM] Direct mode failed due to CORS, falling back to proxy mode')
      } else {
        throw error
      }
    }
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

  const enabledProxies = CORS_PROXIES.filter(p => p.enabled)

  for (const proxy of enabledProxies) {
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

  throw new Error('Unable to connect to Claude API. All CORS proxies failed.\n\n' +
    'Please verify:\n' +
    '• Your Anthropic API key is valid and active\n' +
    '• Your account has sufficient credits\n' +
    '• API key format is correct (should start with "sk-ant-")\n\n' +
    'Visit console.anthropic.com to check your API key status.')
}

async function callGemini(prompt: string, apiKey?: string, useDirectMode?: boolean): Promise<string> {
  const key = apiKey || GEMINI_API_KEY
  const directMode = useDirectMode ?? DIRECT_API_MODE
  
  console.log('[externalLLM] callGemini invoked')
  console.log('[externalLLM] Direct API mode:', directMode)
  
  if (!key) {
    throw new Error('Gemini API key not configured. Please add your API key in Settings.')
  }

  if (!key.startsWith('AIza')) {
    throw new Error('Invalid Gemini API key format. API keys must start with "AIza".')
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `You are a professional intelligence analyst creating detailed intelligence briefs.\n\n${prompt}`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8000,
    }
  }

  const targetUrl = typeof API_ENDPOINTS.gemini === 'function' ? API_ENDPOINTS.gemini(key.trim()) : ''

  if (directMode) {
    try {
      const response = await callDirectAPI(
        targetUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        },
        'Gemini'
      )

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!content) {
        if (data.error) {
          throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`)
        }
        if (data.candidates?.[0]?.finishReason === 'SAFETY') {
          throw new Error('Content was blocked by Gemini safety filters. Please try adjusting your investigation parameters.')
        }
        throw new Error('Invalid response format from Gemini API')
      }

      return content
    } catch (error) {
      if (error instanceof Error && error.message === 'CORS_ERROR') {
        console.log('[externalLLM] Direct mode failed due to CORS, falling back to proxy mode')
      } else {
        throw error
      }
    }
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
          provider: 'gemini',
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

  const enabledProxies = CORS_PROXIES.filter(p => p.enabled)

  for (const proxy of enabledProxies) {
    try {
      console.log(`[externalLLM] Attempting ${proxy.name}...`)
      
      const proxyUrl = proxy.url(targetUrl)
      
      const response = await fetchWithTimeout(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }, REQUEST_TIMEOUT)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[externalLLM] ${proxy.name} error response:`, errorText)
        
        if (response.status === 401 || response.status === 400) {
          throw new Error('Invalid Gemini API key. Please verify your API key in Settings.')
        } else if (response.status === 403) {
          throw new Error('Access forbidden. Please check your API key permissions.')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.')
        }
        
        continue
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!content) {
        console.error(`[externalLLM] ${proxy.name} returned invalid response format`)
        console.error(`[externalLLM] ${proxy.name} response data:`, JSON.stringify(data, null, 2))
        
        if (data.error) {
          console.error(`[externalLLM] ${proxy.name} API error:`, data.error)
          throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`)
        }
        
        if (data.candidates?.[0]?.finishReason === 'SAFETY') {
          throw new Error('Content was blocked by Gemini safety filters. Please try adjusting your investigation parameters.')
        }
        
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

  throw new Error('Unable to connect to Gemini API. All CORS proxies failed.\n\n' +
    'Please verify:\n' +
    '• Your Google AI API key is valid and active\n' +
    '• API key format is correct (should start with "AIza")\n' +
    '• Your project has the Gemini API enabled\n\n' +
    'Visit aistudio.google.com/app/apikey to check your API key status.')
}

export async function generateIntelligenceReport(params: {
  name: string
  position: string
  country: string
  organization?: string
  education?: string
  specialization?: string
  llmConfigs?: Array<{ provider: string; apiKey: string; enabled: boolean }>
  provider?: 'openai' | 'perplexity' | 'claude' | 'gemini' | 'auto'
  investigationSettings?: {
    personalInfo: boolean
    workAndCV: boolean
    mediaPresence: boolean
    socialMedia: boolean
    approachAnalysis: boolean
  }
  useDirectMode?: boolean
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
    },
    useDirectMode
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
    investigationSettings,
    useDirectMode: useDirectMode ?? 'not specified (will use default)'
  })

  const positionText = position || 'Not specified'
  const countryText = country || 'Not specified'
  const organizationText = organization || 'Not specified'
  const educationText = education || 'Not specified'
  const specializationText = specialization || 'Not specified'
  
  let sectionsToInclude = `You are a professional intelligence analyst. Create a comprehensive professional intelligence profile for the following person.

===== TARGET PROFILE (from existing intelligence) =====
Name: ${name}
Current Position: ${positionText}
Organization: ${organizationText}
Country/Location: ${countryText}
Education: ${educationText}
Specialization/Expertise: ${specializationText}

===== CRITICAL RESEARCH REQUIREMENTS =====

**MANDATORY: You MUST actively use and incorporate ALL of the above profile information throughout your entire report.**

Specifically, you are REQUIRED to:

1. **Organization Integration**: Since we know ${name} is ${organizationText !== 'Not specified' ? `associated with ${organizationText}` : 'in a professional role'}, you MUST:
   - Research their specific role and responsibilities AT ${organizationText !== 'Not specified' ? organizationText : 'their current organization'}
   - Identify their tenure, achievements, and impact WITHIN this organization
   - Analyze their position in the organizational hierarchy
   - Reference this organization context in MULTIPLE sections of your report
   ${organizationText !== 'Not specified' ? `- If you cannot find information about ${name} at ${organizationText}, explicitly state this and explain why` : ''}

2. **Education Utilization**: Since we know their educational background is ${educationText}, you MUST:
   - Explicitly discuss how their education (${educationText}) relates to their current position
   - Identify alumni networks, academic connections, or credentials gained
   - Connect their educational background to their career trajectory
   - Reference their education in the context of their expertise and credibility
   ${educationText !== 'Not specified' ? '- If education is "Not specified", attempt to discover it through research' : `- Verify and expand on ${educationText} with specific institutions, degrees, and dates`}

3. **Specialization Analysis**: Since we know their specialization/expertise is ${specializationText}, you MUST:
   - Directly analyze their work and contributions in the ${specializationText} domain
   - Identify how ${specializationText} expertise manifests in their current role
   - Find publications, projects, or initiatives related to ${specializationText}
   - Assess their standing and reputation within the ${specializationText} field
   ${specializationText !== 'Not specified' ? '- If specialization is "Not specified", infer and identify their areas of expertise based on research' : `- Provide evidence of their ${specializationText} expertise through concrete examples`}

4. **Geographic Context**: Since they are located in ${countryText}, you MUST:
   - Consider cultural, professional, and regional context of ${countryText}
   - Identify local industry dynamics, networks, and influence in ${countryText}
   - Reference how being based in ${countryText} affects their work and approach
   ${countryText !== 'Not specified' ? '- If location is "Not specified", attempt to determine their primary location' : `- Include ${countryText}-specific information in multiple sections`}

5. **Position Deep-Dive**: For their role as ${positionText}, you MUST:
   - Provide detailed analysis of what ${positionText} typically entails
   - Identify how ${name} specifically performs this role
   - Compare their approach to industry standards for ${positionText}
   - Analyze the strategic importance of the ${positionText} position

**VERIFICATION PRINCIPLE**: All research must be cross-checked to ensure it relates to "${name}" who is ${positionText}${organizationText !== 'Not specified' ? ` at ${organizationText}` : ''}${countryText !== 'Not specified' ? ` in ${countryText}` : ''}${educationText !== 'Not specified' ? ` with education background in ${educationText}` : ''}${specializationText !== 'Not specified' ? ` specializing in ${specializationText}` : ''}. If you find information about a different person with the same name, explicitly note the discrepancy.

**INTEGRATION REQUIREMENT**: The provided profile information (organization, education, specialization, location, position) must appear and be substantively discussed in MULTIPLE sections of your report, not just mentioned once. Each major section should naturally incorporate these known facts.

Please provide a detailed analysis with the following sections:
`

  if (investigationSettings.personalInfo) {
    sectionsToInclude += `
1. PERSONAL PROFILE (COMPREHENSIVE DEEP SEARCH)
   Conduct an exhaustive search for personal information about ${name}, verifying against their known role as ${positionText}:
   
   A. Identity & Background:
      - Full legal name, any known aliases, maiden names, or previous names
      - Date of birth and current age (search public records, social media, news archives)
      - Nationality, citizenship status, and place of birth (including city/region specifics)
      - Current residence and address history (if publicly available from property records, voter registrations)
      - Family background: parents' names, occupations, and notable family history
      - Marital status, spouse/partner details (name, occupation, background)
      - Children (number, ages, schools, activities - if publicly shared)
      - Extended family members in positions of influence or note
   
   B. Educational Journey:
      - Complete educational history from high school onwards
      - Universities attended (with specific campuses, dates, and degree programs)
      - Academic performance indicators (honors, Dean's list, scholarships, fellowships)
      - Thesis topics, research areas, or significant academic work
      - Student organizations, leadership roles, or campus activities
      - Notable professors, mentors, or academic advisors
      - Study abroad programs or international educational experiences
      - Professional development courses, executive education, or continued learning
   
   C. Personal Characteristics & Style:
      - Communication style and preferences (formal/informal, written/verbal strengths)
      - Public speaking ability and comfort level (evidence from events, videos)
      - Personal presentation and professional appearance (dress style, personal brand)
      - Personality indicators from interviews, profiles, or public interactions
      - Known strengths, weaknesses, or areas of expertise according to colleagues/peers
      - Work style and collaboration approach (from LinkedIn recommendations, testimonials)
   
   D. Interests & Personal Life:
      - Hobbies, sports, recreational activities (evidence from social media, interviews)
      - Cultural interests (art, music, theater, literature preferences)
      - Travel history and favorite destinations (from social posts, conference attendance)
      - Personal passions and causes they care about deeply
      - Memberships in clubs, societies, or recreational organizations
      - Personal achievements outside professional realm (athletic, artistic, community)
   
   E. Values, Beliefs & Worldview:
      - Political affiliations or voting patterns (if publicly stated)
      - Religious or spiritual beliefs and practices (if shared publicly)
      - Publicly stated values and ethical positions
      - Stance on major social, environmental, or political issues
      - Philanthropic interests and charitable giving patterns
      - Advocacy work or causes actively supported
   
   F. Public Reputation & Controversies:
      - Media coverage sentiment analysis (positive, neutral, negative)
      - Any controversies, scandals, or public criticism received
      - Legal issues, lawsuits, or regulatory actions (public records)
      - Crisis situations and how they were handled
      - Reputation among peers, competitors, and industry observers
      - Public perception evolution over time
   
   G. Personal Network & Relationships:
      - Close personal friends and advisors (if publicly known)
      - Influential personal relationships outside of work
      - Alumni network connections and engagement level
      - Social circles and community involvement
`
  }

  if (investigationSettings.workAndCV) {
    sectionsToInclude += `
2. PROFESSIONAL BACKGROUND & CAREER ANALYSIS (EXHAUSTIVE CV RECONSTRUCTION)
   Build a complete professional biography for ${name}, currently ${positionText}${organizationText !== 'Not specified' ? ` at ${organizationText}` : ''}:
   
   A. Current Role Deep Dive:
      - Exact job title and full organizational hierarchy position
      - Start date and tenure length (months/years in current role)
      - Detailed scope of responsibilities and authority levels
      - Team size and structure (direct reports, matrix teams, total organization size)
      - Budget responsibility and financial oversight (if publicly disclosed)
      - Key performance indicators and success metrics for the role
      - Major initiatives currently leading or recently completed
      - Strategic priorities and focus areas in current position
      - Reporting structure (who they report to, including that person's background)
   
   B. Complete Career Timeline (Reverse Chronological):
      For each previous position, provide:
      - Organization name, location, and industry context
      - Exact dates (month/year format: e.g., "January 2015 - March 2018")
      - Job title and level (entry, mid, senior, executive)
      - Key responsibilities and scope
      - Major achievements and quantifiable results
      - Reason for leaving (if publicly known - promotions, relocations, strategic moves)
      - Notable projects or initiatives from that period
   
   C. Career Progression Analysis:
      - Career trajectory assessment (linear growth, lateral moves, pivots, accelerations)
      - Speed of advancement compared to industry norms
      - Strategic career decisions and their outcomes
      - Gaps in employment and their explanations (sabbaticals, education, entrepreneurship)
      - Industry transitions and sector expertise development
      - Geographic relocations and international experience gained
      - Functional area evolution (e.g., from operations to strategy to leadership)
   
   D. Industry Expertise & Specializations:
      - Primary industry sectors and depth of experience in each
      - Technical skills and certifications (with certification dates and renewal status)
      - Functional expertise areas (finance, operations, marketing, technology, etc.)
      - Domain knowledge specializations
      - Emerging area expertise or recent skill development
   
   E. Notable Achievements & Contributions:
      - Specific projects led with measurable outcomes (revenue impact, cost savings, growth metrics)
      - Innovations introduced or processes improved
      - Turnarounds or crisis management successes
      - Expansion initiatives (new markets, products, geographies)
      - Mergers, acquisitions, or integration leadership
      - Product launches or service innovations
      - Awards and recognition received (with granting organizations and dates)
   
   F. Thought Leadership & Publications:
      - Books authored or co-authored (titles, publishers, publication dates, topics)
      - Academic papers and research publications (journals, co-authors, citation counts)
      - Industry white papers and reports
      - Patents filed or granted (with patent numbers and dates if available)
      - Blog posts, articles, and opinion pieces (regular columns or one-time pieces)
      - Conference papers and presentations
   
   G. Professional Network & Influence:
      - Board positions held (for-profit and non-profit, with organization names)
      - Advisory board memberships and roles
      - Industry association leadership positions
      - Mentorship roles and known mentees who have succeeded
      - Professional collaborations and partnerships
      - C-suite or executive connections and relationships
      - Cross-industry network breadth
   
   H. Compensation & Financial Indicators:
      - Salary range for current position (based on industry benchmarks and public data)
      - Historical compensation growth trajectory
      - Equity holdings or stock options (if public company)
      - Bonus structures and performance incentives (if disclosed)
      - Comparison to peer compensation levels
   
   I. Professional Reputation:
      - Industry standing and recognition level
      - Peer reviews and colleague testimonials (LinkedIn recommendations analysis)
      - Competitor perspectives on their capabilities
      - Media quotes about their professional abilities
      - Thought leader status and influence metrics
   
   J. Future Career Trajectory:
      - Likely next career moves based on pattern analysis
      - Positions they may be qualified for or pursuing
      - Industries or companies they might be attracted to
      - Retirement timeline considerations (if applicable)
      - Succession planning implications in current role
`
  }

  if (investigationSettings.mediaPresence) {
    sectionsToInclude += `
3. MEDIA PRESENCE & PUBLIC VISIBILITY ANALYSIS (COMPREHENSIVE MEDIA FOOTPRINT)
   Conduct an exhaustive analysis of ${name}'s media presence and public visibility:
   
   A. Media Appearances Inventory:
      - Television appearances (show names, networks, dates, topics discussed, interview clips)
      - Radio interviews (stations, programs, hosts, dates, audio availability)
      - Podcast episodes (podcast names, episode numbers/titles, dates, key discussion points)
      - Documentary features or news segment inclusions
      - Frequency analysis: appearances per month/quarter/year over time
      - Recurring media opportunities vs. one-time appearances
   
   B. Print & Digital Media Coverage:
      - Major newspaper features and interviews (publication names, journalists, dates, article titles)
      - Magazine profiles and cover stories (publication names, issue dates, page counts)
      - Trade publication coverage and industry press mentions
      - Online news articles and digital publications (URLs, publication dates, reach metrics)
      - Press releases mentioning ${name} (dates, contexts, issuing organizations)
      - News aggregator presence and syndication reach
   
   C. Speaking Engagements & Public Presentations:
      - Conference keynotes and panel appearances (event names, dates, locations, topics)
      - Industry summit presentations (organizations, themes, audience size estimates)
      - Webinar hosting or guest appearances (platforms, dates, registration numbers if available)
      - Virtual summit participation and online event presence
      - University lectures or guest teaching (institutions, dates, course contexts)
      - Corporate speaking engagements (types of organizations, typical topics)
      - Speaking frequency and consistency over time
   
   D. Media Sentiment & Narrative Analysis:
      - Overall sentiment distribution (% positive, neutral, negative, mixed)
      - Positive coverage themes and favorable narratives
      - Critical coverage areas and recurring criticisms
      - Controversial statements or positions taken
      - Media narrative evolution over time (timeline of shifting perceptions)
      - Comparison of sentiment across different media types and outlets
   
   E. Key Messages & Communication Themes:
      - Core messages consistently communicated across platforms
      - Topic areas ${name} is sought out to discuss
      - Talking points used repeatedly in various forums
      - Thought leadership themes and positions staked
      - Evolution of messaging over time (new topics, retired themes)
      - Alignment between personal messages and organizational messaging
   
   F. Media Relationships:
      - Journalists who regularly cover ${name} (names, publications, relationship nature)
      - Preferred media outlets and go-to publications for ${name}
      - Media training evidence and comfort level with press
      - Accessibility to media (responsiveness, availability, interview willingness)
      - Media contacts and PR representation (agencies, spokespersons, press teams)
   
   G. Crisis Communication & Reputation Management:
      - Crisis situations handled through media (nature, response strategy, outcomes)
      - Controversy management and damage control approaches
      - Apologies, clarifications, or corrections issued
      - Legal communication and official statements during disputes
      - Effectiveness of crisis communication measured by sentiment recovery
   
   H. Thought Leadership Content:
      - Opinion pieces and editorials authored (publication names, dates, topics, URLs)
      - Commentary and expert analysis provided to media
      - Bylined articles in industry and mainstream publications
      - Content marketing pieces (blogs, LinkedIn articles, Medium posts)
      - Video content creation (YouTube, company channels, personal channels)
   
   I. Public Speaking Skills Assessment:
      - Evidence of media training (polish, message discipline, handling tough questions)
      - Public speaking comfort level and effectiveness (from video analysis)
      - Ability to simplify complex topics for general audiences
      - Charisma and screen presence evaluation
      - Handling of hostile or challenging interviews
      - Memorable quotes or soundbites created
   
   J. Media Visibility Benchmarking:
      - Share of voice compared to industry peers and competitors
      - Media mentions volume compared to similar-level executives
      - Quality of media placements (tier 1 vs. tier 2 vs. trade vs. local)
      - Trend analysis: growing, stable, or declining media presence
      - Strategic gaps in media coverage (topics, outlets, audiences not reached)
   
   K. Geographic & Platform Distribution:
      - Media coverage by country/region (global vs. regional vs. local focus)
      - Platform distribution (traditional media vs. digital vs. social vs. podcasts)
      - Language diversity of coverage (English, other languages, translations)
      - Media format preferences and effectiveness by medium
`
  }

  if (investigationSettings.socialMedia) {
    sectionsToInclude += `
4. SOCIAL MEDIA (SoMe) PRESENCE & DIGITAL FOOTPRINT (DEEP DIGITAL INTELLIGENCE)
   Conduct comprehensive social media intelligence gathering on ${name}:
   
   A. Platform-by-Platform Analysis:
      
      LinkedIn:
      - Profile URL and completeness score
      - Headline and summary messaging analysis
      - Connection count and growth trajectory
      - Follower count (if Creator Mode enabled)
      - Post frequency (average per week/month)
      - Engagement rate (average likes, comments, shares per post)
      - Content themes (career advice, industry insights, company news, personal brand)
      - Activity patterns (best-performing post types, optimal posting times)
      - Recommendations received (count, quality, from whom)
      - Skills endorsed and by whom (top skills, endorsement patterns)
      - Groups membership and activity level
      - Newsletter or Creator content (if applicable)
      - Company page relationships and engagement
      
      Twitter/X:
      - Handle (@username) and verification status
      - Follower count and following count (follower/following ratio)
      - Tweet frequency and consistency
      - Engagement metrics (average retweets, likes, replies per tweet)
      - Content mix (original content %, retweets %, replies %)
      - Hashtag strategy and effectiveness
      - Thread creation and long-form content patterns
      - Audience demographics (if discernible from followers)
      - Influential followers and key relationships
      - Mentions and tags received from others
      - Lists inclusion (what lists is ${name} included in)
      - Twitter Spaces participation or hosting
      - Controversies or viral moments (positive or negative)
      
      Facebook:
      - Profile/Page type (personal, professional page, or both)
      - Follower/friend count and page likes
      - Post frequency and content types
      - Video content creation and performance
      - Facebook Live usage and watch numbers
      - Group administration or membership
      - Public vs. private content strategy
      - Community engagement and discussion participation
      
      Instagram:
      - Handle and verification status
      - Follower count and following count
      - Post frequency (grid posts, stories, reels)
      - Content aesthetic and visual branding
      - Engagement rate (likes and comments relative to followers)
      - Story highlights and key messaging
      - Reels performance and video content strategy
      - Collaboration and tag patterns
      - Professional vs. personal content balance
      - Use of Instagram for thought leadership or purely personal
      
      YouTube:
      - Channel name and subscriber count
      - Video upload frequency and consistency
      - View counts and watch time indicators
      - Content series or regular programming
      - Collaboration with other creators
      - Comment engagement and community management
      - Monetization evidence (ads, memberships, sponsorships)
      - Topic areas covered and niche positioning
      
      TikTok (if present):
      - Handle and follower count
      - Content strategy (educational, entertainment, personal brand)
      - Viral videos or trending participation
      - Hashtag challenges and participation
      - Engagement metrics and audience demographics
      
      Other Platforms:
      - Reddit participation (subreddits, karma, comment history if public)
      - Medium publications or following
      - Substack or personal newsletter
      - Discord community participation or server ownership
      - Clubhouse or audio social participation
      - Threads (Meta) presence and activity
      - Mastodon or alternative platform presence
   
   B. Cross-Platform Content Strategy:
      - Content repurposing patterns across platforms
      - Platform-specific messaging vs. unified messaging
      - Cross-promotion strategies between platforms
      - Link sharing patterns (what content is shared where)
      - Platform specialization (which platform for which message type)
   
   C. Audience Analysis:
      - Total cross-platform reach (combined followers/connections)
      - Audience demographics (age, location, industry, job function where discernible)
      - Follower quality assessment (real followers vs. suspicious accounts)
      - Audience growth rates and trends over time
      - Engagement rate trends (improving, stable, declining)
      - Most engaged audience segments
      - Geographic distribution of followers
      - Industry/professional distribution of connections
   
   D. Content Performance Intelligence:
      - Best-performing content types (videos, text, images, links)
      - Optimal posting times and frequencies for maximum engagement
      - Topic areas that resonate most with audience
      - Viral moments or breakout content pieces
      - Content that sparked conversation or debate
      - Underperforming content patterns to avoid
      - Seasonal or event-driven engagement patterns
   
   E. Engagement Patterns & Community Management:
      - Response rate to comments and mentions
      - Direct engagement with followers (replies, likes, acknowledgments)
      - Community building efforts (hosting chats, AMAs, Q&A sessions)
      - Collaboration and cross-promotion with peers
      - User-generated content encouragement or sharing
      - Handling of criticism or negative comments
      - Building and nurturing of superfans or brand advocates
   
   F. Influence & Thought Leadership Metrics:
      - Influence scores (if available from third-party tools)
      - Share of voice in specific topic areas or hashtags
      - Mention frequency by others in the field
      - Citation and reference by industry publications or influencers
      - Speaking opportunities generated from social media presence
      - Media interview requests originating from social visibility
      - Brand partnership or sponsorship evidence
   
   G. Network & Relationship Intelligence:
      - Key connections and relationships visible on social platforms
      - Mutual connections with other influential figures
      - Cliques or network clusters (who interacts with whom)
      - Professional network vs. personal network overlap
      - Alumni network engagement on social platforms
      - Industry peer interactions and relationships
      - Mentor/mentee relationships visible through interactions
   
   H. Messaging & Brand Consistency:
      - Personal brand coherence across all platforms
      - Professional vs. personal content balance
      - Values and priorities communicated through content choices
      - Visual branding consistency (profile photos, banners, color schemes)
      - Bio/headline messaging alignment across platforms
      - Voice and tone consistency (formal, casual, humorous, serious)
   
   I. Controversies & Risk Indicators:
      - Past controversial posts or deleted content (if traceable)
      - Negative sentiment spikes and their causes
      - Flame wars, public disagreements, or feuds
      - Apologies or clarifications issued on social media
      - Blocked accounts or public conflicts
      - Ratio'd tweets or heavily criticized posts
      - Platform suspensions or content removals
   
   J. Digital Reputation & Online Reviews:
      - Professional reputation sites (Glassdoor reviews if they're an employer/manager)
      - Rate My Professor or similar if academic
      - Google search result management and top results
      - Wikipedia presence and edit history (if notable enough)
      - Online mentions sentiment across the web
      - Digital footprint breadth (discoverability across platforms)
   
   K. Competitive Positioning:
      - Social media presence compared to direct peers
      - Industry benchmarks for similar roles/positions
      - Emerging platform adoption vs. competitors
      - Engagement quality vs. quantity compared to others
      - Thought leadership positioning relative to the field
   
   L. Historical Analysis & Trends:
      - Social media presence evolution (when accounts created, growth phases)
      - Shifts in content strategy over time
      - Platform abandonment or adoption patterns
      - Engagement trend lines (growing, plateauing, declining)
      - Archive analysis for changed positions or deleted content
      - Career transition visibility through social media timeline
`
  }

  if (investigationSettings.approachAnalysis) {
    sectionsToInclude += `
5. AI-POWERED STRATEGIC APPROACH & ENGAGEMENT PLAYBOOK (COMPREHENSIVE INTELLIGENCE-DRIVEN RECOMMENDATIONS)
   
   Using ALL intelligence gathered above about ${name} (personal profile, professional background, media presence, social media activity), provide detailed, actionable strategic recommendations:
   
   A. Optimal Communication Strategy:
      Based on ${name}'s demonstrated communication preferences, media presence, and social media behavior:
      - **Primary Contact Channel:** Identify the single best method for initial contact (email, LinkedIn, Twitter DM, mutual introduction, conference approach, etc.) with specific reasoning based on their observable behavior
      - **Secondary Channels:** Backup communication methods ranked by likelihood of response
      - **Email Strategy:** If email is appropriate, provide:
         * Best email subject line approaches based on their interests
         * Optimal email length and format (formal, casual, data-driven, story-driven)
         * Call-to-action phrasing most likely to resonate
         * Time to send (based on their social media activity patterns and timezone)
      - **LinkedIn Approach:** If LinkedIn is appropriate, provide:
         * Connection request message template personalized to their interests
         * Whether to engage with their content first (and for how long)
         * Types of value-add comments to make on their posts
      - **Twitter/X Engagement:** If Twitter is a viable channel:
         * Types of tweets to quote or reply to
         * Hashtags they follow that could create visibility
         * Timing based on their activity patterns
      - **In-Person Meeting Strategy:** If applicable:
         * Conference, events, or venues they attend (from media/social analysis)
         * Networking events or professional gatherings they frequent
         * Optimal approach (direct introduction, mutual connection introduction, panel discussion engagement)
      - **Response Timing:** Expected response timeframe based on their social media responsiveness and public accessibility
   
   B. Conversation Starters & Ice Breakers:
      Provide 5-7 specific, personalized conversation starters based on the intelligence gathered:
      - Recent work achievements or projects they've publicly discussed
      - Shared alma mater, previous employer, or geographic connection
      - Recent media appearance or interview they gave (reference specific points)
      - Industry trend or news item relevant to their expertise
      - Personal interests or hobbies discovered through research
      - Mutual connections or shared professional network
      - Recent social media post or opinion they shared
      
      For EACH conversation starter, explain:
      - Why this topic would resonate with ${name}
      - How to transition from this opener to your actual objective
      - Potential follow-up questions or discussion points
   
   C. Topics of High Interest & Passion Points:
      Based on content analysis of their media appearances, social posts, and professional work:
      - **Top 3 Professional Topics:** Subjects they speak about most frequently and passionately
         * Supporting evidence (where/when they discussed it)
         * Specific angles or perspectives they take
         * How to frame your message around these topics
      - **Personal Interests to Reference:** Hobbies, causes, or interests that could build rapport
         * When and where to mention these (build relationship vs. initial contact)
         * How to show genuine interest vs. appearing researched/stalker-ish
      - **Industry Trends They Care About:** Emerging areas where they're vocal
         * Their position on these trends (enthusiast, skeptic, thought leader)
         * How to align or respectfully disagree
   
   D. Value Proposition Framing:
      How to position your ask/offer based on what ${name} values:
      - **Primary Motivators:** What drives them based on career choices and public statements (impact, innovation, recognition, financial success, legacy, solving problems)
      - **Frame Your Offer:** How to position what you're offering in terms they care about
         * If seeking their help: Frame in terms of the impact/legacy/recognition they'd gain
         * If offering opportunity: Emphasize aspects that align with their stated goals
      - **Social Proof:** References, companies, or people to mention that would impress them
      - **Avoid:** Topics, framings, or approaches likely to turn them off
   
   E. Building Trust & Rapport Strategies:
      Step-by-step approach to developing relationship:
      - **Phase 1 - Initial Contact (Day 1-7):**
         * Exact messaging approach and channel
         * What to ask for in first interaction (coffee, quick call, advice, introduction)
         * Expected response and next steps
      - **Phase 2 - First Interaction (Week 2-4):**
         * Meeting format (virtual, in-person, phone, email exchange)
         * Preparation talking points based on their background
         * Questions to ask that demonstrate research without being creepy
         * How to provide value in the first interaction
      - **Phase 3 - Relationship Development (Month 2-3):**
         * Frequency and type of follow-up
         * Value-add opportunities (introductions, insights, resources)
         * Content to share that they'd find valuable
         * When to make your actual ask/pitch
      - **Long-term Nurture:**
         * Cadence for staying in touch
         * Events or opportunities to invite them to
         * Mutual value exchange to sustain relationship
   
   F. Optimal Timing & Context:
      When and where to engage for maximum receptivity:
      - **Best Times to Reach Out:**
         * Day of week (based on social media activity and media appearance patterns)
         * Time of day (based on timezone and activity patterns)
         * Time of month/quarter (considering business cycles in their industry)
      - **Contextual Opportunities:**
         * After they post about a relevant topic on social media
         * Following a media appearance or publication
         * Around industry events they're likely attending
         * During career transitions or company milestones
      - **Times to AVOID:**
         * Known busy periods (based on their industry/role)
         * Right after controversial statements or during crises
         * When they're likely traveling (based on social media patterns)
   
   G. Psychological Profile & Influence Tactics:
      Based on communication style, career decisions, and public behavior:
      - **Decision-Making Style:**
         * Data-driven vs. intuition-based (evidence from their background)
         * Quick decider vs. deliberative (career move patterns)
         * Consensus-seeker vs. independent (social media behavior, leadership style)
      - **Most Effective Influence Approaches:**
         * Logical/analytical persuasion (provide data, ROI, case studies)
         * Emotional/values-based appeal (align with their stated values)
         * Social proof (testimonials, similar respected people who've done X)
         * Authority/expertise (credentials, track record, third-party validation)
         * Scarcity/urgency (limited opportunity, time-sensitive)
      - **Personality Indicators:**
         * Extraversion vs. introversion (comfort in public settings)
         * Detail-oriented vs. big picture (communication style analysis)
         * Risk tolerance (career moves, statements made)
         * Collaborative vs. independent work style
   
   H. Networking Path & Mutual Connections:
      Leverage network intelligence:
      - **Warm Introduction Options:**
         * List of potential mutual connections who could introduce you (from LinkedIn, social media, career history overlap)
         * Best introducers ranked by: closeness to ${name}, credibility, willingness to help
         * Introduction message template for the introducer
      - **Shared Experiences:**
         * Alumni networks to leverage (universities, companies, programs)
         * Industry associations or groups both belong to
         * Events both have attended or will attend
      - **Second-Degree Connections:**
         * People you know who know ${name}
         * Path to develop relationship through intermediaries
   
   I. Meeting Preparation & Interaction Playbook:
      For when you secure a meeting or call:
      - **Pre-Meeting Intelligence Refresh:**
         * Recent news or achievements to acknowledge (check week before meeting)
         * Recent social media posts to reference naturally
         * Current company/industry news to discuss
      - **Meeting Structure:**
         * Ideal meeting length based on their communication style
         * Topic sequencing (rapport building → value delivery → ask)
         * Questions to ask that show preparation and build credibility
      - **During Meeting:**
         * Rapport-building references to make (shared connections, interests, experiences)
         * Active listening cues they'll appreciate (based on communication style)
         * How to handle objections or pushback (based on their debate style from media)
         * When and how to make your ask
      - **Post-Meeting:**
         * Immediate follow-up (timing and content)
         * How to reference discussion in thank-you note
         * Next steps and commitments to deliver on
   
   J. Potential Concerns, Sensitivities & Red Flags:
      What to absolutely avoid:
      - **Sensitive Topics:** Issues they've been criticized for or controversies to avoid mentioning
      - **Communication Don'ts:**
         * Overly aggressive sales approaches (if they value authenticity)
         * Name-dropping the wrong people (competitors, people they've had issues with)
         * Assumptions about their position on controversial topics
      - **Red Flags from Their Perspective:**
         * What would make them distrust you or disengage
         * Approaches that have failed for others (if evidence exists)
         * Cultural or industry faux pas to avoid
      - **Privacy Boundaries:**
         * How much research to reveal (being prepared vs. being creepy)
         * Personal topics to never bring up vs. safe to reference
   
   K. Long-Term Relationship Development Roadmap:
      6-12 month plan for building substantive relationship:
      - **Month 1-2:** Initial contact and first value exchange
      - **Month 3-4:** Deepening relationship through consistent value delivery
      - **Month 5-6:** Transitioning to peer relationship or trusted advisor
      - **Month 7-12:** Sustained engagement and mutual value creation
      - **Ongoing:** Quarterly touchpoints, annual in-person meetings, introduction to your network
   
   L. Alternative Paths & Contingencies:
      If direct approach doesn't work:
      - **Plan B:** Secondary contact methods or approaches
      - **Plan C:** Longer-term relationship building through content engagement
      - **Plan D:** Building relationship with their close colleagues or team first
      - **When to Pivot:** Signs that approach isn't working and when to try different tactic
   
   M. Cultural & Contextual Considerations:
      Based on ${name}'s background in ${countryText} and ${organizationText}:
      - **Cultural Communication Norms:** Based on nationality and company culture
      - **Hierarchical Considerations:** Appropriate level of formality
      - **Geographic Factors:** Time zones, regional business practices, local customs
      - **Organizational Culture:** Company-specific norms (from ${organizationText} culture)
   
   N. Specific Actionable Next Steps (The "Do This Now" Checklist):
      Provide concrete, immediate action items:
      1. [Specific action with exact platform/method]
      2. [Specific preparation task with resources needed]
      3. [Specific message to craft with key points to include]
      4. [Specific connection to activate with suggested message]
      5. [Specific content to create or share to get on their radar]
      
      For each action, include:
      - Why this action will work for ${name} specifically
      - Expected outcome and success criteria
      - Timing (do immediately, do in 1 week, do in 1 month)
      - Backup plan if it doesn't work
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

===== CRITICAL INSTRUCTIONS FOR REPORT GENERATION =====

**MANDATORY PROFILE INTEGRATION CHECK**:
Before you write each section, ask yourself:
- Have I incorporated ${name}'s known organization (${organizationText})?
- Have I referenced their education (${educationText})?
- Have I connected findings to their specialization (${specializationText})?
- Have I considered their location context (${countryText})?
- Have I analyzed their specific position (${positionText})?

**If any section fails to incorporate the known profile information where relevant, REVISE IT.**

FORMAT & STYLE:
- Structure as a professional intelligence brief with clear section headings and hierarchical organization
- Use bullet points, numbered lists, and tables where appropriate for readability
- Include specific dates, names, organizations, and verifiable facts wherever possible
- Clearly distinguish between confirmed facts and reasonable inferences
- Mark speculative information with phrases like "likely," "appears to," "suggests that"
- **CRITICAL**: Every major section must reference at least 2-3 elements from the known profile (organization, education, specialization, location, position)

DEPTH REQUIREMENTS BASED ON INVESTIGATION SETTINGS:
${investigationSettings.personalInfo ? `
**PERSONAL INFO - DEEP SEARCH MODE ACTIVATED:**
You MUST provide extensive personal intelligence. This is not a surface-level search. Go deep:
- Search across news archives, social media history, alumni databases, public records
- Provide specific examples with dates and sources where possible
- Include family details, educational specifics, personal achievements
- Minimum 2-3 paragraphs per subsection with concrete details
` : ''}
${investigationSettings.workAndCV ? `
**WORK & CV - COMPREHENSIVE MODE ACTIVATED:**
Reconstruct a complete professional biography:
- Every job with specific dates, responsibilities, and achievements
- Quantify impact wherever possible (revenue, team size, projects delivered)
- Career arc analysis with specific transition explanations
- Minimum 3-4 paragraphs per major role
` : ''}
${investigationSettings.mediaPresence ? `
**MEDIA PRESENCE - EXHAUSTIVE ANALYSIS MODE:**
Catalog their entire media footprint:
- Specific show names, episode dates, journalist names, publication titles
- Sentiment scoring with examples of positive and negative coverage
- Quote their most significant media statements
- Minimum 15-20 specific media appearances cited with dates
` : ''}
${investigationSettings.socialMedia ? `
**SOCIAL MEDIA - DEEP PLATFORM INTELLIGENCE:**
Analyze their complete digital presence:
- Platform-specific follower counts, posting frequency, engagement rates
- Content theme analysis with specific post examples
- Network analysis identifying key connections
- Activity pattern analysis (best times, trending topics)
- Minimum 10-15 specific insights per major platform they use
` : ''}
${investigationSettings.approachAnalysis ? `
**APPROACH ANALYSIS - STRATEGIC PLAYBOOK MODE:**
This section is CRITICAL. You must synthesize ALL intelligence gathered and provide a complete engagement playbook:
- Use information from their personal card (${positionText}, ${organizationText}, ${countryText}, ${educationText}, ${specializationText})
- Cross-reference social media behavior, media appearances, career choices, and personal interests
- Provide 5-7 SPECIFIC conversation starters with exact wording examples
- Give step-by-step contact strategy with exact timing (e.g., "Tuesday at 2pm EST")
- Explain the psychology behind each recommendation
- This section should be the LONGEST and most detailed - minimum 1500 words
- Think like a strategic relationship consultant crafting a custom engagement plan
` : ''}

DATA SOURCING PRIORITIES:
1. **Start with provided intelligence:** The person card shows ${name} as ${positionText}${organizationText !== 'Not specified' ? ` at ${organizationText}` : ''}${countryText !== 'Not specified' ? ` in ${countryText}` : ''}. ALL research must be consistent with this identity.
2. **Verify identity:** Ensure all discovered information relates to THIS specific ${name} and not someone else with the same name
3. **Cross-reference:** Look for information that appears across multiple sources (LinkedIn + media + social media + company website)
4. **Recency:** Prioritize recent information (last 2-3 years) but include historical context where relevant
5. **Specificity over generality:** Always choose specific facts over generic statements

QUALITY STANDARDS:
- Each major section should contain AT LEAST 300-500 words when in "deep" or "comprehensive" mode
- Basic mode sections can be 150-200 words
- Include AT LEAST 3-5 specific examples, dates, or citations per major topic area
- When information is not publicly available, say "Not publicly available" rather than speculating wildly
- When inferring from patterns, explain the reasoning: "Based on their transition from X to Y, this suggests..."

VERIFICATION & ACCURACY:
- Cross-check facts across multiple potential sources
- Flag any uncertainty: "Appears to be..." vs. "Confirmed that..."
- Distinguish between:
   * Hard facts (dates, organizations, titles)
   * Soft facts (interests, opinions based on public statements)
   * Inferences (patterns suggesting X)
   * Speculation (roles like theirs typically...)

STRATEGIC INTELLIGENCE VALUE:
- Every piece of information should answer: "How does this help someone engage with ${name}?"
- Connect dots between different data points (e.g., "Their background in X + their interest in Y suggests...")
- Provide actionable insights, not just data dumps
- Think: "If I needed to have a meeting with ${name} next week, what would I need to know?"

FINAL OUTPUT REQUIREMENTS:
- Minimum total length: ${investigationSettings.personalInfo || investigationSettings.workAndCV ? '2500' : investigationSettings.mediaPresence || investigationSettings.socialMedia ? '2000' : '1500'} words
- Maximum: No limit - thoroughness is valued over brevity
- Tone: Professional, analytical, intelligence-focused (not marketing or HR language)
- Perspective: Third-person analytical (not "you should" but "recommended approach is...")

**MANDATORY PROFILE INFORMATION USAGE VERIFICATION**:

Your report MUST demonstrably incorporate ALL of the following known facts about ${name}:

✓ Organization (${organizationText}): Referenced in at least 3 different sections
✓ Education (${educationText}): Discussed substantively in at least 2 sections
✓ Specialization (${specializationText}): Analyzed in depth in at least 2-3 sections
✓ Location (${countryText}): Considered contextually in at least 2 sections
✓ Position (${positionText}): Central to analysis in multiple sections

**QUALITY CONTROL**: After generating your report, verify that:
1. Each known profile element appears multiple times throughout the report
2. The known organization, education, and specialization are not just mentioned but ANALYZED and CONNECTED to other findings
3. Geographic and positional context informs your insights and recommendations
4. Cross-references between sections reinforce the integrated profile

If any known profile element is mentioned fewer than 2 times or not substantively analyzed, your report is INCOMPLETE.

NOW GENERATE THE COMPREHENSIVE INTELLIGENCE REPORT FOR ${name}, ensuring COMPLETE integration of all known profile information (Organization: ${organizationText}, Education: ${educationText}, Specialization: ${specializationText}, Location: ${countryText}, Position: ${positionText}):`

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
    if (provider === 'gemini' || (provider === 'auto' && enabledConfigs.find(c => c.provider === 'gemini'))) {
      const geminiConfig = enabledConfigs.find(c => c.provider === 'gemini')
      if (geminiConfig) {
        console.log('[externalLLM] Using Gemini API...')
        return await callGemini(promptText, geminiConfig.apiKey, useDirectMode)
      }
    }
    
    if (provider === 'claude' || (provider === 'auto' && enabledConfigs.find(c => c.provider === 'claude'))) {
      const claudeConfig = enabledConfigs.find(c => c.provider === 'claude')
      if (claudeConfig) {
        console.log('[externalLLM] Using Claude API...')
        return await callClaude(promptText, claudeConfig.apiKey, useDirectMode)
      }
    }
    
    if (provider === 'perplexity' || (provider === 'auto' && enabledConfigs.find(c => c.provider === 'perplexity'))) {
      const perplexityConfig = enabledConfigs.find(c => c.provider === 'perplexity')
      if (perplexityConfig) {
        console.log('[externalLLM] Using Perplexity API...')
        return await callPerplexity(promptText, perplexityConfig.apiKey, useDirectMode)
      }
    }
    
    if (provider === 'openai' || (provider === 'auto' && enabledConfigs.find(c => c.provider === 'openai'))) {
      const openaiConfig = enabledConfigs.find(c => c.provider === 'openai')
      if (openaiConfig) {
        console.log('[externalLLM] Using OpenAI API...')
        return await callOpenAI(promptText, openaiConfig.apiKey, useDirectMode)
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
