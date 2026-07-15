# 论文解读：Agentic Reasoning for Large Language Models

**题目：** *Agentic Reasoning for Large Language Models*
**类型：** 大型综述论文
**核心主题：** 如何把 LLM 从“静态回答问题的模型”，升级为能够规划、行动、记忆、学习和协作的智能体。论文于 2026 年 1 月提交，正文共 135 页，系统整理了截至 2025 年的 Agentic Reasoning 研究，并配有持续更新的论文仓库。([[arXiv](https://arxiv.org/abs/2601.12538)][1])

# Step 1：论文讲解

## 1. 解决了什么问题？

传统 LLM 推理通常是：

> 输入问题 → 在模型内部思考 → 输出答案。

Agentic Reasoning 则变成：

> 观察环境 → 思考 → 采取行动 → 获得反馈 → 更新记忆或策略 → 再思考。

论文认为，关键变化不是单纯增加 **test-time computation**，而是增加 **test-time interaction**：模型不仅多想几步，还能搜索网页、调用代码、操作软件、写入记忆、与其他 Agent 协商，并根据结果调整后续行为。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

例如，让模型回答“比较三家公司的最新财报”：

* 普通 LLM：依靠已有知识直接回答；
* RAG：固定检索一次，再回答；
* Agent：先拆分公司，分别搜索财报，检查日期，调用计算器计算指标，发现数据冲突后继续搜索，最后附证据生成报告。

所以论文对 Agentic Reasoning 的理解不是“更长的 CoT”，而是：

> **以推理为控制核心，把规划、工具、搜索、记忆、反馈和协作组织成连续的闭环。**

## 2. 形式化描述

论文把 Agent 放进一个部分可观测马尔可夫决策过程，即 POMDP：

* $(X)$：真实但无法完全观察的环境状态；
* $(O)$：Agent 看到的观察，例如用户输入、网页内容、API 返回值；
* $(Z)$：内部推理轨迹，例如计划、分析或潜在思维；
* $(A)$：对外动作，例如搜索、调用工具、点击按钮或回答；
* $(M)$：内部记忆；
* $(R)$：环境反馈或奖励。

论文进一步把策略拆成两部分：

$$
\pi(z_t,a_t\mid h_t)=
\pi_{\text{reason}}(z_t\mid h_t)
\cdot
\pi_{\text{exec}}(a_t\mid h_t,z_t)
$$

通俗说就是：

1. 先根据历史信息决定“应该怎么想”；
2. 再根据想出来的结果决定“应该做什么”。

这种拆分强调了 Agent 不是直接从观察映射到动作，而是在中间插入一个可搜索、可训练、可反思的推理空间。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

## 3. 核心的“三层框架”

论文按照 Agent 所处环境和能力的发展程度，把 Agentic Reasoning 分成三个层次。

### 第一层：Foundational Agentic Reasoning

#### 基础智能体推理

这一层研究一个 Agent 如何完成当前任务，核心能力包括：

* Planning：规划；
* Tool Use：工具使用；
* Search：搜索与检索。

规划决定下一步做什么，搜索负责获得缺失信息，工具负责执行具体操作。

#### Planning：规划

论文将规划方法概括为几种主要形式：

**工作流式规划**

提前规定“分析—执行—检查”的流程，例如：

> Planner 制订计划 → Executor 执行 → Critic 检查 → Planner 重规划。

优点是稳定、可解释，缺点是流程可能过于僵硬。

**树搜索或算法式规划**

把不同思考方案视为树节点，通过 BFS、DFS、A*、Beam Search 或 MCTS 探索多条路径。相比只生成一条 CoT，它允许回溯和比较候选方案，但代价是大量 rollout 和评估调用。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

**形式化规划**

让 LLM 生成程序、PDDL、逻辑表达式或行为树，再交给经典规划器或执行器。它通常比纯自然语言计划可靠，但依赖任务能够被形式化。

**分解与模块化**

将目标识别、记忆检索、计划生成和执行分成不同模块，使每个模块更容易优化和检查。

**外部辅助规划**

利用知识图谱、RAG、世界模型或工具来帮助预测行动结果。

**训练式规划**

通过 SFT 或 RL，使模型把好的规划策略内化进参数，而不只是依赖提示词。论文将 PPO、GRPO 和奖励设计都纳入这一方向。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

#### Tool Use：工具使用

工具使用并不只是生成一个函数名，而包含三个决策：

1. **什么时候调用工具？**
2. **调用哪个工具？**
3. **参数如何填写，并如何利用返回结果？**

论文将工具使用分为三种模式：

**In-context Integration**

模型参数不变，依靠提示词在推理中穿插工具调用，例如 ReAct。

**Post-training Integration**

通过 SFT 学习调用格式，再通过 RL 学习长期工具策略。

**Orchestration-based Integration**

使用一个独立控制器或 Planner，在多个模型和工具之间进行调度。此时智能主要来自系统结构，而不完全来自单个模型。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

这里一个很重要的观点是：

> Tool Use 的真正难点不是 API syntax，而是长期决策。

例如一次工具调用正确，不代表十步工具链能够完成任务。前面错误的参数、错误的工具选择或未验证的中间结果，都可能在后续不断放大。

#### 3.3 Agentic Search：主动搜索

Agentic Search 则让模型动态决定：

* 是否需要搜索；
* 搜什么关键词；
* 搜索宽度和深度；
* 当前证据是否充分；
* 是否存在冲突；
* 是否需要换来源；
* 什么时候停止。

检索变成了序列决策问题。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

论文将其分为：

* 基于提示词的动态搜索；
* 基于知识图谱等结构化数据的搜索；
* 通过 SFT/RL 学习搜索策略。

我认为这是整篇综述中非常重要的一部分。现在很多所谓“Deep Research”的差距，并不主要来自语言生成，而来自搜索决策：查询分解、证据覆盖、冲突处理、停止条件和引用归因。

### 第二层：Self-evolving Agentic Reasoning

#### 自进化智能体推理

基础 Agent 只解决当前任务，自进化 Agent 则试图做到：

> 这次任务结束后，下一次能不能变得更好？

论文认为，自进化主要依赖两个核心机制：

* Feedback：反馈；
* Memory：记忆。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

#### 三种反馈机制

##### 反思式反馈

模型生成结果后，自己或另一个 Critic 分析错误，再进行修改。

优点是不需要更新参数，适合在线纠错；缺点是模型可能不知道自己哪里错了，形成“错误答案批评错误答案”的循环。

##### 参数式适应

将成功轨迹、失败案例和反馈数据用于 SFT 或 RL，使改进进入模型权重。

优点是能力可能长期保留；缺点是训练成本大，且容易过拟合特定环境。

##### Validator-driven Feedback

使用编译器、单元测试、执行结果、规则检查器等给出成功或失败信号，然后重新尝试。

它的优势是反馈客观、廉价；但一个二元失败信号通常只告诉 Agent“错了”，不告诉它具体错在哪里。

#### Agentic Memory：智能体记忆

论文把记忆分为三种主要形态。

**平面记忆**

保存对话、摘要、经验、工作流或历史轨迹。实现简单，但随着数据增加，检索噪声和上下文成本迅速上升。

**结构化记忆**

用图、实体关系、事件链或多模态表示组织记忆。优点是便于关联和多跳检索，缺点是构建、更新与冲突消解更复杂。

**可训练的记忆控制**

把“写什么、删什么、什么时候读、读哪一条”视为动作，通过 RL 或其他训练方法学习记忆策略。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

#### 自进化到底可以进化什么？

* **语言进化**：更新反思、提示词和规则；
* **程序进化**：积累工具、技能或代码；
* **结构进化**：修改 Agent 的代码、工作流甚至架构。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

### 第三层：Collective Multi-agent Reasoning

#### 集体多智能体推理

这一层把推理从单个 Agent 扩展到多个 Agent 的协作。

论文总结了五类通用角色：

* Leader/Coordinator：分解任务与统筹；
* Worker/Executor：执行具体操作；
* Critic/Evaluator：检查质量；
* Memory Keeper：维护共享状态；
* Communication Facilitator：控制消息传递。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

论文认为多 Agent 的核心问题有三个：

1. 如何分配角色；
2. 如何通信和分工；
3. 如何维护集体记忆并共同进化。

多 Agent 还可以通过后训练优化 Prompt、Agent 选择策略和通信拓扑，而不只是手工设置一个“Manager + Worker”流程。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

## 4. 一个贯穿全文的横向维度

论文给出一个横向分类：

### In-context Reasoning

* 不更新模型参数；
* 通过 Prompt、搜索、工作流和多次采样提高效果；

### Post-training Reasoning

* 使用 SFT、RL 等更新模型；
* 将规划、工具调用和搜索策略内化；

这两个方向不是互斥的。实际较强的 Agent 通常会用后训练获得基础策略，再在推理时通过搜索和反思处理具体任务。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

## 5. 论文的核心价值

这篇论文提供了一个阅读地图：

$$
\text{单次任务能力}
\rightarrow
\text{跨任务自进化}
\rightarrow
\text{多智能体协作}
$$

同时，每一层都可以选择：

$$
\text{推理时编排}
\quad\text{或}\quad
\text{后训练内化}
$$

对于刚进入 Agent 研究的人，这个框架非常适合建立整体认识。作者还维护了持续更新的公开论文列表，因此它不仅是一篇静态综述，也有一定资源索引价值。([[GitHub](https://github.com/weitianxin/Awesome-Agentic-Reasoning)][3])

# Step 2：实验部分

## 1. 如何组织 Agent 评测？

论文将评测分成两个层级：机制级评测、应用级端到端评测

### 第一层：机制级评测

单独检查某个能力：

* 工具使用；
* 搜索；
* 记忆与规划；
* 多 Agent 协作。

这比只看最终任务成功率更有解释力。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

工具使用 benchmark 又从单轮函数调用发展到多轮、多工具和长程规划。例如 T-Eval 会分别检查指令理解、规划、推理、检索和审查，而不是只判断最后 API 是否调用成功；ToolFlow、MTU-Bench 等则更强调多步工具组合。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

搜索 benchmark 不再只评答案准确率，而开始测量：

* 搜索规划深度；
* 证据覆盖；
* 多跳推理；
* 引用是否支持结论；
* 搜索过程是否高效；
* 是否能处理视觉、PDF 和视频证据。

这说明 Agentic Search 的评测正在从“搜没搜到答案”，转向“整个研究过程是否可靠”。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

记忆评测则区分：

* 单次长上下文中的长期记忆；
* 跨多个会话的持续记忆；
* 是否能够利用记忆辅助规划和反馈；
* 面对信息更新时能否修改旧知识。

论文列举的 benchmark 已开始同时关注准确率、召回率、检索速度、知识更新和拒答能力。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

### 第二层：应用级端到端评测

作者进一步整理了六种真实应用：

* 具身 Agent；
* 科学发现 Agent；
* 自动科研 Agent；
* 医疗 Agent；
* Web Agent；
* 通用工具 Agent。

这类 benchmark 更接近实际使用。例如 Web Agent 要同时处理页面理解、点击、输入、长程导航和失败恢复；医疗 Agent 不仅要求答案正确，还需要证据一致性、安全性和隐私保护。([[arXiv](https://arxiv.org/pdf/2601.12538)][2])

# Step 3：意见

这篇论文覆盖范围极广，将基础能力、自进化、多 Agent、应用和 benchmark 放入同一张路线图；大量图表和公开论文仓库也使其具有较高的教学与检索价值。尤其是“基础能力—自进化—集体推理”与“In-context—Post-training”两个维度的组合，确实比单纯按照 Planning、Memory、Tool Use 罗列论文更有整体感。

# Step 4：简要汇报

这篇论文系统梳理了 Agentic Reasoning，将研究分为基础能力、自进化和多智能体协作三层，并用推理时编排与后训练作为横向分类。基础层包括规划、工具和搜索，自进化层依赖反馈与记忆，多智能体层关注角色、通信和集体演化。论文覆盖全面、适合建立领域地图，但没有自己的实验，分类边界也存在重叠，且缺少严格的文献筛选和定量比较。总体上是一篇优秀的学习资料，但作为顶会综述仍需增强方法学与分析深度。

[1]: https://arxiv.org/abs/2601.12538 "[2601.12538] Agentic Reasoning for Large Language Models"
[2]: https://arxiv.org/pdf/2601.12538 "Agentic Reasoning for Large Language Models"
[3]: https://github.com/weitianxin/Awesome-Agentic-Reasoning "GitHub - weitianxin/Awesome-Agentic-Reasoning: A curated list of papers and resources based on the survey \"Agentic Reasoning for Large Language Models\" · GitHub"
[4]: https://arxiv.org/html/2507.21504v1?utm_source=chatgpt.com "Evaluation and Benchmarking of LLM Agents: A Survey"