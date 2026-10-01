/* SVS041 — pure aggregation; no network, no database writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DiseaseSummary040=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PIGS=[['breeding','สุกรพ่อแม่พันธุ์'],['piglet','ลูกสุกรเล้าคลอด'],['finisher','สุกรหย่านม–ขุน'],['replacement','สุกรทดแทน / GDU'],['other','กลุ่มเดิม / ยังไม่แยกประเภท']];
 function number(v){if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null;}
 function management(v){const s=String(v||'').trim().replace(/\s+/g,' ').toLowerCase();if(['partial depopulation','partial depop'].includes(s))return 'partial';if(['total depopulation','total depop'].includes(s))return 'total';return 'unknown';}
 function pig(id){if(['sow','boar','boarSow','matting','farrowing-sow'].includes(id))return 'breeding';if(['piglet','farrowing-piglet'].includes(id))return 'piglet';if(['wf','wean-finish','nursery-finish','wean-selection'].includes(id))return 'finisher';if(['gilt','gdu','isolation','holding','replacement'].includes(id))return 'replacement';return 'other';}
 function mention(e,key){const p=e.pathways?.[key]||{},v=String(p.category||p.details||e.introduction?.[key]||'').trim().replace(/\s+/g,' ');return ['', '-', '—','n/a','ยังไม่ระบุ','ไม่ระบุ'].includes(v.toLowerCase())?'':v;}

 const AREA='พื้นที่โรคระบาด';
 const RISK_ALIASES=[
  ['บุคคล',['บุคคล','บุคล','บคคล']],
  ['สัตว์พาหะ',['สัตว์พาหะ','สัตวพาหะ','สัตว์พาห','สัตวพาห']],
  [AREA,['พื้นที่โรคระบาด','พื้นที่โรระบาด','พื้นที่ระบาด']],
  ['ยานพาหนะ',['ยานพาหนะ','ยานพาหานะ','รถขนส่ง','ขนส่ง']],
  ['อุปกรณ์-สิ่งของ',['อุปกรณ์-สิ่งของ','อุปกรณ์สิ่งของ','อุปกรณ์']],
  ['กระบวนการขาย',['กระบวนการขาย','การขาย']],
  ['การจัดการสุกรตาย',['การจัดการสุกรตาย']],
  ['การจัดการมูลสุกร',['การจัดการมูลสุกร']],
  ['เนื้อสุกรภายนอก',['เนื้อสุกรภายนอก']]
 ];
 const ANIMALS=['สุนัขจรจัด','แมวจรจัด','ไก่ชน','หนูนา','แมลงรำคาญ','แมลงวัน','สุนัข','แมว','หนู','นก','ยุง','ไก่','หอย','ปลา'];
 function clean(v){return String(v||'').normalize('NFC').replace(/[\u200b-\u200d\ufeff]/g,'').trim().replace(/\s+/g,' ');}
 function key(v){return clean(v).replace(/[่้๊๋์]/g,'').replace(/\s+/g,'').toLowerCase();}
 function riskCategory(text){
  const raw=clean(text),k=key(raw);if(!raw||['-','—','n/a','ไม่ระบุ','ยังไม่ระบุ'].includes(raw.toLowerCase()))return null;
  for(const [label,aliases] of RISK_ALIASES)if(aliases.some(a=>k===key(a)||k.startsWith(key(a)+':')||(label==='บุคคล'&&k.startsWith(key(a)))))return {label,known:true};
  // Animal names within a single list describe one animal-vector risk, not one risk per animal.
  let rest=k;for(const animal of ANIMALS)rest=rest.split(key(animal)).join('');rest=rest.replace(/และ|หรือ|รวม|[,+;/&\s.ๆ-]/g,'');
  if(k&&rest==='')return {label:'สัตว์พาหะ',known:true};
  return {label:raw,known:false};
 }
 function splitRisk(text){
  const raw=clean(text),tokens=raw.replace(/[（]/g,'(').replace(/[）]/g,')').split(/[()]/).map(clean).filter(Boolean),found=[];
  for(const token of tokens){let parts=[token];
   const direct=riskCategory(token);
   const separated=token.split(/\s*(?:[+,;\/\n]|และ)\s*/).filter(Boolean);
   if(separated.length>1&&separated.every(p=>riskCategory(p)?.known))parts=separated;else if(direct?.known){found.push(direct);continue;}
   for(const part of parts){const r=riskCategory(part);if(r)found.push(r);}
  }
  // Repeated parenthetical descriptors such as สัตว์พาหะ(หนู) are one category in this source field.
  return [...new Map(found.map(r=>[r.label,r])).values()];
 }
 function riskSource(e,slot){const p=e.pathways?.[slot]||{},category=clean(p.category);return category&& !['อื่น','อื่นๆ'].includes(category)?category:clean(p.other||p.details||e.introduction?.[slot]||'');}
 function riskSummary(events){
  const rows=new Map(),audit=new Map(),areaIds=new Set();let total=0,sourceSlots=0,areaMentions=0;
  for(const e of events)for(const slot of ['risk1','risk2','risk3']){
   const raw=riskSource(e,slot),parts=splitRisk(raw);if(!parts.length)continue;sourceSlots++;
   if(!audit.has(raw))audit.set(raw,{raw,parts,count:0,ids:[]});const a=audit.get(raw);a.count++;if(!a.ids.includes(e.id))a.ids.push(e.id);
   for(const r of parts){if(r.label===AREA){areaIds.add(e.id);areaMentions++;continue;}total++;
    if(!rows.has(r.label))rows.set(r.label,{key:r.label,known:r.known,count:0,ids:[]});const row=rows.get(r.label);row.count++;if(!row.ids.includes(e.id))row.ids.push(e.id);
   }
  }
  const auditRows=[...audit.values()].sort((a,b)=>b.count-a.count||a.raw.localeCompare(b.raw,'th'));
  return {total,sourceSlots,areaMentions,rows:[...rows.values()].sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key,'th')),audit:auditRows,reviewCount:auditRows.filter(a=>a.parts.some(p=>!p.known)).reduce((n,a)=>n+a.count,0),area:{total:events.length,count:areaIds.size,ids:[...areaIds],otherIds:events.filter(e=>!areaIds.has(e.id)).map(e=>e.id)}};
 }
 function monthlySeries(model,selected=[]){
  const chosen=[...new Set(selected.map(String))].sort();
  if(chosen.length)return model.monthly.filter(y=>chosen.includes(y.year)).map(y=>({...y,key:y.year,label:String(Number(y.year)+543)+' ('+y.year+')'}));
  if(!model.monthly.length)return [];
  return [{key:'all',label:'รวมทุกปีตามตัวกรอง',months:Array.from({length:12},(_,i)=>{const parts=model.monthly.map(y=>y.months[i]);return {month:i+1,count:parts.reduce((n,x)=>n+x.count,0),included:parts.some(x=>x.included),ids:[...new Set(parts.flatMap(x=>x.ids))]};})}];
 }
 const ids=a=>[...new Set(a.map(e=>e.id))];
 function grouped(events,key){const m=new Map();for(const e of events){const k=key(e);if(!m.has(k))m.set(k,[]);m.get(k).push(e);}return [...m].map(([key,events])=>({key,count:events.length,ids:ids(events)}));}
 function aggregate(input,options={}){
  const events=[...new Map(input.map(e=>[e.id,e])).values()],rawTypeOf=options.typeOf||((e)=>e.layer||'unknown'),typeOf=e=>{const t=rawTypeOf(e);return t==='cpf-all'?'cpf-site1':t;},regionOf=e=>e.region||'ยังไม่ระบุภาค';
  const types=grouped(events,typeOf),regions=grouped(events,regionOf),controls=['partial','total','unknown'].map(key=>({key,...(()=>{const a=events.filter(e=>management(e.managementMethod)===key);return {count:a.length,ids:ids(a)};})()}));
  const pigs=PIGS.map(([key,label])=>({key,label,loss:{sum:0,known:0,missing:0},culled:{sum:0,known:0,missing:0}}));let missingGroups=0;
  for(const e of events){if(!e.groups?.length){missingGroups++;continue;}for(const g of e.groups){const p=pigs.find(p=>p.key===pig(g.id));for(const k of ['loss','culled']){const n=number(g[k]);if(n===null)p[k].missing++;else{p[k].sum+=n;p[k].known++;}}}}
  const mentionRows=keys=>{const m=new Map();let total=0;for(const e of events)for(const k of keys){const name=mention(e,k);if(!name)continue;total++;if(!m.has(name))m.set(name,{key:name,count:0,ids:[]});const r=m.get(name);r.count++;if(!r.ids.includes(e.id))r.ids.push(e.id);}return {total,rows:[...m.values()].sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key,'th'))};};
  const validDate=e=>/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(e.date||''),years=[...new Set(options.years?.length?options.years:events.filter(validDate).map(e=>e.date.slice(0,4)))].sort();
  const monthly=years.map(year=>({year,months:Array.from({length:12},(_,i)=>{const month=i+1,a=events.filter(e=>validDate(e)&&e.date.slice(0,4)===year&&Number(e.date.slice(5,7))===month);return {month,count:a.length,ids:ids(a),included:!options.months?.length||options.months.includes(String(month))};})}));
  const regionYears=years.map(year=>({year,total:events.filter(e=>e.date?.slice(0,4)===year).length,rows:grouped(events.filter(e=>e.date?.slice(0,4)===year),regionOf)}));
  const matrix=regions.map(r=>({...r,cells:types.map(t=>{const a=events.filter(e=>regionOf(e)===r.key&&typeOf(e)===t.key);return {key:t.key,count:a.length,ids:ids(a)};})}));
  return {events,count:events.length,farmCount:new Set(events.map(e=>e.farmId)).size,types,regions,controls,pigs:pigs.filter((p,i)=>i<3||p.loss.known+p.loss.missing+p.culled.known+p.culled.missing),missingGroups,matrix,monthly,regionYears,risks:riskSummary(events),causes:mentionRows(['cause']),unclassifiedMethods:events.filter(e=>String(e.managementMethod||'').trim()&&management(e.managementMethod)==='unknown').length,undated:events.filter(e=>!validDate(e)).length};
 }
 return {number,management,pig,mention,aggregate,riskCategory,splitRisk,riskSource,riskSummary,monthlySeries};
});
