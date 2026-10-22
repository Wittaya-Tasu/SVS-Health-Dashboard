/** SVS057: record edits are an append-only journal over the immutable import.
 * Session, current Users role and script lock are enforced by the existing dispatcher.
 * No source identities, ownership links, farm records or initial snapshot are rewritten.
 */
const KS002={sheet:'KnowledgeSharingEdits002',headers:['id','batchId','recordId','expectedRevision','revision','actorId','requestHash','state','beforeHash','afterHash','beforeJson','afterJson','reason','createdAt','committedAt'],fields:['title','location','notes','year','month','datePrecision','dateStart','dateEnd','audience','categories','channel','reach','audienceGroup','durationDays','channelOther','country','audienceGroupOther','recipientOrganization','photoIds']};
function ksEditRows002(){
 const s=ksSheet001(KS002.sheet,KS002.headers,true);
 const entries=!s||s.getLastRow()<2?[]:s.getRange(2,1,s.getLastRow()-1,KS002.headers.length).getDisplayValues().map((v,i)=>({v,row:i+2})).filter(x=>x.v.some(Boolean)).map(({v,row})=>Object.assign({_row:row},Object.fromEntries(KS002.headers.map((k,j)=>[k,v[j]]))));
 const ids=new Set();for(const e of entries){check(e.id&&e.batchId&&e.recordId&&!ids.has(e.id)&&['STAGING','COMMITTED'].includes(e.state)&&/^[a-f0-9]{64}$/.test(e.requestHash)&&/^[a-f0-9]{64}$/.test(e.beforeHash)&&/^[a-f0-9]{64}$/.test(e.afterHash),'ประวัติการแก้ไข Knowledge Sharing ไม่ครบหรือซ้ำ');ids.add(e.id);}return entries;
}
function ksCanEdit002(actor,data,record){return actor.role==='Admin'||data.members.some(m=>m.kind==='person'&&m.userId===actor.id&&record.memberIds.includes(m.id));}
function ksEffective002(){
 const data=ksRead001(),batchId=prop(KS001.active);if(typeof ksCreatedData004_==='function')ksCreatedData004_(data,batchId);const records=new Map(data.records.map(r=>[r.id,r]));
 const events=ksEditRows002().filter(e=>e.batchId===batchId&&e.state==='COMMITTED'),ids=new Set();
 for(const e of events){
  check(!ids.has(e.id),'ประวัติการแก้ไข Knowledge Sharing มีรหัสซ้ำ');ids.add(e.id);
  const current=records.get(e.recordId);check(current&&Number(e.expectedRevision)===current.revision&&Number(e.revision)===current.revision+1,'revision ประวัติ Knowledge Sharing ไม่ต่อเนื่อง');
  check(e.beforeHash===ksHash001(ksCanonical001(current))&&e.beforeHash===ksHash001(ksCanonical001(JSON.parse(e.beforeJson)))&&e.afterHash===ksHash001(e.afterJson),'ประวัติการแก้ไข Knowledge Sharing เสียหาย');
  const after=JSON.parse(e.afterJson);check(after.id===current.id&&after.revision===current.revision+1&&JSON.stringify(after.memberIds)===JSON.stringify(current.memberIds),'รหัสหรือเจ้าของรายการถูกเปลี่ยน');records.set(current.id,after);
 }
 data.records=data.records.map(r=>records.get(r.id));return data;
}
function ksReadEditable002(actor){
 let data=ksEffective002();if(typeof ksDetailsRead003_==='function')data=ksDetailsRead003_(data);data.access={editProtocol:1,createProtocol:typeof ksCreate004_==='function'?1:0,editableRecordIds:data.records.filter(r=>ksCanEdit002(actor,data,r)).map(r=>r.id)};return data;
}
function ksPatch002(record,patch,actor){
 check(patch&&typeof patch==='object'&&!Array.isArray(patch)&&Object.keys(patch).length>0&&Object.keys(patch).every(k=>KS002.fields.includes(k)),'มีช่องข้อมูลที่ไม่อนุญาตให้แก้ไข');
 let r=Object.assign({},record,patch);
 ksString001(r.title,5000,'หัวข้อ');ksString001(r.location,5000,'สถานที่',true);ksString001(r.notes,15000,'หมายเหตุ',true);
 check(Number.isInteger(r.year)&&r.year>=1900&&r.year<=2200&&Number.isInteger(r.month)&&r.month>=1&&r.month<=12,'ปี/เดือนไม่ถูกต้อง');
 check(['day','range','month','conflict'].includes(r.datePrecision),'ความละเอียดวันที่ไม่ถูกต้อง');
 if(['month','conflict'].includes(r.datePrecision))check(r.dateStart===null&&r.dateEnd===null,'ข้อมูลที่ไม่ระบุวันต้องเว้นวันที่เริ่มและสิ้นสุด');
 else{
  check(dateOK(r.dateStart)&&dateOK(r.dateEnd)&&r.dateEnd>=r.dateStart&&Number(r.dateStart.slice(0,4))===r.year&&Number(r.dateStart.slice(5,7))===r.month,'วันที่ไม่สอดคล้องกับปี/เดือน');
  check(r.datePrecision!=='day'||r.dateStart===r.dateEnd,'วันเดียวต้องใช้วันที่เริ่มและสิ้นสุดตรงกัน');
 }
 check(r.audience===null||Number.isInteger(r.audience)&&r.audience>=0&&r.audience<=10000000,'ผู้ฟังต้องเป็นจำนวนเต็ม 0–10,000,000 หรือเว้นว่าง');r.audienceKnown=r.audience!==null;
 check(Array.isArray(r.categories)&&r.categories.length<=20&&r.categories.every(c=>typeof c==='string'&&c.trim()&&c.length<=300)&&new Set(r.categories).size===r.categories.length,'หมวดหัวข้อไม่ถูกต้องหรือซ้ำ');
 if(typeof ksDetailsValidate003_==='function')return ksDetailsValidate003_(record,r,patch,actor);
 check(['onsite','online','hybrid'].includes(r.channel),'รูปแบบการบรรยายไม่ถูกต้อง');check(['ภายในประเทศ','นานาชาติ'].includes(r.reach),'ขอบเขตผู้ฟังไม่ถูกต้อง');
 check(['ภายใน CPF (BU สุกร)','ภายใน CPF (BU อื่น)','ภายในเครือ CP (ตปท)','ฟาร์มลูกค้าอาหารสัตว์','หน่วยงานอื่นๆ ภายนอก','งานสัมมนาระดับนานาชาติ'].includes(r.audienceGroup),'กลุ่มผู้ฟังไม่ถูกต้อง');r.outsideSwineBU=r.audienceGroup!=='ภายใน CPF (BU สุกร)';return r;
}
function ksEditWrite002(value){
 let s=ksSheet001(KS002.sheet,KS002.headers,true);
 if(!s)s=book().insertSheet(KS002.sheet);
 if(!s.getLastRow()){s.getRange(1,1,1,KS002.headers.length).setNumberFormat('@').setValues([KS002.headers]);s.setFrozenRows(1);}
 const row=value._row||s.getLastRow()+1;s.getRange(row,1,1,KS002.headers.length).setNumberFormat('@').setValues([KS002.headers.map(k=>String(value[k]??'')).map(v=>/^[=+\-@]/.test(v)?"'"+v:v)]);return Object.assign({},value,{_row:row});
}
function ksEdit002(actor,p){
 if(typeof ksDetailsRead003_==='function')check(p.detailsProtocol===3,'กรุณารีเฟรชหน้าเว็บเป็นรุ่นล่าสุดก่อนแก้ไข');
 check(LockService.getScriptLock().hasLock(),'ต้องบันทึกผ่าน script lock ของระบบ');
 check(typeof p.requestId==='string'&&/^KSE-[a-zA-Z0-9-]{16,80}$/.test(p.requestId),'รหัสคำขอบันทึกไม่ถูกต้อง');
 check(typeof p.id==='string'&&Number.isInteger(p.expectedRevision)&&p.expectedRevision>=1,'รหัสรายการหรือ revision ไม่ถูกต้อง');
 ksString001(p.reason,1000,'เหตุผลการแก้ไข');
 const data=ksEffective002(),record=data.records.find(r=>r.id===p.id),batchId=prop(KS001.active);
 check(record&&ksCanEdit002(actor,data,record),'คุณแก้ไขได้เฉพาะประวัติของตนเองเท่านั้น');
 const requestHash=ksHash001(ksCanonical001({id:p.id,expectedRevision:p.expectedRevision,patch:p.patch,reason:p.reason})),events=ksEditRows002(),prior=events.find(e=>e.id===p.requestId);
 if(prior){
  check(prior.actorId===actor.id&&prior.requestHash===requestHash&&prior.batchId===batchId,'รหัสคำขอเดิมแต่ข้อมูลหรือผู้แก้ไขไม่ตรง');
  if(prior.state==='COMMITTED')return {saved:true,alreadyApplied:true,revision:Number(prior.revision)};
 }
 check(record.revision===p.expectedRevision,'รายการนี้ถูกแก้ไขแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก');
 check(!events.some(e=>e.batchId===batchId&&e.recordId===p.id&&e.state!=='COMMITTED'&&e.id!==p.requestId),'มีคำขอแก้ไขรายการนี้ค้างอยู่ กรุณาลองบันทึกคำขอเดิมอีกครั้งหรือติดต่อ Admin');
 const changed=ksPatch002(record,p.patch,actor),comparable=typeof ksNormalize003_==='function'?ksNormalize003_(record):record;
 if(ksCanonical001(changed)===ksCanonical001(comparable))return {saved:false,unchanged:true,revision:record.revision};
 changed.revision=record.revision+1;changed.updatedAt=now();changed.updatedBy=actor.id;
 const afterJson=prior?prior.afterJson:JSON.stringify(changed),beforeJson=JSON.stringify(record);
 check(beforeJson.length<=45000&&afterJson.length<=45000,'รายละเอียดรายการยาวเกินกำหนด');
 let event=prior||{id:p.requestId,batchId,recordId:p.id,expectedRevision:record.revision,revision:changed.revision,actorId:actor.id,requestHash,state:'STAGING',beforeHash:ksHash001(ksCanonical001(record)),afterHash:ksHash001(afterJson),beforeJson,afterJson,reason:p.reason,createdAt:now(),committedAt:''};
 check(event.beforeHash===ksHash001(ksCanonical001(record))&&event.afterHash===ksHash001(event.afterJson),'คำขอที่ค้างอยู่ไม่ตรงกับข้อมูลเดิม');
 if(!prior)event=ksEditWrite002(event);SpreadsheetApp.flush();
 const persisted=ksEditRows002().find(e=>e.id===event.id);check(persisted&&persisted.afterJson===event.afterJson&&persisted.requestHash===requestHash,'ตรวจสอบการบันทึกไม่ผ่าน ยังไม่เผยแพร่');
 if(!rows('Audit').some(a=>a.entity==='KnowledgeSharingEdit002'&&a.entityId===event.id))audit(actor,'KnowledgeSharingEdit002',event.id,{recordId:p.id,revision:record.revision,hash:event.beforeHash},{recordId:p.id,revision:Number(event.revision),hash:event.afterHash},p.reason);
 event=ksEditWrite002(Object.assign({},event,{state:'COMMITTED',committedAt:event.committedAt||now()}));SpreadsheetApp.flush();
 return {saved:true,alreadyApplied:false,revision:Number(event.revision)};
}
