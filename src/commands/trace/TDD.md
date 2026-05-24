# Technical Design Document — ldt-trace

---

# 1. 系统结构

整体 pipeline：

```
fatrace stdout
    ↓
line reader
    ↓
JSON parse
    ↓
path extract
    ↓
category matcher
    ↓
counter update
    ↓
flush scheduler
    ↓
sqlite persist
```
---

# 2. 进程模型

单进程单 event loop：

- Bun runtime
- 子进程启动 fatrace
- stdout pipe 输入

---

# 3. 状态结构

系统维护两个 buffer：

- activeMap：接收写入
- flushMap：等待持久化

切换方式：

- swap reference
- activeMap reset

---

# 4. category matcher

输入：

- opPath: string

行为：

- 遍历已排序 category list
- prefix match
- first match wins
- 无匹配 → __UNMATCHED__

无任何 filesystem 操作

---

# 5. counter 更新

每次匹配：

- bucket count +1

无：

- 去重
- 时间窗口
- event replay

---

# 6. flush scheduler

周期触发：

- 每 N 分钟执行一次 flush
- N 由配置决定

流程：

1. swap buffer
2. write flushMap to sqlite
3. retry on failure

---

# 7. SQLite 写入

表结构：

- stats(path TEXT PRIMARY KEY, count INTEGER)

写入方式：

- transaction batch
- UPSERT increment

---

# 8. unmatched 处理

所有未命中路径：

- bucket = __UNMATCHED__
- 计数累加
- 写入 stats

---

# 9. 错误处理

## JSON parse error

- 忽略该行
- 可选日志记录

## fatrace crash

- flush 当前数据
- 进程退出
- systemd restart

---

# 10. shutdown 流程

收到 SIGTERM / SIGINT：

1. 停止 ingestion
2. flush 当前 buffer
3. 安全退出

---

# 11. 运行特性

- 单线程
- 无队列缓存设计
- 接受 backpressure
- 长期运行优化