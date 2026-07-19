import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { LoaderCircle, CircleCheck } from 'lucide-react';

const STEPS = [
  'Finding best flights',
  'Checking hotel availability',
  'Exploring top experiences',
  'Almost done…',
];

const STEP_MS = 900;

/**
 * Progressive "searching for you" card shown while the agent is thinking.
 * Steps are simulated on a timer (the voice pipeline emits no real progress);
 * `active=false` flips every step to done before the parent fades it out.
 */
export default function ThinkingChecklist({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(reduced ? STEPS.length : 1);

  useEffect(() => {
    if (!active || reduced || revealed >= STEPS.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [active, reduced, revealed]);

  return (
    <div
      role="status"
      aria-label="Myra is searching"
      className="flex max-w-[92%] flex-col gap-2 rounded-2xl rounded-tl-md border border-line bg-paper-2/70 px-3.5 py-3"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
        <LoaderCircle
          className="size-3.5 text-coral motion-safe:animate-spin"
          aria-hidden="true"
        />
        Searching for you
      </span>

      <ul className="flex flex-col gap-1.5">
        {STEPS.slice(0, revealed).map((step, i) => {
          const isLast = i === STEPS.length - 1;
          const done = !active || (!isLast && i < revealed - 1);
          return (
            <motion.li
              key={step}
              initial={reduced ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex items-center gap-2 text-xs font-medium text-ink"
            >
              {done ? (
                <CircleCheck className="size-3.5 shrink-0 text-emerald-brand" aria-hidden="true" />
              ) : (
                <span
                  className="mx-0.5 size-2.5 shrink-0 rounded-full bg-sky-brand motion-safe:animate-pulse"
                  aria-hidden="true"
                />
              )}
              <span className={done ? 'text-muted' : ''}>{step}</span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
