# Architecture Decision Record — ldt-trace System Design

## Status
Accepted

## Date
2026-05-24

---

# 1. 背景

ldt-trace 是一个运行在本地 Linux 环境中的长期后台观测工具，用于分析文件系统写入行为，并识别高频写入目录。

它解决的问题是：

> 系统中哪些目录在持续产生写入热点？

---

# 2. 设计目标

系统目标：

- 长期运行稳定
- 低侵入性
- 关注趋势而非精确审计
- 单机使用
- 易于理解与维护

---

# 3. 非目标（Non-goals）

本系统明确不做：

- 精确 IO profiling
- 文件级历史审计
- 分布式 tracing
- 实时告警系统
- 复杂查询语言
- filesystem 语义解析（stat / realpath / symlink）

---

# 4. 核心架构决策

## 4.1 事件模型

所有文件写入事件统一处理为：

> path → +1 计数

不区分：

- 写入大小
- 进程来源
- 文件类型
- 事件类型

---

## 4.2 routing 机制（核心决策）

系统使用**纯字符串 routing 规则**：

- 不做路径规范化
- 不解析文件系统语义
- 不依赖路径是否存在

匹配方式：

> 按 category 顺序匹配，深路径优先，命中即停止

---

## 4.3 category 语义

category 是用户定义的路径规则，有两种形式：

### 1）普通前缀规则
```
/a/b
```

含义：

- 所有以该前缀开头的路径归入同一 bucket

---

### 2）子目录聚合规则
```
/a/b/
```

含义：

- `/a/b` 下的**一级子目录作为统计单位**
- 示例：
  - `/a/b/c/x` → `/a/b/c`
  - `/a/b/file.txt` → `/a/b/file.txt`

---

## 4.4 unmatched 处理

所有未匹配 category 的路径：

- 统一进入 `__UNMATCHED__` bucket
- 该 bucket 会被持久化到统计表中

用途：

> 帮助用户发现未覆盖的写入热点

---

## 4.5 状态模型

系统仅维护聚合状态：

- 不保存 raw event
- 不支持 replay
- 不记录历史轨迹

数据结构本质为：

> bucket → counter

---

## 4.6 flush 模型

采用双缓冲机制：

- active buffer：持续接收事件
- flush buffer：周期性写入数据库

特点：

- flush 不阻塞 ingestion
- flush 失败会重试
- 保证增量不会丢失
- flush 生命周期应有明确日志记录

---

## 4.7 日志模型

系统应在关键 lifecycle 阶段输出可追踪日志：

- 启动：配置加载、数据库初始化、fatrace 启动
- 事件处理：解析失败、未匹配路径、bucket 命中
- flush：开始、完成、失败与重试
- 关闭：shutdown initiated、flush completed、shutdown complete

日志目的：

- 提供故障排查点
- 记录运行状态和持久化行为
- 帮助确认 startup/flush/shutdown 是否正常执行

---

## 4.8 持久化模型

使用 SQLite：

- 仅保存最终聚合结果
- 使用 UPSERT 累加写入

语义：

> stats 表表示长期累计写入强度

---

## 4.8 一致性模型

系统保证：

- 至少一次（at-least-once）聚合语义
- 不保证严格一次（no exactly-once）
- 允许极小重复计数

---

# 5. 架构后果

## 优点

- 极简实现
- 高稳定性
- 长期运行安全
- 易于调试与理解
- 对系统侵入极低

## 缺点

- 不保证计数绝对精确
- 无事件回放能力
- routing 依赖字符串规则
- 用户需要手动优化 category

---

# 6. 核心原则

> 系统优化目标是“趋势可见性”，而不是“绝对精确性”
