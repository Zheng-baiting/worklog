(function(root){
'use strict';
const START='2026-09-17',END='2030-12-31',statuses=['','上班','没上班','连班','加班','中加班','长加班'];
function dates(month){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return [];const [y,m]=month.split('-').map(Number);return Array.from({length:new Date(y,m,0).getDate()},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`).filter(d=>d>=START&&d<=END);}
function time(v){if(v!==''&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))throw new Error('请填写有效时间，例如 08:20。');return v;}
const SHIFT_MINUTES={'上班':490,'没上班':0,'连班':610,'加班':700,'中加班':730,'长加班':760};
function minutes(r){return SHIFT_MINUTES[r.status]??0;}
function pay(n){return (n*30/100).toFixed(2);}
function periodTotal(records,from,to){return Object.entries(records).filter(([d])=>d>=from&&d<=to).reduce((n,[,r])=>n+minutes(r),0);}
function format(n){return `${Math.floor(n/60)}小时${n%60?`${n%60}分`:''}`;}
function total(records,month){return Object.entries(records).filter(([d])=>d>=START&&d<=END&&(!month||d.startsWith(month+'-'))).reduce((n,[,r])=>n+minutes(r),0);}
function validate(data){
if(!data||data.app!=='worklog'||![1,2,3].includes(data.version)||!data.records||typeof data.records!=='object'||Array.isArray(data.records))throw new Error('无效的工作记录备份。');
const records={};
for(const [date,r] of Object.entries(data.records)){
if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<'2026-09-08'||date>END||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||!r||typeof r.note!=='string'||r.note.length>1000)throw new Error('备份包含无效记录。');
if(data.version<3){
if(!['','上班','节假日','请假','加班'].includes(r.status))throw new Error('旧状态无效。');
records[date]={status:['节假日','请假'].includes(r.status)?'没上班':r.status,note:r.note,previous:r};
}else{
if(!statuses.includes(r.status))throw new Error('备份状态无效。');
records[date]={status:r.status,note:r.note};
if(r.previous!==undefined){if(!r.previous||typeof r.previous!=='object'||Array.isArray(r.previous)||JSON.stringify(r.previous).length>5000)throw new Error('历史记录无效。');records[date].previous=r.previous;}
}}
return records;}
root.Worklog={START,END,statuses,dates,time,minutes,format,total,periodTotal,pay,validate};if(typeof module!=='undefined')module.exports=root.Worklog;
})(globalThis);
