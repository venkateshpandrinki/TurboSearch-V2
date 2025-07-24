// // src/lib/ai/tool-execution.ts
// import { CoreMessage, DataStreamWriter, generateId } from 'ai'
// import { z, ZodObject } from 'zod'

// import { tavilySearch, searchSchema } from '@/lib/search/tavily'
// import { google } from '@ai-sdk/google'
// import { generateText } from 'ai'
// import { parseToolCallXml, ToolCall } from '@/lib/ai/xml-parser'

// interface ToolExecutionResult {
//   toolCallDataAnnotation: any | null
//   toolCallMessages: CoreMessage[]
// }

// export async function executeToolCall(
//   coreMessages: CoreMessage[],
//   dataStream: DataStreamWriter
// ): Promise<ToolExecutionResult> {
//   // Convert Zod schema to string representation for system prompt
//   const searchSchemaString = Object.entries(searchSchema.shape)
//     .map(([key, value]) => {
//       const description = (value as any).description || ''
//       const isOptional = value instanceof z.ZodOptional
//       return `- ${key}${isOptional ? ' (optional)' : ''}: ${description}`
//     })
//     .join('\n')

//   // Generate tool selection using XML format
//   const toolSelectionResponse = await generateText({
//     model: google('gemini-1.5-pro-latest'),
//     system: `You are an intelligent assistant that analyzes conversations to select the most appropriate tools and their parameters.
//             You excel at understanding context to determine when and how to use available tools, including crafting effective search queries.
//             Current date: ${new Date().toISOString().split('T')[0]}

//             Do not include any other text in your response.
//             Respond in XML format with the following structure:
//             <tool_call>
//               <tool>tool_name</tool>
//               <parameters>
//                 <query>search query text</query>
//                 <max_results>number - 10 by default</max_results>
//                 <search_depth>basic or advanced</search_depth>
//                 <include_domains>domain1,domain2</include_domains>
//                 <exclude_domains>domain3,domain4</exclude_domains>
//               </parameters>
//             </tool_call>

//             Available tools: search

//             Search parameters:
//             ${searchSchemaString}

//             If you don't need a tool, respond with </tool_call><tool></tool></tool_call>`,
//     messages: coreMessages,
//     temperature: 0.3
//   })

//   // Parse the tool selection XML
//   const toolCall = parseToolCallXml(toolSelectionResponse.text, searchSchema as ZodObject<any>)

//   if (!toolCall || toolCall.tool === '') {
//     return { toolCallDataAnnotation: null, toolCallMessages: [] }
//   }

//   // Send tool call annotation to client
//   const toolCallAnnotation = {
//     type: 'tool_call',
//     data: {
//       state: 'call',
//       toolCallId: `call_${generateId()}`,
//       toolName: toolCall.tool,
//       args: JSON.stringify(toolCall.parameters)
//     }
//   }
//   dataStream.writeData(toolCallAnnotation)

//   // Execute the search tool
//   let searchResults: any
//   if (toolCall.tool === 'search') {
//     try {
//       searchResults = await tavilySearch.search({
//         query: toolCall.parameters?.query ?? '',
//         max_results: toolCall.parameters?.max_results,
//         search_depth: toolCall.parameters?.search_depth,
//         include_domains: toolCall.parameters?.include_domains ?? [],
//         exclude_domains: toolCall.parameters?.exclude_domains ?? []
//       })
//     } catch (error) {
//       console.error('Search execution error:', error)
//       searchResults = {
//         query: toolCall.parameters?.query ?? '',
//         results: [],
//         images: [],
//         number_of_results: 0
//       }
//     }
//   }

//   // Update annotation with results
//   const updatedToolCallAnnotation = {
//     ...toolCallAnnotation,
//     data: {
//       ...toolCallAnnotation.data,
//       result: JSON.stringify(searchResults),
//       state: 'result'
//     }
//   }
//   dataStream.writeMessageAnnotation(updatedToolCallAnnotation)

//   const toolCallDataAnnotation = {
//     role: 'data',
//     content: {
//       type: 'tool_call',
//       data: updatedToolCallAnnotation.data
//     }
//   }

//   const toolCallMessages: CoreMessage[] = [
//     {
//       role: 'assistant',
//       content: `Tool call result: ${JSON.stringify(searchResults)}`
//     },
//     {
//       role: 'user',
//       content: 'Now answer the user question using the search results above.'
//     }
//   ]

//   return { toolCallDataAnnotation, toolCallMessages }
// }

// src/lib/ai/tool-execution.ts
import { CoreMessage, DataStreamWriter, generateId } from 'ai'
import { z, ZodObject } from 'zod'

import { tavilySearch, searchSchema } from '@/lib/search/tavily'
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { parseToolCallXml, ToolCall } from '@/lib/ai/xml-parser'

interface ToolExecutionResult {
  toolCallDataAnnotation: any | null
  toolCallMessages: CoreMessage[]
}

export async function executeToolCall(
  coreMessages: CoreMessage[],
  dataStream: DataStreamWriter
): Promise<ToolExecutionResult> {
  // Convert Zod schema to string representation for system prompt
  const searchSchemaString = Object.entries(searchSchema.shape)
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
                <query>search query text</query>
                <max_results>number - 10 by default</max_results>
                <search_depth>basic or advanced</search_depth>
                <include_domains>domain1,domain2</include_domains>
                <exclude_domains>domain3,domain4</exclude_domains>
              </parameters>
            </tool_call>

            Available tools: search

            Search parameters:
            ${searchSchemaString}

            If you don't need a tool, respond with </tool_call><tool></tool></tool_call>`,
    messages: coreMessages,
    temperature: 0.3
  })

  // Parse the tool selection XML
  const toolCall = parseToolCallXml(toolSelectionResponse.text, searchSchema as ZodObject<any>)

  if (!toolCall || toolCall.tool === '') {
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

  // Execute the search tool
  let searchResults: any
  if (toolCall.tool === 'search') {
    try {
      searchResults = await tavilySearch.search({
        query: toolCall.parameters?.query ?? '',
        max_results: toolCall.parameters?.max_results,
        search_depth: toolCall.parameters?.search_depth,
        include_domains: toolCall.parameters?.include_domains ?? [],
        exclude_domains: toolCall.parameters?.exclude_domains ?? []
      })
    } catch (error) {
      console.error('Search execution error:', error)
      searchResults = {
        query: toolCall.parameters?.query ?? '',
        results: [],
        images: [],
        number_of_results: 0
      }
    }
  }

  // Send tool result in Vercel AI SDK format
  dataStream.writeData({
    toolCallId,
    toolName: toolCall.tool,
    args: toolCall.parameters,
    result: searchResults,
    type: 'tool-result'
  })

  const toolCallDataAnnotation = null // Not needed for useChat

  const toolCallMessages: CoreMessage[] = [
    {
      role: 'assistant',
      content: `Tool call result: ${JSON.stringify(searchResults)}`
    },
    {
      role: 'user',
      content: 'Now answer the user question using the search results above.'
    }
  ]

  return { toolCallDataAnnotation, toolCallMessages }
}