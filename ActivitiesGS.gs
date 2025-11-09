function getActivitiesForCandidate(candId){
  const sh = SpreadsheetApp.getActive().getSheetByName('Activities');
  if(!sh) return [];
  const data = sh.getDataRange().getValues();
  const headers = data.shift();
  const idx = headers.reduce((a,h,i)=>{a[h]=i;return a;}, {});
  const out = [];
  data.forEach(r=>{
    if(String(r[idx['CandidateID']||0])===String(candId)){
      const obj = {};
      headers.forEach((h,i)=>obj[h]=r[i]);
      out.push(obj);
    }
  });
  /* newest first */
  out.sort((a,b)=>new Date(b.CreatedAt||b.DateTime)-new Date(a.CreatedAt||a.DateTime));
  return out;
}


function saveActivityRow(obj){
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Activities');
  if(!sh) throw new Error("Activities sheet missing");
  const headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  const row = [];
  headers.forEach(h => row.push(obj[h] || ''));
  sh.appendRow(row);
  return "OK";
}



/**
 * === getActivitiesForContext(candidateId, jobId) ========================
 * Returns all activities that match either a specific candidate, job,
 * or both — sorted newest first. Used for Arena timeline display.
 */
function getActivitiesForContext(candidateId, jobId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName('Activities');
  if (!sh) throw new Error("Activities sheet not found");

  const data = sh.getDataRange().getValues();
  const headers = data.shift();
  const out = [];

  const idxCandidate = headers.indexOf("CandidateID");
  const idxJob       = headers.indexOf("JobID");
  const idxType      = headers.indexOf("ActivityType");
  const idxResult    = headers.indexOf("Result");
  const idxNotes     = headers.indexOf("Notes");
  const idxCreated   = headers.indexOf("CreatedAt");

  // Normalize filters
  candidateId = (candidateId || "").toString().trim();
  jobId       = (jobId || "").toString().trim();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const cId = (row[idxCandidate] || "").toString().trim();
    const jId = (row[idxJob] || "").toString().trim();

    if ((candidateId && cId === candidateId) || (jobId && jId === jobId)) {
      out.push({
        CandidateID: cId,
        JobID: jId,
        Type: row[idxType] || "",
        Result: row[idxResult] || "",
        Notes: row[idxNotes] || "",
        CreatedAt: row[idxCreated] || "",
        _row: i + 2 // for debugging
      });
    }
  }

  // sort newest first
  out.sort(function (a, b) {
    const da = new Date(a.CreatedAt);
    const db = new Date(b.CreatedAt);
    return db - da;
  });

  return out;
}


function test_getActivitiesForContext() {
  const result = getActivitiesForContext("CAND0001", "JOB0001");
  Logger.log(result);
}

