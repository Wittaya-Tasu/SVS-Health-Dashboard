(function(root){
 'use strict';const maxBytes=20*1024*1024,types=['image/jpeg','image/png','image/webp'];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const dataURL=file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('อ่านไฟล์รูปไม่ได้'));reader.readAsDataURL(file);});
 async function prepare(file){
  if(!types.includes(file.type)||!file.size||file.size>maxBytes)throw Error('ใช้ JPG, PNG หรือ WebP รูปละไม่เกิน 20 MB');
  const url=URL.createObjectURL(file),image=new Image();try{
   image.src=url;await image.decode();if(image.width>20000||image.height>20000||image.width*image.height>100000000)throw Error('รูปมีขนาดพิกเซลใหญ่เกินกำหนด');
   const derivative=(edge,limit)=>{let size=edge;for(let attempt=0;attempt<5;attempt++){
    const scale=Math.min(1,size/Math.max(image.width,image.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const x=canvas.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,canvas.width,canvas.height);x.drawImage(image,0,0,canvas.width,canvas.height);
    for(const q of [.82,.7,.58,.45]){const base64=canvas.toDataURL('image/jpeg',q).split(',')[1];if(base64.length<=Math.floor(limit/3)*4)return base64;}size=Math.floor(size*.75);
   }throw Error('เตรียมรูปตัวอย่างไม่สำเร็จ');};
   return {original:String(await dataURL(file)).split(',')[1],preview:derivative(520,128*1024),report:derivative(1600,768*1024)};
  }finally{URL.revokeObjectURL(url);}
 }
 function picker(host,record,options){
  let disposed=false;const urls=[],items=(record.photoIds||[]).map(id=>({id,...options.photoItems?.find(p=>p.id===id)}));
  host.innerHTML=`<label>รูปภาพการแบ่งปันความรู้ (ไม่บังคับ)<input type="file" data-kp-input accept="image/jpeg,image/png,image/webp" multiple ${options.enabled?'':'disabled'}></label><p class="muted">สูงสุด 4 รูป รูปละไม่เกิน 20 MB · JPG, PNG, WebP · รูปที่นำออกจากรายการยังคงอยู่ในประวัติเดิม</p><div data-kp-list class="ks-photo-grid"></div><p data-kp-status role="status"></p><p data-kp-error class="error" role="alert"></p>`;
  const input=host.querySelector('[data-kp-input]'),list=host.querySelector('[data-kp-list]'),error=host.querySelector('[data-kp-error]'),status=host.querySelector('[data-kp-status]');
  function draw(){list.innerHTML=items.map((p,i)=>`<figure><img data-kp-thumb="${i}" alt="${esc(p.name||'รูปที่ '+(i+1))}" ${p.url?'src="'+esc(p.url)+'"':''}><figcaption>${esc(p.name||'รูปที่ '+(i+1))}</figcaption><button type="button" data-kp-remove="${i}">นำรูปออก</button></figure>`).join('');}
  input.onchange=()=>{error.textContent='';const files=[...input.files];input.value='';if(items.length+files.length>4){error.textContent='แนบได้สูงสุด 4 รูป กรุณานำรูปเดิมออกก่อน';return;}if(files.some(f=>!types.includes(f.type)||!f.size||f.size>maxBytes)){error.textContent='ใช้ JPG, PNG หรือ WebP รูปละไม่เกิน 20 MB';return;}for(const file of files){const url=URL.createObjectURL(file);urls.push(url);items.push({file,url,name:file.name,uploadRequestId:'KSPU-'+crypto.randomUUID()});}draw();loadExisting();};
  list.onclick=e=>{const button=e.target.closest('[data-kp-remove]');if(button){items.splice(Number(button.dataset.kpRemove),1);draw();loadExisting();}};
  async function loadExisting(){for(const p of items){if(p.url||!p.id)continue;try{const result=await options.read({recordId:record.id,photoId:p.id,variant:'preview'});if(disposed)return;p.url='data:'+result.mime+';base64,'+result.base64;const at=items.indexOf(p);if(at>=0){const img=list.querySelector(`[data-kp-thumb="${at}"]`);if(img)img.src=p.url;}}catch(err){if(!disposed)error.textContent='โหลดรูปเดิมไม่ได้: '+String(err.message||err);}}}
  draw();loadExisting();
  return {get ids(){return items.filter(p=>p.id).map(p=>p.id);},get count(){return items.length;},async upload(){
   for(let i=0;i<items.length;i++){const p=items[i];if(p.id)continue;status.textContent=`กำลังอัปโหลดรูป ${i+1}/${items.length}…`;const prepared=await prepare(p.file);if(disposed)throw Error('ปิดแบบฟอร์มแล้ว');const result=await options.upload({detailsProtocol:3,recordId:record.id,expectedRevision:record.revision,uploadRequestId:p.uploadRequestId,name:p.name,mime:p.file.type,selectedPhotoIds:items.filter(x=>x.id).map(x=>x.id),...prepared});if(disposed)throw Error('ปิดแบบฟอร์มแล้ว');p.id=result.photo.id;p.file=null;}
   status.textContent='';return items.map(p=>p.id);
  },dispose(){disposed=true;urls.forEach(url=>URL.revokeObjectURL(url));input.onchange=null;list.onclick=null;}};
 }
 function gallery(host,record,options){
  let disposed=false;host.innerHTML=`<section class="panel ks-photo-gallery"><div class="panelhead"><h2>รูปภาพ · ${esc(record.title)}</h2><button type="button" data-kg-close>ปิดรูปภาพ</button></div><div class="ks-photo-grid">${record.photoIds.map(id=>`<figure><img data-kg-image="${esc(id)}" alt="รูปการแบ่งปันความรู้"><figcaption data-kg-caption="${esc(id)}">กำลังโหลด…</figcaption><button type="button" data-kg-download="${esc(id)}">ดาวน์โหลดต้นฉบับ</button></figure>`).join('')}</div><p data-kg-error class="error" role="alert"></p></section>`;
  host.querySelector('[data-kg-close]').onclick=()=>options.onClose();
  host.onclick=async e=>{const b=e.target.closest('[data-kg-download]');if(!b||disposed)return;b.disabled=true;try{const result=await options.read({recordId:record.id,photoId:b.dataset.kgDownload,variant:'original'});if(disposed)return;const binary=atob(result.base64),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);const url=URL.createObjectURL(new Blob([bytes],{type:result.mime})),a=document.createElement('a');a.href=url;a.download=result.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(err){if(!disposed)host.querySelector('[data-kg-error]').textContent=String(err.message||err);}finally{b.disabled=false;}};
  (async()=>{for(const id of record.photoIds){try{const p=await options.read({recordId:record.id,photoId:id,variant:'report'});if(disposed)return;host.querySelector(`[data-kg-image="${id}"]`).src='data:'+p.mime+';base64,'+p.base64;host.querySelector(`[data-kg-caption="${id}"]`).textContent=p.name;}catch(err){if(!disposed)host.querySelector('[data-kg-error]').textContent=String(err.message||err);}}})();
  return {dispose(){disposed=true;host.onclick=null;}};
 }
 root.SVSKnowledgePhotos={prepare,picker,gallery,maxBytes};
})(globalThis);
