import { useCallback } from 'react'
import { useVAD } from '../hooks/useVAD'
import type { VADState } from '../lib/vad'

interface AudioRecorderProps {
  onAudioData: (base64: string) => void
  onVADStateChange: (state: VADState) => void
}

export function AudioRecorder({ onAudioData, onVADStateChange }: AudioRecorderProps) {
  const handleStateChange = useCallback((newState: VADState) => {
    onVADStateChange(newState)
  }, [onVADStateChange])

  const { state, isActive, error, start, stop } = useVAD({
    onStateChange: handleStateChange,
    onAudioData: onAudioData,
  })

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={isActive ? stop : start}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
          isActive
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
        aria-label={isActive ? '停止录音' : '开始录音'}
      >
        {isActive ? '停止录音' : '开始录音'}
      </button>
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-3 h-3 rounded-full transition-colors ${
            state === 'speaking' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
          }`}
          aria-hidden="true"
        />
        <span className="text-gray-300">
          {state === 'speaking' ? '正在说话...' : '静音'}
        </span>
      </div>
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  )
}