import type { DimensionKey } from './assessment';

export interface SubdimensionScore {
  key: string;
  label: string;
  dimension: DimensionKey;
  score: number;
  leftLabel?: string;
  rightLabel?: string;
}

export interface PortraitProfile {
  dimensions: Record<DimensionKey, number>;
  subdimensions: SubdimensionScore[];
}

export interface ComparisonEntry {
  key: string;
  label: string;
  dimension: DimensionKey;
  self: number;
  observer: number;
  difference: number;
  displayLabel: string;
}

export interface ComparisonProfile {
  sharedHigh: ComparisonEntry[];
  selfHigher: ComparisonEntry[];
  observerHigher: ComparisonEntry[];
  notableDifferences: ComparisonEntry[];
}

export interface ExplorationField {
  id: string;
  title: string;
  level: '很值得探索' | '值得探索' | '可以了解';
  description: string;
  signals: string[];
  score: number;
  action: string;
}
