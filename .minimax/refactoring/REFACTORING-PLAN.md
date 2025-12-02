# Trends-Fusion 重构计划

## 项目概览

**目标**: 通过系统性重构，提高代码可读性、鲁棒性和可扩展性，同时保持现有功能完整

**范围**: 全栈重构（主进程 + 渲染进程 + 数据库层）

**预计周期**: 3-4个阶段，每个阶段1-2周

---

## 1. 重构优先级矩阵

### 🔴 P0 - 立即执行（高影响，低风险）

#### 1.1 拆分主进程入口文件
- **文件**: `src/main/index.ts` (802行)
- **问题**: 功能耦合严重，包含初始化、窗口管理、IPC处理器
- **方案**: 拆分为多个模块
  - `main/init/` - 应用初始化逻辑
  - `main/window/` - 窗口管理
  - `main/ipc/` - IPC处理器
  - `main/events/` - 应用事件监听器
- **预估**: 3-4天

#### 1.2 完善服务层导出
- **文件**: `src/main/services/index.ts`
- **问题**: 只导出2个服务，缺失5个服务
- **方案**: 添加所有服务导出，创建统一服务管理器
- **预估**: 1天

#### 1.3 移除开发阶段代码
- **问题**: console.log语句、开发日志
- **文件**: 5个文件存在console.log
- **方案**: 替换为logger调用，统一日志级别
- **预估**: 1天

---

### 🟡 P1 - 短期执行（高影响，中风险）

#### 2.1 重构数据库DAO层
- **文件**: `src/main/database/sqlite/sqlite.service.ts` (1249行)
- **问题**: 单体文件包含所有DAO操作
- **方案**: 按业务领域拆分
  ```
  src/main/database/dao/
  ├── config.dao.ts
  ├── template.dao.ts
  ├── data-source.dao.ts
  ├── workflow.dao.ts
  └── published-content.dao.ts
  ```
- **预估**: 5-6天

#### 2.2 拆分数据采集组件
- **文件**: `src/renderer/src/components/collection/CollectionDashboard.tsx` (918行)
- **问题**: 单一组件处理所有采集功能
- **方案**: 拆分为功能模块
  ```
  components/collection/
  ├── Dashboard/
  │   ├── index.tsx (主容器)
  │   ├── StatsPanel.tsx
  │   ├── SourceList.tsx
  │   └── SchedulePanel.tsx
  ├── CollectionHistory/
  │   ├── index.tsx
  │   ├── HistoryTable.tsx
  │   └── HistoryDetail.tsx
  └── DataPreview/
      ├── index.tsx
      ├── Filters.tsx
      └── PreviewTable.tsx
  ```
- **预估**: 4-5天

#### 2.3 重构数据采集Hook
- **文件**: `src/renderer/src/hooks/useCollection.tsx` (868行)
- **问题**: Hook处理过多职责
- **方案**: 按功能拆分
  ```
  hooks/useCollection/
  ├── index.ts (主hook，组合子hooks)
  ├── useDataSources.ts
  ├── useCollectionHistory.ts
  ├── useCollectedItems.ts
  ├── useFilters.ts
  └── useExport.ts
  ```
- **预估**: 3-4天

---

### 🟢 P2 - 中期执行（中影响，中风险）

#### 3.1 服务层模块化
- **文件**: `src/main/services/data-analysis.service.ts` (587行)
- **问题**: 分析引擎职责过重
- **方案**: 创建子模块
  ```
  services/data-analysis/
  ├── index.ts (主服务)
  ├── keyword-analyzer.ts
  ├── temporal-analyzer.ts
  ├── trend-detector.ts
  └── anomaly-detector.ts
  ```

#### 3.2 配置服务重构
- **文件**: `src/main/services/config.service.ts` (461行)
- **问题**: 配置加载逻辑复杂，错误处理不一致
- **方案**: 添加类型安全的配置解析器，统一错误处理

#### 3.3 导出服务优化
- **文件**: `src/main/services/export.service.ts` (440行)
- **问题**: 导出逻辑与格式处理耦合
- **方案**: 创建策略模式支持多种格式

---

### 🔵 P3 - 长期执行（低影响，低风险）

#### 4.1 类型系统优化
- **问题**: DTO类型定义分散
- **方案**: 创建集中式类型定义模块
- **位置**: `src/shared/types/`

#### 4.2 错误处理标准化
- **问题**: 51个try-catch，模式不统一
- **方案**: 创建ErrorBoundary和统一错误处理中间件

#### 4.3 依赖注入容器
- **问题**: 服务间依赖管理混乱
- **方案**: 引入IoC容器（如typedi）

---

## 2. 详细实施方案

### 阶段1: 代码清理和结构优化（Week 1-2）

#### Day 1-2: 主进程拆分
```
src/main/
├── index.ts (保留应用启动逻辑)
├── init/
│   ├── app-init.ts (应用初始化)
│   ├── database-init.ts (数据库初始化)
│   └── service-init.ts (服务初始化)
├── window/
│   ├── window-manager.ts
│   ├── window-config.ts
│   └── window-events.ts
└── ipc/
    ├── handlers/
    │   ├── collection-handlers.ts
    │   ├── workflow-handlers.ts
    │   └── config-handlers.ts
    └── index.ts
```

**实施步骤**:
1. 创建新目录结构
2. 迁移功能到对应模块
3. 更新导入路径
4. 运行测试验证功能
5. 删除原始文件

**风险控制**: 每迁移一个模块就运行一次构建验证

#### Day 3: 服务层导出完善
- 更新 `services/index.ts` 导出所有服务
- 创建 `services/registry.ts` 管理服务生命周期
- 统一服务实例化模式

#### Day 4-5: 日志系统统一
- 移除所有 `console.log`
- 替换为 `logger` 调用
- 定义日志级别规范
- 添加结构化日志记录

---

### 阶段2: 数据库层重构（Week 3-4）

#### Day 6-10: DAO层拆分

**实施策略**:
1. 每次拆分1个DAO类，测试通过后继续
2. 保持SQLiteService作为数据库连接管理器
3. 逐步迁移DAO方法

**具体步骤**:
1. 创建 `dao/` 目录
2. 提取Config DAO (50-80行)
3. 提取Template DAO (80-120行)
4. 提取DataSource DAO (120-150行)
5. 提取Workflow DAO (150-200行)
6. 测试所有CRUD操作

**风险控制**:
- 每个DAO拆分后立即运行集成测试
- 验证数据库操作完整性
- 保留原始SQLiteService直到所有DAO验证通过

#### Day 11-12: DAO接口优化
- 创建DAO接口定义
- 实现DAO抽象基类
- 添加DAO工厂模式

---

### 阶段3: 前端组件重构（Week 5-6）

#### Day 13-17: 组件拆分

**实施策略**:
1. 先创建新组件目录结构
2. 逐步提取子组件
3. 使用Storybook验证UI组件
4. 保持功能完整性

**具体实施**:
```
# Day 13: 创建目录结构和类型定义
mkdir -p src/renderer/src/components/collection/{Dashboard,History,DataPreview}
创建组件间通信的types

# Day 14-15: 提取Dashboard子组件
- StatsPanel (显示统计信息)
- SourceList (数据源列表)
- SchedulePanel (调度配置)

# Day 16-17: 提取History和DataPreview子组件
- HistoryTable (历史记录表格)
- HistoryDetail (历史详情)
- Filters (过滤器)
- PreviewTable (预览表格)
```

**风险控制**:
- 每个组件拆分后立即在Storybook中验证
- 运行E2E测试确保交互正常
- 使用React.memo优化性能

#### Day 18: Hook拆分

**实施步骤**:
1. 创建 `hooks/useCollection/` 目录
2. 拆分 `useDataSources.ts` (150行)
3. 拆分 `useCollectionHistory.ts` (200行)
4. 拆分 `useCollectedItems.ts` (200行)
5. 拆分 `useFilters.ts` (150行)
6. 拆分 `useExport.ts` (100行)
7. 创建主 `index.ts` 组合所有hooks

**风险控制**:
- 每个子hook独立测试
- 确保数据类型一致性
- 验证错误处理逻辑

---

### 阶段4: 服务层优化（Week 7-8）

#### Day 19-21: 数据分析服务重构
```
src/main/services/data-analysis/
├── index.ts (主入口，组合分析器)
├── analyzers/
│   ├── keyword-analyzer.ts (词频分析)
│   ├── temporal-analyzer.ts (时间模式分析)
│   ├── trend-detector.ts (趋势检测)
│   └── anomaly-detector.ts (异常检测)
└── types/
    └── analysis-types.ts
```

**实施策略**:
1. 创建分析器接口定义
2. 实现每个分析器
3. 在主服务中组合分析器
4. 保持向后兼容

#### Day 22-23: 配置服务优化
- 添加配置Schema验证
- 统一错误处理模式
- 添加配置热重载
- 优化性能（缓存、懒加载）

#### Day 24-25: 导出服务优化
- 实现策略模式
- 支持更多导出格式
- 优化大文件处理
- 添加导出进度跟踪

---

## 3. 风险控制策略

### 3.1 功能完整性保障

#### 测试驱动重构
```bash
# 重构前必须通过所有测试
pnpm test

# 每个重构步骤后立即运行测试
pnpm test:unit
pnpm test:e2e
```

#### 渐进式迁移
- **永不在原文件上直接重构**
- 创建新文件 → 迁移功能 → 验证 → 删除旧文件
- 使用Git分支隔离重构工作

#### 快照对比
```bash
# 每个阶段完成后生成快照
git add .
git commit -m "refactor: Stage X completed - snapshot"

# 定期与主分支对比
git diff main --stat
```

### 3.2 性能保障

#### 性能基准测试
- 重构前记录关键性能指标
- 重构后对比性能变化
- 重点监控: 启动时间、数据库查询时间、UI渲染时间

#### 代码分割
- 避免引入不必要的依赖
- 使用动态导入优化加载时间
- 监控bundle大小

### 3.3 回滚策略

#### Git分支策略
```bash
# 创建专门的重构分支
git checkout -b refactor/code-quality

# 每个子阶段创建临时分支
git checkout -b refactor/split-main-process
# ... 完成工作 ...
git merge --no-ff refactor/split-main-process
# 验证后删除临时分支
```

#### 备份点
- 每完成一个P0任务创建备份点
- 完整功能测试通过后推进下一个任务
- 发现问题立即回滚到最近的备份点

---

## 4. 代码质量标准

### 4.1 文件大小限制
- **最大行数**: 200行/文件
- **最大复杂度**: Cyclomatic complexity < 10
- **最大函数长度**: 50行/函数
- **最大参数数量**: 5个/函数

### 4.2 架构原则
- **单一职责**: 每个模块只负责一个功能
- **依赖倒置**: 依赖抽象而非具体实现
- **开闭原则**: 对扩展开放，对修改封闭
- **接口隔离**: 最小化接口原则

### 4.3 命名规范
- **类名**: PascalCase (如: `DataAnalysisService`)
- **文件名**: kebab-case (如: `data-analysis.service.ts`)
- **函数名**: camelCase (如: `getDataSources`)
- **常量**: SCREAMING_SNAKE_CASE (如: `MAX_RETRY_COUNT`)

---

## 5. 验证清单

### 5.1 单元测试
- [ ] 所有新增模块有对应单元测试
- [ ] 测试覆盖率 > 80%
- [ ] 关键路径100%覆盖
- [ ] 边界条件测试完整

### 5.2 集成测试
- [ ] 数据库操作测试
- [ ] IPC通信测试
- [ ] 组件交互测试
- [ ] 服务间依赖测试

### 5.3 性能测试
- [ ] 应用启动时间 < 3秒
- [ ] 数据库查询 < 500ms
- [ ] UI渲染 < 100ms
- [ ] 内存使用稳定

### 5.4 代码审查
- [ ] 同行评审通过
- [ ] 架构师评审通过
- [ ] 安全评审通过
- [ ] 性能评审通过

---

## 6. 实施时间表

| 周次 | 任务 | 预估工作量 | 风险等级 |
|------|------|------------|----------|
| Week 1 | P0任务: 主进程拆分 + 服务导出 | 5天 | 低 |
| Week 2 | P0任务: 日志清理 + DAO拆分准备 | 5天 | 低 |
| Week 3 | P1任务: DAO层拆分(50%) | 5天 | 中 |
| Week 4 | P1任务: DAO层拆分(50%) | 5天 | 中 |
| Week 5 | P1任务: 前端组件拆分(50%) | 5天 | 中 |
| Week 6 | P1任务: Hook拆分 + 测试 | 5天 | 中 |
| Week 7 | P2任务: 服务层优化(50%) | 5天 | 中 |
| Week 8 | P2任务: 服务层优化(50%) + 验证 | 5天 | 中 |
| Week 9-10 | P3任务 + 整体优化 | 10天 | 低 |

**总计**: 约50个工作日，2.5个月

---

## 7. 成功指标

### 7.1 质量指标
- ✅ 代码行数减少30% (主要文件)
- ✅ 测试覆盖率 > 80%
- ✅ 复杂度降低20%
- ✅ 代码重复率 < 5%

### 7.2 性能指标
- ✅ 启动时间不增加
- ✅ 内存使用优化10%
- ✅ 数据库查询性能不降低
- ✅ UI响应时间保持稳定

### 7.3 可维护性指标
- ✅ 新功能开发时间减少20%
- ✅ Bug修复时间减少30%
- ✅ 代码审查时间减少40%
- ✅ 新开发者上手时间减少50%

---

## 8. 注意事项

### 8.1 禁止事项
- ❌ 不允许在重构期间添加新功能
- ❌ 不允许跳过测试步骤
- ❌ 不允许一次性重构多个大文件
- ❌ 不允许忽略TypeScript类型检查

### 8.2 强制要求
- ✅ 每完成一个小任务立即测试
- ✅ 保持Git提交历史清晰
- ✅ 及时更新相关文档
- ✅ 与团队成员同步进度

### 8.3 沟通机制
- **每日站会**: 同步进度，识别阻塞
- **每周评审**: 演示成果，收集反馈
- **问题升级**: 遇到阻塞立即升级
- **变更管理**: 所有变更需要评审

---

## 9. 附录

### 9.1 相关资源
- 重构最佳实践: [Refactoring.Guru](https://refactoring.guru)
- TypeScript严格模式: [TS官方文档](https://www.typescriptlang.org/tsconfig#strict)
- Electron最佳实践: [Electron安全指南](https://electronjs.org/docs/tutorial/security)

### 9.2 工具推荐
- **代码格式化**: Prettier
- **代码检查**: ESLint
- **性能分析**: Chrome DevTools
- **内存分析**: Electron Memory Info
- **依赖分析**: webpack-bundle-analyzer

---

**文档版本**: v1.0
**最后更新**: 2025-12-02
**负责人**: [开发团队]
**状态**: 待评审
