// src/app/api/chat/route.ts
import { NextResponse } from 'next/server'
import { convertToCoreMessages, createDataStreamResponse, DataStreamWriter } from 'ai'

import { executeToolCall } from '@/lib/ai/tool-execution'
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    
    // Convert Next.js messages to CoreMessage format
    const coreMessages = convertToCoreMessages(messages)
    
    return createDataStreamResponse({
      execute: async (dataStream: DataStreamWriter) => {
        try {
          // Execute tool calls (search if needed)
          const { toolCallMessages } = await executeToolCall(
            coreMessages,
            dataStream
          )
          
          // Generate final response using search results
          const allMessages = [...coreMessages, ...toolCallMessages]
          
          const result = streamText({
            model: google('gemini-2.0-flash'),
            messages: allMessages,
            temperature: 0.7,
            system: `You are an intelligent AI assistant that can search the web to answer questions.
                    Current date: ${new Date().toISOString().split('T')[0]}
                    
                    Use the search results provided to answer the user's question accurately and comprehensively.
                    If no search results were provided, answer based on your general knowledge.
                    Always cite sources when using information from search results.`
          })
          
          result.mergeIntoDataStream(dataStream)
        } catch (error) {
          console.error('Stream execution error:', error)
          throw error
        }
      },
      onError: (error) => {
        console.error('Stream error:', error)
        return error instanceof Error ? error.message : String(error)
      }
    })
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Error processing your request' },
      { status: 500 }
    )
  }
}