const test=require('node:test'),assert=require('node:assert/strict');
const W=require('./dist/core.js'),{createStorage,KEY}=require('./dist/storage.js');
test('shift minutes deduct breaks and pay every minute equally',()=>{
  const day=(12*60+10-(7*60+50)-10)+(17*60+10-13*60-10);
  assert.equal(day,490);assert.equal(W.minutes({status:'上班'}),day);
  assert.equal(W.minutes({status:'连班'}),day+(19*60+10-(17*60+10)));
  assert.equal(W.pay(W.minutes({status:'连班'})),'183.00');
  assert.equal(W.format(W.minutes({status:'连班'})),'10小时10分');
  assert.equal(W.validate({app:'worklog',version:3,records:{'2026-10-03':{status:'连班',note:''}}})['2026-10-03'].status,'连班');
  assert.equal(W.minutes({status:'加班'}),day+(21*60+10-(17*60+40)));
  assert.equal(W.minutes({status:'中加班'}),day+(21*60+40-(17*60+40)));
  assert.equal(W.pay(W.minutes({status:'中加班'})),'219.00');
  assert.equal(W.format(W.minutes({status:'中加班'})),'12小时10分');
  assert.equal(W.minutes({status:'长加班'}),760);
  assert.equal(W.minutes({status:'没上班'}),0);assert.equal(W.minutes({status:''}),0);
  assert.equal(W.pay(490),'147.00');assert.equal(W.pay(700),'210.00');assert.equal(W.pay(760),'228.00');
  assert.equal(W.format(490*2+700+760),'40小时40分');assert.equal(W.pay(2440),'732.00');
});
test('inclusive period boundaries and no extrapolation for blank days',()=>{
  const data={'2026-09-16':{status:'长加班'},'2026-09-17':{status:'上班'},'2026-10-10':{status:'加班'},'2026-10-11':{status:'上班'}};
  assert.equal(W.periodTotal(data,'2026-09-17','2026-10-10'),1190);
});
test('initialize once, preserve old raw data and subsequent edits',()=>{
  global.WORKLOG_INITIAL={'2026-10-01':'长加班'};
  const old=JSON.stringify({app:'worklog',version:2,records:{'2026-10-01':{status:'上班',start:'08:00',end:'17:00',holiday:'',note:'test'}}});
  const map=new Map([['worklog.records.v2',old]]),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  const store=createStorage(storage,W.validate);assert.equal(store.initialize()['2026-10-01'].status,'长加班');
  store.save({'2026-10-01':{status:'没上班'}});assert.equal(store.initialize()['2026-10-01'].status,'没上班');
  assert.equal(map.get('worklog.records.v2'),old);assert.equal(store.read()['2026-10-01'].previous.start,'08:00');
  assert.equal(W.validate(JSON.parse(map.get(KEY)))['2026-10-01'].note,'test');delete global.WORKLOG_INITIAL;
});
test('corrupt storage is not replaced',()=>{let writes=0;const store=createStorage({getItem:()=>'{bad',setItem:()=>writes++},W.validate);assert.throws(()=>store.initialize());assert.equal(writes,0)});

test('local record update applies once and preserves notes, other days and later edits',()=>{
  global.WORKLOG_UPDATES=[{id:'test-middle-shift',records:{'2026-10-02':'中加班'}}];
  try {
    const records={'2026-10-01':{status:'上班',note:'keep'},'2026-10-02':{status:'加班',note:'keep too'}};
    const map=new Map([[KEY,JSON.stringify({app:'worklog',version:3,records})]]);
    const store=createStorage({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)},W.validate);
    const result=store.initialize();
    assert.deepEqual(result['2026-10-01'],records['2026-10-01']);
    assert.deepEqual(result['2026-10-02'],{status:'中加班',note:'keep too'});
    assert.equal(W.periodTotal(result,'2026-10-01','2026-10-02'),1220);
    assert.deepEqual(W.validate({app:'worklog',version:3,records:result}),result);
    store.save({'2026-10-02':{status:'没上班'}});
    assert.equal(store.initialize()['2026-10-02'].status,'没上班');
  } finally { delete global.WORKLOG_UPDATES; }
});
