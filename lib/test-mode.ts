import { assessmentItems } from '@/data/assessment';

declare const __TEST_MODE_ENABLED__: boolean;

export const isTestModeEnabled = __TEST_MODE_ENABLED__;

export function requireTestMode() {
  if (!isTestModeEnabled) throw new Error('Testing mode is disabled.');
}

export type TestPreset = 'aligned' | 'mixed' | 'studentHigher' | 'parentHigher';

export function mockAnswers(preset: TestPreset, role: 'self' | 'observer') {
  requireTestMode();
  return assessmentItems.map((item, index) => {
    const pattern = [5, 4, 4, 3, 2, 2][index % 6];
    const adjustment = preset === 'studentHigher' && role === 'self'
      ? 1
      : preset === 'parentHigher' && role === 'observer'
        ? 1
        : preset === 'mixed' && (index % 5 === 0 || index % 7 === 0)
          ? role === 'self' ? 1 : -1
          : 0;
    return { item_id: item.id, score: Math.max(1, Math.min(5, pattern + adjustment)) };
  });
}
