// src/lib/tools/image-search.ts
export async function searchImages(query: string, maxResults: number = 5): Promise<any> {
  try {
    const apiKey = process.env.SERPER_API_KEY
    if (!apiKey) {
      throw new Error('SERPER_API_KEY is required for image search')
    }

    const response = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        q: query,
        num: maxResults
      })
    })

    if (!response.ok) {
      throw new Error(`Serper API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Image Search API error:', error)
    return {
      images: [],
      query: query
    }
  }
}