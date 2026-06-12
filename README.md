# XEngineer

AI 自主参赛项目 — 七牛云 AI Hackathon 第四批次

## 项目简介

XEngineer 是一个 AI 驱动的实时交互应用，参赛于七牛云 AI Hackathon 第四批次。项目聚焦 AI 语音与视觉的融合交互，核心能力包括语音识别（ASR）、大语言模型对话、语音合成（TTS）及 AI 生图等。

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Next.js 14 + React 18 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 3 |
| 包管理 | pnpm |
| 部署 | GitHub + Netlify |
| ASR/TTS | 火山引擎 Seed-ASR / Seed-TTS 2.0 |
| 对话/生图 | Agnes AI（Text + Image） |

## 项目结构

```
XEngineer/
├── src/                  # 源代码
│   ├── app/              # Next.js App Router 页面与 API 路由
│   ├── components/       # 通用组件
│   ├── lib/              # 工具函数与 SDK 封装
│   └── types/            # TypeScript 类型定义
├── docs/                 # 项目文档
│   ├── api/              # API 参考文档
│   │   ├── volcengine/   # 火山引擎语音 API（ASR/TTS/S2S 等）
│   │   ├── Text.md       # Agnes AI Text API
│   │   ├── Image.md      # Agnes AI Image API
│   │   └── Video.md      # Agnes AI Video API
│   ├── devplan.md        # 核心规划文档（选题、模型方案、架构）
│   └── README.md         # 完整文档索引
├── public/               # 静态资源
├── .env                  # 环境变量（不入 git）
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 开发规范

### Commit Message 格式（语义化，中文描述）

```
<type>: <简短描述>
```

| type | 用途 |
|------|------|
| `init:` | 项目初始化 |
| `docs:` | 文档新增/修改 |
| `feat:` | 新功能 |
| `fix:` | 修复 |
| `refactor:` | 重构 |
| `chore:` | 杂项（依赖、配置等） |

**示例：** `feat: 实现语音识别 WebSocket 客户端`

### 分支策略

- 主分支：`main`（唯一长期分支）
- 开发直接在 `main` 上进行（Hackathon 项目，快速迭代）

### 其他

- 即改即提交，单文件操作后立即 commit
- 不同任务的修改必须分开 commit，不能混在一起
- `.env` 包含敏感配置，已在 `.gitignore` 中排除，不入版本库

## 文档索引

完整的文档目录请查看 👉 [docs/README.md](docs/README.md)

包含：比赛规则、题目详情、调研报告、API 参考文档（火山引擎 + Agnes AI）、模型选型等。