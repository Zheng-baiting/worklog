(function (root) {
  'use strict';
  const KEY = 'worklog.records.v3';
  function createStorage(storage, validate) {
    const initial=root.WORKLOG_INITIAL||{};
    function initialize(){
      if(storage.getItem(KEY)!==null)return read();
      const latest=read();
      for(const [date,status] of Object.entries(initial))latest[date]={...latest[date],status,note:latest[date]?.note||''};
      const valid=validate({app:'worklog',version:3,records:latest});
      storage.setItem(KEY,JSON.stringify({app:'worklog',version:3,records:valid}));
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
      storage.setItem(KEY, JSON.stringify({app:'worklog', version:3, records:valid}));
      return valid;
    }
    return {read, save, initialize};
  }
  root.WorklogStorage = {KEY, createStorage};
  if (typeof module !== 'undefined') module.exports = root.WorklogStorage;
})(globalThis);
