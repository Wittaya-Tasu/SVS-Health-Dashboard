/** SVS058: current display taxonomy over immutable source + revision journal. */
const KS003_GROUPS=['ธุรกิจในเครือ CP','ธุรกิจในเครือ CPF','หน่วยงานคู่ค้า/ลูกค้า','หน่วยงานภายนอก','งานสัมมนาระดับนานาชาติ','อื่นๆ'];
function ksNormalize003_(record){
 const r=Object.assign({},record),legacyGroup=r.audienceGroup;
 const groups={'ภายใน CPF (BU สุกร)':'ธุรกิจในเครือ CPF','ภายใน CPF (BU อื่น)':'ธุรกิจในเครือ CPF','ภายในเครือ CP (ตปท)':'ธุรกิจในเครือ CP','ฟาร์มลูกค้าอาหารสัตว์':'หน่วยงานคู่ค้า/ลูกค้า','หน่วยงานอื่นๆ ภายนอก':'หน่วยงานภายนอก'};
 r.audienceGroup=groups[legacyGroup]||legacyGroup;
 if(r.channel==='hybrid'){r.channel='other';r.channelOther='ผสมผสาน (Hybrid)';}
 if(r.reach==='นานาชาติ'||legacyGroup==='ภายในเครือ CP (ตปท)')r.reach='ต่างประเทศ';
 for(const key of ['country','channelOther','audienceGroupOther','recipientOrganization'])if(typeof r[key]!=='string')r[key]='';
 if(!Object.prototype.hasOwnProperty.call(r,'durationDays'))r.durationDays=['day','range'].includes(r.datePrecision)&&dateOK(r.dateStart)&&dateOK(r.dateEnd)?Math.round((Date.parse(r.dateEnd)-Date.parse(r.dateStart))/86400000)+1:null;
 if(!Array.isArray(r.photoIds))r.photoIds=[];
 return r;
}
function ksDetailsRead003_(data){
 const result=Object.assign({},data,{records:data.records.map(ksNormalize003_),detailsProtocol:3});
 const attached=new Set(result.records.flatMap(r=>r.photoIds));
 result.photoItems=typeof ksPhotoRows003_==='function'?ksPhotoRows003_().filter(p=>attached.has(p.id)).map(ksPhotoPublic003_):[];return result;
}
function ksDetailsValidate003_(record,value,patch,actor){
 const r=ksNormalize003_(value),before=ksNormalize003_(record);
 check(r.durationDays===null||Number.isInteger(r.durationDays)&&r.durationDays>=1&&r.durationDays<=3660,'จำนวนวันต้องเป็นจำนวนเต็ม 1–3,660 หรือเว้นว่างหากไม่ทราบ');
 check(['online','onsite','other'].includes(r.channel),'รูปแบบต้องเป็น Online, Onsite หรือ Other');
 ksString001(r.channelOther,500,'รายละเอียด Other',true);if(r.channel==='other')check(r.channelOther.trim(),'กรุณาระบุรูปแบบ Other');else r.channelOther='';
 check(['ภายในประเทศ','ต่างประเทศ'].includes(r.reach),'ขอบเขตผู้ฟังไม่ถูกต้อง');
 ksString001(r.country,300,'ประเทศ',true);if(r.reach==='ต่างประเทศ')check(r.country.trim(),'กรุณาระบุประเทศสำหรับต่างประเทศ');else r.country='';
 check(KS003_GROUPS.includes(r.audienceGroup),'กลุ่มผู้ฟังไม่ถูกต้อง');ksString001(r.audienceGroupOther,500,'กลุ่มผู้ฟังอื่นๆ',true);
 if(r.audienceGroup==='อื่นๆ')check(r.audienceGroupOther.trim(),'กรุณาระบุกลุ่มผู้ฟังอื่นๆ');else r.audienceGroupOther='';
 ksString001(r.recipientOrganization,1000,'ชื่อหน่วยงาน',true);
 // Preserve the old confirmed BU distinction when the display CPF categories merge.
 // A newly selected CPF group cannot establish whether it is the Swine BU.
 if(r.audienceGroup!==before.audienceGroup)r.outsideSwineBU=r.audienceGroup==='ธุรกิจในเครือ CPF'?null:true;
 check(Array.isArray(r.photoIds)&&r.photoIds.length<=4&&new Set(r.photoIds).size===r.photoIds.length&&r.photoIds.every(id=>typeof id==='string'),'แนบรูปภาพได้สูงสุด 4 รูป');
 if(r.photoIds.length){const photos=ksPhotoRows003_();for(const id of r.photoIds){const p=photos.find(p=>p.id===id);check(p&&p.recordId===record.id&&p.state==='READY'&&(actor.role==='Admin'||p.ownerId===actor.id||(record.photoIds||[]).includes(id)),'รูปภาพไม่ตรงรายการหรือไม่มีสิทธิ์ใช้รูปนี้');}}
 return r;
}
function ksValidateRecord003_(actor,p){
 check(p.detailsProtocol===3,'กรุณารีเฟรชหน้าเว็บเป็นรุ่นล่าสุดก่อนแก้ไข');
 const data=ksEffective002(),record=data.records.find(r=>r.id===p.id);check(record&&ksCanEdit002(actor,data,record),'คุณแก้ไขได้เฉพาะประวัติของตนเองเท่านั้น');
 check(Number.isInteger(p.expectedRevision)&&p.expectedRevision===record.revision,'รายการนี้ถูกแก้ไขแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก');
 ksPatch002(record,p.patch,actor);return {valid:true,revision:record.revision};
}
