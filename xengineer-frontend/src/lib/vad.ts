// VAD 语音活动检测
// 方案：能量阈值检测（简单版）+ @ricky0123/vad-web（推荐，后续集成）

export type VADState = 'silent' | 'speaking'

export interface VADResult {
  state: VADState
  probability: number  // 0-1
}

export interface VADController {
  processFrame(frame: Float32Array): VADResult
  reset(): void
}

// 简单能量阈值 VAD（不需要外部依赖）
export class EnergyVAD implements VADController {
  private threshold: number
  private silenceThreshold: number
  private frameSize: number
  private silenceFrames: number = 0
  private speechFrames: number = 0
  private currentState: VADState = 'silent'
  private readonly SILENCE_FRAMES_THRESHOLD: number  // ~300ms at 16kHz/512
  private readonly SPEECH_FRAMES_THRESHOLD: number   // ~60ms

  constructor(
    threshold: number = 0.02,
    silenceThreshold: number = 0.01,
    frameSize: number = 512,
    silenceFramesThreshold: number = 15,
    speechFramesThreshold: number = 3,
  ) {
    this.threshold = threshold
    this.silenceThreshold = silenceThreshold
    this.frameSize = frameSize
    this.SILENCE_FRAMES_THRESHOLD = silenceFramesThreshold
    this.SPEECH_FRAMES_THRESHOLD = speechFramesThreshold
  }

  processFrame(frame: Float32Array): VADResult {
    // 计算 RMS 能量
    let sum = 0
    for (let i = 0; i < frame.length; i++) {
      sum += frame[i] * frame[i]
    }
    const rms = Math.sqrt(sum / frame.length)

    const isSpeech = rms > this.threshold
    const isSilence = rms < this.silenceThreshold

    if (isSpeech) {
      this.speechFrames++
      this.silenceFrames = 0
      if (this.speechFrames >= this.SPEECH_FRAMES_THRESHOLD) {
        this.currentState = 'speaking'
        return { state: 'speaking', probability: Math.min(rms / this.threshold, 1) }
      }
    } else if (isSilence) {
      this.silenceFrames++
      this.speechFrames = 0
      if (this.silenceFrames >= this.SILENCE_FRAMES_THRESHOLD) {
        this.currentState = 'silent'
        return { state: 'silent', probability: 0 }
      }
    }
    // 中间区域或未达到切换阈值，保持当前状态
    return {
      state: this.currentState,
      probability: this.currentState === 'speaking' ? Math.min(rms / this.threshold, 1) : 0,
    }
  }

  reset(): void {
    this.silenceFrames = 0
    this.speechFrames = 0
    this.currentState = 'silent'
  }
}