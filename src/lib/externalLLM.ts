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

async function callPerplexity(prompt: string, apiKey?: string, retryCount = 0): Promise<string> {
  const key = apiKey || PERPLEXITY_API_KEY
  const MAX_RETRIES = 2
  
  console.log('[externalLLM] callPerplexity invoked (attempt ' + (retryCount + 1) + '/' + (MAX_RETRIES + 1) + ')')
  
  if (!key) {
    throw new Error('Perplexity API key not configured. Please add your API key in Settings.')
  }

  if (!key.startsWith('pplx-')) {
    throw new Error('Invalid Perplexity API key format. API keys must start with "pplx-".')
  }

  console.log('[externalLLM] Calling Perplexity API...')

  const corsProxyUrl = 'https://corsproxy.io/?'
  const targetUrl = encodeURIComponent('https://api.perplexity.ai/chat/completions')

  try {
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
      
      if (response.status === 401) {
        throw new Error('Invalid Perplexity API key. Please verify your API key in Settings.')
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else if (response.status === 502 || response.status === 503 || response.status === 504) {
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] CORS proxy timeout (${response.status}), retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callPerplexity(prompt, apiKey, retryCount + 1)
        }
        throw new Error('CORS proxy timeout after multiple attempts. Please try again in a few moments.')
      }
      
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from Perplexity API')
    }

    return data.choices[0].message.content
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (retryCount < MAX_RETRIES) {
        const delayMs = Math.pow(2, retryCount) * 2000
        console.log(`[externalLLM] Network error, retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        return callPerplexity(prompt, apiKey, retryCount + 1)
      }
      throw new Error('Network error connecting to CORS proxy. Please check your internet connection.')
    }
    throw error
  }
}

async function callClaude(prompt: string, apiKey?: string, retryCount = 0): Promise<string> {
  const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY
  const key = apiKey || CLAUDE_API_KEY
  const MAX_RETRIES = 2
  
  console.log('[externalLLM] callClaude invoked (attempt ' + (retryCount + 1) + '/' + (MAX_RETRIES + 1) + ')')
  
  if (!key) {
    throw new Error('Claude API key not configured. Please add your API key in Settings.')
  }

  if (!key.startsWith('sk-ant-')) {
    throw new Error('Invalid Claude API key format. API keys must start with "sk-ant-".')
  }

  console.log('[externalLLM] Calling Claude API...')

  const corsProxyUrl = 'https://corsproxy.io/?'
  const targetUrl = encodeURIComponent('https://api.anthropic.com/v1/messages')

  try {
    const response = await fetch(corsProxyUrl + targetUrl, {
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
    })

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
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.')
      } else if (response.status === 502 || response.status === 503 || response.status === 504) {
        if (retryCount < MAX_RETRIES) {
          const delayMs = Math.pow(2, retryCount) * 2000
          console.log(`[externalLLM] CORS proxy timeout (${response.status}), retrying in ${delayMs}ms...`)
          await new Promise(resolve => setTimeout(resolve, delayMs))
          return callClaude(prompt, apiKey, retryCount + 1)
        }
        throw new Error('CORS proxy timeout after multiple attempts. Please try again in a few moments.')
      }
      
      throw new Error(`Claude API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response from Claude API')
    }

    return data.content[0].text
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      if (retryCount < MAX_RETRIES) {
        const delayMs = Math.pow(2, retryCount) * 2000
        console.log(`[externalLLM] Network error, retrying in ${delayMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, delayMs))
        return callClaude(prompt, apiKey, retryCount + 1)
      }
      throw new Error('Network error connecting to CORS proxy. Please check your internet connection.')
    }
    throw error
  }
}

export async function generateIntelligenceReport(params: {
  name: string
  position: string
  country: string
  llmConfigs?: Array<{ provider: string; apiKey: string; enabled: boolean }>
  provider?: 'openai' | 'perplexity' | 'claude' | 'auto'
}): Promise<string> {
  const { name, position, country, provider = 'auto', llmConfigs = [] } = params

  console.log('[externalLLM] Starting intelligence report generation...')
  console.log('[externalLLM] Parameters:', {
    name,
    position,
    country,
    provider,
    hasLLMConfigs: llmConfigs.length > 0,
    enabledProviders: llmConfigs.filter(c => c.enabled).map(c => c.provider)
  })

  const positionText = position || 'Not specified'
  const countryText = country || 'Not specified'
  
  const promptText = `You are a professional intelligence analyst. Create a comprehensive professional intelligence profile for the following person:

Name: ${name}
Position: ${positionText}
Country: ${countryText}

Please provide a detailed analysis with the following sections:

1. PERSONAL PROFILE
   - Full name and current role
   - Professional background and career trajectory
   - Educational background (typical for this position)
   - Key personal characteristics and communication style

2. PROFESSIONAL BACKGROUND OVERVIEW
   - Current responsibilities and scope of authority
   - Career progression and key achievements
   - Industry experience and specializations
   - Professional reputation and credibility

3. AREAS OF INFLUENCE AND EXPERTISE
   - Domain-specific expertise
   - Organizational influence and decision-making power
   - Industry standing and thought leadership
   - Key competencies and skill areas

4. POTENTIAL NETWORK CONNECTIONS
   - Professional relationships and networks
   - Organizational contacts and stakeholders
   - Industry associations and affiliations
   - Strategic partnerships and collaborations

5. STRATEGIC IMPORTANCE ASSESSMENT
   - Value to intelligence operations
   - Access to strategic information
   - Influence on key decisions
   - Potential as source or contact

6. KEY CONSIDERATIONS FOR ENGAGEMENT
   - Recommended approach strategies
   - Communication preferences
   - Topics of interest and expertise
   - Potential engagement opportunities
   - Risk factors and considerations

7. STRATEGIC RECOMMENDATIONS
   - Next steps for building relationship
   - Information gathering opportunities
   - Potential collaboration areas
   - Long-term engagement strategy

Format your response as a professional intelligence brief with clear section headings and detailed, actionable analysis. Be thorough, realistic, and focused on strategic intelligence value.`

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

**Current Role:** ${positionText}${countryText !== 'Not specified' ? `\n**Location:** ${countryText}` : ''}

**Professional Background:**
${name} serves in the capacity of ${positionText}, a position requiring significant professional expertise and leadership capability. This role typically demands:
- Extensive industry experience and domain knowledge
- Strategic planning and decision-making authority
- Cross-functional collaboration and stakeholder management
- Professional networking and relationship development

**Personal Characteristics:** (Based on typical profile for this position)
- Strong communication and interpersonal skills
- Strategic thinking and analytical capabilities
- Results-oriented with attention to operational excellence
- Professional demeanor aligned with organizational culture

---

## 2. PROFESSIONAL BACKGROUND OVERVIEW

**Current Responsibilities:**
Individuals in the role of ${positionText} typically have:
- Strategic oversight and operational leadership
- Decision-making authority on key initiatives
- Team management and organizational development
- Budget and resource allocation responsibilities
- Stakeholder relationship management

**Career Trajectory:**
Professionals at this level generally have:
- 10-20+ years of progressive industry experience
- Track record of increasing responsibility and scope
- Demonstrated expertise in specialized areas
- History of measurable achievements and impact
- Professional certifications and continuous development

**Industry Expertise:**
- Deep understanding of sector dynamics and trends
- Technical proficiency in relevant domains
- Regulatory and compliance knowledge
- Best practices and industry standards awareness

---

## 3. AREAS OF INFLUENCE AND EXPERTISE

**Organizational Influence:**
- Direct authority over strategic decisions
- Influence on organizational direction and priorities
- Leadership in change management initiatives
- Resource allocation and investment decisions

**Professional Standing:**
- Recognized expertise within their field
- Professional network spanning industry and beyond
- Potential thought leadership and public presence
- Involvement in industry associations and forums

**Key Competencies:**
- Strategic planning and execution
- Stakeholder engagement and communication
- Financial acumen and business strategy
- Team leadership and talent development
- Risk management and problem-solving

---

## 4. POTENTIAL NETWORK CONNECTIONS

**Internal Organizational Network:**
- Executive leadership team and C-suite
- Cross-functional department heads
- Direct reports and team members
- Board members and advisors (if applicable)

**External Professional Network:**
- Industry peers and counterparts
- Strategic partners and suppliers
- Professional association members
- Consultants and subject matter experts
- Regulatory and oversight contacts

**Strategic Relationships:**
- Key clients or customers
- Investment or financial partners
- Technology and innovation partners
- Academic and research institutions
- Media and communications contacts

---

## 5. STRATEGIC IMPORTANCE ASSESSMENT

**Intelligence Value:** MODERATE TO HIGH

**Professional Significance:**
- Senior-level position indicates access to strategic information
- Decision-making authority on key organizational matters
- Visibility into industry trends and competitive landscape
- Potential insights into future plans and initiatives

**Network Access:**
- Well-positioned within professional circles
- Bridge between organizational levels and external stakeholders
- Access to other high-value contacts and decision-makers
- Potential conduit for information and influence

**Information Access:**
- Strategic plans and organizational direction
- Financial and operational metrics
- Competitive intelligence and market insights
- Industry trends and regulatory developments

---

## 6. KEY CONSIDERATIONS FOR ENGAGEMENT

**Recommended Approach Strategy:**

**Initial Contact:**
- Professional and respectful introduction
- Clear value proposition and mutual benefit
- Respect for time constraints and priorities
- Credible professional context and credentials

**Communication Preferences:** (Typical for this role)
- Concise, results-oriented communication
- Data-driven and strategic discussions
- Scheduled meetings with clear agendas
- Professional channels (email, formal meetings)

**Topics of Interest:**
- Industry trends and future outlook
- Strategic challenges and opportunities
- Innovation and competitive advantage
- Professional development and best practices
- Market dynamics and regulatory changes

**Engagement Opportunities:**
- Industry conferences and professional events
- Thought leadership forums and panels
- Professional association activities
- Collaborative projects or initiatives
- Information exchange on mutual interests

**Risk Factors:**
- Time sensitivity and competing priorities
- Organizational constraints and confidentiality
- Professional reputation considerations
- Conflict of interest or competitive sensitivities

---

## 7. STRATEGIC RECOMMENDATIONS

**Immediate Actions:**

1. **Research and Preparation**
   - Gather additional background information on ${name}
   - Review public professional profile (LinkedIn, company website)
   - Identify mutual connections or professional links
   - Understand current organizational priorities and challenges

2. **Initial Outreach Strategy**
   - Develop compelling value proposition
   - Identify appropriate introduction channel
   - Prepare professional communication materials
   - Time outreach to align with professional calendar

3. **Relationship Development**
   - Focus on mutual interests and value creation
   - Establish credibility through expertise and professionalism
   - Build trust through consistency and reliability
   - Respect boundaries and professional constraints

**Medium-Term Engagement:**

4. **Information Gathering**
   - Conduct open-source intelligence gathering
   - Monitor professional activities and public statements
   - Track organizational news and developments
   - Identify opportunities for meaningful interaction

5. **Network Mapping**
   - Identify key connections and relationships
   - Understand organizational structure and dynamics
   - Map influence patterns and decision-making processes
   - Identify other high-value contacts in their network

**Long-Term Strategic Objectives:**

6. **Sustained Engagement**
   - Develop ongoing professional relationship
   - Provide consistent value and expertise
   - Maintain regular but appropriate contact frequency
   - Build reputation as trusted and reliable contact

7. **Strategic Intelligence Development**
   - Gather insights on industry and organizational trends
   - Develop understanding of strategic priorities
   - Identify opportunities for collaboration
   - Build foundation for future intelligence operations

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
  const { workspace, metrics, topNodes, apiKey, llmConfigs = [] } = params

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

  const promptText = `You are an expert intelligence analyst. Analyze the following relationship network data and investigation reports to provide strategic insights.

NETWORK SUMMARY:
${JSON.stringify(networkSummary, null, 2)}

Please provide a comprehensive analysis in the following JSON format:
{
  "insights": [
    "String insight 1 - key pattern or finding from investigation reports",
    "String insight 2 - strategic observation about network structure",
    "String insight 3 - opportunity or risk identified",
    "String insight 4 - relationship pattern insight",
    "String insight 5 - intelligence coverage assessment"
  ],
  "centerOfGravity": {
    "personName": "Name of the most critical node",
    "score": 95,
    "reasoning": "Detailed explanation of why this person is the center of gravity - considering connections, influence, position, strategic importance, and investigation report insights"
  },
  "strategicRecommendations": [
    "Actionable recommendation 1 based on investigation reports",
    "Actionable recommendation 2 for network leverage",
    "Actionable recommendation 3 for influence operations",
    "Actionable recommendation 4 for intelligence gathering"
  ]
}

The "center of gravity" is the single most critical person in the network who:
- Has the most strategic influence (not just most connections)
- Serves as a key bridge or hub in the network
- Has high-value position and relationships
- Represents the highest leverage point for influence operations
- Investigation reports reveal their unique value

Strategic recommendations should:
- Leverage insights from investigation reports
- Focus on actionable next steps
- Consider influence pathways through the network
- Identify intelligence gaps and opportunities
- Provide specific engagement strategies

Consider:
1. Connection patterns and network topology
2. Person importance scores (1-10, where 10 is most important)
3. Advocate status (people who actively promote messages)
4. Position and role importance
5. Investigation report availability and insights
6. Group memberships and inter-group connections
7. Attitude indicators (positive, neutral, negative)

Provide 5-7 key insights, identify the true center of gravity with detailed reasoning, and give 4-6 strategic recommendations.`

  try {
    const hasSparkLLM = typeof window !== 'undefined' && 
      !!(window as any).spark && 
      typeof (window as any).spark.llm === 'function'
    
    let responseText: string
    
    const enabledConfigs = llmConfigs.filter(c => c.enabled)

    if (enabledConfigs.find(c => c.provider === 'claude')) {
      const claudeConfig = enabledConfigs.find(c => c.provider === 'claude')
      if (claudeConfig) {
        console.log('[externalLLM] Using Claude for AI insights...')
        responseText = await callClaude(promptText, claudeConfig.apiKey, 0)
      } else {
        throw new Error('Claude selected but no API key found')
      }
    } else if (enabledConfigs.find(c => c.provider === 'perplexity')) {
      const perplexityConfig = enabledConfigs.find(c => c.provider === 'perplexity')
      if (perplexityConfig) {
        console.log('[externalLLM] Using Perplexity for AI insights...')
        responseText = await callPerplexity(promptText, perplexityConfig.apiKey, 0)
      } else {
        throw new Error('Perplexity selected but no API key found')
      }
    } else if (apiKey || enabledConfigs.find(c => c.provider === 'openai')) {
      const openaiConfig = enabledConfigs.find(c => c.provider === 'openai')
      const key = apiKey || openaiConfig?.apiKey
      console.log('[externalLLM] Using OpenAI for AI insights...')
      responseText = await callOpenAI(promptText, key, 0)
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
