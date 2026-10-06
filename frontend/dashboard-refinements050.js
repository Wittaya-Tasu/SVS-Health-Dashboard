/* SVS050 — horizontal chart modes, separate cause/risk totals and loss classification. */
'use strict';
const REF050={bars:{},table:'risk',owner:null};
const REF_STYLE050=`
.ref-tools050{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:10px 0;font-size:13px}.ref-tools050 label{display:flex;align-items:center;gap:7px}.ref-tools050 select{height:36px;padding:5px 10px;min-width:125px}.ref-tools050 button[aria-pressed=true]{background:#176b67;color:white;border-color:#176b67}.ref-scope050{font-size:12px;color:#647d81;margin:6px 0 12px}.ref-risk-grid046 .geo-risk-bars033>div{margin:8px 0}.ref-loss-picker050{grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:13px}.ref-loss-picker050 select{min-width:200px;padding:5px 8px}.ref-risks046 tfoot{font-weight:700;background:#eef5f4}.ref-risks046 td:nth-child(2){font-weight:700}.ref-risk-grid046 .ref-tools050 select{min-width:0;max-width:100%}.ref-risk-grid046 button.ds-link040,.ref-risks046 button.ds-link040{border:0;background:transparent;padding:0;font:inherit;color:inherit;text-align:left;cursor:pointer;overflow-wrap:anywhere}.ref-risk-grid046 button.ds-link040:hover,.ref-risks046 button.ds-link040:hover{text-decoration:underline}
@media print{.ref-tools050{display:none!important}.ref-scope050{font-size:9pt}}
`;
const refStyle050=document.createElement('style');refStyle050.textContent=REF_STYLE050;document.head.appendChild(refStyle050);
function refReset050(){REF050.bars={};REF050.table='risk';}
function refMode050(key){return REF050.bars[key]||'count';}
function refBarPicker050(key,noun='จำนวนครั้ง'){const percent=refMode050(key)==='percent';return `<div class="ref-tools050 da-only-screen021"><label>แสดงค่า<select data-bar-mode050="${esc(key)}"><option value="count" ${!percent?'selected':''}>${noun}</option><option value="percent" ${percent?'selected':''}>สัดส่วน (%)</option></select></label></div>`;}
function refBarValue050(n,total,mode){return mode==='percent'?dsPercent040(n,total):Number(n).toLocaleString('th-TH');}
daBars021=function(events,key,title){const rows=daGroupCount021(events,key),total=rows.reduce((n,r)=>n+r[1],0),mode=refMode050('cases-'+key),max=mode==='percent'?total||1:Math.max(1,...rows.map(x=>x[1]));return `<section class="panel"><h2>${esc(title)}</h2>${refBarPicker050('cases-'+key,'จำนวนเคส')}<p class="ref-scope050">${mode==='percent'?'สัดส่วนของเคสตามตัวกรอง · ฐาน '+total+' เคส':'จำนวนเคสตามตัวกรอง'}</p>${rows.map(([label,count])=>`<button class="da-bar-row021" data-da-${key==='disease'?'disease':'region'}021="${esc(label)}"><span>${esc(label)}</span><div><i style="width:${100*count/max}%;background:${key==='disease'?daColor021(label):'#287c78'}"></i></div><b>${refBarValue050(count,total,mode)}</b></button>`).join('')||'<p class="muted">ยังไม่มีข้อมูล</p>'}</section>`;};
const refControlDonutBase050=dsControlDonut047;
dsControlDonut047=function(m){return refControlDonutBase050({...m,controls:m.controls.filter(r=>r.count>0)});};
geoRisks033=function(events){
 const d=geoRiskData033(events),risk=REF050.table==='risk',indexes=risk?[1,2,3]:[0],labels=['สาเหตุ','ความเสี่ยงที่ 1','ความเสี่ยงที่ 2','ความเสี่ยงที่ 3'],grand=indexes.reduce((s,i)=>s+d.totals[i],0),percent=REF046.riskPercent;
 const rows=d.rows.filter(([,c])=>indexes.some(i=>c[i]>0)),value=(n,total)=>n?refBarValue050(n,total,percent?'percent':'count'):'';
 const totalIds=cat=>events.filter(e=>indexes.some(i=>DiseaseSummary040.pathwayParts(e,d.keys[i]).some(p=>p.label===cat))).map(e=>e.id);
 const missing=indexes.reduce((s,i)=>s+d.missing[i],0);
 const table=`<section class="panel"><h2>สรุปสาเหตุและความเสี่ยง</h2><div class="ref-tools050 da-only-screen021"><button data-path-table050="cause" aria-pressed="${!risk}">สาเหตุ</button><button data-path-table050="risk" aria-pressed="${risk}">ความเสี่ยง</button><label>แสดงค่า<select id="refRiskMode046"><option value="count" ${!percent?'selected':''}>จำนวนครั้ง</option><option value="percent" ${percent?'selected':''}>สัดส่วน (%)</option></select></label></div><p class="ref-scope050">${risk?'ความเสี่ยง · รวมทั้งหมด = ผลรวมที่ระบุในความเสี่ยงทั้ง 3 ลำดับ':'สาเหตุ · รวมทั้งหมด = จำนวนเคสที่ระบุสาเหตุนั้น'} · ${events.length} เคสตามตัวกรอง${percent?' · % คอลัมน์รวมใช้ฐาน '+grand+' ครั้ง แต่ละลำดับใช้ฐานของลำดับนั้น':''} · ไม่รวมพื้นที่โรคระบาด${risk?' · เคสเดียวอาจนับได้หลายครั้ง':''}</p><div class="tablewrap"><table class="ref-risks046"><thead><tr><th>ประเภทช่องทาง</th><th>รวมทั้งหมด (${percent?'%':'ครั้ง'})</th>${risk?indexes.map(i=>`<th>${labels[i]} (${percent?'%':'ครั้ง'})</th>`).join(''):''}</tr></thead><tbody>${rows.map(([cat,c])=>{const total=indexes.reduce((s,i)=>s+c[i],0);return `<tr><th>${esc(cat)}</th><td>${dsLink040(value(total,grand),totalIds(cat))}</td>${risk?indexes.map(i=>`<td>${c[i]?`<button class="da-link021" data-risk-cat033="${esc(cat)}" data-risk-key033="${d.keys[i]}">${value(c[i],d.totals[i])}</button>`:''}</td>`).join(''):''}</tr>`;}).join('')}<tr><th>ยังไม่มีข้อมูล${percent?' (เคสในแต่ละลำดับ)':''}</th><td>${missing||''}</td>${risk?indexes.map(i=>`<td>${d.missing[i]||''}</td>`).join(''):''}</tr></tbody><tfoot><tr><th>รวมที่ระบุ</th><td>${value(grand,grand)}</td>${risk?indexes.map(i=>`<td>${value(d.totals[i],d.totals[i])}</td>`).join(''):''}</tr></tfoot></table></div></section>`;
 const charts=`<div class="ref-risk-grid046">${labels.map((label,i)=>{const rows=geoRiskTop042(d,i),mode=refMode050(d.keys[i]),max=mode==='percent'?d.totals[i]||1:Math.max(1,...rows.map(r=>r[1][i]));return `<section class="panel"><h2>${label}</h2>${refBarPicker050(d.keys[i],i?'จำนวนครั้ง':'จำนวนเคส')}<p class="ref-scope050">${mode==='percent'?'สัดส่วน (%) · ฐาน '+d.totals[i]+' ครั้ง':i?'จำนวนครั้งที่ระบุ':'จำนวนเคสที่ระบุ'}</p><div class="geo-risk-bars033">${rows.map(([cat,c])=>`<div><span><button class="ds-link040" data-risk-cat033="${esc(cat)}" data-risk-key033="${d.keys[i]}">${esc(cat)}</button></span><div class="geo-risk-track033"><i style="width:${100*c[i]/max}%;background:${['#176b67','#527fa0','#a77b35','#856785'][i]}"></i></div><b>${refBarValue050(c[i],d.totals[i],mode)}</b></div>`).join('')||'<p class="muted">ยังไม่มีข้อมูล</p>'}</div></section>`;}).join('')}</div>`;
 return table+charts;
};
const refUnitBase050=refUnit046;
refUnit046=function(g){return g.lossType050?refUnitBase050({...g,id:g.lossType050,label:REF_UNITS046.find(x=>x[0]===g.lossType050)?.[1]||g.label}):refUnitBase050(g);};
function lossPicker050(record){
 if(record?.type&&record.type!=='event')return;
 const data=record?.data||{};
 document.querySelectorAll('[data-unit="boar"],[data-hgroup018="boarSow"]').forEach(row=>{
  if(row.querySelector('[data-loss-type050]'))return;
  const id=row.dataset.unit||row.dataset.hgroup018,g=(data.historicalCounts||data.units||[]).find(x=>x.id===id),selected=g?.lossType050||data.lossType050||'boar';
  row.insertAdjacentHTML('beforeend',`<label class="ref-loss-picker050">ประเภทสุกรสำหรับความเสียหาย<select data-loss-type050><option value="matting" ${selected==='matting'?'selected':''}>Matting(แม่พันธุ์อุ้มท้อง)</option><option value="boar" ${selected==='boar'?'selected':''}>Boar(พ่อพันธุ์)</option></select></label>`);
 });
}
const refEventFormBase050=eventForm;eventForm=function(r,closing=false,type=r?.type||'event'){const result=refEventFormBase050(r,closing,type);if(type==='event')lossPicker050(r);return result;};
const refHistoricalFormBase050=historicalForm018;historicalForm018=function(r,closing=false){const result=refHistoricalFormBase050(r,closing);lossPicker050(r);return result;};
const refUnitsTableBase050=eventUnitsTable017;eventUnitsTable017=function(units){const el=document.createElement('div');el.innerHTML=refUnitsTableBase050(units);el.querySelectorAll('tbody tr').forEach((row,i)=>{const type=units?.[i]?.lossType050;if(type==='matting')row.cells[0].insertAdjacentHTML('beforeend','<br><small class="muted">ความเสียหาย: Matting(แม่พันธุ์อุ้มท้อง)</small>');});return el.innerHTML;};
const refHistoryCountsBase050=historyCountsTable018;historyCountsTable018=function(groups){return refHistoryCountsBase050(groups?.map(g=>g.lossType050?{...g,label:REF_UNITS046.find(x=>x[0]===g.lossType050)?.[1]||g.label}:g));};
const refRenderBase050=daRender021;daRender021=function(){
 if(REF050.owner!==state.user?.id){refReset050();REF050.owner=state.user?.id;}
 refRenderBase050();
 $$('[data-bar-mode050]').forEach(el=>el.onchange=()=>{REF050.bars[el.dataset.barMode050]=el.value;daRender021();});
 $$('[data-path-table050]').forEach(el=>el.onclick=()=>{REF050.table=el.dataset.pathTable050;daRender021();});
 // Aggregate cells use a union of case IDs for drill-down; the value remains the sum of mentions.
 if(daView021==='causes')$$('[data-ds-ids040]').forEach(el=>el.onclick=()=>{const ids=new Set(JSON.parse(el.dataset.dsIds040));modal('เคสตามช่องทางที่เลือก',daCaseTable021(daSelected021().filter(e=>ids.has(e.id))));daBindCaseButtons021();});
 const reset=$('#daReset021');if(reset){const base=reset.onclick;reset.onclick=e=>{refReset050();base?.(e);};}
};
const refExportFiltersBase050=daExportFilters021;daExportFilters021=function(){return {...refExportFiltersBase050(),horizontalChartModes:Object.fromEntries(['cases-disease','cases-region','cause','risk1','risk2','risk3'].map(k=>[k,refMode050(k)]).concat([['risk',REF047.riskMode]])),pathwayTable:{view:REF050.table,mode:REF046.riskPercent?'percent':'count',total:'sum-of-selected-source-slots-excluding-area',separateCauseAndRisk:true},lossClassificationVersion:50};};
const refSnapshotBase050=daSnapshot021;daSnapshot021=function(){return '<style>'+REF_STYLE050+'</style>'+refSnapshotBase050();};
const refNavBase050=uiSnapshot032;uiSnapshot032=function(){return {...refNavBase050(),ref050:JSON.parse(JSON.stringify(REF050))};};
const refRestoreBase050=uiRestore032;uiRestore032=function(s){if(s.ref050)Object.assign(REF050,JSON.parse(JSON.stringify(s.ref050)));else refReset050();return refRestoreBase050(s);};
function lossAssessmentMatches050(event,assessment){const c=event.lossClassification050;return String(assessment.sourceRevision)===String(event.revision)||!!c&&String(event.revision)===String(c.appliedRevision)&&String(assessment.sourceRevision)===String(c.sourceRevision);}
// Startup follows the visit report layout in SVS051.
