# CisuMusic AI Video Studio — TODO

## 后端
- [x] 后端类型定义 (server/types/index.ts)
- [x] JSON 文件存储服务 (server/storage/jsonStorage.ts)
- [x] 设置服务 (server/services/settingsService.ts)
- [x] Mock 数据服务 (server/services/mockDataService.ts)
- [x] Mock 视频适配器 (server/adapters/mockVideoAdapter.ts)
- [x] Veo3 视频适配器 (server/adapters/veo3Adapter.ts)
- [x] 视频生成服务 (server/services/videoGenerationService.ts)
- [x] 视频拼接服务 (server/services/stitchService.ts)
- [x] 项目服务 (server/services/projectService.ts)
- [x] LLM 策划案/分镜生成服务 (server/services/generativeService.ts)
- [x] tRPC 路由：设置、项目、视频、媒体、导出
- [x] FFmpeg 拼接实现
- [x] Mock 视频片段生成（启动时自动生成）
- [x] _core 基础文件（trpc, context, cookies, oauth, llm, env, systemRouter）

## 前端
- [x] 全局主题配置（深色赛博风）
- [x] 字体配置（Space Grotesk + Inter + JetBrains Mono）
- [x] 应用 Shell 与路由（AppShell, 底部导航）
- [x] SetupPage（API 配置首次运行）
- [x] DashboardPage（工作台首页）
- [x] NewProjectPage（创建项目）
- [x] KnowledgePage（艺人知识库）
- [x] AssetsPage（素材选择）
- [x] BriefPage（视频策划案）
- [x] StoryboardPage（分镜脚本）
- [x] ModelSettingsPage（模型配置）
- [x] GenerationPage（生成任务队列）
- [x] StitchPage（视频拼接）
- [x] PreviewExportPage（预览与导出）
- [x] ProjectsPage（历史项目）
- [x] MediaLibraryPage（素材库）
- [x] SettingsPage（系统设置）
- [x] 全局状态管理（tRPC + React Query）
- [x] StatusBadge 组件
- [x] ProgressBar 组件
- [x] Mock 艺人数据（2Z、MINH、Nghịch、Vũ Thanh Vân）
- [x] 视频模板数据（8 个模板）
- [x] Prompt 生成（通过 LLM）
- [x] 分镜构建（通过 LLM）
- [x] SRT 字幕生成（通过 tRPC export 路由）

## 文档
- [x] README.md（完整文档）
- [x] .gitignore 更新
- [x] vitest 测试（6 个测试全部通过）

## 修复
- [x] 安装缺失依赖（@tanstack/react-query, @trpc/*, superjson 等）
- [x] 创建 _core 目录缺失文件
- [x] 添加 Vite 代理（/api → :3001, /static → :3001）
- [x] 修复 zod v4 z.record() 需要两个参数的问题
- [x] 修复 stitchService.ts TypeScript 错误
- [x] TypeScript 检查：0 错误

## 进度动画增强（新需求）
- [x] 创建 GenerationProgressPanel 组件（圆弧总进度环 + 步骤列表）
- [x] 创建 SceneProgressCard 组件（带动画状态指示器的镜头卡片）
- [x] 创建 StitchProgressPanel 组件（分步进度：下载→转码→拼接→完成）
- [x] 创建 CompletionCelebration 组件（completion-pop 动画 + 成功横幅）
- [x] 更新 GenerationPage 使用新进度组件
- [x] 更新 StitchPage 使用新进度组件
- [x] 在 index.css 中添加进度动画关键帧（shimmer/indeterminate/completionPop/stepSlideIn）
