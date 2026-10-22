(function(root){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dateInput=v=>v?`${v.slice(8,10)}/${v.slice(5,7)}/${Number(v.slice(0,4))+543}`:'';
 function parseDate(value){if(!value.trim())return null;const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());if(!m)throw Error('ระบุวันที่เป็น วว/ดด/พ.ศ. เช่น 22/10/2569');const iso=`${Number(m[3])-543}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)||isNaN(Date.parse(iso))||new Date(iso).toISOString().slice(0,10)!==iso)throw Error('วันที่ไม่ถูกต้อง');return iso;}
 function mount(host,source,options){
  const core=root.SVSKnowledge,record=core.normalizeRecord(source);let disposed=false,busy=false,pending=null,durationTouched=false,lastStart=dateInput(record.dateStart);
  const select=(key,label,values,current=record[key])=>`<label>${label}<select name="${key}">${values.map(v=>{const [value,text]=Array.isArray(v)?v:[v,v];return `<option value="${esc(value)}" ${value===current?'selected':''}>${esc(text)}</option>`;}).join('')}</select></label>`;
  const input=(key,label,value,type='text',attrs='')=>`<label>${label}<input name="${key}" type="${type}" value="${esc(value)}" ${attrs}></label>`;
  host.innerHTML=`<section class="panel ks-editor" role="region" aria-label="แก้ไขประวัติ Knowledge Sharing"><div class="panelhead"><h2>แก้ไขรายละเอียดการแบ่งปันความรู้</h2><button type="button" data-ke-close>ปิด</button></div><p class="muted">Revision ${record.revision} · ${esc(record.id)}</p><p class="notice">ชื่อผู้บรรยายและรหัสอ้างอิงคงเดิม${record.memberIds.length>1?' · รายการร่วมบรรยายมีผลต่อประวัติผู้ร่วมบรรยายทุกคน':''}</p><form><fieldset><div class="ks-editor-grid">
   <label class="ks-wide">หัวข้อบรรยาย<textarea name="title" maxlength="5000" required>${esc(record.title)}</textarea></label>
   ${input('yearBE','ปี พ.ศ.',record.year+543,'number','min="2443" max="2743" required')}
   ${select('month','เดือน',core.months.map((name,i)=>[String(i+1),name]),String(record.month))}
   ${input('durationDays','จำนวนวัน',record.durationDays,'number','min="1" max="3660" step="1" placeholder="เว้นว่างหากไม่ทราบ"')}
   ${input('dateStart','วันที่เริ่ม (ถ้าทราบ)',dateInput(record.dateStart),'text','maxlength="10" placeholder="วว/ดด/พ.ศ." inputmode="numeric"')}
   ${input('dateEnd','วันที่สิ้นสุด (ถ้าทราบ)',dateInput(record.dateEnd),'text','maxlength="10" placeholder="วว/ดด/พ.ศ." inputmode="numeric"')}
   ${input('audience','จำนวนผู้ฟัง (เว้นว่างหากไม่ทราบ)',record.audience,'number','min="0" max="10000000" step="1"')}
   <label class="ks-wide">ชื่อหน่วยงาน<input name="recipientOrganization" maxlength="1000" value="${esc(record.recipientOrganization)}" placeholder="ชื่อหน่วยงานที่ไปแบ่งปันความรู้"></label>
   <label class="ks-wide">สถานที่<input name="location" maxlength="5000" value="${esc(record.location)}"></label>
   ${select('channel','รูปแบบ',[['online','Online'],['onsite','Onsite'],['other','Other (ให้ระบุ)']])}
   ${input('channelOther','ระบุรูปแบบ Other',record.channelOther,'text','maxlength="500"')}
   ${select('reach','ขอบเขตผู้ฟัง',['ภายในประเทศ','ต่างประเทศ'])}
   ${input('country','ระบุประเทศ',record.country,'text','maxlength="300" placeholder="เช่น เวียดนาม"')}
   ${select('audienceGroup','กลุ่มผู้ฟัง',core.groups)}
   ${input('audienceGroupOther','ระบุกลุ่มผู้ฟังอื่นๆ',record.audienceGroupOther,'text','maxlength="500"')}
   <div class="ks-wide ks-topics"><label>หมวดหัวข้อ (เลือกได้หลายหมวด)<select name="categoryChoice"><option value="">เลือกหมวดหัวข้อ…</option>${['Biosecurity','Digital','Disease','Food safety','Innovation','Medication','Product','Welfare'].map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}<option value="__other__">อื่นๆ (ให้ระบุ)</option></select></label><div data-ke-topics class="ks-topic-list" aria-label="หมวดหัวข้อที่เลือก"></div><div data-ke-other-topic hidden><label>ระบุหมวดหัวข้ออื่นๆ<input name="categoryOther" maxlength="300" placeholder="ระบุหนึ่งหมวด แล้วกดเพิ่มหมวด"></label><button type="button" data-ke-add-topic>เพิ่มหมวด</button></div><p data-ke-topic-status class="muted" role="status"></p></div>
   <label class="ks-wide">หมายเหตุ<textarea name="notes" maxlength="15000">${esc(record.notes)}</textarea></label>
   <div class="ks-wide" data-ke-photos></div>
   <label class="ks-wide">เหตุผลการแก้ไข<input name="reason" maxlength="1000" required placeholder="เช่น แก้รายละเอียดตามหนังสือเชิญ"></label>
  </div></fieldset><p data-ke-error class="error" role="alert"></p><p data-ke-progress role="status"></p><p class="muted">เก็บข้อมูลเดิมและประวัติการแก้ไข หากมีคนอื่นแก้ก่อน ระบบจะให้โหลดข้อมูลล่าสุด</p><div class="actions"><button class="primary" type="submit">บันทึกการแก้ไข</button><button type="button" data-ke-reload>โหลดข้อมูลล่าสุด</button></div></form></section>`;
  const form=host.querySelector('form'),fieldset=form.querySelector('fieldset'),error=form.querySelector('[data-ke-error]'),save=form.querySelector('[type=submit]'),value=k=>form.elements[k].value;
  const categories=[...record.categories],topicList=host.querySelector('[data-ke-topics]'),topicStatus=host.querySelector('[data-ke-topic-status]'),otherTopic=host.querySelector('[data-ke-other-topic]');
  function renderTopics(){topicList.innerHTML=categories.map((c,i)=>`<span class="ks-topic-chip"><span>${esc(c==='Other'?'อื่นๆ (ข้อมูลเดิม)':c)}</span><button type="button" data-ke-remove-topic="${i}" aria-label="นำหมวด ${esc(c)} ออก">×</button></span>`).join('');topicList.querySelectorAll('[data-ke-remove-topic]').forEach(b=>b.onclick=()=>{categories.splice(Number(b.dataset.keRemoveTopic),1);topicStatus.textContent='นำหมวดออกแล้ว';renderTopics();});}
  function addTopic(raw){const c=raw.trim();if(!c){topicStatus.textContent='กรุณาระบุหมวดหัวข้อ';return false;}if(c.length>300||(!categories.includes(c)&&categories.length>=20)){topicStatus.textContent='เลือกได้สูงสุด 20 หมวด หมวดละไม่เกิน 300 ตัวอักษร';return false;}if(!categories.includes(c))categories.push(c);topicStatus.textContent='เลือกหมวด '+c+' แล้ว';renderTopics();return true;}
  function topicChoice(){const other=value('categoryChoice')==='__other__';otherTopic.hidden=!other;form.elements.categoryOther.disabled=!other;form.elements.categoryOther.required=other;}
  function addOtherTopic(){if(!addTopic(value('categoryOther')))return false;form.elements.categoryOther.value='';form.elements.categoryChoice.value='';topicChoice();return true;}
  form.elements.categoryChoice.onchange=()=>{const choice=value('categoryChoice');if(choice&&choice!=='__other__'){addTopic(choice);form.elements.categoryChoice.value='';}topicChoice();if(choice==='__other__')form.elements.categoryOther.focus();};
  host.querySelector('[data-ke-add-topic]').onclick=addOtherTopic;form.elements.categoryOther.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addOtherTopic();}};renderTopics();topicChoice();
  const picker=root.SVSKnowledgePhotos.picker(host.querySelector('[data-ke-photos]'),record,{enabled:options.mediaEnabled,photoItems:options.photoItems,read:options.readPhoto,upload:options.uploadPhoto});
  function conditional(){for(const [key,needed] of [['channelOther',value('channel')==='other'],['country',value('reach')==='ต่างประเทศ'],['audienceGroupOther',value('audienceGroup')==='อื่นๆ']]){const el=form.elements[key];el.closest('label').hidden=!needed;el.disabled=!needed;el.required=needed;}}
  for(const key of ['channel','reach','audienceGroup'])form.elements[key].onchange=conditional;conditional();
  function dates(){try{const start=parseDate(value('dateStart')),end=parseDate(value('dateEnd'));if(start){form.elements.yearBE.value=Number(start.slice(0,4))+543;form.elements.month.value=String(Number(start.slice(5,7)));}if(!durationTouched&&start&&end&&end>=start)form.elements.durationDays.value=String(Math.round((Date.parse(end)-Date.parse(start))/86400000)+1);}catch(err){}}
  form.elements.dateStart.onchange=()=>{if(!value('dateEnd')||value('dateEnd')===lastStart)form.elements.dateEnd.value=value('dateStart');lastStart=value('dateStart');dates();};form.elements.dateEnd.onchange=dates;form.elements.durationDays.oninput=()=>durationTouched=true;
  form.onsubmit=async e=>{
   e.preventDefault();if(busy||disposed)return;error.textContent='';conditional();if(!form.reportValidity())return;if(value('categoryChoice')==='__other__'&&!addOtherTopic())return;let patch;
   try{
    const start=parseDate(value('dateStart')),end=parseDate(value('dateEnd'))||start;if(!start&&end)throw Error('กรุณาระบุวันที่เริ่ม');
    patch={title:value('title').trim(),location:value('location').trim()||null,notes:value('notes').trim()||null,year:Number(value('yearBE'))-543,month:Number(value('month')),durationDays:value('durationDays')===''?null:Number(value('durationDays')),datePrecision:start?(start===end?'day':'range'):record.datePrecision==='conflict'?'conflict':'month',dateStart:start,dateEnd:end,audience:value('audience')===''?null:Number(value('audience')),categories:[...categories],channel:value('channel'),channelOther:value('channel')==='other'?value('channelOther').trim():'',reach:value('reach'),country:value('reach')==='ต่างประเทศ'?value('country').trim():'',audienceGroup:value('audienceGroup'),audienceGroupOther:value('audienceGroup')==='อื่นๆ'?value('audienceGroupOther').trim():'',recipientOrganization:value('recipientOrganization').trim(),photoIds:picker.ids};
    for(const key of ['title','location','notes'])if(value(key)===String(record[key]??''))patch[key]=record[key];
   }catch(err){error.textContent=String(err.message||err);return;}
   busy=true;fieldset.disabled=true;save.disabled=true;save.textContent='กำลังบันทึก…';
   try{
    const retryContent=JSON.stringify({patch,reason:value('reason').trim()});
    // A committed save may have lost its response: retry its exact ID before checking the old revision.
    if(pending&&pending.content===retryContent){const result=await options.save(pending.params);if(!disposed)await options.onSaved(result);return;}
    await options.validate({op:'validateRecord',detailsProtocol:3,id:record.id,expectedRevision:record.revision,patch});patch.photoIds=await picker.upload();if(disposed)return;
    const content=JSON.stringify({patch,reason:value('reason').trim()});if(!pending||pending.content!==content)pending={content,params:{op:'updateRecord',detailsProtocol:3,id:record.id,expectedRevision:record.revision,requestId:'KSE-'+crypto.randomUUID(),patch,reason:value('reason').trim()}};
    const result=await options.save(pending.params);if(!disposed)await options.onSaved(result);
   }catch(err){if(!disposed)error.textContent=String(err.message||err)+' หากการเชื่อมต่อขัดข้อง ให้ลองบันทึกคำขอเดิมอีกครั้ง';}
   finally{busy=false;if(!disposed){fieldset.disabled=false;conditional();save.disabled=false;save.textContent='บันทึกการแก้ไข';}}
  };
  host.querySelector('[data-ke-close]').onclick=()=>{if(!busy)options.onClose();};host.querySelector('[data-ke-reload]').onclick=()=>{if(!busy)options.onReload();};
  return {dispose(){disposed=true;picker.dispose();form.onsubmit=null;},get busy(){return busy;}};
 }
 root.SVSKnowledgeEditor={mount,parseDate};
})(globalThis);
