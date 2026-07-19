/**
 * Typed JSON payloads streamed by the agent over LiveKit text-stream topics.
 * Each topic delivers a single JSON snapshot per stream; a re-send replaces
 * the previous one. Contracts are documented in BACKEND_AGENT.md.
 */

export interface StreamImage {
  src: string;
  alt?: string;
}

/* ── topic: trip.hero ── */
export type HeroStatIcon =
  | 'sun'
  | 'cloud'
  | 'calendar'
  | 'tag'
  | 'wallet'
  | 'thermometer'
  | 'umbrella';

export interface HeroStat {
  icon?: HeroStatIcon;
  label: string;
  value: string;
}

export interface TripHero {
  destination: string;
  region?: string;
  image?: StreamImage;
  stats?: HeroStat[];
  related?: string[];
}

/* ── topic: hotels.list ── */
export interface Hotel {
  id: string;
  name: string;
  image?: StreamImage;
  badge?: string;
  rating?: number;
  reviews?: number;
  location?: string;
  amenities?: string[];
  price: string;
  priceUnit?: string;
  action: string;
}

export interface HotelsList {
  title?: string;
  destination?: string;
  viewAllAction?: string;
  hotels: Hotel[];
}

/* ── topic: flights.list ── */
export interface FlightEndpoint {
  time: string;
  code: string;
}

export interface Flight {
  id: string;
  airline: string;
  logo?: string;
  flightNo?: string;
  depart: FlightEndpoint;
  arrive: FlightEndpoint;
  duration?: string;
  stops?: string;
  price: string;
  tag?: string;
  action: string;
}

export interface FlightsList {
  title?: string;
  viewAllAction?: string;
  flights: Flight[];
}

/* ── topic: trip.summary ── */
export interface TripSummaryData {
  destination?: string;
  dates?: string;
  duration?: string;
  travelers?: string;
  budget?: string;
  fullPlanAction?: string;
}
