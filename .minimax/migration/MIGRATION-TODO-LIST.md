# 📋 ai-trend-publish 完整迁移任务清单

## 📊 当前状态统计

- **源项目文件总数**: 61 个 TypeScript 文件
- **当前项目文件数**: 7 个 TypeScript 文件
- **已迁移文件数**: 7 个 (主要是数据库相关)
- **未迁移文件数**: 54 个
- **迁移进度**: 11.5% ⚠️

---

## ✅ 已完成迁移 (7/61)

### Database 层 (全部完成)
```
✅ src/database/factory.ts
✅ src/database/index.ts
✅ src/database/interfaces/dto.ts
✅ src/database/sqlite/sqlite.service.ts
✅ src/database/supabase/supabase.service.ts
```

### Electron 主进程
```
✅ src/main/index.ts (IPC 处理器框架)
✅ src/main/services/ai-trend-publish/index.ts (服务框架)
```

---

## ❌ 未完成迁移 (54/61)

### 🔥 高优先级 - 核心功能 (必须迁移)

#### 1. Providers - AI 服务提供商 (8 个文件)
```
❌ src/providers/llm/together.ts
❌ src/providers/llm/qwen.ts
❌ src/providers/llm/deepseek.ts
❌ src/providers/llm/iflytek.ts
❌ src/providers/llm/index.ts
❌ src/providers/embedding/jina.ts
❌ src/providers/embedding/index.ts
❌ src/providers/reranker/jina.ts
❌ src/providers/reranker/index.ts
❌ src/providers/interfaces/llm.ts
❌ src/providers/interfaces/embedding.ts
❌ src/providers/interfaces/reranker.ts
❌ src/providers/interfaces/index.ts
❌ src/providers/manager.ts
❌ src/providers/index.ts
```

**为什么重要**: 没有这些，用户无法使用任何 AI 功能

#### 2. Queue - 队列系统 (2 个文件)
```
❌ src/queue/service.ts
❌ src/queue/index.ts
```

**为什么重要**: 工作流需要异步队列处理

#### 3. Scheduler - 调度系统 (3 个文件)
```
❌ src/scheduler/cron.service.ts
❌ src/scheduler/index.ts
```

**为什么重要**: 定时任务依赖调度器

#### 4. Workflows - 工作流引擎 (7 个文件)
```
❌ src/workflows/engine.ts
❌ src/workflows/interfaces.ts
❌ src/workflows/index.ts
❌ src/workflows/weixin-article.workflow.ts
❌ src/workflows/weixin-aibench.workflow.ts
❌ src/workflows/weixin-hellogithub.workflow.ts
```

**为什么重要**: 工作流是核心业务逻辑

#### 5. Data Sources - 数据源 (6 个文件)
```
❌ src/data-sources/firecrawl.ts
❌ src/data-sources/jina.ts
❌ src/data-sources/twitter.ts
❌ src/data-sources/interfaces/index.ts
❌ src/data-sources/index.ts
```

**为什么重要**: 数据采集是主要功能

#### 6. Notifications - 通知系统 (7 个文件)
```
❌ src/notifications/bark.provider.ts
❌ src/notifications/dingtalk.provider.ts
❌ src/notifications/feishu.provider.ts
❌ src/notifications/interfaces.ts
❌ src/notifications/manager.ts
❌ src/notifications/index.ts
```

**为什么重要**: 工作流状态通知

#### 7. Services - 服务层 (1 个文件)
```
❌ src/services/vector.service.ts
```

**为什么重要**: 向量搜索功能

---

### 🔧 中优先级 - 重要功能 (应该迁移)

#### 8. API 层 (7 个文件)
```
❌ src/api/data-sources.ts
❌ src/api/index.ts
❌ src/api/providers.ts
❌ src/api/queue.ts
❌ src/api/scheduler.ts
❌ src/api/templates.ts
❌ src/api/vector.ts
❌ src/api/workflows.ts
```

**说明**: 这些可能不需要，因为已经用 IPC 替代了

#### 9. Utils - 工具类 (4 个文件)
```
❌ src/utils/config.ts
❌ src/utils/logger.ts
❌ src/utils/uuid.ts
```

**说明**: 部分可能需要迁移

#### 10. Bootstrap (1 个文件)
```
❌ src/bootstrap.ts
```

#### 11. Server (1 个文件)
```
❌ src/server/index.ts
```

**说明**: 可能不需要，因为使用 Electron

#### 12. Types (1 个文件)
```
❌ src/types/index.ts
```

#### 13. Electron (2 个文件)
```
❌ src/electron/main.ts
❌ src/electron/preload.ts
```

**说明**: 需要适配 Electron 结构

---

## 📦 依赖包迁移

需要添加的 npm 依赖：

### Queue
```json
{
  "bullmq": "^5.0.0",
  "ioredis": "^5.3.0"
}
```

### Scheduler
```json
{
  "node-cron": "^3.0.3"
}
```

### Providers
```json
{
  "@togethercrew/api": "^2.0.0",
  "@togethercrew/tc-api-types": "^2.0.0"
}
```

### Data Sources
```json
{
  "firecrawl": "^1.0.0",
  "twitter-api-v2": "^1.16.0"
}
```

### Utils
```json
{
  "uuid": "^9.0.0",
  "winston": "^3.11.0"
}
```

---

## 🎯 迁移计划

### 阶段 1: 基础设施 (Priority 1)
1. ✅ Database (已完成)
2. 🔄 Utils (迁移 config.ts, logger.ts, uuid.ts)
3. 🔄 Types (迁移到 DTO 中)

### 阶段 2: 核心服务 (Priority 2)
1. 🔄 Providers (LLM, Embedding, Reranker)
2. 🔄 Queue (BullMQ 实现)
3. 🔄 Scheduler (Cron 实现)
4. 🔄 Vector Service (完善实现)

### 阶段 3: 业务逻辑 (Priority 3)
1. 🔄 Data Sources (Firecrawl, Jina, Twitter)
2. 🔄 Workflow Engine (完整实现)
3. 🔄 Workflows (微信文章等)

### 阶段 4: 通知系统 (Priority 4)
1. 🔄 Notifications (Bark, 钉钉, 飞书)

### 阶段 5: 集成测试 (Priority 5)
1. 🔄 端到端测试
2. 🔄 性能优化
3. 🔄 错误处理完善

---

## 📝 迁移清单模板

每个文件迁移时需要：

1. **复制文件** - 从源项目到目标项目
2. **调整导入** - 适应 Electron 结构
3. **修改路径** - 更新相对路径
4. **测试编译** - 确保 TypeScript 通过
5. **更新依赖** - 添加 npm 包
6. **验证功能** - 测试实际功能

---

## ⚠️ 风险评估

- **代码复杂性**: 高 - 需要理解 54 个文件的关系
- **依赖关系**: 高 - 文件间依赖复杂
- **测试难度**: 高 - 需要端到端测试
- **预计时间**: 2-3 周全职工作

---

## 🎯 结论

当前项目只有数据库层和 IPC 框架，没有实际业务逻辑。要实现完整功能，需要迁移剩余的 54 个文件（约 15,000+ 行代码）。

**建议**: 立即开始迁移工作，按优先级分阶段进行。

---

*清单生成时间: 2024年12月2日*
*文件统计: 源项目 61 文件 vs 当前项目 7 文件*
