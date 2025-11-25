const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY

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

async function callOpenAI(prompt: string, apiKey?: string): Promise<string> {
  const key = apiKey || OPENAI_API_KEY
  
  if (!key) {
    throw new Error('OpenAI API key not configured')
  }

  console.log('[externalLLM] Calling OpenAI API...')
  console.log('[externalLLM] API key available:', !!key)
  console.log('[externalLLM] API key length:', key.length)
  console.log('[externalLLM] API key starts with sk-:', key.startsWith('sk-'))

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key.trim()}`
    },
    body: JSON.stringify({
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
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('[externalLLM] OpenAI API error:', errorData)
    console.error('[externalLLM] Response status:', response.status)
    console.error('[externalLLM] Response status text:', response.statusText)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenAI API')
  }

  return data.choices[0].message.content
}

async function callPerplexity(prompt: string): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured')
  }

  console.log('[externalLLM] Calling Perplexity API...')

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
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
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('[externalLLM] Perplexity API error:', errorData)
    throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from Perplexity API')
  }

  return data.choices[0].message.content
}

export async function generateIntelligenceReport(params: {
  name: string
  position: string
  country: string
  apiKey?: string
  provider?: 'openai' | 'perplexity' | 'auto'
}): Promise<string> {
  const { name, position, country, provider = 'auto' } = params

  console.log('[externalLLM] Starting intelligence report generation...')
  console.log('[externalLLM] Parameters:', {
    name,
    position,
    country,
    provider
  })

  const positionText = position || 'Not specified'
  const countryText = country || 'Not specified'
  
  const promptText = `You are a professional intelligence analyst. Create a comprehensive professional profile for the following person:

Name: ${name}
Position: ${positionText}
Country: ${countryText}

Please provide:
1. Professional Background Overview (based on typical career trajectories for this position)
2. Areas of Influence and Expertise
3. Potential Network Connections (types of people/organizations they might interact with)
4. Strategic Importance Assessment
5. Key Considerations for Engagement

Format your response as a professional intelligence brief with clear sections and detailed analysis. Be thorough but realistic based on the position and context provided.`

  const hasSparkLLM = typeof window !== 'undefined' && 
    !!(window as any).spark && 
    typeof (window as any).spark.llm === 'function'

  try {
    if (provider === 'perplexity' || (provider === 'auto' && PERPLEXITY_API_KEY && !hasSparkLLM)) {
      console.log('[externalLLM] Using Perplexity API...')
      return await callPerplexity(promptText)
    }
    
    if (params.apiKey || provider === 'openai' || (provider === 'auto' && (OPENAI_API_KEY || params.apiKey) && !hasSparkLLM)) {
      console.log('[externalLLM] Using OpenAI API...')
      return await callOpenAI(promptText, params.apiKey)
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

---

## 1. Professional Background Overview

${name} holds the position of ${positionText}${countryText !== 'Not specified' ? ` in ${countryText}` : ''}. This role typically requires significant professional experience and expertise in their field.

Individuals in this type of position generally have:
- Extensive industry knowledge and specialized skills
- Leadership and decision-making responsibilities
- Professional networks spanning multiple organizations
- Involvement in strategic planning and execution

## 2. Areas of Influence and Expertise

Based on the position of ${positionText}, key areas of influence likely include:
- Strategic decision-making within their organization
- Professional relationships across their industry sector
- Potential involvement in industry associations or professional bodies
- Expertise in domain-specific challenges and opportunities

## 3. Potential Network Connections

Individuals in this role typically interact with:
- Senior leadership and executives within their organization
- Peers in similar positions at other organizations
- Industry experts and consultants
- Regulatory or oversight bodies relevant to their sector
- Professional associations and networking groups

## 4. Strategic Importance Assessment

**Professional Significance:**
- Position indicates senior-level responsibility and influence
- Likely involved in key organizational decisions
- May have insights into industry trends and developments
- Potential access to strategic information and planning

**Network Value:**
- Well-positioned within professional circles
- Access to decision-makers and influencers
- May serve as a bridge between different organizational levels
- Potential source of industry intelligence and insights

## 5. Key Considerations for Engagement

**Recommended Approach:**
- Professional and respectful communication
- Focus on mutual interests and value creation
- Recognize their time constraints and decision-making authority
- Build trust through consistency and reliability

**Points of Interest:**
- Professional achievements and background
- Current organizational priorities and challenges
- Industry trends and future outlook
- Potential areas for collaboration or information exchange

---

**Note:** This is a standard intelligence brief template. For AI-powered personalized analysis, this application requires the Spark runtime environment. The investigation feature uses advanced language models to generate detailed, context-specific intelligence reports based on the individual's specific background and position.

**Recommendation:** To access enhanced intelligence capabilities, deploy this application in the Spark environment where AI-powered analysis is available.`
}
