/** SVS Health Dashboard. Deploy as owner. All data access is authorized here. */
const REGIONS = ['ภาคเหนือ','ภาคกลาง','ภาคตะวันออก','ภาคตะวันตก','ภาคใต้','ภาคอีสาน(บน)','ภาคอีสาน(ล่าง)'];
const LAYERS = ['CPF-Farm','Contact-Farm','Customer-Farm'];
const UNITS = ['Isolation','Replacement','Mating-Gestation','Farrowing','Wean-Finish','GDU','Holding','Boar'];
const CATEGORIES = ['Farm Biosecurity','Farm Management','Health Management','Other'];
const SAMPLES = ['Water','Feed','Semen','S.Swab: Vehicle','S.Swab: Housing'];
const PRRS = ['Unstable','Stable Active','Stable Inactive','FreePRRS'];
const REASONS = ['บันทึกข้อมูลผิด','รายการซ้ำ','เลือกฟาร์มผิด','เลือกโรคผิด','เลือกวันที่ผิด','แนบรูปภาพผิด','แนบเอกสารผิด','ไม่ใช่เหตุการณ์โรค','ข้อมูลไม่สมบูรณ์','สร้างเพื่อทดสอบระบบ','อื่นๆ'];
const DOCTYPES = ['รายงานเข้าเยี่ยมฟาร์ม','ผลตรวจทางห้องปฏิบัติการ','แผนผังฟาร์ม','ใบรับรอง','เอกสารระบบป้องกันโรค','โปรแกรมวัคซีน','โปรแกรมยา','โปรแกรมเก็บตัวอย่าง','เอกสารก่อสร้าง','เอกสารอื่นๆ'];
const DISEASES = ['ASF','CSF','FMD','PRRS','PED','TGE','PCV2','SIV','AD','PPV','Rotavirus','M. hyo','APP',"Glässer's",'S. suis','Colibacillosis','Salmonellosis','Swine dysentery','Ileitis(PPE)','Clostridial enteritis','Erysipelas','Leptospirosis','AR','Coccidiosis','Ascariosis','Trichuriasis','Strongyloidiasis','Mange','Lice'];
const SCHEMA = {
 Users:['id','email','name','role','status','googleSub'],
 Farms:['id','name','region','layer','capacity','level','lat','lng','address','construction','revision'],
 Assignments:['id','farmId','userId','startAt','endAt'],
 Records:['id','farmId','type','status','createdBy','createdAt','updatedBy','updatedAt','revision','data'],
 Files:['id','farmId','recordId','owner','name','mime','size','driveId','createdAt'],
 Audit:['id','at','actor','entity','entityId','before','after','reason'],
 Backups:['id','at','status','fileId','detail']
};
let TABLE_CACHE = {};
function prop(k, fallback) { return PropertiesService.getScriptProperties().getProperty(k) || fallback || ''; }
function uuid(){return Utilities.getUuid();}
function now(){return new Date().toISOString();}
function fail(message){throw new Error(message);}
function check(c,m){if(!c)fail(m);}
function sha(s){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s)).replace(/=+$/,'');}
function json(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}
function book(){check(prop('SPREADSHEET_ID'),'ยังไม่ได้ตั้งค่า SPREADSHEET_ID');return SpreadsheetApp.openById(prop('SPREADSHEET_ID'));}
function sheet(t){check(SCHEMA[t],'ตารางไม่ถูกต้อง');const s=book().getSheetByName(t);check(s,'กรุณารัน setupSystem ก่อน');return s;}
function rows(t){if(TABLE_CACHE[t])return TABLE_CACHE[t].map(r=>Object.assign({},r));const s=sheet(t);if(s.getLastRow()<2){TABLE_CACHE[t]=[];return [];}TABLE_CACHE[t]=s.getRange(2,1,s.getLastRow()-1,SCHEMA[t].length).getDisplayValues().map((r,i)=>Object.assign({_row:i+2},Object.fromEntries(SCHEMA[t].map((k,j)=>[k,r[j]]))));return TABLE_CACHE[t].map(r=>Object.assign({},r));}
function write(t,v){const s=sheet(t),a=SCHEMA[t].map(k=>v[k]===undefined?'':String(v[k]));const row=v._row||s.getLastRow()+1;s.getRange(row,1,1,a.length).setNumberFormat('@').setValues([a.map(x=>/^[=+\-@]/.test(x)?"'"+x:x)]);delete TABLE_CACHE[t];return v;}
function audit(u,t,id,b,a,reason){write('Audit',{id:uuid(),at:now(),actor:u.id,entity:t,entityId:id,before:JSON.stringify(b||{}).slice(0,45000),after:JSON.stringify(a||{}).slice(0,45000),reason:reason||''});}
function clean(r){const x=Object.assign({},r);delete x._row;return x;}
function masters(){return {regions:REGIONS,layers:LAYERS,units:UNITS,categories:CATEGORIES,samples:SAMPLES,prrs:PRRS,reasons:REASONS,docTypes:DOCTYPES,diseases:DISEASES};}
function dateOK(v){return /^\d{4}-\d{2}-\d{2}$/.test(v||'')&&!isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;}
function num(v){check(v!==''&&v!==null&&v!==undefined&&Number.isInteger(Number(v))&&Number(v)>=0,'จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 0');return Number(v);}
function text(v,max){check(typeof v==='string'&&v.trim()&&v.length<=(max||4000),'กรุณากรอกข้อความให้ครบและไม่ยาวเกินกำหนด');return v.trim();}
function farmAllowed(u,f){if(u.role==='Admin'||u.role==='Management')return true;return rows('Assignments').some(a=>a.userId===u.id&&a.farmId===f&&!a.endAt);}
function access(u,f,edit){check(rows('Farms').some(x=>x.id===f),'ไม่พบฟาร์ม');check(farmAllowed(u,f),'ไม่มีสิทธิ์เข้าถึงฟาร์ม');if(edit)check(['Admin','Operation'].includes(u.role),'บัญชีนี้ดูข้อมูลได้อย่างเดียว');}
function admin(u){check(u.role==='Admin','ต้องใช้สิทธิ์ Admin');}
function session(token){check(typeof token==='string'&&token.length>20,'กรุณาเข้าสู่ระบบ');const s=CacheService.getScriptCache().get('s:'+sha(token));check(s,'หมดเวลาเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');const uid=JSON.parse(s).uid,u=rows('Users').find(x=>x.id===uid);check(u&&u.status==='ACTIVE','บัญชีไม่ได้รับอนุญาต');check(['Admin','Management','Operation'].includes(u.role),'Role ไม่ถูกต้อง');return u;}
/** OAuth redirect flow: state + browser-held verifier bind the one-time ticket. */
function doGet(e){TABLE_CACHE={};try{
 const p=e.parameter||{};
 if(p.action==='login'){
  check(/^[A-Za-z0-9_-]{43}$/.test(p.challenge||''),'Challenge ไม่ถูกต้อง');
  const state=uuid()+uuid();CacheService.getScriptCache().put('o:'+state,JSON.stringify({challenge:p.challenge}),600);
  const url='https://accounts.google.com/o/oauth2/v2/auth?'+Object.entries({client_id:prop('GOOGLE_CLIENT_ID'),redirect_uri:prop('WEB_APP_URL'),response_type:'code',scope:'openid email profile',state:state,prompt:'select_account'}).map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
  return linkPage(url,'เข้าสู่ระบบด้วย Google');
 }
 if(p.state){
  const cache=CacheService.getScriptCache(),lock=LockService.getScriptLock();lock.waitLock(15000);let context;
  try{context=cache.get('o:'+p.state);cache.remove('o:'+p.state);}finally{lock.releaseLock();}
  check(context&&!p.error&&p.code,'การเข้าสู่ระบบหมดอายุหรือถูกยกเลิก');
  const res=UrlFetchApp.fetch('https://oauth2.googleapis.com/token',{method:'post',payload:{code:p.code,client_id:prop('GOOGLE_CLIENT_ID'),client_secret:prop('GOOGLE_CLIENT_SECRET'),redirect_uri:prop('WEB_APP_URL'),grant_type:'authorization_code'},muteHttpExceptions:true});
  check(res.getResponseCode()===200,'Google ไม่สามารถยืนยันการเข้าสู่ระบบ กรุณาตรวจ OAuth redirect URI');
  const token=JSON.parse(res.getContentText()).access_token;
  const ur=UrlFetchApp.fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+token},muteHttpExceptions:true});
  check(ur.getResponseCode()===200,'ไม่สามารถอ่านบัญชี Google');const info=JSON.parse(ur.getContentText());
  check(info.email_verified===true&&info.sub,'Google ยังไม่ยืนยันอีเมล');
  const ticket=uuid()+uuid();cache.put('t:'+sha(ticket),JSON.stringify({challenge:JSON.parse(context).challenge,email:String(info.email).toLowerCase(),sub:info.sub}),300);
  return linkPage(prop('FRONTEND_URL').replace(/#.*$/,'')+'#auth='+encodeURIComponent(ticket),'กลับเข้าสู่ SVS Health Dashboard');
 }
 return linkPage(prop('FRONTEND_URL'),'เปิด SVS Health Dashboard');
 }catch(err){return HtmlService.createHtmlOutput('<h2>เข้าสู่ระบบไม่สำเร็จ</h2><p>'+escapeHTML(err.message)+'</p>');}}
function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function linkPage(url,label){check(/^https:\/\//.test(url),'URL ต้องใช้ HTTPS');return HtmlService.createHtmlOutput('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font:18px Tahoma;padding:60px;text-align:center;color:#123d43}a{display:inline-block;padding:18px 28px;background:#176b67;color:white;border-radius:10px;text-decoration:none}</style><h2>SVS Health Dashboard</h2><a target="_top" href="'+escapeHTML(url)+'">'+escapeHTML(label)+'</a>');}
function exchange(p){const c=CacheService.getScriptCache(),key='t:'+sha(p.ticket||''),raw=c.get(key);check(raw,'ลิงก์เข้าสู่ระบบหมดอายุ');const t=JSON.parse(raw);check(sha(p.verifier||'')===t.challenge,'การยืนยันเบราว์เซอร์ไม่ตรงกัน');c.remove(key);
 const u=rows('Users').find(x=>x.email.toLowerCase()===t.email);check(u&&u.status==='ACTIVE','อีเมลนี้ยังไม่ได้รับอนุญาต');check(!u.googleSub||u.googleSub===t.sub,'บัญชี Google ไม่ตรงกับผู้ใช้เดิม');
 if(!u.googleSub){u.googleSub=t.sub;write('Users',u);}const token=uuid()+uuid();const seconds=Math.min(21600,Math.max(600,Number(prop('SESSION_SECONDS','3600'))));c.put('s:'+sha(token),JSON.stringify({uid:u.id}),seconds);return {token:token,user:clean(u),expiresAt:Date.now()+seconds*1000};}
function doPost(e){TABLE_CACHE={};const lock=LockService.getScriptLock();try{check(e.postData.contents.length<30000000,'คำขอใหญ่เกินกำหนด');const p=JSON.parse(e.postData.contents||'{}');lock.waitLock(25000);
 if(p.action==='exchange')return json({ok:true,data:exchange(p)});
 const u=session(p.token);let result;
 switch(p.action){
 case 'bootstrap':result={user:clean(u),masters:masters(),farms:rows('Farms').filter(f=>farmAllowed(u,f.id)).map(clean),records:readRecords(u),settings:{newDiseaseDays:7,visitDays:Number(prop('VISIT_DAYS','30')),newDiseaseBasis:prop('NEW_DISEASE_BASIS','detectedAt'),pdfMaxMB:Number(prop('PDF_MAX_MB','20'))}};break;
 case 'saveFarm':result=saveFarm(u,p);break;
 case 'saveRecord':result=saveRecord(u,p);break;
 case 'cancelRecord':result=cancelRecord(u,p);break;
 case 'fileUpload':result=upload(u,p);break;
 case 'fileRead':result=readFile(u,p);break;
 case 'adminData':admin(u);result={users:rows('Users').map(clean),assignments:rows('Assignments').map(clean)};break;
 case 'saveUser':result=saveUser(u,p);break;
 case 'assign':result=assign(u,p);break;
 case 'audit':admin(u);result=rows('Audit').slice(-200).reverse().map(clean);break;
 case 'logout':CacheService.getScriptCache().remove('s:'+sha(p.token));result=true;break;
 default:fail('ไม่พบคำสั่ง');
 }return json({ok:true,data:result});
 }catch(err){return json({ok:false,error:err.message||'เกิดข้อผิดพลาด'});}finally{if(lock.hasLock())lock.releaseLock();}}
function readRecords(u){return rows('Records').filter(r=>farmAllowed(u,r.farmId)&&(r.status!=='DRAFT'||r.createdBy===u.id)).map(r=>Object.assign(clean(r),{data:JSON.parse(r.data)}));}
function saveFarm(u,p){const d=p.data||{},old=rows('Farms').find(x=>x.id===d.id);if(old){access(u,old.id,true);check(String(p.revision)===old.revision,'ข้อมูลถูกแก้ไขแล้ว กรุณารีเฟรช');}else{admin(u);check(!d.id,'ไม่พบฟาร์ม');}check(REGIONS.includes(d.region)&&LAYERS.includes(d.layer),'ภาคหรือประเภทฟาร์มไม่ถูกต้อง');check(['GGP','GP','PS'].includes(d.level),'ระดับการผลิตไม่ถูกต้อง');
 if(d.lat)check(Number(d.lat)>=-90&&Number(d.lat)<=90,'Latitude ไม่ถูกต้อง');if(d.lng)check(Number(d.lng)>=-180&&Number(d.lng)<=180,'Longitude ไม่ถูกต้อง');
 const f={id:old?old.id:uuid(),name:text(d.name,150),region:d.region,layer:d.layer,capacity:num(d.capacity),level:d.level,lat:d.lat||'',lng:d.lng||'',address:String(d.address||'').slice(0,3000),construction:d.construction?'true':'false',revision:old?Number(old.revision)+1:1};if(old)f._row=old._row;audit(u,'Farms',f.id,old,f,'บันทึกข้อมูลฟาร์ม');write('Farms',f);return clean(f);}
function saveRecord(u,p){const d=p.data||{},type=p.type;access(u,p.farmId,true);check(['visit','event','prrs','lab','document'].includes(type),'ประเภทข้อมูลไม่ถูกต้อง');
 const old=p.id?rows('Records').find(x=>x.id===p.id):null;if(p.id)check(old,'ไม่พบรายการ');if(old){check(old.farmId===p.farmId&&old.type===type,'เปลี่ยนฟาร์มหรือชนิดรายการไม่ได้');check(old.status!=='CANCELLED','รายการถูกยกเลิกแล้ว');check(old.status!=='DRAFT'||old.createdBy===u.id,'แบบร่างเป็นของผู้สร้างเท่านั้น');check(String(p.revision)===old.revision,'ข้อมูลถูกแก้ไขโดยผู้อื่น กรุณารีเฟรช');}
 const status=p.status==='DRAFT'?'DRAFT':'ACTIVE';check(type==='visit'||status==='ACTIVE','เฉพาะ Visit ที่บันทึกร่างได้');if(old&&old.status==='ACTIVE')check(status==='ACTIVE','รายการสมบูรณ์เปลี่ยนกลับเป็นร่างไม่ได้');
 let data;
 if(type==='event'){
  check(dateOK(d.detectedAt),'วันที่ตรวจพบไม่ถูกต้อง');check(UNITS.includes(d.unit),'ยูนิตไม่ถูกต้อง');text(d.disease,100);
  if(d.closedAt)check(dateOK(d.closedAt)&&d.closedAt>=d.detectedAt&&p.confirmClose===true,'ต้องยืนยันปิดเคสและวันที่ปิดต้องไม่ก่อนวันที่ตรวจพบ');
  const prev=old?JSON.parse(old.data):null;check(!prev||!prev.closedAt,'เคสปิดแล้ว ไม่เปิดแก้ไขในรุ่นนี้');
  data={disease:d.disease.trim(),detectedAt:d.detectedAt,unit:d.unit,affected:num(d.affected),loss:num(d.loss),closedAt:d.closedAt||'',note:String(d.note||'').slice(0,4000),closedBy:d.closedAt?u.name:'',history:prev?prev.history||[]:[]};
  data.history.push({at:now(),by:u.name,affected:data.affected,loss:data.loss,note:data.note});check(data.history.length<=150,'ประวัติเกินขนาดที่รองรับ ติดต่อ Admin');
 }else if(type==='visit'){
  check(status==='DRAFT'||dateOK(d.date),'วันที่เข้าเยี่ยมไม่ถูกต้อง');check(Array.isArray(d.issues)&&d.issues.length<=50,'ประเด็นต้องไม่เกิน 50 รายการ');if(status==='ACTIVE')check(d.issues.length,'ต้องมีคำแนะนำอย่างน้อยหนึ่งประเด็น');
  data={date:d.date||'',note:String(d.note||'').slice(0,4000),vet:old?JSON.parse(old.data).vet:u.name,issues:d.issues.map(i=>{check(CATEGORIES.includes(i.category),'หมวดคำแนะนำไม่ถูกต้อง');check(['','สำคัญ','เร่งด่วน'].includes(i.priority||''),'Priority ไม่ถูกต้อง');if(status==='ACTIVE'){text(i.finding);text(i.advice);}const images=i.images||[];check(Array.isArray(images)&&images.length<=2,'สูงสุด 2 รูปต่อประเด็น');return {id:i.id||uuid(),category:i.category,finding:String(i.finding||'').slice(0,4000),advice:String(i.advice||'').slice(0,4000),priority:i.priority||'',images:images};})};
 }else if(type==='prrs'){check(PRRS.includes(d.state)&&dateOK(d.date),'สถานะหรือวันที่ไม่ถูกต้อง');data={state:d.state,date:d.date,note:String(d.note||'').slice(0,4000),by:u.name};
 }else if(type==='lab'){check(SAMPLES.includes(d.sample)&&['Pass','NotPass'].includes(d.result)&&dateOK(d.date),'ผลตรวจไม่ถูกต้อง');data={sample:d.sample,result:d.result,date:d.date,note:String(d.note||'').slice(0,4000),by:u.name};
 }else{check(DOCTYPES.includes(d.docType)&&dateOK(d.date),'ประเภทเอกสารหรือวันที่ไม่ถูกต้อง');check(Array.isArray(d.files)&&d.files.length>0&&d.files.length<=2,'แนบ PDF 1–2 ฉบับ');data={title:text(d.title,200),docType:d.docType,date:d.date,files:d.files,note:String(d.note||'').slice(0,4000)};}
 const recordId=old?old.id:(p.newId||uuid());check(/^[a-f0-9-]{36}$/i.test(recordId),'รหัสรายการไม่ถูกต้อง');check(!(!old&&rows('Records').some(r=>r.id===recordId)),'รายการนี้ถูกบันทึกแล้ว กรุณารีเฟรช');
 const refs=type==='visit'?data.issues.flatMap(i=>i.images):type==='document'?data.files:[];const files=rows('Files');refs.forEach(id=>{const f=files.find(x=>x.id===id);check(f&&f.farmId===p.farmId&&f.recordId===recordId,'ไฟล์ไม่ตรงกับรายการ');check(type==='visit'?['image/jpeg','image/png'].includes(f.mime):f.mime==='application/pdf','ชนิดไฟล์ไม่ถูกต้อง');});
 const serialized=JSON.stringify(data);check(serialized.length<=40000,'ข้อมูลมากเกินหนึ่งรายการ กรุณาแยกรายงาน');
 const r={id:recordId,farmId:p.farmId,type:type,status:status,createdBy:old?old.createdBy:u.id,createdAt:old?old.createdAt:now(),updatedBy:u.id,updatedAt:now(),revision:old?Number(old.revision)+1:1,data:serialized};if(old)r._row=old._row;audit(u,'Records',r.id,old,r,'บันทึก '+type);write('Records',r);return Object.assign(clean(r),{data:data});}
function cancelRecord(u,p){const r=rows('Records').find(x=>x.id===p.id);check(r,'ไม่พบรายการ');access(u,r.farmId,true);check(r.status!=='DRAFT'||r.createdBy===u.id,'ไม่มีสิทธิ์แบบร่าง');check(String(p.revision)===r.revision,'ข้อมูลเปลี่ยนแล้ว กรุณารีเฟรช');check(REASONS.includes(p.reason),'เลือกเหตุผลยกเลิก');if(p.reason==='อื่นๆ')text(p.note);const old=Object.assign({},r);r.status='CANCELLED';r.revision=Number(r.revision)+1;r.updatedAt=now();r.updatedBy=u.id;const d=JSON.parse(r.data);d.cancellation={reason:p.reason,note:String(p.note||'').slice(0,4000),by:u.name,at:now()};r.data=JSON.stringify(d);audit(u,'Records',r.id,old,r,p.reason);write('Records',r);return true;}
function upload(u,p){access(u,p.farmId,true);check(/^[a-f0-9-]{36}$/i.test(p.recordId||''),'รหัสรายการไม่ถูกต้อง');const rec=rows('Records').find(r=>r.id===p.recordId);if(rec){check(rec.farmId===p.farmId,'ฟาร์มไม่ตรงกัน');check(rec.status!=='CANCELLED'&&(rec.status!=='DRAFT'||rec.createdBy===u.id),'ไม่มีสิทธิ์แนบไฟล์');}
 check(['image/jpeg','image/png','application/pdf'].includes(p.mime),'รองรับ JPG PNG PDF เท่านั้น');const bytes=Utilities.base64Decode(p.base64||'');const limit=p.mime==='application/pdf'?Number(prop('PDF_MAX_MB','20')):10;check(bytes.length>0&&bytes.length<=limit*1024*1024,'ไฟล์ใหญ่เกิน '+limit+' MB');const u8=bytes.slice(0,8).map(v=>(v+256)%256);check(p.mime==='image/jpeg'?u8[0]===255&&u8[1]===216:p.mime==='image/png'?u8.join(',').startsWith('137,80,78,71,13,10,26,10'):u8.slice(0,5).join(',')==='37,80,68,70,45','เนื้อหาไฟล์ไม่ตรงชนิด');
 const existing=rows('Files').find(f=>f.id===p.fileId);if(existing){check(existing.owner===u.id&&existing.farmId===p.farmId&&existing.recordId===p.recordId,'รหัสไฟล์ซ้ำ');return clean(existing);}
 const folder=DriveApp.getFolderById(prop('DRIVE_FOLDER_ID'));const name=text(p.name,180);const f=folder.createFile(Utilities.newBlob(bytes,p.mime,name));const row={id:p.fileId||uuid(),farmId:p.farmId,recordId:p.recordId,owner:u.id,name:name,mime:p.mime,size:bytes.length,driveId:f.getId(),createdAt:now()};write('Files',row);audit(u,'Files',row.id,null,{name:name,recordId:p.recordId},'แนบไฟล์');return clean(row);}
function readFile(u,p){const f=rows('Files').find(x=>x.id===p.id);check(f,'ไม่พบไฟล์');access(u,f.farmId,false);const r=rows('Records').find(x=>x.id===f.recordId);check(r?(r.status!=='DRAFT'||r.createdBy===u.id):f.owner===u.id,'ไม่มีสิทธิ์อ่านไฟล์');const blob=DriveApp.getFileById(f.driveId).getBlob();return {name:f.name,mime:f.mime,base64:Utilities.base64Encode(blob.getBytes())};}
function saveUser(u,p){admin(u);const d=p.data||{},all=rows('Users'),old=all.find(x=>x.id===d.id);check(['Admin','Management','Operation'].includes(d.role)&&['ACTIVE','INACTIVE'].includes(d.status),'Role หรือสถานะไม่ถูกต้อง');const email=String(d.email||'').trim().toLowerCase();check(!email||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'อีเมลไม่ถูกต้อง');check(!email||!all.some(x=>x.email.toLowerCase()===email&&x.id!==d.id),'อีเมลซ้ำ');
 if(d.role==='Admin'&&d.status==='ACTIVE')check(email,'Admin ที่ ACTIVE ต้องมีอีเมล');
 if(old&&old.role==='Admin'&&old.status==='ACTIVE'&&(d.role!=='Admin'||d.status!=='ACTIVE'))check(all.some(x=>x.id!==old.id&&x.role==='Admin'&&x.status==='ACTIVE'&&x.email),'ต้องเหลือ Admin ที่ใช้งานได้อย่างน้อยหนึ่งคน');
 const r={id:old?old.id:uuid(),email:email,name:text(d.name,150),role:d.role,status:d.status,googleSub:old&&old.email.toLowerCase()===email?old.googleSub:''};if(old)r._row=old._row;audit(u,'Users',r.id,old,r,'แก้ไขผู้ใช้');write('Users',r);
 if(r.status==='INACTIVE')rows('Assignments').filter(a=>a.userId===r.id&&!a.endAt).forEach(a=>{const b=Object.assign({},a);a.endAt=now();audit(u,'Assignments',a.id,b,a,'สิ้นสุดสิทธิ์เนื่องจาก INACTIVE');write('Assignments',a);});return clean(r);}
function assign(u,p){admin(u);check(rows('Farms').some(f=>f.id===p.farmId),'ไม่พบฟาร์ม');if(p.endId){const a=rows('Assignments').find(x=>x.id===p.endId&&x.farmId===p.farmId);check(a,'ไม่พบการมอบหมาย');const b=Object.assign({},a);a.endAt=now();audit(u,'Assignments',a.id,b,a,'สิ้นสุดการมอบหมาย');write('Assignments',a);return true;}check(rows('Users').some(x=>x.id===p.userId&&x.role==='Operation'&&x.status==='ACTIVE'),'เลือก Operation ที่ ACTIVE');check(!rows('Assignments').some(x=>x.userId===p.userId&&x.farmId===p.farmId&&!x.endAt),'มอบหมายอยู่แล้ว');const a={id:uuid(),farmId:p.farmId,userId:p.userId,startAt:now(),endAt:''};audit(u,'Assignments',a.id,null,a,'มอบหมายฟาร์ม');write('Assignments',a);return true;}
/** Run once from Apps Script editor after setting properties. No sample records. */
function setupSystem(){const b=book();b.setSpreadsheetTimeZone('Asia/Bangkok');Object.entries(SCHEMA).forEach(([n,h])=>{let s=b.getSheetByName(n);if(!s){s=b.insertSheet(n);s.getRange(1,1,1,h.length).setValues([h]).setFontWeight('bold');s.setFrozenRows(1);}else check(s.getRange(1,1,1,h.length).getDisplayValues()[0].join('|')===h.join('|'),'หัวตาราง '+n+' ไม่ตรง ห้ามเขียนทับ');});
 const email=prop('ADMIN_EMAIL').trim().toLowerCase();check(email,'ตั้งค่า ADMIN_EMAIL');if(!rows('Users').length)write('Users',{id:uuid(),email:email,name:prop('ADMIN_NAME','ผู้ดูแลระบบ'),role:'Admin',status:'ACTIVE',googleSub:''});
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='dailyBackup'))ScriptApp.newTrigger('dailyBackup').timeBased().everyDays(1).atHour(2).inTimezone('Asia/Bangkok').create();
}
function dailyBackup(){const lock=LockService.getScriptLock();lock.waitLock(25000);try{const root=DriveApp.getFolderById(prop('BACKUP_FOLDER_ID'));const file=DriveApp.getFileById(prop('SPREADSHEET_ID')).makeCopy('SVS-'+Utilities.formatDate(new Date(),'Asia/Bangkok','yyyy-MM-dd-HHmmss'),root);write('Backups',{id:uuid(),at:now(),status:'SUCCESS',fileId:file.getId(),detail:'Spreadsheet copy; ไฟล์แนบต้นฉบับเก็บไม่มีกำหนด'});purgeExpiredDrafts();}catch(e){write('Backups',{id:uuid(),at:now(),status:'FAILED',detail:e.message});throw e;}finally{lock.releaseLock();}}
function purgeExpiredDrafts(){const basis=prop('DRAFT_RETENTION_BASIS','updatedAt');check(['createdAt','updatedAt'].includes(basis),'DRAFT_RETENTION_BASIS ไม่ถูกต้อง');rows('Records').filter(r=>r.status==='DRAFT'&&Date.now()-Date.parse(r[basis])>30*86400000).sort((a,b)=>b._row-a._row).forEach(r=>{audit({id:'SYSTEM'},'DraftPurge',r.id,{id:r.id,createdBy:r.createdBy},null,'หมดอายุ 30 วัน; มีสำเนาใน Backup แล้ว');sheet('Records').deleteRow(r._row);});}
