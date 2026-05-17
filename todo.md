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

## Bug 修复：生成功能无效（新需求）
- [x] 更新 AppSettings 类型，添加 generateApiPath 和 statusApiPath 字段
- [x] 重写 veo3Adapter，支持自动探测路径（优先 /v1/video/generations），兼容嵌套响应格式
- [x] 更新 settingsService 默认值
- [x] 更新 SetupPage 和 SettingsPage，允许用户配置 API 路径和模型名称
- [x] 更新 routers.ts 中 settings 的 save 接口，支持 generateApiPath/statusApiPath/defaultModel
- [x] 修复 Mock Mode 下前端 provider 判断逻辑（确认正常）

## Bug 修复：轮询竞态条件（新需求）
- [x] 重写 GenerationPage 轮询逻辑：用 useRef + useCallback，避免 stale closure
- [x] 修复 useEffect 依赖：不依赖 project 对象，改为依赖 polling 状态
- [x] 轮询时直接从后端获取最新任务状态（utils.projects.get.fetch），不依赖旧闭包
- [x] 确保 setPolling(true) 在 refetch 完成后才触发（await refetch() 先，再 setPolling）

## 功能增强：预估剩余时间（新需求）
- [x] 创建 useGenerationTimer hook（追踪每个镜头的开始时间、已用时间、预估剩余时间）
- [x] 创建 GenerationTimeEstimate 组件（总体倒计时 + 进度环）
- [x] 创建 SceneTimer 组件（单镜头倒计时条）
- [x] 更新 GenerationProgressPanel 集成总体时间预估（TimeEstimateBanner）
- [x] 更新 SceneProgressCard 集成单镜头计时条（SceneTimer）
- [x] 更新 GenerationPage 传递计时数据，完成时显示实际用时

## Bug 修复：模型名称错误导致生成失败（新需求）
- [x] 更新 settings.local.json 的 defaultModel 为 veo3.1-fast
- [x] 更新 ModelSettingsPage 预设模型列表，移除无效的 veo3_fast，添加 veo3.1-fast/veo3.1/veo3.1-pro
- [x] 在 settingsService.saveSettings 中添加模型别名映射（veo3_fast → veo3.1-fast），防止旧名称被保存
- [x] 修复 generateSingleMutation/generateBatchMutation onSuccess：检查 result.status，失败时显示错误而不启动轮询
- [x] ModelSettingsPage 添加 useEffect 同步设置，防止页面加载时使用旧默认值

## Bug 修复：艺人选择页面无选择项（新需求）
- [x] 排查 KnowledgePage 艺人数据加载问题
- [x] 修复艺人列表：添加加载骨架屏和空状态提示，确保数据加载前不显示空白

## Bug 修复：艺人加载失败 + 设置保存报错（新需求）
- [x] 排查艺人清单加载失败的根本原因：DashboardPage 未预加载 artists，导致进入 NewProjectPage 时需重新请求
- [x] 排查设置保存 "don't match" 错误：使用 Record<string, unknown> 类型导致 tRPC 类型不匹配
- [x] 修复：DashboardPage 预加载 artists；修复 SettingsPage/SetupPage 使用精确类型调用 saveMutation

## Bug 修复：生产环境 API 路由问题（新需求）
- [x] 排查生产环境 /api/trpc 返回 HTML 的根本原因：server/index.ts 是简化版服务器，没有 tRPC 路由：通配符路由 app.get('*') 拦截了 API 请求
- [x] 修复生产环境服务器：1) server/index.ts 改为转发完整服务器 2) _core/index.ts 通配符排除 /api/ 路径：将通配符改为正则排除 /api/ 路径
