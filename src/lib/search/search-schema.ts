// src/lib/search/search-schema.ts
import { z } from 'zod'

// Existing search schema (from your tavily.ts)
export const searchSchema = z.object({
  query: z.string().describe('The search query'),
  max_results: z.number().min(5).max(20).default(10).optional().describe('Maximum number of results to return (5-20)'),
  search_depth: z.enum(['basic', 'advanced']).default('basic').optional().describe('Search depth'),
  include_domains: z.array(z.string()).optional().describe('List of domains to include in search'),
  exclude_domains: z.array(z.string()).optional().describe('List of domains to exclude from search')
})

// New schema for URL extraction
export const extractUrlSchema = z.object({
  url: z.string().url().describe('The URL to extract content from')
})

// New schema for video search
export const videoSearchSchema = z.object({
  query: z.string().describe('The video search query'),
  max_results: z.number().min(1).max(10).default(5).optional().describe('Maximum number of videos to return (1-10)')
})

export const imageSearchSchema = z.object({
  query: z.string().describe('The image search query'),
  max_results: z.number().min(1).max(10).default(5).optional().describe('Maximum number of images to return (1-10)')
})


// Combined schema for XML parsing
export const toolSchemas = {
  search: searchSchema,
  extract_url: extractUrlSchema,
  search_videos: videoSearchSchema,
  search_images: imageSearchSchema
}



