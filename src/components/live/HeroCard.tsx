import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Sun,
  Cloud,
  Calendar,
  Tag,
  Wallet,
  Thermometer,
  Umbrella,
  Bookmark,
  BookmarkCheck,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { TripHero, HeroStatIcon } from '../../lib/streamTypes';

const STAT_ICONS: Record<HeroStatIcon, LucideIcon> = {
  sun: Sun,
  cloud: Cloud,
  calendar: Calendar,
  tag: Tag,
  wallet: Wallet,
  thermometer: Thermometer,
  umbrella: Umbrella,
};

const STAT_TINTS: Record<HeroStatIcon, string> = {
  sun: 'bg-amber-soft text-amber-brand',
  cloud: 'bg-sky-soft text-sky-brand',
  calendar: 'bg-sky-soft text-sky-brand',
  tag: 'bg-emerald-soft text-emerald-brand',
  wallet: 'bg-emerald-soft text-emerald-brand',
  thermometer: 'bg-coral-soft text-coral-ink',
  umbrella: 'bg-sky-soft text-sky-brand',
};

/** Destination hero: banner image, name + region, quick-stat chips. */
export default function HeroCard({ hero }: { hero: TripHero }) {
  const [saved, setSaved] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <Card className="overflow-hidden p-0">
        <div className="relative">
          {hero.image?.src && imgOk ? (
            <div className="relative aspect-[8/3] max-h-72 w-full overflow-hidden">
              <img
                src={hero.image.src}
                alt={hero.image.alt ?? hero.destination}
                className="size-full object-cover"
                onError={() => setImgOk(false)}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/55 to-transparent" />
            </div>
          ) : (
            <div className="aspect-[8/3] max-h-72 w-full bg-gradient-to-r from-paper-2 to-sky-soft" />
          )}

          <div className="absolute inset-0 flex flex-col justify-center gap-3 p-6 sm:p-8">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                  {hero.destination}
                </h1>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-pressed={saved}
                  aria-label={saved ? 'Remove destination bookmark' : 'Bookmark destination'}
                  onClick={() => setSaved((s) => !s)}
                  className="text-muted hover:bg-white/70"
                >
                  {saved ? <BookmarkCheck className="size-4.5 text-coral" /> : <Bookmark className="size-4.5" />}
                </Button>
              </div>
              {hero.region && (
                <p className="mt-1 flex items-center gap-1 text-sm font-medium text-muted">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {hero.region}
                </p>
              )}
            </div>

            {hero.stats && hero.stats.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {hero.stats.slice(0, 4).map((s) => {
                  const Icon = s.icon ? STAT_ICONS[s.icon] : undefined;
                  const tint = s.icon ? STAT_TINTS[s.icon] : 'bg-paper-2 text-muted';
                  return (
                    <div
                      key={s.label}
                      className="flex items-center gap-2.5 rounded-xl border border-line bg-surface/85 py-2 pl-2.5 pr-4 backdrop-blur-sm"
                    >
                      <span className={`flex size-8 items-center justify-center rounded-lg ${tint}`}>
                        {Icon ? <Icon className="size-4" aria-hidden="true" /> : <span className="size-1.5 rounded-full bg-current" />}
                      </span>
                      <span>
                        <span className="block text-[10px] font-semibold uppercase tracking-[0.06em] text-faint">
                          {s.label}
                        </span>
                        <span className="block text-[13px] font-bold text-ink">{s.value}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
