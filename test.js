// node test.js
const assert = require('assert');
const P = require('./phonemes.js');
assert.strictEqual(P.length, 44, 'expected 44 phonemes');
assert.strictEqual(new Set(P.map(p => p.symbol)).size, 44, 'symbols must be unique');
assert.strictEqual(new Set(P.map(p => p.id)).size, 44, 'ids must be unique');
for (const p of P) {
  assert.strictEqual(p.ex.length, 3, `${p.symbol} needs 3 examples`);
  for (const c of p.conf) assert(P.some(q => q.symbol === c), `${p.symbol}: unknown confusable ${c}`);
  for (const e of p.ex) assert(e.ipa.includes(p.symbol), `${p.symbol}: "${e.w}" /${e.ipa}/ does not contain the sound`);
}
console.log('ok');
