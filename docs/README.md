# XEngineer 文档索引

## 目录结构

```
docs/
├── README.md                          <- 你在这里
├── competition-rules.md               <- 比赛规则
├── topics.md                          <- 赛题详情
├── plans/                             <- 计划文档
│   ├── archive/                       <- 已完成的计划（归档）
│   │   ├── git-hardening-plan.md
│   │   ├── hooks-persistence-plan.md
│   │   ├── volcengine-docs-assessment.md
│   │   └── strategy-adjustment.md
│   ├── devplan.md
│   ├── model-selection.md
│   ├── research-topic1.md
│   └── research-topic2.md
└── api/                               <- API 参考文档
    ├── Text.md
    ├── Image.md
    ├── Video.md
    └── volcengine/
        ├── seed-asr-streaming.md
        ├── asr-config.md
        ├── auth-guide.md
        ├── quickstart.md
        ├── tts-http-streaming.md
        ├── tts-websocket-streaming.md
        ├── tts-voices-params.md
        ├── tts-extra.md
        ├── speech-to-speech.md
        ├── podcast-interpreter.md
        ├── realtime-conversation.md
        ├── hotword-management.md
        ├── billing.md
        ├── api-key-guide.md
        ├── model-list.md
        ├── voice-list-summary.md
        ├── protocol-errors.md
        ├── misc.md
        └── misc-2.md
```

---

## 一、计划文档 (plans/)

### 活跃计划

| 文件 | 说明 | 优先级 |
|------|------|--------|
| [plans/devplan.md](plans/devplan.md) | 开发规划：选题决策、架构设计、任务拆分、进度跟踪 | 核心 |
| [plans/model-selection.md](plans/model-selection.md) | 可用模型清单（Agnes AI / NVIDIA NIM），含端点与认证方式 | 核心 |
| [plans/research-topic1.md](plans/research-topic1.md) | 题目一（AI视觉对话助手）：开源项目、技术方案、架构分析 | 核心 |
| [plans/research-topic2.md](plans/research-topic2.md) | 题目二（AI语音绘图工具）：开源项目、技术方案、架构分析 | 核心 |

### 归档计划

> 以下计划已完成，仅供历史参考。

| 文件 | 说明 |
|------|------|
| [plans/archive/git-hardening-plan.md](plans/archive/git-hardening-plan.md) | Git 稳定性根治方案 |
| [plans/archive/hooks-persistence-plan.md](plans/archive/hooks-persistence-plan.md) | Hook 持久化根治方案 |
| [plans/archive/volcengine-docs-assessment.md](plans/archive/volcengine-docs-assessment.md) | 火山引擎语音文档摸底评估与抓取计划 |
| [plans/archive/strategy-adjustment.md](plans/archive/strategy-adjustment.md) | 策略调整：直接在当前仓库进行全流程开发 |

---

## 二、根目录文件

| 文件 | 说明 | 优先级 |
|------|------|--------|
| [competition-rules.md](competition-rules.md) | 比赛规则、评审标准、提交规范、代码相似度红线 | 核心 |
| [topics.md](topics.md) | 第四批次赛题详情（AI视觉对话助手 / AI语音绘图工具） | 核心 |

---

## 三、API 参考 — Agnes AI

> 平台内置 SDK，沙箱内自动鉴权，优先使用。

| 文件 | 说明 | 优先级 |
|------|------|--------|
| [api/Text.md](api/Text.md) | 聊天补全接口（agnes-2.0-flash） | 核心 |
| [api/Image.md](api/Image.md) | 图片生成接口 | 核心 |
| [api/Video.md](api/Video.md) | 视频生成接口（提交 + 轮询） | 核心 |

## 四、API 参考 — 火山引擎语音

> 来源：volcengine.com/docs/6561（豆包语音产品线）
> 详细索引（19个文档，按优先级分三级）见：[api/volcengine/README.md](api/volcengine/README.md)

| 分类 | 核心文件 | 说明 |
|------|---------|------|
| ASR | `seed-asr-streaming.md` | 流式 WebSocket API |
| ASR | `asr-config.md` | 录音文件识别 API |
| TTS | `tts-http-streaming.md` / `tts-websocket-streaming.md` | HTTP / WebSocket 双模式 |
| S2S | `speech-to-speech.md` | 端到端实时语音大模型 |
| 鉴权 | `auth-guide.md` / `api-key-guide.md` | API Key 获取与使用 |