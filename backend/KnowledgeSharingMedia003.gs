/** Private Drive photos, independently addressed from farm Files/Records. */
const KSM003={sheet:'KnowledgeSharingPhotos003',headers:['id','recordId','ownerId','uploadRequestId','sourceHash','originalDriveId','previewDriveId','reportDriveId','mime','bytes','name','width','height','createdAt','state'],maxBytes:20*1024*1024};
function ksJpegSize003_(bytes){
 const b=i=>(bytes[i]+256)%256;check(b(0)===255&&b(1)===216,'ไฟล์ไม่ใช่ JPEG');let i=2;
 while(i+3<bytes.length){check(b(i)===255,'ไฟล์ JPEG ไม่ถูกต้อง');while(b(i)===255)i++;const marker=b(i++);if(marker===217||marker===218)break;if(marker===1||marker>=208&&marker<=215)continue;const len=b(i)*256+b(i+1);check(len>=2&&i+len<=bytes.length,'ไฟล์ JPEG ไม่ถูกต้อง');if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){check(len>=8,'ไฟล์ JPEG ไม่ถูกต้อง');return {width:b(i+5)*256+b(i+6),height:b(i+3)*256+b(i+4)};}i+=len;}fail('อ่านขนาด JPEG ไม่ได้');
}
function ksPhotoRows003_(){
 const s=ksSheet001(KSM003.sheet,KSM003.headers,true);return !s||s.getLastRow()<2?[]:s.getRange(2,1,s.getLastRow()-1,KSM003.headers.length).getDisplayValues().map((v,i)=>Object.assign({_row:i+2},Object.fromEntries(KSM003.headers.map((k,j)=>[k,v[j]])))).filter(p=>p.id);
}
function ksPhotoPublic003_(p){return {id:p.id,recordId:p.recordId,name:p.name,mime:p.mime,bytes:Number(p.bytes),width:Number(p.width),height:Number(p.height)};}
function ksPhotoDecode003_(base64,mime,limit,variant){
 check(typeof base64==='string'&&base64.length>0&&base64.length<=Math.ceil(limit/3)*4&&/^[A-Za-z0-9+/]*={0,2}$/.test(base64),'ข้อมูลรูป '+variant+' ไม่ถูกต้องหรือใหญ่เกินกำหนด');
 const bytes=Utilities.base64Decode(base64),u=bytes.slice(0,32).map(b=>(b+256)%256);check(bytes.length>0&&bytes.length<=limit,'รูป '+variant+' ใหญ่เกินกำหนด');let width=0,height=0;
 if(mime==='image/jpeg'){check(u[0]===255&&u[1]===216&&u[2]===255,'ไฟล์ไม่ใช่ JPEG');const size=ksJpegSize003_(bytes);width=size.width;height=size.height;}
 else if(mime==='image/png'){check([137,80,78,71,13,10,26,10].every((v,i)=>u[i]===v)&&String.fromCharCode(...u.slice(12,16))==='IHDR','ไฟล์ไม่ใช่ PNG');width=u.slice(16,20).reduce((n,b)=>n*256+b,0);height=u.slice(20,24).reduce((n,b)=>n*256+b,0);}
 else if(mime==='image/webp'){check(String.fromCharCode(...u.slice(0,4))==='RIFF'&&String.fromCharCode(...u.slice(8,12))==='WEBP','ไฟล์ไม่ใช่ WebP');}
 else fail('รองรับ JPG, PNG และ WebP เท่านั้น');
 if(mime!=='image/webp')check(width>0&&height>0&&width<=20000&&height<=20000&&width*height<=100000000,'ขนาดพิกเซลของรูปใหญ่เกินกำหนด');
 return {bytes,width,height,blob:Utilities.newBlob(bytes,mime)};
}
function ksPhotoAudit003_(actor,p){
 if(!rows('Audit').some(a=>a.entity==='KnowledgeSharingPhoto003'&&a.entityId===p.id))audit(actor,'KnowledgeSharingPhoto003',p.id,null,{recordId:p.recordId,bytes:Number(p.bytes),sourceHash:p.sourceHash},'อัปโหลดรูป Knowledge Sharing');
}
function ksMedia003_(actor,p){
 const data=ksEffective002(),record=data.records.find(r=>r.id===p.recordId);check(record,'ไม่พบประวัติ Knowledge Sharing');
 const photos=ksPhotoRows003_(),linked=record.photoIds||[];
 if(p.op==='readPhoto'){
  const photo=photos.find(x=>x.id===p.photoId&&x.recordId===record.id&&x.state==='READY');check(photo&&(linked.includes(photo.id)||actor.role==='Admin'||photo.ownerId===actor.id),'ไม่พบรูปหรือไม่มีสิทธิ์อ่านรูป');
  check(['preview','report','original'].includes(p.variant),'ขนาดรูปไม่ถูกต้อง');const key={preview:'previewDriveId',report:'reportDriveId',original:'originalDriveId'}[p.variant];
  const blob=DriveApp.getFileById(photo[key]).getBlob(),bytes=blob.getBytes();check(bytes.length<=(p.variant==='original'?KSM003.maxBytes:p.variant==='preview'?128*1024:768*1024),'ไฟล์รูปใหญ่เกินกำหนด');
  return {id:photo.id,mime:p.variant==='original'?photo.mime:'image/jpeg',name:photo.name,base64:Utilities.base64Encode(bytes)};
 }
 check(ksCanEdit002(actor,data,record),'คุณแก้ไขได้เฉพาะประวัติของตนเองเท่านั้น');
 check(LockService.getScriptLock().hasLock(),'ต้องอัปโหลดผ่าน script lock');check(p.detailsProtocol===3,'กรุณารีเฟรชหน้าเว็บเป็นรุ่นล่าสุด');
 check(Number.isInteger(p.expectedRevision)&&p.expectedRevision===record.revision,'รายการนี้ถูกแก้ไขแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนอัปโหลด');
 check(typeof p.uploadRequestId==='string'&&/^KSPU-[a-zA-Z0-9-]{16,80}$/.test(p.uploadRequestId),'รหัสคำขออัปโหลดไม่ถูกต้อง');ksString001(p.name,200,'ชื่อไฟล์');
 check(['image/jpeg','image/png','image/webp'].includes(p.mime),'รองรับ JPG, PNG และ WebP เท่านั้น');
 check(Array.isArray(p.selectedPhotoIds)&&p.selectedPhotoIds.length<4&&new Set(p.selectedPhotoIds).size===p.selectedPhotoIds.length,'อัปโหลดได้สูงสุด 4 รูปต่อรายการ');
 for(const id of p.selectedPhotoIds){const x=photos.find(x=>x.id===id&&x.recordId===record.id&&x.state==='READY');check(x&&(linked.includes(id)||actor.role==='Admin'||x.ownerId===actor.id),'รูปที่เลือกไม่ตรงรายการ');}
 const original=ksPhotoDecode003_(p.original,p.mime,KSM003.maxBytes,'ต้นฉบับ'),sourceHash=ksHash001(original.bytes),prior=photos.find(x=>x.uploadRequestId===p.uploadRequestId);
 if(prior){check(prior.recordId===record.id&&prior.ownerId===actor.id&&prior.sourceHash===sourceHash&&prior.mime===p.mime&&prior.name===p.name,'รหัสอัปโหลดเดิมแต่ข้อมูลต่างกัน');ksPhotoAudit003_(actor,prior);return {photo:ksPhotoPublic003_(prior),alreadyUploaded:true};}
 const small=ksPhotoDecode003_(p.preview,'image/jpeg',128*1024,'ตัวอย่าง'),large=ksPhotoDecode003_(p.report,'image/jpeg',768*1024,'รายงาน');
 check(Math.max(small.width,small.height)<=520&&Math.max(large.width,large.height)<=1600,'ขนาดรูปตัวอย่าง/รายงานเกินกำหนด');
 // Validate reserved header and Drive destination before creating any file.
 ksSheet001(KSM003.sheet,KSM003.headers,true);const folder=DriveApp.getFolderById(prop('DRIVE_FOLDER_ID')),id='KSPH-'+uuid(),made=[];let persisted=false;
 try{
  const name=p.name.replace(/[\\/\x00-\x1f]/g,'_');
  made.push(folder.createFile(original.blob.setName(id+'_'+name)));made.push(folder.createFile(small.blob.setName(id+'_preview.jpg')));made.push(folder.createFile(large.blob.setName(id+'_report.jpg')));
  const photo={id,recordId:record.id,ownerId:actor.id,uploadRequestId:p.uploadRequestId,sourceHash,originalDriveId:made[0].getId(),previewDriveId:made[1].getId(),reportDriveId:made[2].getId(),mime:p.mime,bytes:original.bytes.length,name,width:original.width,height:original.height,createdAt:now(),state:'READY'};
  let s=ksSheet001(KSM003.sheet,KSM003.headers,true);if(!s)s=book().insertSheet(KSM003.sheet);if(!s.getLastRow()){s.getRange(1,1,1,KSM003.headers.length).setValues([KSM003.headers]);s.setFrozenRows(1);}
  s.getRange(s.getLastRow()+1,1,1,KSM003.headers.length).setNumberFormat('@').setValues([KSM003.headers.map(k=>String(photo[k]??'')).map(v=>/^[=+\-@]/.test(v)?"'"+v:v)]);SpreadsheetApp.flush();persisted=true;ksPhotoAudit003_(actor,photo);return {photo:ksPhotoPublic003_(photo),alreadyUploaded:false};
 }finally{if(!persisted){let absent=false;try{absent=!ksPhotoRows003_().some(p=>p.id===id);}catch(err){}if(absent)made.forEach(f=>{try{f.setTrashed(true);}catch(err){}});}}
}
function ksMediaStorageReady003_(){const folder=DriveApp.getFolderById(prop('DRIVE_FOLDER_ID'));return {ready:!!folder.getName()};}
