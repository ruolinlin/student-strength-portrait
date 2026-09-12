import type { DimensionKey } from '@/types/assessment';

export const dimensionLabels: Record<DimensionKey, string> = {
  interest: '兴趣',
  strengths: '优势',
  preferences: '偏好',
  values: '价值',
  selfEfficacy: '能力信心',
};

export const dimensionOrder: DimensionKey[] = [
  'interest',
  'strengths',
  'preferences',
  'values',
  'selfEfficacy',
];

export const sections: Array<{
  dimension: DimensionKey;
  title: string;
  description: string;
  startIndex: number;
}> = [
  {
    dimension: 'interest',
    title: '什么会吸引你？',
    description: '有些事情会让我们不知不觉多看一眼、多想一点。',
    startIndex: 0,
  },
  {
    dimension: 'strengths',
    title: '你通常怎么把事情做好？',
    description: '很多优势，并不是我们主动给自己贴上的标签。',
    startIndex: 18,
  },
  {
    dimension: 'preferences',
    title: '什么方式更像你？',
    description: '没有哪一种方式更好，只是不同的人更自然地使用不同的方法。',
    startIndex: 38,
  },
  {
    dimension: 'values',
    title: '什么对你真正重要？',
    description: '我们做选择的时候，真正重要的东西常常不完全一样。',
    startIndex: 50,
  },
  {
    dimension: 'selfEfficacy',
    title: '面对新的事情，你怎么看自己的能力？',
    description:
      '不是问你“到底有多厉害”，而是你通常有多相信自己能够找到办法。',
    startIndex: 62,
  },
];

export const responseLabels = {
  self: [
    '完全不像我',
    '不太像我',
    '有点像，也有点不像',
    '挺像我',
    '很像我',
  ],
  observer: [
    '完全不像TA',
    '不太像TA',
    '有点像，也有点不像',
    '挺像TA',
    '很像TA',
  ],
};
