/* Admin initial import: local JSON -> server preview -> explicit confirmation -> apply. */
(function(root){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function mount(host,options){
  host.innerHTML=`<section class="ks-member-view"><button class="back" data-ki-back>← กลับ Knowledge Sharing</button><div class="pagehead"><h1>นำเข้าประวัติ Knowledge Sharing</h1></div><section class="panel"><label class="field">เลือกชุดข้อมูล JSON ที่ตรวจแล้ว<input type="file" data-ki-file accept=".json,application/json"></label><p class="muted">สำหรับนำเข้าชุดเริ่มต้น เก็บประวัติอดีตสมาชิกได้โดยไม่สร้างบัญชี และไม่ทับชุดข้อมูลที่ใช้งานอยู่</p><p data-ki-file-status aria-live="polite">ยังไม่ได้เลือกไฟล์</p><button class="primary" data-ki-preview disabled>ตรวจข้อมูลก่อนนำเข้า</button></section><section class="panel" data-ki-result hidden></section><p class="error" data-ki-error role="alert"></p></section>`;
  const surface=host.firstElementChild,file=surface.querySelector('[data-ki-file]'),status=surface.querySelector('[data-ki-file-status]'),previewButton=surface.querySelector('[data-ki-preview]'),result=surface.querySelector('[data-ki-result]'),error=surface.querySelector('[data-ki-error]');
  let dataset=null,preview=null,busy=false,generation=0;
  function lock(value){busy=value;file.disabled=value;previewButton.disabled=value||!dataset;surface.querySelector('[data-ki-back]').disabled=value;const apply=surface.querySelector('[data-ki-apply]');if(apply)apply.disabled=value||!surface.querySelector('[data-ki-confirm]')?.checked;}
  file.addEventListener('change',async()=>{
   const selected=file.files[0],version=++generation;dataset=null;preview=null;result.hidden=true;result.innerHTML='';error.textContent='';previewButton.disabled=true;
   if(!selected){status.textContent='ยังไม่ได้เลือกไฟล์';return;}
   try{if(selected.size>8000000)throw Error('ไฟล์ใหญ่เกิน 8 MB');const parsed=JSON.parse(await selected.text());if(version!==generation||!surface.isConnected)return;if(parsed.schemaVersion!==2||!Array.isArray(parsed.records)||!Array.isArray(parsed.members))throw Error('ไฟล์ไม่ใช่ชุดข้อมูล Knowledge Sharing ที่เตรียมไว้');dataset=parsed;status.textContent=selected.name+' · '+parsed.records.length.toLocaleString('th-TH')+' รายการ รอตรวจจาก Backend';previewButton.disabled=false;}catch(e){if(version===generation){error.textContent=e.message;status.textContent='อ่านไฟล์ไม่สำเร็จ';}}
  });
  previewButton.addEventListener('click',async()=>{
   if(busy||!dataset)return;const version=generation;lock(true);error.textContent='';preview=null;result.hidden=true;
   try{const response=await options.api({op:'previewImport',dataset});if(version!==generation||!surface.isConnected)return;preview=response;const s=response.summary;
    result.innerHTML=`<h2>${response.alreadyApplied?'ชุดข้อมูลนี้นำเข้าแล้ว':'ผลตรวจข้อมูลก่อนนำเข้า'}</h2><div class="tablewrap"><table><tbody>${[['รายการบรรยาย',s.presentations],['ผู้ฟังที่ระบุ (คน-ครั้ง)',s.audience],['รายการไม่ระบุผู้ฟัง',s.audienceMissing],['บุคคล',s.people],['อดีตสมาชิก',s.formerPeople],['เครดิตทีม',s.teamProfiles],['จุดที่ยังรอตรวจ',s.remainingReviewPoints]].map(([label,value])=>`<tr><th>${esc(label)}</th><td>${Number(value).toLocaleString('th-TH')}</td></tr>`).join('')}</tbody></table></div><p class="muted">รายการที่อาจซ้ำและวันที่รอยืนยันยังคงอยู่ตามข้อมูลที่ตรวจไว้</p><label class="checkrow"><input type="checkbox" data-ki-confirm>ยืนยันนำเข้าชุดข้อมูลที่ตรวจแล้ว</label><div class="actions"><button class="primary" data-ki-apply disabled>${response.alreadyApplied?'ตรวจยืนยันชุดเดิม':'นำเข้าข้อมูล'}</button></div>`;result.hidden=false;
   }catch(e){if(surface.isConnected)error.textContent='ตรวจข้อมูลไม่สำเร็จ: '+e.message;}
   finally{if(surface.isConnected)lock(false);}
  });
  surface.addEventListener('change',e=>{if(e.target.hasAttribute('data-ki-confirm'))lock(busy);});
  surface.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;
   if(b.hasAttribute('data-ki-back')&&!busy){generation++;options.onBack();return;}
   if(!b.hasAttribute('data-ki-apply')||busy||!preview||!surface.querySelector('[data-ki-confirm]')?.checked)return;
   lock(true);error.textContent='';const captured=preview;
   try{const receipt=await options.api({op:'applyImport',dataset,batchId:captured.batchId,confirmHash:captured.payloadHash,expectedActiveBatchId:captured.expectedActiveBatchId});if(!surface.isConnected)return;
    dataset=null;preview=null;file.value='';status.textContent='ตรวจผลจาก Backend แล้ว';result.innerHTML=`<h2>${receipt.alreadyApplied?'ชุดเดิมนำเข้าสำเร็จแล้ว ไม่มีการบันทึกซ้ำ':'นำเข้าข้อมูลสำเร็จ'}</h2><p>รหัสชุดข้อมูล: ${esc(receipt.batchId)}</p><button data-ki-done>เปิดประวัติ Knowledge Sharing</button>`;
    result.querySelector('[data-ki-done]').onclick=()=>options.onApplied(receipt);
   }catch(e){if(surface.isConnected)error.textContent='ยังยืนยันผลนำเข้าไม่ได้: '+e.message+' — สามารถส่งชุดเดิมซ้ำเพื่อตรวจ receipt ได้';}
   finally{if(surface.isConnected)lock(false);}
  });
 }
 root.SVSKnowledgeImport={mount};
})(globalThis);
