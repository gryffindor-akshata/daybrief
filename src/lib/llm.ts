import { env } from './zenv'
import { SummaryOutput } from './calendar/types'

export async function generateSummary(
  prompt: string,
  maxRetries: number = 2
): Promise<SummaryOutput> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${env.OPENAI_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are DayBrief, an expert meeting summarizer. Your job is to create a succinct, factual, and action-oriented brief based solely on the provided event metadata. Do not invent details. Prefer bullet points. When uncertain, state assumptions clearly.

Always respond with valid JSON in exactly this format:
{
  "summaryMd": "markdown bullets only",
  "actionItems": ["Owner: Task — Due (if any)", ...],
  "confidence": 0.0
}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${await response.text()}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No content in LLM response')
      }

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(content) as SummaryOutput
        
        // Validate the structure
        if (
          typeof parsed.summaryMd === 'string' &&
          Array.isArray(parsed.actionItems) &&
          typeof parsed.confidence === 'number'
        ) {
          return parsed
        } else {
          throw new Error('Invalid response structure')
        }
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]) as SummaryOutput
          return parsed
        }
        
        // Fallback: create a response from the content
        return {
          summaryMd: content,
          actionItems: [],
          confidence: 0.3
        }
      }
    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt + 1} failed:`, error)
      
      if (attempt < maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  throw lastError || new Error('Failed to generate summary after all retries')
}
