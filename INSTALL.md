# คู่มือติดตั้ง SVS Health Dashboard

## 1. สร้างข้อมูลบน Google

ใช้บัญชีผู้ดูแลที่องค์กรอนุญาต สร้าง:

- Google Spreadsheet ว่างชื่อ `SVS Health Database`
- โฟลเดอร์ Drive ชื่อ `SVS Health Files` สำหรับไฟล์แนบ
- โฟลเดอร์ Drive ชื่อ `SVS Health Backups` สำหรับสำเนารายวัน

เก็บ Spreadsheet ID และ Folder ID จาก URL ไม่จำเป็นต้องแชร์ให้ผู้ใช้งานทุกคน เพราะ Backend ทำงานด้วยสิทธิ์เจ้าของและตรวจสิทธิ์ในระบบก่อนอ่านข้อมูล อย่าเปิดไฟล์แนบเป็นสาธารณะ ผู้ดูแล Google Drive ระดับเจ้าของยังมีสิทธิ์เข้าถึงไฟล์ตามสิทธิ์ Google ตามปกติ

## 2. สร้าง Apps Script

เปิด Spreadsheet → Extensions → Apps Script

1. วางเนื้อหา `backend/Code.gs` ลงไฟล์ `Code.gs`
2. Project Settings → เปิด Show appsscript.json แล้ววางเนื้อหา `backend/appsscript.json`
3. Project Settings → Script Properties เพิ่มค่าต่อไปนี้ (Secret เก็บที่นี่เท่านั้น)

| Key | ค่า |
|---|---|
| SPREADSHEET_ID | ID ของ Spreadsheet |
| DRIVE_FOLDER_ID | ID ของโฟลเดอร์ไฟล์แนบ |
| BACKUP_FOLDER_ID | ID ของโฟลเดอร์ Backup |
| ADMIN_EMAIL | Google Email ของ Admin คนแรก |
| ADMIN_NAME | ชื่อ Admin คนแรก |
| FRONTEND_URL | URL เต็มของ GitHub Pages เช่น `https://ACCOUNT.github.io/svs-health-dashboard/` |
| GOOGLE_CLIENT_ID | OAuth Web client ID จากขั้นตอน 3 |
| GOOGLE_CLIENT_SECRET | OAuth client secret จากขั้นตอน 3 ห้ามใส่ frontend/config.js |
| WEB_APP_URL | URL deployment `/exec` จากขั้นตอน 4 |

ค่าตัวอย่าง URL ใช้แสดงรูปแบบเท่านั้น ต้องแทน ACCOUNT และชื่อ Repository ของจริง

## 3. Google OAuth Client

ใน Google Cloud Console สร้างหรือเลือก Project ตั้ง OAuth consent screen ให้สอดคล้องกับบัญชีที่จะใช้ เนื่องจากมี Gmail ส่วนบุคคล จึงต้องเลือก audience ที่อนุญาตบัญชีเหล่านี้ได้ หากอยู่ใน Testing ให้เพิ่มบัญชีที่ใช้ทดสอบใน Test users

สร้าง OAuth Client ID ประเภท Web application ระบบนี้ใช้ **redirect flow ที่ Backend** จึงต้องเพิ่ม Authorized redirect URI เป็น Apps Script `/exec` ตรงทุกตัวอักษรหลังได้ deployment URL จากขั้นตอน 4

Scope ที่ขอจากผู้ใช้คือ `openid email profile` ส่วนสิทธิ์ Sheets/Drive เป็นของผู้ deploy Backend ไม่ใช่การขอเข้าถึง Drive ส่วนตัวของสัตวแพทย์แต่ละคน

นำ Client ID และ Client Secret ไปตั้งใน Script Properties ห้ามแนบใน Repository

## 4. Deploy Apps Script

Deploy → New deployment → Web app

- Execute as: Me (บัญชีเจ้าของ Backend)
- Who has access: Anyone เพื่อให้ OAuth redirect callback และ HTTP API เข้าถึงได้ ส่วนสิทธิ์ข้อมูลจะตรวจใน Backend อีกชั้น คำขอที่ไม่มี session ไม่สามารถอ่านหรือแก้ข้อมูลได้

หากนโยบายองค์กรไม่อนุญาต Anyone ต้องปรึกษาผู้ดูแลเพื่อเลือก deployment ที่เหมาะสม **อย่าถอดการตรวจสิทธิ์ใน Code.gs เพื่อแก้ปัญหา**

คัดลอก URL ที่ลงท้าย `/exec` ใส่ WEB_APP_URL และ Authorized redirect URI ของ OAuth Client ให้ตรงกัน ห้ามใช้ `/dev` ใน config สำหรับผู้ใช้งาน

รัน `setupSystem` จาก Apps Script Editor และอนุญาตสิทธิ์ของเจ้าของระบบ จะสร้างตารางว่างตาม schema เพิ่ม Admin คนแรกเมื่อ Users ยังว่าง และตั้ง trigger `dailyBackup` ช่วงตีสองประเทศไทย การรันซ้ำไม่ลบตารางเดิม หาก schema ไม่ตรงจะหยุดแทนการเขียนทับ

หลังแก้โค้ด Apps Script ต้อง Manage deployments → Edit → New version → Deploy แล้วใช้ URL deployment เดิม

## 5. ตั้งค่า GitHub Pages

1. สร้าง Repository `svs-health-dashboard`
2. อัปโหลดไฟล์ภายใน ZIP ให้ราก Repository มี README.md และโฟลเดอร์ frontend/backend/.github/tests
3. แก้ `frontend/config.js` เฉพาะ `apiUrl` เป็น WEB_APP_URL
4. Settings → Pages → Source เลือก GitHub Actions
5. Actions → Deploy frontend to GitHub Pages → Run workflow หรือ push main

Workflow เผยแพร่เฉพาะ frontend จึงไม่ส่ง backend หรือ tests ไปเป็นหน้าเว็บ อย่างไรก็ตามโค้ดใน Repository สาธารณะยังอ่านได้ ห้ามเก็บ Secret/รายชื่อผู้ใช้/ข้อมูลจริงไว้ใน Repository

## 6. เข้าใช้ครั้งแรก

1. เปิด GitHub Pages กดเข้าสู่ระบบด้วย Google
2. หน้า Apps Script จะแสดงลิงก์เข้าสู่ Google จากนั้นยืนยันบัญชีและกลับมายังลิงก์ “กลับเข้าสู่ SVS Health Dashboard” ระบบใช้ลิงก์ข้ามหน้าที่ผู้ใช้กดเอง เพื่อรองรับข้อจำกัด iframe ของ Apps Script
3. เข้าด้วย ADMIN_EMAIL ที่กำหนด จากนั้นไปจัดการระบบเพื่อเพิ่มผู้ใช้จริง
4. เพิ่มฟาร์มจริงและมอบหมาย Operation ตามฟาร์ม
5. ทดสอบด้วย Management / Operation ตาม ACCEPTANCE.md

## 7. ตารางและนำเข้ารายชื่อ

Users มีหัวตาราง `id,email,name,role,status,googleSub` รหัส id ต้องคงที่ไม่ซ้ำ (UUID หรือรหัสถาวรขององค์กร) email ใช้ตัวพิมพ์เล็กและตัดช่องว่าง role คือ Admin/Management/Operation status คือ ACTIVE/INACTIVE ส่วน googleSub เว้นว่าง ระบบเติมเมื่อผู้ใช้ Login สำเร็จครั้งแรก

แนะนำเพิ่มผ่านหน้า Admin เพื่อให้ตรวจอีเมลซ้ำและเก็บ Audit หากวางข้อมูลลง Sheets โดยตรงให้ผู้ดูแลตรวจชื่อ/อีเมล/Role ก่อนเสมอ การแก้ Spreadsheet โดยตรงอยู่นอก Audit ของ Webapp และต้องจำกัดผู้แก้ Spreadsheet

ห้ามวาง Excel เดิมทับหัวตาราง Users เนื่องจากหัวคอลัมน์ต่างกัน ใช้ข้อมูลรายชื่อจาก Handoff v1.6 แยกต่างหาก หากยังไม่มีอีเมลให้เก็บช่องว่าง ไม่สร้างอีเมลสมมติ

ตาราง Records แยก metadata เป็นคอลัมน์และเก็บรายละเอียดแต่ละรายการใน `data` รูปแบบ JSON จึงยังไม่ใช่ VisitIssues แยกแถวเต็มรูปแบบ ข้อมูลค้นหาตามฟาร์ม/ชนิด/วันที่ได้ในแอป แต่การวิเคราะห์คำแนะนำระดับประเด็นใน Sheets ต้องแตก JSON หรือย้ายเป็นตาราง VisitIssues ในระยะต่อไป

## 8. ค่าระหว่างติดตั้งที่ยังต้องยืนยัน

ค่าต่อไปนี้เป็น **ค่าเริ่มต้นทางเทคนิคของโค้ด ไม่ใช่ข้อกำหนดที่ผู้ใช้ยืนยันแล้ว** เปลี่ยนใน Script Properties ได้ก่อนตรวจรับ:

| Key | ค่าเริ่มต้น | ความหมาย |
|---|---|---|
| SESSION_SECONDS | 3600 | อายุ session แบบ absolute 1 ชั่วโมง (cache อาจหมดก่อน ต้อง Login ใหม่); ยังไม่มี idle timeout แยก |
| VISIT_DAYS | 30 | จำนวนวันแสดงไอคอนเยี่ยมฟาร์ม |
| NEW_DISEASE_BASIS | detectedAt | เริ่มนับ NEW จากวันที่ตรวจพบ เปลี่ยนเป็น createdAt เพื่อนับจากเวลาบันทึก |
| PDF_MAX_MB | 20 | PDF ต่อไฟล์ โค้ดชุดนี้รองรับสูงสุด 20 MB ไม่เพิ่มเป็น 50 ก่อนเปลี่ยนวิธีส่งไฟล์ |
| DRAFT_RETENTION_BASIS | updatedAt | นับ 30 วันจากแก้ไขล่าสุด เปลี่ยนเป็น createdAt ได้ |

แบบฟอร์มเคสใช้จำนวนสัตว์ ณ ครั้งอัปเดต เก็บแต่ละ snapshot ไม่บวกยอดหลายครั้ง จนกว่าจะสรุปนิยามการนับที่ละเอียดกว่านี้ ผลตรวจรายเดือนใช้ช่องวันที่ในแบบฟอร์มเป็นวันที่อ้างอิง วันที่ตรงกันใช้เวลาสร้างรายการและ Record ID เป็นลำดับรอง

ร่างใน browser บันทึกหลังหยุดแก้ไขประมาณ 1 วินาทีเพื่อป้องกันข้อมูลสูญหาย ยังไม่มี autosync ไป server ทุก 30 วินาที ผู้ใช้กดบันทึกร่าง/บันทึกสมบูรณ์เพื่อส่งขึ้นระบบ

## 9. สำรองและกู้คืน

สำเนา Spreadsheet สร้างวันละครั้งตาม trigger เก็บไม่มีกำหนด ตรวจตาราง Backups และ Apps Script Executions เป็นประจำ ไฟล์แนบต้นฉบับเก็บใน Drive ไม่เขียนทับและไม่ลบเมื่อยกเลิกรายการ Files registry อยู่ในสำเนา Spreadsheet ด้วย

ชุดนี้ **ยังไม่คัดลอกไฟล์แนบแต่ละไฟล์เป็นสำเนาชุดที่สอง** การเก็บต้นฉบับไม่เท่ากับสำรองไฟล์อิสระ หากต้องป้องกันเจ้าของ Drive ลบไฟล์ต้องเพิ่มนโยบายสำเนา Drive แยกหรือระบบสำรองขององค์กร

ลบร่างที่หมดอายุเฉพาะหลังสร้างสำเนา Spreadsheet สำเร็จแล้ว ไม่ลบรูป/เอกสาร และบันทึก DraftPurge ใน Audit

การกู้คืน: หยุดใช้งานชั่วคราว เลือกสำเนาวันที่ต้องการ ทำสำเนาใหม่เพื่อกู้คืนโดยไม่เขียนทับฐานเดิม เปลี่ยน SPREADSHEET_ID ชี้สำเนากู้คืน ตรวจ Users, Assignments, Records, Files และทดสอบเปิดไฟล์ก่อนเปิดใช้งาน ไม่แก้ Drive File ID ตามชื่อไฟล์เอง
