# 题目一开发计划：AI 视觉对话助手 — 风险讨论与决策

> 选题已确认：题目一（AI视觉对话助手）
> 状态：**讨论中** — 逐项确认后进入开发
> 评估基础：`plans/topic1-reassessment.md`

---

## 一、核心架构回顾

```
用户说话（麦克风）→ 浏览器采集 PCM → WebSocket → 后端
                                                    ↓
用户画面（摄像头）→ 浏览器截图 → base64 → 后端 → Agnes VLM 理解
                                                    ↓
后端 ASR 转文字 → Agnes LLM（+视觉上下文）生成回复 → 火山 TTS 合成语音
                                                    ↓
                                              WebSocket → 前端播放
```

---

## 二、需讨论决策的风险项

### 2.1 🔴 后端方案：Python vs Node.js

**问题：** 前后端需要 WebSocket 通信，后端需要中转火山 ASR/S2S 的二进制 WebSocket 协议。

| 方案 | 优势 | 劣势 |
|------|------|------|
| **Python FastAPI** | 火山官方 Demo 是 Python，可直接复用；`websockets` 库成熟 | 需要单独部署后端服务；前后端分离增加部署复杂度 |
| **Node.js (Next.js API Routes)** | 前后端一体，部署简单（Vercel 一个地方搞定） | 火山无官方 Node.js SDK，二进制协议需从零实现；Vercel Serverless 有 WebSocket 限制 |
| **Node.js 独立后端** | 可以用 `ws` 库实现 WebSocket 中转 | 同样需要从零实现二进制协议，且需要单独部署 |

**子代理推荐：** Python FastAPI（因为火山官方 Demo 直接可用）

**我的补充顾虑：**
- Python 后端意味着要维护两个服务（前端 + 后端），部署复杂度翻倍
- 如果用 z-ai-web-dev-sdk 自带的 ASR（平台内置，黑盒但零配置），就可以完全用 Node.js，不需要 Python
- 但 z-ai-web-dev-sdk 的 ASR 质量 vs 火山 Seed-ASR 2.0 质量，差距有多大？

**待决策：** 选 Python 后端（火山 ASR）还是 Node.js 后端（z-ai-web-dev-sdk ASR）？

---

### 2.2 🔴 火山 ASR 二进制协议实现

**问题：** 火山 Seed-ASR 2.0 使用二进制 WebSocket 协议（4字节 header + 大端序 payload），浏览器无法直连，必须后端中转。

**具体挑战：**
- 4 字节 header：前 2 字节 payload 长度（大端序），后 2 字节预留
- 音频需要 Gzip 压缩后发送
- 需要实现完整的对话状态机（发送音频→接收中间结果→接收最终结果）
- 二遍识别模式（enable_nonstream=true）：先快速出结果，再出精确结果

**如果选 Python：** 可以直接基于官方 Demo 改造，工作量约 6h
**如果选 Node.js：** 需要从零实现，工作量约 10-12h，且有调试风险

**待决策：** 这直接取决于 2.1 的后端选型

---

### 2.3 🟡 部署方案

**问题：** 比赛要求公开仓库 + demo 视频 + README（含依赖说明），但没有说必须在线可访问。

| 方案 | 说明 | 复杂度 |
|------|------|--------|
| **本地运行 + 录屏 Demo** | 不部署，本地跑通后录视频提交 | 最低 |
| **ngrok 暴露本地服务** | 本地运行，ngrok 给一个公网 URL，可以远程演示 | 低 |
| **Vercel (前端) + Railway (Python后端)** | 前后端分开部署，公网可访问 | 高 |
| **Vercel (前端+API Routes)** | 如果选 Node.js 且不用火山二进制协议，可以全部部署在 Vercel | 中 |

**我的建议：** 优先确保本地能跑通 + 录 Demo 视频。如果有时间再部署。部署不是评分重点，功能完整度才是。

**待决策：** 是否需要在线部署？还是本地 Demo + 录屏即可？

---

### 2.4 🟡 TTS 方案：火山 TTS vs 浏览器内置

**问题：** 火山 TTS 2.0 音色丰富（50+），但需要后端调用 API。浏览器内置 `SpeechSynthesis` 零配置。

| 方案 | 优势 | 劣势 |
|------|------|------|
| **火山 TTS 2.0 HTTP** | 50+ 音色、情感变化、音质好 | 需要后端 API 调用；HTTP 流式需要后端中转到前端 |
| **浏览器 SpeechSynthesis** | 零配置、零延迟、无需后端 | 音色固定（取决于浏览器/OS），音质一般，无情感控制 |
| **z-ai-web-dev-sdk TTS** | 平台内置，后端一行代码，voice='tongtong' | 音色单一（tongtong），之前 VoiceChat_App 已验证可用 |

**我的建议：** MVP 用 z-ai-web-dev-sdk TTS（已验证可用，一行代码搞定），如果有时间再换火山 TTS 提升音质。这样后端可以统一用 Node.js，不需要为了 TTS 单独走火山 API。

**待决策：** TTS 选哪个？这影响后端是否需要 Python。

---

### 2.5 🟡 前端框架：Vite + React vs Next.js

**问题：** 子代理推荐 Vite + React，但我们平台默认是 Next.js。

| 方案 | 优势 | 劣势 |
|------|------|------|
| **Vite + React** | 纯 SPA，WebSocket 连接简单；Vite 构建快 | 需要单独部署；不用 Next.js 的 SSR/API Routes |
| **Next.js** | 平台默认；API Routes 可以做后端；Vercel 一键部署 | WebSocket 在 API Routes 中有限制（Serverless 不支持长连接） |
| **Next.js + 独立 WebSocket 服务** | 前端 Next.js，WebSocket 服务单独跑 | 增加复杂度 |

**如果后端选 Python FastAPI：** 前端用 Vite + React 更简单（纯 SPA + WebSocket 客户端）
**如果后端选 Node.js：** Next.js API Routes 不能做 WebSocket 长连接，要么独立 Node.js WebSocket 服务，要么直接 Vite

**待决策：** 取决于后端选型

---

### 2.6 🟡 摄像头截图策略

**问题：** Agnes VLM 支持图片 base64 输入，但怎么决定何时截图？

| 策略 | 说明 |
|------|------|
| **触发式** | 用户开始说话时截一帧（VAD 检测到语音开始） |
| **周期式** | 每隔 N 秒自动截一帧 |
| **关键词触发** | AI 检测到"看看""这是什么"等视觉相关词汇时截图 |
| **每轮都截** | 每次用户说话都截图发给 VLM |

**我的建议：** MVP 用"每轮都截"（最简单，用户说话就截图），后续优化为"关键词触发 + 触发式"混合。成本控制靠低分辨率（640×480 JPEG quality 0.6）和上下文裁剪（只保留最近 5 轮图片）。

**待决策：** 还是直接用最简单的方案？

---

### 2.7 🟢 S2S 端到端语音（加分项）

**问题：** S2S 延迟最低（<500ms）且超拟人，但：
- 文档明确说"暂不支持视觉理解能力"
- 二进制协议最复杂（比 ASR 还复杂）
- 鉴权方式与 TTS 不同（App ID + Access Token 而非 x-api-key）

**我的建议：** MVP 完全不做 S2S。如果 MVP 提前完成（52h 内搞完），再考虑加入。S2S 作为纯语音对话模式的备选（不含视觉理解），展示语音体验的上限。

**待决策：** 同意 MVP 不含 S2S 吗？

---

### 2.8 🟢 评审维度对齐

比赛评审标准（来自 competition-rules.md）：

| 维度 | 占比 | 我们的优势 |
|------|------|-----------|
| 完整度 | 40% | 摄像头+麦克风+视觉理解+语音回复 = 全链路 |
| 开发质量 | 40% | GitHub Flow + PR 细粒度 + 模块化架构 |
| 演示效果 | 20% | 视觉对话 demo 天然有冲击力 |

**赛题额外要求：** 设计文档（用户故事 + 成本控制），这部分我们素材充足。

---

## 三、关键依赖关系

```
后端选型 (2.1)
  ├─→ 决定 ASR 方案 (2.2)
  ├─→ 影响 TTS 方案 (2.4)
  ├─→ 影响前端框架 (2.5)
  └─→ 影响部署方案 (2.3)

S2S (2.7) 独立于 MVP，可延后
截图策略 (2.6) 独立于架构，可后期调整
```

**核心决策就是 2.1（后端选型）**，它决定了后面大部分方案。

---

## 四、两个完整方案对比

### 方案 A：Python 后端 + 火山全链路（子代理推荐）

```
前端: Vite + React + TypeScript + TailwindCSS
后端: Python FastAPI + websockets
ASR:  火山 Seed-ASR 2.0（官方 Demo 改造）
VLM:  Agnes Text（base64 图片）
TTS:  火山 TTS 2.0 HTTP
部署: Vercel(前端) + Railway/Fly.io(后端) 或本地 + ngrok
```

- 优势：语音质量最高（火山 ASR + TTS），官方 Demo 可复用
- 劣势：两个服务、Python 后端部署、二进制协议调试
- 工作量：~52h（MVP）

### 方案 B：Node.js 一体化 + z-ai-web-dev-sdk（简化方案）

```
前端: Vite + React + TypeScript + TailwindCSS
后端: Node.js + ws 库（WebSocket 服务）
ASR:  z-ai-web-dev-sdk ASR（平台内置，已验证可用）
VLM:  Agnes Text（base64 图片）
TTS:  z-ai-web-dev-sdk TTS（voice='tongtong'，已验证可用）
部署: 单服务，或 Vercel(前端) + 任意(Node后端)
```

- 优势：ASR/TTS 已验证可用，无需二进制协议，开发速度快
- 劣势：语音质量不如火山（ASR 质量、TTS 音色单一）
- 工作量：~35-40h（MVP），省出 12-17h 做打磨

---

## 五、待你确认的决策项

1. **后端选型**：方案 A（Python + 火山）还是方案 B（Node.js + z-ai-web-dev-sdk）？
2. **部署需求**：必须在线可访问，还是本地 Demo + 录屏即可？
3. **S2S**：MVP 是否排除？
4. **截图策略**：用最简单的"每轮都截"？
5. **TTS**（如果选方案 A）：火山 TTS 还是 z-ai-web-dev-sdk TTS？

> 请在文件中或聊天中逐项回复，确认后我会更新此文档并进入开发阶段。
