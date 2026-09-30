/* SVS040 — pure aggregation; no network, no database writes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DiseaseSummary040=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const PIGS=[['breeding','สุกรพ่อแม่พันธุ์'],['piglet','ลูกสุกรเล้าคลอด'],['finisher','สุกรหย่านม–ขุน'],['replacement','สุกรทดแทน / GDU'],['other','กลุ่มเดิม / ยังไม่แยกประเภท']];
 function number(v){if(v===null||v===undefined||String(v).trim()==='')return null;const n=Number(v);return Number.isFinite(n)&&n>=0?n:null;}
 function management(v){const s=String(v||'').trim().replace(/\s+/g,' ').toLowerCase();if(['partial depopulation','partial depop'].includes(s))return 'partial';if(['total depopulation','total depop'].includes(s))return 'total';return 'unknown';}
 function pig(id){if(['sow','boar','boarSow','matting','farrowing-sow'].includes(id))return 'breeding';if(['piglet','farrowing-piglet'].includes(id))return 'piglet';if(['wf','wean-finish','nursery-finish','wean-selection'].includes(id))return 'finisher';if(['gilt','gdu','isolation','holding','replacement'].includes(id))return 'replacement';return 'other';}
 function mention(e,key){const p=e.pathways?.[key]||{},v=String(p.category||p.details||e.introduction?.[key]||'').trim().replace(/\s+/g,' ');return ['', '-', '—','n/a','ยังไม่ระบุ','ไม่ระบุ'].includes(v.toLowerCase())?'':v;}
 const ids=a=>[...new Set(a.map(e=>e.id))];
 function grouped(events,key){const m=new Map();for(const e of events){const k=key(e);if(!m.has(k))m.set(k,[]);m.get(k).push(e);}return [...m].map(([key,events])=>({key,count:events.length,ids:ids(events)}));}
 function aggregate(input,options={}){
  const events=[...new Map(input.map(e=>[e.id,e])).values()],typeOf=options.typeOf||((e)=>e.layer||'unknown'),regionOf=e=>e.region||'ยังไม่ระบุภาค';
  const types=grouped(events,typeOf),regions=grouped(events,regionOf),controls=['partial','total','unknown'].map(key=>({key,...(()=>{const a=events.filter(e=>management(e.managementMethod)===key);return {count:a.length,ids:ids(a)};})()}));
  const pigs=PIGS.map(([key,label])=>({key,label,loss:{sum:0,known:0,missing:0},culled:{sum:0,known:0,missing:0}}));let missingGroups=0;
  for(const e of events){if(!e.groups?.length){missingGroups++;continue;}for(const g of e.groups){const p=pigs.find(p=>p.key===pig(g.id));for(const k of ['loss','culled']){const n=number(g[k]);if(n===null)p[k].missing++;else{p[k].sum+=n;p[k].known++;}}}}
  const mentionRows=keys=>{const m=new Map();let total=0;for(const e of events)for(const k of keys){const name=mention(e,k);if(!name)continue;total++;if(!m.has(name))m.set(name,{key:name,count:0,ids:[]});const r=m.get(name);r.count++;if(!r.ids.includes(e.id))r.ids.push(e.id);}return {total,rows:[...m.values()].sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key,'th'))};};
  const validDate=e=>/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(e.date||''),years=[...new Set(options.years?.length?options.years:events.filter(validDate).map(e=>e.date.slice(0,4)))].sort();
  const monthly=years.map(year=>({year,months:Array.from({length:12},(_,i)=>{const month=i+1,a=events.filter(e=>validDate(e)&&e.date.slice(0,4)===year&&Number(e.date.slice(5,7))===month);return {month,count:a.length,ids:ids(a),included:!options.months?.length||options.months.includes(String(month))};})}));
  const regionYears=years.map(year=>({year,total:events.filter(e=>e.date?.slice(0,4)===year).length,rows:grouped(events.filter(e=>e.date?.slice(0,4)===year),regionOf)}));
  const matrix=regions.map(r=>({...r,cells:types.map(t=>{const a=events.filter(e=>regionOf(e)===r.key&&typeOf(e)===t.key);return {key:t.key,count:a.length,ids:ids(a)};})}));
  return {events,count:events.length,farmCount:new Set(events.map(e=>e.farmId)).size,types,regions,controls,pigs:pigs.filter((p,i)=>i<3||p.loss.known+p.loss.missing+p.culled.known+p.culled.missing),missingGroups,matrix,monthly,regionYears,risks:mentionRows(['risk1','risk2','risk3']),causes:mentionRows(['cause']),unclassifiedMethods:events.filter(e=>String(e.managementMethod||'').trim()&&management(e.managementMethod)==='unknown').length,undated:events.filter(e=>!validDate(e)).length};
 }
 return {number,management,pig,mention,aggregate};
});
