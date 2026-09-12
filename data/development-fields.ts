export interface DevelopmentFieldRule {
  id: string;
  title: string;
  description: string;
  signals: Array<{ dimension: string; subdimension: string; weight: number }>;
  action: string;
}

export const developmentFieldRules: DevelopmentFieldRule[] = [
  {
    id: 'engineering-product',
    title: '工程、技术与产品创造',
    description: '把复杂问题转化为可以搭建、测试和改进的解决方案。',
    signals: [
      { dimension: 'interest', subdimension: 'R 实践与操作', weight: 1.2 },
      { dimension: 'strengths', subdimension: '分析推理', weight: 1 },
      { dimension: 'strengths', subdimension: '创意联结', weight: 0.8 },
      { dimension: 'selfEfficacy', subdimension: '解决新问题', weight: 1 },
    ],
    action: '试着完成一个小型搭建或产品改进项目，记录哪个环节最吸引你。',
  },
  {
    id: 'science-research',
    title: '自然科学与研究探索',
    description: '从问题出发，通过证据、观察和反复验证理解世界。',
    signals: [
      { dimension: 'interest', subdimension: 'I 研究与探索', weight: 1.3 },
      { dimension: 'strengths', subdimension: '好奇探究', weight: 1.1 },
      { dimension: 'strengths', subdimension: '分析推理', weight: 1 },
      { dimension: 'values', subdimension: '成长与挑战', weight: 0.7 },
    ],
    action: '围绕一个真正好奇的问题，做一次资料检索或小实验。',
  },
  {
    id: 'data-computing',
    title: '数据、计算与系统分析',
    description: '在信息、规律和逻辑中找到可以支持判断的结构。',
    signals: [
      { dimension: 'interest', subdimension: 'I 研究与探索', weight: 1 },
      { dimension: 'interest', subdimension: 'C 组织与秩序', weight: 0.8 },
      { dimension: 'strengths', subdimension: '分析推理', weight: 1.3 },
      { dimension: 'selfEfficacy', subdimension: '理解复杂问题', weight: 1 },
    ],
    action: '选一份真实数据，用表格或简单代码找出一个值得解释的模式。',
  },
  {
    id: 'creative-media',
    title: '设计、媒体与创意表达',
    description: '把想法变成文字、视觉、声音、体验或其他可被感受的作品。',
    signals: [
      { dimension: 'interest', subdimension: 'A 创造与表达', weight: 1.3 },
      { dimension: 'strengths', subdimension: '创意联结', weight: 1.1 },
      { dimension: 'values', subdimension: '创造与表达', weight: 1 },
      { dimension: 'selfEfficacy', subdimension: '创造产出', weight: 0.8 },
    ],
    action: '给同一个主题做两种完全不同的表达版本，比较你更愿意深挖哪一种。',
  },
  {
    id: 'psychology-behavior',
    title: '心理、认知与行为科学',
    description: '理解人如何思考、感受、学习和做出选择。',
    signals: [
      { dimension: 'interest', subdimension: 'I 研究与探索', weight: 1 },
      { dimension: 'interest', subdimension: 'S 帮助与连接', weight: 1 },
      { dimension: 'strengths', subdimension: '共情理解', weight: 1.1 },
      { dimension: 'values', subdimension: '贡献与影响', weight: 0.8 },
    ],
    action: '选一个你关心的行为问题，阅读一篇研究摘要并记下新问题。',
  },
  {
    id: 'education-social',
    title: '教育、社会与人的发展',
    description: '通过理解与支持，帮助人学习、成长并更好地参与社会。',
    signals: [
      { dimension: 'interest', subdimension: 'S 帮助与连接', weight: 1.3 },
      { dimension: 'strengths', subdimension: '合作支持', weight: 1 },
      { dimension: 'strengths', subdimension: '表达沟通', weight: 0.9 },
      { dimension: 'values', subdimension: '贡献与影响', weight: 1 },
    ],
    action: '设计一次真实的教学、同伴支持或社区服务小任务。',
  },
  {
    id: 'business-public',
    title: '商业、组织与公共事务',
    description: '聚合资源和人，把想法推向行动，并在现实约束中实现影响。',
    signals: [
      { dimension: 'interest', subdimension: 'E 影响与推动', weight: 1.3 },
      { dimension: 'strengths', subdimension: '组织带动', weight: 1.1 },
      { dimension: 'strengths', subdimension: '规划执行', weight: 0.9 },
      { dimension: 'values', subdimension: '贡献与影响', weight: 0.7 },
    ],
    action: '找一个小型真实需求，组织两三个人把它推进到可见的结果。',
  },
  {
    id: 'health-life',
    title: '健康、生命与照护',
    description: '在科学理解、细致行动和对人的关注中改善健康。',
    signals: [
      { dimension: 'interest', subdimension: 'S 帮助与连接', weight: 1 },
      { dimension: 'interest', subdimension: 'I 研究与探索', weight: 0.9 },
      { dimension: 'strengths', subdimension: '共情理解', weight: 1 },
      { dimension: 'strengths', subdimension: '坚持投入', weight: 0.8 },
    ],
    action: '通过讲座、志愿服务或职业访谈，观察该领域的日常任务。',
  },
];
