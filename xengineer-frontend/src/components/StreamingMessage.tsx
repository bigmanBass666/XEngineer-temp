interface StreamingMessageProps {
  content: string
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  if (!content) return null

  return (
    <div className="flex justify-start mb-3">
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold mr-2 flex-shrink-0">
        AI
      </div>
      <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-gray-700 text-gray-100 text-sm leading-relaxed whitespace-pre-wrap break-words">
        {content}
        <span className="inline-block w-1.5 h-4 bg-blue-400 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
      </div>
    </div>
  )
}