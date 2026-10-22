/* Knowledge Sharing: pure read-only aggregation, one source record per presentation. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SVSKnowledge=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function select(data,filter={}){
  const q=String(filter.search||'').trim().toLocaleLowerCase('th');
  const people=new Map(data.speakers.map(p=>[p.id,p]));
  return data.records.filter(r=>
   (!filter.year||filter.year==='all'||r.year===Number(filter.year))&&
   (!filter.scope||filter.scope==='all'||(filter.scope==='outside'?r.outsideSwineBU:r.audienceGroup===filter.scope))&&
   (!filter.reach||filter.reach==='all'||r.reach===filter.reach)&&
   (!filter.channel||filter.channel==='all'||r.channel===filter.channel)&&
   (!filter.category||filter.category==='all'||r.categories.includes(filter.category))&&
   (!filter.person||filter.person==='all'||r.speakerIds.includes(filter.person))&&
   (!q||[r.title,r.location||'ไม่ระบุสถานที่',r.notes,r.audienceGroup,...r.speakerIds.map(id=>people.get(id)?.displayName||'')].join(' ').toLocaleLowerCase('th').includes(q))
  );
 }
 function summarize(records){
  const ids=new Set();let audience=0,known=0,review=0;
  for(const r of records){r.speakerIds.forEach(id=>ids.add(id));if(typeof r.audience==='number'&&Number.isFinite(r.audience)&&r.audience>=0){audience+=r.audience;known++;}if(r.reviewCount)review++;}
  return {presentations:records.length,audience:known?audience:null,audienceKnown:known,audienceMissing:records.length-known,speakerIds:[...ids],review};
 }
 function grouped(records,key){
  const groups=new Map();for(const r of records){const value=key(r);if(!groups.has(value))groups.set(value,[]);groups.get(value).push(r);}
  return [...groups].map(([label,rows])=>({label,...summarize(rows)})).sort((a,b)=>b.presentations-a.presentations||a.label.localeCompare(b.label,'th'));
 }
 function bySpeaker(data,records){return data.speakers.map(p=>({...p,...summarize(records.filter(r=>r.speakerIds.includes(p.id)))})).filter(p=>p.presentations).sort((a,b)=>b.presentations-a.presentations||a.displayName.localeCompare(b.displayName,'th'));}
 function yearly(records,years=[2024,2025,2026]){return years.map(year=>({year,...summarize(records.filter(r=>r.year===year))}));}
 // Derived UI view: source IDs, original rows and alias links remain in the seed.
 function memberView(data){
  if(!Array.isArray(data.members))return data;
  const members=new Map(data.members.map(p=>[p.id,p]));
  if(members.size!==data.members.length)throw Error('Duplicate member IDs');
  const records=data.records.map(r=>{
   if(!Array.isArray(r.memberIds)||r.memberIds.some(id=>!members.has(id)))throw Error('Unknown member link');
   return {...r,speakerIds:[...new Set(r.memberIds)]};
  });
  return {...data,speakers:data.members,records,speakerLinks:data.memberLinks,
   reviewItems:data.reviewItems.filter(i=>i.status!=='resolved')};
 }
 function memberHistory(data,id){
  const view=memberView(data),member=view.speakers.find(p=>p.id===id);
  if(!member)return null;
  const records=select(view,{person:id});
  return {member,records,summary:summarize(records),years:yearly(records),places:grouped(records,r=>r.location||'ไม่ระบุสถานที่')};
 }
 function topGroups(records,key,limit=8){const all=grouped(records,key);if(all.length<=limit)return all;const top=all.slice(0,limit),labels=new Set(top.map(g=>g.label));return [...top,{label:'อื่นๆ ('+(all.length-limit)+')',...summarize(records.filter(r=>!labels.has(key(r))))}];}
 function dashboard(data,records){
  const tags=records.flatMap(r=>(r.categories.length?r.categories:['ไม่ระบุหมวด']).map(label=>({label,record:r}))),total=tags.length;
  const categories=[...new Set(tags.map(t=>t.label))].map(label=>({label,presentations:tags.filter(t=>t.label===label).length})).sort((a,b)=>b.presentations-a.presentations||a.label.localeCompare(b.label));
  return {annual:yearly(records,[...new Set(data.records.map(r=>r.year))].sort()),people:bySpeaker(data,records),places:topGroups(records,r=>r.location||'ไม่ระบุสถานที่'),groups:grouped(records,r=>r.audienceGroup),channels:grouped(records,r=>({onsite:'ณ สถานที่',online:'ออนไลน์',hybrid:'ผสมผสาน'}[r.channel]||r.channel)),categories:categories.map(g=>({...g,share:total?g.presentations/total:0})),tagCount:total};
 }
 return {select,summarize,grouped,bySpeaker,yearly,memberView,memberHistory,topGroups,dashboard};
});
