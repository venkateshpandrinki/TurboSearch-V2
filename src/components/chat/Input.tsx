// src/components/chat/Input.tsx
import { FormEvent } from 'react'

interface InputProps {
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void
  isLoading: boolean
}

export function Input({ input, handleInputChange, handleSubmit, isLoading }: InputProps) {
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={input}
        onChange={handleInputChange}
        placeholder="Ask me anything..."
        disabled={isLoading}
        className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="bg-blue-600 text-white rounded-full px-6 py-3 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  )
}