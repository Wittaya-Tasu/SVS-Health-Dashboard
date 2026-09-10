'use strict';
// Local rendering only. No farm data is sent to an export service.
let overviewExportBusy=false;
const exportPalette={'Unstable':['#f9e5e8','#a91e30'],'Stable Active':['#fff0df','#984c09'],'Stable Inactive':['#fff5bd','#756000'],'FreePRRS':['#e0f2e7','#176641']};
function overviewSnapshot(){
 const farms=visibleFarms();
 const columns=state.masters.regions.filter(r=>!region||r===region).map(r=>({name:r,count:farms.filter(f=>f.region===r).length,entries:state.masters.layers.filter(l=>!layer||l===layer).flatMap(l=>{
   const list=farms.filter(f=>f.region===r&&f.layer===l);
   return [{kind:'layer',name:l},...list.map(f=>({kind:'farm',name:farmDisplayName(f),emphasized:farmEmphasized(f),layer:l,prrs:filter==='prrs'?latest(f.id,'prrs')?.data.state:'',event:openEvents(f.id).length>0,isNew:openEvents(f.id).some(isNew),visit:visited(f.id),construction:f.construction==='true'}))];
 })}));
 return {columns,total:farms.length,date:thai(today()),summary:[state.farms.length,state.farms.filter(f=>openEvents(f.id).length).length,state.farms.filter(f=>visited(f.id)).length],description:[region||'ทุกภาค',layer||'ทุกประเภทฟาร์ม',({event:'โรคระบาด',prrs:'สถานะโรค '+disease,cost:'ปสภ.และต้นทุน',construction:'กำลังก่อสร้าง',visit:'บันทึกเยี่ยมฟาร์ม'})[filter]||'ทุกสถานะ',filter==='prrs'?(prrsState||'ทุกสถานะ PRRS'):'',search?'ค้นหา: '+search:''].filter(Boolean).join(' · '),showPRRS:filter==='prrs'};
}
function overviewLines(ctx,text,max){
 const lines=[];let line='';
 const chars=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('th',{granularity:'grapheme'}).segment(String(text))].map(x=>x.segment):Array.from(String(text));
 for(const ch of chars){if(line&&ctx.measureText(line+ch).width>max){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);return lines;
}
// Paint the actual, fully laid-out board, including content below the viewport.
// Uses DOM geometry so names, columns, badges and blank regions match the screen.
function paintOverviewBoard(ctx,board,offsetX,offsetY){
 const origin=board.getBoundingClientRect();
 const box=r=>({x:r.left-origin.left+offsetX,y:r.top-origin.top+offsetY,w:r.width,h:r.height});
 function paintText(node){
  const value=node.nodeValue;if(!value||!value.trim())return;
  const cs=getComputedStyle(node.parentElement),range=document.createRange(),runs=[];
  const segments=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('th',{granularity:'grapheme'}).segment(value)].map(s=>s.segment):Array.from(value);
  let pos=0;
  for(const segment of segments){
   range.setStart(node,pos);pos+=segment.length;range.setEnd(node,pos);
   const r=range.getBoundingClientRect();if(!r.width||!r.height)continue;
   let run=runs[runs.length-1];
   if(!run||Math.abs(run.top-r.top)>2){run={top:r.top,bottom:r.bottom,left:r.left,height:r.height,text:''};runs.push(run);}
   run.text+=segment;
  }
  ctx.font=`${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.fillStyle=cs.color;ctx.textBaseline='alphabetic';ctx.textAlign='left';
  if('letterSpacing' in ctx)ctx.letterSpacing=cs.letterSpacing==='normal'?'0px':cs.letterSpacing;
  const metrics=ctx.measureText('Mg'),size=parseFloat(cs.fontSize);
  const ascent=metrics.fontBoundingBoxAscent??size*.8,descent=metrics.fontBoundingBoxDescent??size*.2;
  runs.forEach(r=>ctx.fillText(r.text,r.left-origin.left+offsetX,r.top-origin.top+offsetY+(r.height-ascent-descent)/2+ascent));
  if('letterSpacing' in ctx)ctx.letterSpacing='0px';
 }
 function paint(el){
  const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return;
  const r=box(el.getBoundingClientRect());if(!r.w||!r.h)return;
  ctx.save();ctx.globalAlpha*=Number(cs.opacity);
  const radius=Math.min(parseFloat(cs.borderTopLeftRadius)||0,r.w/2,r.h/2);
  const path=()=>{ctx.beginPath();if(el.classList.contains('triangle')){ctx.moveTo(r.x+r.w/2,r.y);ctx.lineTo(r.x+r.w,r.y+r.h);ctx.lineTo(r.x,r.y+r.h);ctx.closePath();}else ctx.roundRect(r.x,r.y,r.w,r.h,radius);};
  path();ctx.fillStyle=cs.backgroundColor;ctx.fill();
  const sides=['Top','Right','Bottom','Left'];
  sides.forEach((side,i)=>{const w=parseFloat(cs['border'+side+'Width']);if(!w||cs['border'+side+'Style']==='none')return;
   ctx.strokeStyle=cs['border'+side+'Color'];ctx.lineWidth=w;
   // A full rounded outline for uniform borders; preserve the outbreak left stripe separately.
   if(i===0&&sides.every(k=>cs['border'+k+'Width']===cs.borderTopWidth&&cs['border'+k+'Color']===cs.borderTopColor)){path();ctx.stroke();}
   else if(!sides.every(k=>cs['border'+k+'Width']===cs.borderTopWidth&&cs['border'+k+'Color']===cs.borderTopColor)){
    ctx.beginPath();const pts=[[r.x,r.y+w/2,r.x+r.w,r.y+w/2],[r.x+r.w-w/2,r.y,r.x+r.w-w/2,r.y+r.h],[r.x,r.y+r.h-w/2,r.x+r.w,r.y+r.h-w/2],[r.x+w/2,r.y,r.x+w/2,r.y+r.h]][i];ctx.moveTo(pts[0],pts[1]);ctx.lineTo(pts[2],pts[3]);ctx.stroke();
   }
  });
  if(cs.overflow==='hidden'){path();ctx.clip();}
  for(const child of el.childNodes){if(child.nodeType===3)paintText(child);else if(child.nodeType===1)paint(child);}
  ctx.restore();
 }
 paint(board);
}
function overviewCanvas(snapshot,logo){
 const board=document.querySelector('.balanced-board');if(!board)throw Error('กรุณาเปิดหน้าภาพรวมฟาร์มก่อนส่งออก');
 const bounds=board.getBoundingClientRect(),pad=16,width=Math.ceil(bounds.width+pad*2);
 // Header scales independently; the farm board keeps its exact screen spacing.
 const headerScale=width/1890,boardY=Math.ceil(310*headerScale),height=Math.ceil(boardY+bounds.height+32);
 const scale=Math.min(2,16000/height,16000/width,Math.sqrt(50000000/(width*height)));
 if(scale<.7)throw Error('ข้อมูลยาวเกินไป กรุณาเลือกภาคก่อนส่งออก');
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*scale);canvas.height=Math.ceil(height*scale);
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('เบราว์เซอร์ไม่รองรับการสร้างภาพ');ctx.scale(scale,scale);
 ctx.fillStyle='#f3f6f7';ctx.fillRect(0,0,width,height);
 ctx.save();ctx.scale(headerScale,headerScale);
 const rect=(x,y,w,h,color,r=12)=>{ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
 const text=(s,x,y,size=20,color='#20383d',weight=400)=>{ctx.font=`${weight} ${size}px "Noto Sans Thai", Tahoma, sans-serif`;ctx.fillStyle=color;ctx.fillText(s,x,y);};
 rect(0,0,1890,108,'#fff',0);rect(32,20,70,70,'#eaf3f1');ctx.drawImage(logo,36,37,62,34);
 text('Farm Health Dashboard',122,53,30,'#123d43',600);text('โดย สัตวแพทย์บริการวิชาการสุกร',122,81,16,'#687e83');text(snapshot.date,1680,55,20,'#687e83');
 text('ภาพรวมฟาร์มสุกร',32,147,28,'#123d43',600);
 ctx.font='17px "Noto Sans Thai", Tahoma, sans-serif';
 overviewLines(ctx,snapshot.description,1826).slice(0,2).forEach((l,i)=>text(l,32,180+i*22,17,'#687e83'));
 ['ฟาร์ม','ฟาร์มที่มีโรคระบาด','ฟาร์มที่มีเข้าเยี่ยม'].forEach((l,i)=>{const x=32+i*420;rect(x,213,404,66,'#fff');text(String(snapshot.summary[i]),x+18,255,29,'#123d43',600);text(l,x+105,252,19,'#687e83');});
 text(`แสดง ${snapshot.total} ฟาร์ม`,1330,255,21,'#123d43',600);ctx.restore();
 paintOverviewBoard(ctx,board,pad,boardY);
 return canvas;
}
function overviewPdf(canvases){
 const encoder=new TextEncoder(),objects=[],parts=[],offsets=[0];let length=0;
 const append=x=>{const b=typeof x==='string'?encoder.encode(x):x;parts.push(b);length+=b.length;};
 const ids=canvases.map((_,i)=>3+i*3);
 objects[1]='<< /Type /Catalog /Pages 2 0 R >>';objects[2]=`<< /Type /Pages /Count ${ids.length} /Kids [${ids.map(i=>`${i} 0 R`).join(' ')}] >>`;
 canvases.forEach((c,i)=>{
  const id=ids[i],bytes=Uint8Array.from(atob(c.toDataURL('image/jpeg',.94).split(',')[1]),x=>x.charCodeAt(0));
  const w=1190.55,drawW=w-32,drawH=drawW*c.height/c.width,h=drawH+32;
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
  await document.fonts.ready;
  const logo=new Image();logo.src='./assets/svs-logo.png';await logo.decode();
  const snapshotNow=overviewSnapshot();
  const c=overviewCanvas(snapshotNow,logo);
  let blob;
  if(format==='pdf')blob=overviewPdf([c]);
  else blob=await new Promise(resolve=>c.toBlob(resolve,'image/png'));
  if(!blob)throw Error('สร้างไฟล์ไม่สำเร็จ กรุณาลองส่งออก PDF หรือเลือกภาคให้น้อยลง');
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`Farm_Health_Dashboard_${today()}.${format}`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);toast('สร้างไฟล์เรียบร้อย');
 }catch(e){toast('ส่งออกไม่สำเร็จ: '+e.message);}finally{overviewExportBusy=false;buttons.forEach(b=>{if(b)b.disabled=false;});}
}
