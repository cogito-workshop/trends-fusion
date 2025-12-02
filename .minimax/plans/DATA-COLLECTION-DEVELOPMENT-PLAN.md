# 🚀 Data Collection模块开发计划

## 📋 开发概述

基于架构分析，Data Collection模块需要从**UI原型**转换为**功能完整的数据采集系统**。本计划将系统性地实现真实的数据采集功能。

---

## 🎯 开发阶段规划

### 阶段1: 后端数据采集引擎开发 (预估: 3-4天)

#### 任务1.1: 集成Firecrawl API (优先级: 🔴最高)
- [ ] **安装Firecrawl SDK**
  ```bash
  pnpm add @firecrawl/api
  ```

- [ ] **实现真实采集逻辑** (firecrawl.ts)
  - 替换`scrapeUrl()`中的mock数据
  - 集成Firecrawl API调用
  - 实现HTML解析和内容提取
  - 添加错误处理和重试机制

- [ ] **API密钥验证** (firecrawl.ts)
  - 验证Firecrawl API密钥有效性
  - 实现真实的`validateConfig()`方法
  - 添加API配额检查

- [ ] **单元测试** (firecrawl.test.ts)
  - 测试成功采集场景
  - 测试API密钥无效场景
  - 测试网络错误场景
  - 测试数据解析正确性

#### 任务1.2: 数据处理管道
- [ ] **内容清理和标准化**
  - 实现`sanitizeContent()`方法
  - HTML标签去除
  - 特殊字符处理
  - 文本截断和格式化

- [ ] **数据验证**
  - 验证采集的数据完整性
  - 过滤无效内容
  - 去重算法实现
  - 数据格式标准化

#### 任务1.3: 数据存储设计
- [ ] **数据库表设计**
  ```sql
  -- 数据源配置表
  CREATE TABLE data_sources (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'api', 'scrape', 'rss', 'webhook'
    url TEXT NOT NULL,
    config TEXT, -- JSON配置
    status TEXT DEFAULT 'inactive',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 采集记录表
  CREATE TABLE collection_history (
    id INTEGER PRIMARY KEY,
    source_id INTEGER,
    type TEXT, -- 'manual', 'scheduled', 'test'
    status TEXT, -- 'success', 'failed', 'in-progress'
    start_time DATETIME,
    end_time DATETIME,
    items_collected INTEGER DEFAULT 0,
    error_message TEXT,
    logs TEXT, -- JSON格式日志数组
    FOREIGN KEY (source_id) REFERENCES data_sources(id)
  );

  -- 采集内容表
  CREATE TABLE collected_items (
    id INTEGER PRIMARY KEY,
    source_id INTEGER,
    title TEXT,
    content TEXT,
    url TEXT,
    author TEXT,
    published_at DATETIME,
    category TEXT,
    tags TEXT, -- JSON数组
    status TEXT DEFAULT 'new', -- 'new', 'processed', 'filtered'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES data_sources(id)
  );

  -- 过滤规则表
  CREATE TABLE filter_rules (
    id INTEGER PRIMARY KEY,
    source_id INTEGER,
    name TEXT NOT NULL,
    type TEXT, -- 'keyword', 'regex', 'category', 'time'
    conditions TEXT, -- JSON数组
    action TEXT, -- 'include', 'exclude'
    enabled BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES data_sources(id)
  );

  -- 采集计划表
  CREATE TABLE collection_schedules (
    id INTEGER PRIMARY KEY,
    source_id INTEGER,
    name TEXT NOT NULL,
    cron_expression TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    last_run DATETIME,
    next_run DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES data_sources(id)
  );
  ```

- [ ] **数据库操作方法** (src/main/database/collection.dao.ts)
  - DataSource CRUD操作
  - CollectionHistory 记录操作
  - CollectedItems 查询和管理
  - FilterRules 规则管理
  - CollectionSchedules 计划管理

#### 任务1.4: IPC Handlers实现
- [ ] **完善data-sources:* handlers** (main/index.ts)
  - 实现真实的数据库操作
  - 添加数据验证
  - 添加错误处理
  - 返回格式标准化

- [ ] **新增采集相关IPC**
  - `collection:start` - 开始手动采集
  - `collection:stop` - 停止采集任务
  - `collection:status` - 获取采集状态
  - `collection:history` - 获取采集历史
  - `collection:items` - 获取采集内容

#### 任务1.5: 单元测试 (Vitest)
- [ ] **数据源测试** (tests/collection/data-source.test.ts)
  - CRUD操作测试
  - 配置验证测试
  - API集成测试

- [ ] **采集引擎测试** (tests/collection/collector.test.ts)
  - 采集流程测试
  - 错误处理测试
  - 数据质量测试

- [ ] **数据库测试** (tests/collection/dao.test.ts)
  - DAO操作测试
  - 事务测试
  - 性能测试

---

### 阶段2: 前端与后端集成 (预估: 2-3天)

#### 任务2.1: 重构useCollection Hook
- [ ] **替换Mock数据为真实API调用**
  ```typescript
  // useCollection.tsx 改造
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // 调用IPC获取真实数据
        const sources = await window.electron.ipcRenderer.invoke('data-sources:list')
        const history = await window.electron.ipcRenderer.invoke('collection:history')
        const items = await window.electron.ipcRenderer.invoke('collection:items')
        setDataSources(sources)
        setHistoryRecords(history)
        setCollectedItems(items)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])
  ```

- [ ] **实现真实CRUD操作**
  - createDataSource: 调用IPC创建数据源
  - updateDataSource: 调用IPC更新数据源
  - deleteDataSource: 调用IPC删除数据源
  - testDataSource: 调用后端API测试连接
  - syncDataSource: 调用IPC执行采集

#### 任务2.2: 添加实时状态更新
- [ ] **采集进度显示**
  - WebSocket或IPC实时推送采集进度
  - 采集状态实时更新
  - 错误信息实时反馈

- [ ] **统计数据显示**
  - 真实的统计数据计算
  - 今日采集量统计
  - 成功率统计（基于真实数据）
  - 去重率统计（基于真实数据）

#### 任务2.3: 错误处理和用户反馈
- [ ] **错误提示组件**
  - Toast通知组件
  - 错误对话框
  - 操作失败反馈

- [ ] **加载状态优化**
  - 骨架屏加载效果
  - 按钮loading状态
  - 数据加载进度条

#### 任务2.4: 前端单元测试 (Vitest)
- [ ] **Hook测试** (tests/renderer/useCollection.test.tsx)
  - Mock IPC调用
  - 测试数据流
  - 测试错误处理

- [ ] **组件测试** (tests/renderer/CollectionDashboard.test.tsx)
  - 渲染测试
  - 交互测试
  - 状态管理测试

---

### 阶段3: 高级功能开发 (预估: 2-3天)

#### 任务3.1: 过滤系统
- [ ] **过滤器引擎**
  - 关键词过滤
  - 正则表达式过滤
  - 分类过滤
  - 时间范围过滤

- [ ] **过滤规则应用**
  - 采集时实时过滤
  - 过滤结果预览
  - 过滤规则测试

#### 任务3.2: 定时采集系统
- [ ] **Cron调度器**
  - 集成node-cron
  - 计划任务管理
  - 动态计划修改

- [ ] **后台任务执行**
  - 采集任务队列
  - 并发控制
  - 任务监控

#### 任务3.3: 数据导出功能
- [ ] **多格式导出**
  - JSON格式
  - CSV格式
  - Markdown格式

- [ ] **批量操作**
  - 批量删除
  - 批量标记状态
  - 批量导出

#### 任务3.4: 数据分析功能
- [ ] **趋势分析**
  - 采集量趋势图
  - 来源分析
  - 时间分布分析

- [ ] **质量分析**
  - 内容质量评分
  - 重复内容统计
  - 错误率统计

---

### 阶段4: 性能优化和测试 (预估: 1-2天)

#### 任务4.1: 性能优化
- [ ] **采集性能优化**
  - 并发采集控制
  - 请求频率限制
  - 数据分页加载

- [ ] **前端性能优化**
  - 虚拟列表（大数据量）
  - 懒加载
  - 缓存策略

#### 任务4.2: 完整测试
- [ ] **集成测试**
  - 端到端采集流程
  - 前后端集成测试
  - 数据库集成测试

- [ ] **压力测试**
  - 大数据量采集测试
  - 并发采集测试
  - 长时间运行稳定性测试

#### 任务4.3: 文档完善
- [ ] **API文档**
  - IPC接口文档
  - 数据库Schema文档
  - 配置说明文档

- [ ] **用户手册**
  - 数据源配置指南
  - 过滤规则使用说明
  - 定时采集设置指南

---

## 📅 详细时间安排

| 阶段 | 任务 | 预估时间 | 关键交付物 |
|------|------|----------|------------|
| **阶段1** | 后端数据采集引擎 | 3-4天 | 真实采集功能、数据库设计、单元测试 |
| **阶段2** | 前后端集成 | 2-3天 | 真实数据流、错误处理、前端测试 |
| **阶段3** | 高级功能 | 2-3天 | 过滤系统、定时采集、数据分析 |
| **阶段4** | 优化和测试 | 1-2天 | 性能优化、集成测试、文档 |
| **总计** | | **8-12天** | 完整的数据采集系统 |

---

## 🔧 技术栈和依赖

### 后端依赖
```json
{
  "@firecrawl/api": "^1.0.0",
  "axios": "^1.6.0",
  "cheerio": "^1.0.0-rc.12",
  "node-cron": "^3.0.3",
  "uuid": "^9.0.1"
}
```

### 前端依赖
```json
{
  "react-query": "^3.39.0",
  "zustand": "^4.4.0",
  "date-fns": "^2.30.0"
}
```

### 测试依赖
```json
{
  "vitest": "^1.0.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^6.1.0",
  "msw": "^2.0.0"
}
```

---

## 🎯 里程碑检查点

### 里程碑1: 基础采集功能 (第4天)
- ✅ Firecrawl API集成完成
- ✅ 真实数据采集返回非mock数据
- ✅ 数据源CRUD操作正常工作
- ✅ 单元测试覆盖率 > 80%

### 里程碑2: 完整数据流 (第7天)
- ✅ 前后端完全集成
- ✅ useCollection Hook使用真实API
- ✅ 所有UI操作有真实反馈
- ✅ 数据持久化到SQLite

### 里程碑3: 高级功能 (第10天)
- ✅ 过滤系统正常工作
- ✅ 定时采集任务执行
- ✅ 数据分析功能可用
- ✅ 集成测试全部通过

### 里程碑4: 发布就绪 (第12天)
- ✅ 性能优化完成
- ✅ 完整文档交付
- ✅ 端到端测试通过
- ✅ 用户验收测试通过

---

## ⚠️ 风险和缓解措施

### 风险1: Firecrawl API限制
- **缓解**: 实现多数据源支持（不依赖单一API）
- **备选**: 备用爬虫方案（Puppeteer + 自建解析器）

### 风险2: 数据量过大性能问题
- **缓解**: 分页加载、虚拟列表、懒加载
- **监控**: 性能指标收集和告警

### 风险3: 第三方网站反爬策略
- **缓解**: 请求频率控制、User-Agent轮换、代理池
- **合规**: 遵守robots.txt、设置合理延迟

### 风险4: 数据质量不稳定
- **缓解**: 多层验证、去重算法、人工审核机制
- **监控**: 数据质量指标统计

---

## 📝 验收标准

### 功能验收
1. **能够成功采集真实网页数据**
   - 至少支持3个不同网站
   - 数据完整性 > 95%
   - 采集成功率 > 90%

2. **数据源管理完整可用**
   - 创建/编辑/删除数据源
   - 配置持久化保存
   - 状态实时更新

3. **过滤和计划功能正常**
   - 过滤规则生效
   - 定时任务执行
   - 历史记录完整

### 性能验收
1. **响应时间**
   - 页面加载 < 2秒
   - 数据采集 < 30秒/100条
   - 搜索响应 < 500ms

2. **稳定性**
   - 连续运行24小时无崩溃
   - 内存泄漏 < 10MB/小时
   - 错误率 < 5%

### 测试验收
1. **单元测试覆盖率** > 80%
2. **集成测试覆盖**所有关键流程
3. **端到端测试**用户操作路径

---

## 💡 额外增强功能 (Phase 2)

如果时间允许，可以实现以下增强功能：

### 1. AI智能分析
- 自动分类和标签
- 内容摘要生成
- 相似内容推荐

### 2. 多数据源支持
- Twitter API集成
- Reddit API集成
- RSS订阅源支持
- 自定义WebSocket源

### 3. 数据可视化
- 采集趋势图表
- 来源分布饼图
- 内容词云图
- 实时监控大屏

### 4. 协作功能
- 采集任务共享
- 数据评论和标注
- 团队协作空间
- 权限管理

---

## 📚 学习资源

### Firecrawl API
- [官方文档](https://docs.firecrawl.dev/)
- [GitHub仓库](https://github.com/firecrawl/firecrawl)

### 数据采集最佳实践
- [Web Scraping伦理指南](https://scrapehero.com/web-scraping-ethics/)
- [反爬虫策略应对](https://blog.apify.com/web-scraping-limitations/)

### 相关技术栈
- [Cheerio文档](https://cheerio.js.org/)
- [Node-Cron文档](https://github.com/node-cron/node-cron)
- [Vitest测试框架](https://vitest.dev/)

---

*开发计划创建时间: 2025年12月2日*
*预计完成时间: 2025年12月14日*
*项目状态: 🔴 需要完整开发*
