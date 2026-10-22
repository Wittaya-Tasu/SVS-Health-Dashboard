/** SVS060: self-owned entries, append-only and independent of imported snapshots. */
const KSC004={sheet:'KnowledgeSharingCreated004',headers:['id','batchId','actorId','requestHash','state','recordId','recordHash','recordJson','memberHash','memberJson','createdAt','committedAt']};
function ksCreateRows004_(){
 const s=ksSheet001(KSC004.sheet,KSC004.headers,true);if(!s||s.getLastRow()<2)return [];
 const entries=s.getRange(2,1,s.getLastRow()-1,KSC004.headers.length).getDisplayValues().map((v,i)=>Object.assign({_row:i+2},Object.fromEntries(KSC004.headers.map((k,j)=>[k,v[j]]))));
 const ids=new Set();for(const e of entries){check(/^KSC-[a-zA-Z0-9-]{16,80}$/.test(e.id)&&!ids.has(e.id)&&e.actorId&&e.batchId&&['STAGING','COMMITTED'].includes(e.state)&&/^[a-f0-9]{64}$/.test(e.requestHash)&&e.recordHash===ksHash001(e.recordJson)&&e.memberHash===ksHash001(e.memberJson),'ประวัติการเพิ่ม Knowledge Sharing ไม่ครบหรือเสียหาย');ids.add(e.id);}return entries;
}
function ksCreatedData004_(data,batchId){
 for(const e of ksCreateRows004_().filter(e=>e.batchId===batchId&&e.state==='COMMITTED')){
  const r=JSON.parse(e.recordJson),m=JSON.parse(e.memberJson),existing=data.members.find(x=>x.id===m.id);
  check(r.id===e.recordId&&r.revision===1&&r.createdBy===e.actorId&&r.memberIds.length===1&&r.memberIds[0]===m.id&&m.kind==='person'&&m.userId===e.actorId&&!data.records.some(x=>x.id===r.id)&&(!existing||existing.userId===m.userId),'รหัสหรือเจ้าของประวัติใหม่ไม่ถูกต้อง');
  if(!existing)data.members.push(m);data.records.push(r);
 }
 return data;
}
function ksNewRecord004_(actor,p,data){
 check(p.detailsProtocol===3,'กรุณารีเฟรชหน้าเว็บเป็นรุ่นล่าสุด');
 check(p.patch&&(!p.patch.photoIds||p.patch.photoIds.length===0),'บันทึกรายละเอียดก่อนผูกรูปภาพ');
 const linked=data.members.filter(m=>m.kind==='person'&&m.userId===actor.id);check(linked.length<=1,'บัญชีผูกกับหลายโปรไฟล์ กรุณาให้ Admin ตรวจสอบ');
 const member=linked[0]||{id:'KSM-U-'+ksHash001(actor.id).slice(0,24),displayName:actor.name,sourceNames:[],kind:'person',userId:actor.id,membershipStatus:'linked'};
 const base={id:'KSN-'+ksHash001(actor.id+':'+(p.requestId||'validate')).slice(0,24),revision:1,memberIds:[member.id],speakerIds:[member.id],sourceRow:0,sourceSheet:'member-entry',eventId:null,reviewCount:0,title:'',location:null,notes:null,year:2000,month:1,datePrecision:'month',dateStart:null,dateEnd:null,audience:null,audienceKnown:false,categories:[],channel:'onsite',reach:'ภายในประเทศ',audienceGroup:'หน่วยงานภายนอก',outsideSwineBU:true,durationDays:null,channelOther:'',country:'',audienceGroupOther:'',recipientOrganization:'',photoIds:[]};
 const record=ksPatch002(base,p.patch,actor);return {record,member};
}
function ksCreateWrite004_(value){
 let s=ksSheet001(KSC004.sheet,KSC004.headers,true);if(!s)s=book().insertSheet(KSC004.sheet);
 if(!s.getLastRow()){s.getRange(1,1,1,KSC004.headers.length).setNumberFormat('@').setValues([KSC004.headers]);s.setFrozenRows(1);}
 const row=value._row||s.getLastRow()+1;s.getRange(row,1,1,KSC004.headers.length).setNumberFormat('@').setValues([KSC004.headers.map(k=>String(value[k]??'')).map(v=>/^[=+\-@]/.test(v)?"'"+v:v)]);return Object.assign({},value,{_row:row});
}
function ksCreate004_(actor,p){
 check(p.op==='validateCreate'||p.op==='createRecord','คำสั่งเพิ่มข้อมูลไม่ถูกต้อง');
 const data=ksEffective002(),batchId=prop(KS001.active);check(batchId,'ยังไม่มีชุด Knowledge Sharing ที่ใช้งาน');
 if(p.op==='validateCreate'){ksNewRecord004_(actor,p,data);return {valid:true};}
 check(LockService.getScriptLock().hasLock(),'ต้องบันทึกผ่าน script lock');
 check(/^KSC-[a-zA-Z0-9-]{16,80}$/.test(p.requestId||''),'รหัสคำขอเพิ่มข้อมูลไม่ถูกต้อง');
 const requestHash=ksHash001(ksCanonical001({patch:p.patch,detailsProtocol:p.detailsProtocol})),prior=ksCreateRows004_().find(e=>e.id===p.requestId);
 if(prior){check(prior.batchId===batchId&&prior.actorId===actor.id&&prior.requestHash===requestHash,'รหัสคำขอเดิมแต่ผู้บันทึกหรือข้อมูลต่างกัน');if(prior.state==='COMMITTED')return {created:true,alreadyApplied:true,id:prior.recordId,record:data.records.find(r=>r.id===prior.recordId)};}
 let event=prior;
 if(!event){const next=ksNewRecord004_(actor,p,data),record=Object.assign(next.record,{createdBy:actor.id,createdAt:now(),updatedBy:actor.id,updatedAt:now()}),recordJson=JSON.stringify(record);check(recordJson.length<=45000,'รายละเอียดรายการยาวเกินกำหนด');event=ksCreateWrite004_({id:p.requestId,batchId,actorId:actor.id,requestHash,state:'STAGING',recordId:record.id,recordHash:ksHash001(recordJson),recordJson,memberHash:ksHash001(JSON.stringify(next.member)),memberJson:JSON.stringify(next.member),createdAt:now(),committedAt:''});}
 SpreadsheetApp.flush();const saved=ksCreateRows004_().find(e=>e.id===event.id);check(saved&&saved.recordJson===event.recordJson&&saved.memberJson===event.memberJson&&saved.requestHash===requestHash,'ตรวจข้อมูลหลังบันทึกไม่ผ่าน ยังไม่เผยแพร่');
 if(!rows('Audit').some(a=>a.entity==='KnowledgeSharingCreate004'&&a.entityId===event.id))audit(actor,'KnowledgeSharingCreate004',event.id,null,{recordId:event.recordId,hash:event.recordHash},'เพิ่มประวัติการแบ่งปันความรู้ของตนเอง');
 event=ksCreateWrite004_(Object.assign({},event,{state:'COMMITTED',committedAt:event.committedAt||now()}));SpreadsheetApp.flush();return {created:true,alreadyApplied:false,id:event.recordId,record:JSON.parse(event.recordJson)};
}
