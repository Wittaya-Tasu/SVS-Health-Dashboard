/** Knowledge Sharing v1. Add alongside the CURRENT SVS Backend; see integration patch.
 * Read/preview never create sheets. Initial import publishes an immutable snapshot only
 * after its rows, receipt and audit are durable. Existing farm data and Users are untouched.
 * All entry calls are routed through doPostBase048's session, migration guard and script lock.
 */
const KS001={rows:'KnowledgeSharingRows001',batches:'KnowledgeSharingBatches001',active:'KS001_ACTIVE_BATCH',
 rowHeaders:['batchId','kind','id','revision','dataHash','json','ordinal'],
 batchHeaders:['id','datasetId','payloadHash','baseBatchId','state','rowCount','actorId','createdAt','committedAt','summary'],
 arrays:['records','members','speakers','reviewItems','speakerLinks','memberLinks']};

function ksCanonical001(v){
 if(v===null)return 'null';
 if(typeof v==='string'||typeof v==='boolean')return JSON.stringify(v);
 if(typeof v==='number'){check(Number.isFinite(v),'Knowledge Sharing: ตัวเลขไม่ถูกต้อง');return JSON.stringify(v);}
 if(Array.isArray(v))return '['+v.map(ksCanonical001).join(',')+']';
 check(v&&typeof v==='object','Knowledge Sharing: ข้อมูลต้องเป็น JSON');
 check(!Object.keys(v).some(k=>['__proto__','constructor','prototype'].includes(k)),'Knowledge Sharing: ชื่อ key ไม่ปลอดภัย');
 return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+ksCanonical001(v[k])).join(',')+'}';
}
function ksHash001(value){const digest=Array.isArray(value)?Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value):Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8);return digest.map(b=>((b+256)%256).toString(16).padStart(2,'0')).join('');}
function ksActor001(u,edit){
 const actual=u&&rows('Users').find(x=>x.id===u.id);
 check(actual&&actual.status==='ACTIVE'&&['Admin','Management','Operation'].includes(actual.role),'บัญชีไม่ได้รับอนุญาต');
 if(edit)admin(actual);
 return actual;
}
function ksSheet001(name,headers,allowEmpty){
 const s=book().getSheetByName(name);if(!s)return null;
 if(allowEmpty&&s.getLastRow()===0)return s;
 check(s.getLastRow()>=1&&JSON.stringify(s.getRange(1,1,1,headers.length).getDisplayValues()[0])===JSON.stringify(headers),'หัวตาราง '+name+' ไม่ตรง ห้ามเขียนทับ');return s;
}
function ksBatchRows001(){const s=ksSheet001(KS001.batches,KS001.batchHeaders,true);return !s||s.getLastRow()<2?[]:s.getRange(2,1,s.getLastRow()-1,KS001.batchHeaders.length).getDisplayValues().map((v,i)=>Object.assign({_row:i+2},Object.fromEntries(KS001.batchHeaders.map((k,j)=>[k,v[j]]))));}
function ksStoredRows001(batchId){const s=ksSheet001(KS001.rows,KS001.rowHeaders,true);return !s||s.getLastRow()<2?[]:s.getRange(2,1,s.getLastRow()-1,KS001.rowHeaders.length).getDisplayValues().filter(v=>v[0]===batchId);}
function knowledgeSharingProtocol001(){
 const id=prop(KS001.active);if(!id)return 0;
 const batch=ksBatchRows001().find(b=>b.id===id);
 return batch&&batch.state==='COMMITTED'&&ksSheet001(KS001.rows,KS001.rowHeaders)?1:0;
}
function ksInstallStorage001(){
 // Validate every existing reserved table before creating any missing table.
 const definitions=[[KS001.rows,KS001.rowHeaders],[KS001.batches,KS001.batchHeaders]];
 definitions.forEach(([name,h])=>ksSheet001(name,h,true));
 definitions.forEach(([name,h])=>{const s=book().getSheetByName(name)||book().insertSheet(name);if(s.getLastRow()===0){s.getRange(1,1,1,h.length).setNumberFormat('@').setValues([h]);s.setFrozenRows(1);}});
}
function ksBatchWrite001(value){
 const s=ksSheet001(KS001.batches,KS001.batchHeaders);check(s,'ยังไม่ได้เตรียมตาราง Knowledge Sharing');
 const row=value._row||s.getLastRow()+1;
 s.getRange(row,1,1,KS001.batchHeaders.length).setNumberFormat('@').setValues([KS001.batchHeaders.map(k=>String(value[k]??''))]);
 return Object.assign({},value,{_row:row});
}
function ksUnique001(array,label,key){
 const map=new Map();for(const item of array){const id=key?key(item):item&&item.id;check(typeof id==='string'&&id.length>0&&id.length<300&&!map.has(id),'รหัสซ้ำหรือไม่ถูกต้อง: '+label);map.set(id,item);}return map;
}
function ksString001(v,max,label,optional){check(optional&&v===null||typeof v==='string'&&(optional||v.trim().length>0)&&v.length<=max,label+' ไม่ถูกต้อง');}
function ksPayload001(data){
 check(data&&data.schemaVersion===2&&typeof data.datasetId==='string'&&/^[a-z0-9-]{1,100}$/.test(data.datasetId),'รูปแบบชุดข้อมูล Knowledge Sharing ไม่ถูกต้อง');
 for(const key of KS001.arrays)check(Array.isArray(data[key])&&data[key].length<=10000,'รายการ '+key+' ไม่ถูกต้องหรือมากเกินกำหนด');
 check(data.records.length>0&&data.members.length>0,'ไม่มีรายการที่จะนำเข้า');
 const canonical=ksCanonical001(data);check(canonical.length<=8000000,'ชุดข้อมูลใหญ่เกิน 8 ล้านตัวอักษร');
 const members=ksUnique001(data.members,'members'),speakers=ksUnique001(data.speakers,'speakers'),records=ksUnique001(data.records,'records');
 const users=new Map(rows('Users').map(u=>[u.id,u])),linked=new Set();
 for(const m of data.members){
  check(/^KSM-[a-f0-9]{16}$/.test(m.id)&&Number.isInteger(m.revision)&&m.revision>=1,'รหัสหรือ revision สมาชิกไม่ถูกต้อง');
  ksString001(m.displayName,250,'ชื่อสมาชิก');check(['person','team'].includes(m.kind),'ประเภทสมาชิกไม่ถูกต้อง');
  check(Array.isArray(m.sourceSpeakerIds)&&m.sourceSpeakerIds.length>0&&new Set(m.sourceSpeakerIds).size===m.sourceSpeakerIds.length,'source speaker IDs ไม่ถูกต้อง');
  if(m.userId!==null){const u=users.get(m.userId);check(m.kind==='person'&&m.membershipStatus==='linked'&&u&&String(u.name).trim()===m.displayName.trim()&&!linked.has(m.userId),'ชื่อหรือ userId ไม่ตรง Users หรือซ้ำ');linked.add(m.userId);}
  else check(m.kind==='team'?m.membershipStatus==='team':m.membershipStatus==='former','สถานะอดีตสมาชิก/ทีมไม่ถูกต้อง');
 }
 for(const s of data.speakers){
  check(typeof s.sourceName==='string'&&s.id==='KSP-'+ksHash001(s.sourceName).slice(0,12),'source speaker ID ไม่ตรงชื่อเดิม');
  const m=members.get(s.memberId);check(m&&m.kind===s.kind&&m.userId===s.userId&&m.displayName===s.confirmedName&&m.sourceSpeakerIds.includes(s.id),'การจับคู่ชื่อกับสมาชิกไม่ตรง');
 }
 for(const m of data.members){
  check(m.sourceSpeakerIds.every(id=>speakers.get(id)?.memberId===m.id),'source speaker IDs ไม่ตรงสมาชิก');
  check(JSON.stringify(m.sourceNames)===JSON.stringify(m.sourceSpeakerIds.map(id=>speakers.get(id).sourceName)),'ชื่อจากต้นทางไม่ตรงกับ aliases');
 }
 let audience=0,unknown=0;
 for(const r of data.records){
  check(typeof r.sourceKey==='string'&&r.sourceKey.startsWith(data.datasetId+':')&&r.id==='KS-'+ksHash001(r.sourceKey).slice(0,16),'รหัสรายการไม่ตรง source key');
  check(Number.isInteger(r.revision)&&r.revision>=1&&Number.isInteger(r.sourceRow)&&r.sourceRow>=2,'revision/แถวต้นทางไม่ถูกต้อง');
  check(/^[a-f0-9]{64}$/.test(r.sourceFingerprint),'fingerprint ไม่ถูกต้อง');
  ksString001(r.title,5000,'หัวข้อ');ksString001(r.location,5000,'สถานที่',true);ksString001(r.notes,15000,'หมายเหตุ',true);
  check(Number.isInteger(r.year)&&r.year>=1900&&r.year<=2200&&Number.isInteger(r.month)&&r.month>=1&&r.month<=12,'ปีหรือเดือนไม่ถูกต้อง');
  check(['day','range','month','conflict'].includes(r.datePrecision),'ความละเอียดวันที่ไม่ถูกต้อง');
  if(['month','conflict'].includes(r.datePrecision))check(r.dateStart===null&&r.dateEnd===null,'ห้ามเติมวันให้ข้อมูลไม่ครบหรือขัดกัน');
  else check(dateOK(r.dateStart)&&dateOK(r.dateEnd)&&r.dateEnd>=r.dateStart&&Number(r.dateStart.slice(0,4))===r.year&&Number(r.dateStart.slice(5,7))===r.month,'วันที่ไม่สอดคล้องกับปี/เดือน');
  check(r.audience===null||Number.isInteger(r.audience)&&r.audience>=0,'ผู้ฟังต้องเป็นจำนวนเต็มหรือ null');
  check(r.audienceKnown===(r.audience!==null),'สถานะผู้ฟังไม่ตรงกับข้อมูล');if(r.audience===null)unknown++;else audience+=r.audience;
  check(Array.isArray(r.categories)&&r.categories.every(c=>typeof c==='string'&&c.length<=300),'หมวดหัวข้อไม่ถูกต้อง');
  check(['onsite','online','hybrid'].includes(r.channel)&&typeof r.reach==='string'&&typeof r.audienceGroup==='string','รูปแบบ/กลุ่มผู้ฟังไม่ถูกต้อง');
  check(r.outsideSwineBU===(r.audienceGroup!=='ภายใน CPF (BU สุกร)'),'ขอบเขต BU ไม่ตรงกับกลุ่มผู้ฟัง');
  check(r.eventId===null,'ชุดเริ่มต้นนี้ยังไม่รองรับการยืนยัน/รวม event');
  check(Array.isArray(r.speakerIds)&&new Set(r.speakerIds).size===r.speakerIds.length&&r.speakerIds.every(id=>speakers.has(id)),'source speaker ในรายการไม่ถูกต้อง');
  const ids=[...new Set(r.speakerIds.map(id=>speakers.get(id).memberId))];
  check(JSON.stringify(ids)===JSON.stringify(r.memberIds),'member IDs ไม่ตรงกับผู้ร่วมบรรยาย');
 }
 const links=ksUnique001(data.speakerLinks,'speaker links',l=>l.recordId+'|'+l.speakerId),memberLinks=ksUnique001(data.memberLinks,'member links',l=>l.recordId+'|'+l.memberId);
 let expectedLinks=0,expectedMemberLinks=0;
 for(const r of data.records){
  for(const id of r.speakerIds){const l=links.get(r.id+'|'+id);check(l&&l.sourceRow===r.sourceRow&&l.year===r.year&&l.kind===speakers.get(id).kind,'speaker link ขาดหรือไม่ตรง');expectedLinks++;}
  for(const id of r.memberIds){const l=memberLinks.get(r.id+'|'+id);check(l&&l.sourceRow===r.sourceRow&&l.year===r.year,'member link ขาดหรือไม่ตรง');expectedMemberLinks++;}
 }
 check(expectedLinks===links.size&&expectedMemberLinks===memberLinks.size,'พบ links ที่ไม่อยู่ในรายการ');
 ksUnique001(data.reviewItems,'review items');const pending=new Map();
 for(const item of data.reviewItems){const r=records.get(item.recordId);check(r&&item.sourceRow===r.sourceRow&&typeof item.status==='string','review item ไม่ตรงรายการ');if(item.status!=='resolved')pending.set(r.id,(pending.get(r.id)||0)+1);}
 check(data.records.every(r=>r.reviewCount===(pending.get(r.id)||0)),'จำนวนจุดรอตรวจไม่ตรง');
 return {hash:ksHash001(canonical),summary:{presentations:data.records.length,audience,audienceMissing:unknown,people:data.members.filter(m=>m.kind==='person').length,linkedPeople:linked.size,formerPeople:data.members.filter(m=>m.membershipStatus==='former').length,teamProfiles:data.members.filter(m=>m.kind==='team').length,remainingReviewPoints:[...pending.values()].reduce((n,v)=>n+v,0)}};
}
function ksSnapshotRows001(data,batchId){
 const metadata={};for(const key of Object.keys(data))if(!KS001.arrays.includes(key))metadata[key]=data[key];
 let ordinal=0;const wrap=(kind,id,value)=>{const encoded=JSON.stringify(value);check(encoded.length<=45000,'ข้อมูลหนึ่งแถวยาวเกินกำหนด');return [batchId,kind,id,String(value.revision||1),ksHash001(encoded),encoded,String(ordinal++)];};
 const result=[wrap('metadata',data.datasetId,metadata)];
 for(const kind of KS001.arrays)for(const item of data[kind]){const id=item.id||(kind==='speakerLinks'?item.recordId+'|'+item.speakerId:item.recordId+'|'+item.memberId);result.push(wrap(kind,id,item));}
 return result;
}
function ksRead001(){
 const id=prop(KS001.active),batch=ksBatchRows001().find(b=>b.id===id);check(id&&batch?.state==='COMMITTED','ยังไม่มีข้อมูล Knowledge Sharing ที่นำเข้าสำเร็จ');
 const stored=ksStoredRows001(id).sort((a,b)=>Number(a[6])-Number(b[6]));check(stored.length===Number(batch.rowCount),'ชุดข้อมูล Knowledge Sharing ยังไม่ครบ');
 const result={},seen=new Set();KS001.arrays.forEach(k=>result[k]=[]);let metadata=0;
 for(const row of stored){const key=row[1]+'|'+row[2];check(!seen.has(key)&&row[4]===ksHash001(row[5]),'ข้อมูล Knowledge Sharing ซ้ำหรือเสียหาย');seen.add(key);const item=JSON.parse(row[5]);if(row[1]==='metadata'){Object.assign(result,item);metadata++;}else{check(KS001.arrays.includes(row[1]),'ประเภทข้อมูล Knowledge Sharing ไม่ถูกต้อง');result[row[1]].push(item);}}
 check(metadata===1&&ksHash001(ksCanonical001(result))===batch.payloadHash,'ชุดข้อมูล Knowledge Sharing ไม่ตรง receipt');return result;
}
function knowledgeSharing001(u,p){
 const actor=ksActor001(u,['previewImport','applyImport'].includes(p.op));
 if(p.op==='read')return typeof ksReadEditable002==='function'?ksReadEditable002(actor):ksRead001();
 if(['createRecord','validateCreate'].includes(p.op)){check(typeof ksCreate004_==='function','กรุณาอัปเดต Backend สำหรับเพิ่มข้อมูล');return ksCreate004_(actor,p);}
 if(p.op==='updateRecord'){check(typeof ksEdit002==='function','ยังไม่เปิดแก้ไข Knowledge Sharing');return ksEdit002(actor,p);}
 if(p.op==='validateRecord'){check(typeof ksValidateRecord003_==='function','กรุณาอัปเดต Backend');return ksValidateRecord003_(actor,p);}
 if(['uploadPhoto','readPhoto'].includes(p.op)){check(typeof ksMedia003_==='function','ยังไม่เปิดใช้งานรูปภาพ');return ksMedia003_(actor,p);}
 check(['previewImport','applyImport'].includes(p.op),'คำสั่ง Knowledge Sharing ไม่ถูกต้อง');
 const data=p.dataset,validated=ksPayload001(data),hash=validated.hash,derivedId='KSB-'+ksHash001(data.datasetId+':'+hash).slice(0,16),batchId=p.batchId||derivedId;
 check(/^KSB-[a-f0-9]{16}$/.test(batchId),'batch ID ไม่ถูกต้อง');
 const active=prop(KS001.active),batches=ksBatchRows001(),previous=batches.find(b=>b.id===batchId);
 if(previous)check(previous.payloadHash===hash&&previous.datasetId===data.datasetId,'batch ID เดิมแต่ข้อมูลต่างกัน');
 check(batchId===derivedId,'batch ID ไม่ตรงชุดข้อมูล');
 const already=active===batchId&&previous?.state==='COMMITTED';
 check(!active||already,'มีชุดข้อมูลใช้งานแล้ว ห้ามนำเข้าทับประวัติเดิมด้วยตัวนำเข้าชุดเริ่มต้น');
 const expectedRows=ksSnapshotRows001(data,batchId);
 const preview={protocol:1,batchId,payloadHash:hash,expectedActiveBatchId:active,summary:validated.summary,rowCount:expectedRows.length,alreadyApplied:!!already,mode:'preview'};
 if(p.op==='previewImport')return preview;
 check(LockService.getScriptLock().hasLock(),'การนำเข้าต้องผ่าน script lock ของระบบ');
 check(p.confirmHash===hash&&typeof p.expectedActiveBatchId==='string','กรุณาตรวจ preview และยืนยัน hash/ชุดข้อมูลเดิมก่อนนำเข้า');
 if(already)return Object.assign({},preview,{mode:'apply',alreadyApplied:true,applied:false});
 check(p.expectedActiveBatchId===active,'ชุดข้อมูลเปลี่ยนหลัง preview กรุณาตรวจใหม่');
 if(previous)check(previous.baseBatchId===active,'receipt อ้างอิงชุดข้อมูลเดิมไม่ตรง');
 ksInstallStorage001();
 let batch=previous||ksBatchWrite001({id:batchId,datasetId:data.datasetId,payloadHash:hash,baseBatchId:active,state:'STAGING',rowCount:expectedRows.length,actorId:actor.id,createdAt:now(),committedAt:'',summary:JSON.stringify(validated.summary)});
 check(Number(batch.rowCount)===expectedRows.length,'receipt จำนวนแถวไม่ตรง');
 const expected=new Map(expectedRows.map(r=>[r[1]+'|'+r[2],r])),stored=ksStoredRows001(batchId),seen=new Set();
 for(const row of stored){const key=row[1]+'|'+row[2];check(!seen.has(key)&&expected.has(key)&&JSON.stringify(row)===JSON.stringify(expected.get(key)),'ข้อมูล staging ต่างจากชุดที่ยืนยัน ห้ามเขียนทับ');seen.add(key);}
 const missing=expectedRows.filter(r=>!seen.has(r[1]+'|'+r[2]));
 if(missing.length){check(batch.state==='STAGING','ชุดที่ commit แล้วขาดข้อมูล ห้ามซ่อมอัตโนมัติ');const s=ksSheet001(KS001.rows,KS001.rowHeaders);s.getRange(s.getLastRow()+1,1,missing.length,KS001.rowHeaders.length).setNumberFormat('@').setValues(missing);}
 SpreadsheetApp.flush();
 const verify=ksStoredRows001(batchId);check(verify.length===expectedRows.length&&verify.every(r=>JSON.stringify(r)===JSON.stringify(expected.get(r[1]+'|'+r[2]))),'ตรวจข้อมูลหลังเขียนไม่ผ่าน ยังไม่เผยแพร่');
 // An audit entry is deduplicated by the immutable batch ID if a prior attempt stopped here.
 if(!rows('Audit').some(a=>a.entity==='KnowledgeSharing001'&&a.entityId===batchId&&a.reason==='IMPORT_SNAPSHOT_READY'))audit(actor,'KnowledgeSharing001',batchId,{activeBatchId:active},{datasetId:data.datasetId,payloadHash:hash,summary:validated.summary},'IMPORT_SNAPSHOT_READY');
 batch=ksBatchWrite001(Object.assign({},batch,{state:'COMMITTED',committedAt:batch.committedAt||now()}));SpreadsheetApp.flush();
 PropertiesService.getScriptProperties().setProperty(KS001.active,batchId);
 return Object.assign({},preview,{mode:'apply',applied:true,alreadyApplied:false,committedAt:batch.committedAt});
}
