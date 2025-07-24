// src/components/chat/Message.tsx
import { Message as MessageType } from '@/lib/types'

interface MessageProps {
  message: MessageType
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium">
            {isUser ? 'You' : 'Assistant'}
          </span>
        </div>
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  )
}