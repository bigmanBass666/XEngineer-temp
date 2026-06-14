import { useCallback, useEffect, useState } from 'react'

interface AudioPlayerProps {
  isPlaying: boolean
  onPlayStateChange?: (playing: boolean) => void
}

/**
 * TTS 音频播放管理器（全局单例）
 * - 使用 Web Audio API 解码并播放 base64 mp3 音频
 * - 维护播放队列，自动顺序播放
 * - AudioContext 采样率 24000Hz 匹配 TTS 输出
 * - 支持 Barge-in（立即停止 + 清空队列）
 */
class AudioPlaybackManager {
  private audioContext: AudioContext | null = null
  private queue: AudioBuffer[] = []
  private _isPlaying: boolean = false
  private currentSource: AudioBufferSourceNode | null = null
  private onPlayStateChange?: (playing: boolean) => void

  constructor() {
    this.initContext()
  }

  private initContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 })
    }
    // 恢复被浏览器挂起的 AudioContext（自动播放策略）
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  setCallback(cb: (playing: boolean) => void) {
    this.onPlayStateChange = cb
  }

  /** 将 base64 mp3 数据解码后加入播放队列 */
  async enqueue(base64Audio: string) {
    this.initContext()
    try {
      const binaryStr = atob(base64Audio)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }
      const audioBuffer = await this.audioContext!.decodeAudioData(bytes.buffer.slice(0))
      this.queue.push(audioBuffer)
      if (!this._isPlaying) {
        this.playNext()
      }
    } catch (err) {
      console.error('[AudioPlayer] Decode error:', err)
    }
  }

  /** 从队列头部取出一段并播放，播完自动触发下一段 */
  private playNext() {
    if (this.queue.length === 0) {
      this._isPlaying = false
      this.onPlayStateChange?.(false)
      return
    }

    this._isPlaying = true
    this.onPlayStateChange?.(true)

    const buffer = this.queue.shift()!
    const source = this.audioContext!.createBufferSource()
    source.buffer = buffer
    source.connect(this.audioContext!.destination)
    this.currentSource = source

    source.onended = () => {
      this.currentSource = null
      this.playNext()
    }

    source.start()
  }

  /**
   * Barge-in：用户开始说话时立即停止当前播放并清空整个队列
   * 用于打断 AI 正在进行的 TTS 语音输出
   */
  stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch {
        // source may have already ended
      }
      this.currentSource = null
    }
    this.queue = []
    this._isPlaying = false
    this.onPlayStateChange?.(false)
  }

  getIsPlaying() {
    return this._isPlaying
  }
}

// 全局单例 —— 整个应用共享同一个播放管理器
export const audioPlayer = new AudioPlaybackManager()

/**
 * TTS 音频播放可视化组件
 * 显示播放中的波形动画指示器，可嵌入 StatusBar 或其他位置
 */
export function AudioPlayer({ isPlaying: _externalPlaying, onPlayStateChange }: AudioPlayerProps) {
  const [internalPlaying, setInternalPlaying] = useState(false)

  const handlePlayStateChange = useCallback((playing: boolean) => {
    setInternalPlaying(playing)
    onPlayStateChange?.(playing)
  }, [onPlayStateChange])

  useEffect(() => {
    audioPlayer.setCallback(handlePlayStateChange)
    return () => audioPlayer.setCallback(() => {})
  }, [handlePlayStateChange])

  return (
    <div className="flex items-center gap-2">
      {internalPlaying && (
        <>
          <div className="flex gap-0.5 items-end h-4">
            <div
              className="w-0.5 bg-blue-400 rounded-full animate-bounce"
              style={{ height: '60%', animationDelay: '0ms' }}
            />
            <div
              className="w-0.5 bg-blue-400 rounded-full animate-bounce"
              style={{ height: '100%', animationDelay: '150ms' }}
            />
            <div
              className="w-0.5 bg-blue-400 rounded-full animate-bounce"
              style={{ height: '40%', animationDelay: '300ms' }}
            />
            <div
              className="w-0.5 bg-blue-400 rounded-full animate-bounce"
              style={{ height: '80%', animationDelay: '450ms' }}
            />
          </div>
          <span className="text-xs text-gray-400">播放中</span>
        </>
      )}
    </div>
  )
}
