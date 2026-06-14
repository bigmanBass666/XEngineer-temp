# T12 Work Record

## Task
实现完整的对话 UI 界面：聊天气泡、流式文字显示、状态指示器

## Files Created
- `src/components/ChatBubble.tsx` — 聊天气泡组件（用户/AI 双样式、圆角方向、头像、换行支持）
- `src/components/StreamingMessage.tsx` — AI 流式回复组件（蓝色脉冲光标）

## Files Modified
- `src/App.tsx` — 集成 ChatBubble + StreamingMessage + AudioRecorder；添加自动滚动、空状态、AI处理状态
- `src/components/StatusBar.tsx` — 新增 isAIProcessing 属性，AI处理中显示旋转图标

## Key Decisions
- AudioRecorder (T7) 已存在，直接集成而非使用占位
- VAD 状态通过 AudioRecorder → App → StatusBar 链路同步
- isAIProcessing 在 llm_chunk 首次出现时设为 true，tts_end/error 时重置为 false
- 自动滚动使用 scrollIntoView({ behavior: 'smooth' }) + useEffect 监听 messages/currentAIResponse 变化