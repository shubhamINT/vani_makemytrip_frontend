// Run: bun src/widget/useToken.check.ts
import assert from 'node:assert';
import { parseTokenResponse } from './useToken';

// Primary shape
let r = parseTokenResponse({ token: 'abc', url: 'wss://x' });
assert.equal(r.token, 'abc');
assert.equal(r.url, 'wss://x');

// Alternate keys
r = parseTokenResponse({ participantToken: 'jwt', serverUrl: 'wss://y' });
assert.equal(r.token, 'jwt');
assert.equal(r.url, 'wss://y');

// Missing fields must throw
assert.throws(() => parseTokenResponse({ token: 'only' }));
assert.throws(() => parseTokenResponse({}));

console.log('useToken parse: OK');
