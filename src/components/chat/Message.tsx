// src/components/chat/Message.tsx (updated)
import { Message as MessageType } from '@/lib/types'

interface MessageProps {
  message: MessageType & { toolInvocations?: any[] }
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
        
        {/* Display tool calls */}
        {message.toolInvocations && message.toolInvocations.map((toolCall, index) => (
          <div key={index} className="mt-3 p-3 bg-gray-100 rounded-lg text-xs">
            <div className="font-medium text-gray-700">
              🔧 Tool: {toolCall.toolName}
            </div>
            
            {/* Show arguments */}
            <details className="mt-1">
              <summary className="cursor-pointer text-gray-600">Arguments</summary>
              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                {JSON.stringify(toolCall.args, null, 2)}
              </pre>
            </details>
            
            {/* Show results if available */}
            {'result' in toolCall && toolCall.result && (
              <details className="mt-1">
                <summary className="cursor-pointer text-gray-600">Results</summary>
                <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
                  {toolCall.toolName === 'search_images' ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {toolCall.result.images?.slice(0, 4).map((image: any, i: number) => (
                        <div key={i} className="border rounded">
                          <img 
                            src={image.imageUrl} 
                            alt={image.title || 'Search result'} 
                            className="w-full h-32 object-cover rounded-t"
                          />
                          <div className="p-2 text-xs text-gray-600 line-clamp-2">
                            {image.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : toolCall.toolName === 'search_videos' ? (
                    <div className="space-y-2">
                      {toolCall.result.videos?.slice(0, 3).map((video: any, i: number) => (
                        <div key={i} className="border-b border-gray-200 pb-2 last:border-0">
                          <div className="font-medium">{video.title}</div>
                          <div className="text-gray-600 text-xs">{video.channel}</div>
                        </div>
                      ))}
                    </div>
                  ) : toolCall.toolName === 'extract_url' ? (
                    <div>
                      <div className="font-medium">{toolCall.result.results?.[0]?.title}</div>
                      <div className="text-gray-600 line-clamp-3">
                        {toolCall.result.results?.[0]?.content?.substring(0, 200)}...
                      </div>
                    </div>
                  ) : (
                    <pre className="overflow-x-auto">
                      {JSON.stringify(toolCall.result, null, 2)}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}