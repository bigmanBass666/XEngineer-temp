import { useState, useRef, useCallback, useEffect } from 'react'

interface UseCameraOptions {
  width?: number
  height?: number
  onFrame?: (base64: string) => void  // 截图回调
}

export function useCamera(options: UseCameraOptions = {}) {
  const { width = 640, height = 480, onFrame } = options
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastHashRef = useRef<string>('')

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    canvas.width = width
    canvas.height = height
    ctx.drawImage(videoRef.current, 0, 0, width, height)

    // JPEG quality 0.6, ~30-50KB
    const base64 = canvas.toDataURL('image/jpeg', 0.6)
    return base64
  }, [width, height])

  const captureAndSend = useCallback(() => {
    const base64 = captureFrame()
    if (!base64) return

    // 画面变化检测（简单 hash 对比）
    const hash = simpleHash(base64)
    if (hash === lastHashRef.current) return  // 画面没变化，跳过
    lastHashRef.current = hash

    // 去掉 data:image/jpeg;base64, 前缀，只发送纯 base64
    const pureBase64 = base64.split(',')[1]
    onFrame?.(pureBase64)

    return pureBase64
  }, [captureFrame, onFrame])

  const start = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width, height, facingMode: 'user' }
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsActive(true)
    } catch (err: any) {
      setError(err.message || '无法访问摄像头')
      console.error('[Camera] Failed:', err)
    }
  }, [width, height])

  const stop = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    setIsActive(false)
  }, [])

  useEffect(() => {
    return () => stop()
  }, [stop])

  return {
    isActive,
    error,
    videoRef,
    canvasRef,
    start,
    stop,
    captureFrame,
    captureAndSend,
  }
}

// 简单 hash 函数（用于画面变化检测）
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash  // Convert to 32bit integer
  }
  return hash.toString(36)
}