import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HotelCard from './HotelCard';
import type { HotelsList } from '../../lib/streamTypes';

/** "Top Hotels for You": horizontal snap carousel with peek + edge chevrons. */
export default function HotelsSection({
  data,
  limit,
  onAction,
}: {
  data: HotelsList;
  limit?: number;
  onAction: (a: string) => void;
}) {
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [emblaRef, embla] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    duration: reduced ? 0 : 25,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    onSelect();
    embla.on('select', onSelect).on('reInit', onSelect).on('scroll', onSelect);
  }, [embla, onSelect]);

  const hotels = limit ? data.hotels.slice(0, limit) : data.hotels;

  return (
    <section aria-label={data.title ?? 'Top hotels'}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-bold text-ink">{data.title ?? 'Top Hotels for You'}</h2>
        {data.viewAllAction && (
          <Button variant="link" size="sm" className="px-0" onClick={() => onAction(data.viewAllAction!)}>
            View all
          </Button>
        )}
      </div>

      <div className="relative">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex gap-4">
            {hotels.map((h) => (
              <HotelCard key={h.id} hotel={h} onAction={onAction} />
            ))}
          </div>
        </div>

        {/* Right edge fade + chevron hint that more cards exist off-screen */}
        {canNext && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-paper to-transparent"
            aria-hidden="true"
          />
        )}
        {canPrev && (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous hotels"
            onClick={() => embla?.scrollPrev()}
            className="absolute -left-3 top-1/2 -translate-y-1/2 shadow-float"
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}
        {canNext && (
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="More hotels"
            onClick={() => embla?.scrollNext()}
            className="absolute -right-3 top-1/2 -translate-y-1/2 shadow-float"
          >
            <ChevronRight className="size-4" />
          </Button>
        )}
      </div>
    </section>
  );
}
