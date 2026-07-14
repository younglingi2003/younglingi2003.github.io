# 论文解读：R1-Searcher++

**论文：** *R1-Searcher++: Incentivizing the Dynamic Knowledge Acquisition of LLMs via Reinforcement Learning*
**核心主题：** 让大模型学会在“自己想”和“上网搜”之间动态切换，并将搜索得到的知识进一步写入模型参数。论文于2025年5月提交，主要基于 Qwen2.5-7B-Instruct 展开实验。([arXiv][1])

---

# Step 1：论文讲解

## 1. 论文想解决什么问题？

传统大模型回答问题时，主要有两种极端。

### 极端一：只依赖模型内部知识

### 极端二：遇到每一步都搜索

R1-Searcher++试图找到中间状态：

> **知道的部分直接使用内部知识，不确定的部分才搜索；搜索到的重要知识还要尽量记住。**

论文把这个过程称为 **Dynamic Knowledge Acquisition，动态知识获取**。([arXiv][2])

---

## 2. 核心思想

R1-Searcher++让模型在每个推理步骤中选择两种动作之一：

### 动作一：内部推理

当模型认为自己已经知道答案时，生成：

```text
<internal>
模型使用内部知识完成该步骤
</internal>
```

### 动作二：外部搜索

当模型认为信息不足、可能过时或者需要核实时，生成：

```text
<external>
搜索查询
</external>
```

系统执行搜索后，将结果以文档形式返回：

```text
<document>
搜索到的内容
</document>
```

模型继续推理，直到得到最终答案。

因此，这篇论文真正训练的并不只是“怎么搜索”，还包括三个决策：

1. **什么时候搜索；**
2. **搜索什么；**
3. **什么时候停止搜索并使用内部知识。**

论文采用两个训练阶段：

```text
SFT冷启动
    ↓
让模型先学会内部/外部两种动作的基本格式
    ↓
强化学习
    ↓
在正确率、搜索次数和知识记忆之间寻找平衡
```

([ar5iv][3])

---

## 3. 第一阶段：SFT Cold-Start

### 3.1 为什么需要冷启动？

模型一开始什么都不知道，纯 RL 的初期探索很容易产生大量无效轨迹。

作者先让基础模型自己生成回答，然后通过拒绝采样，只保留：

* 最终答案正确；
* `<internal>` 标签正确；
* `<external>` 标签正确；
* 搜索调用格式正确；

的轨迹，作为 SFT 数据。

---

### 3.2 为什么要屏蔽检索文档的损失？

一条训练轨迹可能是：

```text
模型：我要搜索 Titanic release year
搜索器：Titanic is a 1997 American film
模型：因此 Titanic 比 Avatar 更早上映
```

其中第二行并不是模型生成的，而是环境返回的观察结果。

因此，训练时不能要求模型去预测搜索引擎返回的每个 token。否则模型会开始学习“伪造搜索结果”，而不是学习什么时候调用搜索器。

作者将检索文档对应 token 的 mask 设置为0，只对模型自己产生的内容计算损失。这个设计同时用于 SFT 和 RL。([arXiv][2])

---

## 4. 第二阶段：RL for Dynamic Knowledge Acquisition

SFT 只能让模型模仿已有轨迹。

因此，第二阶段使用基于结果监督的强化学习，让模型自行采样多条推理轨迹，并根据最终结果获得奖励。

底层算法采用无 Critic 的 REINFORCE++，对搜索文档 token 继续进行掩码处理。([ar5iv][3])

奖励由三部分组成：

$$
R=R_{\text{format}}+R_{\text{answer}}+R_{\text{group}}
$$

---

## 5. 格式奖励：保证工具调用合法

格式正确时：

$$
R_{\text{format}}=0
$$

格式错误时：

$$
R_{\text{format}}=-2
$$

格式错误包括：

* 搜索查询没有放进规定标签；
* 模型没有调用检索器，却自行编造了 `<document>`；
* 最终答案没有放入规定格式；
* 输出中存在不可解析内容。

它本质上是一个“硬约束惩罚”，防止 RL 训练把工具协议学坏。([arXiv][2])

---

## 6. 答案奖励：判断最终答案是否正确

作者没有使用严格的 Exact Match，而是采用 Cover Exact Match：

> 只要参考答案出现在模型最终答案中，就判断为正确。

正确时奖励为1，否则为0。

但作者发现模型会奖励投机。例如参考答案是 Titanic，模型可能输出：

> Avatar、Titanic、Titanic、Avatar……

只要覆盖了正确答案，就可能获得奖励。

因此作者进一步规定：

> 最终答案超过10个词，一律视为错误。

于是答案奖励为：

$$
R_{\text{answer}}=
\begin{cases}
1,&\text{答案不超过10词，且包含参考答案} \\
0,&\text{其他情况}
\end{cases}
$$

这是一个比较简单直接的防止 reward hacking 的办法。([arXiv][2])

### 我的看法

这个设计在短答案多跳问答中有效，但非常依赖任务形式。

“十个词以内”像是针对当前 benchmark 的工程约束，而不是普适的答案奖励。

---

## 7. Group Reward：奖励“正确且搜索较少”的轨迹

这是论文最有意思的设计之一。

对于同一个问题，模型会采样多条 rollout。例如：

| 轨迹 | 是否正确 | 搜索次数 |
| -- | ---: | ---: |
| A  |   正确 |    3 |
| B  |   正确 |    1 |
| C  |   错误 |    0 |
| D  |   正确 |    2 |

普通结果奖励会让 A、B、D 都获得相同奖励，因为它们最终都答对了。

但 R1-Searcher++认为 B 更好：

> 同样能够答对，B只搜索了一次，说明它更充分地利用了内部知识。

因此，作者在同一问题的正确轨迹中找到搜索次数最少的轨迹，并为它附加 group reward。奖励强度与该组轨迹搜索次数的差异有关，并通过超参数进行裁剪。([arXiv][2])

### 它为什么不是简单地惩罚搜索次数？

如果直接设置：

$$
R=R_{\text{answer}}-\lambda \times \text{搜索次数}
$$

模型可能学会完全不搜索。

R1-Searcher++的逻辑是：

> **在保证正确的前提下，尽量少搜索。**

### 我的看法

这个相对奖励比固定的搜索惩罚更合理，因为不同问题所需的搜索次数不同。

但它仍有一个隐含假设：

> 在所有正确轨迹中，搜索最少的就是最好的。

这个假设并不总成立。对于医疗、法律、新闻等高风险或时效性任务，即使模型内部“碰巧答对”，额外核验也可能是必要的。

---

## 8. External Knowledge Memorization：把搜索知识写进模型

这是论文标题中“Knowledge Acquisition”的来源，它尝试将搜索结果通过额外训练写入模型参数。

### 具体过程

假设模型回答：

> Avatar 和 Titanic 哪个更早上映？

模型内部已经知道：

```text
Avatar was released in 2009
```

但不知道 Titanic 的上映年份，于是搜索到：

```text
Titanic was released in 1997
```

模型最终正确回答 Titanic。

接下来，系统会：

1. 从正确 rollout 中提取问题和搜索文档；
2. 将它们交给一个单独训练的 rewriting model；
3. rewriting model 生成一条“不再调用搜索”的内部知识轨迹；
4. 验证该轨迹答案正确；
5. 将其加入记忆训练集；
6. 使用 NLL/SFT 损失继续训练策略模型。

改写后的轨迹可能类似：

```text
我记得 Avatar 于2009年上映，
Titanic 于1997年上映，
所以 Titanic 更早。
```

最终优化目标是：

$$
L(\theta)=-J_{\text{RL}}(\theta)+\mu L_{\text{memory}}(\theta)
$$

其中：

* $(J_{\text{RL}})$：让模型探索并学习搜索策略；
* $(L_{\text{memory}})$：让模型记住搜索得到的知识；
* $(\mu)$：控制记忆训练的强度。

论文中设定 (\mu=0.1)，避免 SFT 记忆损失过强，导致模型再次变成只依赖内部知识。([arXiv][2])

---

## 9. 我对核心思想的总体评价

这篇论文最值得肯定的地方，是明确指出了当前搜索智能体的一个真实问题：

> **搜索能力越强，不等于搜索行为越合理。**

R1-Searcher++开始明确优化：

$$
\text{答案质量}+\text{搜索效率}+\text{知识复用}
$$

目前的方法准确地说是：

> **利用成功搜索轨迹进行在线自蒸馏或参数化记忆。**

---

# Step 2：实验部分

## 1. 实验设置

### 基础模型

所有主要方法尽量统一使用：

* **Qwen2.5-7B-Instruct**

检索环境为：

* KILT 版本的2019年英文 Wikipedia；
* 切分成约2900万个、每段100词的 passage；
* 使用 BGE-large-en-v1.5 进行稠密检索。([arXiv][2])

---

## 2. 训练数据

### Stage 1：SFT冷启动

共805条样本：

* HotpotQA：720条；
* 2WikiMultiHopQA：85条。

训练6个 epoch，batch size 为64，学习率为 (2\times10^{-5})。

### Stage 2：RL训练

共8142条样本：

* HotpotQA：4561条；
* 2WikiMultiHopQA：3581条。

每个问题采样16条 rollout：

* train batch size：1024；
* rollout batch size：64；
* 学习率：(2\times10^{-6})；
* 训练1个 epoch；
* 最大搜索次数：8；
* KL系数：(10^{-4})；
* 记忆损失权重 (\mu=0.1)；
* group reward 裁剪参数 (\eta=2)。([arXiv][2])

---

## 3. 测试数据

使用四个多跳问答数据集：

* HotpotQA；
* 2WikiMultiHopQA；
* Bamboogle；
* Musique。

其中：

* HotpotQA、2Wiki属于域内测试；
* Bamboogle、Musique属于域外测试。

HotpotQA、2Wiki和Musique均随机抽取500条验证样本，Bamboogle使用完整测试集。([arXiv][2])

评价指标包括：

* **F1**：预测答案和标准答案的词级重合度；
* **LLM-as-Judge**：由 GPT-4o-mini 判断答案是否正确；
* **RC，Retrieval Count**：平均搜索次数。

---

## 4. 主实验结果

平均结果如下：

| 方法            |     平均F1 | 平均LLM Judge |   平均搜索次数 |
| ------------- | -------: | ----------: | -------: |
| R1-Searcher   | **45.6** |        52.9 |     2.30 |
| Search-R1     |     40.3 |        48.6 |     3.42 |
| R1-Searcher++ |     45.3 |    **55.2** | **1.61** |

([ar5iv][3])

### 结果一：搜索次数明显下降

相较于：

* R1-Searcher：搜索次数从2.30下降到1.61，约减少30%；
* Search-R1：从3.42下降到1.61，约减少52.9%。

这说明 group reward 确实让模型减少了不必要的搜索。([arXiv][2])

### 结果二：LLM Judge 指标提高

R1-Searcher++的平均 LLM-as-Judge 为55.2，高于 R1-Searcher 的52.9。

### 结果三：F1并没有全面超过R1-Searcher

这一点很重要。

R1-Searcher++平均F1为45.3，而 R1-Searcher 为45.6，前者实际上略低。

具体来看：

* HotpotQA：59.0，对手60.4；
* 2Wiki：61.2，对手62.8；
* Bamboogle：60.8，对手59.0；
* Musique：33.8，对手35.7。

更准确的结论是：

> R1-Searcher++以几乎不损失平均F1为代价，大幅降低搜索次数，并提高了LLM-as-Judge指标。

---

## 5. 消融实验

作者分别移除：

* SFT阶段；
* RL阶段；
* group reward；
* 外部知识记忆损失；
* 同时移除 group reward 和记忆损失。

完整模型在 Bamboogle 上为：

* F1：60.8；
* LLM Judge：59.2；
* 搜索次数：1.74。

移除 group reward 后：

* F1降至58.3；
* Judge降至56.8；
* 搜索次数增加到1.91。

移除记忆机制后：

* F1降至58.1；
* Judge降至57.2；
* 搜索次数增加到1.84。

在 Musique 上，移除记忆机制后下降更明显：

* F1从33.8降至31.0；
* Judge从32.8降至29.4。([ar5iv][3])

### 我的看法

消融说明两个组件都有贡献，但还不能证明其解释机制。

特别是“移除记忆损失后性能下降”，只能说明：

> 增加这些内部化轨迹进行训练有帮助。

它不能直接证明：

> 模型成功记住了搜索到的具体知识，并能在未来不搜索地调用它。

要证明后者，需要专门设计“先获取、后测试”的记忆实验。

---

## 6. 在线搜索实验

训练阶段使用的是静态 Wikipedia 检索库，但在线测试时换成：

* Google搜索API；
* 使用 GPT-4o-mini 对网页进行摘要；
* 再将摘要返回给模型。

在 Bamboogle 上：

| 方法            |       F1 | LLM Judge |     搜索次数 |
| ------------- | -------: | --------: | -------: |
| Search-o1     |     52.9 |      52.0 | **1.18** |
| R1-Searcher   |     67.5 |      68.8 |     1.72 |
| Search-R1     |     69.3 |      67.2 |     1.92 |
| R1-Searcher++ | **77.5** |  **76.0** |     1.70 |

在 Frames 上，R1-Searcher++也取得最高指标，但相对 R1-Searcher 的提升比较小：

* F1：33.8 对33.3；
* Judge：39.0 对38.0。([arXiv][2])

### 我的看法

这个实验说明搜索策略能够从本地 Wikipedia 检索迁移到在线搜索环境，这是一个明显优点。

但在线管线中加入了 GPT-4o-mini 摘要器，所以最终系统并非纯7B模型。虽然基线看起来使用了相同环境，但论文仍应更详细报告：

* 网页摘要调用成本；
* 延迟；
* token消耗；
* 原始网页和摘要质量的影响；
* 不使用 GPT-4o-mini 时的结果。

---

## 7. 搜索效率分析

在总计1625个测试问题上：

| 方法            |  正确数 / 正确题平均搜索 |  错误数 / 错误题平均搜索 |    总平均搜索 |
| ------------- | -------------: | -------------: | -------: |
| R1-Searcher   |     853 / 2.16 |     772 / 2.52 |     2.33 |
| Search-R1     |     761 / 3.30 |     864 / 3.60 |     3.46 |
| R1-Searcher++ | **881 / 1.41** | **744 / 1.78** | **1.58** |

([ar5iv][3])

这个结果很有说服力：

* 它并不是单纯少搜但答错更多；
* 正确数量反而最高；
* 正确题和错误题的搜索次数都明显减少。

这表明模型确实学到了一定程度的“搜索节制”。

但“搜索少”究竟来自：

1. 更准确的内部知识判断；
2. SFT让模型偏向不搜索；
3. 记忆了训练集事实；
4. group reward直接压低搜索行为；

论文还没有完全区分。

---

# Step 3：顶会审稿意见

## 优点

论文抓住了搜索智能体中的重要问题：**检索并不是越多越好**。方法将答案奖励、搜索效率奖励和知识内部化结合起来，思路清晰，工程上可实现。实验也显示，在维持相近回答质量的同时，搜索次数可以显著下降。

---

## 最终判断

### **Weak Reject / Borderline Reject**

理由如下：

* 研究问题重要，方法直观且实用；
* 搜索次数下降明显，在线搜索迁移结果也有价值；
* group reward 与成功轨迹内部化具有一定新意。

但对于顶会标准，当前版本存在两个关键缺口：

1. 标题和核心叙事强调“动态知识获取”，却没有直接证明知识被稳定、泛化地记住；
2. 结果依赖单一7B模型、有限测试子集和 LLM Judge，缺乏统计检验、完整成本分析与可复现代码。

补充严格的知识记忆实验、多个随机种子、准确率—成本曲线以及完整代码后，我会考虑提升至 **Weak Accept**。

---

# Step 4：组会简要汇报

R1-Searcher++研究如何让大模型动态选择内部知识或外部搜索。方法先用SFT教会模型内部推理与搜索调用格式，再通过RL奖励“答案正确且搜索较少”的轨迹，减少模型对检索器的过度依赖。同时，它将正确轨迹中的搜索文档改写为无搜索推理数据，通过辅助SFT写入模型参数。基于Qwen2.5-7B的实验显示，其LLM评测正确率优于R1-Searcher，平均搜索次数由2.30降至1.61，并能迁移到在线搜索环境。但其平均F1并未超过R1-Searcher，且尚未严格证明搜索知识能够被长期、泛化地记忆。

[1]: https://arxiv.org/abs/2505.17005 "[2505.17005] R1-Searcher++: Incentivizing the Dynamic Knowledge Acquisition of LLMs via Reinforcement Learning"
[2]: https://arxiv.org/pdf/2505.17005 "R1-Searcher++: Incentivizing the Dynamic Knowledge Acquisition of LLMs via Reinforcement Learning"
[3]: https://ar5iv.org/html/2505.17005v1 "[2505.17005] R1-Searcher++: Incentivizing the Dynamic Knowledge Acquisition of LLMs via Reinforcement Learning"
[4]: https://github.com/RUCAIBox/R1-Searcher-plus "GitHub - RUCAIBox/R1-Searcher-plus: R1-Searcher++: Incentivizing the Dynamic Knowledge Acquisition of LLMs via Reinforcement Learning · GitHub"
