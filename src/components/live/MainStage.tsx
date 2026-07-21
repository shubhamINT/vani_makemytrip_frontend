import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useChat, useRoomContext } from '@livekit/components-react';
import type { ActionEvent } from '@openuidev/react-lang';
import {
  LayoutGrid,
  Hotel,
  Plane,
  Compass,
  UtensilsCrossed,
  CalendarDays,
  Wallet,
  FileCheck,
  Ticket,
  type LucideIcon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useTopicJSON } from '../../hooks/useTopicJSON';
import { useTopicJSONList } from '../../hooks/useTopicJSONList';
import type { TripHero, HotelsList, FlightsList, BookingConfirmation, DetailView } from '../../lib/streamTypes';
import HeroCard from './HeroCard';
import HotelsSection from './HotelsSection';
import FlightsSection from './FlightsSection';
import BookingCard from './BookingCard';
import DetailCard from './DetailCard';
import RelatedQueries from './RelatedQueries';
import OpenUIEmbed from './OpenUIEmbed';

interface UIRender {
  id: string;
  renderId: number;
  content: string;
  streaming: boolean;
  tab: string;
  title: string;
}

// Canonical dashboard tabs, in display order. The agent tags each render with
// one of these keys via the stream's `tab` attribute (falls back to overview).
const TAB_ORDER = [
  'overview',
  'hotels',
  'flights',
  'booking',
  'experiences',
  'food',
  'itinerary',
  'budget',
  'visa',
] as const;
type TabKey = (typeof TAB_ORDER)[number];

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  hotels: 'Hotels',
  flights: 'Flights',
  booking: 'Bookings',
  experiences: 'Experiences',
  food: 'Food',
  itinerary: 'Itinerary',
  budget: 'Budget',
  visa: 'Visa',
};

const TAB_ICONS: Record<TabKey, LucideIcon> = {
  overview: LayoutGrid,
  hotels: Hotel,
  flights: Plane,
  booking: Ticket,
  experiences: Compass,
  food: UtensilsCrossed,
  itinerary: CalendarDays,
  budget: Wallet,
  visa: FileCheck,
};

const normTab = (t: string): TabKey => (TAB_ORDER.includes(t as TabKey) ? (t as TabKey) : 'overview');

/**
 * Center column: tabbed trip dashboard. Native sections (hero, hotels,
 * flights) come from typed JSON topics; everything else streams as
 * openui-lang over `ui.render`, grouped into tabs by the stream's attributes.
 */
export default function MainStage({ connecting }: { connecting: boolean }) {
  const room = useRoomContext();
  const { send } = useChat();

  const hero = useTopicJSON<TripHero>('trip.hero');
  const hotels = useTopicJSON<HotelsList>('hotels.list');
  const flights = useTopicJSON<FlightsList>('flights.list');
  const experiences = useTopicJSON<HotelsList>('experiences.list');
  const food = useTopicJSON<HotelsList>('food.list');
  const detail = useTopicJSON<DetailView>('detail.view');
  const bookings = useTopicJSONList<BookingConfirmation>('booking.confirmation');

  const [renders, setRenders] = useState<UIRender[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const idRef = useRef(0);
  const seq = useRef(new Map<string, number>());
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // openui-lang is streamed line-by-line: read incrementally and re-render
    // each chunk. readAll() would block until close and kill the live build.
    const upsert = (
      streamId: string,
      content: string,
      streaming: boolean,
      tab: TabKey,
      title: string,
    ) => {
      let renderId = seq.current.get(streamId);
      if (renderId === undefined) {
        renderId = idRef.current++;
        seq.current.set(streamId, renderId);
      }
      const rid = renderId;
      setRenders((prev) => {
        const i = prev.findIndex((r) => r.renderId === rid);
        const next: UIRender = { id: `ui-${rid}`, renderId: rid, content, streaming, tab, title };
        if (i === -1) return [...prev, next];
        const copy = prev.slice();
        copy[i] = next;
        return copy;
      });
      setActiveTab(tab); // follow the freshest result onto its tab
    };

    room.registerTextStreamHandler('ui.render', async (reader) => {
      const streamId = reader.info.id;
      const attrs = reader.info.attributes ?? {};
      const tab = normTab(attrs.tab ?? 'overview');
      const title = attrs.title ?? '';
      let text = '';
      for await (const chunk of reader) {
        text += chunk;
        upsert(streamId, text, true, tab, title);
      }
      upsert(streamId, text, false, tab, title);
    });
    return () => room.unregisterTextStreamHandler('ui.render');
  }, [room]);

  // Every outbound intent (View Rooms, Book, View all, related chips) is a
  // plain chat message the agent understands — same channel as @ToAssistant.
  const sendAction = useCallback(
    (message: string) => {
      if (!message) return;
      void Promise.resolve(send(message)).catch((e) => {
        if (import.meta.env.DEV) console.warn('[action not sent]', message, e);
      });
    },
    [send],
  );

  const handleOpenUIAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === 'open_url' && typeof event.params?.url === 'string') {
        window.open(event.params.url, '_blank', 'noopener');
        return;
      }
      const message =
        event.humanFriendlyMessage ||
        (typeof event.params?.message === 'string' ? event.params.message : '');
      sendAction(message);
    },
    [sendAction],
  );

  // Tabs that actually have content, in canonical order.
  const tabs = useMemo(() => {
    const present = new Set<TabKey>(renders.map((r) => r.tab as TabKey));
    if (hero || hotels || flights) present.add('overview');
    if (hotels) present.add('hotels');
    if (flights) present.add('flights');
    if (experiences) present.add('experiences');
    if (food) present.add('food');
    if (bookings.length > 0) present.add('booking');
    return TAB_ORDER.filter((t) => present.has(t));
  }, [renders, hero, hotels, flights, experiences, food, bookings.length]);

  const visible = useMemo(() => renders.filter((r) => r.tab === activeTab), [renders, activeTab]);

  // A fresh booking confirmation pulls focus to the Bookings tab — but only on
  // a genuine new arrival, not the initial (mock-seeded) load.
  const bookingCount = useRef(bookings.length);
  useEffect(() => {
    if (bookings.length > bookingCount.current) setActiveTab('booking');
    bookingCount.current = bookings.length;
  }, [bookings.length]);

  useEffect(() => {
    requestAnimationFrame(() => {
      bodyRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
  }, [visible.length, activeTab]);

  if (tabs.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-card-lg border border-dashed border-line bg-surface/60 p-8 text-center">
        <span
          className="size-14 rounded-full opacity-90 motion-safe:animate-pulse"
          style={{ background: 'var(--hero-orb)' }}
          aria-hidden="true"
        />
        <div>
          <p className="font-display text-lg font-bold text-ink">Your trip takes shape here</p>
          <p className="mt-1 text-sm text-muted">
            {connecting ? 'Getting your concierge ready…' : 'Flights, hotels and plans appear as we talk.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as TabKey)}
      className="min-h-0 flex-1"
    >
      <TabsList aria-label="Trip sections" className="shrink-0 overflow-x-auto px-1">
        {tabs.map((t) => {
          const Icon = TAB_ICONS[t];
          return (
            <TabsTrigger key={t} value={t}>
              <Icon aria-hidden="true" />
              {TAB_LABELS[t]}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {tabs.map((t) => (
        <TabsContent key={t} value={t}>
          <div
            ref={t === activeTab ? bodyRef : undefined}
            className="flex h-full flex-col gap-5 overflow-y-auto pb-32 pt-4"
          >
            {detail && <DetailCard data={detail} onAction={sendAction} />}
            {t === 'overview' && hero && <HeroCard hero={hero} />}
            {(t === 'overview' || t === 'hotels') && hotels && hotels.hotels.length > 0 && (
              <HotelsSection data={hotels} limit={t === 'overview' ? 4 : undefined} onAction={sendAction} />
            )}
            {(t === 'overview' || t === 'flights') && flights && flights.flights.length > 0 && (
              <FlightsSection data={flights} limit={t === 'overview' ? 3 : undefined} onAction={sendAction} />
            )}
            {t === 'experiences' && experiences && experiences.hotels.length > 0 && (
              <HotelsSection data={experiences} onAction={sendAction} />
            )}
            {t === 'food' && food && food.hotels.length > 0 && (
              <HotelsSection data={food} onAction={sendAction} />
            )}
            {t === 'booking' &&
              bookings
                .map((b, i) => ({ b, i }))
                .reverse()
                .map(({ b, i }) => <BookingCard key={i} data={b} onAction={sendAction} />)}
            {renders
              .filter((r) => r.tab === t)
              .map((e) => (
                <OpenUIEmbed
                  key={e.id}
                  content={e.content}
                  title={e.title}
                  streaming={e.streaming}
                  onAction={handleOpenUIAction}
                />
              ))}
            {t === 'overview' && hero?.related && (
              <RelatedQueries items={hero.related} onSend={sendAction} />
            )}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
