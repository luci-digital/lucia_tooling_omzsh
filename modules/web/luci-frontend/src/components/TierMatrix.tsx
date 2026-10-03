import type { Tier } from '#/lib/luciverse'

interface Props {
  activeTier: Tier
  frequencies: Record<Tier, number>
  descriptions: Record<Tier, string>
  order: Tier[]
}

export default function TierMatrix({ activeTier, frequencies, descriptions, order }: Props) {
  const activeIndex = order.indexOf(activeTier)
  return (
    <div className="island-shell rounded-2xl p-6">
      <p className="island-kicker mb-4">Tier Architecture</p>
      <div className="flex flex-col gap-2">
        {order.map((tier, i) => {
          const freq = frequencies[tier]
          const isActive = tier === activeTier
          const isPast = activeIndex > i

          return (
            <div key={tier} className="flex items-start gap-3">
              {/* Flow indicator */}
              <div className="flex flex-col items-center pt-1">
                <div
                  className={[
                    'h-3 w-3 rounded-full border-2 transition-all',
                    isActive
                      ? 'border-[var(--lagoon)] bg-[var(--lagoon)] shadow-[0_0_8px_rgba(79,184,178,0.6)]'
                      : isPast
                        ? 'border-[var(--palm)] bg-[var(--palm)]'
                        : 'border-[var(--line)] bg-transparent',
                  ].join(' ')}
                />
                {i < order.length - 1 && (
                  <div
                    className={[
                      'mt-1 w-px flex-1 self-stretch',
                      isPast ? 'bg-[var(--palm)]' : 'bg-[var(--line)]',
                    ].join(' ')}
                    style={{ minHeight: 16 }}
                  />
                )}
              </div>

              {/* Tier card */}
              <div
                className={[
                  'flex-1 rounded-xl border px-4 py-2.5 transition-all',
                  isActive
                    ? 'border-[rgba(79,184,178,0.35)] bg-[rgba(79,184,178,0.08)]'
                    : 'border-[var(--line)] bg-transparent',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--sea-ink)]">{tier}</span>
                  <span className="text-xs font-semibold text-[var(--sea-ink-soft)]">
                    {freq} Hz
                  </span>
                </div>
                <p className="m-0 mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                  {descriptions[tier]}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-3 m-0 text-xs text-[var(--sea-ink-soft)]">
        Push-only — data flows {order.join(' → ')}. Pull forbidden.
      </p>
    </div>
  )
}
