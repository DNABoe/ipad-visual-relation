export async function generateIntelligenceReport(params: {
  name: string
  position: string
  country: string
  apiKey?: string
}): Promise<string> {
  const { name, position, country, apiKey } = params

  console.log('[externalLLM] Starting intelligence report generation...')
  console.log('[externalLLM] Parameters:', {
    name,
    position,
    country,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length
  })

  if (!apiKey || apiKey.trim() === '') {
    console.error('[externalLLM] No API key provided')
    throw new Error('OpenAI API key not configured. Please add your API key in Settings → Investigation to use this feature.')
  }

  const prompt = `You are a professional intelligence analyst. Create a comprehensive professional profile for the following person:

Name: ${name}
Position: ${position || 'Not specified'}
Country: ${country || 'Not specified'}

Please provide:
1. Professional Background Overview (based on typical career trajectories for this position)
2. Areas of Influence and Expertise
3. Potential Network Connections (types of people/organizations they might interact with)
4. Strategic Importance Assessment
5. Key Considerations for Engagement

Format your response as a professional intelligence brief with clear sections and detailed analysis. Be thorough but realistic based on the position and context provided.`

  try {
    console.log('[externalLLM] Making API request to OpenAI...')
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional intelligence analyst creating detailed, professional profiles and assessments.'
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

    console.log('[externalLLM] API response status:', response.status, response.statusText)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('[externalLLM] OpenAI API error:', error)
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key in Settings.')
      }
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later or check your OpenAI account quota.')
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log('[externalLLM] Response received, parsing...')
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('[externalLLM] Invalid response format:', data)
      throw new Error('Invalid response format from API')
    }

    console.log('[externalLLM] Report generated successfully')
    return data.choices[0].message.content
  } catch (error) {
    console.error('[externalLLM] Error generating report:', error)
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[externalLLM] Network error - fetch failed')
      throw new Error('Network error: Unable to connect to OpenAI API. Please check your internet connection.')
    }
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error('Failed to generate investigation report. Please try again.')
  }
}
