(function(root){
'use strict';
const START='2026-09-17',END='2030-12-31',statuses=['','上班','节假日','请假'];
function dates(month){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return [];const [y,m]=month.split('-').map(Number);return Array.from({length:new Date(y,m,0).getDate()},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`).filter(d=>d>=START&&d<=END);}
function time(v){if(v!==''&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))throw new Error('请填写有效时间，例如 08:20。');return v;}
function minutes(r){if(!r.start||!r.end)return 0;const n=v=>Number(v.slice(0,2))*60+Number(v.slice(3));const diff=n(r.end)-n(r.start);return diff<0?diff+1440:diff;}
function format(n){return `${Math.floor(n/60)}小时${n%60?`${n%60}分`:''}`;}
function total(records,month){return Object.entries(records).filter(([d])=>d>=START&&d<=END&&(!month||d.startsWith(month+'-'))).reduce((n,[,r])=>n+minutes(r),0);}
function validate(data){
if(!data||data.app!=='worklog'||![1,2].includes(data.version)||!data.records||typeof data.records!=='object'||Array.isArray(data.records))throw new Error('无效的工作记录备份。');
const records={};
for(const [date,r] of Object.entries(data.records)){
if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<'2026-09-08'||date>END||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||!r||typeof r.note!=='string'||r.note.length>1000||typeof r.holiday!=='string'||r.holiday.length>100)throw new Error('备份包含无效记录。');
if(data.version===1){
if(![...statuses,'加班'].includes(r.status)||!['number','string'].includes(typeof r.hours)||!Number.isFinite(Number(r.hours))||Number(r.hours)<0||Number(r.hours)>24)throw new Error('旧备份无效。');
records[date]={status:r.status==='加班'?'上班':r.status,holiday:r.holiday,note:r.note,start:'',end:'',legacy:{status:r.status,hours:r.hours}};
}else{
if(!statuses.includes(r.status)||typeof r.start!=='string'||typeof r.end!=='string')throw new Error('状态或时间无效。');
records[date]={status:r.status,holiday:r.holiday,note:r.note,start:time(r.start),end:time(r.end)};
if(r.legacy){if(![...statuses,'加班'].includes(r.legacy.status)||!['number','string'].includes(typeof r.legacy.hours)||!Number.isFinite(Number(r.legacy.hours))||Number(r.legacy.hours)<0||Number(r.legacy.hours)>24)throw new Error('旧记录无效。');records[date].legacy={status:r.legacy.status,hours:r.legacy.hours};}
}}
return records;}
root.Worklog={START,END,statuses,dates,time,minutes,format,total,validate};if(typeof module!=='undefined')module.exports=root.Worklog;
})(globalThis);
