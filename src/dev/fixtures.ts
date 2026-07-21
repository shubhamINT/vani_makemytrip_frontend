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
  BookingConfirmation,
  DetailView,
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

export const booking: BookingConfirmation = {
  kind: 'flight',
  title: 'Flight Booking Confirmation',
  status: 'Booking confirmed',
  reference: 'PNR ABC1234',
  headline: "You're going to Delhi!",
  subhead: 'IndiGo 6E-620 · Kolkata to Delhi · 08:20 CCU → 09:45 DEL',
  details: [
    { label: 'Seat', value: '23A' },
    { label: 'Departure', value: '08:20 from CCU' },
    { label: 'Arrival', value: '09:45 at DEL' },
    { label: 'Passengers', value: '2 Adults' },
  ],
  actions: [
    { label: 'View e-ticket', url: 'https://example.com/eticket/ABC1234', variant: 'primary' },
    { label: 'Add to calendar', action: 'Add my Delhi flight to my calendar', variant: 'secondary' },
  ],
};

export const booking2: BookingConfirmation = {
  kind: 'hotel',
  title: 'Hotel Booking Confirmation',
  status: 'Booking confirmed',
  reference: 'CONF 8842QK',
  headline: 'Your stay is set!',
  subhead: 'ITC Royal Bengal · New Town, Kolkata · 24–26 May, 2 nights',
  details: [
    { label: 'Room', value: 'Deluxe King' },
    { label: 'Check-in', value: '24 May, 2:00 PM' },
    { label: 'Check-out', value: '26 May, 12:00 PM' },
    { label: 'Guests', value: '2 Adults' },
  ],
  actions: [
    { label: 'View voucher', url: 'https://example.com/voucher/8842QK', variant: 'primary' },
    { label: 'Add to calendar', action: 'Add my ITC Royal Bengal stay to my calendar', variant: 'secondary' },
  ],
};

const t = 1_716_000_000_000;
export const chat: ConversationLine[] = [
  { id: 'm1', text: 'I want to visit Kolkata next weekend with my partner.', isAgent: false, timestamp: t },
  { id: 'm2', text: 'Great choice! Kolkata is wonderful in this season. Let me find you the best options.', isAgent: true, timestamp: t + 1000 },
  { id: 'm3', text: 'Here are some great options for your trip to Kolkata.', isAgent: true, timestamp: t + 2000 },
];

export const experiences: HotelsList = {
  title: 'Things to do in Kolkata',
  destination: 'Kolkata',
  hotels: [
    { id: 'victoria', name: 'Victoria Memorial Tour', image: { src: img('exp-victoria', 640, 480), alt: 'Victoria Memorial' }, rating: 4.7, reviews: 530, location: 'Maidan', amenities: ['Guided', 'Instant confirm'], price: '₹500', priceUnit: '/ person', cta: 'View details', action: 'Show details of Victoria Memorial Tour' },
    { id: 'howrah', name: 'Howrah Bridge Walk', image: { src: img('exp-howrah', 640, 480), alt: 'Howrah Bridge' }, rating: 4.6, reviews: 410, location: 'Mullick Ghat', amenities: ['Guided'], price: '₹800', priceUnit: '/ person', cta: 'View details', action: 'Show details of Howrah Bridge Walk' },
    { id: 'cruise', name: 'Hooghly Sunset Cruise', image: { src: img('exp-cruise', 640, 480), alt: 'River cruise' }, rating: 4.8, reviews: 670, location: 'Millennium Park', amenities: ['Guided', 'Instant confirm'], price: '₹1,200', priceUnit: '/ person', cta: 'View details', action: 'Show details of Hooghly Sunset Cruise' },
  ],
};

export const food: HotelsList = {
  title: 'Where to eat in Kolkata',
  destination: 'Kolkata',
  hotels: [
    { id: 'peter-cat', name: 'Peter Cat', image: { src: img('food-petercat', 640, 480), alt: 'Peter Cat' }, rating: 4.5, reviews: 390, location: 'Park Street', amenities: ['Continental'], price: '₹₹ · ₹1,200 for two', priceUnit: '', cta: 'View details', action: 'Show details of Peter Cat' },
    { id: '6bp', name: '6 Ballygunge Place', image: { src: img('food-6bp', 640, 480), alt: '6 Ballygunge Place' }, rating: 4.6, reviews: 480, location: 'Ballygunge', amenities: ['Bengali'], price: '₹₹ · ₹1,500 for two', priceUnit: '', cta: 'View details', action: 'Show details of 6 Ballygunge Place' },
  ],
};

export const detail: DetailView = {
  title: 'Taj Bengal',
  subtitle: 'Alipore, Kolkata',
  images: [img('taj-1', 800, 600), img('taj-2', 800, 600), img('taj-3', 800, 600), img('taj-4', 800, 600)],
  description: 'Taj Bengal in Alipore. Comfortable stay with Breakfast incl., Free cancellation, Pool.',
  facts: [
    { label: 'Area', value: 'Alipore, Kolkata' },
    { label: 'Rating', value: '★ 4.7' },
    { label: 'Price', value: '₹8,900' },
  ],
  actions: [
    { label: 'Book', action: 'Book Taj Bengal, Alipore', variant: 'primary' },
    { label: 'Back to results', action: 'Show me hotels in Kolkata', variant: 'secondary' },
  ],
};

/** topic name → snapshot, consumed by useTopicJSON under MOCK. */
export const MOCK_TOPICS: Record<string, unknown> = {
  'trip.hero': hero,
  'hotels.list': hotels,
  'flights.list': flights,
  'experiences.list': experiences,
  'food.list': food,
  'detail.view': detail,
  'trip.summary': summary,
  'booking.confirmation': [booking, booking2],
};
