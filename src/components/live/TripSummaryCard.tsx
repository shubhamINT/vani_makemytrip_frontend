import { ArrowRight, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TripSummaryData } from '../../lib/streamTypes';

const ROWS: { key: keyof TripSummaryData; label: string }[] = [
  { key: 'destination', label: 'Destination' },
  { key: 'dates', label: 'Dates' },
  { key: 'duration', label: 'Duration' },
  { key: 'travelers', label: 'Travelers' },
  { key: 'budget', label: 'Budget (Est.)' },
];

/** Pinned trip summary fed by the agent over the `trip.summary` topic. */
export default function TripSummaryCard({
  summary,
  onAction,
}: {
  summary: TripSummaryData;
  onAction: (a: string) => void;
}) {
  const rows = ROWS.filter((r) => summary[r.key]);

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="font-display text-[15px] font-bold text-ink">Trip Summary</h2>
        <span className="flex -space-x-2" aria-hidden="true">
          <span className="flex size-7 items-center justify-center rounded-full bg-coral-soft ring-2 ring-surface">
            <User className="size-3.5 text-coral-ink" />
          </span>
          <span className="flex size-7 items-center justify-center rounded-full bg-sky-soft ring-2 ring-surface">
            <User className="size-3.5 text-sky-brand" />
          </span>
        </span>
      </div>

      <dl className="divide-y divide-line">
        {rows.map((r) => (
          <div key={r.key} className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="text-xs font-medium text-faint">{r.label}</dt>
            <dd className="text-right text-[13px] font-semibold text-ink">{summary[r.key]}</dd>
          </div>
        ))}
      </dl>

      <Button
        variant="outline"
        className="mt-3 w-full"
        onClick={() => onAction(summary.fullPlanAction ?? 'Show me the full trip plan')}
      >
        View Full Plan
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </Card>
  );
}
