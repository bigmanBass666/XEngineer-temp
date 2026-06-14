# XEngineer

> AI 视觉对话助手 — 七牛云 AI Hackathon

https://www.bilibili.com/video/BV1DqJA6VEx4/

## 项目简介

XEngineer 是一个 **AI 视觉对话助手**，用户可以通过语音和摄像头与 AI 进行实时多模态交互。AI 能"看到"用户展示的实物、文档、屏幕内容，并通过语音进行自然对话。

**核心能力：**
- 语音识别（ASR）：火山引擎 Seed-ASR 2.0，实时流式语音转文字
- 视觉理解（VLM）：Agnes Text 多模态模型，理解图片内容
- 智能对话（LLM）：基于视觉理解生成上下文相关的回复
- 语音合成（TTS）：火山引擎 Seed-TTS 2.0，文字转自然语音
- 前端 VAD：基于能量的语音活动检测，驱动 ASR 会话生命周期
- Barge-in：AI 说话时用户可随时打断，实现自然对话节奏

## 架构设计

```
用户语音 → VAD检测 → ASR(语音转文字) → VLM+LLM(理解+回复) → TTS(文字转语音) → 用户听到回复
                                    ↑
用户摄像头 → Canvas截图 → 图像理解(多模态Prompt)
```

采用 **Pipeline 架构**，每个处理环节（ASR / VLM+LLM / TTS）都是独立的 PipelineNode，通过 Orchestrator 串联。支持 StubNode 降级，确保任何节点不可用时主流程仍可运行。

前后端通过 **单一 WebSocket** 通信，JSON 消息协议支持 audio / image / vad_status 三种消息类型。

## 技术栈

| 模块 | 技术 |
|------|------|
| 后端 | Python FastAPI + Uvicorn |
| 前端 | Vite + React 18 + TypeScript |
| 样式 | TailwindCSS |
| ASR | 火山引擎 Seed-ASR 2.0（二进制WebSocket） |
| VLM/LLM | Agnes Text（OpenAI兼容，SSE流式） |
| TTS | 火山引擎 Seed-TTS 2.0（HTTP） |
| 实时通信 | WebSocket（全双工） |
| VAD | 基于RMS能量的前端语音活动检测 |

## 项目结构

```
XEngineer/
├── xengineer-backend/        # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py           # FastAPI入口，WebSocket端点
│   │   ├── config.py         # pydantic-settings 配置管理
│   │   ├── pipeline/         # Pipeline架构核心
│   │   │   ├── base.py       # PipelineNode抽象基类 + StubNode
│   │   │   ├── orchestrator.py # 流程编排（VAD驱动ASR会话）
│   │   │   ├── asr_node.py   # ASR处理节点
│   │   │   ├── vlm_node.py   # VLM+LLM处理节点（流式+句子级TTS触发）
│   │   │   └── tts_node.py   # TTS处理节点
│   │   ├── services/         # 外部API客户端
│   │   │   ├── volcengine_asr.py  # 火山ASR二进制WS协议
│   │   │   ├── agnes_client.py    # Agnes VLM SSE流式客户端
│   │   │   └── volcengine_tts.py  # 火山TTS HTTP客户端
│   │   └── managers/         # 业务管理器
│   │       ├── context.py   # 多轮对话上下文（max 5轮）
│   │       └── frame.py     # 帧去重（MD5 hash + 最小间隔）
│   └── requirements.txt
├── xengineer-frontend/       # Vite + React 前端
│   ├── src/
│   │   ├── App.tsx           # 主布局（摄像头 + 对话 + 状态栏）
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts  # WS连接管理（自动重连）
│   │   │   ├── useVAD.ts       # 麦克风采集 + VAD检测
│   │   │   └── useCamera.ts    # 摄像头 + Canvas截图
│   │   ├── components/
│   │   │   ├── Camera.tsx        # 摄像头预览 + VAD触发截图
│   │   │   ├── AudioPlayer.tsx   # 音频播放（队列 + Barge-in）
│   │   │   ├── AudioRecorder.tsx # 录音状态指示
│   │   │   ├── ChatBubble.tsx    # 对话气泡
│   │   │   ├── StreamingMessage.tsx # AI流式回复（光标动画）
│   │   │   └── StatusBar.tsx     # 连接/VAD状态
│   │   └── lib/
│   │       ├── protocol.ts  # WS消息类型定义
│   │       └── vad.ts       # EnergyVAD算法
│   └── vite.config.ts
├── docs/                    # 开发文档与计划
└── .trae/                   # 开发规范（spec/tasks/checklist）
```

## 快速开始

### 后端

```bash
cd xengineer-backend
pip install -r requirements.txt
cp .env.example .env  # 填入你的API Key
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 前端

```bash
cd xengineer-frontend
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`，允许摄像头和麦克风权限即可开始对话。
