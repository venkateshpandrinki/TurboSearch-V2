// src/components/chat/Chat.tsx (updated)
'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'

import { Message } from '@/components/chat/Message'
import { Input } from '@/components/chat/Input'

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat'
  })
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                AI Search Assistant
              </h1>
              <p className="text-gray-600">
                Ask me anything! I can search the web, read articles, and find videos.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                <p>Try asking:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>"What are the latest AI news?"</li>
                  <li>"Summarize this article: [URL]"</li>
                  <li>"Show me cooking tutorial videos"</li>
                </ul>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <Input
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}