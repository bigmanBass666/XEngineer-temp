import type { ReactNode } from 'react'
import type { ConnectionStatus, VADStatus } from '../lib/protocol'

interface StatusBarProps {
  connectionStatus: ConnectionStatus
  vadStatus: VADStatus
  isAIProcessing?: boolean
  audioElement?: ReactNode
}

export function StatusBar({ connectionStatus, vadStatus, isAIProcessing = false, audioElement }: StatusBarProps) {
  const statusText: Record<ConnectionStatus, string> = {
    disconnected: '未连接',
    connecting: '连接中...',
    connected: '已连接',
    error: '连接错误'
  }

  const statusColor: Record<ConnectionStatus, string> = {
    disconnected: 'bg-gray-500',
    connecting: 'bg-yellow-500',
    connected: 'bg-green-500',
    error: 'bg-red-500'
  }

  return (
    <footer className="h-10 flex items-center justify-between px-4 bg-gray-800 border-t border-gray-700 text-xs flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* 连接状态 */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${statusColor[connectionStatus]}`} />
          <span>{statusText[connectionStatus]}</span>
        </div>

        {/* VAD 状态 */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${vadStatus === 'speaking' ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
          <span>{vadStatus === 'speaking' ? '正在说话' : '静音'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* AI 处理状态 */}
        {isAIProcessing && (
          <div className="flex items-center gap-1.5 text-blue-400">
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>AI 处理中</span>
          </div>
        )}

        {audioElement}
        <span className="text-gray-500">XEngineer v0.1.0</span>
      </div>
    </footer>
  )
}