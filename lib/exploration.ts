import { developmentFieldRules } from '@/data/development-fields';
import type { ExplorationField, PortraitProfile } from '@/types/portrait';

export function buildExploration(profile: PortraitProfile): ExplorationField[] {
  const byKey = new Map(
    profile.subdimensions.map((entry) => [
      `${entry.dimension}:${entry.label}`,
      entry.score,
    ]),
  );

  return developmentFieldRules
    .map((field) => {
      let weightedTotal = 0;
      let weightTotal = 0;
      const signals = field.signals
        .map((signal) => ({
          ...signal,
          score: byKey.get(`${signal.dimension}:${signal.subdimension}`) ?? 0,
        }))
        .filter((signal) => signal.score > 0);
      for (const signal of signals) {
        weightedTotal += signal.score * signal.weight;
        weightTotal += signal.weight;
      }
      const score = weightTotal ? weightedTotal / weightTotal : 0;
      return {
        id: field.id,
        title: field.title,
        description: field.description,
        score,
        signals: signals
          .sort((a, b) => b.score - a.score)
          .slice(0, 4)
          .map((signal) => signal.subdimension.replace(/^[RIASEC] /, '')),
        level:
          score >= 4
            ? '很值得探索'
            : score >= 3.4
              ? '值得探索'
              : '可以了解',
        action: field.action,
      } satisfies ExplorationField;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}
