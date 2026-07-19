// Run: bun src/widget/useToken.check.ts
import assert from 'node:assert';
import { parseTokenResponse } from './useToken';

// Primary shape (nested data wrapper — new backend response)
let r = parseTokenResponse({
  success: true,
  message: 'token created',
  data: { token: 'abc', url: 'wss://x' },
});
assert.equal(r.token, 'abc');
assert.equal(r.url, 'wss://x');

// Flat keys (fallback shape)
r = parseTokenResponse({ token: 'abc', url: 'wss://x' });
assert.equal(r.token, 'abc');
assert.equal(r.url, 'wss://x');

// Alternate keys
r = parseTokenResponse({ participantToken: 'jwt', serverUrl: 'wss://y' });
assert.equal(r.token, 'jwt');
assert.equal(r.url, 'wss://y');

console.log('useToken parse: OK');
