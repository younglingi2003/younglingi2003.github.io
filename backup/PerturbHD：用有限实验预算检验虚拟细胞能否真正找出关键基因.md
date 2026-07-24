## 一句话概括

这篇论文直接追问：

> **现在的“AI虚拟细胞”虽然能预测基因扰动后的表达变化，但它们真的能帮助科学家更快找到重要基因和药物靶点吗？**

作者认为，过去的考试方式没有真正回答这个问题，于是提出了新的评测框架 **PerturbHD**，专门衡量模型能否帮助科学家完成“有效发现”。这是一篇2026年4月发布的预印本，尚未经过正式同行评审。([[生物预印本](https://www.biorxiv.org/content/10.64898/2026.04.23.719015v1?utm_source=chatgpt.com)][1])

---

## 1. AI虚拟细胞在做什么？

假设科学家想知道：

> 关闭基因A后，细胞里的其他基因会发生什么变化？

AI虚拟细胞模型会输入：

```text
当前细胞状态
+
关闭基因A
```

然后预测：

```text
基因B上升
基因C下降
基因D不变
……
```

GEARS、PRESAGE等模型都在尝试完成这种“基因扰动预测”。论文评测中也包含简单线性模型、平均值基线和大语言模型Claude。([[生物预印本](https://www.biorxiv.org/content/10.64898/2026.04.23.719015v1.full-text?utm_source=chatgpt.com)][2])

---

## 2. 过去的评分方式有什么问题？

传统评测通常比较：

> AI预测的整张基因表达表，与真实实验结果有多接近。

例如使用：

* 平均误差；
* 相关系数；
* 前100个变化最大基因的误差。

但科学家真正关心的往往不是：

> “两万多个基因的平均误差是多少？”

而是：

> **“我的实验经费只够测试5%的候选基因，AI能否把真正重要的基因排在最前面？”**

一个模型可能把大量变化很小的基因预测得很准，因此整体分数很好；但它如果漏掉了真正关键的几个候选基因，对科学发现仍然没有太大帮助。

作者并不是说所有旧指标都没用。论文发现，部分指标，例如针对变化最大基因的误差和Systema相关性，与实际发现能力有较强联系；但它们仍然只是间接指标。([[生物预印本](https://www.biorxiv.org/content/10.64898/2026.04.23.719015v1.full-text?utm_source=chatgpt.com)][2])

---

## 3. PerturbHD怎样重新考试？

PerturbHD把问题改成了：

> **AI能否帮助科学家找到真正值得实验验证的“命中候选物”？**

这里的 **hit（命中）**，可以理解为：

> 改变某个基因后，某条生物通路或细胞功能发生了足够明显的变化。

例如科学家想找到能增强免疫反应的基因，那么真正显著增强免疫通路的基因扰动就是“hit”。

PerturbHD主要模拟两种现实情况。([[OA Monitor Ireland](https://oamonitor.ireland.openaire.eu/national/search/publication?pid=10.64898%2F2026.04.23.719015&utm_source=chatgpt.com)][3])

### 情况一：实验预算有限

假设有1000个候选基因，但经费只够实验50个。

模型需要把候选基因排序，PerturbHD检查：

> 模型选出的前5%，包含了多少真正重要的基因？

这叫作 **固定预算下的命中召回率**。([[GitHub](https://raw.githubusercontent.com/snap-stanford/perturb-hd/main/packages/perturb-hd/src/perturb_hd/hit_discovery.py)][4])

### 情况二：不能出现太多假阳性

有时研究人员会规定：

> 选出的候选物里，错误候选的比例不能超过20%。

PerturbHD检查模型在这个错误率限制下，还能找回多少真正的命中基因。

这更接近药物筛选或实验设计中的真实决策，而不是单纯比较两张数字表。([[生物预印本](https://www.biorxiv.org/content/10.64898/2026.04.23.719015v1.full-text?utm_source=chatgpt.com)][2])

---

## 4. 作者测试了什么？

作者在四种细胞背景中测试模型：

* K562；
* RPE1；
* HepG2；
* Jurkat。

比较的方法包括：

* **GEARS**：基因扰动预测模型；
* **PRESAGE**：扰动效应预测模型；
* **线性模型**：较简单的机器学习方法；
* **平均值模型**：几乎不区分具体扰动；
* **Claude**：根据已有生物知识直接对候选基因排序；
* **实验重复数据**：用另一次真实实验结果排序，代表模型在实验噪声下可能达到的参考上限。

作者也公开了PerturbHD的代码、指标实现和复现实验数据。([[GitHub](https://raw.githubusercontent.com/snap-stanford/perturb-hd/main/analysis/notebooks/fig1_hit_discovery.ipynb)][5])

---

## 5. 最重要的结果是什么？

### 第一：虚拟细胞模型并非完全没用

当实验预算只能覆盖5%的候选基因时，随机或平均值方法通常只能找到约5%的真正命中。

GEARS、线性模型和PRESAGE能找到更多，说明它们确实学到了一些有用规律。在不同细胞数据上，这些模型大致能找回约18%至43%的命中。([[GitHub](https://raw.githubusercontent.com/snap-stanford/perturb-hd/main/analysis/notebooks/fig1_hit_discovery.ipynb)][5])

所以答案不是：

> “现在的虚拟细胞完全没用。”

而是：

> **它们已经有一定筛选能力，但能力还比较有限。**

---

### 第二：大语言模型也很有竞争力

Claude只根据已有的生物医学知识进行推理和排序，并没有直接模拟完整的单细胞基因表达。

但在固定5%实验预算下，它在四个数据集中的命中召回率约为28%至45%，总体上与PRESAGE等专门模型相当，部分情况下还略高。([[GitHub](https://raw.githubusercontent.com/snap-stanford/perturb-hd/main/analysis/notebooks/fig1_hit_discovery.ipynb)][5])

这说明：

> **现有文献和生物学知识本身，就能提供很强的候选基因排序信号。**

一个复杂虚拟细胞模型如果不能稳定超过知识型大语言模型，就还不能证明自己真正学到了更深的细胞规律。

---

### 第三：距离真实实验上限还有明显差距

使用另一次真实实验结果进行排序时，在5%预算下通常能找回约49%至68%的命中，明显高于当前AI模型。([[GitHub](https://raw.githubusercontent.com/snap-stanford/perturb-hd/main/analysis/notebooks/fig1_hit_discovery.ipynb)][5])

这说明：

* 实验本身存在噪声，不可能做到100%；
* 但当前模型距离实验数据能够提供的信息上限仍然很远；
* 提升模型还有较大空间。

---

### 第四：严格控制错误率后，模型表现明显下降

当要求错误发现率不超过20%时，GEARS、线性模型、PRESAGE和Claude找回的真正命中通常只有约1%至12%。

作为参考，真实实验重复数据大约能找回15%至31%。([[GitHub](https://raw.githubusercontent.com/snap-stanford/perturb-hd/main/analysis/notebooks/fig1_hit_discovery.ipynb)][5])

换句话说：

> **当前模型可以帮助粗略缩小候选范围，但如果要求“选出来的大部分都是真的”，能力仍然不足。**

---

## 6. 最简单的类比

假设有1000把钥匙，只有20把能打开门。

传统评测问：

> AI能否准确描述每把钥匙的长度、颜色和重量？

PerturbHD问：

> 我只能实际尝试50把钥匙，AI能否把真正能开门的钥匙排在前50名？

后一个问题显然更接近实际用途。

一个模型即使把所有钥匙的外观描述得很准确，如果没有把能开门的钥匙排在前面，对寻找正确钥匙仍然帮助不大。

---

## 7. 这篇论文为什么重要？

它把虚拟细胞的评测目标从：

```text
预测整张基因表达表有多准确
```

转变为：

```text
能否减少真实实验数量
+
能否优先找到关键候选基因
+
能否在可接受错误率下产生发现
```

也就是说，作者主张：

> **评价虚拟细胞，不应该只看模型预测得像不像，而应该看它能不能改变科学家的实验决策。**

PerturbHD的开源实现也明确提供了固定实验预算、固定错误发现率等发现导向指标。([[GitHub](https://raw.githubusercontent.com/snap-stanford/perturb-hd/main/packages/perturb-hd/src/perturb_hd/hit_discovery.py)][4])

---

## 最核心的结论

> **当前AI虚拟细胞已经能够帮助科学家缩小候选范围，但还没有强到可以可靠替代真实筛选实验；真正合理的评价标准，应当直接测量它能否帮助找到关键基因和生物学发现，而不是只看平均预测误差。**

这篇论文与前面几篇工作的关系可以这样理解：

* **Systema**：检查模型是否真的区分了不同基因扰动；
* **Cell Embedding Metrics**：检查漂亮的细胞地图是否保留真实生物关系；
* **PerturbHD**：进一步追问，即使预测分数不错，模型究竟能不能帮助科学家发现真正重要的候选物。

[1]: https://www.biorxiv.org/content/10.64898/2026.04.23.719015v1?utm_source=chatgpt.com "Are Current AI Virtual Cell Models Useful for Scientific ..."
[2]: https://www.biorxiv.org/content/10.64898/2026.04.23.719015v1.full-text?utm_source=chatgpt.com "Are Current AI Virtual Cell Models Useful for Scientific ..."
[3]: https://oamonitor.ireland.openaire.eu/national/search/publication?pid=10.64898%2F2026.04.23.719015&utm_source=chatgpt.com "Are Current AI Virtual Cell Models Useful for Scientific Discovery?"
[4]: https://raw.githubusercontent.com/snap-stanford/perturb-hd/main/packages/perturb-hd/src/perturb_hd/hit_discovery.py "raw.githubusercontent.com"
[5]: https://raw.githubusercontent.com/snap-stanford/perturb-hd/main/analysis/notebooks/fig1_hit_discovery.ipynb "raw.githubusercontent.com"