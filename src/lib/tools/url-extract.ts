// src/lib/tools/url-extract.ts (updated)
import { SearchResults } from '@/lib/types'

const CONTENT_CHARACTER_LIMIT = 10000

async function fetchJinaReaderData(url: string): Promise<SearchResults | null> {
  try {
    console.log('Fetching URL with Jina:', url)
    const response = await fetch(`https://r.jina.ai/${url}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-With-Generated-Alt': 'true'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Jina API error: ${response.status} ${response.statusText}`)
    }
    
    const json = await response.json()
    console.log('Jina response:', JSON.stringify(json, null, 2))
    
    if (!json.data || !json.data.content) {
      console.log('No content found in Jina response')
      return null
    }

    const content = json.data.content.slice(0, CONTENT_CHARACTER_LIMIT)

    return {
      results: [
        {
          title: json.data.title || 'Untitled',
          content,
          url: json.data.url || url,
          score: 1.0
        }
      ],
      query: url,
      images: [],
      number_of_results: 1
    }
  } catch (error) {
    console.error('Jina Reader API error:', error)
    return null
  }
}

async function fetchTavilyExtractData(url: string): Promise<SearchResults | null> {
  try {
    console.log('Fetching URL with Tavily:', url)
    const apiKey = process.env.TAVILY_API_KEY
    if (!apiKey) {
      throw new Error('TAVILY_API_KEY is required for URL extraction')
    }
    
    const response = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        api_key: apiKey, 
        urls: [url],
        include_raw_content: true
      })
    })
    
    if (!response.ok) {
      throw new Error(`Tavily Extract API error: ${response.status} ${response.statusText}`)
    }
    
    const json = await response.json()
    console.log('Tavily response:', JSON.stringify(json, null, 2))
    
    if (!json.results || json.results.length === 0) {
      console.log('No results found in Tavily response')
      return null
    }

    const result = json.results[0]
    const content = (result.raw_content || result.content || '').slice(0, CONTENT_CHARACTER_LIMIT)

    return {
      results: [
        {
          title: result.title || content.slice(0, 100) || 'Untitled',
          content: content || 'No content extracted',
          url: result.url || url,
          score: 1.0
        }
      ],
      query: url,
      images: [],
      number_of_results: 1
    }
  } catch (error) {
    console.error('Tavily Extract API error:', error)
    return null
  }
}

export async function extractUrlContent(url: string): Promise<SearchResults | null> {
  // Validate URL format
  try {
    new URL(url)
  } catch (error) {
    console.error('Invalid URL format:', url)
    return {
      results: [],
      query: url,
      images: [],
      number_of_results: 0,
      error: 'Invalid URL format'
    }
  }
  
  // Use Jina if the API key is set, otherwise use Tavily
  const useJina = process.env.JINA_API_KEY
  let results: SearchResults | null = null
  
  try {
    console.log('Using extraction method:', useJina ? 'Jina' : 'Tavily')
    if (useJina) {
      results = await fetchJinaReaderData(url)
    } else {
      results = await fetchTavilyExtractData(url)
    }
  } catch (error) {
    console.error('URL extraction error:', error)
  }
  
  // If both methods fail, return a fallback response
  if (!results) {
    return {
      results: [{
        title: 'URL Extraction Failed',
        content: `I was unable to extract content from ${url}. This could be due to:\n- The website blocking automated access\n- The URL being invalid\n- Network issues\n\nPlease try another URL or check if the link is accessible.`,
        url: url,
        score: 0.0
      }],
      query: url,
      images: [],
      number_of_results: 1
    }
  }
  
  return results
}