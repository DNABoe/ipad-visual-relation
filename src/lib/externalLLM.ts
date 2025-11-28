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

async function callOpenAI(prompt: string, apiKey?: string, retryCount = 0): Promise<string> {
  const key = apiKey || OPENAI_API_KEY
  const MAX_RETRIES = 2
  
  console.log('[externalLLM] callOpenAI invoked (attempt ' + (retryCount + 1) + '/' + (MAX_RETRIES + 1) + ')')
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

  const corsProxyUrl = 'https://corsproxy.io/?'
  const targetUrl = encodeURIComponent('https://api.openai.com/v1/chat/completions')
  
  try {
    const response = await fetch(corsProxyUrl + targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key.trim()}`
      },
      body: JSON.stringify(requestBody)
    })

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
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else if (response.status === 500) {
        throw new Error('OpenAI service error. Please try again later.')
      } else if (response.status === 502 || response.status === 503 || response.status === 504) {
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] CORS proxy timeout (${response.status}), retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callOpenAI(prompt, apiKey, retryCount + 1)
        }
        throw new Error('CORS proxy timeout after multiple attempts. The proxy service (corsproxy.io) is experiencing issues. Please try again in a few moments.')
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
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (retryCount < MAX_RETRIES) {
        const delayMs = Math.pow(2, retryCount) * 2000
        console.log(`[externalLLM] Network error, retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        return callOpenAI(prompt, apiKey, retryCount + 1)
      }
      throw new Error('Network error connecting to CORS proxy. Please check your internet connection and try again.')
    }
    throw error
  }
}

async function callPerplexity(prompt: string, apiKey?: string): Promise<string> {
  const key = apiKey || PERPLEXITY_API_KEY
  
  if (!key) {
    throw new Error('Perplexity API key not configured')
  }

  console.log('[externalLLM] Calling Perplexity API...')

  const corsProxyUrl = 'https://corsproxy.io/?'
  const targetUrl = encodeURIComponent('https://api.perplexity.ai/chat/completions')

  const response = await fetch(corsProxyUrl + targetUrl, {
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
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorData
    try {
      errorData = JSON.parse(errorText)
    } catch {
      errorData = { message: errorText }
    }
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
    provider,
    hasApiKey: !!params.apiKey,
    apiKeyLength: params.apiKey?.length || 0,
    apiKeyPrefix: params.apiKey?.substring(0, 10) || 'N/A'
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
  
  console.log('[externalLLM] Available providers:', {
    hasSparkLLM,
    hasProvidedApiKey: !!params.apiKey,
    hasEnvOpenAI: !!OPENAI_API_KEY,
    hasEnvPerplexity: !!PERPLEXITY_API_KEY
  })

  try {
    if (provider === 'perplexity' || (provider === 'auto' && PERPLEXITY_API_KEY && !hasSparkLLM)) {
      console.log('[externalLLM] Using Perplexity API...')
      return await callPerplexity(promptText, params.apiKey)
    }
    
    if (params.apiKey || provider === 'openai' || (provider === 'auto' && (OPENAI_API_KEY || params.apiKey) && !hasSparkLLM)) {
      console.log('[externalLLM] Using OpenAI API...')
      console.log('[externalLLM] Passing API key to callOpenAI:', !!params.apiKey)
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

export async function generateAIInsights(params: {
  workspace: any
  metrics: any
  topNodes: any[]
  apiKey?: string
}): Promise<{
  insights: string[]
  centerOfGravity: {
    person: any
    score: number
    reasoning: string
  }
  strategicRecommendations: string[]
}> {
  const { workspace, metrics, topNodes, apiKey } = params

  console.log('[externalLLM] Generating AI-powered network insights...')

  const personsWithReports = workspace.persons.filter((p: any) => 
    !p.hidden && 
    p.attachments && 
    p.attachments.length > 0 && 
    p.attachments.some((att: any) => att.name.startsWith('Investigation_') && att.type === 'application/pdf')
  )

  const reportSummaries = personsWithReports.map((p: any) => {
    const report = p.attachments?.find((att: any) => 
      att.name.startsWith('Investigation_') && att.type === 'application/pdf'
    )
    return {
      name: p.name,
      position: p.position,
      score: p.score,
      frameColor: p.frameColor,
      advocate: p.advocate,
      hasReport: !!report,
      connections: workspace.connections.filter((c: any) => 
        c.fromPersonId === p.id || c.toPersonId === p.id
      ).length
    }
  })

  const networkSummary = {
    totalNodes: metrics.totalNodes,
    totalConnections: metrics.totalConnections,
    avgConnections: metrics.avgConnectionsPerNode,
    isolatedNodes: metrics.isolatedNodes,
    highValueNodes: metrics.highValueNodes,
    advocateNodes: metrics.advocateNodes,
    nodesWithReports: metrics.nodesWithReports,
    topConnectedNodes: topNodes.slice(0, 5).map((n: any) => ({
      name: n.person.name,
      position: n.person.position,
      connections: n.connectionCount,
      strength: n.connectionStrength,
      score: n.person.score,
      advocate: n.person.advocate
    })),
    groups: workspace.groups.map((g: any) => ({
      name: g.name,
      memberCount: workspace.persons.filter((p: any) => !p.hidden && p.groupId === g.id).length
    })),
    reportedPersons: reportSummaries
  }

  const promptText = `You are an expert intelligence analyst. Analyze the following relationship network data and provide strategic insights.

NETWORK SUMMARY:
${JSON.stringify(networkSummary, null, 2)}

Please provide a comprehensive analysis in the following JSON format:
{
  "insights": [
    "String insight 1 - key pattern or finding",
    "String insight 2 - strategic observation",
    "String insight 3 - opportunity or risk"
  ],
  "centerOfGravity": {
    "personName": "Name of the most critical node",
    "score": 95,
    "reasoning": "Detailed explanation of why this person is the center of gravity - considering connections, influence, position, and strategic importance"
  },
  "strategicRecommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2",
    "Actionable recommendation 3"
  ]
}

The "center of gravity" is the single most critical person in the network who:
- Has the most strategic influence (not just most connections)
- Serves as a key bridge or hub
- Has high-value position and relationships
- Represents the highest leverage point for influence

Consider:
1. Connection patterns and network topology
2. Person scores (1-10, where 10 is most important)
3. Advocate status (people who actively promote messages)
4. Position and role importance
5. Investigation report availability
6. Group memberships and inter-group connections

Provide 5-7 key insights, identify the true center of gravity, and give 3-5 strategic recommendations.`

  try {
    const hasSparkLLM = typeof window !== 'undefined' && 
      !!(window as any).spark && 
      typeof (window as any).spark.llm === 'function'
    
    let responseText: string

    if (apiKey || OPENAI_API_KEY) {
      console.log('[externalLLM] Using OpenAI for AI insights...')
      const response = await callOpenAI(promptText, apiKey, 0)
      responseText = response
    } else if (hasSparkLLM) {
      console.log('[externalLLM] Using Spark LLM for AI insights...')
      const prompt = (window.spark.llmPrompt as any)`${promptText}`
      responseText = await window.spark.llm(prompt, 'gpt-4o-mini', true)
    } else {
      console.log('[externalLLM] No AI available, generating static insights')
      return generateStaticInsights(workspace, metrics, topNodes)
    }

    try {
      const parsed = JSON.parse(responseText)
      
      const centerPerson = workspace.persons.find((p: any) => 
        p.name === parsed.centerOfGravity?.personName
      ) || topNodes[0]?.person

      return {
        insights: parsed.insights || [],
        centerOfGravity: {
          person: centerPerson,
          score: parsed.centerOfGravity?.score || 0,
          reasoning: parsed.centerOfGravity?.reasoning || 'Most connected node in the network'
        },
        strategicRecommendations: parsed.strategicRecommendations || []
      }
    } catch (parseError) {
      console.error('[externalLLM] Failed to parse AI response:', parseError)
      return generateStaticInsights(workspace, metrics, topNodes)
    }

  } catch (error) {
    console.error('[externalLLM] Error generating AI insights:', error)
    throw new Error('Failed to generate AI insights. Please check your API key and try again.')
  }
}

function generateStaticInsights(workspace: any, metrics: any, topNodes: any[]) {
  const insights: string[] = []
  
  if (metrics.isolatedNodes > 0) {
    insights.push(`Network fragmentation detected: ${metrics.isolatedNodes} isolated nodes may represent untapped opportunities or information silos`)
  }
  
  if (metrics.avgConnectionsPerNode < 2) {
    insights.push('Sparse network structure indicates potential for growth in relationship development')
  } else if (metrics.avgConnectionsPerNode > 5) {
    insights.push('Dense network structure suggests strong interconnectivity and information flow')
  }
  
  const advocateRatio = metrics.advocateNodes / metrics.totalNodes
  if (advocateRatio > 0.3) {
    insights.push(`High advocate concentration (${Math.round(advocateRatio * 100)}%) presents significant influence multiplication opportunities`)
  }
  
  const reportCoverage = metrics.nodesWithReports / metrics.totalNodes
  if (reportCoverage < 0.5) {
    insights.push('Intelligence gaps exist - less than half of network nodes have investigation reports')
  } else if (reportCoverage > 0.8) {
    insights.push(`Excellent intelligence coverage at ${Math.round(reportCoverage * 100)}% enables comprehensive strategic analysis`)
  }
  
  if (workspace.groups.length > 0) {
    insights.push(`Network organized into ${workspace.groups.length} distinct groups, enabling targeted engagement strategies`)
  }

  const centerPerson = topNodes[0]?.person || workspace.persons.filter((p: any) => !p.hidden)[0]
  
  return {
    insights,
    centerOfGravity: {
      person: centerPerson,
      score: 75,
      reasoning: `${centerPerson?.name} identified as network center of gravity based on ${topNodes[0]?.connectionCount || 0} connections and strategic position. This individual serves as a critical hub in the relationship network.`
    },
    strategicRecommendations: [
      'Focus engagement efforts on high-connectivity nodes to maximize network reach',
      'Develop intelligence reports for nodes currently lacking investigation data',
      'Monitor isolated nodes for integration opportunities',
      'Leverage advocate network for information dissemination'
    ]
  }
}
