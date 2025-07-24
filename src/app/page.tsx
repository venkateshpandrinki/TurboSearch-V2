// 'use client';

// import { Spinner } from '@/components/ui/spinner';
// import { useChat } from '@ai-sdk/react';

// export default function Page() {
//   const { messages, input, handleInputChange, handleSubmit, status, stop } =
//     useChat({});

//   return (
//     <>
//       {messages.map(message => (
//         <div key={message.id} style={{ marginBottom: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
//           <strong>{message.role === 'user' ? 'User: ' : 'AI: '}</strong>
//           <div>{message.content}</div>
          
//           {/* Display tool calls */}
//           {message.toolInvocations && message.toolInvocations.map((toolCall, index) => (
//             <div key={index} style={{ marginTop: '0.5rem', padding: '0.5rem', backgroundColor: '#f5f5f5' }}>
//               <strong>Tool: {toolCall.toolName}</strong>
//               <details>
//                 <summary>Arguments</summary>
//                 <pre>{JSON.stringify(toolCall.args, null, 2)}</pre>
//               </details>
//               {'result' in toolCall && (toolCall as any).result && (
//                 <details>
//                   <summary>Result</summary>
//                   <pre>{JSON.stringify((toolCall as any).result, null, 2)}</pre>
//                 </details>
//               )}
//             </div>
//           ))}
//         </div>
//       ))}

//       {(status === 'submitted' || status === 'streaming') && (
//         <div>
//           {status === 'submitted' && <Spinner />}
//           <button type="button" onClick={() => stop()}>
//             Stop
//           </button>
//         </div>
//       )}

//       <form onSubmit={handleSubmit}>
//         <input
//           name="prompt"
//           value={input}
//           onChange={handleInputChange}
//           disabled={status !== 'ready'}
//           style={{ width: '300px', padding: '0.5rem' }}
//         />
//         <button type="submit" disabled={status !== 'ready'}>
//           Submit
//         </button>
//       </form>
//     </>
//   );
// }


// src/app/page.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          AI Search Assistant
        </h1>
        <p className="text-gray-600 mb-8">
          Powered by Google Gemini and Tavily Search. Ask me anything and I'll search the web to find answers for you.
        </p>
        <Link
          href="/chat"
          className="inline-block bg-blue-600 text-white rounded-full px-6 py-3 font-medium hover:bg-blue-700 transition-colors"
        >
          Start Chatting
        </Link>
      </div>
    </div>
  )
}