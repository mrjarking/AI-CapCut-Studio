# CisuMusic AI Video Studio

> 面向音乐艺人平台运营人员的 AI 宣发短视频生成 H5 工具

---

## 项目介绍

CisuMusic AI Video Studio 是一个完整的 AI 视频生成 Web 应用，专为音乐艺人平台的运营人员、粉丝运营人员和内容编辑人员设计。系统基于艺人知识库、社交媒体素材与平台运营数据，通过分镜分段生成 AI 视频片段，再由后端 FFmpeg 自动拼接为最终完整视频。

**核心特性：**

- 完整的 AI 视频生成工作流（15 步）
- 分镜分段生成，每个镜头独立提交 AI 任务
- 后端代理 AI API，Token 不暴露给前端
- Mock Mode 支持完整演示，无需真实 API
- FFmpeg 自动拼接所有片段为最终 MP4
- 移动端优先 H5 设计，430px 竖屏布局
- 深色赛博音浪风格 UI

---

## 功能列表

| 功能模块 | 说明 |
|---------|------|
| API 配置 | 首次运行配置 API Base URL 和 Token，支持 Mock Mode |
| 艺人知识库 | 内置 4 位艺人（2Z、MINH、Nghịch、Vũ Thanh Vân）及知识模块 |
| 素材库 | 内置 Mock 素材，支持搜索、分类、多选 |
| 视频策划案 | AI 自动生成，包含标题、卖点、故事线等 11 个字段，可编辑 |
| 分镜脚本 | AI 自动拆分镜头，生成英文 Prompt，支持编辑、排序、删除 |
| 模型配置 | 支持 veo3/veo3_fast/mock，水印、音频、种子等参数 |
| 批量生成 | 一键提交所有镜头，自动轮询状态 |
| 单镜头操作 | 单独生成、重试、查看 taskId 和视频 URL |
| 视频拼接 | 后端下载片段，FFmpeg concat demuxer 拼接 |
| 预览下载 | H5 视频播放器，支持下载最终 MP4 |
| 导出功能 | 项目 JSON、分镜 Markdown、Prompt 包、SRT 字幕、发布文案 |
| 历史项目 | 查看、复制、删除、继续编辑 |
| 系统设置 | 修改 API 配置、切换模式、测试连接 |

---

## 技术栈

**前端**

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- tRPC 11（类型安全 API 调用）
- Wouter（路由）
- Sonner（Toast 通知）
- Space Grotesk + Inter + JetBrains Mono 字体

**后端**

- Node.js + Express
- TypeScript
- tRPC（API 层）
- fluent-ffmpeg + 系统 FFmpeg（视频拼接）
- fs-extra（文件操作）
- uuid（唯一 ID 生成）
- axios（HTTP 请求）
- 本地 JSON 文件存储（无数据库依赖）

---

## 项目结构

```
cisum-ai-video-studio/
├── client/                    # 前端 React 应用
│   ├── src/
│   │   ├── pages/             # 页面组件（14 个页面）
│   │   ├── components/        # 通用组件
│   │   ├── types/             # TypeScript 类型定义
│   │   └── lib/               # tRPC 客户端
├── server/                    # 后端 Express 服务
│   ├── types/                 # 后端类型定义
│   ├── services/              # 业务服务层
│   │   ├── settingsService.ts # 配置管理
│   │   ├── projectService.ts  # 项目 CRUD
│   │   ├── videoGenerationService.ts  # 视频生成调度
│   │   ├── stitchService.ts   # FFmpeg 拼接
│   │   ├── mockDataService.ts # Mock 数据
│   │   └── generativeService.ts  # LLM 策划案/分镜生成
│   ├── adapters/              # AI Provider 适配器
│   │   ├── veo3Adapter.ts     # Veo3 Compatible API
│   │   └── mockVideoAdapter.ts # Mock 视频适配器
│   ├── storage/               # JSON 文件存储
│   └── routers.ts             # tRPC 路由定义
├── data/                      # 本地数据存储（.gitignore）
│   ├── settings.local.json    # API 配置
│   ├── projects.json          # 项目数据
│   └── tasks.json             # 任务数据
└── public/                    # 静态文件
    ├── mock/                  # Mock 视频片段
    ├── generated/             # 下载的视频片段
    └── stitched/              # 拼接后的最终视频
```

---

## 安装方法

**系统要求：**

- Node.js 18+
- pnpm（推荐）或 npm
- FFmpeg（系统级安装）

**安装 FFmpeg（Ubuntu/Debian）：**

```bash
sudo apt-get install ffmpeg
```

**安装 FFmpeg（macOS）：**

```bash
brew install ffmpeg
```

**安装项目依赖：**

```bash
pnpm install
```

---

## 启动方法

```bash
# 开发模式（同时启动前后端）
pnpm dev

# 或分别启动
pnpm dev:backend   # 启动后端（端口 3000）
pnpm dev:frontend  # 启动前端（端口 5173）
```

访问 `http://localhost:5173` 即可使用。

---

## 首次运行配置说明

首次访问时，如果未配置 API，系统会自动跳转到 `/setup` 配置页面。

**配置字段说明：**

| 字段 | 说明 |
|------|------|
| API Base URL | AI 视频 API 的基础地址，例如 `https://api.example.com` |
| API Token | Bearer Token，仅在后端保存，前端只展示脱敏版本 |
| API Provider | `Veo3 Compatible API` 或 `Mock Mode` |
| 默认模型 | `veo3`（高质量）、`veo3_fast`（快速）、`mock`（演示） |

**推荐首次使用 Mock Mode**，无需真实 API 即可完整演示所有功能。

---

## 为什么 API Token 不能写入前端

API Token 是访问 AI 视频生成服务的密钥，如果暴露在前端代码中：

1. 任何人打开浏览器开发者工具即可看到 Token
2. Token 会被记录在浏览器历史、日志和网络请求中
3. 恶意用户可以利用 Token 消耗你的 API 配额

本系统的安全设计：

- Token 仅保存在 `data/settings.local.json`（已加入 `.gitignore`）
- 前端只展示脱敏版本（如 `sk-abc***xYz9`）
- 所有 AI API 请求通过后端代理发出，前端不直接访问第三方 API
- 日志中不打印完整 Token

---

## Real API 和 Mock Mode 区别

| 特性 | Real API | Mock Mode |
|------|---------|-----------|
| 需要 API 配置 | 是 | 否 |
| 视频生成 | 调用真实 AI API | 本地模拟，5-8秒后完成 |
| 视频内容 | AI 生成的真实视频 | 纯色测试视频片段 |
| FFmpeg 拼接 | 支持 | 支持（使用 Mock 视频） |
| 适用场景 | 生产环境 | 演示、开发、测试 |

---

## 分段生成逻辑说明

系统根据视频时长自动拆分镜头数量：

| 视频时长 | 镜头数量 | 每镜头时长 |
|---------|---------|-----------|
| 30 秒 | 4-6 个 | 约 5-8 秒 |
| 60 秒 | 8-10 个 | 约 6-8 秒 |
| 90 秒 | 12-15 个 | 约 6-8 秒 |
| 120 秒 | 16-20 个 | 约 6-8 秒 |

每个镜头独立提交 AI 生成任务，前端定时轮询状态。所有镜头完成后才能进入拼接步骤。

---

## FFmpeg 拼接逻辑说明

拼接流程：

1. 后端下载所有已完成的视频片段到 `public/generated/{projectId}/segments/`
2. 生成 `concat.txt` 文件，列出所有片段路径
3. 执行 `ffmpeg -f concat -safe 0 -i concat.txt -c copy final.mp4`
4. 如果 `-c copy` 失败，自动 fallback 到重新编码：`-c:v libx264 -c:a aac -pix_fmt yuv420p`
5. 输出最终视频到 `public/stitched/{projectId}/final.mp4`
6. 前端通过 `/static/stitched/{projectId}/final.mp4` 访问

---

## 常见问题

**Q: 启动时报 FFmpeg 相关错误？**

A: 确保系统已安装 FFmpeg，运行 `ffmpeg -version` 验证。

**Q: Mock Mode 下视频拼接失败？**

A: Mock 视频在后端启动时自动生成，请等待服务完全启动后再尝试。

**Q: API 连接测试失败？**

A: 检查 API Base URL 格式是否正确（需包含 `https://`），确认 Token 有效。

**Q: 生成的分镜 Prompt 不够准确？**

A: 可在分镜脚本页面手动编辑每个镜头的 Prompt，支持完全自定义。

**Q: 视频拼接后无法播放？**

A: 确认所有片段均已成功下载，检查 `public/generated/` 目录中是否有文件。

---

## 后续扩展建议

1. **真实素材上传**：集成 S3 存储，支持用户上传艺人照片和视频素材
2. **多 AI Provider 支持**：扩展适配器支持 Runway、Kling、Sora 等
3. **字幕自动生成**：集成 Whisper API 从视频音频自动生成字幕
4. **批量导出**：支持一键导出多平台适配版本（不同比例和时长）
5. **团队协作**：添加用户认证和项目共享功能
6. **模板市场**：允许用户创建和分享自定义视频模板
7. **实时预览**：在分镜编辑时实时预览 Prompt 效果

---

*由 CisuMusic AI Video Studio 团队构建*
