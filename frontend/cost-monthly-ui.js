/* SVS 034: independent monthly views; all data remains scoped by the backend. */
'use strict';
CP028.stackColors034=['red','orange','yellow','green'];
CP028.monthColors034=['red'];
CP028.pigShare036='off';
UI_CP_KEYS032.push('stackColors034','monthColors034','pigShare036');
const cpResetBefore034=cpReset028;
cpReset028=function(){cpResetBefore034();CP028.stackColors034=[...CostMonthly034.colors];CP028.monthColors034=['red'];CP028.pigShare036='off';};
function cpMonthlyData034(){return CostMonthly034.build(CP028.data,{year:CP028.year,group:CP028.group,regions:CP028.regions,types:CP028.types,bus:CP028.bus,exclude:CP028.exclude,targetYear:CP028.targetYear,basis:CP028.compareBasis035||'month',typeOf:farmType023},Cost028);}
function cpMonthColors034(kind){return CostMonthly034.colors.filter(c=>(CP028[kind==='stack'?'stackColors034':'monthColors034']||[]).includes(c));}
function cpMonthTools034(kind){const selected=cpMonthColors034(kind);return `<div class="cp-color-picks034" role="group" aria-label="เลือกกลุ่มสี"><span>กลุ่มสี</span>${CostMonthly034.colors.map(c=>`<label class="${selected.includes(c)?'selected':''}"><input type="checkbox" data-cp-color034="${kind}" value="${c}" ${selected.includes(c)?'checked':''}><i style="background:${CP_COLORS028[c]}"></i>${CP_COLOR_NAMES031[c]}</label>`).join('')}<button data-cp-all034="${kind}">ทุกสี</button>${kind==='stack'?cpPigTools036():''}</div>`;}
function cpMonthScope034(colors,annual=false){return `<p class="cp-month-context034">${cpEsc028(Cost028.groups[CP028.group].label)} · ปี ${CP028.year+543} (${CP028.year}) · ${annual?'ม.ค.–ธ.ค.':CP_MONTHS028[CP028.from-1]+'–'+CP_MONTHS028[CP028.to-1]} · ${cpEsc028(CP028.regions.join(', ')||'ทุกภาค')} · กลุ่มสี: ${colors.map(c=>CP_COLOR_NAMES031[c]).join(', ')||'ยังไม่เลือก'} · เทียบ KPI จากต้นทุน${cpBasisLabel035()}</p>`;}
function cpMonthLegend034(colors){return `<div class="cp-legend">${colors.map(c=>`<span><i style="background:${CP_COLORS028[c]}"></i>${CP_COLOR_NAMES031[c]}: ${CP_LABELS028[c]}</span>`).join('')}</div>`;}
function cpMonthColgroup034(n){return `<colgroup><col style="width:7%">${Array.from({length:n},()=>`<col style="width:${93/n}%">`).join('')}</colgroup>`;}
function cpMonthFarm034(f,m,streak=false,share=null){const item=f.months[m-1],c=item.category,run=streak&&c==='red'?Math.min(3,item.redRun):0;
 const shade=run?['','#fbe4e8','#ed9aaa','#9f1832'][run]:({red:'#fbe4e8',orange:'#fff0d8',yellow:'#fff7cb',green:'#e1f1e7'})[c];
 const ink=run===3?'#ffffff':'#263e43';
 const suffix=share?cpPigSuffix036(item,share):'';
 const title=`${f.name} · ${cpBasisLabel035()} · ${CP_MONTHS028[m-1]} ${CP028.year+543} · ${CP_COLOR_NAMES031[c]} · ตาย-คัดทิ้ง ${cpN028(item.values.deadcull)} · ยา-วัคซีน ${cpN028(item.values.medvac)} ${Cost028.groups[CP028.group].unit}${c==='red'?' · แดงต่อเนื่อง '+item.redRun+' เดือน':''}`;
 return `<button class="cp-month-farm034" data-cp-farm="${cpEsc028(f.id)}" data-month034="${m}" data-color034="${c}" data-run034="${run}" style="background:${shade};color:${ink};border-left:3px solid ${CP_COLORS028[c]}" title="${cpEsc028(title)}"><span>${cpEsc028(f.name)}</span>${suffix}${streak&&c==='red'?`<small>${item.redRun>=3?'3+':item.redRun} เดือน</small>`:''}</button>`;
}
function cpStack034(model){
 const colors=cpMonthColors034('stack'),months=model.months.slice(CP028.from-1,CP028.to);
 if(!colors.length)return cpMonthScope034(colors)+'<p role="status">เลือกอย่างน้อยหนึ่งสีเพื่อแสดงกราฟและรายชื่อฟาร์ม</p>';
 const step=132,w=months.length*step,H=210,T=30,height=268,counts=months.map(m=>colors.reduce((n,c)=>n+m.groups[c].length,0));
 const axisStep=Math.max(1,Math.ceil(Math.max(1,...counts)/4)),max=axisStep*4;
 let svg='<title>จำนวนฟาร์มแต่ละกลุ่มสีรายเดือน</title><desc>กราฟแท่งซ้อนจำนวนฟาร์ม ตารางด้านล่างแสดงจำนวน สัดส่วน และรายชื่อในเดือนเดียวกัน</desc>';
 months.forEach((m,i)=>{let bottom=T+H;colors.forEach(c=>{const n=m.groups[c].length;if(!n)return;const hh=n/max*H;svg+=`<rect data-stack-month034="${m.month}" data-stack-color034="${c}" data-stack-count034="${n}" x="${i*step+step*.22}" y="${bottom-hh}" width="${step*.56}" height="${hh}" fill="${CP_COLORS028[c]}"><title>${CP_MONTHS028[m.month-1]} · ${CP_COLOR_NAMES031[c]} ${n} ฟาร์ม</title></rect>`;if(hh>=18)svg+=cpText028(i*step+step/2,bottom-hh/2+4,n,12,c==='yellow'||c==='orange'?'#20383d':'#fff','middle','font-weight="700"');bottom-=hh;});if(counts[i])svg+=cpText028(i*step+step/2,bottom-9,counts[i],14,'#20383d','middle','font-weight="700"');});
 svg+=`<path d="M0 ${T+H}H${w}" stroke="#c7d4d4"/>`;
 let axis='';for(let i=0;i<=4;i++)axis+=cpText028(75,T+H-i*H/4+4,i*axisStep,12,'#5a7274','end');
 const maxShares=months.map(m=>CostMonthly034.maxHeadShare(m,colors,CP028.pigShare036));
 const body=`<div class="cp-tablewrap"><table class="cp-stack-table034" style="--month-count:${months.length}">${cpMonthColgroup034(months.length)}<thead><tr><th>เดือน</th>${months.map(m=>`<th>${CP_MONTHS028[m.month-1]}</th>`).join('')}</tr><tr class="cp-month-count034"><th>จำนวนฟาร์ม</th>${months.map((m,i)=>`<th data-month-total034="${m.month}">${m.total?counts[i]:''}</th>`).join('')}</tr></thead><tbody><tr class="cp-stack-chart034"><td>${cpSvg028(90,height,axis).replace('role="img"','preserveAspectRatio="none" role="img" aria-label="แกนจำนวนฟาร์ม"')}</td><td colspan="${months.length}">${cpSvg028(w,height,svg).replace('role="img"','preserveAspectRatio="none" role="img" aria-label="กราฟแท่งซ้อนจำนวนฟาร์มรายเดือน"')}</td></tr>${colors.map(c=>`<tr data-stack-row034="${c}"><th style="color:${c==='yellow'?'#74600a':CP_COLORS028[c]}">${CP_COLOR_NAMES031[c]}</th>${months.map((m,i)=>`<td data-stack-list-month034="${m.month}" data-stack-list-color034="${c}">${m.groups[c].length?`<div class="cp-month-subtotal034">${m.groups[c].length} ฟาร์ม · ${cpN028(m.groups[c].length/counts[i]*100,1)}%</div>`+m.groups[c].map(f=>cpMonthFarm034(f,m.month,false,{mode:CP028.pigShare036,totals:m.headTotals,max:maxShares[i]})).join(''):''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 const unknown=months.filter(m=>m.groups.unknown.length);
 return cpMonthScope034(colors)+cpPigContext036()+cpMonthLegend034(colors)+body+`<p class="cp-muted cp-month-foot034">เปอร์เซ็นต์ใต้ชื่อสีคิดจากจำนวนฟาร์มในสีที่เลือกของแต่ละเดือน · ฟาร์มเดียวถูกนับครั้งเดียวต่อเดือน${unknown.length?' · ยังจัดกลุ่มไม่ได้ (ไม่รวมในแท่ง): '+unknown.map(m=>CP_MONTHS028[m.month-1]+' '+m.groups.unknown.length+' ฟาร์ม').join(', '):''}</p>`;
}
function cpPigTools036(){return `<label class="cp-pig-select036">สัดส่วนสุกร<select data-cp="pigShare036" aria-label="ฐานสัดส่วนจำนวนสุกร">${cpOptions028([['off','ไม่แสดง'],['all','เทียบทุกฟาร์ม'],['color','เทียบภายในสี']],CP028.pigShare036||'off')}</select></label>`;}
function cpPigSuffix036(item,share){
 if(!['all','color'].includes(share.mode))return '';
 const total=share.mode==='all'?share.totals.all:share.totals.colors[item.category];
 const pct=CostMonthly034.headShare(item.head,total),known=item.head!==null;
 const isMax=pct!==null&&share.max!==null&&Math.abs(pct-share.max)<1e-9;
 const percent=pct===null?'คำนวณสัดส่วนไม่ได้':`<span class="cp-pig-percent037${isMax?' cp-pig-max037':''}"${isMax?' title="สัดส่วนสูงสุดของฟาร์มที่แสดงในเดือนนี้"':''}>${cpN028(pct,0)}%</span>`;
 const text=known?`${cpN028(item.head,Number.isInteger(item.head)?0:2)} ตัว · ${percent}`:'ไม่มีข้อมูลจำนวนสุกร';
 const basis=share.mode==='all'?'ทุกฟาร์มตามตัวกรอง (รวมฟาร์มที่ยังจัดสีไม่ได้)':'ฟาร์มในสีเดียวกัน';
 const title=`จำนวนสุกรจากข้อมูลต้นทุน · ฐาน: ${basis}${total===null?' · ข้อมูลจำนวนสุกรไม่ครบ':` · รวม ${cpN028(total,Number.isInteger(total)?0:2)} ตัว`}`;
 return `<span class="cp-pig-share036" title="${cpEsc028(title)}">(${text})</span>`;
}
function cpPigContext036(){
 const mode=CP028.pigShare036;if(!['all','color'].includes(mode))return '';
 return `<p class="cp-month-context034 cp-pig-context036">ใต้ชื่อฟาร์ม: จำนวนสุกร (ตัว) · % ${mode==='all'?'เทียบทุกฟาร์มตามตัวกรอง รวมฟาร์มที่ยังจัดสีไม่ได้':'เทียบฟาร์มในสีเดียวกัน'} · ${cpIsCumulative035()?'จำนวนสะสม ม.ค. ถึงแต่ละเดือน':'จำนวนรายเดือน'}<br>ใช้จำนวนหมูดีจากข้อมูลต้นทุน · ซ่อนสีไม่เปลี่ยนฐานคำนวณ · % ตัวหนาสีแดง = สูงสุดในคอลัมน์ที่แสดง</p>`;
}
function cpRegionMonths034(model){
 const colors=cpMonthColors034('region');if(!colors.length)return cpMonthScope034(colors,true)+'<p role="status">เลือกอย่างน้อยหนึ่งสีเพื่อแสดงตาราง</p>';
 const shown=model.byFarm.filter(f=>f.months.some(m=>colors.includes(m.category)));
 const regions=[...new Set(shown.map(f=>f.region))].sort((a,b)=>{const ia=CP_REGIONS028.indexOf(a),ib=CP_REGIONS028.indexOf(b);return (ia<0?99:ia)-(ib<0?99:ib)||a.localeCompare(b,'th');});
 const totals=model.months.map(m=>colors.reduce((n,c)=>n+m.groups[c].length,0));
 const rows=regions.map(region=>{const farms=shown.filter(f=>f.region===region);return `<tr class="cp-region-band034"><th colspan="13">${cpEsc028(region||'ไม่ระบุภาค')} <small>· ${farms.length} ฟาร์มที่พบสีที่เลือกในปีนี้</small></th></tr>`+farms.map(f=>`<tr data-region-farm034="${cpEsc028(f.id)}"><th scope="row" class="cp-farm-anchor034">${cpEsc028(f.name)}</th>${f.months.map(m=>`<td data-region-month034="${m.month}">${colors.includes(m.category)?cpMonthFarm034(f,m.month,true):''}</td>`).join('')}</tr>`).join('');}).join('');
 return cpMonthScope034(colors,true)+cpMonthLegend034(colors)+`<div class="cp-streak-legend034"><span>แดงต่อเนื่อง:</span><span style="background:#fbe4e8;color:#263e43">1 เดือน</span><span style="background:#ed9aaa;color:#263e43">2 เดือน</span><span style="background:#9f1832;color:white">3 เดือนขึ้นไป</span></div><div class="cp-tablewrap"><table class="cp-region-months034"><colgroup><col style="width:12%">${Array.from({length:12},()=>'<col style="width:7.3333%">').join('')}</colgroup><thead><tr><th>ฟาร์ม / ภาค</th>${CP_MONTHS028.map(m=>`<th>${m}</th>`).join('')}</tr><tr class="cp-month-count034"><th>จำนวนฟาร์ม</th>${totals.map((n,i)=>`<th>${model.months[i].total?n:''}</th>`).join('')}</tr></thead><tbody>${rows||'<tr><td colspan="13">ไม่พบฟาร์มในกลุ่มสีที่เลือก</td></tr>'}</tbody></table></div><p class="cp-muted cp-month-foot034">ฟาร์มเดิมอยู่แถวเดิมตลอดปี · นับเดือนติดกัน รวมข้ามปีเมื่อมีข้อมูล · เดือนที่ไม่มีข้อมูลหรือจัดกลุ่มไม่ได้จะตัดช่วงต่อเนื่อง</p>`;
}
const cpCompareBefore034=cpCompare028;
cpCompare028=function(){
 const mode=CP028.compareMode032||'colors';
 const tabs=`<div class="ui-viewtabs032 cp-screen">${[['colors','กลุ่มสี'],['monthly-stack','สัดส่วนรายเดือน'],['monthly-regions','รายชื่อรายเดือนแยกภาค'],['months','ติดตามรายเดือน'],['ranking','อันดับต้นทุน']].map(([k,l])=>`<button data-cp-mode032="${k}" aria-pressed="${mode===k}" class="${mode===k?'primary':''}">${l}</button>`).join('')}</div>`;
 if(mode==='monthly-stack'||mode==='monthly-regions'){
  const model=cpMonthlyData034();return tabs+(mode==='monthly-stack'?cpPanel028('monthly-stack','จำนวนฟาร์มตามกลุ่มสีรายเดือน',cpStack034(model),cpMonthTools034('stack'),true):cpPanel028('monthly-regions','รายชื่อฟาร์มตามกลุ่มสีรายเดือน · แยกภาค',cpRegionMonths034(model),cpMonthTools034('region'),true));
 }
 return cpCompareBefore034().replace(/^<div class="ui-viewtabs032 cp-screen">.*?<\/div>/,tabs);
};
const cpBindBefore034=cpBind028;
cpBind028=function(){cpBindBefore034();
 document.querySelectorAll('[data-cp-color034]').forEach(el=>el.onchange=()=>{const kind=el.dataset.cpColor034,key=kind==='stack'?'stackColors034':'monthColors034';CP028[key]=[...document.querySelectorAll(`[data-cp-color034="${kind}"]:checked`)].map(i=>i.value);cpRender028();const restore=document.querySelector(`[data-cp-color034="${kind}"][value="${el.value}"]`);restore?.focus();});
 document.querySelectorAll('[data-cp-all034]').forEach(b=>b.onclick=()=>{CP028[b.dataset.cpAll034==='stack'?'stackColors034':'monthColors034']=[...CostMonthly034.colors];cpRender028();});
 // A monthly farm link opens that month, so a farm outside the top date range still resolves.
 if(cpIsCumulative035())document.querySelectorAll('[data-cp-farm]:not([data-month034])').forEach(b=>{const open=b.onclick;b.onclick=()=>{CP028.from=1;open?.();};});
 document.querySelectorAll('[data-cp-farm][data-month034]').forEach(b=>{b.onclick=()=>{CP028.farm=b.dataset.cpFarm;CP028.search='';CP028.to=Number(b.dataset.month034);CP028.from=cpIsCumulative035()?1:CP028.to;CP028.view='farm';cpRender028();};});
};

const cpMetaBefore034=cpMeta028;
cpMeta028=function(){let html=cpMetaBefore034();if(CP028.view!=='compare')return html;
 const annual=['monthly-regions','months'].includes(CP028.compareMode032);
 if(annual)html=html.replace(CP_MONTHS028[CP028.from-1]+'–'+CP_MONTHS028[CP028.to-1],'ม.ค.–ธ.ค.');
 const timeline=['monthly-stack','monthly-regions','months'].includes(CP028.compareMode032);
 const basis=cpIsCumulative035()?(timeline?'ข้อมูลสะสม: ม.ค. ถึงแต่ละเดือน · เริ่มใหม่ทุกปี':'ข้อมูลสะสม: ม.ค.–'+CP_MONTHS028[CP028.to-1]):'ข้อมูลรายเดือน'+(timeline?'':' · รวมตามช่วงเดือนที่เลือก');
 return html+`<p class="cp-basis035"><strong>${basis}</strong></p>`;
};
