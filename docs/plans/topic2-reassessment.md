# 题目二重新评估：AI 语音绘图工具（火山引擎 API 加持版）

> 评估时间：2026-06-14
> 基于火山引擎完整 API 文档的可行性重新评估

---

## 一、赛题核心要求回顾

**题目：** 请开发一款纯语音控制的绘图工具。

**关键要求：**
1. **纯语音控制**：用户不能使用鼠标或键盘，仅通过语音指令完成绘图创作
2. **指令理解的准确性与容错性**：ASR + NLU 两个环节都要考虑
3. **语音到绘图操作的响应延迟**：端到端延迟是评审重点
4. **复杂指令的拆解与执行能力**：一句自然语言 → 多步绘图操作
5. **设计文档**：记录"计划支持哪些指令能力，最终实现了哪些，以及未完成部分的原因说明"

**评审权重：**
- 作品完整度与创新性 40%（产品设计合理性、功能完整度、交互流畅度、是否新颖有创意）
- 开发过程与质量 40%（架构清晰度、代码健壮度、PR 质量）
- 演示与表达 20%（demo 视频）

**红线规则：** 全周期持续交付，严禁突击提交。代码相似度 < 50%。

---

## 二、火山引擎 API 对题目二的价值分析

### 2.1 ASR 流式语音识别 — **高价值，核心组件**

**API：** Seed-ASR 大模型流式 API（`wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async`）

**三种模式对比：**

| 模式 | 延迟特征 | 准确率 | 适用场景 |
|------|---------|--------|---------|
| 双向流式优化版（`bigmodel_async`） | **最快**，结果有变化才返回（rtf 优化） | 依赖二遍识别可提升 | ✅ **推荐用于绘图指令** |
| 双向流式（`bigmodel`） | 每包返回，较快 | 中等 | 实时字幕场景 |
| 流式输入（`bigmodel_nostream`） | 5s 音频时 300-400ms 返回 | **最高** | 非实时场景 |

**对题目二的具体价值：**

1. **延迟足够低**：双向流式优化版是"结果有变化时才返回"，配合 `enable_nonstream=true`（二遍识别模式），可以在 VAD 判停（默认 800ms）后用非流式模型重新识别获得高准确率结果。这意味着用户说完一句话后约 **1-2 秒**内可以得到最终高准确率文本。

2. **二遍识别是关键特性**：`enable_nonstream=true` 实现了"实时上屏 + 最终修正"的双保险——快速给用户反馈（`definite=false`），同时静音后用更准确的模型修正（`definite=true`）。**对于绘图指令场景，我们只应在 `definite=true` 时才触发 LLM 解析**，避免中间结果误触发。

3. **热词支持有实际价值**：
   - 通过 `corpus.boosting_table_id` 或 `corpus.context`（热词直传，双向流式支持 100 tokens）可以注入绘图领域词汇
   - 具体可注入的热词示例：`浅蓝色`、`深灰色`、`紫红色`、`椭圆`、`三角形`、`菱形`、`弧线`、`撤销`、`清除`、`画布`、`粗细`、`渐变` 等
   - **这些颜色名、形状名在日常对话中不常见，ASR 容易识别为同音词，热词能显著提升识别准确率**

4. **语言支持**：默认支持中英文 + 上海话/闽南语/四川话等方言，足够覆盖中国用户

5. **音频格式要求明确**：PCM 16kHz/16bit/单声道，200ms 分包最优。浏览器端可通过 Web Audio API 的 `AudioContext({ sampleRate: 16000 })` 直接采集。

6. **上下文理解（ASR 2.0 独有）**：豆包流式语音识别模型 2.0 支持传入 `context` 字段，包含对话历史。这意味着我们可以把**之前的绘图指令历史**传给 ASR，帮助它更好地理解当前指令的语境（如之前说了"蓝色"，现在说"画一个圆"，ASR 可以结合上下文推断）。

**局限：**
- 二进制 WebSocket 协议，不是标准 JSON over WebSocket，**前端实现复杂度高**。需要手动构建 4 字节 header + payload，处理大端序、Gzip 压缩等。**这是最大的工程成本**。
- 需要火山引擎账号 + 开通服务 + API Key。Hackathon 时是否有现成账号？

### 2.2 TTS 语音合成 — **中等价值，锦上添花**

**API：** TTS HTTP 单向流式（`https://openspeech.bytedance.com/api/v3/tts/unidirectional`）或 TTS WebSocket 双向流式（`wss://openspeech.bytedance.com/api/v3/tts/bidirection`）

**对题目二的价值：**

1. **操作反馈语音**：绘图完成后用 TTS 语音确认，如"好的，已在画布中央画了一个红色圆形"
2. **引导与帮助**：首次使用时 TTS 语音引导用户如何操作
3. **错误提示**：指令无法理解时语音提示

**TTS WebSocket 双向流式的事件类型（9 种）：**
- 客户端：`StartConnection` → `StartSession` → `TaskRequest` → `FinishSession` → `FinishConnection`
- 服务端：`ConnectionStarted` → `SessionStarted` → `TTSSentenceStart` → `TTSResponse` → `TTSSentenceEnd` → `TTSSubtitle` → `SessionFinished` → `ConnectionFinished` → `SessionCanceled` → `ConnectionFailed` → `SessionFailed`

**实际评估：**
- TTS 对题目二**不是必需品**。赛题要求的是"语音输入 → 绘图输出"，TTS 反馈是加分项而非核心功能
- **72 小时内 TTS 的优先级应该最低**。如果时间不够，可以用浏览器原生 `SpeechSynthesis API`（零成本零配置）代替
- 火山 TTS 的音色丰富（50+ 种 voice_type），但对于"操作确认"这种简短反馈，浏览器原生 TTS 已经足够
- **结论：TTS 不应该作为技术选型的决定因素。**

### 2.3 热词管理 API — **有实际价值但工程成本高**

**API：** 7 个 REST 接口（ListApplications / CreateBoostingTable / UpdateBoostingTable / DeleteBoostingTable / ListBoostingTable / GetBoostingTable / ListBoostingTableLimits）

**对题目二的价值：**
- 可以创建一个"绘图热词表"，包含颜色名、形状名、绘图操作动词等
- 单个词表最多 1000 个词，每个词最多 10 个字符，中文最多 1666 个词
- **更好的方案**是使用 ASR 流式接口中的 `corpus.context` 热词直传功能（100 tokens），无需调用热词管理 API，直接在每次 ASR 请求中内联热词

**局限：**
- 热词管理 API 使用的是火山引擎标准 AKSK 鉴权（HMAC-SHA256 签名），不是简单的 `X-Api-Key` header
- 需要额外的鉴权代码实现（Python 示例中有完整的签名逻辑，约 60 行代码）
- **在 Hackathon 72 小时内，推荐用 `corpus.context` 直传热词而非管理 API**，省去一整套鉴权代码

### 2.4 S2S 端到端语音大模型 — **对题目二基本无价值**

**API：** `wss://openspeech.bytedance.com/api/v3/realtime/dialogue`（WebSocket RealtimeAPI）

**为什么对绘图工具没有价值：**

1. **S2S 是对话模型，不是指令解析模型**。它的核心能力是"语音对话交互"——用户说话，AI 用语音回复。它无法输出结构化的绘图指令 JSON。

2. **不支持 Function Calling**。S2S 的输出是语音流，不是结构化数据。我们不能让它返回 `[{type: "circle", x: 100, ...}]` 这样的 JSON 数组。

3. **System Prompt 有限**。虽然 O 版本可以配置 `system_role`，但它的定位是让 AI "扮演某个角色"进行对话，而不是"解析指令为结构化操作"。

4. **没有视觉输出通道**。S2S 只能输出音频，不能操作 Canvas。

5. **如果强行使用**：理论上可以让 S2S 充当语音助手，用户说"画一个红圆"，S2S 回复"好的，我帮您画一个红色的圆"，但我们仍然需要一个额外的 LLM 来解析指令、执行绘图。这等于在 ASR→LLM→TTS 链路中用 S2S 替换了 ASR+TTS 两端，但 S2S 无法做到"只做 ASR 不做 TTS"——它是一个黑盒的语音到语音模型。

**结论：S2S 对题目二没有直接价值。它的适用场景是语音助手/客服/情感陪伴，不是绘图工具。**

### 2.5 Agnes AI 图片生成能力 — **有创意加分价值**

**API：** `agnes-image-2.1-flash`（文生图）

**与绘图工具的结合方式：**
- "画一只猫" → 用户说语音 → ASR 转文本 → LLM 判断这是"生成式描述"而非"结构化绘图指令" → 调用 Agnes Image 生成图片 → 将图片放到 Canvas 上
- 这比用基础图形（圆/矩形/线）拼凑一个猫要好得多

**实际评估：**
- 这是一个**非常好的差异化功能**，能让作品从"简单几何图形绘图工具"升级为"AI 语音绘图创作工具"
- 但实现复杂度较高：需要 LLM 准确判断用户意图（"画一个猫" 是文生图还是用几何图形画猫？）
- Agnes Image 生成一张图需要 60-360 秒，这个延迟在语音交互中体验不好
- **建议作为"高级功能/可选模式"**，而非核心功能

---

## 三、技术方案设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      浏览器前端                              │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌───────────────────┐   │
│  │ 麦克风     │──▶│ 火山 ASR      │──▶│ Agnes Text LLM    │   │
│  │ Web Audio │   │ WebSocket     │   │ (指令解析→JSON)   │   │
│  │ 16kHz PCM │   │ bigmodel_async│   │ agnes-2.0-flash   │   │
│  └──────────┘   └──────────────┘   └───────┬───────────┘   │
│                                               │              │
│                                               ▼              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                Canvas 绘图引擎 (Fabric.js)            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ 基础图形   │  │ 文字绘制  │  │ AI 生图(可选)    │   │   │
│  │  │ 圆/矩/线  │  │ 标注/标题 │  │ Agnes Image      │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                               │              │
│  ┌──────────┐   ┌──────────────┐             │              │
│  │ 扬声器     │◀──│ TTS 反馈     │◀────────────┘              │
│  │ Web Audio │   │ (浏览器原生   │  "已画红色圆形"             │
│  └──────────┘   │  SpeechSyn)  │                            │
│                  └──────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

**核心链路：**
```
麦克风 → [200ms音频包] → 火山ASR(WebSocket) → [definite=true文本] → Agnes LLM(JSON指令) → Fabric.js(执行绘图) → TTS(语音确认)
```

### 3.2 指令理解方案

**方案：LLM 语义理解为主，规则快速通道为辅**

**第一层：规则快速通道（< 50ms）**
- 匹配高频简单指令，直接执行，跳过 LLM：
  - "清除/清空/全部删掉" → `clear`
  - "撤销/回退" → `undo`
  - "重做" → `redo`
  - "保存/导出" → `export`

**第二层：LLM 语义理解（Agnes agnes-2.0-flash）**

System Prompt 核心设计：

```
你是一个语音绘图指令解析器。将用户语音转写的文本转换为结构化绘图指令 JSON 数组。

画布尺寸: 800x600，左上角(0,0)
支持指令:
- circle: {type:"circle", cx, cy, radius, fillColor?, strokeColor?, strokeWidth?}
- rect: {type:"rect", x, y, width, height, fillColor?, strokeColor?, strokeWidth?}
- line: {type:"line", x1, y1, x2, y2, color, width}
- triangle: {type:"triangle", points:[[x1,y1],[x2,y2],[x3,y3]], fillColor?}
- text: {type:"text", content, x, y, fontSize?, color?}
- freehand: {type:"freehand", points:[[x,y],...], color?, width?}
- erase: {type:"erase", x, y, size?}
- move: {type:"move", target:"last"|"all", dx, dy}
- scale: {type:"scale", target:"last"|"all", factor}
- clear: {type:"clear"}
- undo: {type:"undo"}
- generate: {type:"generate", prompt, x?, y?, width?, height?}

位置推理规则:
- 无位置信息时默认画布中央(400, 300)
- "左上/右上/左下/右下/中央" → 映射到合理坐标
- "旁边/下方/旁边" → 相对于上一个图形

颜色映射: 红色#E74C3C 蓝色#3498DB 绿色#2ECC71 黄色#F1C40F
黑色#2C3E50 白色#FFFFFF 橙色#E67E22 紫色#9B59B6 粉色#FF69B4

只输出JSON数组，不要其他文字。
```

**为什么用 LLM 而不是规则解析：**
- "画一个红色的太阳在左上角" → LLM 能理解"太阳"是一个圆，"左上角"是位置
- "画一棵绿色的树，树干是棕色的" → LLM 能拆解为多个图形的组合
- "把刚才画的圆移到右边" → LLM 能理解"刚才画的"和"移到右边"
- 规则解析无法处理这些自然语言表达

**Agnes Text 的能力支撑：**
- 支持 JSON 结构化输出
- 256K 上下文，足够包含指令历史和 System Prompt
- 免费使用，无速率限制顾虑
- Function Calling 可用于更复杂的交互（如用户追问"再大一点"时，LLM 可以调用 scale 函数）

### 3.3 Canvas 绘图引擎

**选型：Fabric.js**

**理由：**
1. 内置对象模型——每个图形是独立对象，支持选中、移动、缩放、删除
2. 内置 undo/redo 历史栈
3. 导出能力好（PNG / SVG / JSON）
4. 社区成熟，npm 周下载 800K+
5. 之前调研报告中已验证可行

**Fabric.js 执行指令的核心映射：**

```javascript
const cmdExecutors = {
  circle: (cmd) => canvas.add(new fabric.Circle({
    left: cmd.cx - cmd.radius, top: cmd.cy - cmd.radius,
    radius: cmd.radius, fill: cmd.fillColor || 'transparent',
    stroke: cmd.strokeColor, strokeWidth: cmd.strokeWidth || 2
  })),
  rect: (cmd) => canvas.add(new fabric.Rect({
    left: cmd.x, top: cmd.y, width: cmd.width, height: cmd.height,
    fill: cmd.fillColor || 'transparent',
    stroke: cmd.strokeColor, strokeWidth: cmd.strokeWidth || 2
  })),
  text: (cmd) => canvas.add(new fabric.Text(cmd.content, {
    left: cmd.x, top: cmd.y, fontSize: cmd.fontSize || 24,
    fill: cmd.color || '#000000'
  })),
  // ...
};
```

**备选方案：Konva.js** — 如果需要更流畅的动画效果，但 Fabric.js 对 Hackathon 来说更成熟稳定。

### 3.4 语音反馈设计

**方案：浏览器原生 `SpeechSynthesis API` + 可选火山 TTS**

**推荐优先使用浏览器原生 TTS 的原因：**
1. **零配置**：无需 API Key、无需鉴权
2. **零成本**：免费
3. **零延迟（网络层面）**：本地合成，无网络 RTT
4. **中文支持好**：Chrome/Edge 内置中文语音（如 `zh-CN-XiaoxiaoNeural`）
5. **足够用**：操作确认只需要简短句子（"好的，已画红色圆形"）

**反馈内容设计：**
- 绘图成功："好的，已在画布中央画了一个红色圆形"
- 指令未理解："抱歉，我没有理解您的指令，请再说一次"
- 错误提示："画布已清空" / "已撤销上一步操作"
- 引导帮助："您可以说'画一个红色的圆'或'在左上角写Hello'"

**如果时间允许再接入火山 TTS**（作为加分项），使用 HTTP 单向流式接口（比 WebSocket 简单）。

---

## 四、开发工作量估算

### 4.1 MVP 最小可行产品定义

**核心功能（必须完成）：**
1. 语音采集 + 火山 ASR 流式识别
2. LLM 指令解析（Agnes Text）
3. 基础图形绘制（圆/矩形/线条/文字/三角形）
4. 撤销/清空操作
5. 语音反馈（浏览器原生 TTS）
6. 操作历史记录面板
7. 设计文档

**增强功能（尽量完成）：**
1. 颜色/位置/大小的自然语言理解
2. 复杂指令拆解（"画一个红色太阳在左上角，下面画一棵绿树"）
3. "再大一点/移到左边"等增量修改指令
4. AI 生图模式（"画一只猫"→Agnes Image）
5. 导出 PNG/SVG

**锦上添花（有余力再做）：**
1. 火山 TTS 替换浏览器原生 TTS
2. 热词表管理
3. 多轮对话上下文
4. 绘图动画效果

### 4.2 工时估算（72 小时限制）

| 模块 | 预估工时 | 优先级 | 备注 |
|------|---------|--------|------|
| **项目脚手架 + UI 框架** | 4h | P0 | Vite + React/Vue + Tailwind，画布 UI |
| **火山 ASR WebSocket 客户端** | **8h** | P0 | 二进制协议实现是难点，需要处理 header 构建、Gzip、分包 |
| **音频采集（Web Audio）** | 3h | P0 | 16kHz 降采样 + 200ms 分包 |
| **LLM 指令解析（Agnes Text）** | 4h | P0 | System Prompt 设计 + JSON 解析 + 错误处理 |
| **Fabric.js 绘图引擎** | 6h | P0 | 指令执行器 + 撤销/重做 + 导出 |
| **语音反馈（浏览器 TTS）** | 2h | P0 | SpeechSynthesis 封装 |
| **指令历史面板** | 3h | P1 | 显示操作记录 + 当前状态 |
| **复杂指令拆解** | 4h | P1 | 依赖 LLM Prompt 优化 |
| **增量修改指令** | 3h | P1 | "再大一点"/"移到左边" |
| **AI 生图模式** | 4h | P2 | Agnes Image 集成 + Canvas 图片嵌入 |
| **热词注入** | 2h | P2 | ASR corpus.context 热词直传 |
| **设计文档** | 3h | P0 | 赛题要求必须提交 |
| **Demo 视频录制** | 2h | P0 | 评审要求 |
| **测试 + 调试** | 6h | P0 | |
| **Buffer / PR 细化** | 8h | - | PR 拆分、描述编写 |
| **合计核心（P0）** | **~38h** | | 理论上在 72h 内可完成 |
| **合计含增强（P1）** | **~49h** | | 时间较紧但可行 |
| **合计全部** | **~62h** | | 几乎占满 72h |

---

## 五、风险与难点

### 5.1 🔴 高风险：火山 ASR 二进制 WebSocket 协议实现复杂

**问题：** 火山 ASR 使用自定义的二进制帧格式（4 字节 header + 大端序 payload），不是标准的 JSON over WebSocket。前端需要：
- 手动构建二进制帧（Protocol Version、Header Size、Message Type、Flags、Serialization Method、Compression Method）
- Gzip 压缩/解压
- 大端序整数处理
- Audio-only request（raw PCM 数据，无 JSON 序列化）

**缓解措施：**
- 文档中有 Python/Go/Java 三种语言的 Demo 代码可参考
- 可以写一个 `VolcASRClient` 类封装所有二进制协议细节
- 考虑是否用后端 Node.js/Python 做 ASR 代理，前端只需发音频流到后端

**后端代理方案**（推荐）：
```
浏览器 → WebSocket → Node.js 后端 → WebSocket → 火山 ASR
         (JSON)                    (二进制)
```
这样前端只需处理标准 JSON，后端处理火山二进制协议。但增加了部署复杂度。

### 5.2 🔴 高风险：指令解析准确率

**问题：** LLM 输出的 JSON 可能有格式错误、数值不合理（如半径为负数、坐标超出画布）。

**缓解措施：**
- 使用 Agnes Text 的 JSON 结构化输出能力
- 前端做 JSON Schema 校验 + 数值范围校验
- 对 LLM 输出做 fallback 处理（解析失败时提示用户重说）

### 5.3 🟡 中风险：端到端延迟

**延迟估算：**
| 环节 | 估算延迟 |
|------|---------|
| 音频缓冲 + 采集 | 200ms |
| 火山 ASR（双向流式 + 二遍识别） | 800-1500ms |
| Agnes LLM 指令解析 | 500-1500ms |
| Canvas 渲染 | <10ms |
| **总计** | **1.5-3.2s** |

**赛题特别提到"语音到绘图操作的响应延迟"是评审重点**。1.5-3.2 秒的延迟是否可接受？

**缓解措施：**
- 规则快速通道（撤销/清除）跳过 LLM，延迟 < 1s
- ASR 返回 `definite=false` 的中间结果时，在 UI 上实时显示识别文本，让用户知道"正在听"
- 绘制时添加动画效果，降低等待感知

### 5.4 🟡 中风险：72 小时时间压力

**问题：** 如果火山 ASR 二进制协议实现卡住超过预期，会严重影响整体进度。

**缓解措施：**
- 准备 Web Speech API 作为 fallback（2 行代码即可使用）
- 第一天优先跑通 "Web Speech API → LLM → Canvas" 的最小链路
- 然后再替换为火山 ASR

### 5.5 🟢 低风险：LLM 指令解析的能力边界

**问题：** 复杂的绘画描述（"画一幅日落风景画"）LLM 无法用基础图形表达。

**缓解措施：**
- 在设计文档中明确"计划支持的能力范围"和"能力边界"
- 对于超出能力范围的描述，可以引导用户分解为简单指令，或者触发 AI 生图模式

---

## 六、结论与建议

### 可行性评分：7/10

### 核心判断

**火山引擎 API 对题目二有实质帮助，但帮助主要在 ASR 环节，不是决定性的。**

具体来说：

| 能力 | 火山引擎价值 | 评分 |
|------|------------|------|
| ASR 语音识别 | 高——中文准确率高、流式延迟低、热词支持、二遍识别 | ⭐⭐⭐⭐ |
| TTS 语音合成 | 低——浏览器原生 TTS 已够用，不是评审重点 | ⭐⭐ |
| S2S 端到端语音 | 无——对话模型无法输出结构化绘图指令 | ⭐ |
| 热词管理 | 中——热词直传有用，管理 API 工程成本太高 | ⭐⭐⭐ |
| 图片生成 | 间接——Agnes Image 能做，但不是火山引擎的能力 | ⭐⭐⭐ |

### 关键发现

1. **火山引擎最大的价值是 ASR 的二遍识别模式**（`enable_nonstream=true`），这在其他 ASR 方案中很少见。它实现了"快速反馈 + 高准确率"的双保险，非常适合绘图指令场景。

2. **ASR 2.0 的上下文理解能力**（传入对话历史/图像）是一个差异化亮点。可以把画布当前状态截图传给 ASR，帮助它理解用户在说什么（如"把这个移过去"中的"这个"指的是什么）。

3. **S2S 端到端模型对题目二完全没用**。这是一个诚实的评估——S2S 是对话模型，不是工具调用模型。

4. **TTS 语音反馈用浏览器原生就够了**。不需要为 TTS 花额外工程时间。

5. **最大工程风险是火山 ASR 的二进制 WebSocket 协议**。如果团队没有处理二进制 WebSocket 的经验，建议用后端代理方案降低前端复杂度，或者准备 Web Speech API 作为 fallback。

### 推荐程度：⭐⭐⭐⭐（4/5，推荐但需务实）

**推荐选择题目二的条件：**
- 团队有 WebSocket 二进制协议处理经验（或有后端可做代理）
- 已有火山引擎账号和 API Key
- 接受 1.5-3 秒的端到端延迟（对于 Hackathon demo 级别可以接受）
- 愿意在设计文档中诚实记录能力边界

**如果选择题目二，72 小时执行建议：**

| 时间 | 任务 |
|------|------|
| 第 0-6h | 项目脚手架 + Web Speech API 跑通最小链路（语音→文本→LLM→Canvas） |
| 第 6-14h | 火山 ASR WebSocket 客户端实现 + 集成 |
| 第 14-24h | LLM 指令解析优化 + Fabric.js 绘图引擎完善 |
| 第 24-36h | 复杂指令拆解 + 增量修改 + 语音反馈 |
| 第 36-48h | AI 生图模式（如时间允许）+ 热词注入 |
| 第 48-60h | 测试 + 修 bug + UI 打磨 |
| 第 60-72h | 设计文档 + Demo 视频 + PR 细化 |

**设计文档中"计划 vs 实现"的建议写法：**

| 能力 | 计划 | 预期实现 | 可能未完成 |
|------|------|---------|-----------|
| 基础图形绘制 | ✅ | ✅ | |
| 颜色/位置/大小 | ✅ | ✅ | |
| 撤销/清空 | ✅ | ✅ | |
| 复杂指令拆解 | ✅ | ✅ | 多步拆解精度 |
| 增量修改 | ✅ | 🟡 | "再大一点"可能不稳定 |
| AI 生图模式 | ✅ | 🟡 | 时间不够可能砍掉 |
| 自由画笔（语音控制） | ✅ | ❌ | 交互设计复杂 |
| 多图层支持 | 计划外 | — | |
| 协作绘图 | 计划外 | — | |

### 最终建议

**如果团队已经有一定的前端能力且有信心处理二进制 WebSocket 协议，题目二是一个有创意空间且能做出令人印象深刻 demo 的选择。** 火山引擎 ASR 的二遍识别和热词能力是真正的加分项。

**但如果团队对 WebSocket 二进制协议不熟悉，或者时间管理能力较弱，建议选择题目一**（AI 视觉对话助手），因为题目一的技术栈更成熟、demo 效果更容易展示、且 Agnes Text 的图片理解能力可以直接复用。