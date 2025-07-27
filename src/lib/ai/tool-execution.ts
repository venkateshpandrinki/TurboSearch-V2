// src/lib/ai/tool-execution.ts
import { CoreMessage, DataStreamWriter, generateId } from 'ai'
import { z } from 'zod'

import { tavilySearch, searchSchema } from '@/lib/search/tavily'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { parseToolCallXml, ToolCall } from '@/lib/ai/xml-parser'
import { extractUrlContent } from '@/lib/tools/url-extract'
import { searchVideos } from '@/lib/tools/video-search'
import { toolSchemas } from '@/lib/search/search-schema'
import { searchImages } from '@/lib/tools/image-search'


interface ToolExecutionResult {
  toolCallDataAnnotation: any | null
  toolCallMessages: CoreMessage[]
}

export async function executeToolCall(
  coreMessages: CoreMessage[],
  dataStream: DataStreamWriter
): Promise<ToolExecutionResult> {
  // Convert Zod schemas to string representations for system prompt
  const searchSchemaString = Object.entries(searchSchema.shape)
    .map(([key, value]) => {
      const description = (value as any).description || ''
      const isOptional = value instanceof z.ZodOptional
      return `- ${key}${isOptional ? ' (optional)' : ''}: ${description}`
    })
    .join('\n')

  const extractUrlSchemaString = Object.entries(toolSchemas.extract_url.shape)
    .map(([key, value]) => {
      const description = (value as any).description || ''
      const isOptional = value instanceof z.ZodOptional
      return `- ${key}${isOptional ? ' (optional)' : ''}: ${description}`
    })
    .join('\n')

  const videoSearchSchemaString = Object.entries(toolSchemas.search_videos.shape)
    .map(([key, value]) => {
      const description = (value as any).description || ''
      const isOptional = value instanceof z.ZodOptional
      return `- ${key}${isOptional ? ' (optional)' : ''}: ${description}`
    })
    .join('\n')

  const imageSearchSchemaString = Object.entries(toolSchemas.search_images.shape)
  .map(([key, value]) => {
    const description = (value as any).description || ''
    const isOptional = value instanceof z.ZodOptional
    return `- ${key}${isOptional ? ' (optional)' : ''}: ${description}`
  })
  .join('\n')


  // Generate tool selection using XML format
  const toolSelectionResponse = await generateText({
    model: google('gemini-2.0-flash'),
    system: `You are an intelligent assistant that analyzes conversations to select the most appropriate tools and their parameters.
            You excel at understanding context to determine when and how to use available tools, including crafting effective search queries.
            Current date: ${new Date().toISOString().split('T')[0]}

            Do not include any other text in your response.
            Respond in XML format with the following structure:
            <tool_call>
              <tool>tool_name</tool>
              <parameters>
                <!-- Parameters based on tool type -->
              </parameters>
            </tool_call>

            Available tools: search, extract_url, search_videos

            Search parameters:
            ${searchSchemaString}

            URL Extraction parameters:
            ${extractUrlSchemaString}

            Video Search parameters:
            ${videoSearchSchemaString}

            Image Search parameters:
            ${imageSearchSchemaString}

            Examples:
            For web search: <tool>search</tool><parameters><query>latest AI news</query></parameters>
            For URL extraction: <tool>extract_url</tool><parameters><url>https://example.com/article</url></parameters>
            For video search: <tool>search_videos</tool><parameters><query>cooking tutorials</query><max_results>3</max_results></parameters>
           For image search: <tool>search_images</tool><parameters><query>wildlife photos</query><max_results>3</max_results></parameters>
            If you don't need a tool, respond with </tool_call><tool></tool></tool_call>`,
    messages: coreMessages,
    temperature: 0.3
  })


  // Parse the tool selection XML
console.log('Raw AI response:', toolSelectionResponse.text)
const toolCall = parseToolCallXml(toolSelectionResponse.text)
console.log('Parsed tool call:', toolCall)

if (!toolCall || toolCall.tool === '') {
  console.log('No valid tool call found')
  return { toolCallDataAnnotation: null, toolCallMessages: [] }
}

  // Send tool call in the format that useChat expects
  const toolCallId = `call_${generateId()}`
  
  // Write tool call in Vercel AI SDK format
  dataStream.writeData({
    toolCallId,
    toolName: toolCall.tool,
    args: toolCall.parameters,
    type: 'tool-call'
  })

  // Execute the appropriate tool
  let toolResults: any = null
  
  try {
    if (toolCall.tool === 'search') {
      console.log('Executing search tool with params:', toolCall.parameters)
      toolResults = await tavilySearch.search({
        query: toolCall.parameters?.query ?? '',
        max_results: toolCall.parameters?.max_results,
        search_depth: toolCall.parameters?.search_depth,
        include_domains: toolCall.parameters?.include_domains ?? [],
        exclude_domains: toolCall.parameters?.exclude_domains ?? []
      })
      console.log('Search results:', JSON.stringify(toolResults, null, 2))
    } else if (toolCall.tool === 'extract_url') {
      console.log('Executing extract_url tool with params:', toolCall.parameters)
      toolResults = await extractUrlContent(toolCall.parameters?.url ?? '')
      console.log('Extract URL results:', JSON.stringify(toolResults, null, 2))
    } else if (toolCall.tool === 'search_videos') {
      console.log('Executing search_videos tool with params:', toolCall.parameters)
      toolResults = await searchVideos(
        toolCall.parameters?.query ?? '',
        toolCall.parameters?.max_results ?? 5
      )
      console.log('Video search results:', JSON.stringify(toolResults, null, 2))
    } else if (toolCall.tool === 'search_images') {
  console.log('Executing search_images tool with params:', toolCall.parameters)
  toolResults = await searchImages(
    toolCall.parameters?.query ?? '',
    toolCall.parameters?.max_results ?? 5
  )
  console.log('Image search results:', JSON.stringify(toolResults, null, 2))
    
    
 } else {
      console.log('Unknown tool requested:', toolCall.tool)
      toolResults = {
        error: 'Unknown tool',
        tool: toolCall.tool
      }
    }
  } catch (error) {
    console.error('Tool execution error:', error)
    toolResults = {
      error: 'Failed to execute tool',
      tool: toolCall.tool,
      message: (error as Error).message
    }
  }

  // Send tool result in Vercel AI SDK format
  dataStream.writeData({
    toolCallId,
    toolName: toolCall.tool,
    args: toolCall.parameters,
    result: toolResults,
    type: 'tool-result'
  })

  const toolCallDataAnnotation = null // Not needed for useChat

  // Format results for the AI to use in its response
  const toolCallMessages: CoreMessage[] = [
    {
      role: 'assistant',
      content: `Tool call result: ${JSON.stringify(toolResults)}`
    },
    {
      role: 'user',
      content: 'Now answer the user question using the tool results above.'
    }
  ]

  return { toolCallDataAnnotation, toolCallMessages }
}