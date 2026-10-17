# StepForward (ก้าวต่อ) 🚀
### ระบบติดตามและช่วยเหลือผู้เรียนรายบุคคลในโครงการนำร่อง (Smart Helpdesk & Silent-Dropout Prevention System)
**บริษัท เทค อินฟินิตี้ อินเตอร์เนชั่นแนล โซลูชั่น จำกัด (TIIS)**  
**ตำแหน่งที่สมัคร:** Software Developer Trainee  
**ผู้จัดทำ:** คุณศิวัฒน์ แก้วหนองสังข์  

---

## 📌 บทนำและโจทย์ของโครงการ
ภายใต้ข้อจำกัดของโครงการนำร่อง:
- ระยะเวลา 6 สัปดาห์ (มีการติดตามผล 14 วันหลังการอบรมหลัก)
- ผู้เข้าร่วม 60 คน พื้นฐานต่างกัน บางคนใช้สมาร์ทโฟนเป็นหลัก
- งบประมาณดำเนินงาน 30,000 บาท
- **ทีมงานหลักเพียง 3 คน** ในการดูแลผู้เรียนทั้งหมด

**ปัญหาสำคัญ (Core Problem):**  
ในช่วง 14 วันของการนำทักษะไปใช้จริง ผู้เรียนมักประสบปัญหาติดขัด (Stuck) ไม่กล้าถามในกลุ่มสาธารณะ (LINE) หรือพิมพ์ถามไม่ตรงจุด ขณะที่ทีมงาน 3 คนตอบไม่ทัน และไม่รู้ว่าใครที่กำลัง "เงียบหายไปเพราะถอดใจ" (Silent Dropout) จนกระทั่งหลุดออกจากโครงการ

**โซลูชัน "StepForward":**  
Web Application น้ำหนักเบา ออกแบบตามแนวคิด **Mobile-First Responsive** เพื่อให้ผู้เรียนบนมือถือเข้าถึงได้ง่ายที่สุด มี 2 โมดูลหลัก:
1. **Learner Portal (ฝั่งผู้เรียน):** เช็คอินประจำวันสั้นๆ 1 นาที (Daily Pulse) และส่งตั๋วขอความช่วยเหลือ (SOS Ticket) พร้อมระบบช่วยแนะนำการแก้ปัญหาเบื้องต้น (Self-Triage) และติดตามสถานะแบบเรียลไทม์ โดยมีระบบป้องกันการเปิดตั๋วซ้ำซ้อน (Duplicate Prevention)
2. **Mentor Triage Dashboard (ฝั่งทีมงาน 3 คน):** จัดคิวตั๋วตามความเร่งด่วนอัตโนมัติ (เช่น ติดปัญหาบนมือถือ หรือเครื่องมือเปิดไม่ได้ = เร่งด่วนสูงสุด) และระบบเตือนภัยเชิงรุกสำหรับผู้เรียนที่เงียบเกิน 3 วัน เพื่อให้พี่เลี้ยงกระจายกำลังทักทายได้อย่างมีประสิทธิภาพ

---

## 💻 Tech Stack และการออกแบบสถาปัตยกรรม
- **Runtime:** Node.js (v18+)
- **Backend Framework:** Express.js (RESTful API Architecture)
- **Database / State:** In-memory Database พร้อม Pre-loaded Mock Data ผู้เรียน 60 คน (แยกสถานะ Active, Stuck, Dropout Risk ครบถ้วน) และรองรับฟังก์ชัน Data Reset
- **Frontend:** Vanilla HTML5, Modern CSS (Responsive Design, Flexbox/Grid, Mobile-Optimized), Vanilla JavaScript (Zero external heavy client framework เพื่อความเร็วและความเบา)
- **Testing:** Automated HTTP Test Runner (ครอบคลุม 4 กรณีสำคัญ)

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (How to Run)

### 1. ความต้องการของระบบ (Prerequisites)
- มี Node.js ติดตั้งอยู่ในเครื่อง (เวอร์ชัน 18 ขึ้นไป)

### 2. ติดตั้ง Dependencies
เปิด Terminal ในโฟลเดอร์โปรเจกต์ แล้วรันคำสั่ง:
```bash
npm install
```

### 3. รันระบบ (Start Server)
```bash
npm start
```
ระบบจะเปิดใช้งานที่พอร์ต 3000:
- 📱 **Learner Portal (มุมมองผู้เรียน):** [http://localhost:3000/index.html](http://localhost:3000/index.html)
- 🖥️ **Mentor Triage Dashboard (มุมมองทีมงาน):** [http://localhost:3000/mentor.html](http://localhost:3000/mentor.html)

### 4. รันชุดทดสอบอัตโนมัติ (Automated Tests)
```bash
npm test
```

---

## 📂 โครงสร้างไดเรกทอรีของโปรเจกต์
```
TIIS/
├── package.json               # ค่าคอนฟิกและ Dependencies
├── server.js                 # Express Backend, REST API, Validation, Priority Engine
├── data/
│   └── mockData.js           # ตัวสร้างข้อมูลจำลองผู้เรียน 60 คน และตั๋วเริ่มต้น
├── public/                   # Frontend Web Application
│   ├── index.html            # หน้าจอฝั่งผู้เรียน (Learner Portal - Mobile First)
│   ├── app.js                # ควบคุมการทำงานฝั่งผู้เรียน
│   ├── mentor.html           # หน้าจอฝั่งทีมงานพี่เลี้ยง 3 คน (Triage Dashboard)
│   ├── mentor.js             # ควบคุมการทำงานฝั่งทีมงาน
│   └── style.css             # สไตล์ชีต Responsive ดีไซน์สะอาดตา
├── tests/
│   └── run-tests.js          # สคริปต์รัน Automated Test 4 กรณี
├── README.md                 # เอกสารคู่มือโครงการ (ฉบับนี้)
├── MISSION_1_SUMMARY.md      # เอกสารสรุปภารกิจที่ 1 (ความยาว 2 หน้า)
├── TEST_REPORT.md            # บันทึกผลการทดสอบ 4 กรณี และ Before/After Bug Fix
└── AI_DISCLOSURE_LOG.md      # บันทึกการใช้งาน AI ตามข้อกำหนดของ TIIS
```

---

## 📋 เอกสารส่งมอบตามเงื่อนไข TIIS
1. [README.md](file:///c:/Users/door_/OneDrive/%E0%B9%80%E0%B8%94%E0%B8%AA%E0%B8%81%E0%B9%8C%E0%B8%97%E0%B9%87%E0%B8%AD%E0%B8%9B/TIIS/README.md) - สรุปโค้ดต้นฉบับและวิธีรัน
2. [MISSION_1_SUMMARY.md](file:///c:/Users/door_/OneDrive/%E0%B9%80%E0%B8%94%E0%B8%AA%E0%B8%81%E0%B9%8C%E0%B8%97%E0%B9%87%E0%B8%AD%E0%B8%9B/TIIS/MISSION_1_SUMMARY.md) - เอกสารสรุปภารกิจที่ 1 และข้อจำกัด (ไม่เกิน 2 หน้า)
3. [TEST_REPORT.md](file:///c:/Users/door_/OneDrive/%E0%B9%80%E0%B8%94%E0%B8%AA%E0%B8%81%E0%B9%8C%E0%B8%97%E0%B9%87%E0%B8%AD%E0%B8%9B/TIIS/TEST_REPORT.md) - รายงานผลการทดสอบ 4 กรณี พร้อมหลักฐานและจุดแก้ไข
4. [AI_DISCLOSURE_LOG.md](file:///c:/Users/door_/OneDrive/%E0%B9%80%E0%B8%94%E0%B8%AA%E0%B8%81%E0%B9%8C%E0%B8%97%E0%B9%87%E0%B8%AD%E0%B8%9B/TIIS/AI_DISCLOSURE_LOG.md) - รายงานความโปร่งใสการใช้งาน AI
