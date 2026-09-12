import { describeSubdimension } from './scoring';
import type { ComparisonEntry, ComparisonProfile, PortraitProfile } from '@/types/portrait';

const DIFFERENCE_THRESHOLD = 0.75;

export function compareProfiles(
  selfProfile: PortraitProfile,
  observerProfile: PortraitProfile,
): ComparisonProfile {
  const observerByKey = new Map(
    observerProfile.subdimensions.map((entry) => [entry.key, entry]),
  );

  const entries: ComparisonEntry[] = selfProfile.subdimensions.flatMap((self) => {
    const observer = observerByKey.get(self.key);
    if (!observer) return [];
    return [
      {
        key: self.key,
        label: self.label,
        dimension: self.dimension,
        self: self.score,
        observer: observer.score,
        difference: Math.round((observer.score - self.score) * 100) / 100,
        displayLabel: describeSubdimension(self),
      },
    ];
  });

  const sharedHigh = entries
    .filter((entry) => {
      if (entry.dimension === 'preferences') {
        return (
          (entry.self >= 3.75 && entry.observer >= 3.75) ||
          (entry.self <= 2.25 && entry.observer <= 2.25)
        );
      }
      return entry.self >= 4 && entry.observer >= 4;
    })
    .sort((a, b) => b.self + b.observer - (a.self + a.observer));

  const notableDifferences = entries
    .filter((entry) => Math.abs(entry.difference) >= DIFFERENCE_THRESHOLD)
    .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

  return {
    sharedHigh,
    observerHigher: notableDifferences.filter((entry) => entry.difference > 0),
    selfHigher: notableDifferences.filter((entry) => entry.difference < 0),
    notableDifferences,
  };
}
