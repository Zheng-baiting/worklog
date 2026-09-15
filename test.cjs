const test=require('node:test');
const assert=require('node:assert/strict');
const W=require('./dist/core.js');
const {createStorage,KEY}=require('./dist/storage.js');
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
test('reopening retains records and edits from another window',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  const a=createStorage(storage,W.validate),b=createStorage(storage,W.validate);
  a.save({'2026-09-08':{status:'上班',hours:2.5}});
  b.save({'2026-09-09':{status:'请假'},'2026-09-08':{note:'另一个窗口'}});
  a.save({'2026-09-08':{hours:3}});
  const restored=createStorage(storage,W.validate).read();
  assert.equal(restored['2026-09-08'].note,'另一个窗口');
  assert.equal(restored['2026-09-08'].hours,3);
  assert.equal(restored['2026-09-09'].status,'请假');
});
test('storage failures and corrupt records never overwrite stored content',()=>{
  let raw='broken json',writes=0;
  const storage={getItem:()=>raw,setItem:()=>{writes++;throw new Error('quota')}};
  const store=createStorage(storage,W.validate);
  assert.throws(()=>store.save({'2026-09-08':{hours:2}}));
  assert.equal(writes,0);assert.equal(raw,'broken json');
  raw=JSON.stringify({app:'worklog',version:1,records:{}});
  assert.throws(()=>store.save({'2026-09-08':{hours:2}}));
  assert.equal(writes,1);
});
test('import merging preserves dates outside backup',()=>{
  const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  const store=createStorage(storage,W.validate);
  store.save({'2026-09-08':r('上班',2),'2026-09-09':r('加班',3)});
  const backup=W.validate({app:'worklog',version:1,records:{'2026-09-08':r('节假日',4)}});
  store.save(backup);
  assert.equal(store.read()['2026-09-09'].hours,3);
  assert.equal(W.total(store.read()),7);
});
