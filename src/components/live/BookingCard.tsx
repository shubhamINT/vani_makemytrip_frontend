import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, Plane, Hotel, Compass, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { BookingConfirmation } from '../../lib/streamTypes';

const KIND_ICON: Record<NonNullable<BookingConfirmation['kind']>, LucideIcon> = {
  flight: Plane,
  hotel: Hotel,
  experience: Compass,
};

/**
 * Confirmed booking / e-ticket. Bespoke card matching the hotel/flight polish
 * (shared Card + Button tokens); boarding-pass motif is the one flourish.
 */
export default function BookingCard({
  data,
  onAction,
}: {
  data: BookingConfirmation;
  onAction: (message: string) => void;
}) {
  const reduced = useReducedMotion();
  const KindIcon = data.kind ? KIND_ICON[data.kind] : Plane;

  return (
    <motion.section
      aria-label={data.title ?? 'Booking confirmation'}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden p-0 transition-shadow hover:shadow-float">
        {/* Header: title + reference */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-soft text-sky-brand">
              <KindIcon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold leading-tight text-ink">
                {data.title ?? 'Booking Confirmation'}
              </h2>
              {data.status && (
                <span className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-semibold text-emerald-brand">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  {data.status}
                </span>
              )}
            </div>
          </div>
          {data.reference && (
            <span className="shrink-0 rounded-lg bg-paper-2 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-muted">
              {data.reference}
            </span>
          )}
        </div>

        {/* Headline highlight */}
        {(data.headline || data.subhead) && (
          <div className="mx-5 mt-4 rounded-xl border-l-4 border-emerald-brand bg-emerald-soft/40 px-4 py-3">
            {data.headline && (
              <p className="font-display text-[15px] font-bold text-emerald-brand">{data.headline}</p>
            )}
            {data.subhead && <p className="mt-0.5 text-[13px] text-ink">{data.subhead}</p>}
          </div>
        )}

        {/* Detail rows — ticket stub */}
        {data.details.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2 px-5">
            {data.details.map((d, i) => (
              <li
                key={`${d.label}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-paper/60 px-3 py-2.5"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-[11px] font-bold text-faint shadow-sm">
                  {i + 1}
                </span>
                <span className="min-w-0 text-[13px] text-ink">
                  <span className="font-semibold text-muted">{d.label}: </span>
                  {d.value}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Perforated divider — boarding-pass flourish */}
        {data.actions && data.actions.length > 0 && (
          <>
            <div className="relative mt-5" aria-hidden="true">
              <span className="absolute -left-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-paper" />
              <span className="absolute -right-2 top-1/2 size-4 -translate-y-1/2 rounded-full bg-paper" />
              <div className="mx-5 border-t border-dashed border-line" />
            </div>
            <div className="flex flex-wrap gap-2 px-5 pb-5 pt-4">
              {data.actions.map((a, i) => (
                <Button
                  key={`${a.label}-${i}`}
                  size="sm"
                  variant={a.variant === 'secondary' ? 'outline' : 'primary'}
                  onClick={() => {
                    if (a.url) window.open(a.url, '_blank', 'noopener');
                    else if (a.action) onAction(a.action);
                  }}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </>
        )}
      </Card>
    </motion.section>
  );
}
