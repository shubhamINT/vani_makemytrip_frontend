import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ImageOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DetailView } from '../../lib/streamTypes';

/** One gallery image with graceful fallback. */
function GalleryImage({ src, alt }: { src: string; alt: string }) {
  const [ok, setOk] = useState(true);
  return (
    <div className="relative aspect-[4/3] w-64 shrink-0 snap-start overflow-hidden rounded-card bg-paper-2">
      {ok ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setOk(false)}
        />
      ) : (
        <div className="flex size-full items-center justify-center text-faint">
          <ImageOff className="size-6" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}

/**
 * Full detail view for a single hotel / restaurant / experience — richer than
 * the card list: an image gallery, description, key facts, and actions. Fed by
 * the `detail.view` topic.
 */
export default function DetailCard({
  data,
  onAction,
}: {
  data: DetailView;
  onAction: (a: string) => void;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
    <Card className="flex flex-col gap-4 overflow-hidden p-4">
      <header>
        <h2 className="font-display text-xl font-bold text-ink">{data.title}</h2>
        {data.subtitle && <p className="mt-0.5 text-sm text-muted">{data.subtitle}</p>}
      </header>

      {data.images.length > 0 && (
        <div className="flex snap-x gap-3 overflow-x-auto pb-1">
          {data.images.map((src, i) => (
            <GalleryImage key={i} src={src} alt={`${data.title} photo ${i + 1}`} />
          ))}
        </div>
      )}

      {data.description && <p className="text-sm leading-relaxed text-ink">{data.description}</p>}

      {data.facts && data.facts.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {data.facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs font-medium text-faint">{f.label}</dt>
              <dd className="text-sm font-semibold text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {data.actions && data.actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.actions.map((a) => (
            <Button
              key={a.label}
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
      )}
    </Card>
    </motion.div>
  );
}
