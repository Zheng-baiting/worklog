(function (root) {
  'use strict';
  const KEY = 'worklog.records.v3';
  function createStorage(storage, validate) {
    const initial=root.WORKLOG_INITIAL||{};
    function initialize(){
      const raw=storage.getItem(KEY);
      const latest=read();
      const appliedUpdates=raw===null?[]:(JSON.parse(raw).appliedUpdates||[]);
      if(!Array.isArray(appliedUpdates)||!appliedUpdates.every(id=>typeof id==='string'))throw new Error('无效的更新记录。');
      let changed=raw===null;
      if(raw===null)for(const [date,status] of Object.entries(initial))latest[date]={...latest[date],status,note:latest[date]?.note||''};
      for(const update of root.WORKLOG_UPDATES||[]){
        if(appliedUpdates.includes(update.id))continue;
        for(const [date,status] of Object.entries(update.records))latest[date]={...latest[date],status,note:latest[date]?.note||''};
        appliedUpdates.push(update.id);changed=true;
      }
      if(!changed)return latest;
      const valid=validate({app:'worklog',version:3,records:latest});
      storage.setItem(KEY,JSON.stringify({app:'worklog',version:3,records:valid,appliedUpdates}));
      return valid;
    }
    function read() {
      const raw = storage.getItem(KEY) ?? storage.getItem('worklog.records.v2') ?? storage.getItem('worklog.records.v1');
      return raw === null ? {} : validate(JSON.parse(raw));
    }
    function save(patches) {
      // Merge only edited fields into the latest stored records, preserving other tabs' changes.
      const latest = read();
      for (const [date, patch] of Object.entries(patches)) {
        latest[date] = {status:'', note:'', ...latest[date], ...patch};
      }
      const valid = validate({app:'worklog', version:3, records:latest});
      const appliedUpdates=JSON.parse(storage.getItem(KEY)||'{}').appliedUpdates||[];
      storage.setItem(KEY, JSON.stringify({app:'worklog', version:3, records:valid,appliedUpdates}));
      return valid;
    }
    return {read, save, initialize};
  }
  root.WorklogStorage = {KEY, createStorage};
  if (typeof module !== 'undefined') module.exports = root.WorklogStorage;
})(globalThis);
