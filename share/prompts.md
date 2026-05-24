COMMON
=============
项目名: Living Driver Tonic
编程语言: javascript
运行环境: linux + bun
多个子命令设计，使用stricli框架来分发子命令。

init
============

Let's finish `init` subcommand
这个命令主要是用来初始化目录结构，当前已知的有
/living/transient
/living/optional
/living/persistent
/living/critical
目前已有实现: `scripts/init.sh`， 我觉得应该在 `src/commands/init/` 里调用这个bash脚本。

`init` 子命令的文档(src/commands/init/command.ts:13:23)不合适，不要向用户透露技术细节，重新生成这个'description'


purge
============

Let's finish `purge` subcommand
这个命令主要是撤销init子命令的所有操作，我们需要在scripts目录下新建一个purge.sh，再在 `src/commands/purge/` 里调用purge.sh。请参考`src/commands/init/`的实现风格。


trace
============

现在开始实现 `trace` 子命令，这是一个很复杂的功能。我们先来详细探讨它的需求：
* 调用bash命令 `fatrace -t -c --filter="W+D<>"`，并跟踪它的输出流
* 解析输出流中的日志，提取时间和文件路径，把这个路径与数据库中配置的 _汇总目录_ 比对，更新匹配上的 _汇总目录_ 的次数属性(+1)
* 定时保存这个 "汇总目录 | 次数" 的表格到数据库中
以上是总体功能，如果有不理解的部分或缺少部分信息，请询问我

### 详细说明
* “汇总目录” 的匹配规则简单参考: 
  ```javascript
  /**
  * 判断路径是否匹配目录:
  * /home 可匹配 /home/a
  * /home 不匹配 /home2/a
  */
  function isPathUnderCategoryDir(optPath, categoryDir) {
    return optPath === categoryDir || optPath.startsWith(categoryDir + "/");
  }
  ```
  循环汇总目录数组进行判断，先匹配到哪个就哪个。这个列表应该是从数据库中查出，它的顺序由其他子命令来维护。
* “次数” 的统计方法
  每遇到一行日志，与汇总目录匹配，匹配上就给这个汇总目录的次数+1
* “定时保存” 的可靠性要求
  每隔一定时间就保存入库，这个时间从环境变量读取，正整数，单位为分钟。 
  如何支持其他命令触发和graceful shutdown，是否由较大改动还需讨论。 
* 更正bash命令为 `fatrace -cj --filter="W+D<>"`， 这样输出格式为json格式。去掉了时间输出，因为我们用不上。

以上是补充说明，请继续批判性地与我讨论需求

* 顺序即优先级，数据库表中的顺序由另外的命令来处理，修改该表会清空全部数据重新计数。实现方式已经超出 `trace` 子命令的需求范围，故不再讨论。
* 这是一个面向单用户单实例的程序，不会出现“运行期间配置更新”的情况，也不会同时运行多个。最终只在systemd的service文件调用。
* 每行日志 +1 这是确定的需求，目的就是要“找到最频繁发生文件系统活动”，“大顺序写”的目录不需要特地去找。
* flush时采用覆盖保存。 启动时从数据库中读取当前次数，内存中计数，flash时覆盖保存。次数不需要特别精确，允许少量丢数据。
* 你说的“trace 无法长期运行” 是怎么回事？
* 关于生命周期模型，发布后会集成到 systemd 中，调试时也会直接启动，然后 ctrl+c 结束。

以上补充是否足够，请继续批判性地与我讨论需求

* 对于“长期 daemon 病”，我要怎么解决这个问题？
* 你说的“逐行 JSON.parse 最容易炸 CPU”，这个真的会发生吗？我看fatrace的日志一次刷出来的好像也没多少。另外你给出的“line-buffered incremental parser”方案，我觉得它的代码不够优雅。
  如果这里真的是非常耗费cpu的地方，那还是去掉json输出，改成 `fatrace -c --filter="W+D<>"` 吧，提取文件路径也容易，可以用下面的代码:
  ```javascript
  /**
  * 提取日志路径
  * 格式:
  * 时间 进程(pid): 操作类型 路径
  *
  * 注意:
  * - 操作类型后空格数量不固定
  * - 路径可能有空格
  * - 忽略 "(deleted)" 单独记录
  */
  function extractPath(line) {
    // 找到冒号后部分
    const colonIndex = line.indexOf(":", 15);
    if (colonIndex === -1) return null;

    const afterColon = line.slice(colonIndex + 1).trim();
    if (!afterColon) return null;

    // afterColon 类似:
    // CW  /home/...
    // CD  (deleted)
    // CWO /home/a b c
    //
    // 第一个块包含fatrace操作类型，其后是路径
    const match = afterColon.match(/^[RWOC+D<>]+\s+(.+)$/);
    if (!match) return null;

    const filePath = match[1].trim();

    // 忽略根目录
    if (filePath === "/") return null;
    // 必须是路径，另外fatrace的日志中的路径一定是绝对路径
    if (!filePath.startsWith("/")) return null;

    return filePath;
  }
  ```
  这样是否能够降低cpu消耗，如果fatrace的日志一次chunk不多的话，应该用哪种合适
* 坏json行直接忽略，统计次数不需要特别精确
* flush 周期不会短，最短10分钟一次。graceful shutdown 时额外flush一次
* fatrace 意外终止时，本进程在flush一次后终止。
请详细解答我的疑问，如果没有需求上的问题，接下来进入架构设计阶段

好的，现在开始架构设计阶段，根据以上内容整理出本阶段的输出文档，然后再与我讨论细节

对于你的 Architecture Decision Record 我有几点改动意见:
* 文档中的 “二、fatrace 集成 --> 行读取策略” 中，任何不能识别的行需要输出到标准输出，作为INFO日志，并前置当前日期时间，例如： "INFO: 2026-05-23T12:56:32 \<ordinal log line\>"
* 文档中的 “三、Category 匹配模型 --> Category 配置" 中，启动时数据库中若不存在category数据，输出消息引导用户需要先使用 `ldt config` 命令去配置，然后退出本进程。
* 文档中的 “五、数据库模型"，请允许我固执的使用单张表策略，我的理由是这个项目很简单，暂不考虑后续变迁。
```sql
category (
    id,
    path,
    count
)
```
config` 命令去配置，然后退出本进程。
* 文档中的 “六、Flush 策略", 因为 category 不会太多（可能只有10，每一个都是用户手动配置的），所以不用考虑flush时太慢，甚至可以考虑单条sql更新
* 文档中的 “七、错误处理策略" 中, unmatched path 需要输出到标准输出，作为WARN日志，并前置当前日期时间，例如： "WARN: 2026-05-23T12:56:32 \<ordinal log line\>"

请综合考虑后，更新 ADR 文档。然后反思这个文档，是否符合行业标准，有没有遗漏或优化的地方，并与我讨论。

请综合下列说明后，更新 ADR 文档。
* 日志级别的问题确实不妥，unmatched path 的日志改成 DEBUG
* 日志暂时直接 console.log 。 虽然不抽象Logger层，但在输出新的文档后详细解释 journal integration 的实现供我学习。

假设遇到 `/home/abs/.cache/Code/....any/file`
* 如果配置了 `/home/abs/.cache/` ，那么就计入`/home/abs/.cache/Code` 目录
* 如果配置了 `/home/abs/.cache` （少了最后的`/`），那么就计入`/home/abs/.cache` 目录
* 如果没有匹配上任何配置，那么就计入"未知" 项
`categories.path` 存的是用户配置值（可能带 `/` 结尾），而 `stats.path` 存的是归一化后的真实汇总目录（不带尾随 `/`）。
* "未知" 是正式的配置，存在于表中，上层应用禁止用户修改或删除这条记录。
* fatrace 输出的json行大概长这样
    > {"comm":"code","pid":5904,"types":"W","device":{"major":8,"minor":2},"inode":5262366,"path":"/home/terrason/.config/Code/logs/20260523T120427/window1/exthost/vscode.github-authentication/GitHub Authentication.log"}
    {"comm":"firefox","pid":3963,"types":"+","device":{"major":8,"minor":2},"inode":5260349,"path":"/home/terrason/.cache/mozilla/firefox/324cva6r.default-release/startupCache"}
  不要管操作类型。

  ADR是否还有不清晰的地方需要改动，如果没有问题了，请修改ADR以使其清晰明了

* 关于匹配的伪代码
  ```javascript
  function loadCategories(){
    const categories=loadFromDb();
    // 这里需要排序下，路径层级越深越靠前，数据量不大不要纠结性能
    return categories.map(c=>{
      if(c.endWith("/")){
        return {path:c.slice(0,-1),isUsingSubDir:true};
      }else{
        return {path:c,isUsingSubDir:false};
      }
    });
  }

  const categoryConfigs=loadCategories();

  /**
   * 路径匹配
   * @param opPath fatrace中直接拿到的路径，一定不以'/'结尾
   * @param categoryConfigs 从categories表中加载的所有path
   * @return 待计数的path 或 null（计入未知）
   */
  function matchCategory (opPath: string, categoryConfigs: {path:string,isUsingSubDir:boolean}[]): string | null => {
      for (let category of categoryConfigs) {
          if (opPath === category.path){
              return category.path;
          }
          if (opPath.startsWith(category.path + "/")) {
              return category.isUsingSubDir
                ? opPath.slice(0, opPath.indexOf('/',category.path+2))
                : category.path
          }
      }
      return null;
  };

  type StatMap: Map<string, integer>
  ```
  以上代码仅用作说明逻辑，不要直接使用
* fatrace的日志中的路径一定是规范化的，不用考虑异常路径。
* categories表中不需要 {id:0,path:'未知'} 的配置数据，这部分原始文档中是错误的。matchCategory() 返回 null 就往 statMap 里以"未知"为键的值加1
* flush 时 update stats set count = count + ? , 这部分原始文档可能不正确

如果没有问题了，请修改ADR以使其清晰明了

修改ADR以使其清晰明了，输出我能直接复制的markdown格式

___________________

项目名: Living Driver Tonic
编程语言: javascript
运行环境: linux + bun

多个子命令设计，使用stricli框架来分发子命令。

当前正在设计 ldt-trace 子命令，请先参考这两个文档，

分析 `ADR.md` 文件中是否存在不清晰的地方，你需要改善这个文档，去掉大块伪代码，需要决策时与我沟通，当最终文档足够清晰时，重写`ADR.md`，以markdown源码形式输出。

_______________
1. `/a/b/` 配置时
  * `/a/b/c/.../file.txt` 归到 `/a/b/c` ， `...` 表示任意层级目录;
  * `/a/b/file.txt` 归到 `/a/b/file.txt`

2. `__UNMATCHED__` 的统计次数**需要**存入 `stats` 表
3. flush 失败时，内存中的增量是否必须完整回滚并重放

不要急着输出最终结果，你是否已经完全理解我的回答，是否还需要其他改善需要决策

________________
1. 你的假设正确。fatrace 的 path 不保证一定是文件，也不保证目标当时仍存在。“无法再切出一级子目录时，直接使用完整 opPath” 这个说明很好
2. 你的假设正确。category 允许重叠，但会进行 'normalized path depth descending' 排序，first match wins.
3. 你的假设正确。flush 时允许继续接收事件
  ```
  activeMap = new Map()
  flushMap = oldMap
  新事件继续进入新的 activeMap
  无暂停 ingestion
  ```
4. 你的假设正确。sqlite 写入需要UPSERT，单次 flush 使用一个 transaction
5. unmatched path 的 DEBUG 日志是否可能刷爆 journalctl？
  这个是需要用户根据日志去识别哪些高频目录我没有监听到，然后重新配置并更新categories表，这个过程不属于`ldt-trace` 的功能。 这个过程我没能想到可以由程序自动完成的办法，如果你有好的建议可以告知我
6. 你的假设正确。 接受 backpressure，flush时数据量很小。

_________________
我完全同意你的建议，请根据你的最终理解，重写ADR.md，新增SPEC.md 和 implementation-doc.md 输出格式为markdown源码，我能直接复制的那种。

如果还有你解决不了的疑问就先不要输出文档，向我提出问题。