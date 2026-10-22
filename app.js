(()=>{'use strict';
const $=s=>document.querySelector(s), store={get(k,f){try{return JSON.parse(localStorage.getItem('bloom:'+k))??f}catch{return f}},set(k,v){try{localStorage.setItem('bloom:'+k,JSON.stringify(v))}catch{}},remove(k){localStorage.removeItem('bloom:'+k)}};
const APP_VERSION='2.0.1';
const appScope=new URL('./',location.href);
let requestSequence=0, activeRequest=null, maintenanceBusy=false;
const defaults={sound:'off',device:'auto',layout:'auto',language:'zh',font:'normal',theme:'system'};
let settings={...defaults,...store.get('settings',{})}, data=null, selected='', mode='', loading=false, installEvent=null;
let progress=store.get('progress',{}), notes=store.get('notes',{}), endpoint=store.get('endpoint',window.APP_CONFIG.endpoint||'');
const tr={zh:{title:'每天一點英文，<br>讓未來慢慢盛開。',intro:'為高中生打造的英文學習花園。探索每天的新知，收藏每一次進步。',settings:'⚙️ 顯示與操作設定',latest:'開始最新一課 ↗',refresh:'↻ 更新教材',countdown:'距離 2028/12/31',lessons:'累積教材',completed:'已完成',progress:'學習進度',connect:'連接資料來源',archive:'📚 每日教材庫',search:'搜尋全部內容',month:'月份',filter:'篩選',all:'全部',saved:'已收藏',done:'已完成',sort:'排序',newest:'最新優先',oldest:'最早優先',empty:'連接試算表，或開啟示範教材開始探索。',footer:'原創 AI 教材，非官方試題；答案有疑義請再查證。學習紀錄僅儲存在此瀏覽器。',demo:'開啟示範教材',print:'列印 / 另存 PDF',fullscreen:'全螢幕',sound:'音效',off:'關閉',on:'開啟',device:'裝置',auto:'自動',phone:'手機',tablet:'平板',desktop:'電腦',layout:'版面',portrait:'直式',landscape:'橫式',language:'語言',font:'字體',small:'縮小',normal:'標準',large:'放大',theme:'色系',system:'跟隨系統',light:'亮色',dark:'暗色',settingHint:'裝置與版面切換調整內容寬度及排列，不會旋轉實體螢幕。全螢幕依瀏覽器支援。',source:'連接試算表教材',sourceHint:'貼上已部署的 Apps Script 網頁應用程式 /exec 網址。此網址是公開唯讀教材端點，不是 API Key。',saveConnect:'儲存並連接',publicHint:'只連接你信任的端點。公開端點的資料可被其他人讀取；請使用教材專用工作表。',install:'安裝應用程式',live:'即時同步',cached:'離線／上次成功資料',sample:'示範資料（非你的試算表）',updated:'讀取時間',notConnected:'尚未連接資料來源。請貼上 Apps Script /exec 網址。',loading:'正在讀取最新教材…',failed:'更新失敗，請檢查網路、部署權限與端點網址。',noResults:'沒有符合條件的教材。',vocabulary:'🌱 單字與搭配詞',grammar:'🧩 句型重點',reading:'📖 閱讀與練習',task:'✍️ 翻譯或寫作',answers:'🔑 顯示答案與解析',review:'🔄 前1、3、7天複習',noReview:'尚無對應日期的教材。',raw:'📊 完整試算表欄位',note:'📝 我的練習筆記',noteHint:'筆記自動儲存在這個瀏覽器，不會寫入試算表。',mark:'✓ 標記完成',unmark:'✓ 已完成（點擊取消）',star:'☆ 收藏',unstar:'★ 已收藏',previous:'← 前一課',next:'後一課 →',day:'天',matches:'筆符合',unsupported:'此瀏覽器不支援全螢幕，請使用瀏覽器選單。',connectError:'請輸入有效的 script.google.com/macros/s/…/exec HTTPS 網址。',savedNotice:'已儲存',installHint:'可使用瀏覽器選單的「安裝應用程式」或「加入主畫面」。',noLessons:'目前沒有教材資料。',afterTarget:'目標日已到達',extra:'其他欄位',noData:'尚無資料'},en:{title:'A little English.<br>A brighter tomorrow.',intro:'Your daily learning garden for senior high school. Explore new ideas and celebrate small wins.',settings:'⚙️ Display & controls',latest:'Start latest lesson ↗',refresh:'↻ Refresh lessons',countdown:'Until Dec 31, 2028',lessons:'Total lessons',completed:'Completed',progress:'Progress',connect:'Connect data source',archive:'📚 Lesson library',search:'Search all content',month:'Month',filter:'Filter',all:'All',saved:'Saved',done:'Completed',sort:'Sort',newest:'Newest first',oldest:'Oldest first',empty:'Connect your spreadsheet or explore sample lessons.',footer:'AI-generated practice, not official exam questions. Verify uncertain answers. Progress is saved only in this browser.',demo:'Explore sample lessons',print:'Print / Save PDF',fullscreen:'Fullscreen',sound:'Sound',off:'Off',on:'On',device:'Device',auto:'Auto',phone:'Phone',tablet:'Tablet',desktop:'Desktop',layout:'Layout',portrait:'Portrait',landscape:'Landscape',language:'Language',font:'Text size',small:'Smaller',normal:'Standard',large:'Larger',theme:'Theme',system:'System',light:'Light',dark:'Dark',settingHint:'Device and layout controls change content width and arrangement; they do not rotate your screen. Fullscreen depends on browser support.',source:'Connect your lesson sheet',sourceHint:'Paste the deployed Apps Script web app /exec URL. This is a public read-only endpoint, not an API key.',saveConnect:'Save & connect',publicHint:'Use only an endpoint you trust. Public endpoint data can be read by others. Use a dedicated lesson sheet.',install:'Install app',live:'Live sync',cached:'Offline / last successful data',sample:'Sample data (not your spreadsheet)',updated:'Retrieved',notConnected:'No source connected. Enter your Apps Script /exec URL.',loading:'Loading the latest lessons…',failed:'Refresh failed. Check network, deployment access and endpoint URL.',noResults:'No matching lessons.',vocabulary:'🌱 Vocabulary & collocations',grammar:'🧩 Grammar focus',reading:'📖 Reading & practice',task:'✍️ Translation & writing',answers:'🔑 Reveal answers & explanations',review:'🔄 Review: 1, 3 & 7 days ago',noReview:'No lessons for those review dates yet.',raw:'📊 All spreadsheet fields',note:'📝 My practice notes',noteHint:'Notes are saved in this browser, not in the spreadsheet.',mark:'✓ Mark complete',unmark:'✓ Completed (undo)',star:'☆ Save lesson',unstar:'★ Saved',previous:'← Previous lesson',next:'Next lesson →',day:'days',matches:'matches',unsupported:'Fullscreen is unavailable. Try your browser menu.',connectError:'Enter a valid HTTPS script.google.com/macros/s/…/exec URL.',savedNotice:'Saved',installHint:'Use your browser menu to install this app or add it to your home screen.',noLessons:'No lessons available yet.',afterTarget:'Target date reached',extra:'Additional fields',noData:'No data'}};
Object.assign(tr.zh,{
 maintenance:'連線與本機資料管理', reconnect:'↻ 重新連線',
 resetSource:'重設資料來源', updateSite:'更新網站版本',
 exportRecords:'匯出學習紀錄', clearAll:'清除全部本機資料',
 maintenanceHint:'連線修復會保留筆記、收藏及完成進度。清除全部資料前，請先匯出備份。',
 reconnectHint:'重新讀取目前端點；不清除任何本機紀錄。',
 resetSourceHint:'移除已記住的端點及教材快取，改用網站預設來源；筆記與進度保留。',
 updateSiteHint:'清理本網站的介面快取並重新載入；不刪除學習紀錄。請在有網路時使用。',
 clearHint:'清除此瀏覽器中的本網站設定、來源、教材快取、筆記、收藏與進度。Google試算表與其他裝置不受影響。',
 confirmTitle:'確認清除全部本機資料', cancel:'取消', confirmClear:'確認清除',
 confirmHint:'此操作會刪除此瀏覽器內的筆記、收藏與完成進度，無法由網站復原。建議先匯出JSON備份；本版提供匯出，尚無一鍵匯入。',
 sourceDefault:'網站預設來源', sourceSaved:'瀏覽器已儲存來源', sourceUnset:'尚未設定來源',
 waiting:'處理中，請稍候…', sourceReset:'已重設資料來源，筆記與學習進度保留。',
 resetNeedsURL:'已重設，但config.js尚未設定端點。請貼上你的/exec網址。',
 exported:'已產生學習紀錄JSON備份。請確認下載檔案已保存。',
 cleared:'已清除本網站的本機資料，Google試算表沒有變動。',
 offlineUpdate:'目前離線，暫不清理介面快取。請連線後再更新。',
 updateFailed:'未能取得網站新版本，介面快取尚未清除。請確認網路後再試。',
 cleanupFailed:'部分本機資料或快取無法清除，請查看訊息並稍後再試。',
 cachePartial:'瀏覽器未允許完整清理快取；學習紀錄沒有刪除。',
 connectionOK:'已成功讀取最新教材。', restored:'資料已保留；切換不同來源時，舊筆記仍屬於原來源。',
 networkError:'端點無法載入，請檢查網路、網址與匿名讀取權限。',
 timeoutError:'等待超過60秒，請檢查端點是否可在無痕視窗開啟。',
 formatError:'資料格式不符：請檢查headers、rows及每列cells欄數。'
});
Object.assign(tr.en,{
 maintenance:'Connection & local data', reconnect:'↻ Reconnect',
 resetSource:'Reset data source', updateSite:'Update website',
 exportRecords:'Export learning records', clearAll:'Clear all local data',
 maintenanceHint:'Connection repair keeps notes, saved lessons and progress. Export a backup before clearing all data.',
 reconnectHint:'Read the current endpoint again without deleting local records.',
 resetSourceHint:'Remove the saved endpoint and lesson cache, then use the configured default. Notes and progress stay.',
 updateSiteHint:'Clear this website’s interface cache and reload. Learning records stay. Use while online.',
 clearHint:'Remove this website’s local settings, source, lesson cache, notes, saved lessons and progress. Google Sheets and other devices are unaffected.',
 confirmTitle:'Clear all local data?', cancel:'Cancel', confirmClear:'Confirm clear',
 confirmHint:'This removes notes, saved lessons and progress in this browser. The website cannot undo it. Export a JSON backup first; one-click import is not included.',
 sourceDefault:'Configured default', sourceSaved:'Saved in this browser', sourceUnset:'No endpoint configured',
 waiting:'Working, please wait…', sourceReset:'Data source reset. Notes and progress are preserved.',
 resetNeedsURL:'Source reset, but config.js has no endpoint. Enter your /exec URL.',
 exported:'A JSON backup was generated. Confirm that the download has been saved.',
 cleared:'This website’s local data was cleared. Google Sheets was not changed.',
 offlineUpdate:'You are offline. Keep the interface cache and reconnect before updating.',
 updateFailed:'Could not reach the new website version. The interface cache was not cleared. Check your network.',
 cleanupFailed:'Some local data or caches could not be cleared. Check the message and try again.',
 cachePartial:'The browser did not allow a complete cache cleanup. Learning records were not deleted.',
 connectionOK:'Latest lessons loaded successfully.', restored:'Records are preserved. Notes for a different endpoint remain associated with the old source.',
 networkError:'Endpoint loading failed. Check network, URL and anonymous access.',
 timeoutError:'The request exceeded 60 seconds. Try the /exec URL in a private browser window.',
 formatError:'Invalid data: check headers, rows and the number of cells per row.'
});
const t=k=>tr[settings.language][k]||k, esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=s=>esc(s).replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
function toast(msg){$('#toast').textContent=msg;$('#toast').style.display='block';clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.display='none',3500)}
function sound(){if(settings.sound!=='on')return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const a=sound.ctx||(sound.ctx=new C());a.resume();const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(660,a.currentTime);o.frequency.exponentialRampToValueAtTime(880,a.currentTime+.09);g.gain.setValueAtTime(.035,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.13);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.14)}catch{}}
function apply(){const h=document.documentElement;h.lang=settings.language==='zh'?'zh-Hant':'en';h.dataset.font=settings.font;h.dataset.device=settings.device;h.dataset.layout=settings.layout;h.dataset.theme=settings.theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):settings.theme;document.querySelectorAll('[data-i]').forEach(el=>{if(el.dataset.i==='title')el.innerHTML=t('title');else el.textContent=t(el.dataset.i)});Object.keys(defaults).forEach(k=>$('#'+k).value=settings[k]);$('#fullscreen').textContent=t(document.fullscreenElement?'on':'off');$('#install').hidden=!installEvent;render();status();connectionDetails();}
function status(extra=''){const state=mode==='demo'?t('sample'):mode==='cache'?t('cached'):mode==='live'?t('live'):t('notConnected');$('#status').textContent=extra||state+(data?' · '+t('updated')+': '+new Date(data.fetchedAt).toLocaleString(settings.language==='zh'?'zh-TW':'en-US'):'');}
function key(r){return (mode==='demo'?'demo':endpoint)+'|'+r.id}
function rows(){return data?.rows||[]}
function val(r,n){return r.cells[n]||''}
function sorted(){return [...rows()].sort((a,b)=>val(a,0).localeCompare(val(b,0))||a.id.localeCompare(b.id))}
function render(){const all=sorted(),q=$('#search').value.toLowerCase(),month=$('#month').value,f=$('#filter').value;let visible=all.filter(r=>(!q||r.cells.join(' ').toLowerCase().includes(q))&&(!month||val(r,0).startsWith(month))&&(f==='all'||progress[key(r)]?.[f]));if($('#sort').value==='new')visible.reverse();$('#total').textContent=all.length;const done=all.filter(r=>progress[key(r)]?.done).length;$('#completed').textContent=done;$('#progress').textContent=(all.length?Math.round(done/all.length*100):0)+'%';const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const parts=Object.fromEntries(new Intl.DateTimeFormat('en',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));const target=data?.targetDate||window.APP_CONFIG.targetDate||'2028-12-31';const validTarget=/^\d{4}-\d{2}-\d{2}$/.test(target)&&!isNaN(Date.parse(target+'T00:00:00Z'));const n=validTarget?Math.round((Date.parse(target+'T00:00:00Z')-Date.UTC(+parts.year,+parts.month-1,+parts.day))/86400000):0;document.querySelector('[data-i=countdown]').textContent=(settings.language==='zh'?'距離 ':'Until ')+target;$('#countdown').textContent=n>=0?n+' '+t('day'):t('afterTarget');$('#matchCount').textContent=visible.length+' '+t('matches');$('#lessonList').replaceChildren();visible.forEach(r=>{const b=document.createElement('button');b.className='lesson-link';b.setAttribute('aria-current',String(selected===r.id));b.innerHTML='<small>'+esc(val(r,0))+(progress[key(r)]?.done?' ✓':'')+(progress[key(r)]?.star?' ★':'')+'</small><strong>'+esc(val(r,1)||t('noData'))+'</strong>';b.onclick=()=>{selected=r.id;render();sound()};$('#lessonList').append(b)});if(!visible.length)$('#lessonList').textContent=t('noResults');if(!all.length){$('#reader').innerHTML='<div class="panel">'+esc(data?t('noLessons'):t('empty'))+'</div>';return}let r=all.find(x=>x.id===selected);if(!r){r=all.at(-1);selected=r.id}renderLesson(r,all);}
function renderLesson(r,all){const state=progress[key(r)]||{},i=all.indexOf(r);const section=(title,content)=>'<section class="lesson-section"><h3>'+esc(title)+'</h3><div class="content">'+text(content)+'</div></section>';let review='';for(const d of [1,3,7]){const date=new Date(val(r,0)+'T00:00:00Z');if(isNaN(date))continue;date.setUTCDate(date.getUTCDate()-d);const prev=all.find(x=>val(x,0)===date.toISOString().slice(0,10));if(prev)review+='<h4>'+esc(val(prev,0))+'</h4><div class="content">'+text(val(prev,2))+'</div>'}const raw=(data.headers||[]).map((h,n)=>'<div class="raw-field"><small>'+esc(h||t('extra')+' '+(n+1))+'</small><div class="content">'+text(val(r,n))+'</div></div>').join('');$('#reader').innerHTML='<div class="panel"><span class="badge">'+esc(mode==='demo'?t('sample'):val(r,0))+'</span><h2 class="lesson-title">'+esc(val(r,1))+'</h2><div class="actions"><button id="star">'+t(state.star?'unstar':'star')+'</button><button class="primary" id="done">'+t(state.done?'unmark':'mark')+'</button></div></div>'+section(t('vocabulary'),val(r,2))+section(t('grammar'),val(r,3))+section(t('reading'),val(r,4))+section(t('task'),val(r,5))+'<section class="lesson-section"><label for="note">'+t('note')+'</label><textarea id="note"></textarea><p class="hint">'+t('noteHint')+'</p></section><details class="lesson-section" id="answers"><summary>'+t('answers')+'</summary><div class="content">'+text(val(r,6))+'</div></details><section class="lesson-section"><h3>'+t('review')+'</h3>'+ (review||esc(t('noReview')))+'</section><details class="lesson-section"><summary>'+t('raw')+'</summary><div class="raw-grid">'+raw+'</div></details><div class="actions"><button id="previous" '+(i===0?'disabled':'')+'>'+t('previous')+'</button><button id="next" '+(i===all.length-1?'disabled':'')+'>'+t('next')+'</button></div>';
$('#note').value=notes[key(r)]||'';$('#note').oninput=e=>{notes[key(r)]=e.target.value;store.set('notes',notes)};for(const n of ['star','done'])$('#'+n).onclick=()=>{progress[key(r)]={...progress[key(r)],[n]:!progress[key(r)]?.[n]};store.set('progress',progress);sound();render()};$('#answers').ontoggle=()=>{if($('#answers').open)sound()};$('#previous').onclick=()=>{selected=all[i-1].id;render();$('#reader').focus();sound()};$('#next').onclick=()=>{selected=all[i+1].id;render();$('#reader').focus();sound()};}
function validURL(s){try{const u=new URL(s);return u.protocol==='https:'&&u.hostname==='script.google.com'&&/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname)&&!u.search&&!u.hash}catch{return false}}
function jsonp(url,signal){
 return new Promise((resolve,reject)=>{
  const cb='bloom_cb_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const script=document.createElement('script');let timer,settled=false;
  const clean=()=>{clearTimeout(timer);script.remove();signal?.removeEventListener('abort',abort);
   window[cb]=()=>{};setTimeout(()=>delete window[cb],60000)};
  const finish=(fn,value)=>{if(settled)return;settled=true;clean();fn(value)};
  const abort=()=>finish(reject,new DOMException('Cancelled','AbortError'));
  window[cb]=value=>finish(resolve,value);
  script.onerror=()=>finish(reject,Error('Network'));
  signal?.addEventListener('abort',abort,{once:true});
  if(signal?.aborted){abort();return}
  timer=setTimeout(()=>finish(reject,Error('Timeout')),60000);
  const u=new URL(url);u.searchParams.set('callback',cb);u.searchParams.set('_',Date.now());
  script.src=u.href;document.head.append(script);
 });
}
function cancelRequest(){requestSequence++;activeRequest?.abort();activeRequest=null;loading=false;$('#refresh').disabled=false;}
function validData(d){return d&&d.ok===true&&Array.isArray(d.headers)&&d.headers.length>=7&&d.headers.every(x=>typeof x==='string')&&Array.isArray(d.rows)&&d.rows.every(r=>typeof r.id==='string'&&Array.isArray(r.cells)&&r.cells.length===d.headers.length&&r.cells.every(c=>typeof c==='string'))}
async function refresh({force=false}={}){
 if(loading&&!force)return false;
 if(force)cancelRequest();
 if(!endpoint){status();connectionDetails();return false}
 if(!validURL(endpoint)){status(t('connectError'));toast(t('connectError'));return false}
 const source=endpoint,seq=++requestSequence,controller=new AbortController();
 activeRequest=controller;loading=true;$('#refresh').disabled=true;status(t('loading'));
 try{
  const fresh=await jsonp(source,controller.signal);
  if(seq!==requestSequence||source!==endpoint)return false;
  if(!validData(fresh))throw Error(fresh?.error||t('formatError'));
  data={...fresh,fetchedAt:new Date().toISOString()};mode='live';
  store.set('cache',{endpoint:source,data});render();status();connectionDetails();return true;
 }catch(e){
  if(e.name==='AbortError'||seq!==requestSequence||source!==endpoint)return false;
  console.error('Lesson sync failed',e);
  const reason=e.message==='Timeout'?t('timeoutError'):e.message==='Network'?t('networkError'):e.message;
  const cache=store.get('cache',null);
  if(cache?.endpoint===source&&validData(cache.data)){data=cache.data;mode='cache'}
  else{data=null;mode=''}
  render();status(t('failed')+' '+reason+(data?' '+t('cached')+' · '+new Date(data.fetchedAt).toLocaleString():''));
  $('#maintenanceResult').textContent=reason;toast(reason);return false;
 }finally{
  if(seq===requestSequence){loading=false;activeRequest=null;$('#refresh').disabled=false}
 }
}
async function demo(){cancelRequest();const seq=requestSequence;try{const response=await fetch('./demo.json');if(!response.ok)throw Error();const d=await response.json();if(seq!==requestSequence)return;if(!validData(d))throw Error();data={...d,fetchedAt:new Date().toISOString()};mode='demo';selected='';render();status()}catch{toast(t('failed'))}}
function connectionDetails(){
 const saved=store.get('endpoint','');
 $('#connectionDetail').textContent='English Bloom '+APP_VERSION+' · '+
  (endpoint?(saved?t('sourceSaved'):t('sourceDefault')):t('sourceUnset'))+
  (endpoint?'\n'+endpoint:'');
}
function openSource(){if($('#settings').open)$('#settings').close();$('#endpoint').value=endpoint;$('#source').showModal()}
function maintenanceMessage(message){$('#maintenanceResult').textContent=message;toast(message)}
function setMaintenanceBusy(value){maintenanceBusy=value;document.querySelectorAll('[data-maintenance]').forEach(b=>b.disabled=value);$('#confirmClear').disabled=value;}
async function performMaintenance(fn){
 if(maintenanceBusy)return;setMaintenanceBusy(true);$('#maintenanceResult').textContent=t('waiting');
 try{await fn()}catch(e){console.error('Local maintenance failed',e);maintenanceMessage(t('cleanupFailed'))}
 finally{setMaintenanceBusy(false);connectionDetails()}
}
function exportRecords(){
 const backup={app:'English Bloom',version:APP_VERSION,exportedAt:new Date().toISOString(),
  endpoint,settings:store.get('settings',settings),progress:store.get('progress',progress),notes:store.get('notes',notes)};
 const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download='English_Bloom_Records_'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 maintenanceMessage(t('exported'));
}
function isOwnResource(url){try{const u=new URL(url);return u.origin===appScope.origin&&u.pathname.startsWith(appScope.pathname)}catch{return false}}
async function clearOwnInterfaceCaches(){
 if(!('caches'in window))return;
 for(const name of await caches.keys()){
  if(!/^english-bloom(?:-|:)/.test(name))continue;
  const cache=await caches.open(name);
  for(const request of await cache.keys())if(isOwnResource(request.url))await cache.delete(request);
  if((await cache.keys()).length===0)await caches.delete(name);
 }
}
async function unregisterOwnWorker(){
 if(!('serviceWorker'in navigator))return;
 const registrations=await navigator.serviceWorker.getRegistrations();
 for(const reg of registrations)if(reg.scope===appScope.href)await reg.unregister();
}
async function resetSource(){
 cancelRequest();store.remove('endpoint');store.remove('cache');
 endpoint=window.APP_CONFIG.endpoint||'';data=null;mode='';selected='';render();status();connectionDetails();
 if(!endpoint){maintenanceMessage(t('resetNeedsURL'));openSource();return}
 maintenanceMessage(t('sourceReset')+' '+t('restored'));
 const ok=await refresh({force:true});if(ok)maintenanceMessage(t('sourceReset')+' '+t('connectionOK'));
}
async function updateWebsite(){
 if(!navigator.onLine){maintenanceMessage(t('offlineUpdate'));return}
 // 先確認可讀取網站檔案，避免離線時主動移除可用快取。
 const probe=new URL('index.html',appScope);probe.searchParams.set('bloom_probe',Date.now());
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{const response=await fetch(probe.href,{cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('Unavailable');
 }catch{maintenanceMessage(t('updateFailed'));return}finally{clearTimeout(timer)}
 cancelRequest();await unregisterOwnWorker();await clearOwnInterfaceCaches();
 const destination=new URL(location.href);destination.searchParams.set('bloom_update',Date.now());
 location.replace(destination.href);
}
async function clearAllLocal(){
 cancelRequest();
 for(const name of ['settings','endpoint','cache','notes','progress'])store.remove(name);
 // 只清理本應用程式的Session命名空間，不影響同網域其他服務。
 try{for(let i=sessionStorage.length-1;i>=0;i--){const k=sessionStorage.key(i);if(k?.startsWith('bloom:'))sessionStorage.removeItem(k)}}catch{}
 settings={...defaults};notes={};progress={};
 endpoint=window.APP_CONFIG.endpoint||'';data=null;mode='';selected='';
 $('#search').value='';$('#month').value='';$('#filter').value='all';$('#sort').value='new';
 $('#resetConfirm').close();apply();
 let cacheFailed=false;
 try{await clearOwnInterfaceCaches()}catch(e){console.error(e);cacheFailed=true}
 maintenanceMessage(t('cleared')+(cacheFailed?' '+t('cachePartial'):''));
 // 不自動讀表，確保使用者可看見清除結果；手動按重新連線即可。
}
$('#reconnect').onclick=()=>performMaintenance(async()=>{
 if(!endpoint){openSource();maintenanceMessage(t('notConnected'));return}
 if(await refresh({force:true}))maintenanceMessage(t('connectionOK'));
});
$('#resetSource').onclick=()=>performMaintenance(resetSource);
$('#updateSite').onclick=()=>performMaintenance(updateWebsite);
$('#exportRecords').onclick=exportRecords;
$('#exportBeforeClear').onclick=exportRecords;
$('#clearAll').onclick=()=>{if(!maintenanceBusy)$('#resetConfirm').showModal()};
$('#confirmClear').onclick=()=>performMaintenance(clearAllLocal);
$('#settingsOpen').onclick=()=>{$('#settings').showModal();sound()};$('#connect').onclick=openSource;$('#saveSource').onclick=()=>{const s=$('#endpoint').value.trim();if(!validURL(s)){toast(t('connectError'));return}cancelRequest();endpoint=s;store.set('endpoint',s);data=null;selected='';mode='';$('#source').close();connectionDetails();refresh()};$('#refresh').onclick=()=>{sound();if(endpoint)refresh();else $('#connect').click()};$('#latest').onclick=()=>{const last=sorted().at(-1);if(last){selected=last.id;render();$('#reader').focus();sound()}else if(!endpoint)$('#connect').click();else refresh()};$('#demo').onclick=demo;$('#print').onclick=()=>window.print();['search','month','filter','sort'].forEach(id=>$('#'+id).addEventListener(id==='search'?'input':'change',render));Object.keys(defaults).forEach(k=>$('#'+k).onchange=e=>{settings[k]=e.target.value;store.set('settings',settings);apply();sound()});$('#fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else toast(t('unsupported'))}catch{toast(t('unsupported'))}};document.addEventListener('fullscreenchange',()=>$('#fullscreen').textContent=t(document.fullscreenElement?'on':'off'));matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>apply());window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvent=e;$('#install').hidden=false});$('#install').onclick=async()=>{if(installEvent){await installEvent.prompt();installEvent=null;$('#install').hidden=true}else toast(t('installHint'))};window.addEventListener('appinstalled',()=>{$('#install').hidden=true;installEvent=null});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&endpoint)refresh()});window.addEventListener('online',()=>{if(endpoint)refresh()});setInterval(()=>{if(!document.hidden&&endpoint)refresh()},Math.max(1,Number(window.APP_CONFIG.refreshMinutes)||5)*60000);
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
apply();if(endpoint){if(!validURL(endpoint)){toast(t('connectError'))}else{const c=store.get('cache',null);if(c?.endpoint===endpoint&&validData(c.data)){data=c.data;mode='cache';render();status()}refresh()}}
})();