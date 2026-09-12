import { dimensionLabels, dimensionOrder } from '@/data/dimensions';
import type { PortraitProfile } from '@/types/portrait';

const colors = {
  self: { fill: '#B9B7FF', stroke: '#7772DC' },
  observer: { fill: '#F4B27A', stroke: '#D87955' },
};

function polygonPoints(profile: PortraitProfile, radius = 105, center = 150) {
  return dimensionOrder
    .map((dimension, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / dimensionOrder.length;
      const value = Math.max(1, profile.dimensions[dimension]);
      const r = 28 + ((value - 1) / 4) * (radius - 28);
      return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
    })
    .join(' ');
}

function guidePoints(radius: number, center = 150) {
  return dimensionOrder
    .map((_, index) => {
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / dimensionOrder.length;
      return `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
    })
    .join(' ');
}

export function PortraitVisual({
  self,
  observer,
  compact = false,
}: {
  self: PortraitProfile;
  observer?: PortraitProfile | null;
  compact?: boolean;
}) {
  return (
    <div className={`portrait-visual ${compact ? 'portrait-visual--compact' : ''}`}>
      <svg viewBox="0 0 300 300" aria-label="五维发展画像">
        <defs>
          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.08" />
          </filter>
        </defs>
        {[48, 76, 105].map((radius) => (
          <polygon key={radius} points={guidePoints(radius)} className="portrait-guide" />
        ))}
        {dimensionOrder.map((dimension, index) => {
          const angle = -Math.PI / 2 + (index * Math.PI * 2) / dimensionOrder.length;
          const x = 150 + Math.cos(angle) * 128;
          const y = 150 + Math.sin(angle) * 128;
          return (
            <text
              key={dimension}
              x={x}
              y={y}
              dominantBaseline="middle"
              textAnchor={x < 135 ? 'end' : x > 165 ? 'start' : 'middle'}
              className="portrait-label"
            >
              {dimensionLabels[dimension]}
            </text>
          );
        })}
        <polygon
          points={polygonPoints(self)}
          fill={colors.self.fill}
          stroke={colors.self.stroke}
          className="portrait-shape portrait-shape--self"
          filter="url(#soft-shadow)"
        />
        {observer && (
          <polygon
            points={polygonPoints(observer)}
            fill={colors.observer.fill}
            stroke={colors.observer.stroke}
            className="portrait-shape portrait-shape--observer"
          />
        )}
      </svg>
      {observer && (
        <div className="portrait-legend" aria-label="画像图例">
          <span><i className="legend-dot legend-dot--self" />我眼中的我</span>
          <span><i className="legend-dot legend-dot--observer" />TA 眼中的我</span>
        </div>
      )}
    </div>
  );
}
