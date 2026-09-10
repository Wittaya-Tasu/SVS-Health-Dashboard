'use strict';
// Local rendering only. No farm data is sent to an export service.
let overviewExportBusy=false;
const exportPalette={'Unstable':['#f9e5e8','#a91e30'],'Stable Active':['#fff0df','#984c09'],'Stable Inactive':['#fff5bd','#756000'],'FreePRRS':['#e0f2e7','#176641']};
function overviewSnapshot(){
 const farms=visibleFarms();
 const columns=state.masters.regions.filter(r=>!region||r===region).map(r=>({name:r,count:farms.filter(f=>f.region===r).length,entries:state.masters.layers.filter(l=>!layer||l===layer).flatMap(l=>{
   const list=farms.filter(f=>f.region===r&&f.layer===l);
   return [{kind:'layer',name:l},...list.map(f=>({kind:'farm',name:farmDisplayName(f),emphasized:farmEmphasized(f),layer:l,prrs:filter==='prrs'?latest(f.id,'prrs')?.data.state:'',event:openEvents(f.id).length>0,isNew:openEvents(f.id).some(isNew),visit:visited(f.id),construction:f.construction==='true'})),...(!list.length?[{kind:'empty',name:'ไม่มีฟาร์มที่ตรงเงื่อนไข'}]:[])];
 })}));
 return {columns,total:farms.length,date:thai(today()),summary:[state.farms.length,state.farms.filter(f=>openEvents(f.id).length).length,state.farms.filter(f=>visited(f.id)).length],description:[region||'ทุกภาค',layer||'ทุกประเภทฟาร์ม',({event:'โรคระบาด',prrs:'สถานะโรค '+disease,cost:'ปสภ.และต้นทุน',construction:'กำลังก่อสร้าง',visit:'บันทึกเยี่ยมฟาร์ม'})[filter]||'ทุกสถานะ',filter==='prrs'?(prrsState||'ทุกสถานะ PRRS'):'',search?'ค้นหา: '+search:''].filter(Boolean).join(' · '),showPRRS:filter==='prrs'};
}
function overviewLines(ctx,text,max){
 const lines=[];let line='';
 const chars=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('th',{granularity:'grapheme'}).segment(String(text))].map(x=>x.segment):Array.from(String(text));
 for(const ch of chars){if(line&&ctx.measureText(line+ch).width>max){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);return lines;
}
function overviewCanvas(snapshot,logo,start=0,limit=Infinity,page=1,pages=1){
 const width=1890,gap=14,pad=32,colW=(width-pad*2-gap*(snapshot.columns.length-1))/Math.max(snapshot.columns.length,1);
 const rowCount=Math.max(1,...snapshot.columns.map(c=>Math.min(limit,Math.max(0,c.entries.length-start))));
 const height=370+rowCount*124;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('เบราว์เซอร์ไม่รองรับการสร้างภาพ');
 const rect=(x,y,w,h,color,r=12)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
 const text=(s,x,y,size=20,color='#20383d',weight=400)=>{ctx.font=`${weight} ${size}px "Noto Sans Thai", Tahoma, sans-serif`;ctx.fillStyle=color;ctx.fillText(s,x,y);};
 rect(0,0,width,height,'#f3f6f7',0);rect(0,0,width,108,'#ffffff',0);rect(32,20,70,70,'#eaf3f1');ctx.drawImage(logo,36,37,62,34);
 text('Farm Health Dashboard',122,53,30,'#123d43',600);text('โดย สัตวแพทย์บริการวิชาการสุกร',122,81,16,'#687e83');text(snapshot.date,width-205,55,20,'#687e83');
 text('ภาพรวมฟาร์มสุกร',32,147,28,'#123d43',600);
 ctx.font='17px "Noto Sans Thai", Tahoma, sans-serif';
 overviewLines(ctx,snapshot.description,width-64).slice(0,2).forEach((l,i)=>text(l,32,180+i*22,17,'#687e83'));
 const labels=['ฟาร์ม','ฟาร์มที่มีโรคระบาด','ฟาร์มที่มีเข้าเยี่ยม'];
 labels.forEach((l,i)=>{const x=32+i*420;rect(x,213,404,66,'#fff');text(String(snapshot.summary[i]),x+18,255,29,'#123d43',600);text(l,x+105,252,19,'#687e83');});
 text(`แสดง ${snapshot.total} ฟาร์ม`,1330,255,21,'#123d43',600);
 snapshot.columns.forEach((col,ci)=>{
  const x=pad+ci*(colW+gap);rect(x,296,colW,height-330,'#e9eff0');rect(x,296,colW,46,'#123d43',8);
  text(col.name,x+12,326,19,'#fff',600);text(String(col.count),x+colW-33,326,17,'#bed7dc');
  col.entries.slice(start,start+limit).forEach((e,ri)=>{
   const y=352+ri*124;
   if(e.kind==='layer'){text(e.name,x+13,y+27,18,'#537077',600);return;}
   if(e.kind==='empty'){text(e.name,x+12,y+25,15,'#687e83');return;}
   rect(x+8,y,colW-16,116,'#fff',8);if(e.event)rect(x+8,y,3,116,'#b32235',1);
   ctx.font=(e.emphasized?'600':'400')+' 19px "Noto Sans Thai", Tahoma, sans-serif';
   const lines=overviewLines(ctx,e.name,colW-40);
   // Current farm master names fit in two lines at this width; decrease only if needed.
   const size=lines.length>2?16:19;ctx.font=`${e.emphasized?600:400} ${size}px "Noto Sans Thai", Tahoma, sans-serif`;
   const fitted=overviewLines(ctx,e.name,colW-40);fitted.forEach((l,i)=>text(l,x+18,y+25+i*22,size,'#20383d',e.emphasized?600:400));
   let ix=x+18,iy=y+76;
   if(e.event){ctx.fillStyle='#b32235';ctx.beginPath();ctx.moveTo(ix,iy+2);ctx.lineTo(ix+9,iy-16);ctx.lineTo(ix+18,iy+2);ctx.fill();text('!',ix+7,iy-1,13,'#fff',700);ix+=24;}
   if(e.isNew){text('NEW',ix,iy,12,'#b32235',700);ix+=36;}
   if(e.visit){text('🔎',ix,iy,18);ix+=24;}if(e.construction){text('🚜',ix,iy,18);ix+=24;}
   if(snapshot.showPRRS){const value=e.prrs||'ยังไม่มีข้อมูล',colors=exportPalette[e.prrs]||['#eceff0','#687e83'];rect(x+18,y+86,colW-36,25,colors[0],5);text(value,x+23,y+104,14,colors[1],500);}
  });
 });
 text(`Farm Health Dashboard · ${page}/${pages}`,32,height-12,14,'#687e83');
 return canvas;
}
function overviewPdf(canvases){
 const encoder=new TextEncoder(),objects=[],parts=[],offsets=[0];let length=0;
 const append=x=>{const b=typeof x==='string'?encoder.encode(x):x;parts.push(b);length+=b.length;};
 const ids=canvases.map((_,i)=>3+i*3);
 objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[2]=`<< /Type /Pages /Count ${ids.length} /Kids [${ids.map(i=>`${i} 0 R`).join(' ')}] >>`;
 canvases.forEach((c,i)=>{
  const id=ids[i],bytes=Uint8Array.from(atob(c.toDataURL('image/jpeg',.94).split(',')[1]),x=>x.charCodeAt(0));
  const w=1190.55,h=841.89,drawW=w-32,drawH=drawW*c.height/c.width;
  objects[id]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] /Resources << /XObject << /Img ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`;
  objects[id+1]=[encoder.encode(`<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`),bytes,encoder.encode('\nendstream')];
  const commands=`q ${drawW} 0 0 ${drawH} 16 ${h-16-drawH} cm /Img Do Q`;
  objects[id+2]=`<< /Length ${encoder.encode(commands).length} >>\nstream\n${commands}\nendstream`;
 });
 append('%PDF-1.4\n');for(let id=1;id<objects.length;id++){offsets[id]=length;append(`${id} 0 obj\n`);const o=objects[id];if(Array.isArray(o))o.forEach(append);else append(o);append('\nendobj\n');}
 const xref=length;append(`xref\n0 ${objects.length}\n0000000000 65535 f \n`);offsets.slice(1).forEach(x=>append(String(x).padStart(10,'0')+' 00000 n \n'));append(`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
 return new Blob(parts,{type:'application/pdf'});
}
async function exportOverview(format){
 if(overviewExportBusy)return;
 if(filter==='cost'||filter==='prrs'&&disease!=='PRRS'){toast('หัวข้อนี้ยังไม่มีข้อมูลสำหรับส่งออก');return;}
 overviewExportBusy=true;const buttons=[$('#exportPNG'),$('#exportPDF')];buttons.forEach(b=>{if(b)b.disabled=true;});
 try{
  const snapshot=overviewSnapshot();await document.fonts.ready;
  const logo=new Image();logo.src='./assets/svs-logo.png';await logo.decode();
  let blob;
  if(format==='pdf'){
   const perPage=6,pages=Math.max(1,...snapshot.columns.map(c=>Math.ceil(c.entries.length/perPage))),canvases=[];
   for(let i=0;i<pages;i++)canvases.push(overviewCanvas(snapshot,logo,i*perPage,perPage,i+1,pages));
   blob=overviewPdf(canvases);
  }else{
   const c=overviewCanvas(snapshot,logo);if(c.height>16000)throw Error('ข้อมูลยาวเกินภาพเดียว กรุณาเลือกภาคหรือใช้ PDF');
   blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
  }
  if(!blob)throw Error('สร้างไฟล์ไม่สำเร็จ กรุณาลองส่งออก PDF หรือเลือกภาคให้น้อยลง');
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Farm_Health_Dashboard_${today()}.${format}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('สร้างไฟล์เรียบร้อย');
 }catch(e){toast('ส่งออกไม่สำเร็จ: '+e.message);}finally{overviewExportBusy=false;buttons.forEach(b=>{if(b)b.disabled=false;});}
}
