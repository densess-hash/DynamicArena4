/** === ARENA DATA MODULE (Jobs / Companies / Related) ====================
 * Reads structured data from your Ori-On_CRM_Master_Final_App spreadsheet.
 * Each function returns plain JS objects, safe for use with google.script.run.
 * Author: Ori-On Dynamic Arena — Phase 3D Base
 */

const SHEET_IDS = {
  Jobs:       'Jobs',
  Companies:  'Companies',
  Hires:      'Hires',
  Candidates: 'Candidates'
};

/** Utility: read entire sheet into array of objects */
function readSheetObjects_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error("Sheet not found: " + sheetName);

  const data = sh.getDataRange().getValues();
  const headers = data.shift();
  return data.map(r => {
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      obj[headers[i]] = r[i];
    }
    return obj;
  });
}

/** === 1. JOBS ========================================================= */

/**
 * Returns one Job object by JobID
 * @param {string} jobId
 * @return {object|null}
 */
function getJobById(jobId) {
  const jobs = readSheetObjects_(SHEET_IDS.Jobs);
  const job = jobs.find(j => String(j.JobID) === String(jobId));
  return job || null;
}

/**
 * Returns all Jobs for a given CompanyID
 * @param {string} companyId
 * @return {Array<object>}
 */
function getJobsByCompany(companyId) {
  const jobs = readSheetObjects_(SHEET_IDS.Jobs);
  return jobs.filter(j => String(j.CompanyID) === String(companyId));
}

/** === 2. COMPANIES ==================================================== */

/**
 * Returns one Company object by CompanyID
 * @param {string} companyId
 * @return {object|null}
 */
function getCompanyById(companyId) {
  const comps = readSheetObjects_(SHEET_IDS.Companies);
  const c = comps.find(x => String(x.CompanyID) === String(companyId));
  return c || null;
}

/** === 3. HIRES / TALENT / KPIs (simplified now) ====================== */

/**
 * Returns minimal KPIs for a company (placeholder logic for Phase 3D)
 * @param {string} companyId
 * @return {object}
 */
function getCompanyKPIs(companyId) {
  const hires = readSheetObjects_(SHEET_IDS.Hires)
    .filter(h => String(h.CompanyID) === String(companyId));
  const jobs  = readSheetObjects_(SHEET_IDS.Jobs)
    .filter(j => String(j.CompanyID) === String(companyId));

  return {
    openRoles: jobs.filter(j => j.Status === 'Open').length,
    hiresTotal: hires.length,
    recentHires: hires.slice(-5).reverse()
  };
}

/**
 * Returns minimal TalentMap (placeholder counts by role)
 * @param {string} companyId
 * @return {Array<object>}
 */
function getTalentMap(companyId) {
  const hires = readSheetObjects_(SHEET_IDS.Hires)
    .filter(h => String(h.CompanyID) === String(companyId));
  const counts = {};
  hires.forEach(h => {
    const role = h.Role || h.JobID || 'Unknown';
    counts[role] = (counts[role] || 0) + 1;
  });
  return Object.keys(counts).map(k => ({ role: k, count: counts[k] }));
}

/** === 4. AGGREGATED COMPANY PACKAGE =============================== */

/**
 * Returns combined Company + Jobs + KPIs object for left-panel rendering.
 * @param {string} companyId
 * @return {object}
 */
function getCompanyBundle(companyId) {
  const company = getCompanyById(companyId);
  const jobs = getJobsByCompany(companyId);
  const kpis = getCompanyKPIs(companyId);
  const talent = getTalentMap(companyId);

  return {
    company,
    jobs,
    kpis,
    talent
  };
}

/** === 5. GENERIC HANDLER (optional) ================================== */
/**
 * Dispatcher used by front-end calls like getData('Jobs', {...})
 */
function getData(entity, opts) {
  opts = opts || {};
  switch (entity) {
    case 'Jobs':       return readSheetObjects_(SHEET_IDS.Jobs);
    case 'Companies':  return readSheetObjects_(SHEET_IDS.Companies);
    case 'Hires':      return readSheetObjects_(SHEET_IDS.Hires);
    case 'CompanyBundle': return getCompanyBundle(opts.companyId);
    case 'JobById':    return getJobById(opts.jobId);
    default:
      throw new Error("Unknown entity: " + entity);
  }
}








/** Get all call lists (id, name, status) */
function getCallLists() {
  const sh = SpreadsheetApp.getActive().getSheetByName('CallLists');
  if (!sh) return [];
  const [head, ...rows] = sh.getDataRange().getValues();
  const i = {};
  head.forEach((h, idx) => i[h] = idx);
  return rows.filter(r => r[i.CallListID]).map(r => ({
    CallListID: r[i.CallListID],
    CallListName: r[i.CallListName],
    JobID: r[i.JobID],
    Status: r[i.Status],
    OwnerRecruiterID: r[i.OwnerRecruiterID],
  }));
}

/** Get all candidates belonging to a Call List */
function getCandidatesByCallList(callListId) {
  const sh = SpreadsheetApp.getActive().getSheetByName('CallListsItems');
  if (!sh) return [];
  const [head, ...rows] = sh.getDataRange().getValues();
  const i = {};
  head.forEach((h, idx) => i[h] = idx);
  return rows
    .filter(r => r[i.CallListID] === callListId)
    .map(r => ({
      CandidateID: r[i.CandidateID],
      Status: r[i.Status],
      Notes: r[i.Notes],
      LastAction: r[i.LastAction],
      NextActionAt: r[i.NextActionAt],
    }));
}

/** Get the Job (and Company Name) linked to a Call List */
function getJobForCallList(callListId) {
  const cl = getCallLists().find(c => c.CallListID === callListId);
  if (!cl) return null;
  const sh = SpreadsheetApp.getActive().getSheetByName('Jobs');
  const [head, ...rows] = sh.getDataRange().getValues();
  const i = {};
  head.forEach((h, idx) => i[h] = idx);
  const job = rows.find(r => r[i.JobID] === cl.JobID);
  if (!job) return null;
  return head.reduce((o, h, idx) => { o[h] = job[idx]; return o; }, {});
}








/** Return a lightweight list of candidates (for preview) */
function getCandidatesSummary(candidateIds) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Candidates');
  if (!sh) return [];
  const [head, ...rows] = sh.getDataRange().getValues();
  const i = {};
  head.forEach((h, idx) => i[h] = idx);
  const map = {};
  rows.forEach(r => { if (r[i.CandidateID]) map[r[i.CandidateID]] = r; });

  return candidateIds.map(id => {
    const r = map[id];
    if (!r) return { CandidateID: id, FullName: '(not found)' };
    return {
      CandidateID: id,
      FullName: r[i.FullName],
      Email: r[i.Email],
      Phone: r[i.Phone],
      CandidateStatus: r[i.CandidateStatus],
      CurrentTitle: r[i.CurrentTitle],
      City: r[i.City],
      State: r[i.State],
      Country: r[i.Country],
    };
  });
}

/** Deep load one candidate with all info */
function getCandidateDeep(candidateId) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Candidates');
  if (!sh) return { candidate: null };
  const [head, ...rows] = sh.getDataRange().getValues();
  const i = {};
  head.forEach((h, idx) => i[h] = idx);
  const row = rows.find(r => r[i.CandidateID] === candidateId);
  if (!row) return { candidate: null };
  const cand = head.reduce((o, h, idx) => { o[h] = row[idx]; return o; }, {});
  return { candidate: cand };
}



/** Return candidate IDs for a given CallListID */
function getCandidatesByCallList(callListId) {
  const sh = SpreadsheetApp.getActive().getSheetByName('CallLists');
  if (!sh) return [];
  const [head, ...rows] = sh.getDataRange().getValues();
  const i = {};
  head.forEach((h, idx) => i[h] = idx);

  const row = rows.find(r => r[i.CallListID] === callListId);
  if (!row) return [];
  const str = row[i.CandidateIDs] || '';
  return str.split(/[;,]/).map(s => s.trim()).filter(Boolean);
}

/** Return full candidate profiles for a CallList */
function getCandidatesForCallList(callListId) {
  const ids = getCandidatesByCallList(callListId);
  return getCandidatesSummary(ids);
}

/** Return job and company info for a CallList */
function getJobAndCompanyForCallList(callListId) {
  const sh = SpreadsheetApp.getActive().getSheetByName('CallLists');
  const [head, ...rows] = sh.getDataRange().getValues();
  const i = {}; head.forEach((h, idx) => i[h] = idx);
  const row = rows.find(r => r[i.CallListID] === callListId);
  if (!row) return null;

  const jobId = row[i.JobID];
  const jobSh = SpreadsheetApp.getActive().getSheetByName('Jobs');
  const jobRows = jobSh.getDataRange().getValues();
  const jobHead = jobRows.shift();
  const j = {}; jobHead.forEach((h, idx) => j[h] = idx);
  const jobRow = jobRows.find(r => r[j.JobID] === jobId);
  const job = jobRow ? jobHead.reduce((o, h, idx) => { o[h] = jobRow[idx]; return o; }, {}) : null;

  const compId = job ? job.CompanyID : '';
  const compSh = SpreadsheetApp.getActive().getSheetByName('Companies');
  const compRows = compSh.getDataRange().getValues();
  const compHead = compRows.shift();
  const c = {}; compHead.forEach((h, idx) => c[h] = idx);
  const compRow = compRows.find(r => r[c.CompanyID] === compId);
  const company = compRow ? compHead.reduce((o, h, idx) => { o[h] = compRow[idx]; return o; }, {}) : null;

  return { job: job, company: company };
}

/** Save a Quick Action (Note, Reminder, Hire, etc.) into Activities */
function saveActivity(data) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Activities');
  if (!sh) throw new Error('Activities sheet not found');
  const headers = sh.getDataRange().getValues()[0];
  const now = new Date();

  const row = [
    Utilities.getUuid(),                   // ActivityID
    data.Type || 'Note',                   // Type
    data.RecruiterID || 'USR01',           // RecruiterID
    data.RecruiterName || 'Oriol',         // RecruiterName
    data.CandidateID || '',                // CandidateID
    data.JobID || '',                      // JobID
    data.CallListID || '',                 // CallListID
    data.CompanyID || '',                  // CompanyID
    data.CompanyName || '',                // CompanyName
    data.ClientID || '',                   // ClientID
    data.ClientName || '',                 // ClientName
    data.ApplicationID || '',
    data.ActivityType || '',
    data.Result || '',
    data.Comments || '',
    data.AttachmentURL || '',
    now,                                   // CreatedAt
    now,                                   // UpdatedAt
    data.DateTime || now,
    data.DurationMinutes || '',
    data.Outcome || '',
    data.Notes || '',
    Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
  ];
  sh.appendRow(row);
  return { success: true, id: row[0] };
}

/** Fetch all activities for candidate/job */
function getActivitiesForContext(candidateId, jobId) {
  const sh = SpreadsheetApp.getActive().getSheetByName('Activities');
  const [head, ...rows] = sh.getDataRange().getValues();
  const i = {}; head.forEach((h, idx) => i[h] = idx);
  const acts = rows.filter(r => r[i.CandidateID] === candidateId && r[i.JobID] === jobId)
    .map(r => ({
      ActivityID: r[i.ActivityID],
      Type: r[i.Type],
      Notes: r[i.Notes],
      CreatedOn: r[i.CreatedOn],
      RecruiterName: r[i.RecruiterName],
      Result: r[i.Result],
      Comments: r[i.Comments],
      Outcome: r[i.Outcome]
    }));
  return acts;
}








/** Return all Call Lists for dropdown */
function getAllCallLists() {
  const sh = SpreadsheetApp.getActive().getSheetByName('CallLists');
  if (!sh) return [];
  const [head, ...rows] = sh.getDataRange().getValues();
  const i = {}; head.forEach((h, idx) => i[h] = idx);
  return rows.map(r => {
    var name = r[i.Name];
    if (!name && i.CallListName != null) name = r[i.CallListName];
    return {
      CallListID: r[i.CallListID],
      Name: name || r[i.CallListID],
      JobID: r[i.JobID],
      Status: r[i.Status],
      CreatedOn: r[i.GeneratedDate]
    };
  }).filter(x => x.CallListID);
}




/** Return one CallList row by ID */
/** Return one CallList row by ID (cleaned and normalized) */
function getCallListById(id) {
  const sh = SpreadsheetApp.getActive().getSheetByName('CallLists');
  if (!sh) return null;
  const [head, ...rows] = sh.getDataRange().getValues();
  const idx = {}; head.forEach((h,i)=>idx[h]=i);

  id = String(id || '').trim();

  for (const r of rows) {
    const sheetId = String(r[idx.CallListID] || '').trim();
    // tolerate CL1 / CL01 / CL001 / CL0001
    if (sheetId.replace(/^CL0+/, 'CL') === id.replace(/^CL0+/, 'CL')) {
      const obj = {};
      head.forEach((h,i)=>obj[h]=r[i]);

      // Clean CandidateIDs
      if (obj.CandidateIDs) {
        obj.CandidateIDs = String(obj.CandidateIDs)
          .replace(/^"+|"+$/g,'')
          .replace(/[\r\n]+/g,';')
          .replace(/[ ,]+/g,';')
          .replace(/;+$/,'')
          .trim();
      }

      // Normalize JobID: J001 → JOB0001, JOB001 → JOB0001
      var raw = String(obj.JobID || '');
      var digits = raw.replace(/\D/g,'');
      if (/^J\d+$/i.test(raw) || /^JOB\d{3}$/i.test(raw)) {
        obj.JobID = 'JOB' + ('0000' + digits).slice(-4);
      }

      // Compatibility
      if (!obj.Name && obj.CallListName) obj.Name = obj.CallListName;

      return obj;
    }
  }
  return null;
}



/** Return Job + Company bundle */
function getJobCompanyBundle(jobId){
  const out = { job:null, company:null };
  const sj = SpreadsheetApp.getActive().getSheetByName('Jobs');
  const sc = SpreadsheetApp.getActive().getSheetByName('Companies');
  if(sj){
    const [hj, ...rj] = sj.getDataRange().getValues();
    const ij = {}; hj.forEach((h, idx)=>ij[h]=idx);
    const row = rj.find(r=>String(r[ij.JobID])===String(jobId));
    if(row){ out.job={}; hj.forEach((h,i)=>out.job[h]=row[i]); }
  }
  if(sc && out.job && out.job.CompanyID){
    const [hc, ...rc] = sc.getDataRange().getValues();
    const ic = {}; hc.forEach((h, idx)=>ic[h]=idx);
    const row = rc.find(r=>String(r[ic.CompanyID])===String(out.job.CompanyID));
    if(row){ out.company={}; hc.forEach((h,i)=>out.company[h]=row[i]); }
  }
  return out;
}

/** Return Candidate objects from IDs */
function getCandidatesByIds(ids){
  if(!ids || !ids.length) return [];
  const sh = SpreadsheetApp.getActive().getSheetByName('Candidates');
  if(!sh) return [];
  const [head, ...rows] = sh.getDataRange().getValues();
  const i = {}; head.forEach((h, idx)=>i[h]=idx);
  return rows
    .filter(r=>ids.includes(String(r[i.CandidateID])))
    .map(r=>{
      const o={}; head.forEach((h,idx)=>o[h]=r[idx]); return o;
    });
}


function testGetCallListById(){
  Logger.log(getCallListById('CL001'));
}

