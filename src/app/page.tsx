import SignIn from '@/components/Signin'
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

      <SignIn/>
    </div>
  )
}