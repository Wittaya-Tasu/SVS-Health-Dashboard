# SVS Health Dashboard

Repository สำหรับหน้าเว็บบน GitHub Pages และ Backend บน Google Apps Script ใช้ Google Sheets เก็บข้อมูลและ Google Drive เก็บไฟล์ ชื่อระบบล่าสุดตามผู้ใช้คือ **SVS Health Dashboard** โดยนำข้อกำหนด Smart SVS v1.6 มาใช้ต่อ

ไม่มีข้อมูลฟาร์ม ผลตรวจ หรือผู้ใช้จำลอง ไม่มีรายชื่อบุคคล อีเมลจริง หรือ Secret ใน Repository ระบบจะแสดงหน้า Login และสถานะไม่มีข้อมูลจนตั้งค่า Backend และเพิ่มข้อมูลจริง

## เริ่มติดตั้ง

1. แตก ZIP แล้วอัปโหลด **ไฟล์ภายในโฟลเดอร์ svs-health-dashboard** ไปยังราก Repository ของ GitHub ชื่อแนะนำ `svs-health-dashboard` ต้องมี `.github/workflows/pages.yml` ด้วย
2. ทำตาม [INSTALL.md](INSTALL.md) เพื่อสร้าง Google Sheets / Drive / Apps Script และ OAuth
3. กรอก URL ของ Apps Script ใน `frontend/config.js`
4. เปิด Settings → Pages → Source: GitHub Actions แล้วรัน Workflow
5. ทดสอบตาม [ACCEPTANCE.md](ACCEPTANCE.md) ด้วยบัญชีจริง ก่อนนำข้อมูลสำคัญเข้า

## โครงสร้าง

```text
frontend/          หน้าเว็บที่เผยแพร่ขึ้น GitHub Pages เท่านั้น
  index.html
  config.js        API URL ที่เปิดเผยได้ ไม่มี Secret
  app.js
  style.css
backend/
  Code.gs          API, OAuth, สิทธิ์, Sheets, Drive, Backup
  appsscript.json  OAuth scopes และ timezone
tests/             ทดสอบกติกา Backend ด้วย Node.js ไม่เชื่อม Google
.github/workflows/ Workflow เผยแพร่เฉพาะ frontend/
INSTALL.md         คู่มือตั้งค่า
ACCEPTANCE.md      รายการตรวจรับและข้อจำกัดปัจจุบัน
```

## ส่วนที่เขียนแล้ว

- Google OAuth แบบ authorization-code redirect แลก code ที่ Backend เท่านั้น ใช้ state และ browser verifier ผูก ticket ครั้งเดียว จากนั้นใช้ session token ไม่มีการเชื่อถืออีเมลที่ browser ส่งมาเอง
- Admin / Management / Operation และ Farm Assignment ตรวจซ้ำฝั่ง Backend ทุกคำขอ รวมดาวน์โหลดไฟล์
- Dashboard 7 ภาค × 3 Layer, ค้นหาฟาร์ม, ไอคอนโรคระบาดและ NEW, ตัวเลือก PRRS/PED/FMD, ปสภ.และต้นทุนเป็นโครงสร้างว่าง
- Farm Profile เพิ่มฟาร์มโดย Admin แก้ฟาร์มที่รับผิดชอบโดย Operation ได้ เก็บประวัติ
- Visit Note 4 หมวด แยกสิ่งที่พบและคำแนะนำ, Priority, JPG/PNG สูงสุด 2 รูปต่อประเด็น 10 MB/รูป, ร่างในอุปกรณ์และร่างบน Sheets
- เหตุการณ์โรค เปิด–อัปเดต–ปิดเคส เก็บประวัติจำนวน ณ แต่ละครั้ง ไม่รวมยอดซ้ำ
- PRRS Unstable / Stable Active / Stable Inactive / FreePRRS ลงวันที่และประวัติ ไม่แปลผลอัตโนมัติ
- ผลตรวจ Water / Feed / Semen / S.Swab: Vehicle / S.Swab: Housing, Pass/NotPass, เลือกดูผลล่าสุดหรือทุกครั้งต่อเดือน
- เอกสาร PDF แบ่ง 10 ประเภท เก็บรายการย้อนหลัง ดาวน์โหลดผ่าน API ที่ตรวจสิทธิ์ ไม่เผยแพร่ Drive แบบ anyone-with-link
- ยกเลิกรายการพร้อมเหตุผล ตรวจ revision เพื่อป้องกันเขียนทับคนอื่น และ Audit เก็บค่าเดิม/ค่าใหม่
- Admin จัดการผู้ใช้และการมอบหมาย สำเนา Spreadsheet วันละครั้งและลบร่างเกิน 30 วันหลังสำรองสำเร็จ

## สถานะความพร้อมที่ต้องเข้าใจ

นี่เป็นชุดซอร์สที่ต่อข้อมูลจริงได้หลังติดตั้ง **ไม่ใช่ระบบที่ผ่านการตรวจรับบน Google จริงแล้ว** ไม่มีการสร้าง Google Cloud Project, Deployment, Spreadsheet หรือ OAuth client ในบัญชีผู้ใช้ระหว่างจัดทำ ZIP

ผ่านการตรวจ syntax และทดสอบกติกา Backend แบบจำลองบริการ Google ดู `ACCEPTANCE.md` สำหรับสิ่งที่ต้องทดสอบสดและฟังก์ชันที่ยังไม่ครบข้อกำหนดทั้งหมด ห้ามตีความผล unit test ว่า OAuth, CORS, quota, file transfer หรือ backup บนบัญชีจริงทำงานผ่านแล้ว

## ข้อมูลส่วนบุคคลเริ่มต้น

รายการที่ตกลงกันมีผู้ใช้ 33 คน และได้รับอีเมลแล้ว 31 คน เก็บไว้ในเอกสาร Handoff v1.6 แยกต่างหาก **ไม่ใส่ Handoff ฉบับที่มีรายชื่อและอีเมลจริงลง Repository สาธารณะ** Admin เพิ่มผู้ใช้จากหน้าเว็บหรือกรอกตาราง Users ตาม schema ดู INSTALL.md อีเมลยังขาด 2 คนไม่ต้องเดาและยังไม่สามารถ Login

## การทดสอบภายใน Repository

ใช้ Node.js 22 ขึ้นไป โดยไม่ติดตั้ง dependency:

```sh
node --check frontend/app.js
node --test tests/backend.test.cjs
```

## หลักฐานอ้างอิงเทคนิค

OAuth redirect ใช้ state และแลก authorization code ที่ server ตาม [Google Code Model](https://developers.google.com/identity/oauth2/web/guides/use-code-model) ไม่ใช้ tokeninfo เป็นตัวตรวจ token สำหรับระบบจริง

Apps Script ใช้ doGet/doPost และตั้ง deployment ตาม [Google Web Apps](https://developers.google.com/apps-script/guides/web) การตอบ JSON ใช้ [Content Service](https://developers.google.com/apps-script/guides/content) ซึ่งมี redirect ไป googleusercontent.com ต้องทดสอบการอ่าน response จาก origin ของ GitHub Pages จริง
