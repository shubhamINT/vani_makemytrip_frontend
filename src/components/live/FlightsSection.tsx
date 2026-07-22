import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { Flight, FlightsList } from '../../lib/streamTypes';

// Airline name → IATA carrier code, for logos when the flight number is absent.
const AIRLINE_IATA: Record<string, string> = {
  indigo: '6E',
  'air india': 'AI',
  'air india express': 'IX',
  vistara: 'UK',
  spicejet: 'SG',
  akasa: 'QP',
  'akasa air': 'QP',
  'go first': 'G8',
  goair: 'G8',
  'alliance air': '9I',
};

/** IATA carrier code from the flight number prefix ("6E 2041" → "6E") or airline name. */
function carrierCode(flight: Flight): string | null {
  const prefix = flight.flightNo?.trim().match(/^([A-Z0-9]{2})/i)?.[1];
  if (prefix) return prefix.toUpperCase();
  return AIRLINE_IATA[flight.airline.trim().toLowerCase()] ?? null;
}

/** Real airline logo URL (falls back to the payload's logo, then to initials). */
function logoUrl(flight: Flight): string | undefined {
  if (flight.logo) return flight.logo;
  const code = carrierCode(flight);
  return code ? `https://pics.avs.io/120/120/${code}.png` : undefined;
}

/** "Recommended Flights": airline, times, duration ornament, price + fare tag. */
export default function FlightsSection({
  data,
  limit,
  onAction,
}: {
  data: FlightsList;
  limit?: number;
  onAction: (a: string) => void;
}) {
  const flights = limit ? data.flights.slice(0, limit) : data.flights;
  const reduced = useReducedMotion();

  return (
    <section aria-label={data.title ?? 'Recommended flights'}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink">
          {data.title ?? 'Recommended Flights'}
        </h2>
        {data.viewAllAction && (
          <Button variant="link" size="sm" className="px-0" onClick={() => onAction(data.viewAllAction!)}>
            View all
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {flights.map((f, i) => (
          <motion.div
            key={f.id}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: reduced ? 0 : i * 0.07, ease: 'easeOut' }}
          >
            <FlightRow flight={f} onAction={onAction} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FlightRow({ flight, onAction }: { flight: Flight; onAction: (a: string) => void }) {
  const [logoOk, setLogoOk] = useState(true);
  const logo = logoUrl(flight);

  return (
    <Card className="flex items-center gap-4 px-4 py-3 transition-shadow hover:shadow-float">
      <div className="flex w-32 min-w-0 shrink-0 items-center gap-2.5">
        <Avatar className="size-9 border border-line bg-surface">
          {logo && logoOk ? (
            <AvatarImage src={logo} alt="" className="object-contain p-1" onError={() => setLogoOk(false)} />
          ) : null}
          <AvatarFallback className="bg-sky-soft text-sky-brand">
            {flight.airline.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-bold text-ink">{flight.airline}</span>
          {flight.flightNo && <span className="block text-[11px] text-faint">{flight.flightNo}</span>}
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center gap-3 sm:gap-5">
        <span className="text-right">
          <span className="block font-display text-[17px] font-extrabold leading-tight text-ink">
            {flight.depart.time}
          </span>
          <span className="block text-[11px] font-semibold text-faint">{flight.depart.code}</span>
        </span>

        <span className="flex w-24 flex-col items-center gap-1 sm:w-32" aria-hidden="true">
          <span className="text-[11px] font-medium text-muted">{flight.duration}</span>
          <span className="relative h-px w-full bg-line">
            <span className="absolute left-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full border border-faint bg-surface" />
            <span className="absolute right-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-faint" />
          </span>
          {flight.stops && <span className="text-[11px] text-faint">{flight.stops}</span>}
        </span>

        <span>
          <span className="block font-display text-[17px] font-extrabold leading-tight text-ink">
            {flight.arrive.time}
          </span>
          <span className="block text-[11px] font-semibold text-faint">{flight.arrive.code}</span>
        </span>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-display text-[16px] font-extrabold text-ink">{flight.price}</span>
        {flight.tag && <Badge variant="success">{flight.tag}</Badge>}
      </div>

      <Button size="sm" variant="outline" className="shrink-0" onClick={() => onAction(flight.action)}>
        Book
      </Button>
    </Card>
  );
}
