// src/lib/types/index.ts
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'data'
  content: string
  timestamp: Date
}

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