/* Read-only Knowledge Sharing views. Data comes from the authenticated host adapter. */
(function(root){
 'use strict';
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=v=>v===null?'ไม่ระบุ':Number(v).toLocaleString('th-TH');
 function mount(host,options={}){
  const core=root.SVSKnowledge;if(!host||!core)throw Error('Knowledge Sharing component unavailable');
  const saved=options.initialView||{};
  let data=null,view=null,selected=typeof saved.memberId==='string'?saved.memberId:null,page=Number.isInteger(saved.page)?Math.max(0,saved.page):0,disposed=false,year=/^(all|20\d\d)$/.test(saved.year)?saved.year:'all',scope=['all','outside'].includes(saved.scope)?saved.scope:'all',query=typeof saved.query==='string'?saved.query:'';
  let initial=options.member||null,editor=null,exportBusy=false,notice='';
  const shell=()=>`<section class="ks-member-view"><button class="back" data-ks-back>← กลับผังทีม</button><div class="pagehead"><div><div class="eyebrow">ทีมสัตวแพทย์</div><h1>Knowledge Sharing</h1><p class="muted">ประวัติการเป็นวิทยากรและอาจารย์พิเศษ</p></div>${options.onImport?'<button data-ks-import>นำเข้าข้อมูล (Admin)</button>':''}</div><div data-ks-body aria-live="polite"></div></section>`;
  host.innerHTML=shell();const surface=host.firstElementChild,body=surface.querySelector('[data-ks-body]');
  const personLabel=p=>p.kind==='team'?'เครดิตทีม'+(p.sourceScope?' · '+p.sourceScope:''):p.membershipStatus==='former'?'อดีตสมาชิก · คงประวัติเดิม':'สมาชิกที่เชื่อมกับ SVS';
  const nameButton=p=>`<button class="ks-member-link" data-ks-member="${esc(p.id)}">${esc(p.displayName)}</button>`;
  function unavailable(message){body.innerHTML=`${initial?`<div class="detailhero"><div><h2>${esc(initial.name)}</h2><p>${esc(initial.position||'')}</p></div></div>`:''}<div class="notice">${esc(message)}</div>`;}
  function controls(){return `<div class="controlrow ks-member-filters"><label>ปี <select data-ks-year aria-label="ปี Knowledge Sharing"><option value="all">ทุกปี</option>${[...new Set(view.records.map(r=>r.year))].sort().map(y=>`<option value="${y}" ${String(y)===year?'selected':''}>${y} / ${y+543}</option>`).join('')}</select></label><label>กลุ่มผู้ฟัง <select data-ks-scope aria-label="กลุ่มผู้ฟัง Knowledge Sharing"><option value="all" ${scope==='all'?'selected':''}>ทุกกลุ่ม รวม CPF BU สุกร</option><option value="outside" ${scope==='outside'?'selected':''}>นอก CPF BU สุกร</option></select></label><label>ค้นหาประวัติ <input type="search" data-ks-search aria-label="ค้นหา Knowledge Sharing" value="${esc(query)}" placeholder="หัวข้อ สถานที่ หรือชื่อ"></label></div>`;}
  function stats(rows){const s=core.summarize(rows);return `<div class="metrics ks-member-stats"><div><b>${fmt(s.presentations)}</b><span>รายการบรรยาย</span></div><div><b>${fmt(s.audience)}</b><span>ผู้ฟังที่ระบุ (คน-ครั้ง)</span></div><div><b>${fmt(s.audienceMissing)}</b><span>รายการไม่ระบุผู้ฟัง</span></div></div><p class="muted">นับตามรายการต้นทาง ผู้ร่วมบรรยายแต่ละคนได้รับเครดิต ยอดหน่วยงานนับแต่ละรายการครั้งเดียว ผู้ฟังอาจเป็นกลุ่มเดิมในหลายหัวข้อ</p>`;}
  function annual(rows){const places=core.grouped(rows,r=>r.location||'ไม่ระบุสถานที่'),placeRow=p=>`<tr><td>${esc(p.label)}</td><td>${fmt(p.presentations)}</td><td>${fmt(p.audience)}</td></tr>`,placeTable=items=>`<div class="tablewrap"><table><thead><tr><th>สถานที่ตามต้นทาง</th><th>รายการ</th><th>ผู้ฟัง (คน-ครั้ง)</th></tr></thead><tbody>${items.map(placeRow).join('')||'<tr><td colspan="3">ไม่พบรายการในขอบเขตที่เลือก</td></tr>'}</tbody></table></div>`;return `<div class="grid2"><section class="panel"><h2>ประวัติรายปี</h2><div class="tablewrap"><table><thead><tr><th>ปี</th><th>รายการ</th><th>ผู้ฟัง (คน-ครั้ง)</th></tr></thead><tbody>${core.yearly(rows,[...new Set(view.records.map(r=>r.year))].sort()).map(y=>`<tr><td>${y.year}</td><td>${fmt(y.presentations)}</td><td>${fmt(y.audience)}</td></tr>`).join('')}</tbody></table></div></section><section class="panel"><h2>สถานที่ / ช่องทางที่เคยบรรยาย</h2>${placeTable(selected?places:places.slice(0,10))}${!selected&&places.length>10?`<details><summary>ดูสถานที่เพิ่มเติม ${places.length-10} แห่ง/ช่องทาง</summary>${placeTable(places.slice(10))}</details>`:''}</section></div>`;}
  function audienceGroups(rows){return `<section class="panel"><h2>ภาพรวมตามขอบเขตและกลุ่มผู้ฟัง</h2><div class="tablewrap"><table><thead><tr><th>ขอบเขตผู้ฟัง</th><th>กลุ่มผู้ฟัง</th><th>รายการ</th><th>ผู้ฟัง (คน-ครั้ง)</th></tr></thead><tbody>${core.grouped(rows,r=>JSON.stringify([r.reach,r.audienceGroup])).map(g=>{const [reach,group]=JSON.parse(g.label);return `<tr><td>${esc(reach)}</td><td>${esc(group)}</td><td>${fmt(g.presentations)}</td><td>${fmt(g.audience)}</td></tr>`;}).join('')}</tbody></table></div></section>`;}
  function records(rows){const list=[...rows].sort((a,b)=>b.year-a.year||b.month-a.month||String(b.dateStart||'').localeCompare(a.dateStart||'')||a.sourceRow-b.sourceRow),pages=Math.max(1,Math.ceil(list.length/10));page=Math.max(0,Math.min(page,pages-1));return `<section class="panel"><h2>ประวัติการแบ่งปันความรู้</h2><div class="tablewrap"><table><thead><tr><th>วันที่ / เดือน</th><th>เรื่องและผู้บรรยาย</th><th>สถานที่ / กลุ่มผู้ฟัง</th><th>ผู้ฟัง (คน-ครั้ง)</th></tr></thead><tbody>${list.slice(page*10,page*10+10).map(r=>`<tr><td>${esc(r.dateStart||r.year+'-'+String(r.month).padStart(2,'0'))}${r.datePrecision==='conflict'?'<p class="error">วันที่รอยืนยัน</p>':r.datePrecision==='month'?'<p class="muted">ไม่ระบุวัน</p>':''}${r.dateEnd&&r.dateEnd!==r.dateStart?'<p>ถึง '+esc(r.dateEnd)+'</p>':''}</td><td><details><summary>${esc(r.title)}</summary><p>${esc(r.notes||'ไม่มีหมายเหตุเพิ่มเติม')}</p><p class="muted">รูปแบบ: ${esc(r.channel)} · ${esc(r.categories.join(', '))}</p></details><div class="ks-member-names">${r.speakerIds.map(id=>view.speakers.find(p=>p.id===id)).map(nameButton).join('')||'<span class="muted">ไม่ระบุผู้บรรยาย</span>'}</div></td><td>${esc(r.location||'ไม่ระบุสถานที่')}<p class="muted">${esc(r.audienceGroup)} · ${esc(r.reach)}</p></td><td>${fmt(r.audience)}<p class="muted">Revision ${r.revision}</p>${canEdit(r)?`<button data-ks-edit="${esc(r.id)}" aria-label="แก้ไขรายการ ${esc(r.title)}">แก้ไขรายละเอียด</button>`:''}</td></tr>`).join('')||'<tr><td colspan="4">ไม่พบประวัติในขอบเขตที่เลือก</td></tr>'}</tbody></table></div><div class="ks-member-pagination"><span>${rows.length?`${page*10+1}–${Math.min(page*10+10,rows.length)} จาก ${rows.length}`:'0 รายการ'}</span><div><button data-ks-page="prev" ${page===0?'disabled':''}>ก่อนหน้า</button> <button data-ks-page="next" ${page===pages-1?'disabled':''}>ถัดไป</button></div></div></section>`;}
  function render(){
   if(disposed||!view)return;
   editor?.dispose();editor=null;
   const person=view.speakers.find(p=>p.id===selected),rows=core.select(view,{year,scope,search:query,person:person?.id||'all'});
   const header=person?`<button class="back" data-ks-all>← ดูสมาชิกทั้งหมด</button><div class="detailhero"><div><h2>${esc(person.displayName)}</h2><p>${esc(personLabel(person))}</p></div></div>${person.membershipStatus==='former'?'<p class="notice">เก็บประวัติของอดีตสมาชิกไว้ โดยไม่ต้องมีบัญชีเข้าสู่ระบบ</p>':''}<p class="muted">ชื่อในข้อมูลเดิม: ${esc(person.sourceNames?.join(' / ')||person.sourceName||person.displayName)}</p>`:'';
   body.innerHTML=header+controls()+`<div class="ks-export-actions"><label>ข้อมูลที่ส่งออก <select data-ks-export-content aria-label="ข้อมูลที่ส่งออก"><option value="dashboard">Dashboard</option><option value="history">Dashboard และประวัติทั้งหมดตามตัวกรอง</option></select></label><button data-ks-export="png">บันทึก PNG</button><button data-ks-export="pdf">บันทึก PDF</button><span data-ks-export-status role="status"></span></div><p class="ks-save-notice" role="status">${esc(notice)}</p><div data-ks-editor></div>`+stats(rows)+(root.SVSKnowledgeCharts?root.SVSKnowledgeCharts.render(view,rows):'')+annual(rows)+(person?'':audienceGroups(rows)+`<section class="panel"><h2>สมาชิกและประวัติรายบุคคล</h2><p class="muted">คลิกชื่อเพื่อเปิดรายละเอียด รวมอดีตสมาชิก</p><div class="ks-member-directory">${core.bySpeaker(view,rows).map(p=>`<article>${nameButton(p)}<span class="muted">${esc(personLabel(p))}</span><b>${fmt(p.presentations)} รายการ</b></article>`).join('')||'<p class="muted">ไม่พบสมาชิกในขอบเขตที่เลือก</p>'}</div></section>`)+records(rows);
  }
  function canEdit(r){return options.editEnabled&&options.saveRecord&&data.access?.editProtocol===1&&data.access.editableRecordIds.includes(r.id);}
  function editRecord(id){
   const record=data.records.find(r=>r.id===id);if(!record||!canEdit(record))return;
   editor?.dispose();const slot=body.querySelector('[data-ks-editor]');
   editor=root.SVSKnowledgeEditor.mount(slot,record,{save:options.saveRecord,onClose:()=>{editor?.dispose();editor=null;slot.innerHTML='';},onReload:()=>{editor?.dispose();editor=null;reload();},onSaved:async result=>{editor?.dispose();editor=null;notice=result.unchanged?'ข้อมูลไม่เปลี่ยนแปลง ไม่มีการบันทึกซ้ำ':'บันทึกการแก้ไขแล้ว · Revision '+result.revision;await reload();}});
   slot.scrollIntoView({block:'start',behavior:'smooth'});
  }
  async function reload(){try{const latest=await options.loadData();if(disposed||!body.isConnected)return;data=latest;view=core.memberView(data);render();}catch(e){if(!disposed){notice='โหลดข้อมูลล่าสุดไม่สำเร็จ: '+String(e.message||e);render();}}}
  async function exportView(format){
   if(exportBusy||!view)return;exportBusy=true;
   const person=view.speakers.find(p=>p.id===selected),rows=core.select(view,{year,scope,search:query,person:person?.id||'all'}),includeHistory=body.querySelector('[data-ks-export-content]').value==='history';
   const snapshot={data:view,rows,selection:{year,scope,query,memberId:person?.id||null},title:person?person.displayName:'ภาพรวมทีมสัตวแพทย์บริการวิชาการสุกร',filters:`ปี: ${year==='all'?'ทุกปี':year} · ${scope==='all'?'ทุกกลุ่ม รวม CPF BU สุกร':'นอก CPF BU สุกร'}${query?' · ค้นหา: '+query.slice(0,150):''}`};
   const status=body.querySelector('[data-ks-export-status]'),controls=[...surface.querySelectorAll('button,input,select')].map(el=>({el,disabled:el.disabled}));controls.forEach(({el})=>el.disabled=true);status.textContent='กำลังสร้างไฟล์…';
   try{await options.exportReport(format,snapshot,includeHistory);if(status.isConnected)status.textContent='สร้างไฟล์เรียบร้อย'+(format==='png'&&includeHistory?' · ประวัติแบ่งเป็น PNG หลายหน้า':'');}
   catch(e){if(status.isConnected)status.textContent='ส่งออกไม่สำเร็จ: '+String(e.message||e);}
   finally{exportBusy=false;if(!disposed&&body.isConnected)controls.forEach(({el,disabled})=>el.disabled=disabled);}
  }
  function remember(){options.onViewChange?.({memberId:selected,year,scope,query,page});}
  function click(e){const b=e.target.closest('button');if(!b||!host.contains(b))return;
   if(exportBusy||editor?.busy)return;
   if(b.hasAttribute('data-ks-export')){if(options.exportReport)exportView(b.dataset.ksExport);}
   else if(b.hasAttribute('data-ks-edit'))editRecord(b.dataset.ksEdit);
   else if(b.hasAttribute('data-ks-back')){dispose();options.onBack?.();}
   else if(b.hasAttribute('data-ks-import')){dispose();options.onImport?.();}
   else if(b.hasAttribute('data-ks-member')){selected=b.dataset.ksMember;query='';page=0;render();remember();body.querySelector('h2')?.scrollIntoView({block:'start'});}
   else if(b.hasAttribute('data-ks-all')){selected=null;query='';page=0;render();remember();}
   else if(b.hasAttribute('data-ks-page')){page+=b.dataset.ksPage==='next'?1:-1;render();remember();}
  }
  function change(e){if(e.target.hasAttribute('data-ks-year'))year=e.target.value;else if(e.target.hasAttribute('data-ks-scope'))scope=e.target.value;else return;page=0;render();remember();}
  function search(e){if(!e.target.hasAttribute('data-ks-search'))return;query=e.target.value;page=0;const start=e.target.selectionStart;render();remember();const input=body.querySelector('[data-ks-search]');input.focus();input.setSelectionRange(start,start);}
  function dispose(){disposed=true;editor?.dispose();surface.removeEventListener('click',click);surface.removeEventListener('change',change);surface.removeEventListener('input',search);}
  surface.addEventListener('click',click);surface.addEventListener('change',change);surface.addEventListener('input',search);
  async function load(){
   if(!options.enabled){unavailable('ข้อมูล Knowledge Sharing ยังไม่ได้เชื่อม Backend หน้าประวัติจะพร้อมเมื่อยืนยันและนำเข้าข้อมูลแล้ว');return;}
   body.innerHTML='<p class="loading">กำลังโหลดประวัติการแบ่งปันความรู้…</p>';
   try{data=await options.loadData();if(disposed||!host.isConnected||!body.isConnected)return;
    if(data?.schemaVersion!==2||!Array.isArray(data.members)||!Array.isArray(data.records)||!Array.isArray(data.reviewItems))throw Error('รูปแบบข้อมูล Knowledge Sharing ไม่ตรงกับหน้าจอ');
    view=core.memberView(data);
    if(initial){selected=view.speakers.find(p=>initial.userId&&p.userId===initial.userId)?.id||null;
     if(!selected){unavailable('ยังไม่พบประวัติ Knowledge Sharing ที่ผูกกับสมาชิกคนนี้');return;}}
    render();
   }catch(e){if(!disposed&&body.isConnected)unavailable('โหลดประวัติไม่ได้: '+String(e.message||e));}
  }
  const ready=load();return {ready,dispose};
 }
 root.SVSKnowledgeUI={mount};
})(globalThis);
