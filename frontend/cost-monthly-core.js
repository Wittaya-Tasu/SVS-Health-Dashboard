/* SVS 034: monthly classification. Read-only; uses the existing Cost028 formulas. */
(function(root){
 'use strict';
 const colors=['red','orange','yellow','green'];
 function build(data,scope,engine){
  const year=Number(scope.year),group=scope.group;
  const farms=new Map(data.farms.filter(f=>
   (!scope.regions?.length||scope.regions.includes(f.region))&&
   (!scope.types?.length||scope.types.includes(scope.typeOf(f)))&&
   !(scope.exclude||[]).some(k=>{const h=data.health?.[f.id]||{};return k==='unstable'?h.prrs==='Unstable':k==='active'?h.prrs==='Stable Active':h.events?.includes(k);})
  ).map(f=>[f.id,f]));
  const buckets=new Map();
  for(const r of data.rows){
   if(r.group!==group||![year-1,year].includes(r.year)||!Number.isInteger(r.month)||r.month<1||r.month>12||!farms.has(r.farmId)||scope.bus?.length&&!scope.bus.includes(r.bu))continue;
   if(!buckets.has(r.farmId))buckets.set(r.farmId,new Map());
   const periods=buckets.get(r.farmId),serial=r.year*12+r.month-1;
   if(!periods.has(serial))periods.set(serial,[]);
   periods.get(serial).push(r);
  }
  const byFarm=[];
  for(const [id,periods] of buckets){
   let run=0;const months=[];
   for(let serial=(year-1)*12;serial<(year+1)*12;serial++){
    const rows=periods.get(serial)||[],y=Math.floor(serial/12),values=engine.rates(rows);
    const target=data.kpis[scope.targetYear||y]?.targets?.[group];
    const category=rows.length?engine.category(values,target):null;
    run=category==='red'?run+1:0;
    if(y===year)months.push({month:serial%12+1,category,redRun:run,values,sourceRows:rows.length});
   }
   if(months.some(m=>m.sourceRows))byFarm.push({...farms.get(id),months});
  }
  byFarm.sort((a,b)=>a.name.localeCompare(b.name,'th')||a.id.localeCompare(b.id));
  const months=Array.from({length:12},(_,i)=>{
   const groups=Object.fromEntries([...colors,'unknown'].map(c=>[c,[]]));
   byFarm.forEach(f=>{const c=f.months[i].category;if(c)groups[c].push(f);});
   return {month:i+1,groups,total:Object.values(groups).reduce((n,fs)=>n+fs.length,0),classified:colors.reduce((n,c)=>n+groups[c].length,0)};
  });
  return {year,group,byFarm,months};
 }
 root.CostMonthly034={build,colors};
 if(typeof module!=='undefined')module.exports=root.CostMonthly034;
})(typeof globalThis!=='undefined'?globalThis:this);
