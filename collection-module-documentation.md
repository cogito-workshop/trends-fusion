# 数据采集模块完整功能文档

## 📋 模块概览

数据采集模块是 Trends Fusion AI 内容工作流平台的核心模块之一，负责从多个数据源采集、整理和预处理数据，为后续的AI分析和内容发布提供数据支持。

## 🎯 核心功能

### 1. 概览页面 (Overview)

**统计卡片**
- **总数据源**: 显示配置的数据源总数和活跃数量
- **今日采集**: 显示当日采集的数据量及增长趋势
- **成功率**: 显示采集任务的平均成功率
- **去重率**: 显示过滤的重复内容比例

**最近活动列表**
- 实时显示各数据源的采集状态
- 显示最后同步时间和采集数量
- 快速操作按钮（同步、查看）

### 2. 数据源管理 (Data Sources)

#### 支持的数据源类型
- **API接口** - 通过REST API获取数据
- **RSS订阅** - 订阅RSS/Atom feeds
- **网页抓取** - 爬取网页内容
- **Webhook** - 接收外部推送的数据

#### 数据源配置
每个数据源包含以下配置信息：
- 基本信息（名称、类型、URL）
- 采集参数（速率限制、最大条目数）
- 认证信息（API密钥、Token）
- 筛选条件
- 采集间隔

#### 数据源状态管理
- **运行中** (Active) - 正常采集数据
- **已暂停** (Paused) - 暂停采集
- **错误** (Error) - 采集失败
- **测试中** (Testing) - 正在测试连接

#### 操作功能
- **测试连接** - 验证数据源可访问性
- **手动同步** - 立即触发数据采集
- **启动/暂停** - 控制采集任务
- **配置编辑** - 修改采集参数
- **删除** - 移除数据源

### 3. 数据预览 (Data Preview)

#### 多种查看模式
- **网格视图** - 卡片式展示数据
- **列表视图** - 表格形式展示
- **原始数据** - JSON格式查看

#### 搜索和过滤
- 全文搜索（标题、内容）
- 按数据源筛选
- 按状态筛选
- 按时间范围筛选

#### 数据展示信息
- 标题和摘要
- 来源和作者
- 发布时间
- 分类和标签
- 处理状态
- 原文链接

### 4. 过滤规则 (Filters)

#### 过滤类型
- **关键词过滤** - 根据关键词包含/排除
- **正则表达式** - 使用正则表达式匹配
- **分类过滤** - 按内容分类筛选
- **时间过滤** - 按发布时间范围

#### 过滤条件
- 支持多个条件组合
- AND/OR逻辑操作
- 条件优先级设置
- 实时预览效果

#### 规则管理
- 创建新规则
- 启用/禁用规则
- 编辑规则条件
- 删除规则
- 规则排序

### 5. 采集计划 (Schedule)

#### 调度类型
- **Cron表达式** - 精确时间调度
- **固定间隔** - 周期性采集
- **实时触发** - 事件驱动采集

#### 计划配置
- 计划名称和描述
- Cron表达式或间隔设置
- 关联的数据源
- 启动/禁用状态
- 下次执行时间

#### 执行监控
- 上次执行时间
- 执行状态和结果
- 错误日志
- 执行统计

## 🔧 技术实现

### Hook架构

#### useCollection Hook
```typescript
// 主要功能
- 数据源管理 (CRUD)
- 过滤规则管理
- 采集计划管理
- 状态管理
- 数据获取和刷新
```

### 数据模型

#### DataSource
```typescript
interface DataSource {
  id: string
  name: string
  type: 'api' | 'rss' | 'scrape' | 'webhook'
  status: 'active' | 'paused' | 'error' | 'testing'
  url: string
  lastSync?: string
  items: number
  config: Record<string, any>
  createdAt: string
}
```

#### FilterRule
```typescript
interface FilterRule {
  id: string
  sourceId: string
  name: string
  type: 'keyword' | 'regex' | 'category' | 'time'
  conditions: string[]
  action: 'include' | 'exclude'
  enabled: boolean
}
```

#### CollectionSchedule
```typescript
interface CollectionSchedule {
  id: string
  sourceId: string
  name: string
  cronExpression: string
  interval: string
  enabled: boolean
  lastRun?: string
  nextRun?: string
}
```

### 组件架构

```
CollectionDashboard (主组件)
├── 概览页面
│   ├── 统计卡片
│   └── 最近活动列表
├── 数据源页面
│   ├── 数据源卡片
│   └── 操作按钮组
├── 数据预览页面
│   ├── 搜索和过滤
│   ├── 网格视图
│   └── 数据列表
├── 过滤规则页面
│   └── 规则列表
└── 采集计划页面
    └── 计划列表
```

## 📊 数据流

```
外部数据源
    ↓
数据采集器
    ↓
数据验证
    ↓
过滤处理
    ↓
去重检测
    ↓
数据存储
    ↓
状态更新
    ↓
通知推送
```

## 🔄 实时更新

- **自动刷新**: 每30秒自动获取最新数据
- **手动刷新**: 按钮触发立即更新
- **实时状态**: 测试连接时显示实时状态变化
- **进度显示**: 显示采集进度和结果

## 🎨 UI/UX特性

### 视觉设计
- 清晰的状态指示（颜色编码）
- 直观的数据源图标（emoji）
- 响应式卡片布局
- 一致的交互模式

### 用户体验
- 快速操作按钮
- 实时反馈
- 加载状态提示
- 错误信息展示
- 批量操作支持

## 📈 性能优化

- 数据分页加载
- 虚拟滚动（大列表）
- 缓存机制
- 防抖搜索
- 懒加载图片

## 🔒 安全考虑

- API密钥加密存储
- 请求频率限制
- 来源验证
- 数据脱敏
- 访问日志

## 🚀 扩展性

### 新增数据源类型
1. 在类型定义中添加新类型
2. 实现对应的采集器
3. 添加配置界面
4. 更新UI组件

### 自定义过滤器
1. 创建过滤器类
2. 注册到过滤器工厂
3. 添加UI配置组件
4. 更新验证规则

## 📝 配置示例

### API数据源配置
```json
{
  "name": "Hacker News",
  "type": "api",
  "url": "https://hacker-news.firebaseio.com/v0",
  "config": {
    "endpoint": "/topstories.json",
    "rateLimit": 60,
    "maxItems": 100,
    "headers": {
      "User-Agent": "TrendsFusion/1.0"
    }
  }
}
```

### RSS数据源配置
```json
{
  "name": "Tech Blogs RSS",
  "type": "rss",
  "url": "https://example.com/feed.xml",
  "config": {
    "feedUrl": "https://example.com/feed.xml",
    "parseInterval": 3600,
    "maxItems": 50
  }
}
```

### 过滤规则配置
```json
{
  "name": "AI Keywords Filter",
  "type": "keyword",
  "conditions": ["AI", "机器学习", "深度学习"],
  "action": "include",
  "enabled": true
}
```

### 采集计划配置
```json
{
  "name": "Hourly HN Sync",
  "cronExpression": "0 * * * *",
  "sourceId": "1",
  "enabled": true
}
```

## 🎯 后续开发计划

1. **数据源连接测试**
   - 实现真实的连接验证
   - 显示详细错误信息
   - 自动重试机制

2. **高级过滤功能**
   - 可视化规则构建器
   - 过滤器组合
   - 机器学习分类

3. **数据导出**
   - CSV/JSON导出
   - 自定义导出格式
   - 定时导出

4. **监控和报警**
   - 采集失败报警
   - 数据质量监控
   - 性能指标

5. **批量操作**
   - 批量启用/禁用
   - 批量配置修改
   - 批量删除

---

## 📚 总结

数据采集模块提供了完整的数据采集解决方案，支持多种数据源类型、灵活的过滤机制、精确的调度控制以及直观的数据预览功能。模块采用现代化的React架构，具备良好的可扩展性和可维护性，为AI内容工作流平台提供了坚实的数据基础。
