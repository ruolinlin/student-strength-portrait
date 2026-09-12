import { assessmentItems } from '@/data/assessment';
import { dimensionOrder } from '@/data/dimensions';
import type { DimensionKey } from '@/types/assessment';
import type { PortraitProfile, SubdimensionScore } from '@/types/portrait';

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const rounded = (value: number) => Math.round(value * 100) / 100;

const preferenceLabels: Record<string, [string, string]> = {
  '具体 ↔ 抽象': ['具体', '抽象'],
  '独立 ↔ 互动': ['独立加工', '互动加工'],
  '计划 ↔ 探索': ['计划', '探索'],
  '分析 ↔ 人本': ['分析', '人本'],
};

export function scoreProfile(answers: Record<string, number>): PortraitProfile {
  const grouped = new Map<string, { dimension: DimensionKey; label: string; scores: number[] }>();

  for (const item of assessmentItems) {
    const raw = answers[item.id];
    if (!raw) continue;
    const score =
      item.dimension === 'preferences' && item.preferencePole === 'left' ? 6 - raw : raw;
    const key = `${item.dimension}:${item.subdimension}`;
    const entry = grouped.get(key) ?? {
      dimension: item.dimension,
      label: item.subdimension,
      scores: [],
    };
    entry.scores.push(score);
    grouped.set(key, entry);
  }

  const subdimensions: SubdimensionScore[] = [...grouped.entries()].map(
    ([key, entry]) => ({
      key,
      label: entry.label,
      dimension: entry.dimension,
      score: rounded(average(entry.scores)),
      ...(entry.dimension === 'preferences'
        ? {
            leftLabel: preferenceLabels[entry.label]?.[0],
            rightLabel: preferenceLabels[entry.label]?.[1],
          }
        : {}),
    }),
  );

  const dimensions = Object.fromEntries(
    dimensionOrder.map((dimension) => {
      const values = subdimensions
        .filter((entry) => entry.dimension === dimension)
        .map((entry) => entry.score);
      if (dimension === 'preferences') {
        // The overview shows preference clarity, not a better/worse direction.
        const clarity = 1 + average(values.map((value) => Math.abs(value - 3))) * 2;
        return [dimension, rounded(clarity)];
      }
      return [dimension, rounded(average(values))];
    }),
  ) as Record<DimensionKey, number>;

  return { dimensions, subdimensions };
}

export function describeSubdimension(entry: SubdimensionScore): string {
  if (entry.dimension !== 'preferences') return entry.label;
  if (entry.score < 2.75) return entry.leftLabel ?? entry.label;
  if (entry.score > 3.25) return entry.rightLabel ?? entry.label;
  return `${entry.leftLabel} · ${entry.rightLabel}之间`;
}

export function completeAnswerMap(
  records: Array<{ item_id: string; score: number }>,
): Record<string, number> {
  return Object.fromEntries(records.map((record) => [record.item_id, record.score]));
}
