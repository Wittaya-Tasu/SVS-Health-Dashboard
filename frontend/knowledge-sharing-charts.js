(function(root){
 'use strict';
 const colors=['#167d8d','#e6a654','#6377b4','#50a896','#d76c79','#99b5c5','#8b7cb6','#a0af66','#c28355','#789298'];
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n).toLocaleString('th-TH');
 function bars(items,person=false){const max=Math.max(1,...items.map(g=>g.presentations));return `<div class="ks-bars">${items.map((g,i)=>`<div class="ks-bar-row">${person?`<button class="ks-member-link" data-ks-member="${esc(g.id)}">${esc(g.displayName)}</button>`:`<span>${esc(g.label??g.year)}</span>`}<b>${fmt(g.presentations)}</b><div class="ks-bar-track"><i style="width:${g.presentations/max*100}%;background:${colors[i%colors.length]}"></i></div></div>`).join('')||'<p class="muted">ไม่มีข้อมูลในขอบเขตที่เลือก</p>'}</div>`;}
 function render(data,rows){
  const d=root.SVSKnowledge.dashboard(data,rows);let offset=0;
  const donut=d.categories.map((g,i)=>{const length=g.share*100,svg=`<circle cx="60" cy="60" r="45" fill="none" stroke="${colors[i%colors.length]}" stroke-width="15" pathLength="100" stroke-dasharray="${length} ${100-length}" stroke-dashoffset="${-offset}"/>`;offset+=length;return svg;}).join('');
  const card=(title,subtitle,content,cls='')=>`<section class="panel ks-chart-card ${cls}"><h2>${title}</h2><p class="muted">${subtitle}</p>${content}</section>`;
  return `<div class="ks-dashboard"><div class="ks-dashboard-heading"><span class="ks-kicker">KNOWLEDGE IMPACT</span><h2>แบ่งปันความรู้ สร้างผลลัพธ์ร่วมกัน</h2><p>ภาพรวมตามปี กลุ่มผู้ฟัง และคำค้นที่เลือก</p></div><div class="ks-chart-grid">`+
   card('การแบ่งปันความรู้รายปี','จำนวนรายการบรรยายในแต่ละปี',bars(d.annual))+
   card('รูปแบบการแบ่งปัน','จำนวนรายการตามรูปแบบการบรรยาย',bars(d.channels))+
   card('จำนวนครั้งต่อสมาชิก','10 อันดับแรก · ผู้ร่วมบรรยายได้รับเครดิตคนละ 1 ครั้งต่อรายการ',bars(d.people.slice(0,10),true))+
   card('สัดส่วนหมวดหัวข้อ','หนึ่งรายการมีหลายหมวดได้ · % คิดจากจำนวนการติดหมวดทั้งหมด',`<div class="ks-donut-wrap"><svg viewBox="0 0 120 120" class="ks-donut" role="img" aria-label="สัดส่วนหมวดหัวข้อ"><circle cx="60" cy="60" r="45" fill="none" stroke="#e8eff1" stroke-width="15"/>${donut}<text x="60" y="57" text-anchor="middle">${fmt(d.tagCount)}</text><text x="60" y="72" class="ks-donut-small" text-anchor="middle">การติดหมวด</text></svg><ul class="ks-legend">${d.categories.map((g,i)=>`<li><i style="background:${colors[i%colors.length]}"></i><span>${esc(g.label)}</span><b>${fmt(g.presentations)} · ${(g.share*100).toFixed(1)}%</b></li>`).join('')||'<li>ไม่มีข้อมูล</li>'}</ul></div>`)+
   card('สถานที่และช่องทาง','8 อันดับแรก · รายการที่เหลือรวมใน “อื่นๆ”',bars(d.places))+
   card('กลุ่มผู้ฟัง','จำนวนรายการตามกลุ่มผู้ฟัง',bars(d.groups))+'</div></div>';
 }
 root.SVSKnowledgeCharts={render,colors};
})(globalThis);
