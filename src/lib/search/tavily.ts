// src/lib/search/tavily.ts
import { z } from 'zod'

// Types
export interface SearchResult {
  title: string
  url: string
  content: string
  score: number
  raw_content?: string
}

export interface SearchResultImage {
  url: string
  description?: string
}

export interface SearchResults {
  query: string
  results: SearchResult[]
  images: SearchResultImage[]
  number_of_results: number
  answers?: string[]
}

// Zod schema for search parameters
export const searchSchema = z.object({
  query: z.string().describe('The search query'),
  max_results: z.number().min(5).max(20).default(10).optional().describe('Maximum number of results to return (5-20)'),
  search_depth: z.enum(['basic', 'advanced']).default('basic').optional().describe('Search depth'),
  include_domains: z.array(z.string()).optional().describe('List of domains to include in search'),
  exclude_domains: z.array(z.string()).optional().describe('List of domains to exclude from search')
})

export type SearchParameters = z.infer<typeof searchSchema>

export class TavilySearch {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY!
    if (!this.apiKey) {
      throw new Error('TAVILY_API_KEY is required')
    }
  }

  async search(params: SearchParameters): Promise<SearchResults> {
    // Tavily API requires a minimum of 5 characters in the query
    const filledQuery = params.query.length < 5 
      ? params.query + ' '.repeat(5 - params.query.length) 
      : params.query

    const requestBody = {
      api_key: this.apiKey,
      query: filledQuery,
      max_results: Math.max(params.max_results || 10, 5),
      search_depth: params.search_depth || 'basic',
      include_images: true,
      include_image_descriptions: true,
      include_answers: true,
      include_domains: params.include_domains || [],
      exclude_domains: params.exclude_domains || []
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Process images
      const processedImages = (data.images || [])
        .map((image: any) => ({
          url: this.sanitizeUrl(image.url),
          description: image.description
        }))
        .filter((image: SearchResultImage) => 
          image.description && image.description !== ''
        )

      return {
        ...data,
        images: processedImages
      }
    } catch (error) {
      console.error('Search error:', error)
      return {
        query: filledQuery,
        results: [],
        images: [],
        number_of_results: 0
      }
    }
  }

  private sanitizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.toString()
    } catch {
      return url
    }
  }
}

// Export singleton instance
export const tavilySearch = new TavilySearch()