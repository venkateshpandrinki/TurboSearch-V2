// src/lib/ai/google-ai.ts
import { google } from '@ai-sdk/google'
import { generateText, CoreMessage } from 'ai'

export class GoogleAI {
  private modelName: string

  constructor(modelName: string = 'gemini-2.0-flash') {
    this.modelName = modelName
    
    // Validate API key exists
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is required')
    }
  }

  async generateText({
    system,
    messages,
    temperature = 0.7
  }: {
    system?: string
    messages: CoreMessage[]
    temperature?: number
  }) {
    try {
      const model = google(this.modelName)
      
      const result = await generateText({
        model,
        system,
        messages,
        temperature
      })

      return {
        text: result.text
      }
    } catch (error) {
      console.error('Google AI generation error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const googleAI = new GoogleAI('gemini-2.0-flash')