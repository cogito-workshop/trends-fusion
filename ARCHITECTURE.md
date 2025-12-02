# Trends Fusion - 重构架构设计

## 项目概述
基于AI的自动化内容采集、总结和发布平台

## 页面结构

### 1. 认证模块
- `/auth/login` - 用户登录页
- `/auth/register` - 用户注册页
- `/auth/forgot-password` - 忘记密码页

### 2. 数据采集模块
- `/collection` - 采集主页面
  - `/collection/preview` - 采集内容预览
  - `/collection/config` - 采集配置（数据源、频率、过滤规则）
  - `/collection/history` - 采集历史记录

### 3. 智能总结模块
- `/summary` - 总结主页面
  - `/summary/preview` - 总结内容预览
  - `/summary/config` - 总结配置（LLM选择、提示词、温度等）
  - `/summary/history` - 总结历史记录

### 4. 发布管理模块
- `/publish` - 发布主页面
  - `/publish/preview` - 发布内容预览
  - `/publish/config` - 发布平台配置
    - 微信公众号
    - 小红书
    - 抖音
    - 今日头条
    - 知乎
    - 微博
  - `/publish/history` - 发布历史记录

### 5. 应用配置
- `/settings/app` - 应用配置
  - Supabase配置
  - 数据库配置
  - API密钥管理
  - 系统设置

### 6. 通知系统
- `/notifications` - 通知主页面
  - 通知配置
  - 通知历史
  - 通知渠道：
    - Bark通知
    - 钉钉通知
    - 飞书通知
    - 微信通知
    - 邮件通知
    - Slack通知

### 7. 自动配置
- `/automation` - 自动化配置
  - 工作流编排
  - 定时任务
  - 触发器设置
  - 调度配置

## 路由设计
```typescript
/auth/login
/auth/register
/auth/forgot-password
/collection
/collection/preview
/collection/config
/collection/history
/summary
/summary/preview
/summary/config
/summary/history
/publish
/publish/preview
/publish/config/:platform
/publish/history
/settings/app
/settings/data-source
/settings/notifications
/notifications
/notifications/channels
/notifications/history
/automation
/automation/workflows
/automation/schedules
/automation/triggers
/dashboard
```

## 数据库表结构（基于现有架构）
- workflows - 工作流定义
- workflow_executions - 工作流执行记录
- workflow_stages - 工作流阶段
- collected_items - 采集的数据项
- analysis_results - 分析/总结结果
- published_content - 发布内容
- data_sources - 数据源配置
- templates - 发布模板
- notifications - 通知记录
- automation_rules - 自动化规则

## 组件架构
```
src/
├── components/
│   ├── ui/ (已有组件)
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── PasswordResetForm.tsx
│   ├── collection/
│   │   ├── CollectionDashboard.tsx
│   │   ├── ContentPreview.tsx
│   │   ├── CollectionConfig.tsx
│   │   └── CollectionHistory.tsx
│   ├── summary/
│   │   ├── SummaryDashboard.tsx
│   │   ├── SummaryPreview.tsx
│   │   ├── SummaryConfig.tsx
│   │   └── SummaryHistory.tsx
│   ├── publish/
│   │   ├── PublishDashboard.tsx
│   │   ├── PublishPreview.tsx
│   │   ├── PublishHistory.tsx
│   │   └── PlatformConfig/
│   │       ├── WechatConfig.tsx
│   │       ├── XiaohongshuConfig.tsx
│   │       └── ...
│   ├── settings/
│   │   ├── AppConfig.tsx
│   │   ├── DataSourceConfig.tsx
│   │   └── NotificationConfig.tsx
│   ├── notifications/
│   │   ├── NotificationCenter.tsx
│   │   ├── NotificationHistory.tsx
│   │   └── ChannelConfig/
│   │       ├── BarkConfig.tsx
│   │       ├── DingtalkConfig.tsx
│   │       └── ...
│   └── automation/
│       ├── AutomationDashboard.tsx
│       ├── WorkflowBuilder.tsx
│       ├── ScheduleConfig.tsx
│       └── TriggerConfig.tsx
```

## 工作流设计

### 完整工作流
1. **数据采集** → 从多个数据源获取内容
2. **内容预处理** → 过滤、去重、质量评分
3. **智能总结** → 使用LLM进行内容总结和聚合
4. **内容审核** → 人工审核（可选）
5. **发布准备** → 格式化、适配不同平台
6. **多平台发布** → 发布到多个媒体平台
7. **通知推送** → 发送成功/失败通知

### 自动化场景
- 每日新闻聚合 → 自动总结 → 定时发布
- 热点追踪 → 实时监控 → 快速发布
- 定期报告 → 批量处理 → 批量发布

## 技术栈
- Frontend: React + TypeScript + shadcn-ui + Tailwind CSS
- Backend: Electron + SQLite/Supabase
- State: React Context/Zustand
- Routing: React Router v7
- Forms: React Hook Form + Zod
- HTTP: IPC (Electron)

## 开发优先级
1. 设计新的导航和布局
2. 创建认证模块
3. 创建Dashboard
4. 创建三大核心模块（采集、总结、发布）
5. 创建配置和通知页面
6. 创建自动化页面
7. 工作流编排和调度
