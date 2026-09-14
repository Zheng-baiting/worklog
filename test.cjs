const test=require('node:test');
const assert=require('node:assert/strict');
const W=require('./dist/core.js');
const r=(status,hours)=>({status,hours,holiday:'',note:''});
test('date boundaries and leap year',()=>{
  assert.equal(W.dates('2026-09')[0],'2026-09-08');
  assert.equal(W.dates('2028-02').length,29);
  assert.equal(W.dates('2027-02').length,28);
  assert.equal(W.dates('2030-12').at(-1),'2030-12-31');
  assert.deepEqual(W.dates('2027-13'),[]);
  assert.deepEqual(W.dates('2031-01'),[]);
});
test('only entered hours counted, independent of status',()=>{
  const data={'2026-09-08':r('上班',2.5),'2026-09-09':r('请假',1.25),'2026-09-10':r('加班',''),'2026-10-01':r('节假日',4)};
  assert.equal(W.total(data,'2026-09'),3.75);assert.equal(W.total(data,'2026-10'),4);assert.equal(W.total(data),7.75);
});
test('decimal arithmetic and invalid overtime',()=>{
  assert.equal(W.total({'2026-09-08':r('',0.1),'2026-09-09':r('',0.2)}),0.3);
  for(const value of [-1,25,NaN,Infinity,'abc',' ',0.001])assert.throws(()=>W.hours(value));
  assert.equal(W.hours('2.75'),2.75);assert.equal(W.hours(''),'');
});
test('backup round trip and invalid records',()=>{
  const data={app:'worklog',version:1,records:{'2028-02-29':r('节假日',3)}};
  assert.deepEqual(W.validate(JSON.parse(JSON.stringify(data))),data.records);
  for(const date of ['2027-02-29','2026-13-01','2026-09-07','2031-01-01','__proto__'])assert.throws(()=>W.validate({...data,records:{[date]:r('上班',0)}}));
  assert.throws(()=>W.validate({...data,records:{'2028-02-29':r('错误',0)}}));
  assert.throws(()=>W.validate({records:{}}));
});
