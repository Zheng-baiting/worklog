(function (root) {
  'use strict';
  const START = '2026-09-08', END = '2030-12-31';
  const statuses = ['', '上班', '节假日', '请假', '加班'];
  function dates(month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return [];
    const [y,m] = month.split('-').map(Number);
    return Array.from({length:new Date(y,m,0).getDate()},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`).filter(d=>d>=START&&d<=END);
  }
  function hours(value) {
    if (value === '') return '';
    if (typeof value==='string' && !value.trim()) throw new Error('加班小时不能只填写空格。');
    const n = Number(value);
    if (!Number.isFinite(n) || n<0 || n>24 || Math.abs(n*100-Math.round(n*100))>1e-7) throw new Error('加班小时请填写 0–24 的数字，最多两位小数。');
    return n;
  }
  function total(records,month) {
    return Object.entries(records).filter(([d])=>!month||d.startsWith(month+'-')).reduce((s,[,r])=>s+Math.round(Number(r.hours||0)*100),0)/100;
  }
  function validate(data) {
    if (!data || data.app!=='worklog' || data.version!==1 || !data.records || typeof data.records!=='object' || Array.isArray(data.records)) throw new Error('这不是有效的工作记录备份。');
    const records={};
    for (const [date,r] of Object.entries(data.records)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<START||date>END||!dates(date.slice(0,7)).includes(date)||!r||!statuses.includes(r.status)||typeof r.holiday!=='string'||typeof r.note!=='string'||r.holiday.length>100||r.note.length>1000||!['string','number'].includes(typeof r.hours)) throw new Error('备份包含无效日期或记录，未导入。');
      records[date]={status:r.status,holiday:r.holiday,note:r.note,hours:hours(r.hours)};
    }
    return records;
  }
  root.Worklog={START,END,statuses,dates,hours,total,validate};
  if (typeof module!=='undefined') module.exports=root.Worklog;
})(globalThis);
