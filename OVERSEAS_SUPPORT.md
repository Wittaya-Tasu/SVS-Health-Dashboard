# SVS063 — สนับสนุนต่างประเทศ

## การใช้งาน

ทีมงานสัตวแพทย์ → แท็บ **สนับสนุนต่างประเทศ** ต่อจาก Knowledge Sharing → **+ เพิ่มข้อมูลของฉัน**

ผู้กรอกผูกกับบัญชี Login เปลี่ยนเป็นคนอื่นไม่ได้ กรอกประเทศ วันที่เดินทาง จำนวนวัน (ระบุครึ่งวันได้) เลือกสมาชิกที่ร่วมเดินทาง และสรุปงาน รายการเดียวปรากฏในประวัติของทุกคน โดยภาพรวมนับเป็นหนึ่งทริป ไม่เพิ่มยอดซ้ำตามจำนวนคน ผู้ร่วมทริปและ Admin แก้ไขได้ ส่วนสมาชิกอื่นดูประวัติและไฟล์ที่ผูกกับรายการได้ตามการเข้าถึงประวัติทีมเดิม สมาชิกที่เลิกใช้งานยังคงอยู่ในประวัติเดิม ไม่เปิดบัญชีใหม่ให้

- รูปภาพ: JPG / PNG / WebP สูงสุด 4 รูป รูปละ 20 MiB เก็บต้นฉบับและรูปตัวอย่าง/รายงาน
- PDF บันทึกเชิญ: ไม่บังคับ สูงสุด 1 ไฟล์ 20 MiB ดาวน์โหลดผ่าน API ที่ตรวจ session ไม่มี public Drive URL
- กรองปี พ.ศ. ประเทศ สมาชิก และค้นหาข้อความได้ เลือกสมาชิกจากชื่อในประวัติหรือสลับจากหน้าประวัติ Knowledge Sharing ของบุคคลเดิมได้
- จำนวนวันรวมเป็นวันตามทริป ไม่ใช่คน-วันหรือจำนวนวันที่ปฏิทินไม่ซ้ำ

## Backend และข้อมูล

โมดูลใหม่ `backend/OverseasSupport001.gs` เชื่อมกับ **Code.gs ปัจจุบันที่ตรวจจาก production** เท่านั้น ไม่ใช้ `backend/Code.gs` เก่าใน repository วางทับระบบจริง

เพิ่ม authenticated dispatch ใน switch ของ `doPostBase048`:

```js
case 'overseasSupport063':result=overseasSupport063(u,p);break;
```

เพิ่ม bootstrap setting:

```js
overseasSupportProtocol: typeof overseasSupport063 === 'function' ? 1 : 0
```

ฟังก์ชันตรวจรูปใช้ `ksPhotoDecode003_` จาก KnowledgeSharingMedia003 ที่ติดตั้งอยู่แล้ว ส่วน session / Users / script lock / Drive destination ใช้ของระบบปัจจุบัน ไม่เพิ่ม scope หรือเปลี่ยนสิทธิ์ deployment

API `overseasSupport063` ใช้ `protocol: 1` และ op `read`, `createRecord`, `updateRecord`, `uploadFile`, `readFile` มี request IDs, optimistic revisions และตรวจสิทธิ์ซ้ำฝั่งเซิร์ฟเวอร์

- `OverseasSupport001`: journal แยกจากข้อมูลฟาร์มและ Knowledge Sharing เก็บ revision, previous/current hashes, actor และ request hash เผยแพร่เมื่อ STAGING → audit สำเร็จ → COMMITTED เท่านั้น
- `OverseasSupportFiles001`: metadata ไฟล์ใหม่แยกต่างหาก ส่วนเนื้อหาเก็บใน Drive destination เดิม ไม่เปลี่ยนการแชร์ ไฟล์ที่ถอดจากรายการยังคงอยู่เพื่อประวัติ ไม่ลบทิ้งอัตโนมัติ
- ตารางใหม่สร้างเมื่อมีการบันทึกจริงครั้งแรก การเปิดอ่านไม่สร้างตารางหรือเขียนข้อมูล ไม่มี migration ข้อมูลเดิม
- กรอกทริปแล้วอัปโหลดรูป/PDF และผูกไฟล์ในขั้นถัดไป หากการเชื่อมต่อขาด ฟอร์มแจ้งสถานะและลองคำขอเดิมซ้ำได้ โดยไม่เพิ่มทริป ไฟล์ หรือ revision ซ้ำ ระหว่างรอลองซ้ำฟอร์มคงข้อมูลเดิมไว้
- สมาชิกใหม่ที่เลือกต้องเป็น Users ที่ ACTIVE ผู้กรอกเดิมอยู่ในรายการเสมอ ไม่ย้ายตัวผู้สร้างตามผู้แก้ไข และเก็บชื่อ/ID ประวัติผู้ร่วมเดินทางไว้

## การตรวจสอบก่อนเผยแพร่

- Backend ใหม่ 10/10 tests ผ่าน: ไม่มีการเขียนเมื่ออ่าน, identity/บทบาท/สมาชิก/วันที่/จำนวนวัน, ประวัติร่วม, revisions, retries, audit/commit interruption, 4 รูป + PDF, private reads, media signatures/limits, cross-record guards และ journal integrity
- Current Backend เดิม 38/38 tests ผ่าน: importer, edits, details/media และ create ของ Knowledge Sharing
- Repository Node tests 34/34 ผ่าน (รวม legacy Backend)
- Browser SVS063 ผ่านกับ Backend ปัจจุบันแบบ in-memory/intercept ทั้งหมด: ฟอร์ม/แท็บ, 4 รูปและ PDF, ดาวน์โหลด PDF ตรงต้นฉบับ, ตัด response หลัง create/upload/attach แล้วลองซ้ำ, ประวัติและสิทธิ์ของผู้ร่วมทริป, สมาชิกอื่นอ่านอย่างเดียว, escaping, ตัวกรอง และจอ 390–1920 px
- Browser SVS060 และ SVS062 ผ่าน รักษา Knowledge Sharing รูป/การลองซ้ำและหน้าแล็บ/เปอร์เซ็นต์/PDF เดิม

คำสั่ง QA และหลักฐานอยู่ใน workspace ส่วนตัว `qa/overseas063-backend.test.cjs`, `qa/overseas063-browser.cjs`, `qa/artifacts/svs063/` ไม่ใช่หลักฐานการเขียนทดสอบลงฐาน production ผล deployment และการอ่านไฟล์จริงบันทึกแยกในรายงาน workspace
