import React from 'react';

export type RateLimit = { scope: 'agent' | 'principal' | 'agent+principal'; rpm?: number; rph?: number };

export function RateLimitConfig({ onRateLimitsChange }: { onRateLimitsChange: (limits: RateLimit[]) => void }) {
  const [rpm, setRpm] = React.useState<number>(600);
  React.useEffect(() => { onRateLimitsChange([{ scope: 'agent+principal', rpm }]); }, [rpm]);

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium">Rate Limits</h2>
      <div className="flex items-center gap-2">
        <label>RPM (max 600)</label>
        <input
          className="border px-2 py-1 w-24"
          type="number"
          min={0}
          max={600}
          value={rpm}
          onChange={e => {
            const n = parseInt(e.target.value || '0', 10);
            setRpm(Number.isFinite(n) ? Math.max(0, Math.min(600, n)) : 0);
          }}
        />
      </div>
    </div>
  );
}
