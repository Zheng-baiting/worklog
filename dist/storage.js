(function (root) {
  'use strict';
  const KEY = 'worklog.records.v1';
  function createStorage(storage, validate) {
    function read() {
      const raw = storage.getItem(KEY);
      return raw === null ? {} : validate(JSON.parse(raw));
    }
    function save(patches) {
      // Merge only edited fields into the latest stored records, preserving other tabs' changes.
      const latest = read();
      for (const [date, patch] of Object.entries(patches)) {
        latest[date] = {status:'', holiday:'', hours:'', note:'', ...latest[date], ...patch};
      }
      const valid = validate({app:'worklog', version:1, records:latest});
      storage.setItem(KEY, JSON.stringify({app:'worklog', version:1, records:valid}));
      return valid;
    }
    return {read, save};
  }
  root.WorklogStorage = {KEY, createStorage};
  if (typeof module !== 'undefined') module.exports = root.WorklogStorage;
})(globalThis);
