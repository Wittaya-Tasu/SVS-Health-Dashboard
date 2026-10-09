/* SVS053 — optional per-visit house/farmer name; SVS052 banner and pagination. */
'use strict';
const VISIT_REPORT_STYLE051=`
body.visit-report017{font-size:11pt!important;line-height:1.55!important}
.visit-report017 #reportBody017,.visit-report017 #visitPrint051{font:11pt/1.55 'TH Sarabun New',Tahoma,sans-serif;color:#243b34;overflow-wrap:anywhere}
.visit-report017 .vr-heading051{background:#19593e;color:white;border-bottom:3px solid #d2b54b;padding:5mm;margin-bottom:3mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.visit-report017 .vr-heading051 h1{background:transparent;border:0;color:white;padding:0;margin:0;font-size:20pt!important;line-height:1.25!important}
.visit-report017 .vr-heading051 h1{display:grid;grid-template-columns:max-content minmax(0,1fr);column-gap:2mm;align-items:start}
.visit-report017 .vr-title-label052,.visit-report017 .vr-title-farm052{display:block;min-width:0}
.visit-report017 .vr-title-text052{display:block}
.visit-report017 .vr-english051{display:block;font-size:11pt;font-weight:400;line-height:1.3;color:#e1eee6;margin-top:1.5mm;letter-spacing:.3px}
.visit-report017 .vr-region051{display:block;font-size:10pt;font-weight:400;line-height:1.3;color:#e1eee6;margin:1.5mm 0 0}
.visit-report017 .vr-ids052{color:#bcc3bf!important}
@media screen and (max-width:600px){.visit-report017 .vr-heading051 h1{grid-template-columns:minmax(0,1fr);row-gap:2.5mm}}
.visit-report017 .vr-meta051{display:flex;flex-wrap:wrap;gap:2mm 8mm;margin:2mm 0 3mm;font-size:11pt}
.visit-report017 .vr-record-state051{font-size:8.5pt;color:#78877f;margin:1mm 0 3mm}
.visit-report017 .vr-text051{margin:2mm 0 3mm!important;font-size:11pt;line-height:1.55;white-space:normal}
.visit-report017 .vr-text051 h3{font-size:12pt;line-height:1.4;margin:0 0 1mm;color:#19593e;break-after:avoid}
.visit-report017 .vr-text051 p{font-size:11pt;line-height:1.55;margin:0;white-space:pre-wrap;overflow-wrap:anywhere}
.visit-report017 .vr-issue051{border-top:1px solid #d6e0d8;padding-top:3mm!important;margin-top:4mm!important;break-inside:avoid}
.visit-report017 .vr-issue051 h2{display:flex;flex-wrap:wrap;align-items:center;gap:2mm;color:#19593e;font-size:14pt!important;line-height:1.4!important;border-left:3px solid #19593e;padding-left:2.5mm;margin:0 0 2.5mm!important;break-after:avoid}
.visit-report017 .vr-issue051 .ref-priority046{font-size:10pt!important;padding:1mm 2.5mm!important}
.visit-report017 .vr-advice051{background:#f3f5f4;border-left:3px solid #a5b0aa;padding:2.5mm 3mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}
.visit-report017 .vr-advice051[data-priority="สำคัญ"]{background:#fff1f3;border-color:#bd465b}
.visit-report017 .vr-advice051[data-priority="เร่งด่วน"]{background:#ffedf0;border-color:#9c1831}
.visit-report017 .vr-advice051[data-priority="สำคัญ"] h3,.visit-report017 .vr-advice051[data-priority="เร่งด่วน"] h3{color:#9c1831}
.visit-report017 .vr-photos051{display:flex;flex-direction:column;gap:3mm;margin:3mm 0 1mm;min-height:0}
.visit-report017 .vr-photo-row051{display:flex;align-items:center;justify-content:center;gap:3mm;break-inside:avoid}
.visit-report017 .vr-photo-row051 .photo{display:flex;align-items:center;justify-content:center;flex:1 1 0;min-width:0;width:auto;margin:0;height:58mm;break-inside:avoid}
.visit-report017 .vr-photo-row051[data-photo-count="1"] .photo{max-width:130mm}
.visit-report017 .vr-photo-row051 .photo img{display:block;width:auto;height:auto;max-width:100%;max-height:58mm;object-fit:contain;border-radius:4px}
.visit-report017 .vr-note051{padding-bottom:1mm}
.visit-report017 .vr-attribution051{font-size:8pt!important;line-height:1.35!important;color:#78877f!important;border-top:1px solid #d6e0d8;margin-top:5mm;padding-top:2mm;font-style:normal!important;break-inside:avoid}
.visit-report017 .vr-attribution-row051{display:flex;justify-content:space-between;gap:3mm;flex-wrap:wrap}
.visit-report017 #visitPrint051{display:none}
.visit-report017 #visitPrint051.vr-measuring051{display:block;position:fixed;left:-12000px;top:0;width:210mm;pointer-events:none}
.visit-report017 .vr-page051{box-sizing:border-box;width:210mm;height:297mm;padding:12mm 16mm 12mm;display:grid;grid-template-rows:8mm minmax(0,1fr) 14mm;gap:3mm;background:white;margin:0;break-after:page;page-break-after:always}
.visit-report017 .vr-page051:last-child{break-after:auto;page-break-after:auto}
.visit-report017 .vr-page-header051{font-size:10pt;line-height:1.25;color:#19593e;border-bottom:1px solid #d6e0d8;display:flex;align-items:flex-start;justify-content:space-between;gap:4mm;min-width:0}
.visit-report017 .vr-page-header051 b{max-width:115mm;overflow-wrap:anywhere}
.visit-report017 .vr-page-header051 span{white-space:nowrap}
.visit-report017 .vr-page-body051{display:flow-root;min-height:0;min-width:0}
.visit-report017 .vr-page-body051>.vr-issue051:first-child{margin-top:0!important;border-top:0;padding-top:0!important}
.visit-report017 .vr-page-footer051{font-size:7.5pt!important;line-height:1.3!important;color:#78877f;border-top:1px solid #d6e0d8;padding-top:1.5mm;overflow-wrap:anywhere}
.visit-report017 .vr-page-footer051 .vr-attribution051{font:inherit!important;border:0;margin:0;padding:0;color:inherit!important}
.visit-report017 .vr-continuation051{font-size:11pt;font-weight:400;color:#65776e}
@media print{
 @page{size:A4 portrait;margin:0;@bottom-right{content:none}}
 html,body.visit-report017{width:210mm;max-width:none!important;margin:0!important;padding:0!important;background:white!important}
 .visit-report017 #reportBody017,.visit-report017 .toolbar,.visit-report017 #printGuard048{display:none!important}
 .visit-report017.media-ready048 #visitPrint051{display:block;position:static;width:210mm}
 .visit-report017:not(.media-ready048) #printGuard048{display:block!important;padding:16mm}
 .visit-report017 #visitPrint051.vr-measuring051{position:static;left:auto;top:auto}
}
`;
function visitFarmName051(f){return String(f?.name||'ไม่ระบุฟาร์ม').replace(/^ฟ\.\s*/,'ฟาร์ม');}
function visitReportFarm053(f,d){const extra=String(d?.houseFarmer??'').trim();return visitFarmName051(f)+(extra?' : '+extra:'');}
function visitParagraphs051(text){return String(text??'').split(/\r?\n/).map(t=>`<p>${esc(t)||'<br>'}</p>`).join('');}
const visitReportBase051=reportHTML013;
reportHTML013=function(r,f){
 if(r.type!=='visit')return visitReportBase051(r,f);
 const d=r.data||{},text=(label,value,classes='',attrs='')=>`<div class="vr-text051 ${classes}" ${attrs}><h3>${label}</h3>${visitParagraphs051(value)}</div>`;
 const status=r.status==='UNSAVED'?'ข้อมูลจากฟอร์ม · ยังไม่ได้บันทึกเข้าระบบ':r.status==='DRAFT'?'แบบร่าง':r.status==='CANCELLED'?'รายการยกเลิก':'รายการที่บันทึกแล้ว';
 const header=`<header class="vr-intro051"><div class="vr-heading051"><h1><span class="vr-title-label052"><span class="vr-title-text052">รายงานเข้าเยี่ยมฟาร์ม :</span><span class="vr-english051">Farm Visit Report</span></span><span class="vr-title-farm052"><span class="vr-title-text052">${esc(visitReportFarm053(f,d))}</span>${f.region?'<span class="vr-region051">'+esc(f.region)+'</span>':''}</span></h1></div><div class="vr-meta051"><span><b>วันที่เข้าเยี่ยม:</b> ${esc(thai(d.date))}</span><span><b>สัตวแพทย์ผู้บันทึก:</b> ${esc(d.vet||state.user.name)}</span></div><p class="vr-record-state051">${status}${r.updatedAt?' · อัปเดต '+esc(thai(r.updatedAt)):''}</p></header>`;
 const cancelled=r.status==='CANCELLED'?text('เหตุผลยกเลิก',d.cancellation?.reason,'vr-note051'):'';
 return header+cancelled+(d.note?text('หมายเหตุ',d.note,'vr-note051'):'')+(d.issues||[]).map((i,n)=>{
  const images=i.images||[],rows=[];for(let j=0;j<images.length;j+=2)rows.push(`<div class="vr-photo-row051" data-photo-count="${Math.min(2,images.length-j)}">${images.slice(j,j+2).map((im,k)=>`<div class="photo" data-report-photo="${n}-${j+k}"></div>`).join('')}</div>`);
  const priority=['สำคัญ','เร่งด่วน'].includes(i.priority)?i.priority:'ปกติ';
  return `<section class="issue vr-issue051" data-issue051="${n}"><h2>${n+1}. ${esc(i.category)} ${visitPriority046(priority)}</h2>${text('สิ่งที่พบ',i.finding,'vr-finding051')}${text('คำแนะนำ',i.advice,'vr-advice051',`data-priority="${priority}"`)}${rows.length?'<div class="photos vr-photos051">'+rows.join('')+'</div>':''}</section>`;
 }).join('');
};
function visitAttribution051(meta,r){
 const time=new Date(meta.at).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'});
 return `<footer class="export-attribution016 vr-attribution051"><div class="vr-attribution-row051"><span>ผู้สร้างไฟล์: ${esc(meta.actorName)}</span><span>ส่งออก: ${esc(time)} (เวลาไทย)</span></div><div class="vr-ids052">Export ID: ${esc(meta.id)} · v0.1.53</div><div class="vr-ids052">ผู้สร้าง ID: ${esc(meta.actorId)}${r.id?' · บันทึก ID: '+esc(r.id):''}</div></footer>`;
}
async function visitPaginate051(c,meta){
 const doc=c.w.document,source=doc.getElementById('reportBody017');doc.body.classList.remove('media-ready048');delete doc.body.dataset.exportReady;doc.getElementById('visitPrint051')?.remove();
 const print=doc.createElement('div');print.id='visitPrint051';print.className='vr-measuring051';doc.body.appendChild(print);
 let page,body;const pages=[];
 const makePage=()=>{
  page=doc.createElement('section');page.className='vr-page051';page.innerHTML=`<header class="vr-page-header051"><b>${pages.length?esc(visitFarmName051(c.f)):''}</b><span>วันที่เยี่ยม ${esc(thai(c.r.data?.date))}</span></header><div class="vr-page-body051"></div><div class="vr-page-footer051">${visitAttribution051(meta,c.r)}<div class="vr-page-number051"></div></div>`;
  print.appendChild(page);pages.push(page);body=page.querySelector('.vr-page-body051');return body;
 };
 const fits=()=>body.scrollHeight<=body.clientHeight+1&&(!body.lastElementChild||body.lastElementChild.getBoundingClientRect().bottom<=body.getBoundingClientRect().bottom+.5);
 const tryAdd=el=>{body.appendChild(el);if(fits())return true;el.remove();return false;};
 const cloneHeading=(issue,continued)=>{const h=issue.querySelector('h2').cloneNode(true);if(continued)h.insertAdjacentHTML('beforeend','<span class="vr-continuation051">(ต่อ)</span>');return h;};
 makePage();
 // Split exceptionally long text at grapheme boundaries. Preserve every character,
 // and keep its field label on each continuation rather than losing the context.
 const textFragments=(original,container,nextContainer)=>{
  let block=null;
  const makeBlock=continued=>{const el=original.cloneNode(false),h=original.querySelector('h3').cloneNode(true);if(continued)h.append(' (ต่อ)');el.appendChild(h);container().appendChild(el);return el;};
  const words=value=>typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter('th',{granularity:'grapheme'}).segment(value),s=>s.segment):Array.from(value);
  let continued=false;
  for(const originalP of original.querySelectorAll('p')){
   const segments=words(originalP.textContent);let pos=0,empty=!segments.length;
   while(pos<segments.length||empty){
    if(!block)block=makeBlock(continued);
    const p=doc.createElement('p');block.appendChild(p);
    const remaining=segments.slice(pos).join('');p.textContent=remaining;if(empty)p.innerHTML='<br>';
    if(fits()){pos=segments.length;empty=false;continue;}
    // A field that fits on a fresh page moves together, before resorting to splitting.
    let lo=0,hi=segments.length-pos;
    while(lo<hi){const mid=Math.ceil((lo+hi)/2);p.textContent=segments.slice(pos,pos+mid).join('');if(fits())lo=mid;else hi=mid-1;}
    if(lo>0){p.textContent=segments.slice(pos,pos+lo).join('');pos+=lo;}
    else{p.remove();if(block.children.length===1){block.remove();block=null;}}
    if(lo===0&&body.children.length===1&&container()===body&&empty)throw Error('ไม่สามารถจัดพื้นที่ข้อความในรายงานได้');
    nextContainer();continued=true;block=null;
   }
  }
 };
 const addText=(original,container,nextContainer)=>{
  const item=original.cloneNode(true);container().appendChild(item);if(fits())return;item.remove();
  // Try the complete field on a new page, with its issue title when applicable.
  nextContainer();container().appendChild(item);if(fits())return;item.remove();textFragments(original,container,nextContainer);
 };
 for(const original of source.children){
  if(original.classList.contains('export-attribution016'))continue;
  if(tryAdd(original.cloneNode(true)))continue;
  // Ordinary issues stay together on the next page if they fit there in full.
  if(body.children.length)makePage();
  if(tryAdd(original.cloneNode(true)))continue;
  if(original.classList.contains('vr-text051')){textFragments(original,()=>body,()=>makePage());continue;}
  if(!original.classList.contains('vr-issue051'))throw Error('หัวรายงานยาวเกินพื้นที่หน้า กรุณาตรวจชื่อฟาร์มและข้อมูลหัวรายงาน');
  let fragment,hasPriorContent=false;
  const startFragment=continued=>{fragment=original.cloneNode(false);fragment.appendChild(cloneHeading(original,continued));body.appendChild(fragment);};
  const continueIssue=()=>{
   // Do not leave an orphan issue title on an otherwise empty page.
   if(fragment.children.length===1)fragment.remove();else hasPriorContent=true;
   if(body.children.length)makePage();startFragment(hasPriorContent);
  };
  startFragment(false);
  for(const child of original.children){
   if(child.tagName==='H2')continue;
   if(child.classList.contains('vr-text051')){addText(child,()=>fragment,continueIssue);continue;}
   if(child.classList.contains('vr-photos051')){
    for(const row of child.children){
     const copy=row.cloneNode(true);fragment.appendChild(copy);if(!fits()){copy.remove();continueIssue();fragment.appendChild(copy);if(!fits())throw Error('รูปประกอบสูงเกินพื้นที่หน้า');}
    }
   }
  }
 }
 // Validate every measured page before permitting print. No content is clipped.
 for(const [i,p] of pages.entries()){
  const b=p.querySelector('.vr-page-body051');if(b.scrollHeight>b.clientHeight+1)throw Error('จัดหน้ารายงานไม่สำเร็จ กรุณาลองส่งออกใหม่');
  p.querySelector('.vr-page-number051').textContent=`หน้า ${i+1} / ${pages.length}`;
 }
 await Promise.all([...print.querySelectorAll('img')].map(img=>img.decode()));
 print.classList.remove('vr-measuring051');c.printPages051=pages.length;
 return pages.length;
}
start();
