(function(root){
 'use strict';
 const W=1200,H=1640,ink='#203d48',muted='#647e88',palette=['#167d8d','#e6a654','#6377b4','#50a896','#d76c79','#99b5c5','#8b7cb6','#a0af66','#c28355','#789298'];
 const fmt=v=>v===null?'ไม่ระบุ':Number(v).toLocaleString('th-TH');
 function canvas(){const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#eef4f6';x.fillRect(0,0,W,H);x.textBaseline='top';return c;}
 function text(x,t,left,top,size=18,color=ink,weight=400){x.fillStyle=color;x.font=`${weight} ${size}px "Noto Sans Thai", Tahoma, sans-serif`;x.fillText(String(t),left,top);}
 function wrap(x,t,width,size=18){x.font=`${size}px "Noto Sans Thai", Tahoma, sans-serif`;const lines=[];let line='';for(const c of Array.from(String(t??''))){if(c==='\n'){lines.push(line);line='';}else if(line&&x.measureText(line+c).width>width){lines.push(line);line=c;}else line+=c;}if(line||!lines.length)lines.push(line);return lines;}
 function paragraph(x,t,left,top,width,size=18,color=ink){const lines=wrap(x,t,width,size);lines.forEach((line,i)=>text(x,line,left,top+i*(size*1.55),size,color));return lines.length*size*1.55;}
 function card(x,left,top,width,height,title,note){x.fillStyle='#fff';x.beginPath();x.roundRect(left,top,width,height,16);x.fill();text(x,title,left+22,top+18,22,ink,600);if(note)paragraph(x,note,left+22,top+52,width-44,14,muted);}
 function header(c,s,pageLabel){const x=c.getContext('2d');x.fillStyle='#123f50';x.fillRect(0,0,W,174);text(x,'SVS | KNOWLEDGE SHARING',38,27,30,'#fff',600);paragraph(x,s.title,38,76,W-76,22,'#d9eff3');paragraph(x,s.filters,38,126,W-76,16,'#c7e0e8');text(x,pageLabel,38,H-42,15,muted);return x;}
 function drawBars(x,items,left,top,width,height,labelKey='label'){
  if(!items.length){text(x,'ไม่มีข้อมูลในขอบเขตที่เลือก',left,top,17,muted);return;}
  const max=Math.max(1,...items.map(g=>g.presentations)),step=Math.min(52,height/items.length);
  items.forEach((g,i)=>{const y=top+i*step,label=String(g[labelKey]??g.year),lines=wrap(x,label,width-64,16);text(x,lines.length>1?lines[0]+'…':lines[0],left,y,16);x.textAlign='right';text(x,fmt(g.presentations),left+width,y,17,ink,600);x.textAlign='left';x.fillStyle='#eaf0f3';x.fillRect(left,y+25,width,8);x.fillStyle=palette[i%palette.length];x.fillRect(left,y+25,width*g.presentations/max,8);});
 }
 function summaryPage(s){
  const c=canvas(),x=header(c,s,'Dashboard · จำนวนรายการตามต้นทาง · รายละเอียดชื่อเต็มอยู่ในหน้าประวัติ'),d=root.SVSKnowledge.dashboard(s.data,s.rows),sum=root.SVSKnowledge.summarize(s.rows);
  [[sum.presentations,'รายการบรรยาย'],[sum.audience,'ผู้ฟังที่ระบุ (คน-ครั้ง)'],[sum.audienceMissing,'รายการไม่ระบุผู้ฟัง']].forEach((v,i)=>{const l=38+i*378;card(x,l,196,368,108,'','');text(x,fmt(v[0]),l+22,213,36,'#16677a',600);text(x,v[1],l+22,263,17,muted);});
  card(x,38,324,552,284,'การแบ่งปันความรู้รายปี','จำนวนรายการต่อปี');drawBars(x,d.annual,60,414,508,175);
  card(x,610,324,552,284,'รูปแบบการแบ่งปัน','จำนวนรายการตามรูปแบบ');drawBars(x,d.channels,632,414,508,175);
  card(x,38,628,552,594,'จำนวนครั้งต่อสมาชิก','10 อันดับแรก · ให้เครดิตผู้ร่วมบรรยายแต่ละคน');drawBars(x,d.people.slice(0,10),60,724,508,478,'displayName');
  card(x,610,628,552,594,'สัดส่วนหมวดหัวข้อ','หนึ่งรายการติดได้หลายหมวด · % จากการติดหมวดทั้งหมด');
  let start=-Math.PI/2;const cx=886,cy=843,r=96;x.lineWidth=30;
  if(!d.tagCount){x.strokeStyle='#eaf0f3';x.beginPath();x.arc(cx,cy,r,0,2*Math.PI);x.stroke();}
  d.categories.forEach((g,i)=>{const end=start+g.share*Math.PI*2;x.strokeStyle=palette[i%palette.length];x.beginPath();x.arc(cx,cy,r,start,end);x.stroke();start=end;});
  x.textAlign='center';text(x,fmt(d.tagCount),cx,817,33,ink,600);text(x,'การติดหมวด',cx,861,17,muted);x.textAlign='left';
  d.categories.forEach((g,i)=>{const yy=974+i*22;x.fillStyle=palette[i%palette.length];x.fillRect(637,yy+4,12,12);text(x,g.label,660,yy,15);x.textAlign='right';text(x,`${fmt(g.presentations)} · ${(g.share*100).toFixed(1)}%`,1139,yy,15);x.textAlign='left';});
  card(x,38,1242,552,314,'สถานที่ / ช่องทาง','5 อันดับแรก (หน้าจอแสดง 8 อันดับและกลุ่มอื่นๆ)');drawBars(x,d.places.slice(0,5),60,1337,508,208);
  card(x,610,1242,552,314,'กลุ่มผู้ฟัง','จำนวนรายการต่อกลุ่ม');drawBars(x,d.groups,632,1337,508,208);
  text(x,'ยอดหน่วยงานนับแต่ละรายการครั้งเดียว · ผู้ฟังเป็นคน-ครั้ง ไม่ใช่บุคคลไม่ซ้ำ',38,1574,16,muted);return c;
 }
 function historyPages(s){
  const rows=[...s.rows].sort((a,b)=>b.year-a.year||b.month-a.month||String(b.dateStart||'').localeCompare(a.dateStart||'')||a.sourceRow-b.sourceRow),pages=[];
  let c=null,x=null,y=0;
  const begin=()=>{c=canvas();x=header(c,s,'ประวัติทั้งหมดตามตัวกรอง · หน้าที่ '+(pages.length+2));y=202;pages.push(c);};begin();
  const members=new Map(s.data.speakers.map(p=>[p.id,p.displayName]));
  rows.forEach((r,index)=>{
   const lines=[`${index+1}. ${r.dateStart||r.year+'-'+String(r.month).padStart(2,'0')}${r.dateEnd&&r.dateEnd!==r.dateStart?' ถึง '+r.dateEnd:''} · Revision ${r.revision}`,r.title,'ผู้บรรยาย: '+r.speakerIds.map(id=>members.get(id)).join(', '),'สถานที่: '+(r.location||'ไม่ระบุ')+' · '+r.audienceGroup+' · '+r.reach,'ผู้ฟัง: '+fmt(r.audience)+' คน-ครั้ง · '+({onsite:'ณ สถานที่',online:'ออนไลน์',hybrid:'ผสมผสาน'}[r.channel]||r.channel)+' · หมวด: '+(r.categories.join(', ')||'ไม่ระบุ'),r.notes?'หมายเหตุ: '+r.notes:null,'รหัส: '+r.id].filter(Boolean);
   let first=true;
   for(const [li,line] of lines.entries()){
    const size=li===1?20:16,color=li===1?ink:muted;
    for(const part of wrap(x,line,W-112,size)){
     if(y+size*1.55>H-76){begin();if(!first){text(x,'รายการ '+(index+1)+' (ต่อ)',56,y,17,ink,600);y+=30;}}
     text(x,part,56,y,size,color,li===1?600:400);y+=size*1.55;first=false;
    }
   }
   y+=15;x.strokeStyle='#cddde2';x.beginPath();x.moveTo(56,y);x.lineTo(W-56,y);x.stroke();y+=22;
  });
  if(!rows.length)text(x,'ไม่พบประวัติในขอบเขตที่เลือก',56,y,20,muted);return pages;
 }
 async function generate(snapshot,includeHistory){await document.fonts.ready;const s=structuredClone(snapshot);return [summaryPage(s),...(includeHistory?historyPages(s):[])];}
 async function download(canvases,format,{pdf,name}){
  const deliver=(blob,filename=name)=>{if(!blob)throw Error('สร้างไฟล์ไม่สำเร็จ');const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);};
  if(format==='pdf'){deliver(pdf(canvases));return;}
  const files=[];for(let i=0;i<canvases.length;i++){const blob=await new Promise(resolve=>canvases[i].toBlob(resolve,'image/png'));if(!blob)throw Error('สร้างไฟล์ PNG ไม่สำเร็จ');if(canvases.length===1){deliver(blob);return;}files.push({name:name.replace(/\.png$/,'_page'+String(i+1).padStart(2,'0')+'.png'),bytes:new Uint8Array(await blob.arrayBuffer())});}
  deliver(pngZip(files),name.replace(/\.png$/,'.zip'));
 }
 // Stored ZIP entries avoid the browser's multiple-download blocker. PNG is already compressed.
 function pngZip(files){
  const table=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;}),encoder=new TextEncoder(),local=[],central=[];let offset=0,centralSize=0;
  for(const file of files){const name=encoder.encode(file.name),bytes=file.bytes;let crc=0xffffffff;for(const b of bytes)crc=table[(crc^b)&255]^(crc>>>8);crc=(crc^0xffffffff)>>>0;
   const head=new Uint8Array(30+name.length),h=new DataView(head.buffer);h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,bytes.length,true);h.setUint32(22,bytes.length,true);h.setUint16(26,name.length,true);head.set(name,30);local.push(head,bytes);
   const entry=new Uint8Array(46+name.length),e=new DataView(entry.buffer);e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x800,true);e.setUint16(14,33,true);e.setUint32(16,crc,true);e.setUint32(20,bytes.length,true);e.setUint32(24,bytes.length,true);e.setUint16(28,name.length,true);e.setUint32(42,offset,true);entry.set(name,46);central.push(entry);centralSize+=entry.length;offset+=head.length+bytes.length;
  }
  const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,centralSize,true);e.setUint32(16,offset,true);return new Blob([...local,...central,end],{type:'application/zip'});
 }
 root.SVSKnowledgeExport={generate,download};
})(globalThis);
