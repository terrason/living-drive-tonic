# Specification — ldt-trace Category & Aggregation Model

---

# 1. 输入模型

每个事件包含：

- path: string（绝对路径字符串）

系统不假设：

- 文件是否存在
- 是否为文件或目录
- 是否为合法 filesystem path

---

# 2. category 定义

category 是字符串规则，有两种形式：

---

## 2.1 普通 category
```
/a/b
```

规则：

- 所有以 `/a/b` 开头的路径命中该 category

---

## 2.2 子目录 category
```
/a/b/
```

规则：

- `/a/b` 下一级目录作为 bucket

行为：

- `/a/b/c/x` → `/a/b/c`
- `/a/b/file.txt` → `/a/b/file.txt`

---

# 3. 匹配规则

匹配流程：

1. 按 category 排序（路径更深的优先）
2. 遍历 category
3. 满足 prefix 条件即命中
4. first match wins
5. 未命中 → `__UNMATCHED__`

---

# 4. category 排序规则

排序依据：

- path depth 降序

目的：

> 更具体规则优先匹配

---

# 5. unmatched 规则

未匹配路径：

- bucket = `__UNMATCHED__`
- 计数 +1
- 写入 stats 表

---

# 6. counter 模型

内存结构：

- Map<string, number>

语义：

- key = bucket
- value = flush 周期内增量

---

# 7. flush 语义

flush 行为：

1. 当前 active buffer swap 成 flush buffer
2. active buffer 立即重置
3. flush buffer 写入 SQLite
4. 失败则重试

特点：

- ingestion 不暂停
- flush 可重试
- 不丢增量

---

# 8. 持久化语义

SQLite 表：

- stats(path PRIMARY KEY, count)

写入语义：

- UPSERT + increment

---

# 9. 一致性语义

系统保证：

- at-least-once aggregation
- 不保证 exactly-once
- 允许重复计数（极小概率）

---

# 10. 特殊约束

- 不做 path normalization
- 不使用 filesystem API
- 不解析 symlink
- 不处理 . 或 .. 路径语义