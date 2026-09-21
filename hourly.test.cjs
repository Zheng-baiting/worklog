const test=require('node:test'),assert=require('node:assert/strict');
const W=require('./dist/core.js');
test('calendar starts September 17 and includes leap day',()=>{assert.equal(W.dates('2026-09')[0],'2026-09-17');assert.equal(W.dates('2028-02').length,29);assert.deepEqual(W.dates('2031-01'),[])});
