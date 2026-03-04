const SHEET_ID = "1sbKGknuz6xB1xdohKec4dvnb6Ifvnb6BeDdeklocMgo";
const SESSION_HOURS = 8;

/* ================= ROUTER ================= */

function doGet(e){
  return route(e);
}

function doPost(e){
  return route(e);
}

function route(e){
  const action = e.parameter.action;
  const cb = e.parameter.callback;

  if(action==="login")             return respond(login(e), cb);
  if(action==="validate")          return respond(validateToken(e), cb);
  if(action==="getCounters")       return respond(getCounters(e), cb);
  if(action==="nextToken")         return respond(nextToken(e), cb);
  if(action==="previousToken")     return respond(previousToken(e), cb);
  if(action==="repeatToken")       return respond(repeatToken(e), cb);
  if(action==="getCountersPublic") return respond(getCountersPublic(), cb);
  if(action==="addCounter")        return respond(adminOnly(e, addCounter), cb);
  if(action==="renameCounter")     return respond(adminOnly(e, renameCounter), cb);
  if(action==="deleteCounter")     return respond(adminOnly(e, deleteCounter), cb);
  if(action==="resetCounter")      return respond(adminOnly(e, resetCounter), cb);

  return respond(output({error:"Invalid action"}), cb);
}

/* JSONP wrapper */
function respond(result, callback){
  if(callback){
    const json = result.getContent();
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return result;
}

function output(data){
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ================= GET COUNTERS PUBLIC ================= */

function getCountersPublic(){
  const sheet = getCountersSheet();
  const data = sheet.getDataRange().getValues();
  // Ensure each row has a prefix (col index 4)
  for(let i=1;i<data.length;i++){
    if(!data[i][4]){
      // assign prefix based on row order if missing
      data[i][4] = String.fromCharCode(64 + i); // 1=A,2=B,...
    }
  }
  return output(data);
}

/* ================= LOGIN ================= */

function login(e){
  const username = e.parameter.username;
  const passwordHash = sha256(e.parameter.password);
  const users = getUsers().getDataRange().getValues();

  for(let i=1;i<users.length;i++){
    if(users[i][0]===username && users[i][1]===passwordHash){
      const token = Utilities.getUuid();
      const now = new Date();
      const expiry = new Date(now.getTime()+SESSION_HOURS*3600000);
      getSessions().appendRow([token, username, users[i][2], now, expiry, true]);
      return output({success:true, token:token, role:users[i][2]});
    }
  }
  return output({success:false});
}

/* ================= VALIDATE ================= */

function validateToken(e){
  const session = checkToken(e.parameter.token);
  if(session.valid) return output(session);
  return output({valid:false});
}

function checkToken(token){
  const sessions = getSessions().getDataRange().getValues();
  const now = new Date();
  for(let i=1;i<sessions.length;i++){
    if(sessions[i][0]===token){
      if(sessions[i][5]===true && now < new Date(sessions[i][4])){
        return {valid:true, username:sessions[i][1], role:sessions[i][2]};
      }
    }
  }
  return {valid:false};
}

/* ================= GET COUNTERS (authenticated) ================= */

function getCounters(e){
  const session = checkToken(e.parameter.token);
  if(!session.valid) return output({error:"Unauthorized"});

  const sheet = getCountersSheet();
  const data = sheet.getDataRange().getValues();

  // Ensure prefix exists for all rows
  for(let i=1;i<data.length;i++){
    if(!data[i][4]){
      const prefix = String.fromCharCode(64 + i);
      sheet.getRange(i+1,5).setValue(prefix);
      data[i][4] = prefix;
    }
  }
  return output(data);
}

/* ================= NEXT TOKEN ================= */

function nextToken(e){
  const session = checkToken(e.parameter.token);
  if(!session.valid) return output({error:"Unauthorized"});
  if(session.role==="User") return output({error:"Not allowed"});

  const id = e.parameter.counterId;
  const sheet = getCountersSheet();
  const data = sheet.getDataRange().getValues();

  for(let i=1;i<data.length;i++){
    if(data[i][0]===id){
      const newValue = Number(data[i][2]) + 1;
      sheet.getRange(i+1,3).setValue(newValue);
      sheet.getRange(i+1,4).setValue(Utilities.getUuid());
      logHistory(id, data[i][1], data[i][4]+newValue, session.username, "Next");
      return output({success:true});
    }
  }
  return output({error:"Counter not found"});
}

/* ================= PREVIOUS TOKEN ================= */

function previousToken(e){
  const session = checkToken(e.parameter.token);
  if(!session.valid || session.role!=="Admin") return output({error:"Admin only"});

  const id = e.parameter.counterId;
  const sheet = getCountersSheet();
  const data = sheet.getDataRange().getValues();

  for(let i=1;i<data.length;i++){
    if(data[i][0]===id){
      let newValue = Number(data[i][2]) - 1;
      if(newValue < 1) newValue = 1;
      sheet.getRange(i+1,3).setValue(newValue);
      sheet.getRange(i+1,4).setValue(Utilities.getUuid());
      logHistory(id, data[i][1], data[i][4]+newValue, session.username, "Previous");
      return output({success:true});
    }
  }
  return output({error:"Counter not found"});
}

/* ================= REPEAT TOKEN ================= */

function repeatToken(e){
  const session = checkToken(e.parameter.token);
  if(!session.valid) return output({error:"Unauthorized"});

  const id = e.parameter.counterId;
  const sheet = getCountersSheet();
  const data = sheet.getDataRange().getValues();

  for(let i=1;i<data.length;i++){
    if(data[i][0]===id){
      sheet.getRange(i+1,4).setValue(Utilities.getUuid());
      logHistory(id, data[i][1], data[i][4]+data[i][2], session.username, "Repeat");
      return output({success:true});
    }
  }
  return output({error:"Counter not found"});
}

/* ================= ADMIN WRAPPER ================= */

function adminOnly(e, func){
  const session = checkToken(e.parameter.token);
  if(!session.valid || session.role!=="Admin") return output({error:"Admin only"});
  return func(e);
}

/* ================= ADMIN ACTIONS ================= */

function addCounter(e){
  const sheet = getCountersSheet();
  const data = sheet.getDataRange().getValues();
  const count = data.length - 1; // existing counter count
  const prefix = String.fromCharCode(65 + count); // A=65
  sheet.appendRow([Utilities.getUuid(), e.parameter.name, 1, Utilities.getUuid(), prefix]);
  return output({success:true});
}

function renameCounter(e){
  const sheet = getCountersSheet();
  const data = sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){
    if(data[i][0]===e.parameter.counterId){
      sheet.getRange(i+1,2).setValue(e.parameter.newName);
      return output({success:true});
    }
  }
  return output({error:"Not found"});
}

function deleteCounter(e){
  const sheet = getCountersSheet();
  const data = sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){
    if(data[i][0]===e.parameter.counterId){
      sheet.deleteRow(i+1);
      return output({success:true});
    }
  }
  return output({error:"Not found"});
}

function resetCounter(e){
  const sheet = getCountersSheet();
  const data = sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){
    if(data[i][0]===e.parameter.counterId){
      sheet.getRange(i+1,3).setValue(1);
      sheet.getRange(i+1,4).setValue(Utilities.getUuid());
      return output({success:true});
    }
  }
  return output({error:"Not found"});
}

/* ================= DAILY RESET ================= */

function dailyReset(){
  const sheet = getCountersSheet();
  const data = sheet.getDataRange().getValues();
  for(let i=1;i<data.length;i++){
    sheet.getRange(i+1,3).setValue(1);
    sheet.getRange(i+1,4).setValue(Utilities.getUuid());
  }
}

/* ================= LOG HISTORY ================= */

function logHistory(id, name, value, user, action){
  SpreadsheetApp.openById(SHEET_ID)
    .getSheetByName("CounterHistory")
    .appendRow([id, name, value, user, action, new Date()]);
}

/* ================= HELPERS ================= */

function getUsers(){
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName("Users");
}

function getSessions(){
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName("Sessions");
}

function getCountersSheet(){
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName("Counters");
}

/* ================= SHA256 ================= */

function sha256(str){
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, str);
  return raw.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}
