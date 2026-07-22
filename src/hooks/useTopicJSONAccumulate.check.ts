import assert from 'node:assert';
import { mergeById } from './useTopicJSONAccumulate';

type H = { id: string };
const key = (h: H) => h.id;

// snapshot 1: Kolkata
let all = mergeById<H>([], [{ id: 'a' }, { id: 'b' }], key);
assert.deepEqual(all.map(key), ['a', 'b']);

// snapshot 2: Delhi, one dup id ('b') + two new — dups skipped, new appended
all = mergeById(all, [{ id: 'b' }, { id: 'c' }, { id: 'd' }], key);
assert.deepEqual(all.map(key), ['a', 'b', 'c', 'd']);

// no new items → same array reference (no needless re-render)
const same = mergeById(all, [{ id: 'a' }], key);
assert.strictEqual(same, all);

// Flights reuse `id` across routes → composite key must keep both.
type F = { id: string; airline: string; route: string };
const fkey = (f: F) => `${f.airline}|${f.route}`;
let flights = mergeById<F>([], [{ id: '6e', airline: 'IndiGo', route: 'CCU-DEL' }], fkey);
flights = mergeById(flights, [{ id: '6e', airline: 'IndiGo', route: 'CCU-BOM' }], fkey); // same id, new route
assert.deepEqual(flights.map((f) => f.route), ['CCU-DEL', 'CCU-BOM']);

console.log('ok');
