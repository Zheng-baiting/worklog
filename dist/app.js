'use strict';
const W=Worklog,$=id=>document.getElementById(id);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const current=()=>today().slice(0,7)<'2026-09'?'2026-09':today().slice(0,7)>'2030-12'?'2030-12':today().slice(0,7);
let records={},selected=new Set([current()]),pendingImport=null,toastTimer;
let store, pendingPatches={}, loadFailed=false;
const emptyRecord=()=>({status:'',holiday:'',hours:'',note:''});
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6000)}
function showSaveError(message) {
  $('saveState').textContent='未保存 · 请备份';
  $('saveWarningText').textContent=message;
  $('saveWarning').hidden=false;
}
function persist(patches={}) {
  for (const [date,patch] of Object.entries(patches)) {
    pendingPatches[date]={...pendingPatches[date],...patch};
  }
  try {
    if(loadFailed || !store) throw new Error('storage unavailable');
    records=store.save(pendingPatches);
    pendingPatches={};
    $('saveState').textContent='已自动保存到本机';
    $('saveWarning').hidden=true;
    return true;
  } catch {
    showSaveError(loadFailed?'无法读取本机原有记录，已停止写入，避免覆盖。请保留本页并检查浏览器的存储设置。':'保存失败，当前修改仍留在本页。请重试，或先导出备份；暂时不要关闭页面。');
    return false;
  }
}
function loadRecords() {
  try {
    store=WorklogStorage.createStorage(localStorage,W.validate);
    records=store.read();
    $('saveState').textContent=Object.keys(records).length?'已读取本机记录':'免登录 · 自动保存在本机';
  } catch {
    loadFailed=true;
    showSaveError('无法读取本机原有记录，已停止写入，避免覆盖。请检查浏览器的存储设置。');
  }
}
function monthName(m){const [y,n]=m.split('-');return `${y}年${Number(n)}月`}
function picker(){const fragment=document.createDocumentFragment();for(let y=2026;y<=2030;y++){const group=document.createElement('div');group.className='yearGroup';const title=document.createElement('strong');title.textContent=y+'年';group.append(title);const grid=document.createElement('div');grid.className='monthGrid';for(let m=y===2026?9:1;m<=12;m++){const key=`${y}-${String(m).padStart(2,'0')}`,b=document.createElement('button');b.textContent=m+'月';b.setAttribute('aria-label',monthName(key));b.setAttribute('aria-pressed',selected.has(key));b.onclick=()=>{selected.has(key)?selected.delete(key):selected.add(key);b.setAttribute('aria-pressed',selected.has(key));render()};grid.append(b)}group.append(grid);fragment.append(group)}$('monthOptions').replaceChildren(fragment)}
function field(date,key,label,type,value) {
  const l=document.createElement('label');
  l.className=key==='hours'?'overtime':key;
  const caption=document.createElement('span');caption.textContent=label;l.append(caption);
  const input=document.createElement(type==='select'?'select':'input');
  input.setAttribute('aria-label',date+' '+label);input.dataset.field=key;
  if(type==='select') {
    for(const v of W.statuses) {
      const option=document.createElement('option');option.value=v;option.textContent=v||'未填写';input.append(option);
    }
    input.dataset.status=value;
  } else {
    input.type=type;
    if(key==='hours') {
      input.min='0';input.max='24';input.step='0.01';input.inputMode='decimal';input.placeholder='0';
    } else {
      input.maxLength=key==='holiday'?100:1000;input.placeholder=key==='holiday'?'选择或输入':'可选';
      if(key==='holiday')input.setAttribute('list','holidays');
    }
  }
  input.value=value;
  function change(event) {
    if(event.isComposing)return;
    try {
      if(input.validity.badInput)throw new Error('请填写有效的加班小时。');
      const v=key==='hours'?W.hours(input.value):input.value;
      input.removeAttribute('aria-invalid');
      if((records[date]||emptyRecord())[key]===v)return;
      records[date]={...(records[date]||emptyRecord()),[key]:v};
      if(type==='select')input.dataset.status=v;
      persist({[date]:{[key]:v}});updateTotals();
    } catch(error) {
      input.setAttribute('aria-invalid','true');
      if(event.type==='change') {
        toast(error.message);input.value=(records[date]||emptyRecord())[key];input.removeAttribute('aria-invalid');
      }
    }
  }
  input.addEventListener('input',change);input.addEventListener('change',change);
  input.addEventListener('compositionend',change);
  l.append(input);return l;
}
function updateTotals(){let grand=0;for(const m of selected){const v=W.total(records,m);grand+=Math.round(v*100);const el=document.querySelector(`[data-total="${m}"]`);if(el)el.textContent=v}$('grandTotal').textContent=grand/100;$('monthCount').textContent=`已选 ${selected.size} 个月`}
function render(){const months=[...selected].sort();$('selectionLabel').textContent=months.length?months.map(monthName).join('、'):'还没有选择月份';const fragment=document.createDocumentFragment();for(const month of months){const section=document.createElement('section');section.className='monthBlock';const heading=document.createElement('div');heading.className='monthHeading';heading.innerHTML=`<h2>${monthName(month)}</h2><span>加班 <b data-total="${month}">0</b> 小时</span>`;section.append(heading);const th=document.createElement('div');th.className='tableHead';th.innerHTML='<span>日期</span><span>状态</span><span>节假日名称</span><span>加班 / 小时</span><span>备注</span>';section.append(th);for(const date of W.dates(month)){const r=records[date]||emptyRecord(),row=document.createElement('div');row.className='record';row.dataset.date=date;const day=document.createElement('div');day.className='day';const weekday=new Date(date+'T12:00:00').getDay();day.innerHTML=`${Number(date.slice(8))}日<span class="weekday">周${'日一二三四五六'[weekday]}${date===today()?' · 今天':''}</span>`;row.append(day,field(date,'status','状态','select',r.status),field(date,'hours','加班小时','number',r.hours),field(date,'holiday','节假日','text',r.holiday),field(date,'note','备注','text',r.note));section.append(row)}fragment.append(section)}if(!months.length){const el=document.createElement('p');el.className='empty';el.textContent='从上方选择月份，就能查看并填写当天记录。';fragment.append(el)}$('records').replaceChildren(fragment);updateTotals()}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;(document.querySelector('dialog[open]')||document.body).append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
function exportBackup(){download(new Blob([JSON.stringify({app:'worklog',version:1,exportedAt:new Date().toISOString(),records},null,2)],{type:'application/json'}),`工作记录备份-${today()}.json`);toast('已请求导出，请确认备份文件已保存到“文件”或 iCloud。')}
$('settingsButton').onclick=()=>$('settings').showModal();for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>$(b.dataset.close).close();$('currentMonth').onclick=()=>{selected=new Set([current()]);picker();render()};$('exportBackup').onclick=exportBackup;$('backupBeforeRestore').onclick=exportBackup;
$('restoreButton').onclick=()=>$('importFile').click();$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>5e6)throw new Error('备份文件过大，请选择本应用导出的 JSON 文件。');pendingImport=W.validate(JSON.parse(await file.text()));$('restoreInfo').textContent=`备份中有 ${Object.keys(pendingImport).length} 天的记录。`;$('restoreDialog').showModal()}catch(error){toast(error instanceof SyntaxError?'文件格式错误，未修改现有记录。':error.message)}e.target.value=''};
$('confirmRestore').onclick=()=>{if(!pendingImport)return;records={...records,...pendingImport};const saved=persist(pendingImport);render();pendingImport=null;$('restoreDialog').close();toast(saved?'已合并导入并保存在本机。':'备份已读入本页，但保存失败，请先不要关闭页面。')};
$('exportCsv').onclick=()=>{const cell=v=>'"'+String(v).replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';const rows=[['日期','状态','节假日名称','加班小时','备注']];for(const m of [...selected].sort()){for(const d of W.dates(m)){const r=records[d]||emptyRecord();rows.push([d,r.status,r.holiday,r.hours,r.note])}rows.push([monthName(m)+'合计','','',W.total(records,m),''])}download(new Blob(['\ufeff'+rows.map(r=>r.map(cell).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}),`工作记录-${today()}.csv`)};
$('prefill').onclick=()=>{
  const patches={};let count=0;
  for(let y=2026;y<=2030;y++)for(let m=y===2026?9:1;m<=12;m++) {
    for(const d of W.dates(`${y}-${String(m).padStart(2,'0')}`)) {
      const r=records[d]||emptyRecord();
      if(d<=today()&&!r.status&&!r.holiday&&r.hours===''&&!r.note) {
        records[d]={...r,status:'上班'};patches[d]={status:'上班'};count++;
      }
    }
  }
  const saved=persist(patches);render();toast(saved?`已为 ${count} 天填入上班并保存。`:'已填入本页，但尚未保存，请导出备份。');
};
$('retrySave').onclick=()=>{if(loadFailed){loadFailed=false;loadRecords()}if(!loadFailed&&persist()) {render();toast('保存成功。')}};
$('emergencyBackup').onclick=exportBackup;
window.addEventListener('beforeunload',event=>{if(Object.keys(pendingPatches).length){event.preventDefault();event.returnValue='';}});
window.addEventListener('storage',event=>{
  if(event.key!==WorklogStorage.KEY||Object.keys(pendingPatches).length||loadFailed)return;
  try {
    records=store.read();
    for(const input of document.querySelectorAll('[data-field]')) {
      if(input===document.activeElement)continue;
      const date=input.closest('[data-date]').dataset.date,key=input.dataset.field;
      input.value=(records[date]||emptyRecord())[key];
      if(key==='status')input.dataset.status=input.value;
    }
    updateTotals();$('saveState').textContent='已同步本机其他窗口的修改';
  }catch{loadFailed=true;showSaveError('无法读取其他窗口的修改，已停止保存。请保留本页并导出当前记录。')}
});
loadRecords();picker();render();
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>toast('离线功能尚未就绪，请联网重新打开一次。'));
