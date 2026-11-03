/** SVS063. Authenticated, shared overseas histories; private attachments. */
const OS063={journal:'OverseasSupport001',headers:['requestId','recordId','actorId','requestHash','baseRevision','revision','previousHash','recordHash','recordJson','at','state'],files:'OverseasSupportFiles001',fileHeaders:['id','recordId','ownerId','uploadRequestId','requestHash','name','mime','bytes','driveId','previewDriveId','reportDriveId','at','state'],maxBytes:20*1024*1024};
function osHash063_(value){const digest=Array.isArray(value)?Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value):Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(value),Utilities.Charset.UTF_8);return digest.map(b=>((b+256)%256).toString(16).padStart(2,'0')).join('');}
function osTable063_(name,headers,create){
 let s=book().getSheetByName(name);if(!s&&!create)return null;
 if(!s)s=book().insertSheet(name);
 if(!s.getLastRow()){if(!create)return s;s.getRange(1,1,1,headers.length).setValues([headers]);s.setFrozenRows(1);}
 else check(JSON.stringify(s.getRange(1,1,1,headers.length).getDisplayValues()[0])===JSON.stringify(headers),'โครงสร้างตารางสนับสนุนต่างประเทศไม่ตรง');
 return s;
}
function osRows063_(name,headers){const s=osTable063_(name,headers,false);return !s||s.getLastRow()<2?[]:s.getRange(2,1,s.getLastRow()-1,headers.length).getDisplayValues().map((a,i)=>Object.assign({_row:i+2},Object.fromEntries(headers.map((k,j)=>[k,a[j]])))).filter(r=>r[headers[0]]);}
function osWrite063_(name,headers,value,row){const s=osTable063_(name,headers,true),at=row||s.getLastRow()+1;s.getRange(at,1,1,headers.length).setNumberFormat('@').setValues([headers.map(k=>String(value[k]??'')).map(v=>/^[=+\-@]/.test(v)?"'"+v:v)]);SpreadsheetApp.flush();return at;}
function osEffective063_(){
 const map=new Map();for(const row of osRows063_(OS063.journal,OS063.headers).filter(r=>r.state==='COMMITTED')){
  const prior=map.get(row.recordId),record=JSON.parse(row.recordJson);
  check(record.id===row.recordId&&record.revision===Number(row.revision)&&Number(row.baseRevision)===(prior?prior.revision:0)&&record.revision===(prior?prior.revision+1:1)&&row.previousHash===(prior?osHash063_(prior):'')&&osHash063_(record)===row.recordHash,'ประวัติสนับสนุนต่างประเทศเสียหาย กรุณาแจ้ง Admin');map.set(record.id,record);
 }return [...map.values()];
}
function osCanEdit063_(actor,record){return actor.role==='Admin'||record.participants.some(p=>p.id===actor.id);}
function osFilePublic063_(f){return {id:f.id,recordId:f.recordId,name:f.name,mime:f.mime,bytes:Number(f.bytes)};}
function osAuditOnce063_(actor,entity,id,before,after,reason){if(!rows('Audit').some(a=>a.entity===entity&&a.entityId===id))audit(actor,entity,id,before,after,reason);}
function osCommit063_(actor,row,before){
 check(row.recordHash===osHash063_(JSON.parse(row.recordJson)),'ข้อมูลคำขอไม่สมบูรณ์');
 osAuditOnce063_(actor,'OverseasSupport001',row.requestId,before,JSON.parse(row.recordJson),'บันทึกประวัติสนับสนุนต่างประเทศ');
 row.state='COMMITTED';osWrite063_(OS063.journal,OS063.headers,row,row._row);
 return {record:JSON.parse(row.recordJson),alreadySaved:false};
}
function osInput063_(actor,p,old,files){
 const d=p.data||{},creatorId=old?old.createdBy:actor.id,users=rows('Users');
 check(typeof d.country==='string'&&d.country.trim()&&d.country.length<=100,'กรุณาระบุประเทศ (ไม่เกิน 100 ตัวอักษร)');
 check(dateOK(d.date),'กรุณาระบุวันที่เดินทางให้ถูกต้อง');
 check(typeof d.days==='number'&&Number.isFinite(d.days)&&d.days>0&&d.days<=3650&&Number.isInteger(d.days*2),'จำนวนวันต้องมากกว่า 0 ไม่เกิน 3650 วัน ระบุครึ่งวันได้');
 check(typeof d.summary==='string'&&d.summary.trim()&&d.summary.length<=10000,'กรุณาสรุปงาน (ไม่เกิน 10000 ตัวอักษร)');
 check(Array.isArray(d.participantIds)&&d.participantIds.length<=100&&d.participantIds.every(id=>typeof id==='string'),'รายชื่อผู้ร่วมเดินทางไม่ถูกต้อง');
 const ids=[creatorId,...new Set(d.participantIds.filter(id=>id!==creatorId))];
 const participants=ids.map(id=>{const member=users.find(u=>u.id===id&&u.status==='ACTIVE'),previous=old&&old.participants.find(u=>u.id===id);check(member||previous,'สมาชิกที่เลือกไม่มีบัญชีใช้งานแล้ว');return {id,name:member?member.name:previous.name};});
 const photoIds=d.photoIds||[];check(Array.isArray(photoIds)&&photoIds.length<=4&&new Set(photoIds).size===photoIds.length,'แนบรูปภาพได้สูงสุด 4 รูป');
 const pdfId=d.pdfId||null;check(pdfId===null||typeof pdfId==='string','ไฟล์ PDF ไม่ถูกต้อง');
 for(const item of [...photoIds.map(id=>({id,pdf:false})),...(pdfId?[{id:pdfId,pdf:true}]:[])]){const f=files.find(f=>f.id===item.id&&f.recordId===old?.id&&f.state==='READY');check(f&&(actor.role==='Admin'||f.ownerId===actor.id||(old.photoIds||[]).includes(item.id)||old.pdfId===item.id),'ไฟล์ไม่ตรงรายการหรือไม่มีสิทธิ์แนบไฟล์');check(item.pdf?f.mime==='application/pdf':['image/jpeg','image/png','image/webp'].includes(f.mime),'ชนิดไฟล์แนบไม่ถูกต้อง');}
 return {country:d.country.trim(),date:d.date,days:d.days,summary:d.summary.trim(),participants,photoIds,pdfId};
}
function osSave063_(actor,p){
 check(typeof p.requestId==='string'&&/^OSR-[a-zA-Z0-9-]{16,80}$/.test(p.requestId),'รหัสคำขอบันทึกไม่ถูกต้อง');
 const creating=p.op==='createRecord',requestHash=osHash063_({actor:actor.id,op:p.op,id:p.recordId||'',revision:p.expectedRevision,data:p.data});
 const journal=osRows063_(OS063.journal,OS063.headers),prior=journal.find(r=>r.requestId===p.requestId),records=osEffective063_();
 if(prior){check(prior.actorId===actor.id&&prior.requestHash===requestHash,'คำขอเดิมแต่ข้อมูลเปลี่ยน กรุณาโหลดรายการใหม่');const before=records.find(r=>r.id===prior.recordId);if(prior.state==='COMMITTED')return {record:JSON.parse(prior.recordJson),alreadySaved:true};check(!before||before.revision===Number(prior.baseRevision),'รายการมีการเปลี่ยนแปลงระหว่างบันทึก');return osCommit063_(actor,prior,before);}
 const old=creating?null:records.find(r=>r.id===p.recordId);check(creating||old,'ไม่พบประวัติ');check(!old||osCanEdit063_(actor,old),'คุณแก้ไขได้เฉพาะประวัติที่มีชื่อของตนเอง');
 check(Number.isInteger(p.expectedRevision)&&p.expectedRevision===(old?old.revision:0),'รายการถูกแก้ไขแล้ว กรุณาโหลดข้อมูลล่าสุด');
 check(!old||!journal.some(r=>r.recordId===old.id&&r.state==='STAGING'),'รายการมีคำขอบันทึกค้างอยู่ กรุณาลองคำขอเดิมอีกครั้ง');
 const data=osInput063_(actor,p,old,osRows063_(OS063.files,OS063.fileHeaders)),at=now();
 const record={id:old?old.id:'OST-'+uuid(),revision:old?old.revision+1:1,createdBy:old?old.createdBy:actor.id,createdAt:old?old.createdAt:at,updatedBy:actor.id,updatedAt:at,...data};
 check(JSON.stringify(record).length<=28000,'ข้อความรวมยาวเกินกำหนด');
 const row={requestId:p.requestId,recordId:record.id,actorId:actor.id,requestHash,baseRevision:old?old.revision:0,revision:record.revision,previousHash:old?osHash063_(old):'',recordHash:osHash063_(record),recordJson:JSON.stringify(record),at,state:'STAGING'};
 row._row=osWrite063_(OS063.journal,OS063.headers,row);return osCommit063_(actor,row,old);
}
function osUpload063_(actor,p){
 const record=osEffective063_().find(r=>r.id===p.recordId);check(record&&osCanEdit063_(actor,record),'ไม่มีสิทธิ์แนบไฟล์ในรายการนี้');
 check(typeof p.uploadRequestId==='string'&&/^OSU-[a-zA-Z0-9-]{16,80}$/.test(p.uploadRequestId),'รหัสอัปโหลดไม่ถูกต้อง');
 check(typeof p.name==='string'&&p.name.trim()&&p.name.length<=200,'ชื่อไฟล์ไม่ถูกต้อง');
 const isPdf=p.mime==='application/pdf';check(isPdf||['image/jpeg','image/png','image/webp'].includes(p.mime),'รองรับ JPG, PNG, WebP และ PDF');
 let original,preview,report;
 if(isPdf){check(typeof p.original==='string'&&p.original.length<=Math.ceil(OS063.maxBytes/3)*4&&/^[A-Za-z0-9+/]+={0,2}$/.test(p.original),'ไฟล์ PDF ใหญ่เกินกำหนดหรือไม่ถูกต้อง');const bytes=Utilities.base64Decode(p.original);check(bytes.length>4&&bytes.length<=OS063.maxBytes&&String.fromCharCode(...bytes.slice(0,5).map(b=>(b+256)%256))==='%PDF-','ไฟล์ไม่ใช่ PDF');original={bytes,blob:Utilities.newBlob(bytes,'application/pdf')};}
 else{original=ksPhotoDecode003_(p.original,p.mime,OS063.maxBytes,'ต้นฉบับ');preview=ksPhotoDecode003_(p.preview,'image/jpeg',128*1024,'ตัวอย่าง');report=ksPhotoDecode003_(p.report,'image/jpeg',768*1024,'รายงาน');check(Math.max(preview.width,preview.height)<=520&&Math.max(report.width,report.height)<=1600,'รูปตัวอย่าง/รายงานใหญ่เกินกำหนด');}
 const requestHash=osHash063_({recordId:record.id,actorId:actor.id,name:p.name,mime:p.mime,original:osHash063_(original.bytes),preview:preview?osHash063_(preview.bytes):null,report:report?osHash063_(report.bytes):null}),files=osRows063_(OS063.files,OS063.fileHeaders),prior=files.find(f=>f.uploadRequestId===p.uploadRequestId);
 if(prior){check(prior.requestHash===requestHash,'คำขออัปโหลดเดิมแต่ไฟล์เปลี่ยน');if(prior.state!=='READY'){osAuditOnce063_(actor,'OverseasSupportFile001',prior.id,null,{recordId:record.id,name:prior.name,bytes:Number(prior.bytes)},'แนบไฟล์สนับสนุนต่างประเทศ');prior.state='READY';osWrite063_(OS063.files,OS063.fileHeaders,prior,prior._row);}return {file:osFilePublic063_(prior),alreadyUploaded:true};}
 check(Number.isInteger(p.expectedRevision)&&p.expectedRevision===record.revision,'รายการถูกแก้ไขแล้ว กรุณาโหลดก่อนแนบไฟล์');
 if(!isPdf){check(Array.isArray(p.selectedPhotoIds)&&p.selectedPhotoIds.length<4&&new Set(p.selectedPhotoIds).size===p.selectedPhotoIds.length,'แนบได้สูงสุด 4 รูป');for(const id of p.selectedPhotoIds)check(files.some(f=>f.id===id&&f.recordId===record.id&&f.state==='READY'&&f.mime!=='application/pdf'&&(actor.role==='Admin'||f.ownerId===actor.id||record.photoIds.includes(id))),'รูปที่เลือกไม่ตรงรายการ');}
 osTable063_(OS063.files,OS063.fileHeaders,false);const folder=DriveApp.getFolderById(prop('DRIVE_FOLDER_ID')),id='OSF-'+uuid(),made=[];let stored=false;
 try{
  const safeName=p.name.replace(/[\\/\x00-\x1f]/g,'_');made.push(folder.createFile(original.blob.setName(id+'_'+safeName)));if(!isPdf){made.push(folder.createFile(preview.blob.setName(id+'_preview.jpg')));made.push(folder.createFile(report.blob.setName(id+'_report.jpg')));}
  const file={id,recordId:record.id,ownerId:actor.id,uploadRequestId:p.uploadRequestId,requestHash,name:safeName,mime:p.mime,bytes:original.bytes.length,driveId:made[0].getId(),previewDriveId:isPdf?'':made[1].getId(),reportDriveId:isPdf?'':made[2].getId(),at:now(),state:'STAGING'};
  file._row=osWrite063_(OS063.files,OS063.fileHeaders,file);stored=true;osAuditOnce063_(actor,'OverseasSupportFile001',id,null,{recordId:record.id,name:file.name,bytes:file.bytes},'แนบไฟล์สนับสนุนต่างประเทศ');file.state='READY';osWrite063_(OS063.files,OS063.fileHeaders,file,file._row);return {file:osFilePublic063_(file),alreadyUploaded:false};
 }finally{if(!stored){let absent=false;try{absent=!osRows063_(OS063.files,OS063.fileHeaders).some(f=>f.id===id);}catch(e){}if(absent)made.forEach(f=>{try{f.setTrashed(true);}catch(e){}});}}
}
function overseasSupport063(actor,p){
 const user=rows('Users').find(u=>u.id===actor.id&&u.status==='ACTIVE');check(user&&['Admin','Operation','Management'].includes(user.role),'บัญชีไม่ได้รับอนุญาต');actor=user;
 check(p.protocol===1,'กรุณารีเฟรชหน้าเว็บเป็นรุ่นล่าสุด');
 if(p.op==='read'){
  const records=osEffective063_(),members=new Map(rows('Users').filter(u=>u.status==='ACTIVE').map(u=>[u.id,{id:u.id,name:u.name,active:true}]));for(const r of records)for(const m of r.participants)if(!members.has(m.id))members.set(m.id,{...m,active:false});
  const ids=new Set(records.flatMap(r=>[...r.photoIds,...(r.pdfId?[r.pdfId]:[])]));return {protocol:1,records,members:[...members.values()],files:osRows063_(OS063.files,OS063.fileHeaders).filter(f=>f.state==='READY'&&ids.has(f.id)).map(osFilePublic063_),access:{editableRecordIds:records.filter(r=>osCanEdit063_(actor,r)).map(r=>r.id),actorId:actor.id,actorName:actor.name}};
 }
 if(p.op==='readFile'){
  const record=osEffective063_().find(r=>r.id===p.recordId),file=osRows063_(OS063.files,OS063.fileHeaders).find(f=>f.id===p.fileId&&f.recordId===record?.id&&f.state==='READY');check(file&&(record.photoIds.includes(file.id)||record.pdfId===file.id||actor.id===file.ownerId||actor.role==='Admin'),'ไม่พบไฟล์หรือไม่มีสิทธิ์อ่าน');
  check(['original','preview','report'].includes(p.variant),'รูปแบบไฟล์ไม่ถูกต้อง');check(file.mime!=='application/pdf'||p.variant==='original','PDF ไม่มีรูปตัวอย่าง');const key=p.variant==='original'?'driveId':p.variant==='preview'?'previewDriveId':'reportDriveId',blob=DriveApp.getFileById(file[key]).getBlob(),bytes=blob.getBytes();check(bytes.length<=(p.variant==='original'?OS063.maxBytes:p.variant==='preview'?128*1024:768*1024),'ไฟล์ใหญ่เกินกำหนด');return {id:file.id,name:file.name,mime:p.variant==='original'?file.mime:'image/jpeg',base64:Utilities.base64Encode(bytes)};
 }
 check(LockService.getScriptLock().hasLock(),'ต้องบันทึกผ่าน script lock');
 if(['createRecord','updateRecord'].includes(p.op))return osSave063_(actor,p);
 if(p.op==='uploadFile')return osUpload063_(actor,p);
 fail('ไม่พบคำสั่งสนับสนุนต่างประเทศ');
}
