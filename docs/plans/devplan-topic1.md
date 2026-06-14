# 题目一开发计划：AI 视觉对话助手 — 方案定稿

> 选题已确认：题目一（AI视觉对话助手）
> 状态：**开发就绪** — 所有决策项已确认，可进入 Phase 1
> 调研基础：`plans/research-topic1.md`（1065行开源项目分析）
> API 评估：`plans/topic1-reassessment.md`（火山引擎 API 加持评估）

---

## 一、从开源项目借鉴的设计哲学

> 核心原则：学习成熟的设计思想和架构模式，不照抄代码。代码相似度 >50% = 取消资格。

### 1.1 Pipecat（7k Stars）— Pipeline 架构思想

**借鉴点：**
- **Pipeline/Flow 编排模式**：将 AI 服务抽象为独立的 Pipeline 节点（ASR → LLM → TTS），每个节点可独立替换
- **服务解耦**：每个 AI 服务（STT/LLM/TTS）是独立模块，通过统一接口连接，不硬编码
- **我们的应用**：后端按 Pipeline 思想组织代码，每个模块（ASR/VLM/TTS）独立文件、独立类、统一接口

### 1.2 LiveKit Agents（10.7k Stars）— VAD + 打断机制

**借鉴点：**
- **VAD（语音活动检测）内置**：自动检测用户开始/停止说话，不需要 push-to-talk
- **Barge-in（打断）支持**：AI 说话时用户插话，立即停止 TTS 播放，切换到听的模式
- **我们的应用**：前端实现 VAD + Barge-in，这是"语音交互自然度"的关键

### 1.3 aiwebcam2 — 最接近赛题的完整实现

**借鉴点：**
- **Canvas 截图 + base64** 的帧提取方案（最简单可靠）
- **WebRTC 前端**：低延迟音视频传输
- **后端 WebSocket 中转**：前后端通信标准模式
- **我们的应用**：MVP 用 Canvas 截图（而非 WebRTC），降低复杂度；WebSocket 前后端通信

### 1.4 StreamingVLM（MIT & NVIDIA）— 成本优化思想

**借鉴点：**
- **自适应帧率**：画面变化大时提高帧率，静止时降低，减少无效 VLM 调用
- **上下文窗口裁剪**：只保留最近 N 轮对话 + 最新一帧图片
- **模型分层**：简单文本问题不传图片，只传视觉 token
- **KV 缓存复用**：相似帧之间复用 KV 缓存，降低视频 token 消耗（论文核心创新）
- **我们的应用**：赛题要求成本控制文档，这些策略是现成素材

### 1.5 调研报告中的流式 Pipeline 思想

**借鉴点：**
- **全链路流式**：流式 ASR → 流式 LLM → 流式 TTS → 流式播放，端到端延迟 <800ms
- **Sentence-level TTS**：LLM 流式输出积累到一句话（句号/问号）→ 立即调 TTS，不等全文生成完
- **我们的应用**：LLM 用 Agnes 流式输出，积累一句话后立即调火山 TTS，降低首音频延迟

---

## 二、确定的技术方案

```
前端:  Vite + React + TypeScript + TailwindCSS
后端:  Python FastAPI + websockets
ASR:   火山 Seed-ASR 2.0（WebSocket 双向流式，官方 Demo 改造）
VLM:   Agnes Text (agnes-2.0-flash, base64 图片理解, 公网可达 ✅)
LLM:   Agnes Text (agnes-2.0-flash, 与 VLM 同一模型)
TTS:   火山 TTS 2.0 HTTP（50+ 音色）
架构:  Pipeline 模式（借鉴 Pipecat 思想）
部署:  本地运行（前端 dev server + Python 后端）
```

### 架构图（Pipeline 模式）

```
┌──────────────────────────────────────────────────────┐
│                     浏览器前端                        │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ 摄像头   │  │ 麦克风   │  │ 对话 UI           │  │
│  │ Canvas   │  │ VAD 检测 │  │ 文字气泡+流式显示  │  │
│  │ 截图base64│ │ AudioWorklet│ │ Web Audio 播放   │  │
│  │ 自适应帧率│ │ Barge-in  │  │ 打断指示器        │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │              │                  ▲            │
│       │         PCM 音频流         TTS 音频          │
│       │              │                  │            │
└───────┼──────────────┼──────────────────┼────────────┘
        │              │                  │
       JSON          JSON             JSON/binary
     (base64)     (base64)          (audio chunk)
        │              │                  ▲
┌───────┴──────────────┴──────────────────┴────────────┐
│              Python FastAPI 后端                        │
│                                                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │              Pipeline 编排器                      │  │
│  │                                                  │  │
│  │  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │  │
│  │  │ ASR     │→│ VLM+LLM  │→│ TTS           │  │  │
│  │  │ Node    │  │ Node     │  │ Node          │  │  │
│  │  │         │  │          │  │               │  │  │
│  │  │ 火山    │  │ Agnes    │  │ 火山 TTS      │  │  │
│  │  │ Seed-   │  │ Text     │  │ 2.0 HTTP      │  │  │
│  │  │ ASR 2.0 │  │ (VLM+LLM)│  │ 流式音频       │  │  │
│  │  └─────────┘  └──────────┘  └───────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─────────────────┐  ┌───────────────────────────┐  │
│  │ ContextManager  │  │ SmartFrameSelector        │  │  │
│  │ 5轮对话历史     │  │ 自适应帧率+画面变化检测    │  │  │
│  │ 图片只保留最新帧│  │ VAD触发时截图              │  │  │
│  └─────────────────┘  └───────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## 三、各模块设计细节（借鉴调研文档）

### 3.1 前端视频帧提取

**借鉴：** aiwebcam2 的 Canvas 截图方案 + StreamingVLM 的自适应帧率

```javascript
// 核心思路（非代码，实现时重写）
// 1. getUserMedia 获取摄像头，video 元素渲染
// 2. Canvas 640×480，JPEG quality 0.6（~30-50KB/帧）
// 3. VAD 检测到用户开始说话时截图（而非定时）
// 4. 画面变化检测（hash 对比），静止时不重复发送
```

### 3.2 前端音频采集 + VAD

**借鉴：** LiveKit Agents 的 VAD + Barge-in 设计

```
音频采集链路：
getUserMedia(16kHz, mono, echoCancellation)  // 采样率必须16000，匹配ASR要求
  → AudioContext(sampleRate: 16000) + AudioWorklet（采集 PCM）
  → PCM Float32 → Int16 转换（int16 = clamp(float32 * 32767, -32768, 32767)）
  → VAD 检测（@ricky0123/vad-web，Silero VAD WASM封装）
  → 检测到语音开始 → 触发截图 + 开始发送音频
  → 检测到语音结束 → 停止发送，等待 AI 回复
  → AI 回复期间用户插话 → Barge-in：停止 TTS 播放，重新监听
```

**已决策：VAD 在前端做** ✅
- 理由：LiveKit/Pipecat/VoiceChat_App 均在前端处理 VAD
- 方案：`@ricky0123/vad-web`（Silero VAD 的 WASM 封装，成熟稳定，npm直接安装）
- 采样率：前端 AudioContext 强制 `sampleRate: 16000`，避免浏览器默认44100Hz与ASR不匹配
- PCM格式：AudioWorklet 输出 Float32，需转为 Int16（`int16 = clamp(float32 * 32767, -32768, 32767)）`

### 3.3 前后端通信协议

**借鉴：** aiwebcam2 的 WebSocket JSON 消息协议

```
前端 → 后端：
  { type: "audio", data: "<base64 PCM>" }      // 音频 chunk
  { type: "image", data: "<base64 JPEG>" }      // 截图
  { type: "vad_status", speaking: true/false }   // VAD 状态

后端 → 前端：
  { type: "asr_interim", text: "..." }           // ASR 中间结果
  { type: "asr_final", text: "..." }             // ASR 最终结果
  { type: "llm_chunk", text: "..." }             // LLM 流式文本
  { type: "tts_audio", data: "<base64 mp3>" }    // TTS 音频 chunk
  { type: "tts_end" }                            // TTS 播放结束
```

### 3.4 ASR 模块（火山 Seed-ASR 2.0）

**核心挑战：** 二进制 WebSocket 协议

```
后端 ASR Node 职责：
  1. 接收前端 base64 PCM（Int16, 16kHz, mono）→ 解码为原始 bytes
  2. Gzip 压缩（火山要求）
  3. 构造 4 字节二进制 header（前 2 字节 payload 长度大端序）
  4. 通过 WebSocket 发送给火山 ASR
  5. 接收 ASR 返回的文本结果（中间结果 + 最终结果）
  6. 转发 JSON 消息给 Pipeline 编排器

关键参数：
  - format: pcm
  - sample_rate: 16000
  - channel: 1
  - enable_nonstream: true（二遍识别，先快后准）
  - 推荐模式: bigmodel_async（仅结果变化时返回，RTF 最优）
  - 分包策略: 每包 200ms（双向流式最优发包间隔）
  - VAD 判停: 默认 800ms，可配 end_window_size（最小 200ms）

技术选型：
  - WebSocket 客户端: websockets（asyncio 原生，与 FastAPI 异步生态一致）
  - Gzip: Python 标准库 gzip 模块
  - PCM 解码: base64.b64decode → struct.unpack('<h', ...)
```

**风险缓解：**
- 直接基于火山官方 Python Demo 改造（`docs/api/volcengine/seed-asr-streaming.md` 含完整协议说明和 Demo 代码链接）
- **Fallback 策略**：Phase 1.4 给 4h，若二进制协议无法调通，立即启用浏览器端 Web Speech API 作为 ASR 替代（前端直接识别语音，只传文本给后端，跳过 ASR Node）

**延迟目标：** 流式输入 5s 音频 → 300~400ms 返回

### 3.5 VLM + LLM 模块（Agnes Text）

**借鉴：** 调研报告的 MultimodalChatServer 设计 + 流式 Pipeline 思想

```python
# 核心思路（非代码，实现时重写）
# 1. 接收 ASR 最终文本 + 最新截图 base64
# 2. 构建多模态消息：[system_prompt] + [最近5轮对话] + [当前文本 + 图片]
# 3. 流式调用 Agnes Text API（SSE stream）
# 4. 积累文本到一句话（句号/问号/感叹号）→ 触发 TTS
# 5. 同时将文本 chunk 推送给前端显示
```

**System Prompt 设计：**
```
你是一个 AI 视觉对话助手。用户通过摄像头向你展示他们看到的世界，并用语音与你交流。
请结合画面内容和用户的问题，给出准确、简洁、友好的回答。
如果用户的问题与画面无关，正常回答即可。
回答请简短，适合语音播报（避免过长的段落）。
```

### 3.6 TTS 模块（火山 TTS 2.0 HTTP）

**借鉴：** 调研报告的 sentence-level streaming TTS 思想

```
后端 TTS Node 职责：
  1. 接收 Pipeline 传入的一句话文本
  2. 调用火山 TTS HTTP 接口（Authorization: Bearer 鉴权）
  3. 接收返回的完整音频（base64 mp3，非真正流式chunk）
  4. 将音频通过 WebSocket 推送给前端播放

关键参数：
  - voice_type: zh_female_vv_uranus_bigtts (Vivi 2.0)
  - response_format: mp3
  - speed_ratio: 1.0

技术选型：
  - HTTP 客户端: httpx（支持 async，与 FastAPI 生态一致）
  - 注意：火山 TTS HTTP 接口返回完整 base64 音频，非真正的流式 chunk
  - 降级方案：若火山 TTS 不可用，可用浏览器端 SpeechSynthesis API 作为前端 TTS
```

### 3.7 前端音频播放

**借鉴：** VoiceChat_App 的 Audio 播放 + LiveKit 的 Barge-in

```
音频播放链路：
  WebSocket 接收 tts_audio chunk
    → 解码 base64 → AudioBuffer
    → 加入播放队列
    → Web Audio API 顺序播放

Barge-in 机制：
  VAD 检测到用户说话（且正在播放 TTS）
    → 停止当前播放
    → 清空播放队列
    → 通知后端取消当前 TTS 合成
```

### 3.8 成本控制策略（赛题要求的设计文档素材）

**借鉴：** StreamingVLM 的成本优化 + 调研报告的策略 1-5

| 策略 | 说明 | 来源 |
|------|------|------|
| VAD 触发式截图 | 只在用户说话时截图，不持续截图 | StreamingVLM |
| 低分辨率压缩 | 640×480 + JPEG 0.6，~30-50KB/帧 | 调研报告策略2 |
| 上下文裁剪 | 只保留最近 5 轮对话，图片只保留最新帧 | 调研报告策略4 |
| 模型分层 | 纯文本问题不传图片（需实现关键词检测） | 调研报告策略5 |
| 画面变化检测 | hash 对比，静止时不重复发送相同帧 | 调研报告策略1 |
| 全免费 API | 火山 ASR 20h + TTS 2万字符 + Agnes 免费 = ¥0 | topic1-reassessment |

---

## 四、用户故事（赛题要求的设计文档素材）

> 来源于调研文档 `research-topic1.md` 第六章，已适配我们的技术栈。

### 4.1 核心用户故事（MVP 必达）

| # | 用户故事 | 优先级 | 对应模块 |
|---|---------|--------|----------|
| 1 | 作为用户，我打开网页后能自动看到摄像头画面 | P0 | Camera 组件 |
| 2 | 作为用户，我说话后AI能听到并识别我的语音 | P0 | ASR Node |
| 3 | 作为用户，AI能描述它通过摄像头看到的画面内容 | P0 | VLM Node |
| 4 | 作为用户，AI能根据看到的内容回答我的问题 | P0 | VLM+LLM Node |
| 5 | 作为用户，AI的回复能以语音形式播放 | P0 | TTS Node |
| 6 | 作为用户，对话界面能同时显示文字和语音 | P1 | Chat UI |
| 7 | 作为用户，我可以用中文自然对话 | P0 | 全链路 |

### 4.2 加分用户故事（视时间决定）

| # | 用户故事 | 优先级 | 对应模块 |
|---|---------|--------|----------|
| 8 | 作为用户，AI能在我说话时自动检测并开始识别（无需按钮） | P1 | VAD |
| 9 | 作为用户，AI说话时我可以插话打断 | P1 | Barge-in |
| 10 | 作为用户，我能看到AI正在分析的画面帧 | P2 | 帧预览 |
| 11 | 作为用户，对话延迟在2秒以内 | P1 | 全链路优化 |
| 12 | 作为用户，我能看到实时的token消耗 | P2 | 成本面板 |

---

## 五、开发里程碑（72h）

### StubNode 模式（保证每个PR合并后 main 可运行）

> 比赛规则要求「PR合并后，主分支代码需保持可运行状态，评委在任意时间查看应能复现演示效果」。
> Pipeline 在部分 Node 未实现时，使用 StubNode 透传：
> - StubASRNode：收到音频后直接返回固定文本 `"(ASR stub) hello"`
> - StubVLMNode：收到文本后直接返回 `"(VLM stub) I see a camera feed"`
> - StubTTSNode：收到文本后返回空（不播放语音）
> - 每个真实 Node 实现后替换对应 StubNode，Pipeline 始终可运行

### Phase 1：基础搭建 + API 连通性验证（8h）

| # | 任务 | 估时 | 产出 |
|---|------|------|------|
| 1.1 | Python FastAPI 后端初始化 + WebSocket 端点 + CORS | 1h | 项目骨架 + ws 端点 + CORS配置 |
| 1.2 | Vite + React 前端初始化 + 基础页面 | 1h | 项目骨架 + 首页 |
| 1.3 | 前后端 WebSocket 连通测试 + StubNode 骨架 | 1h | 能收发 JSON，Pipeline 骨架可运行 |
| 1.4 | **火山 ASR 连通性测试（最高优先级）** | 2-4h | Python 能调通二进制协议；**4h 不通 → 切 Web Speech API** |
| 1.5 | **Agnes API 连通性测试**（✅已验证公网可达） | 0.5h | Python 能调通 Agnes Text（含图片） |
| 1.6 | **火山 TTS 连通性测试** | 1h | Python 能调通 TTS，返回音频 |
| 1.7 | 环境配置（.env、依赖安装） | 1.5h | requirements.txt + .env 模板 |

> Phase 1 目标：**三个外部 API 全部可通**。任何一个不通需要立即调整方案。
> **Go/No-Go 检查点**：
> - ASR: 4h 不通 → 切浏览器 Web Speech API（前端直接识别，跳过 ASR Node）
> - TTS: 不通 → 切浏览器 SpeechSynthesis API（前端直接合成语音）
> - Agnes: 不通 → 切其他免费 VLM API（需额外调研备选）

### Phase 4 补充：合规模板占位

> Phase 4.1 设计文档须包含以下结构（赛题要求）：
>
> **设计文档结构：**
> 1. 计划实现的用户故事 vs 最终实现对照表
> 2. 计划采用的成本控制技巧 vs 实际采用对照表
> 3. 第三方依赖清单（库名 + 用途 + 许可证）
> 4. 原创功能说明（哪些是自主设计，哪些借鉴了开源项目的思想）

### Phase 2：核心链路实现（20h）

| # | 任务 | 估时 | 产出 |
|---|------|------|------|
| 2.1 | 前端麦克风采集 + AudioWorklet PCM | 3h | 浏览器录音，16kHz mono PCM |
| 2.2 | 前端 VAD 语音活动检测 | 3h | 能检测说话开始/结束 |
| 2.3 | 前端摄像头 + Canvas 截图 base64 | 2h | 摄像头预览 + VAD 触发截图 |
| 2.4 | 后端 ASR Node 完整实现 | 4h | 前端音频 → 火山 ASR → 文字结果 |
| 2.5 | 后端 VLM+LLM Node 实现 | 3h | 文字+图片 → Agnes → 流式文本 |
| 2.6 | 后端 TTS Node 实现 | 2h | 文字 → 火山 TTS → 音频流 |
| 2.7 | Pipeline 编排器串联三节点 | 3h | 端到端跑通：说话 → 识别 → 理解 → 播放 |

### Phase 3：交互完善（12h）

| # | 任务 | 估时 | 产出 |
|---|------|------|------|
| 3.1 | 对话 UI（气泡、流式文字、状态指示） | 4h | 完整聊天界面 |
| 3.2 | 前端音频播放器（Web Audio API + 队列） | 2h | TTS 音频流畅播放 |
| 3.3 | Barge-in 打断机制 | 2h | 用户插话时停止 AI 播放 |
| 3.4 | 多轮对话 ContextManager | 2h | 保留最近 5 轮 |
| 3.5 | 自适应截图策略 | 2h | 画面变化检测 + VAD 触发 |

### Phase 4：打磨 + 提交（8h）

| # | 任务 | 估时 | 产出 |
|---|------|------|------|
| 4.1 | **设计文档**（用户故事计划vs实际 + 成本控制计划vs实际 + 依赖清单 + 原创说明） | 3h | 赛题要求 |
| 4.2 | Demo 视频录制（上传 bilibili，链接放 README） | 2h | 展示完整交互 |
| 4.3 | README（依赖说明 + 运行方式 + 原创功能 + 第三方依赖清单） | 1h | 评委可复现 |
| 4.4 | Bug 修复 + 体验打磨 | 2h | 最终检查 |

### 总计：~48h（含余量）

剩余 ~24h buffer：
- Phase 1 API 连通问题排查
- Phase 2 全链路联调超时
- 提前完成可加：S2S 端到端 / 线上部署 / 更多用户故事

---

## 七、项目目录结构（规划）

```
xengineer-frontend/          # 前端（Vite + React + TS）
├── src/
│   ├── components/          # UI 组件
│   │   ├── Camera.tsx       # 摄像头 + Canvas 截图
│   │   ├── AudioRecorder.tsx # 麦克风 + VAD
│   │   ├── AudioPlayer.tsx  # TTS 音频播放
│   │   ├── ChatBubble.tsx   # 对话气泡
│   │   └── StatusBar.tsx    # 连接状态/VAD指示
│   ├── hooks/               # 自定义 hooks
│   │   ├── useWebSocket.ts  # WebSocket 连接管理
│   │   ├── useVAD.ts        # 语音活动检测
│   │   └── useCamera.ts     # 摄像头管理
│   ├── lib/
│   │   ├── vad.ts           # VAD 算法（能量阈值）
│   │   └── protocol.ts      # 前后端消息协议定义
│   └── App.tsx
├── package.json
└── README.md

xengineer-backend/           # 后端（Python FastAPI）
├── app/
│   ├── main.py              # FastAPI 入口 + WebSocket 端点
│   ├── pipeline/
│   │   ├── orchestrator.py  # Pipeline 编排器
│   │   ├── base.py          # Node 基类（统一接口）
│   │   ├── asr_node.py      # ASR 节点（火山 Seed-ASR）
│   │   ├── vlm_node.py      # VLM+LLM 节点（Agnes Text）
│   │   └── tts_node.py      # TTS 节点（火山 TTS）
│   ├── services/
│   │   ├── volcengine_asr.py # 火山 ASR 二进制协议客户端
│   │   ├── volcengine_tts.py # 火山 TTS HTTP 客户端
│   │   └── agnes_client.py  # Agnes API 客户端
│   ├── managers/
│   │   ├── context.py       # 对话上下文管理
│   │   └── frame.py         # 帧选择策略
│   └── config.py            # 配置（从 .env 读取）
├── requirements.txt
├── .env.example
└── README.md
```

---

## 六、已确认决策项

| # | 问题 | 决策 | 理由 |
|---|------|------|------|
| 1 | ~~Agnes API 公网可达？~~ | ✅ 已确认可达（72ms） | 实测通过 |
| 2 | VAD 在前端做还是后端做？ | ✅ **前端** | LiveKit/Pipecat/VoiceChat_App 均在前端处理 VAD，降低后端复杂度，减少音频传输量 |
| 3 | 音频交互模式？ | ✅ **VAD 自动检测** | 所有成熟开源项目都用 VAD，push-to-talk 体验差，不适合"自然对话"赛题定位 |
| 4 | 前后端消息协议？ | ✅ **单 WS + JSON 消息类型** | 够用且简单，aiwebcam2 验证过此模式可行 |
| 5 | S2S 是否作为 MVP 后加分项？ | ✅ **是，MVP 不含** | S2S 不支持视觉输入是硬伤，MVP 先用级联方案（Agnes 直接收图），S2S 作为语音对话模式升级 |
| 6 | ASR 连不通怎么办？ | ✅ **4h 不通切 Web Speech API** | 浏览器原生 ASR，前端直接识别，跳过后端 ASR Node |
| 7 | 中间 PR 合并后 main 能跑吗？ | ✅ **StubNode 透传模式** | 比赛规则要求 PR 合并后 main 可运行，未实现的 Node 用 Stub 替代 |
| 8 | VAD 用什么方案？ | ✅ **@ricky0123/vad-web** | Silero VAD 的 WASM 封装，成熟稳定，npm 直接安装 |
| 9 | Python HTTP/WebSocket 库？ | ✅ **httpx + websockets** | httpx 支持 async + SSE；websockets 是 asyncio 原生 WS 客户端 |
| 10 | PCM 格式要求？ | ✅ **Int16, 16kHz, mono** | 前端 AudioContext 强制 sampleRate:16000，Float32→Int16 转换 |

> 所有决策项已确认，计划状态：**开发就绪（审查通过）**。
> 审查报告：`plans/devplan-review-report.md`
