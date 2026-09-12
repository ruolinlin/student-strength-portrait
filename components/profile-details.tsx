import { dimensionLabels, dimensionOrder } from '@/data/dimensions';
import { describeSubdimension } from '@/lib/scoring';
import type { PortraitProfile } from '@/types/portrait';

export function ProfileDetails({ profile }: { profile: PortraitProfile }) {
  return (
    <div className="profile-details">
      {dimensionOrder.map((dimension) => {
        const entries = profile.subdimensions
          .filter((entry) => entry.dimension === dimension)
          .sort((a, b) => {
            if (dimension === 'preferences') return 0;
            return b.score - a.score;
          });
        return (
          <section key={dimension} className="profile-group">
            <div className="profile-group__heading">
              <h3>{dimensionLabels[dimension]}</h3>
              <span>
                {dimension === 'preferences'
                  ? '看见更自然的方式'
                  : '当下画像中的线索'}
              </span>
            </div>
            <div className="signal-list">
              {entries.map((entry) => (
                <div key={entry.key} className="signal-row">
                  <span>{describeSubdimension(entry)}</span>
                  {dimension === 'preferences' ? (
                    <div className="spectrum" aria-label={`${entry.leftLabel}到${entry.rightLabel}`}>
                      <span>{entry.leftLabel}</span>
                      <i><b style={{ left: `${((entry.score - 1) / 4) * 100}%` }} /></i>
                      <span>{entry.rightLabel}</span>
                    </div>
                  ) : (
                    <div className="signal-meter" aria-label={`${entry.score.toFixed(1)} / 5`}>
                      <i style={{ width: `${((entry.score - 1) / 4) * 100}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
