/* Paginated reports use the selected data snapshot, never a clipped screen capture. */
(function(root){
 'use strict';
 const W=1200,H=1640,L=46,R=W-L,B=H-76,ink='#203d48',muted='#647e88',teal='#176b67',core=root.SVSOverseasCore064,cat=root.SVSCountries064;
 const num=value=>Number(value).toLocaleString('th-TH'),date=value=>new Date(value+'T12:00:00+07:00').toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'});
 function font(x,size=18,weight=400){x.font=`${weight} ${size}px "Noto Sans Thai", Tahoma, sans-serif`;}
 function text(x,value,left,top,size=18,color=ink,weight=400){font(x,size,weight);x.fillStyle=color;x.textBaseline='top';x.fillText(String(value??''),left,top);}
 function lines(x,value,width,size=18,weight=400){font(x,size,weight);const result=[];let line='';for(const letter of Array.from(String(value??''))){if(letter==='\n'){result.push(line);line='';}else if(line&&x.measureText(line+letter).width>width){result.push(line);line=letter;}else line+=letter;}if(line||!result.length)result.push(line);return result;}
 function block(x,value,left,top,width,size=18,color=ink,weight=400){const wrapped=lines(x,value,width,size,weight);wrapped.forEach((line,i)=>text(x,line,left,top+i*size*1.6,size,color,weight));return wrapped.length*size*1.6;}
 function rect(x,left,top,width,height,color,radius=10){x.fillStyle=color;x.beginPath();x.roundRect(left,top,width,height,radius);x.fill();}
 function create(s,title){const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#f2f7f5';x.fillRect(0,0,W,H);const filterLines=lines(x,s.filters,W-L*2,16),headerH=120+filterLines.length*26;rect(x,0,0,W,headerH,'#123f45',0);text(x,'SVS | สนับสนุนต่างประเทศ',L,25,29,'#fff',600);text(x,title,L,72,22,'#d9eee8',600);filterLines.forEach((line,i)=>text(x,line,L,112+i*26,16,'#c7e0da'));return {canvas:c,x,y:headerH+26};}
 function report(s){const pages=[];let current=null;return {pages,begin(title){current=create(s,title);pages.push(current.canvas);return current;},get current(){return current;},ensure(height,title){if(current.y+height>B)return this.begin(title);return current;},paragraph(value,title,size=18,color=ink,weight=400,left=L,width=W-L*2){for(const line of lines(current.x,value,width,size,weight)){this.ensure(size*1.6,title);text(current.x,line,left,current.y,size,color,weight);current.y+=size*1.6;}},gap(value=18){current.y+=value;}};}
 function summary(report,s,world){
  const p=report.begin('ภาพรวมและแผนที่โลก'),x=p.x,stats=core.summarize(s.rows,s.selection.member,s.members),width=(W-L*2-42)/4;
  [[stats.visits,'ครั้ง'],[stats.countries,'ประเทศ'],[stats.days,'วัน'],[stats.people,'คน']].forEach(([value,label],i)=>{const left=L+i*(width+14);rect(x,left,p.y,width,103,'#fff');text(x,num(value),left+20,p.y+17,35,teal,600);text(x,label,left+20,p.y+65,18,muted);});p.y+=123;
  report.paragraph('หนึ่งรายการนับ 1 ครั้ง และวันเพียงครั้งเดียว · จำนวนคนไม่นับซ้ำตามตัวกรอง','ภาพรวมและแผนที่โลก',16,muted);report.gap();
  const y=p.y;rect(x,L,y,W-L*2,640,'#fff');text(x,'แผนที่การสนับสนุนต่างประเทศ',L+22,y+20,23,ink,600);const metric=s.selection.metric==='days'?'days':'visits',unit=metric==='days'?'วัน':'ครั้ง';text(x,'ลงสีตามจำนวน'+unit,L+22,y+59,17,muted);
  const groups=core.groups(s.rows,s.selection.member,s.members),byCode=new Map(groups.filter(g=>g.country).map(g=>[g.country.code,g])),colors=['#9cdbcf','#55b5a3','#237f73','#123f45'],cuts=metric==='days'?[5,15,30]:[1,3,6],shade=value=>!value?'#dce4e5':colors[value<=cuts[0]?0:value<=cuts[1]?1:value<=cuts[2]?2:3],scale=(W-L*2-36)/world.width;
  x.save();x.translate(L+18,y+98);x.scale(scale,scale);x.lineWidth=.6/scale;for(const f of world.features){const path=new Path2D(f.path);x.fillStyle=shade(byCode.get(f.code)?.[metric]||0);x.fill(path,'evenodd');x.strokeStyle='#fff';x.stroke(path);}for(const g of groups.filter(g=>g.country)){const paths=world.features.filter(f=>f.code===g.key),coords=paths.flatMap(f=>f.path.match(/-?\d+(?:\.\d+)?/g).map(Number)),xs=coords.filter((_,i)=>i%2===0),ys=coords.filter((_,i)=>i%2);if(!paths.length||Math.max(...xs)-Math.min(...xs)<5||Math.max(...ys)-Math.min(...ys)<5){x.beginPath();x.arc(g.country.point[0],Math.max(5,Math.min(world.height-5,g.country.point[1])),4,0,Math.PI*2);x.fillStyle=shade(g[metric]);x.fill();x.strokeStyle='#fff';x.stroke();}}x.restore();
  const legend=metric==='days'?['ไม่เกิน 5 วัน','6-15 วัน','16-30 วัน','มากกว่า 30 วัน']:['1 ครั้ง','2-3 ครั้ง','4-6 ครั้ง','7 ครั้งขึ้นไป'];legend.push('ไม่มีข้อมูลตามตัวกรอง');let left=L+22;legend.forEach((label,i)=>{rect(x,left,y+566,17,13,colors[i]||'#dce4e5',2);text(x,label,left+24,y+563,14,muted);left+=i===3?185:174;});text(x,'Natural Earth (public domain) | Countries / ODbL | แสดงทั้งโลก ไม่ขึ้นกับการซูมบนหน้าจอ',L+22,y+605,13,muted);p.y=y+663;
  if(stats.unmapped){report.paragraph('ข้อมูลเดิม '+num(stats.unmapped)+' รายการยังไม่ตรงรายชื่อประเทศ จึงไม่ลงสี แต่คงอยู่ในตารางและประวัติ','ภาพรวมและแผนที่โลก',17,muted);report.gap();}
  report.paragraph('กราฟรายสมาชิกให้เครดิตผู้ร่วมเดินทางแต่ละคนคนละ 1 ครั้ง กราฟรายประเทศนับรายการร่วมเพียงครั้งเดียว','ภาพรวมและแผนที่โลก',17,muted);
 }
 function chartPages(report,s,items,title,note,person){
  const maximum=Math.max(1,...items.map(item=>item.visits));let p=report.begin(title);report.paragraph(note,title,16,muted);report.gap(22);
  if(!items.length){report.paragraph('ยังไม่มีข้อมูลตามตัวกรอง',title,21,muted);return;}
  for(const item of items){const label=person?core.shortName(item.name):item.name,wrapped=lines(p.x,label,285,19),height=Math.max(58,wrapped.length*30+15);if(p.y+height>B){p=report.begin(title+' (ต่อ)');report.paragraph(note,title,16,muted);report.gap(22);}const y=p.y;block(p.x,label,L,y+4,285,19);rect(p.x,355,y+2,680,27,'#e4eee8',4);rect(p.x,355,y+2,680*item.visits/maximum,27,teal,4);text(p.x,num(item.visits)+' ครั้ง',1054,y+5,19,ink,600);p.y+=height;}
 }
 function tablePages(report,s,groups){
  const title='สรุปการสนับสนุนรายประเทศ',expanded=new Set(s.selection.expandedCountries||[]);let p;
  const begin=()=>{p=report.begin(title+(p?' (ต่อ)':''));rect(p.x,L,p.y,W-L*2,44,'#e0ede6',0);['ประเทศ / สมาชิก','ครั้ง','วัน','คน'].forEach((label,i)=>text(p.x,label,[L+14,730,860,1005][i],p.y+10,18,ink,600));p.y+=54;};begin();
  const row=(name,visits,days,people,member=false)=>{const wrapped=lines(p.x,name,635,member?17:19),height=Math.max(46,wrapped.length*30+15);if(p.y+height>B)begin();rect(p.x,L,p.y,W-L*2,height,member?'#f6faf8':'#fff',0);wrapped.forEach((line,i)=>text(p.x,line,L+(member?35:14),p.y+10+i*30,member?17:19,member?muted:ink,member?400:600));text(p.x,num(visits),730,p.y+10,18);text(p.x,num(days),860,p.y+10,18);if(people!==null)text(p.x,num(people),1005,p.y+10,18);p.y+=height+2;};
  if(!groups.length)report.paragraph('ยังไม่มีข้อมูลตามตัวกรอง',title,20,muted);
  for(const g of groups){row(g.name,g.visits,g.days,g.people);if(expanded.has(g.key))for(const member of g.members){if(p.y+70>B){begin();row(g.name+' - รายชื่อ (ต่อ)',g.visits,g.days,g.people);}row(member.name,member.visits,member.days,null,true);}}
 }
 function history(report,s){
  const title='ประวัติทั้งหมดตามตัวกรอง';report.begin(title);
  if(!s.rows.length){report.paragraph('ยังไม่มีประวัติตามตัวกรอง',title,20,muted);return;}
  s.rows.forEach((r,i)=>{report.ensure(120,title+' (ต่อ)');report.paragraph((i+1)+'. '+date(r.date)+' · '+num(r.days)+' วัน · '+(core.countryOf(r)?.name||r.country),title+' (ต่อ)',21,ink,600);report.paragraph('ผู้ร่วมเดินทาง: '+r.participants.map(p=>p.name).join(', '),title+' (ต่อ)',17,muted);report.paragraph('สรุปงาน: '+r.summary,title+' (ต่อ)',18);const pdf=s.files.find(f=>f.id===r.pdfId);report.paragraph('รูปภาพ: '+r.photoIds.length+' รูป · PDF บันทึกเชิญ: '+(pdf?pdf.name:r.pdfId?'มีไฟล์แนบ':'ไม่มี'),title+' (ต่อ)',16,muted);if(r.pdfId)report.paragraph('ดาวน์โหลด PDF บันทึกเชิญต้นฉบับได้จากรายการในระบบ',title+' (ต่อ)',15,muted);report.paragraph('รหัสรายการ: '+r.id+' · Revision '+r.revision,title+' (ต่อ)',14,muted);report.gap(23);});
 }
 async function photos(report,s){
  for(const r of s.rows){if(!r.photoIds.length)continue;const title='รูปภาพประกอบ',p=report.begin(title),x=p.x;report.paragraph(date(r.date)+' · '+(core.countryOf(r)?.name||r.country),title,21,ink,600);report.paragraph('รหัสรายการ: '+r.id,title,14,muted);report.gap();const start=p.y;
   for(let i=0;i<r.photoIds.length;i++){const url=s.photoImages?.[r.photoIds[i]];if(!url)throw Error('โหลดรูปภาพสำหรับรายงานไม่ครบ กรุณาลองใหม่');const image=new Image();image.src=url;await image.decode();const left=L+(i%2)*568,top=start+Math.floor(i/2)*565;rect(x,left,top,540,540,'#fff');text(x,'รูปที่ '+(i+1),left+16,top+14,17,muted);const scale=Math.min(508/image.width,480/image.height);x.drawImage(image,left+16+(508-image.width*scale)/2,top+44+(480-image.height*scale)/2,image.width*scale,image.height*scale);}
  }
 }
 async function generate(snapshot,includeHistory){
  await document.fonts.ready;const s=structuredClone(snapshot),world=await root.SVSOverseasDashboard064.loadWorld(),r=report(s),groups=core.groups(s.rows,s.selection.member,s.members),memberRows=s.selection.chartCountry?s.rows.filter(row=>core.keyOf(row)===s.selection.chartCountry):s.rows;
  summary(r,s,world);chartPages(r,s,core.people(memberRows,s.selection.member,s.members),'จำนวนครั้งในการไปต่างประเทศรายสมาชิก','ประเทศในกราฟ: '+(groups.find(g=>g.key===s.selection.chartCountry)?.name||'ทุกประเทศในตัวกรอง')+' · ให้เครดิตแต่ละคนตามรายการที่ร่วมเดินทาง',true);chartPages(r,s,groups,'จำนวนครั้งในการสนับสนุนรายประเทศ','นับแต่ละรายการเพียงครั้งเดียว ตามตัวกรองที่ระบุ',false);tablePages(r,s,groups);if(includeHistory){history(r,s);await photos(r,s);}r.pages.forEach((canvas,i)=>text(canvas.getContext('2d'),'หน้า '+(i+1)+' / '+r.pages.length,L,H-43,15,muted));return r.pages;
 }
 root.SVSOverseasExport066={generate};
})(globalThis);
