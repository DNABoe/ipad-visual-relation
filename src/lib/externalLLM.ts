export function isLLMAvailable(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false
    }
    const w = window as any
    return !!(w.spark && w.spark.llm && typeof w.spark.llm === 'function')
  } catch {
    return false
  }
}

export async function generateIntelligenceReport(params: {
  name: string
  position: string
  country: string
  apiKey?: string
}): Promise<string> {
  const { name, position, country } = params

  console.log('[externalLLM] Starting intelligence report generation...')
  console.log('[externalLLM] Parameters:', {
    name,
    position,
    country
  })

  if (!isLLMAvailable()) {
    console.log('[externalLLM] Spark runtime not available, generating static report')
    return generateStaticReport({ name, position, country })
  }

  try {
    console.log('[externalLLM] Using Spark LLM API...')
    
    const positionText = position || 'Not specified'
    const countryText = country || 'Not specified'
    
    const prompt = (window.spark.llmPrompt as any)`You are a professional intelligence analyst. Create a comprehensive professional profile for the following person:

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
    
    const report = await window.spark.llm(prompt, 'gpt-4o-mini')
    
    console.log('[externalLLM] Report generated successfully')
    return report
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
