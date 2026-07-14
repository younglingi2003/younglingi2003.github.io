# 论文信息

**Agent-Kernel: A MicroKernel Multi-Agent System Framework for Adaptive Social Simulation Powered by LLMs**

论文于 **2025 年 12 月 1 日**提交到 arXiv，目前页面显示为 v1，代码已经开源。它不是一篇提出新模型或新训练算法的论文，而是一篇偏向**多智能体基础设施、分布式系统和软件架构**的工作。([arXiv](https://arxiv.org/abs/2512.01610))

------

# Step 1：详细、通俗讲解

## 1. 一句话概括

这篇论文想做的是：

> 不再把每个 Agent 写成一个“什么都自己管理”的大型对象，而是建立一个类似操作系统微内核的公共底座，把 Agent、环境、动作、通信、时钟、日志和权限控制拆开，通过插件动态组装社会模拟。

它真正解决的不是“Agent 如何推理得更聪明”，而是：

- 如何同时管理上千、上万个 Agent；
- 如何在运行中出生、死亡、迁移或新增 Agent；
- 如何动态改变环境和社会规则；
- 如何阻止 Agent 执行非法动作；
- 如何让不同社会模拟复用同一套基础代码。

论文将这些需求概括为四个词：**适应性、可配置性、可靠性和可复用性**。([arXiv](https://arxiv.org/html/2512.01610))

------

## 2. 现有 Multi-Agent 框架有什么问题？

作者认为，AgentScope、AutoGen、CAMEL、AgentSociety 等框架，大体可以分成两类。

### 第一类：Pipeline 架构

例如：

[
\text{Planner} \rightarrow \text{Agent A} \rightarrow \text{Agent B} \rightarrow \text{Tool}
]

中央 Planner 事先定义好有哪些 Agent、消息怎么流动、每个 Agent 干什么。

问题是：这个流程通常比较静态。

假设模拟过程中突然出生了一个新 Agent，就可能需要修改：

- Planner 中的 Agent 列表；
- 其他 Agent 的联系人列表；
- 消息路由；
- 权限配置；
- 环境状态。

因此它适合任务协作，却不太适合人口不断变化的动态社会。

### 第二类：Layered 架构

例如：

- Agent 层；
- 社会关系层；
- 消息层；
- 数据库层。

虽然代码按层拆开了，但很多环境和动作信息仍然绑定在 Agent 身上。比如每个 Agent 内部都保存自己的地图、关系表和可用动作。

新增一个 Agent 时，其他 Agent 的内部状态可能仍然需要同步修改。

作者认为，问题的根源是：

> 现有框架主要是 **agent-centric，以 Agent 为中心**；而社会模拟需要的是 **society-centric，以整个社会为中心**。([arXiv](https://arxiv.org/html/2512.01610))

------

# 3. 微内核思想到底是什么？

操作系统中的微内核思想是：内核只保留最基本、最稳定的机制，把文件系统、驱动等具体功能放到内核外的服务中。

Agent-Kernel借用了这个思想：

## 内核负责稳定的“机制”

例如：

- 插件注册；
- 模块间通信；
- 全局时间；
- 消息传递；
- 行为验证；
- 日志记录；
- Agent 生命周期管理；
- 分布式部署。

## 插件负责变化的“策略和业务逻辑”

例如：

- Agent 如何感知；
- 如何规划；
- 如何反思；
- 地图是什么样；
- 社会关系如何变化；
- 有哪些动作；
- 吃饭、睡觉、上课、生育分别如何实现。

因此，同一个内核可以运行：

- 老鼠社会；
- 大学校园；
- 医院；
- 城市交通；
- 信息传播；
- 灾害响应。

只需要替换对应插件，而不是重写整个框架。([arXiv](https://arxiv.org/html/2512.01610))

### 我的看法

这个思想本身不算全新的计算机系统思想，核心仍然是：

- 微内核；
- 插件系统；
- Mediator 模式；
- Facade 模式；
- 依赖注入；
- database-per-service；
- Ray Actor。

但是，把这些系统设计**系统性地应用到 LLM 社会模拟**，并且明确提出“社会中心而非 Agent 中心”，是这篇论文比较有价值的地方。

它的创新更像是：

> 找到了一个适合 LLM 社会模拟的系统抽象，而不是发明了一种新的底层算法。

------

# 4. 五个核心模块

Agent-Kernel的内核由五个模块组成：

[
\text{Agent}+\text{Environment}+\text{Action}+\text{Controller}+\text{System}
]

------

## 4.1 Agent Module：只负责“认知主体”

Agent 模块不再保存完整世界，只维护与个体自身有关的内容：

- 身份 Profile；
- 动态状态 State；
- 感知 Perceive；
- 规划 Plan；
- 执行转换 Invoke；
- 反思 Reflect。

典型认知循环是：

[
\text{Perceive}
\rightarrow
\text{Plan}
\rightarrow
\text{Invoke}
\rightarrow
\text{State Update}
\rightarrow
\text{Reflect}
]

例如学生 Alice：

1. 感知到“上午十点有课”；
2. LLM 生成计划“去教室”；
3. Invoke 将自然语言计划解析为 `move(classroom)`；
4. Action 模块执行移动；
5. State 更新 Alice 的位置、体力和情绪；
6. Reflect 把这段经历压缩成记忆。

论文中真正主要使用 LLM 的地方是 Plan Plugin，以及部分反思和记忆生成；移动、状态更新、权限验证等仍由确定性的程序完成。([arXiv](https://arxiv.org/html/2512.01610))

这是一项很重要的设计：

> LLM 负责“想做什么”，程序负责“能不能做、怎么做、做完发生什么”。

否则，假如让 LLM 同时决定动作和物理后果，很容易出现：

- 瞬移；
- 使用不存在的工具；
- 进入不存在的建筑；
- 重复扣除资源；
- 死亡 Agent 继续行动。

------

## 4.2 Environment Module：唯一的客观世界

Environment 是整个社会共享的“世界状态”，主要包含：

### Space Plugin

负责：

- 地图；
- 建筑；
- Agent 位置；
- 邻居查询；
- 空间移动；
- 静态和动态实体。

### Relation Plugin

负责：

- 好友关系；
- 师生关系；
- 同事关系；
- 亲属关系；
- 关系强度；
- 社会网络动态更新。

过去可能每个 Agent 都保存一份地图和联系人列表。Agent-Kernel只保留一份权威环境。

例如新增一座图书馆，只需要修改 Space Plugin；所有 Agent 下一次感知时就能看到它。

新增一个 Agent 也只需要在环境和关系插件中注册，不必修改其他所有 Agent。([arXiv](https://arxiv.org/html/2512.01610))

### 我的看法

这一点其实是整篇论文最核心的设计。

它把：

[
\text{Agent拥有世界}
]

改成：

[
\text{Agent查询共享世界}
]

这类似数据库系统中的“单一事实来源”。它确实有利于动态人口、关系更新和一致性管理。

------

## 4.3 Action Module：社会共享的能力集合

动作也不再硬编码在 Agent 内部，而是放在统一的 Action Module 中。

主要包括三类插件：

### Communication Plugin

负责：

- 消息封装；
- 消息发送；
- 消息存储；
- 消息查询；
- Agent 之间交流。

### Tools Plugin

负责调用工具，包括：

- 本地 Python 函数；
- 远程服务；
- MCP 工具。

### Other-Actions Plugin

负责社会模拟中的普通行为，例如：

- 移动；
- 吃饭；
- 睡觉；
- 上课；
- 工作；
- 生育；
- 攻击。

动作方法还可以通过注解区分：

- Agent 可以直接调用的动作；
- 只有系统可以调用的管理接口。

这相当于初步的权限控制。([arXiv](https://arxiv.org/html/2512.01610))

------

## 4.4 Controller Module：系统调用入口和“裁判”

Controller 是整个系统的中介者。

Agent 不能直接修改 Environment，而必须经过 Controller：

[
\text{Agent Request}
\rightarrow
\text{Controller Validation}
\rightarrow
\text{Action/Environment}
]

例如 Agent 想进入一栋建筑：

1. Plan 输出“进入实验室”；
2. Invoke 生成对应动作请求；
3. Controller 检查实验室是否存在；
4. 检查 Agent 是否有权限进入；
5. 检查路径或开放时间；
6. 验证通过后才执行。

Controller还有第二项功能：**运行时干预**。

研究者可以在模拟中途：

- 修改某个 Agent 的状态；
- 增加社会关系；
- 关闭建筑；
- 广播突发事件；
- 改变规则；
- 向某些 Agent 发出警告。

所以它既像操作系统的系统调用入口，也像实验控制台。([arXiv](https://arxiv.org/html/2512.01610))

### 需要注意

论文将这称为“可靠性”，但它主要保证的是：

- 动作是否合法；
- 状态是否符合预定义规则；
- 系统是否不容易崩溃。

它并不能保证：

- Agent 的判断是真实的；
- 社会行为符合真人；
- LLM 没有语义幻觉；
- 最终社会结论科学可信。

因此，**执行可靠性不等于模拟有效性**。

------

## 4.5 System Module：时间、通信与记录

System Module包含三项全局服务。

### Timer

所有 Agent 使用统一的 Tick。

否则可能出现：

- Agent A 已经来到第二天；
- Agent B 还停留在第一天；
- B 收到来自“未来”的消息。

全局时钟可以控制模拟中的因果顺序。

### Messager

Agent 不直接同步等待对方回复，而是将消息发送到异步消息系统。

这样可以避免：

- A 等 B；
- B 等 C；
- C 又等 A；

最终形成通信死锁。

### Recorder

统一记录：

- 动作；
- 消息；
- 状态变化；
- 环境变化；
- Controller 干预；
- 异常事件。

这对调试和事后分析很重要。([arXiv](https://arxiv.org/html/2512.01610))

不过，论文所说的“保证确定性”有些过强。统一时钟可以控制事件顺序，但只要 LLM 采样、异步请求和模型服务存在随机性，就不自动等于整个模拟完全可复现。

------

# 5. 插件机制：为什么可以热插拔？

所有插件都必须实现统一接口，例如：

```text
init()
execute()
```

同一种插件具有相同接口，因此可以在运行时替换：

[
\text{Rule-based Plan Plugin}
\rightarrow
\text{LLM Plan Plugin}
]

或者：

[
\text{Simple Memory Plugin}
\rightarrow
\text{Vector Database Memory Plugin}
]

Agent 的其他组件不用修改。

框架使用：

- 抽象基类约束接口；
- Pydantic 约束数据结构；
- 依赖注入传入数据库适配器；
- Adapter 屏蔽 Redis、PostgreSQL 等数据库差异。([arXiv](https://arxiv.org/html/2512.01610))

### Database-per-Plugin

每个插件可以拥有自己的数据库：

- Relation Plugin 使用图数据库；
- Reflect Plugin 使用向量数据库；
- 消息插件使用 Redis；
- 结构化状态使用 PostgreSQL。

好处是插件相对独立。

坏处也很明显：跨插件事务和数据一致性会更加困难。比如一次动作同时修改：

- Agent 状态；
- 空间位置；
- 社会关系；
- 消息记录。

如果其中一个数据库失败，系统需要处理部分提交问题。论文没有深入解决这个问题。

------

# 6. 分布式架构

为了支持大量 Agent，作者使用 Ray，将系统划分为多个 **MasPod**。

一个 MasPod 中包含：

- 一组 Agent；
- 局部 Environment；
- 局部 Action；
- 局部 Controller。

上层还有一个 PodManager，负责：

- 创建和删除 Pod；
- 添加 Agent；
- 负载均衡；
- 跨 Pod 通信；
- 生命周期管理。

新增 Agent 时，PodManager会把它放到当前 Agent 数量最少的 Pod 中。PodManager和 MasPod 都实现为 Ray Actor。([arXiv](https://arxiv.org/html/2512.01610))

这与 Kubernetes 的 Pod 思想比较相似：

[
\text{Agent} \approx \text{Process}
]

[
\text{MasPod} \approx \text{Container/Pod}
]

[
\text{PodManager} \approx \text{Orchestrator}
]

不过它现在的负载均衡主要根据 Agent 数量，而不同 Agent 的推理开销可能相差很大。

一个每 Tick 调用大模型、检索大量记忆的 Agent，显然不等价于一个规则型 Agent。因此“Agent 数量均衡”并不必然代表“计算负载均衡”。

------

# 7. 实验一：Universe 25 老鼠乌托邦

作者模拟了著名的 Universe 25 实验，用于证明系统能够处理：

- 出生；
- 死亡；
- 多代繁衍；
- 人口增长和下降；
- 社会行为变化。

初始只有 8 只老鼠，模拟运行 1,729 个 Tick，相当于 73 个模拟日，累计创建了 447 个个体，记录了 126,265 个行为事件。([arXiv](https://arxiv.org/html/2512.01610))

每只老鼠有：

- 饥饿、口渴、健康和能量；
- 攻击欲、亲社会性、压力；
- 生育周期；
- 年龄阶段；
- 社会角色；
- 关系网络。

作者观察到：

1. 前期人口快速增长；
2. 中期社交和生育行为下降；
3. 攻击及病态行为增加；
4. 后期生育停止；
5. 最终只剩基本生存行为；
6. 种群走向灭亡。

这些趋势与原始 Universe 25 实验的几个阶段相似。([arXiv](https://arxiv.org/html/2512.01610))

### 我的评价

这个实验对“动态创建和删除 Agent”是有效的工程演示。

但它不能充分证明系统真的发现了社会规律，因为很多机制已经被人工编码进去了：

- 密度如何增加压力；
- 压力如何增加攻击性；
- 压力如何降低生育；
- 年龄如何决定死亡；
- 哪些行为被归类为病态。

如果将这些因果关系提前写入状态转移规则，那么最后出现人口崩溃并不令人意外。

因此它更像：

> 框架能够运行一个复杂的 Universe 25 模型。

而不是：

> LLM Agent 自发重新发现了 Universe 25 现象。

------

# 8. 实验二：一万个浙大校园 Agent

第二个实验模拟了 10,000 个 Agent：

- 8,000 名学生；
- 1,000 名教师；
- 500 名行政人员；
- 500 名工作人员。

校园包含 41 个地点、12 种社会关系；每个 Agent 平均有 27 条关系。模拟运行 336 个 Tick，相当于 7 天。([arXiv](https://arxiv.org/html/2512.01610))

## 性能结果

- 50 个 MasPod；
- 每个 Pod 管理 200 个 Agent；
- 完整模拟耗时 29.9 小时；
- 平均每 Tick 约 320 秒；
- Agent 执行占总运行时间的 93%；
- 总共消耗 12.6 亿 Token；
- Prompt Token 占 87.4%；
- 记录了 133 万次动作和 47.4 万次地点访问。([arXiv](https://arxiv.org/html/2512.01610))

使用的推理资源包括：

- 8 张 A100 80GB；
- 4 张 L40 48GB；
- 4 张 RTX 4090 24GB；
- Qwen3-Next-80B-A3B-Instruct；
- Qwen3-30B-A3B-Instruct。([arXiv](https://arxiv.org/html/2512.01610))

### 这说明什么？

它说明框架确实能够：

- 调度一万个 Agent；
- 分配 Agent 到不同 Pod；
- 处理大规模 LLM 请求；
- 管理统一环境和关系网络；
- 记录大量动作。

但成本非常高，而且 10,000 个 Agent 运行 7 个模拟日需要接近 30 小时。

更关键的是：

> “能够运行 10,000 个 Agent”证明的是系统扩展性，不等于这 10,000 个 Agent 的行为具有社会科学可信度。

论文对行为真实性的验证主要是：

- 活动分布看起来像校园；
- 居住区和教学区访问较多；
- 一个 Agent 能在后续对话中回忆之前发现的安全问题。

这些证据还比较弱，特别是最后的记忆案例只是一个对话案例，没有大规模定量评估。([arXiv](https://arxiv.org/html/2512.01610))

------

# 9. 论文最主要的贡献

我认为真正有价值的贡献有三个。

## 贡献一：从 Agent-centric 转向 Society-centric

把：

- 环境；
- 关系；
- 动作；
- 时间；
- 通信；

从 Agent 内部抽离出来，变成社会级公共服务。

这是支持动态社会的关键。

## 贡献二：将 LLM 行为纳入受控执行系统

不是让 LLM 直接改变世界，而是：

[
\text{LLM Plan}
\rightarrow
\text{Structured Action}
\rightarrow
\text{Controller Check}
\rightarrow
\text{Execution}
]

这个设计对减少非法动作和系统崩溃很有价值。

## 贡献三：把社会模拟变成可组装的软件系统

通过标准插件、数据库适配器、Ray Pod和统一控制面，可以更容易地构建不同社会模拟。

代码库当前也提供了单机版、Ray 分布式版和可视化 Society-Panel。([GitHub](https://github.com/ZJU-LLMs/Agent-Kernel))

------

# Step 2：顶会审稿意见

## 总体评价

这是一篇**工程思想清晰、系统实现量较大，但实验论证明显不足**的论文。

它最强的地方是系统架构，不是 Agent 智能，也不是社会科学发现。

------

## 意见一：缺少真正的基线实验，核心优势大部分是作者自评

论文用星级表比较 Agent-Kernel、AgentSociety、AgentScope、CAMEL 等框架，并让自己的方法在适应性、可配置性、可靠性和复用性上全部获得三星。

但作者也明确说明，这些评分主要来自自己的使用经验和对框架设计的理解，并不是统一实验得到的。([arXiv](https://arxiv.org/html/2512.01610))

这在顶会论文中远远不够。

至少需要在相同场景下比较：

- 增加和删除 Agent 的时间；
- 修改环境需要改多少代码；
- 实现相同模拟的代码量；
- 吞吐量和延迟；
- 内存占用；
- 异常恢复时间；
- 插件替换开销；
- 最大 Agent 数量；
- 多次运行结果的一致性。

还应有消融实验：

- 去掉 Controller 会怎样；
- 去掉全局 Timer 会怎样；
- 共享数据库与 database-per-plugin 有何区别；
- 单体架构和微内核架构的实际开发成本有何差异；
- PodManager 使用 Agent 数量和真实负载调度有何差异。

目前的证据只能说明“系统可以运行”，不能充分证明“微内核架构优于现有架构”。

------

## 意见二：社会模拟的有效性存在明显循环论证

Universe 25实验看起来复现了人口增长、停滞和崩溃，但这些现象可能早已被写进：

- 生理状态转移；
- 压力变量；
- 攻击规则；
- 生育规则；
- 生命周期；
- 关系更新；
- 行为选择提示词。

因此需要回答：

> 最终现象究竟是 Agent 自发涌现的，还是设计者通过规则和 Prompt 预先植入的？

论文缺少：

- 参数敏感性实验；
- 多随机种子实验；
- 规则消融；
- Prompt 消融；
- 不同 LLM 对比；
- 与原始实验数据的定量拟合；
- 社会科学专家盲评；
- 预先注册的验证指标；
- 样本外预测。

校园实验的问题更严重：活动分布“看起来合理”和一段连贯对话，无法证明一万个 Agent 形成了真实可信的社会。

这篇论文实际上验证了**基础设施容量**，却把一部分结果表述成了**社会现象有效性**。

------

## 意见三：“可靠、确定、可无限扩展”的表述过强

Controller能够验证“目标位置是否存在”，但无法可靠判断：

- Agent 的动机是否合理；
- 对话内容是否事实正确；
- 记忆总结是否扭曲；
- LLM 是否产生语义幻觉；
- 社会决策是否符合现实人类。

类似地，全局 Timer 可以减少因果倒置，但不能自动使整个系统确定性运行。LLM 采样、异步推理、跨 Pod 消息和服务端批处理仍可能带来运行差异。论文缺少确定性重放实验和故障注入测试。([arXiv](https://arxiv.org/html/2512.01610))

分布式设计中还有两个潜在问题：

1. PodManager承担跨 Pod 通信和集中协调，可能形成瓶颈或单点故障；
2. database-per-plugin涉及跨库更新，但论文没有讨论事务一致性、补偿机制和崩溃恢复。

作者声称 Controller可以水平扩展、Agent 数量可以近乎无限扩展，但没有展示：

- 强扩展和弱扩展曲线；
- 多节点规模实验；
- 节点失效恢复；
- 网络分区；
- 消息重复与丢失；
- 万级以上 Agent；
- Controller与 PodManager的压力上限。

这些表述需要明显收敛。

------

# 三个有研究价值的问题

## 问题一：Agent 微内核中，究竟什么必须放进“内核”？

当前 Agent-Kernel的内核包括 Agent、Environment、Action、Controller和 System，范围其实已经不小。

一个更根本的问题是：

> LLM Multi-Agent 系统的最小可信内核应该包含什么？

可以研究：

- 最小化 Trusted Computing Base；
- capability-based 权限模型；
- Agent身份和插件身份认证；
- 插件隔离与沙箱；
- 资源配额；
- 内核态动作与用户态动作；
- 插件崩溃后的故障隔离；
- 动态插件升级的兼容性。

这会比简单类比微内核更接近真正的 Agent Operating System 研究。

------

## 问题二：如何实现可重放、因果一致的 LLM 社会模拟？

真正科学的社会模拟应能回答：

> 给定相同初始条件，为什么两次实验不同？差异来自社会随机性，还是系统并发和模型服务？

可以研究：

- 逻辑时钟与因果消息；
- event sourcing；
- 确定性调度；
- LLM 输出缓存与版本锁定；
- 随机种子传播；
- 状态快照和检查点；
- 跨数据库事务；
- 分布式回滚；
- 因果轨迹审计；
- Counterfactual replay。

最终目标不是让所有运行完全一样，而是能够精确解释：

# [ \text{Outcome Difference}

\text{Model Randomness}
+
\text{Environment Randomness}
+
\text{Scheduling Randomness}
]

------

## 问题三：如何区分“真正涌现”与“规则预编码”？

这是 LLM 社会模拟最重要、也最困难的问题。

需要建立一套科学验证方法：

1. 将部分真实数据作为校准集；
2. 隐藏另一部分现象作为测试集；
3. 只根据校准数据设计 Agent；
4. 检查模型能否预测未见过的社会现象；
5. 对 Prompt、规则、模型和随机性进行系统消融；
6. 对输出进行不确定性估计。

还可以使用：

- Approximate Bayesian Computation；
- Simulation-based inference；
- 因果发现；
- 参数可识别性分析；
- 多模型集成；
- 人类行为数据校准。

只有当系统能预测未被直接编码的结果时，才更有资格称为“涌现”。

------

# 最终判断

## 评分

| 维度           | 评价                         |
| -------------- | ---------------------------- |
| 问题重要性     | 8/10                         |
| 架构清晰度     | 8/10                         |
| 工程实现       | 8/10                         |
| 方法新颖性     | 6.5/10                       |
| 实验严谨性     | 4/10                         |
| 社会科学有效性 | 3.5/10                       |
| 可复现性       | 6/10，代码开放但算力门槛很高 |
| 论文表述       | 6/10，存在较多过强结论       |

## 审稿结论：**Weak Reject**

作为顶会主会论文，我会给 **Weak Reject**。

原因不是系统没有价值，而是论文的核心主张包括：

- 比现有框架更好；
- 更可靠；
- 更确定；
- 更可复用；
- 能产生可信社会模拟。

但目前实验主要证明了：

- 可以动态增删 Agent；
- 可以运行 Universe 25场景；
- 可以用大量算力运行一万个 Agent；
- 可以记录和调度大量行为。

这些不足以支撑全部主张。

如果投稿到系统演示、开源软件或应用展示赛道，我会倾向于接收；如果作者补充严格基线、故障实验、扩展性曲线、消融实验和社会有效性验证，它有机会成为一篇较强的 Agent 基础设施论文。

**我的总体看法是：思想值得关注，工程量很扎实，但目前更像一个优秀平台的技术报告，而不是已经被充分验证的顶会研究成果。**