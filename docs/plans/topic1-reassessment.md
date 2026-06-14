# 题目一重新评估：AI 视觉对话助手（火山引擎 API 加持版）

> 评估时间：2026-06-14
> 基于火山引擎完整 API 文档的可行性重新评估

---

## 一、赛题核心要求回顾

1. **核心功能**：打开摄像头与麦克风，AI 能**看到**摄像头内容、**听到**用户语音，并**恰当回应**
2. **评审维度**（权重）：
   - 作品完整度与创新性 40% — 产品设计、功能完整度、交互流畅度、新颖度
   - 开发过程与质量 40% — 架构清晰度、代码健壮度、PR 质量
   - 演示与表达 20% — demo 视频清晰完整
3. **额外交付物**：设计文档，包含 ① 计划实现 vs 最终实现的用户故事；② 成本控制技巧
4. **红线**：全周期持续交付、不可抄袭、不可尾日突击提交

**关键解读**：赛题强调"视觉理解准确性 + 语音交互自然度与流畅性 + 端云协同成本控制"三者的**综合考量**。不是拼单一指标，而是拼综合体验。

---

## 二、火山引擎 API 对题目一的价值分析

### 2.1 ASR 流式语音识别（Seed-ASR）

**文档来源**：`seed-asr-streaming.md`

**核心价值**：替代之前调研中的 Web Speech API / NVIDIA parakeet-ctc / FunASR，提供生产级中文 ASR 能力。

**关键技术细节**：

| 特性 | 详情 |
|------|------|
| **接口地址** | `wss://openspeech.bytedance.com/api/v3/sauc/bigmodel`（双向流式） |
| **推荐模式** | 双向流式优化版 `bigmodel_async` — 仅当结果变化时返回，RTF 和首字/尾字时延均有提升 |
| **音频要求** | PCM/WAV/OGG/MP3，采样率 16000Hz，单声道，16bit |
| **分包策略** | 每包 100~200ms，发包间隔 100~200ms；双向流式 200ms 最优 |
| **延迟表现** | 流式输入模式 5s 音频可做到 **300~400ms** 返回；双向流式更快 |
| **VAD 判停** | 默认 800ms，可通过 `end_window_size` 配置（最小 200ms） |
| **二遍识别** | `enable_nonstream: true` — 双向流式实时返回 + 分句后 nostream 精校 |
| **协议** | **二进制帧协议**（4 字节 header + payload），非 JSON 文本帧 |
| **鉴权** | 新版：`X-Api-Key` header；旧版：`X-Api-App-Key` + `X-Api-Access-Key` |
| **免费额度** | 20 小时（半年有效） |

**对题目一的价值**：
- ✅ 300~400ms 延迟满足实时对话要求
- ✅ 二遍识别模式兼顾速度与准确率
- ⚠️ **二进制协议** — 前端浏览器无法直接解析，必须通过后端中转。这是一个重要的架构约束
- ⚠️ 上下文传图能力（`image_url` 在 `context_data` 中）仅限 ASR 2.0 模型 + 流式输入模式，且只支持 1 张图片 ≤500k，**无法用于 S2S 模型**

### 2.2 S2S 端到端语音大模型

**文档来源**：`speech-to-speech.md`

**核心价值**：将 ASR→LLM→TTS 三段式压缩为一次调用，大幅降低语音链路延迟，提供超拟人对话体验。

**关键技术细节**：

| 特性 | 详情 |
|------|------|
| **接口地址** | `wss://openspeech.bytedance.com/api/v3/realtime/dialogue` |
| **模型版本** | O2.0（`1.2.1.1`）— 通用低延迟；SC2.0（`2.2.0.0`）— 角色扮演 |
| **音色** | O2.0：vv/xiaohe/yunzhou/xiaotian + 3 个英文音色；SC2.0：克隆音色 |
| **音频输入** | PCM（16kHz, int16, 单声道, 小端序）或 Opus 格式 |
| **推荐发包** | **20ms 一包** |
| **音频输出** | 默认 OGG Opus；可配置 PCM 24000Hz 32bit/16bit |
| **VAD** | 服务端 VAD（server_vad 模式），`end_smooth_window_ms` 默认 1500ms，范围 [500ms, 50s] |
| **打断支持** | ✅ 内置，ASRInfo 事件通知客户端可打断 |
| **上下文** | `dialog_context` 预设 + `ConversationCreate` 追加（最多 20 轮） |
| **联网搜索** | ✅ 可选开启，需开通搜索 API |
| **协议** | **二进制帧协议**（4 字节 header + optional + payload size + payload） |
| **鉴权** | `X-Api-App-ID` + `X-Api-Access-Key` + `X-Api-Resource-Id: volc.speech.dialog` |
| **限流** | 60 QPM（StartSession）+ 10 万 TPM |
| **免费额度** | 100 万 token（不区分输入输出，半年有效） |
| **计费** | 后付费按 token 计费，不支持预付费资源包 |

**关键事件流**：
```
客户端                           服务端
  |── StartConnection ──────────▶ ConnectionStarted
  |── StartSession ─────────────▶ SessionStarted (返回 dialog_id)
  |── TaskRequest(音频) ────────▶ ASRInfo (首字) → ASRResponse (文本)
  |                              ASREnded → TTSSentenceStart → TTSResponse(音频) → TTSSentenceEnd → TTSEnded
  |── FinishSession ────────────▶ SessionFinished
```

**对题目一的价值**：
- ✅ **超低延迟** — 端到端处理，类比真人交互节奏，这是最大的加分项
- ✅ **超拟人** — 语气/用语/情感表达远超级联方案
- ✅ **打断支持** — ASRInfo 事件 + 内置 VAD，用户可随时打断
- ✅ **支持文本输入** — `input_mod: "text"` + `ChatTextQuery` 事件
- ✅ **支持外部文本合成** — `ChatTTSText` 事件可注入自定义文本让 S2S 模型合成语音
- ✅ **支持 RAG 注入** — `ChatRAGText` 事件（≤4K 字符）
- ✅ **对话上下文管理** — ConversationCreate/Update/Truncate/Delete
- ❌ **不支持视觉输入** — realtime-conversation.md 明确写"暂时不支持视觉理解能力"
- ❌ **二进制协议** — 浏览器无法直接连接，必须后端中转
- ⚠️ 鉴权需要 App ID + Access Token（旧版控制台），新版 x-api-key 方式在 S2S 接口文档中未明确提及

### 2.3 TTS 语音合成

**文档来源**：`tts-http-streaming.md` / `tts-websocket-streaming.md`

**两条链路**：

| 方案 | 接口 | 特点 | 适用场景 |
|------|------|------|---------|
| HTTP Chunked | `POST https://openspeech.bytedance.com/api/v3/tts/unidirection` | 一次性输入文本，流式返回音频，实现最简 | 级联方案（ASR→LLM→TTS） |
| WebSocket 双向 | `wss://openspeech.bytedance.com/api/v3/tts/bidirection` | 文本流式输入 + 音频流式输出，延迟更低 | 级联方案（需要逐句合成） |

**TTS 音频格式**：支持 `mp3` / `pcm` / `ogg_opus` / `wav`，**流式场景推荐 pcm**，不建议 wav。

**模型版本**：
- `seed-tts-2.0-standard` — 标准版，时延更低，不支持语音指令
- `seed-tts-2.0-expressive` — 高表现力，支持 `context_texts` 语音指令和 `use_tag_parser` 标签，但稳定性有波动

**TTS WebSocket 双向流式 9 种事件**：
```
请求端：StartConnection → StartSession → TaskRequest → CancelSession → FinishSession → FinishConnection
响应端：ConnectionStarted/Failed → SessionStarted/Finished/Failed/Cancelled →
        TTSSentenceStart → TTSResponse → TTSSentenceEnd → TTSSubtitle → ConnectionFinished
```

**对题目一的价值**：
- ✅ HTTP 接口实现最简（级联方案备选），`X-Api-Key` 鉴权方便
- ✅ WebSocket 双向流式可实现 LLM 逐句输出 → TTS 逐句合成的低延迟链路
- ✅ 50+ 音色可选，对话助手场景选音空间大
- ⚠️ WebSocket TTS 也是二进制帧协议（与 ASR 同一套），需要后端处理

### 2.4 TTS 音色选择

**文档来源**：`tts-voices-params.md`

**适合 AI 对话助手的音色推荐**：

| 推荐场景 | 音色名称 | voice_type | 特点 |
|---------|---------|-----------|------|
| **首选-通用女声** | Vivi 2.0 | `zh_female_vv_uranus_bigtts` | 活泼灵动，支持多语种（中/日/印尼/西班牙），情感变化+指令遵循，**与 S2S O2.0 默认音色一致** |
| 通用男声 | 云舟 2.0 | `zh_male_m191_uranus_bigtts` | 清爽沉稳，情感变化+指令遵循 |
| 知性女声 | 知性灿灿 2.0 | `zh_female_cancan_uranus_bigtts` | 适合"专业助手"人设 |
| 甜美女声 | 小何 2.0 | `zh_female_xiaohe_uranus_bigtts` | 台湾口音，适合轻松场景 |
| 教育场景 | Tina老师 2.0 | `zh_female_yingyujiaoxue_uranus_bigtts` | 中英双语 |
| 客服场景 | 暖阳女声 2.0 | `zh_female_kefunvsheng_uranus_bigtts` | 温暖亲切 |
| 英文 | Tim / Dacey / Stokie | `en_male_tim_uranus_bigtts` 等 | 美式英语 |

**所有 TTS 2.0 音色均支持**：情感变化、指令遵循（`context_texts`）、ASMR。这比之前调研中的 Edge-TTS（无情感变化）有明显优势。

### 2.5 鉴权方式

**文档来源**：`auth-guide.md`

**关键发现**：
- **新接口（TTS HTTP、TTS WebSocket）**：仅需 `X-Api-Key: ${your-api-key}` — **极简，类似 OpenAI 风格**
- **旧接口（ASR WebSocket、S2S WebSocket）**：需要 `X-Api-App-Key` + `X-Api-Access-Key` + `X-Api-Resource-Id` — **更复杂**
- **S2S 接口**：文档中使用 `X-Api-App-ID` + `X-Api-Access-Key` + `X-Api-Resource-Id: volc.speech.dialog` + `X-Api-App-Key` — 最复杂

**前端直连可行性分析**：
- ❌ **ASR 和 S2S**：使用二进制帧协议，浏览器 JavaScript 无法直接构造这种二进制 WebSocket 帧（需要手动打包 4 字节 header + payload），虽然技术上可行（用 ArrayBuffer），但开发成本高
- ❌ **TTS WebSocket**：同样是二进制帧协议
- ⚠️ **TTS HTTP**：理论上可以前端直连（标准 HTTP POST），但 `X-Api-Key` 暴露在前端不安全
- ✅ **结论**：所有火山引擎 API 调用应通过后端中转，前端只与自己的后端通信

---

## 三、技术方案设计

### 3.1 整体架构

**推荐架构：后端中转 + 双链路并行**

```
┌──────────────────────────────────────────────────────────┐
│                    前端（浏览器）                          │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │ 摄像头    │  │ 麦克风    │  │  播放器 + UI          │  │
│  │ getUser  │  │ getUser  │  │  - TTS 音频播放        │  │
│  │ Media()  │  │ Media()  │  │  - 对话文字气泡        │  │
│  └────┬─────┘  └────┬─────┘  │  - 摄像头预览          │  │
│       │              │        │  - 成本/Token 显示      │  │
│       │              │        └───────────┬───────────┘  │
│       │         Canvas截图                   │           │
│       │         (定时/触发)                  │           │
│       ▼              ▼                       │           │
│  ┌────────────────────────────────────────────────┐     │
│  │         WebSocket (与后端通信)                   │     │
│  │  发送: 音频帧 / 视频帧(base64)                  │     │
│  │  接收: TTS音频(base64/pcm) / 对话文本            │     │
│  └────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────┘
                            │
                            │ WebSocket
                            ▼
┌──────────────────────────────────────────────────────────┐
│                    后端（Node.js / Python）                │
│                                                          │
│  ┌───────────────┐     ┌────────────────────────────┐   │
│  │ 视觉理解模块   │     │ 语音对话模块                 │   │
│  │               │     │                            │   │
│  │ Agnes Text    │     │ ┌────────────────────────┐ │   │
│  │ (agnes-2.0-   │     │ │ 方案A: 级联三段式       │ │   │
│  │  flash)       │     │ │ 火山ASR → Agnes LLM   │ │   │
│  │               │     │ │ → 火山TTS             │ │   │
│  │ 截图 → base64 │     │ └────────────────────────┘ │   │
│  │ → VLM 理解    │     │ ┌────────────────────────┐ │   │
│  │ → 文本描述    │     │ │ 方案B: S2S 端到端       │ │   │
│  │               │     │ │ 火山S2S → 语音输出     │ │   │
│  └───────┬───────┘     │ │ (视觉上下文通过        │ │   │
│          │             │ │  ChatRAGText注入)      │ │   │
│          │ 视觉上下文   │ └────────────────────────┘ │   │
│          ▼             └────────────┬───────────────┘   │
│  ┌─────────────────────────────────────────────────┐    │
│  │           对话协调器（状态机）                      │    │
│  │  - 管理视觉上下文缓存                              │    │
│  │  - 决策：纯文本回复 vs 需要视觉理解                  │    │
│  │  - 将视觉描述注入语音对话上下文                     │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 3.2 语音链路方案对比

#### 方案 A：传统级联（火山 ASR → Agnes LLM → 火山 TTS）

```
用户语音 → [浏览器: PCM采集] → [后端: 火山ASR WebSocket] → 文本
    → [后端: Agnes Text API (带图片)] → 回复文本
    → [后端: 火山TTS HTTP/WebSocket] → 音频 → [浏览器: 播放]
```

**优势**：
- Agnes LLM 可以直接接收图片（base64），**视觉理解与文本对话在同一轮 API 调用中完成** — 这是最大优势
- 全程免费（Agnes 免费）+ 火山免费额度（ASR 20h + TTS 2 万字符）
- LLM 输出可控（system prompt、function calling、JSON 输出）
- 技术实现最直接，每个环节独立调试

**劣势**：
- 延迟累加：ASR(300ms) + LLM(500-2000ms) + TTS(300ms) = **1.1-2.6s**
- 语音表现力受限（TTS 级联不如 S2S 端到端拟人）
- 不支持打断（需自行实现 VAD + 中断逻辑）

#### 方案 B：S2S 端到端 + Agnes 视觉理解

```
用户语音 → [浏览器: PCM采集] → [后端: 火山S2S WebSocket] → 语音回复
    同时:
摄像头 → [浏览器: 截图] → [后端: Agnes Text API] → 视觉描述文本
    → [后端: S2S ChatRAGText 事件] → 注入视觉上下文 → S2S 合成含视觉信息的语音回复
```

**优势**：
- **超低延迟**：语音对话部分 < 500ms，接近真人节奏
- **超拟人**：情感表达、语气、节奏远超级联方案
- 内置 VAD + 打断支持（ASRInfo 事件）
- 视觉理解通过 ChatRAGText 注入，不占用 S2S 模型的推理链路

**劣势**：
- **S2S 不支持视觉输入**（文档明确说"暂时不支持视觉理解能力"），视觉理解只能旁路注入
- ChatRAGText 限制 ≤4K 字符，且是一次性注入，不是实时
- S2S 二进制协议实现复杂度最高
- S2S 鉴权复杂（App ID + Access Token），且按 token 后付费
- 视觉理解与语音回复的时序协调需要精心设计（先等 VLM 返回，再注入 S2S）
- S2S 免费额度仅 100 万 token，比级联方案少

#### 方案 C（推荐）：混合架构

```
┌─────────────────────────────────────────────────────────┐
│                    混合策略决策                           │
│                                                         │
│  用户说话 ──▶ VAD 判停 ──▶ ASR 文本 ──▶ 意图分类        │
│                                          │              │
│                              ┌───────────┴──────────┐   │
│                              ▼                      ▼   │
│                     需要视觉理解              纯文本闲聊   │
│                              │                      │   │
│                     截图→Agnes VLM→描述       直接走 S2S │
│                              │                      │   │
│                              └──────┬───────────────┘   │
│                                     ▼                    │
│                              Agnes Text (全量)          │
│                              (对话+视觉上下文)           │
│                                     │                    │
│                                     ▼                    │
│                              火山 TTS → 播放            │
└─────────────────────────────────────────────────────────┘
```

**实际推荐：方案 A（级联三段式）作为 MVP，S2S 作为加分项**

**理由**：
1. **视觉理解是题目一的核心差异化能力**，方案 A 让 Agnes 直接接收图片做推理，一条 API 调用同时处理视觉+文本
2. 方案 B 的 S2S 无法接收图片，视觉信息只能通过 ChatRAGText 文本旁注注入，S2S 模型无法"真正看到"画面
3. 72 小时内实现级联方案更稳妥，S2S 二进制协议调试成本高
4. 可以在级联方案稳定后，将 S2S 作为"语音对话模式切换"功能加入

### 3.3 视觉理解方案

**核心方案：Agnes Text (agnes-2.0-flash) + Canvas 截图**

**Agnes 能力确认**（来自 model-selection.md）：
- ✅ 支持图片理解（`image_url` 类型，支持 base64 data URI）
- ✅ 256K 上下文，65.5K 最大输出
- ✅ 免费
- ❌ 不支持视频流理解（只能通过截图模拟）

**截图频率策略**：

| 策略 | 频率 | 适用场景 | 成本影响 |
|------|------|---------|---------|
| **触发式截图** | 用户说话时 | MVP 首选 | 最低 |
| 定时截图 | 每 2-3 秒 | 画面持续变化 | 中等 |
| 自适应截图 | 画面变化 > 阈值 | 智能场景 | 较低 |

**MVP 推荐策略：触发式截图**
- 当 ASR 检测到用户说话结束时（`definite: true`），立即截取当前帧
- 将截图 base64 + ASR 文本一起发送给 Agnes
- 无需持续截图，成本最低

**实现关键点**：
```javascript
// 前端：低分辨率 JPEG 截图，控制 token 消耗
canvas.width = 640;
canvas.height = 480;
const base64 = canvas.toDataURL('image/jpeg', 0.6);  // ~30-50KB
```

**Agnes API 调用示例**：
```json
{
  "model": "agnes-2.0-flash",
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "我手里拿的是什么？"},
        {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,/9j/4AAQ..."}}
      ]
    }
  ]
}
```

### 3.4 成本控制策略

赛题**明确要求**提交成本控制设计文档，这是评审的一环。

#### 3.4.1 各环节成本分析

| 环节 | 服务 | 免费额度 | 后付费价格 | 72h 预估用量 | 72h 预估成本 |
|------|------|---------|-----------|-------------|-------------|
| ASR | 火山 Seed-ASR 2.0 | **20 小时** | 0.9 元/小时 | ~2-5 小时有效语音 | **¥0（在免费额度内）** |
| VLM+LLM | Agnes Text | **免费** | — | ~100-200 次调用 | **¥0** |
| TTS | 火山 TTS 2.0 | **2 万字符** | 2.8 元/万字符起 | ~5000-10000 字符 | **¥0（在免费额度内）** |
| S2S（可选） | 火山 S2S | **100 万 token** | 按 token 计费 | ~10-50 万 token | **¥0（在免费额度内）** |

**结论：72 小时 Hackathon 期间，所有服务的免费额度完全足够，实际 API 成本为 ¥0。**

#### 3.4.2 成本控制设计（写入设计文档的素材）

1. **触发式截图**：仅在用户说话时截图，而非持续截图，减少 VLM 调用
2. **低分辨率压缩**：640×480 + JPEG 质量 0.6，单帧 ~30-50KB，控制 base64 传输量和 VLM token 消耗
3. **上下文裁剪**：对话历史只保留最近 5 轮，每轮只保留最新一帧图片，避免 token 膨胀
4. **模型分层**：纯文本问答不附带图片（省视觉 token）；只有视觉相关问题时才传图
5. **火山引擎免费额度优先**：ASR 用免费 20h，TTS 用免费 2 万字符，S2S 用免费 100 万 token
6. **Agnes 免费**：视觉理解和文本对话全程使用 Agnes（免费），零成本
7. **TTS 缓存**：常见回复（如"你好"）可缓存音频，避免重复合成

---

## 四、开发工作量估算

### 4.1 功能模块拆解（72 小时）

| 模块 | 子任务 | 估时 | 优先级 |
|------|-------|------|--------|
| **前端基础** | 项目初始化（Next.js / Vite） | 1h | P0 |
| | 摄像头采集 + 预览 | 2h | P0 |
| | 麦克风采集 + PCM 音频处理 | 3h | P0 |
| | Canvas 截图 + base64 | 2h | P0 |
| | WebSocket 通信（前后端） | 3h | P0 |
| | 对话 UI（气泡、状态指示） | 4h | P0 |
| | TTS 音频播放器（队列、打断） | 3h | P1 |
| **后端基础** | 项目初始化（Node.js / Python） | 1h | P0 |
| | WebSocket 服务端 | 2h | P0 |
| | 状态管理（会话、对话历史） | 2h | P0 |
| **ASR 模块** | 火山 ASR WebSocket 二进制协议实现 | 6h | P0 |
| | 音频格式转换（浏览器 PCM → ASR 要求） | 2h | P0 |
| | VAD 判停处理 + 结果回调 | 3h | P0 |
| **VLM+LLM 模块** | Agnes Text API 集成（含图片） | 2h | P0 |
| | 对话上下文管理 | 3h | P0 |
| | System Prompt 优化 | 2h | P1 |
| **TTS 模块** | 火山 TTS HTTP 接口集成 | 2h | P0 |
| | 流式音频传输 + 前端播放 | 3h | P1 |
| **S2S 模块（加分）** | 火山 S2S WebSocket 二进制协议实现 | 8h | P2 |
| | S2S 事件处理（StartSession/TaskRequest/TTSResponse 等） | 4h | P2 |
| | ChatRAGText 视觉上下文注入 | 3h | P2 |
| **集成联调** | 全链路联调（ASR→LLM→TTS） | 4h | P0 |
| | 视觉链路联调（截图→VLM→回复） | 3h | P0 |
| **设计文档** | 用户故事 + 成本控制文档 | 3h | P0 |
| **Demo 视频** | 录制 + 剪辑 | 2h | P0 |
| **合计（MVP）** | 不含 S2S | **~52h** | |
| **合计（含 S2S）** | | **~70h** | |

### 4.2 MVP 定义（72h 内必达）

1. ✅ 打开摄像头，显示实时画面
2. ✅ 打开麦克风，说话后 ASR 实时转文字
3. ✅ 用户说话时自动截图，Agnes VLM 理解画面内容
4. ✅ Agnes 生成回复文本（结合视觉+语音输入）
5. ✅ 火山 TTS 将回复转为语音播放
6. ✅ 对话 UI 显示文字 + 播放语音
7. ✅ 多轮对话记忆
8. ✅ 设计文档（用户故事 + 成本控制）

### 4.3 加分项（视时间决定）

- 🔲 S2S 端到端语音对话模式（语音链路升级）
- 🔲 对话模式切换（级联 vs S2S）
- 🔲 实时 token/成本显示面板
- 🔲 移动端适配

---

## 五、风险与难点

### 5.1 技术风险

| 风险 | 严重度 | 应对方案 |
|------|--------|---------|
| **火山 ASR 二进制协议调试** | 🔴 高 | 参考官方 Python/Go Demo（文档提供了下载链接），优先用 Python 后端（有官方 SDK 支持） |
| **浏览器 PCM 采集与 ASR 格式对齐** | 🟡 中 | 使用 `AudioContext` + `ScriptProcessorNode`/`AudioWorklet` 采集 16kHz PCM，通过 WebSocket 发给后端 |
| **Agnes VLM 响应延迟** | 🟡 中 | 触发式截图（非持续），Agnes 本身响应较快（流式输出） |
| **TTS 音频播放流畅度** | 🟡 中 | 使用 Web Audio API + AudioBuffer 队列，实现无缝拼接 |
| **S2S 二进制协议复杂度** | 🔴 高 | 仅在 MVP 完成后考虑，且 S2S 非必需 |

### 5.2 时间风险

| 风险 | 严重度 | 应对方案 |
|------|--------|---------|
| **二进制协议实现耗时超预期** | 🔴 高 | 优先使用 Python 后端 + 火山官方 Demo 代码改造，而非从零实现 |
| **全链路联调问题多** | 🟡 中 | 每个 API 模块独立测试通过后再集成，建立 mock 测试 |
| **设计文档和 Demo 视频挤占开发时间** | 🟡 中 | 设计文档在开发过程中同步写，Demo 视频留 2h |

### 5.3 部署风险

| 风险 | 严重度 | 应对方案 |
|------|--------|---------|
| **后端服务部署** | 🟢 低 | 使用 Vercel/Railway/Fly.io 等快速部署，或使用 ngrok 暴露本地服务 |
| **浏览器兼容性** | 🟢 低 | 仅支持 Chrome/Edge（getUserMedia + WebSocket 兼容性好） |
| **火山引擎 API Key 安全** | 🟢 低 | 所有 API 调用走后端，Key 不暴露在前端 |

---

## 六、结论与建议

### 6.1 可行性评分

**8/10** — 高度可行，火山引擎 API 显著提升了语音链路质量。

### 6.2 火山引擎带来的核心提升

| 维度 | 无火山引擎（之前调研方案） | 有火山引擎 |
|------|------------------------|----------|
| ASR 质量 | Web Speech API（浏览器内置，质量一般）或 NVIDIA 批量 ASR（延迟高） | Seed-ASR 2.0 流式，300~400ms，支持中英日+方言，二遍识别 |
| TTS 质量 | Edge-TTS（免费但无情感变化） | TTS 2.0（50+ 音色，情感变化+指令遵循+ASMR） |
| 语音体验上限 | 级联方案，1-3s 延迟 | S2S 端到端，<500ms，超拟人 |
| 免费额度 | Agnes 免费 + NVIDIA 免费 | 上述 + ASR 20h + TTS 2 万字符 + S2S 100 万 token |

### 6.3 推荐技术选型（最终版）

```
前端：  Vite + React + TypeScript + TailwindCSS
后端：  Python FastAPI（火山 ASR/S2S 官方 Demo 为 Python）
ASR：   火山 Seed-ASR 2.0（WebSocket 双向流式优化版）
VLM：   Agnes Text (agnes-2.0-flash) — 免费且支持图片 base64
LLM：   Agnes Text (agnes-2.0-flash) — 与 VLM 同一模型
TTS：   火山 TTS 2.0 HTTP（MVP）/ WebSocket 双向流式（进阶）
S2S：   火山 S2S O2.0（加分项，时间允许则加）
音色：   Vivi 2.0 (zh_female_vv_uranus_bigtts)
通信：  前后端 WebSocket
部署：  Vercel（前端）+ Railway/Fly.io（后端）
```

### 6.4 推荐程度

**强烈推荐选择题目一**。理由：

1. **火山引擎 API 让语音链路从"能用"升级到"好用"** — ASR 300ms + TTS 50+ 音色 + S2S 端到端
2. **Agnes 免费 VLM 解决了核心的视觉理解需求**，且支持 base64 直接传入
3. **72h 内 MVP 可行** — 级联方案 ~52h 工作量，留有余量
4. **赛题要求的成本控制文档有充足素材** — 免费额度策略 + 触发式截图 + 上下文裁剪
5. **评审维度匹配度高**：
   - 完整度 40%：摄像头+麦克风+视觉理解+语音回复全链路
   - 开发质量 40%：模块化架构（ASR/VLM/TTS 独立），代码清晰
   - 演示 20%：视觉对话的 demo 效果天然有冲击力

### 6.5 关键注意事项

1. **S2S 不支持视觉输入是硬伤** — 如果选择 S2S 方案，必须通过 ChatRAGText 旁注注入视觉描述，体验不如方案 A 直接让 VLM 看图
2. **火山 API 的二进制协议是最大工程挑战** — 需要手动构造 4 字节 header + payload，建议直接基于官方 Demo 改造
3. **S2S 鉴权用旧版控制台**（App ID + Access Token），TTS/ASR 新接口用 x-api-key — 注意区分
4. **不要在 S2S 上花太多时间** — MVP 用级联方案，S2S 是锦上添花

---

*本评估基于火山引擎 API 文档（2025-07 抓取）、Agnes AI 模型清单、赛题要求及已有调研综合分析。*