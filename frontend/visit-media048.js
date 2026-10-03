/* SVS048 — private preview/report variants and resumable visit report preparation. */
'use strict';
const MEDIA048={active:0,queue:[],cache:new Map(),pending:new Map(),bytes:0,epoch:0,observers:new Set(),stores:new Map()};
const VISIT_MEDIA_STYLE048=`
.visit-photo-grid048{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px}.visit-thumb048{display:grid;gap:5px;align-content:start;max-width:180px;padding:6px;background:#f4f8f7;border:1px solid #d4e2df;border-radius:7px;text-align:left}.visit-thumb048 img{width:160px;max-width:100%;height:105px;object-fit:contain;background:white}.visit-thumb048 span{font-size:12px;color:#587176}.visit-thumb048 small{font-size:11px}.visit-media-tools048{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.visit-media-tools048 button{cursor:pointer;font:inherit}.visit-media-tools048 select{padding:7px}.visit-media-tools048 .ready048{color:#176b67}.visit-media-tools048 .error048{color:#9c1831}.visit-report017 .toolbar{font-family:'TH Sarabun New',Tahoma,sans-serif;font-size:13pt}.visit-report017 .photos{display:block;min-height:35px}.visit-report017 .photo{display:inline-block;width:46%;vertical-align:top;margin:1%;break-inside:avoid}.visit-report017 [data-report-photo] img{max-width:100%;max-height:260px;object-fit:contain}.visit-report017 .photo-placeholder048{color:#657d80;font-size:12pt;padding:8px;background:#f4f8f7}.visit-report017 .photo-placeholder048 button{padding:3px 7px}.visit-report017 .media-error048{color:#9c1831}
@media print{.visit-media-tools048,.photo-placeholder048{display:none!important}}
`;
const mediaStyle048=document.createElement('style');mediaStyle048.textContent=VISIT_MEDIA_STYLE048;document.head.appendChild(mediaStyle048);
function mediaQueue048(work,priority=false){return new Promise((resolve,reject)=>{const item={work,resolve,reject};priority?MEDIA048.queue.unshift(item):MEDIA048.queue.push(item);mediaPump048();});}
function mediaPump048(){while(MEDIA048.active<2&&MEDIA048.queue.length){const item=MEDIA048.queue.shift();MEDIA048.active++;Promise.resolve().then(item.work).then(item.resolve,item.reject).finally(()=>{MEDIA048.active--;mediaPump048();});}}
function mediaRemember048(key,file){const bytes=String(file.base64||'').length*2;if(bytes>32*1024*1024)return;const old=MEDIA048.cache.get(key);if(old)MEDIA048.bytes-=old.bytes;MEDIA048.cache.delete(key);while(MEDIA048.bytes+bytes>32*1024*1024&&MEDIA048.cache.size){const first=MEDIA048.cache.keys().next().value;MEDIA048.bytes-=MEDIA048.cache.get(first).bytes;MEDIA048.cache.delete(first);}MEDIA048.cache.set(key,{file,bytes,at:Date.now()});MEDIA048.bytes+=bytes;}
function mediaCached048(key){const item=MEDIA048.cache.get(key);if(!item)return null;if(Date.now()-item.at>600000){MEDIA048.bytes-=item.bytes;MEDIA048.cache.delete(key);return null;}MEDIA048.cache.delete(key);MEDIA048.cache.set(key,item);return item.file;}
function mediaAllowed048(epoch,auth){if(epoch!==MEDIA048.epoch||auth!==token)throw Error('บัญชีเปลี่ยน กรุณาเปิดรายงานใหม่');}
function mediaClear048(){MEDIA048.epoch++;MEDIA048.cache.clear();MEDIA048.pending.clear();MEDIA048.stores.clear();MEDIA048.bytes=0;MEDIA048.observers.forEach(o=>o.disconnect());MEDIA048.observers.clear();const queued=MEDIA048.queue.splice(0);queued.forEach(t=>t.reject(Error('บัญชีเปลี่ยน กรุณาเปิดรายงานใหม่')));}
const mediaClearBase048=clearReportCache015;clearReportCache015=function(){mediaClear048();mediaClearBase048();};
async function mediaResize048(file){
 if(!['image/jpeg','image/png'].includes(file.mime))throw Error('ชนิดรูปไม่รองรับ');
 const img=new Image();img.src='data:'+file.mime+';base64,'+file.base64;await img.decode();
 try{
  if(!img.naturalWidth||!img.naturalHeight)throw Error('อ่านขนาดรูปไม่ได้');
  const variant=async(edge,limit)=>{let quality=.86;
   for(let attempt=0;attempt<6;attempt++){
    const ratio=Math.min(1,edge/Math.max(img.naturalWidth,img.naturalHeight)),width=Math.max(1,Math.round(img.naturalWidth*ratio)),height=Math.max(1,Math.round(img.naturalHeight*ratio)),canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);ctx.drawImage(img,0,0,width,height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));canvas.width=canvas.height=1;if(!blob)throw Error('ย่อรูปไม่สำเร็จ');
    if(blob.size<=limit){const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('อ่านรูปย่อไม่สำเร็จ'));reader.readAsDataURL(blob);});return {mime:'image/jpeg',base64,width,height,size:blob.size,name:file.name};}
    quality=Math.max(.6,quality-.08);if(attempt>=2)edge=Math.round(edge*.8);
   }throw Error('ย่อรูปให้ได้ขนาดที่กำหนดไม่สำเร็จ');
  };
  const preview=await variant(520,384*1024),report=await variant(1600,2*1024*1024);return {preview,report};
 }finally{img.src='';}
}
function mediaStore048(id,bundle,repair=false){const key=token+':'+id,epoch=MEDIA048.epoch,auth=token;if(MEDIA048.stores.has(key))return MEDIA048.stores.get(key);const job=mediaQueue048(()=>{mediaAllowed048(epoch,auth);return api('visitPhotoStore048',{id,...bundle,repair});}).finally(()=>{if(epoch===MEDIA048.epoch)MEDIA048.stores.delete(key);});MEDIA048.stores.set(key,job);return job;}
function mediaPhoto048(id,variant='preview',priority=false){
 const auth=token,epoch=MEDIA048.epoch,key=auth+':'+id+':'+variant,cached=mediaCached048(key);if(cached)return Promise.resolve(cached);if(MEDIA048.pending.has(key))return MEDIA048.pending.get(key);
 const job=mediaQueue048(async()=>{
  mediaAllowed048(epoch,auth);let file=await api('visitPhotoRead048',{id,variant});mediaAllowed048(epoch,auth);
  if(file.protocol!==48)throw Error('กรุณาอัปเดต Apps Script เป็น SVS048 ก่อน');
  if(file.previewMissing)return file;
  if(!file.base64||!['image/jpeg','image/png'].includes(file.mime))throw Error('ข้อมูลรูปไม่ถูกต้อง');
  if(variant==='report'&&file.variant==='original'){
   const canStore=file.canStore,repair=!!file.repairNeeded,bundle=await mediaResize048(file);mediaAllowed048(epoch,auth);
   mediaRemember048(auth+':'+id+':preview',{...bundle.preview,sourceId:id,variant:'preview',protocol:48});
   file={...bundle.report,sourceId:id,variant:'report',protocol:48,persistWarning:''};
   if(canStore){
    // Background derivative persistence never blocks a completed export; permission is enforced server-side.
    mediaStore048(id,bundle,repair).catch(()=>{});
   }
  }
  if(variant!=='original')mediaRemember048(key,file);return file;
 },priority).finally(()=>{if(epoch===MEDIA048.epoch)MEDIA048.pending.delete(key);});
 MEDIA048.pending.set(key,job);return job;
}
// Generate both small assets for newly attached images and local drafts. The original stays untouched.
const mediaFileBase048=fileData;fileData=async function(file){const data=await mediaFileBase048(file);if(['image/jpeg','image/png'].includes(data.mime)){try{data.media048=await mediaResize048(data);}catch(e){data.mediaWarning048=e.message;}}return data;};
const mediaUploadBase048=uploadFile;uploadFile=async function(file,recordId){
 const auth=token,epoch=MEDIA048.epoch,id=await mediaUploadBase048(file,recordId);mediaAllowed048(epoch,auth);if(['image/jpeg','image/png'].includes(file.mime)){
  try{const bundle=file.media048||await mediaResize048(file);mediaAllowed048(epoch,auth);mediaRemember048(auth+':'+id+':preview',{...bundle.preview,variant:'preview',protocol:48});mediaRemember048(auth+':'+id+':report',{...bundle.report,variant:'report',protocol:48});await mediaStore048(id,bundle);}catch(e){toast('ต้นฉบับบันทึกแล้ว แต่ยังเตรียมรูปย่อไม่ได้ ระบบจะลองเตรียมเมื่อส่งออก: '+e.message);}
 }return id;
};
const mediaPreviewBase048=imagePreview;imagePreview=function(el){mediaPreviewBase048(el);const imgs=visitContext.images.get(el.dataset.issue)||[];el.querySelectorAll('[data-slot017]').forEach(slot=>{const im=imgs[Number(slot.dataset.slot017)],img=slot.querySelector('img');if(img&&im?.media048?.preview)img.src='data:image/jpeg;base64,'+im.media048.preview.base64;});};
const mediaRecordBase048=recordCard;recordCard=function(r){const html=mediaRecordBase048(r);if(r.type!=='visit')return html;const container=document.createElement('div');container.innerHTML=html;container.querySelectorAll('.recordfiles').forEach(row=>{row.classList.add('visit-photo-grid048');row.querySelectorAll('[data-file]').forEach((button,i)=>{button.classList.add('visit-thumb048');button.dataset.visitPreview048=button.dataset.file;button.innerHTML=`<span>รูปที่ ${i+1}</span><span data-thumb-state048>กำลังเตรียมรูปตัวอย่าง…</span><small>คลิกเปิดรูปต้นฉบับ</small>`;});});return container.innerHTML;};
const mediaBindBase048=bindRecordActions;bindRecordActions=function(){mediaBindBase048();mediaBindThumbs048();};
function mediaBindThumbs048(){
 MEDIA048.observers.forEach(o=>o.disconnect());MEDIA048.observers.clear();
 const nodes=[...document.querySelectorAll('[data-visit-preview048]')].filter(x=>!x.querySelector('img'));
 const show=async button=>{if(button.dataset.loading048)return;button.dataset.loading048='true';const auth=token,epoch=MEDIA048.epoch;
  try{const file=await mediaPhoto048(button.dataset.visitPreview048);mediaAllowed048(epoch,auth);if(!button.isConnected)return;const message=button.querySelector('[data-thumb-state048]');if(file.previewMissing){message.textContent='ยังไม่มีรูปตัวอย่าง';return;}const img=document.createElement('img');img.alt='รูปตัวอย่าง';img.src='data:'+file.mime+';base64,'+file.base64;await img.decode();if(button.isConnected)message.replaceWith(img);
  }catch(e){if(button.isConnected)button.querySelector('[data-thumb-state048]').textContent='โหลดรูปตัวอย่างไม่ได้ · คลิกเปิดต้นฉบับ';}finally{delete button.dataset.loading048;}
 };
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);show(entry.target);}}),{rootMargin:'120px'});MEDIA048.observers.add(observer);nodes.forEach(n=>observer.observe(n));}else nodes.forEach(show);
}
const mediaPrintBase048=printRecord013;
printRecord013=async function(r){
 if(r.type!=='visit')return mediaPrintBase048(r);
 const f=state.farms.find(f=>f.id===r.farmId)||historyArchiveFarms018.get(r.farmId);if(!f)return toast('ไม่พบฟาร์มที่มีสิทธิ์เข้าถึง');
 const w=window.open('','_blank');if(!w)return toast('กรุณาอนุญาตหน้าต่างป๊อปอัปเพื่อเปิดรายงาน');
 const auth=token,epoch=MEDIA048.epoch;
 w.document.open();w.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${esc(farmDisplayName(f))} — บันทึกเยี่ยมฟาร์ม</title><style>${REPORT_STYLE015}${VISIT_REPORT_STYLE019}${VISIT_MEDIA_STYLE048}@page{size:A4;margin:16mm}body{font-family:Tahoma,sans-serif;color:#203d45;font-size:12px;line-height:1.7;margin:24px;background:white;overflow-wrap:anywhere}.toolbar{background:#eef5f4;padding:14px;margin-bottom:20px}button{padding:8px 14px}#printGuard048{display:none}@media print{body{margin:0}.toolbar{display:none}body:not(.media-ready048) #reportBody017{display:none}body:not(.media-ready048) #printGuard048{display:block}}</style><link rel="stylesheet" href="./ui-shell.css?v=48"></head><body class="visit-report017"><div class="toolbar"><div class="visit-media-tools048"><button id="print">พิมพ์ / บันทึกเป็น PDF</button><button id="reportPNG017">บันทึกภาพ PNG</button><button id="retryPhotos048" hidden>โหลดรูปที่เหลือต่อ</button></div><p id="status">รูปตัวอย่างกำลังทยอยโหลด · รูปสำหรับรายงานจะเตรียมเมื่อกดส่งออก</p></div><p id="printGuard048">กรุณาใช้ปุ่มส่งออกในรายงาน และรอเตรียมรูปสำหรับรายงานให้ครบก่อนพิมพ์</p><main id="reportBody017">${reportHTML013(r,f)}</main></body></html>`);w.document.close();
 const tasks=(r.data.issues||[]).flatMap((issue,i)=>(issue.images||[]).map((im,j)=>({im,i,j,ready:false,error:'',previewError:'',element:w.document.querySelector(`[data-report-photo="${i}-${j}"]`)})));
 const context={w,r,auth,epoch,tasks,busy:false,format:'pdf',meta:null};w.visitMedia048=context;
 tasks.forEach(task=>{const placeholder=w.document.createElement('div');placeholder.className='photo-placeholder048';placeholder.textContent='กำลังโหลดรูปตัวอย่าง…';task.element.appendChild(placeholder);});
 w.document.getElementById('print').onclick=()=>mediaExport048(context,'pdf');w.document.getElementById('reportPNG017').onclick=()=>mediaExport048(context,'png');w.document.getElementById('retryPhotos048').onclick=()=>mediaExport048(context,context.format);
 // Open/read does not record an export or acquire the export writer lock.
 const preview=task=>mediaReportPreview048(context,task).catch(e=>{task.previewError=e.message;if(!w.closed&&!task.ready)task.element.innerHTML='<div class="photo-placeholder048 media-error048">โหลดรูปตัวอย่างไม่ได้ · ลองเตรียมรูปเมื่อส่งออก</div>';});
 if('IntersectionObserver' in w){const observer=new w.IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){observer.unobserve(entry.target);const task=tasks.find(t=>t.element===entry.target);if(task&&!task.ready)preview(task);}}),{rootMargin:'240px'});MEDIA048.observers.add(observer);tasks.forEach(t=>observer.observe(t.element));w.addEventListener('pagehide',()=>{observer.disconnect();MEDIA048.observers.delete(observer);},{once:true});}else tasks.forEach(preview);
};
function mediaReportLive048(c){mediaAllowed048(c.epoch,c.auth);if(c.w.closed)throw Error('หน้ารายงานถูกปิด');}
async function mediaLocal048(im,variant){if(im.media048?.[variant])return im.media048[variant];const bundle=await mediaResize048(im);im.media048=bundle;return bundle[variant];}
async function mediaReportPreview048(c,task){
 mediaReportLive048(c);let file;
 if(typeof task.im==='string')file=await mediaPhoto048(task.im,'preview');else file=await mediaLocal048(task.im,'preview');
 mediaReportLive048(c);if(task.ready)return;
 if(file.previewMissing){task.element.innerHTML='<div class="photo-placeholder048">ยังไม่มีรูปตัวอย่าง · เตรียมรูปเมื่อส่งออก</div>';return;}
 if(!file.base64||!['image/jpeg','image/png'].includes(file.mime))throw Error('ข้อมูลรูปตัวอย่างไม่ถูกต้อง');const img=c.w.document.createElement('img');img.alt='รูปตัวอย่างประเด็น '+(task.i+1);img.src='data:'+file.mime+';base64,'+file.base64;await img.decode();mediaReportLive048(c);if(!task.ready)task.element.replaceChildren(img);
}
async function mediaPrepare048(c){
 const remaining=c.tasks.filter(t=>!t.ready);const jobs=remaining.map(task=>Promise.resolve().then(async()=>{
  try{mediaReportLive048(c);const file=typeof task.im==='string'?await mediaPhoto048(task.im,'report',true):await mediaLocal048(task.im,'report');mediaReportLive048(c);const img=c.w.document.createElement('img');img.alt='รูปประกอบประเด็น '+(task.i+1);img.src='data:'+file.mime+';base64,'+file.base64;await img.decode();mediaReportLive048(c);task.element.replaceChildren(img);task.ready=true;task.error='';}
  catch(e){task.error=e.message;}
  finally{if(!c.w.closed)c.w.document.getElementById('status').textContent=`เตรียมรูปสำหรับรายงาน ${c.tasks.filter(t=>t.ready).length}/${c.tasks.length}`;}
 }));await Promise.all(jobs);mediaReportLive048(c);
 const missing=c.tasks.filter(t=>!t.ready);if(missing.length)throw Error(`ยังเตรียมรูปไม่ครบ ${missing.length} รูป · กดโหลดรูปที่เหลือต่อ (${missing[0].error})`);
}
async function mediaExport048(c,format){
 if(c.busy)return;c.busy=true;c.format=format;const d=c.w.document,buttons=['print','reportPNG017','retryPhotos048'].map(id=>d.getElementById(id));buttons.forEach(b=>b.disabled=true);d.getElementById('retryPhotos048').hidden=true;
 try{
  mediaReportLive048(c);await mediaPrepare048(c);await d.fonts.load("16px 'TH Sarabun New'");await d.fonts.ready;mediaReportLive048(c);
  const meta=await exportIdentity016('visit',format,{farmId:c.r.farmId,recordId:c.r.id||'',filters:{...exportFilters016(),imageVariant:'report',imageMaxEdge:1600,imageProtocol:48}});mediaReportLive048(c);
  d.querySelector('.export-attribution016')?.remove();d.getElementById('reportBody017').insertAdjacentHTML('beforeend',attributionHTML016(meta));d.title='Visit_Report_'+meta.id;c.meta=meta;d.body.classList.add('media-ready048');d.body.dataset.exportReady='true';d.getElementById('status').textContent=`พร้อมส่งออก · รูปครบ ${c.tasks.length}/${c.tasks.length}`;
  if(format==='pdf')c.w.print();else await mediaPNG048(c,meta);
 }catch(e){if(!c.w.closed){d.getElementById('status').textContent=e.message;d.getElementById('retryPhotos048').hidden=false;}}
 finally{c.busy=false;if(!c.w.closed)buttons.forEach(b=>b.disabled=false);}
}
async function mediaPNG048(c,meta){
 const root=c.w.document.getElementById('reportBody017'),rect=root.getBoundingClientRect(),width=Math.ceil(rect.width+32),height=Math.ceil(rect.height+32),scale=Math.min(2,16000/width,16000/height,Math.sqrt(40000000/(width*height)));if(scale<.6)throw Error('รายงานยาวเกินไปสำหรับภาพเดียว กรุณาบันทึก PDF');
 // Canvas must belong to the report document, whose embedded Thai font is loaded.
 const canvas=c.w.document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);paintOverviewBoard(ctx,root,16,16);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('สร้างภาพไม่สำเร็จ');const url=URL.createObjectURL(blob),a=c.w.document.createElement('a');a.href=url;a.download='Visit_Report_'+meta.id+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
start();
