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

  if (typeof window === 'undefined' || !window.spark || typeof window.spark.llm !== 'function') {
    console.error('[externalLLM] Spark runtime not available')
    throw new Error('Investigation feature requires Spark runtime. Please ensure you are running in the Spark environment.')
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
