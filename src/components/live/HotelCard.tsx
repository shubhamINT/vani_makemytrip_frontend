import { useState } from 'react';
import { Star, MapPin, Coffee, ShieldCheck, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Hotel } from '../../lib/streamTypes';

const AMENITY_ICONS: Array<[RegExp, typeof Coffee]> = [
  [/breakfast/i, Coffee],
  [/cancel/i, ShieldCheck],
  [/spa|pool|luxur/i, Sparkles],
];

const amenityIcon = (label: string) => AMENITY_ICONS.find(([re]) => re.test(label))?.[1];

/** One hotel in the carousel: image, name, rating, location, amenities, price + CTA. */
export default function HotelCard({ hotel, onAction }: { hotel: Hotel; onAction: (a: string) => void }) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <Card className="flex w-[272px] shrink-0 snap-start flex-col overflow-hidden p-0 transition-shadow hover:shadow-float">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-2">
        {hotel.image?.src && imgOk ? (
          <img
            src={hotel.image.src}
            alt={hotel.image.alt ?? hotel.name}
            loading="lazy"
            className="size-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-faint">
            <MapPin className="size-6" aria-hidden="true" />
          </div>
        )}
        {hotel.badge && (
          <Badge variant="popular" className="absolute left-2.5 top-2.5">
            {hotel.badge}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate font-display text-[15px] font-bold text-ink" title={hotel.name}>
            {hotel.name}
          </h3>
          {typeof hotel.rating === 'number' && (
            <span className="flex shrink-0 items-center gap-1 text-[13px] font-bold text-ink">
              <Star className="size-3.5 fill-amber-brand text-amber-brand" aria-hidden="true" />
              {hotel.rating.toFixed(1)}
              {typeof hotel.reviews === 'number' && (
                <span className="font-medium text-faint">({hotel.reviews.toLocaleString('en-IN')})</span>
              )}
            </span>
          )}
        </div>

        {hotel.location && (
          <p className="flex items-center gap-1 text-xs text-muted">
            <MapPin className="size-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{hotel.location}</span>
          </p>
        )}

        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="mt-0.5 flex flex-wrap gap-1.5">
            {hotel.amenities.slice(0, 3).map((a) => {
              const Icon = amenityIcon(a);
              return (
                <Badge key={a} variant="secondary">
                  {Icon && <Icon aria-hidden="true" />}
                  {a}
                </Badge>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-2.5">
          <p className="leading-none">
            <span className="font-display text-[17px] font-extrabold text-ink">{hotel.price}</span>{' '}
            <span className="text-xs font-medium text-faint">{hotel.priceUnit ?? '/ night'}</span>
          </p>
          <Button size="sm" onClick={() => onAction(hotel.action)}>
            View Rooms
          </Button>
        </div>
      </div>
    </Card>
  );
}
