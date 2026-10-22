// 教師研習整合版 2026-10-22
// 新專案使用；現有專案請先備份並停止舊排程。
const SETTINGS = {
  TIMEZONE: 'Asia/Taipei', TARGET: '2028-12-31',
  SHEET: '教材', HOUR: 7
};
const LESSON_KEYS = [
  'topic','vocabulary','grammar','reading','task','answers'
];

function initialize() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('請從教材試算表開啟此專案。');
  PropertiesService.getScriptProperties()
    .setProperty('SPREADSHEET_ID', ss.getId());
  let sh = ss.getSheetByName(SETTINGS.SHEET);
  if (!sh) sh = ss.insertSheet(SETTINGS.SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['日期','主題','單字','句型','閱讀與題目',
      '翻譯或寫作','解答與解析','輸入Token','輸出Token',
      '思考Token','寄送時間']);
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('@');
  }
  console.log('初始化完成，既有資料未覆蓋。');
}
function property_(name) {
  const v = PropertiesService.getScriptProperties()
    .getProperty(name);
  if (!v || !v.trim()) throw new Error('缺少屬性：'+name);
  return v.trim();
}
function getTarget_() {
  const v = PropertiesService.getScriptProperties()
    .getProperty('TARGET_DATE') || SETTINGS.TARGET;
  const date = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      isNaN(Date.parse(date+'T00:00:00Z')) ||
      new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date) {
    throw new Error('TARGET_DATE必須是有效的YYYY-MM-DD日期。');
  }
  return date;
}
function today_() {
  return Utilities.formatDate(new Date(),SETTINGS.TIMEZONE,
    'yyyy-MM-dd');
}
function dayNumber_(date) {
  const [y,m,d] = date.split('-').map(Number);
  return Date.UTC(y,m-1,d)/86400000;
}
function dateBefore_(date,n) {
  return new Date((dayNumber_(date)-n)*86400000)
    .toISOString().slice(0,10);
}
function sheet_() {
  const sh = SpreadsheetApp.openById(property_('SPREADSHEET_ID'))
    .getSheetByName(SETTINGS.SHEET);
  if (!sh) throw new Error('找不到教材工作表，請先初始化。');
  return sh;
}
function findRow_(sh,date) {
  const n=sh.getLastRow()-1;
  if (n<1) return 0;
  const found=[];
  sh.getRange(2,1,n,1).getDisplayValues().forEach((r,i)=>{
    if (r[0].trim()===date) found.push(i+2);
  });
  if (found.length>1) throw new Error(date+'有重複教材列。');
  return found[0]||0;
}
function withLock_(fn) {
  const lock=LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error('另有工作執行中。');
  try { return fn(); } finally { lock.releaseLock(); }
}
function safeCell_(s) {
  return /^\s*[=+\-@]/.test(s) ? "'"+s : s;
}
function escapeHtml_(s) {
  return String(s).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',
    '"':'&quot;',"'":'&#39;'
  }[c]));
}
function recipients_() {
  const list=[...new Set(property_('RECIPIENT_EMAIL')
    .split(',').map(s=>s.trim()).filter(Boolean))];
  if (!list.length) throw new Error('請設定收件人。');
  return list;
}
function prepareToday() {
  withLock_(()=>{
    if (today_()>getTarget_()) throw new Error('已超過截止日。');
    console.log('教材已備妥，第'+ensureLesson_(today_())+'列。');
  });
}
function ensureLesson_(date) {
  const sh=sheet_(), existing=findRow_(sh,date);
  if (existing) {
    const a=sh.getRange(existing,2,1,6).getDisplayValues()[0];
    if (a.some(s=>!s.trim())) throw new Error('既有教材不完整。');
    return existing;
  }
  const history=sh.getDataRange().getDisplayValues().slice(1)
    .filter(r=>r[0]<date&&r[1])
    .sort((a,b)=>a[0].localeCompare(b[0])).slice(-7)
    .map(r=>r[1]).join('、');
  const result=generateLesson_(date,history);
  LESSON_KEYS.forEach(k=>{
    const v=result.lesson[k];
    if (typeof v!=='string'||!v.trim()||v.length>45000)
      throw new Error('教材欄位無效：'+k);
  });
  const row=sh.getLastRow()+1, u=result.usage;
  sh.getRange(row,1,1,7).setNumberFormat('@');
  sh.getRange(row,1,1,11).setValues([[
    date,...LESSON_KEYS.map(k=>safeCell_(result.lesson[k].trim())),
    u.promptTokenCount||0,u.candidatesTokenCount||0,
    u.thoughtsTokenCount||0,''
  ]]);
  SpreadsheetApp.flush();
  return row;
}
function generateLesson_(date,history) {
  const model=property_('GEMINI_MODEL').replace(/^models\//,'');
  if (!/^[A-Za-z0-9._-]+$/.test(model))
    throw new Error('請填模型ID，不要使用含空格的顯示名稱。');
  const properties={};
  LESSON_KEYS.forEach(k=>properties[k]={type:'STRING'});
  const payload={
    contents:[{role:'user',parts:[{text:buildPrompt_(date,history)}]}],
    generationConfig:{
      maxOutputTokens:12000,responseMimeType:'application/json',
      responseSchema:{type:'OBJECT',properties:properties,
        required:LESSON_KEYS}
    }
  };
  const url='https://generativelanguage.googleapis.com/v1beta/'+
    'models/'+encodeURIComponent(model)+':generateContent';
  let response;
  for (let attempt=0;attempt<2;attempt++) {
    response=UrlFetchApp.fetch(url,{
      method:'post',contentType:'application/json',
      headers:{'x-goog-api-key':property_('GEMINI_API_KEY')},
      payload:JSON.stringify(payload),muteHttpExceptions:true
    });
    const code=response.getResponseCode();
    if (code===200) break;
    if ((code===429||code>=500)&&attempt===0) {
      Utilities.sleep(3000); continue;
    }
    let message='未提供詳細原因';
    try {
      const e=JSON.parse(response.getContentText()).error||{};
      message=(e.status||'')+' '+(e.message||message);
    } catch(e) {}
    message=message.split(property_('GEMINI_API_KEY'))
      .join('[KEY已遮蔽]')
      .replace(/AIza[0-9A-Za-z_-]+/g,'[KEY已遮蔽]');
    throw new Error('Gemini HTTP '+code+'；模型：'+model+
      '；原因：'+message);
  }
  const data=JSON.parse(response.getContentText());
  const c=data.candidates&&data.candidates[0];
  if (!c||c.finishReason!=='STOP')
    throw new Error('AI未完整產生教材，本次不存檔、不寄信。');
  const text=((c.content||{}).parts||[])
    .filter(p=>!p.thought&&typeof p.text==='string')
    .map(p=>p.text).join('');
  let lesson;
  try { lesson=JSON.parse(text); }
  catch(e) { throw new Error('AI回傳不是有效JSON。'); }
  return {lesson:lesson,usage:data.usageMetadata||{}};
}
function previewToday() {
  const sh=sheet_(),row=findRow_(sh,today_());
  if (!row) throw new Error('請先執行prepareToday。');
  console.log(makeMail_(sh,row).body);
}
function dailyJob() {
  withLock_(()=>{
    const date=today_();
    if (date>getTarget_()) {stopSchedule();return;}
    const sh=sheet_(); let row=findRow_(sh,date);
    if (row&&sh.getRange(row,11).getDisplayValue()) {
      console.log('今日已寄送，略過。'); return;
    }
    const list=recipients_();
    if (MailApp.getRemainingDailyQuota()<list.length)
      throw new Error('今日寄信額度不足。');
    row=ensureLesson_(date);
    deliver_(sh,row,list,false);
    sh.getRange(row,11).setValue(Utilities.formatDate(
      new Date(),SETTINGS.TIMEZONE,'yyyy-MM-dd HH:mm:ss'));
    console.log('寄送成功。');
  });
}
function sendHtmlTest() {
  withLock_(()=>{
    if (today_()>getTarget_()) throw new Error('已超過截止日。');
    const list=recipients_();
    if (MailApp.getRemainingDailyQuota()<list.length)
      throw new Error('今日寄信額度不足。');
    const row=ensureLesson_(today_());
    deliver_(sheet_(),row,list,true);
    console.log('測試信已寄出，正式寄送紀錄未改。');
  });
}
function deliver_(sh,row,list,test) {
  const mail=makeMail_(sh,row);
  MailApp.sendEmail({to:list.join(','),
    subject:(test?'【測試】':'')+mail.subject,body:mail.body,
    htmlBody:buildEmailHtml_(sh,row),name:'每日學測英文'});
}
function installSchedule() {
  stopSchedule();
  ScriptApp.newTrigger('dailyJob').timeBased()
    .atHour(SETTINGS.HOUR).nearMinute(0).everyDays(1)
    .inTimezone(SETTINGS.TIMEZONE).create();
  console.log('排程建立完成。');
}
function stopSchedule() {
  ScriptApp.getProjectTriggers()
    .filter(t=>t.getHandlerFunction()==='dailyJob')
    .forEach(t=>ScriptApp.deleteTrigger(t));
}
// 只列出模型ID；可列出不代表必然有免費額度或支援JSON。
function listAvailableModels() {
  let token='';
  do {
    const url='https://generativelanguage.googleapis.com/v1beta/'+
      'models?pageSize=100'+
      (token?'&pageToken='+encodeURIComponent(token):'');
    const r=UrlFetchApp.fetch(url,{
      headers:{'x-goog-api-key':property_('GEMINI_API_KEY')},
      muteHttpExceptions:true});
    if (r.getResponseCode()!==200)
      throw new Error('列出模型失敗：HTTP '+r.getResponseCode());
    const d=JSON.parse(r.getContentText());
    (d.models||[]).filter(m=>(m.supportedGenerationMethods||[])
      .includes('generateContent')).forEach(m=>
        console.log(m.name.replace(/^models\//,'')));
    token=d.nextPageToken||'';
  } while(token);
}

// 既有TARGET_DATE屬性優先於程式預設值；更新後手動執行一次。
// 此函式只更新截止日期，不寄信、不清除教材、不重建排程。
function setTargetDate2028() {
  PropertiesService.getScriptProperties()
    .setProperty('TARGET_DATE','2028-12-31');
  console.log('截止日期已設定為 2028-12-31');
}
