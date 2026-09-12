import type { StructuredExport } from '@/types/professional';

export function buildStructuredExport(data: StructuredExport): StructuredExport {
  return {
    ...data,
    developmentExploration: data.developmentExploration.map(
      ({ id, title, level, description, signals, action }) => ({
        id,
        title,
        level,
        description,
        signals,
        action,
      }),
    ),
  };
}

export function buildProfessionalPrompt(data: StructuredExport): string {
  const structuredProfile = JSON.stringify(
    {
      assessmentVersion: data.assessmentVersion,
      selfProfile: data.selfProfile,
      observerProfile: data.observerProfile,
      sharedProfile: data.sharedProfile,
      developmentExploration: data.developmentExploration,
    },
    null,
    2,
  );
  const context = JSON.stringify(data.context, null, 2);

  return `你是一名负责高中生大学专业探索与生涯发展的研究型分析助手。

你的任务不是根据测评结果直接决定学生“适合什么专业”，而是结合：

1. 学生自我画像；
2. 熟悉学生的人提供的观察画像；
3. 两种视角的一致与差异；
4. 学生当前学业表现；
5. 学习经历与课外经历；
6. 学生与家庭的现实考虑；
7. 当前最新大学专业设置、课程内容及职业发展信息；

形成一份结构化、证据导向、保持开放性的生涯与专业探索报告。

必须遵循：

- 不进行人格定型；
- 不把兴趣等同于能力；
- 不把他评视为比自评更正确；
- 不因单一高分推荐专业；
- 不使用“最适合”“一定适合”“不适合”等确定性语言；
- 区分内在倾向、可观察优势、现实学业表现和能力信心；
- 明确指出信息不足、矛盾和不确定性；
- 对当前大学专业、课程、就业和职业趋势进行实时检索；
- 优先使用大学官方、政府、专业协会、行业机构和高质量劳动力市场来源；
- 对时效性信息注明来源和日期；
- 不用网络热度代替证据。

===== STUDENT PROFILE =====

${structuredProfile}

===== CONTEXT =====

${context}

===== KEY QUESTION =====

${data.context.keyQuestion || '尚未填写'}

===== REQUIRED REPORT STRUCTURE =====

01 学生当前的发展画像
综合提炼 3–5 个最有意义的模式，不要只重复分数。

02 Self Portrait 与 Portrait from Others
说明学生如何理解自己，以及熟悉 TA 的人如何理解 TA。

03 我们共同看见的优势
识别两种视角都注意到的有意义区域。

04 值得进一步理解的视角差异
中性解释差异，提出具体假设而非下结论。

05 学业与发展画像的交叉分析
比较测评、学业表现、项目、活动和行为经历，不把任何单一来源视为定论。

06 值得探索的专业方向
使用 A 优先深入探索、B 值得比较探索、C 目前证据不足但可以保持开放。每个方向说明理由、画像信号、学业证据、经验证据、不确定性和可能的反证。

07 当前大学与职业现实
检索当前专业、课程、大学示例、先修要求、研究生要求、职业路径、劳动力市场、新兴领域与地域差异，并引用当前权威来源。

08 下一步验证行动
从学业探索、真实经历、人物访谈和反思中，提出约 3–5 个可执行的下一步。不要以“因此选择某专业”结束。`;
}

export function buildMarkdown(data: StructuredExport): string {
  return `# 学生发展优势测评·专业解读资料包

> 测评版本：${data.assessmentVersion}

## 结构化画像

\`\`\`json
${JSON.stringify(
  {
    selfProfile: data.selfProfile,
    observerProfile: data.observerProfile,
    sharedProfile: data.sharedProfile,
    developmentExploration: data.developmentExploration,
  },
  null,
  2,
)}
\`\`\`

## 背景信息

\`\`\`json
${JSON.stringify(data.context, null, 2)}
\`\`\`

## 专业解读 Prompt

${buildProfessionalPrompt(data)}
`;
}

export function downloadText(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
