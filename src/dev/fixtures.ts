/**
 * Dev-only preview data for `?mock=1`. Renders the full live cockpit (matching
 * makemytrip2.png) with no backend. Guarded by import.meta.env.DEV so nothing
 * here ships to production.
 *
 * Images use Lorem Picsum (real photos, stable per seed, always resolve over
 * HTTPS) so the preview shows rich cards without depending on a CDN.
 */
import type {
  TripHero,
  HotelsList,
  FlightsList,
  TripSummaryData,
} from '../lib/streamTypes';
import type { ConversationLine } from '../hooks/useConversation';

export const MOCK =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has('mock');

const img = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const hero: TripHero = {
  destination: 'Kolkata',
  region: 'West Bengal, India',
  image: { src: img('kolkata-victoria', 1600, 600), alt: 'Victoria Memorial, Kolkata' },
  stats: [
    { icon: 'sun', label: 'Good Weather', value: '28°C' },
    { icon: 'calendar', label: 'Best Season', value: 'Oct – Mar' },
    { icon: 'tag', label: 'Avg. Hotel Price', value: '₹3,000 / night' },
  ],
  related: ['Best time to visit Kolkata', '3-day Kolkata itinerary'],
};

export const hotels: HotelsList = {
  title: 'Top Hotels for You',
  destination: 'Kolkata',
  viewAllAction: 'Show me all hotel options in Kolkata for 24–26 May, 2 adults',
  hotels: [
    {
      id: 'abhiray-grand',
      name: 'Abhiray Grand Hotel',
      image: { src: img('abhiray-grand', 640, 480), alt: 'Abhiray Grand Hotel' },
      badge: 'Popular',
      rating: 4.6,
      reviews: 1248,
      location: 'New Market, Kolkata',
      amenities: ['Breakfast incl.', 'Free cancellation'],
      price: '₹4,200',
      priceUnit: '/ night',
      action: 'Show me rooms at Abhiray Grand Hotel, New Market, Kolkata for 24–26 May, 2 adults',
    },
    {
      id: 'taj-bengal',
      name: 'Taj Bengal',
      image: { src: img('taj-bengal', 640, 480), alt: 'Taj Bengal' },
      rating: 4.7,
      reviews: 2312,
      location: 'Alipore, Kolkata',
      amenities: ['Breakfast incl.', 'Free cancellation'],
      price: '₹8,900',
      priceUnit: '/ night',
      action: 'Show me rooms at Taj Bengal, Alipore, Kolkata for 24–26 May, 2 adults',
    },
    {
      id: 'itc-royal-bengal',
      name: 'ITC Royal Bengal',
      image: { src: img('itc-royal', 640, 480), alt: 'ITC Royal Bengal' },
      rating: 4.6,
      reviews: 1985,
      location: 'New Town, Kolkata',
      amenities: ['Breakfast incl.', 'Free cancellation'],
      price: '₹6,200',
      priceUnit: '/ night',
      action: 'Show me rooms at ITC Royal Bengal, New Town, Kolkata for 24–26 May, 2 adults',
    },
  ],
};

export const flights: FlightsList = {
  title: 'Recommended Flights',
  viewAllAction: 'Show me all flights from Delhi to Kolkata on 24 May',
  flights: [
    {
      id: '6e-2041',
      airline: 'IndiGo',
      flightNo: '6E 2041',
      depart: { time: '06:20', code: 'DEL' },
      arrive: { time: '08:45', code: 'CCU' },
      duration: '2h 25m',
      stops: 'Non-stop',
      price: '₹5,600',
      tag: 'Lowest fare',
      action: 'Book IndiGo 6E 2041, Delhi to Kolkata, departing 06:20 on 24 May, 2 adults',
    },
    {
      id: 'ai-763',
      airline: 'Air India',
      flightNo: 'AI 763',
      depart: { time: '10:15', code: 'DEL' },
      arrive: { time: '12:50', code: 'CCU' },
      duration: '2h 35m',
      stops: 'Non-stop',
      price: '₹6,150',
      action: 'Book Air India AI 763, Delhi to Kolkata, departing 10:15 on 24 May, 2 adults',
    },
    {
      id: 'uk-729',
      airline: 'Vistara',
      flightNo: 'UK 729',
      depart: { time: '18:40', code: 'DEL' },
      arrive: { time: '21:10', code: 'CCU' },
      duration: '2h 30m',
      stops: 'Non-stop',
      price: '₹7,300',
      action: 'Book Vistara UK 729, Delhi to Kolkata, departing 18:40 on 24 May, 2 adults',
    },
  ],
};

export const summary: TripSummaryData = {
  destination: 'Kolkata',
  dates: '24 – 26 May, 2025',
  duration: '2 Nights / 3 Days',
  travelers: '2 Adults',
  budget: '₹28,000 – ₹32,000',
  fullPlanAction: 'Show me the full trip plan for Kolkata',
};

const t = 1_716_000_000_000;
export const chat: ConversationLine[] = [
  { id: 'm1', text: 'I want to visit Kolkata next weekend with my partner.', isAgent: false, timestamp: t },
  { id: 'm2', text: 'Great choice! Kolkata is wonderful in this season. Let me find you the best options.', isAgent: true, timestamp: t + 1000 },
  { id: 'm3', text: 'Here are some great options for your trip to Kolkata.', isAgent: true, timestamp: t + 2000 },
];

/** topic name → snapshot, consumed by useTopicJSON under MOCK. */
export const MOCK_TOPICS: Record<string, unknown> = {
  'trip.hero': hero,
  'hotels.list': hotels,
  'flights.list': flights,
  'trip.summary': summary,
};
