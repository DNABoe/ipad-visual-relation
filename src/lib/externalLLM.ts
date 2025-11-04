export async function generateIntelligenceReport(params: {
  name: string
  position: string
  country: string
}): Promise<string> {
  const { name, position, country } = params

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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`
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

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', error)
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from API')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('Error generating report:', error)
    
    if (error instanceof Error && error.message.includes('API request failed')) {
      throw new Error('Failed to connect to AI service. Please check your API key configuration.')
    }
    
    throw new Error('Failed to generate investigation report. Please try again.')
  }
}
