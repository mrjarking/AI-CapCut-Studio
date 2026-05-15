# CisuMusic AI Video Studio — 设计方案

<response>
<text>

## 方案 A：赛博音浪（Cyber Soundwave）

**Design Movement**：赛博朋克 × 音乐可视化 × Web3 质感

**Core Principles**：
1. 深黑底色配霓虹紫/青渐变，强烈的科技感与音乐平台氛围
2. 玻璃拟态卡片（backdrop-blur + 半透明边框）
3. 音浪波形作为装饰性背景元素
4. 分镜时间线采用横向滚动轨道设计

**Color Philosophy**：
- 背景：#0a0a0f（极深蓝黑）
- 主色：紫青渐变 oklch(0.6 0.28 290) → oklch(0.7 0.22 200)
- 强调：霓虹粉 oklch(0.75 0.25 340)
- 卡片：rgba(255,255,255,0.04) + 1px 渐变边框

**Layout Paradigm**：
- 移动端最大宽度 430px，桌面居中模拟手机
- 底部固定导航栏（5 个主入口）
- 页面内容区域可滚动，顶部步骤条指示工作流进度

**Signature Elements**：
1. 音浪 SVG 动画背景（低透明度）
2. 分镜卡片左侧彩色竖条（代表不同状态）
3. 任务进度使用圆弧进度环

**Interaction Philosophy**：触屏优先，大按钮区域，滑动切换分镜，长按显示操作菜单

**Animation**：
- 页面切换：translateY(20px) + opacity 0→1，200ms ease-out
- 卡片悬停：scale(1.02) + 阴影增强
- 状态变更：颜色渐变过渡 300ms
- 音浪背景：CSS animation 循环，8s 周期

**Typography System**：
- 标题：Space Grotesk Bold（科技感等宽风格）
- 正文：Inter Regular（清晰可读）
- 代码/ID：JetBrains Mono

</text>
<probability>0.08</probability>
</response>

<response>
<text>

## 方案 B：暗夜录音棚（Dark Studio）

**Design Movement**：专业音频工作站 × 极简暗色 × 精密工具感

**Core Principles**：
1. 深灰色系，接近专业 DAW 软件质感
2. 橙色/琥珀色作为唯一强调色
3. 精密的网格布局，信息密度高
4. 强调功能性而非装饰性

**Color Philosophy**：
- 背景：#111118（深蓝灰）
- 卡片：#1a1a24
- 强调：琥珀橙 oklch(0.72 0.18 55)
- 文字：#e8e8f0 / #9090a8

**Layout Paradigm**：
- 左侧固定侧边栏导航
- 右侧内容区，顶部面包屑
- 分镜采用垂直时间线

**Signature Elements**：
1. 顶部状态栏（API 状态、模式指示）
2. 分镜编号使用大号等宽字体
3. 进度条使用细线设计

**Interaction Philosophy**：键盘友好，精确点击，专业工具感

**Animation**：
- 简洁，150ms 以内
- 侧边栏展开/收起 slide 动画

**Typography System**：
- 标题：DM Sans Bold
- 正文：DM Sans Regular
- 数字：JetBrains Mono

</text>
<probability>0.06</probability>
</response>

<response>
<text>

## 方案 C：霓虹舞台（Neon Stage）

**Design Movement**：K-pop 宣传美学 × 霓虹灯牌 × 数字舞台

**Core Principles**：
1. 极深黑底色，霓虹渐变文字和边框发光效果
2. 卡片采用渐变边框 + 内部深色填充
3. 分镜卡片模拟胶片帧感
4. 移动端竖屏沉浸式体验

**Color Philosophy**：
- 背景：#070710（近黑）
- 霓虹主色：品红 oklch(0.65 0.3 330) + 青蓝 oklch(0.7 0.25 210)
- 金色强调：oklch(0.78 0.18 85)
- 玻璃卡片：rgba(255,255,255,0.03)

**Layout Paradigm**：
- 全屏移动端体验，430px 宽度限制
- 顶部步骤进度条（工作流）
- 底部导航（主要功能入口）
- 分镜采用横向卡片滑动

**Signature Elements**：
1. 霓虹发光文字效果（text-shadow）
2. 渐变描边卡片（conic-gradient border）
3. 粒子/星点背景

**Interaction Philosophy**：沉浸式滑动，触感反馈，视觉冲击

**Animation**：
- 霓虹闪烁 keyframe（subtle，4s 周期）
- 卡片入场：从下方 slide-up + fade
- 进度条流光动画

**Typography System**：
- 标题：Syne ExtraBold（前卫感）
- 正文：Inter
- 强调标签：Space Grotesk

</text>
<probability>0.09</probability>
</response>
