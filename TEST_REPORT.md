# รายงานผลการทดสอบระบบ StepForward (Test Report)
**ตำแหน่ง:** Software Developer Trainee  
**ผู้จัดทำ:** ศิวัฒน์ แก้วหนองสังข์  
**บริษัท:** บริษัท เทค อินฟินิตี้ อินเตอร์เนชั่นแนล โซลูชั่น จำกัด (TIIS)  

---

## 1. ตารางสรุปภาพรวมการทดสอบ (Summary of Test Cases)

การทดสอบดำเนินการผ่านสคริปต์อัตโนมัติ `tests/run-tests.js` ครอบคลุมทั้งกรณีการใช้งานปกติ (Happy Path), กรณีข้อมูลผิดพลาด/ไม่ครบถ้วน, กรณีการป้องกันการส่งซ้ำ, และวงจรการเปลี่ยนสถานะงาน

| ลำดับ | กรณีทดสอบ (Test Case) | วัตถุประสงค์และเงื่อนไขการทดสอบ | ข้อมูลนำเข้า (Input) | ผลลัพธ์ที่คาดหวัง (Expected) | ผลลัพธ์จริง (Actual) | สถานะ |
|---|---|---|---|---|---|---|
| **Case 1** | **Normal Operation (Happy Path)** | ทดสอบผู้เรียนส่งคำขอความช่วยเหลือครั้งแรก พร้อมข้อมูลครบถ้วน | `learnerId`: "STU-001", `category`: "exercise_stuck", `summary`: "เขียนโค้ด HTML ลิงก์รูปภาพไม่แสดงผล", `detail`: "ใส่แท็ก <img> แล้วขึ้นรูปแตกบนมือถือ..." | HTTP 201 Created, ระบบออก Ticket ID, คำนวณ Priority เป็น HIGH, สถานะเป็น OPEN | ได้รับ HTTP 201, Ticket ID `TICK-104`, Priority: `HIGH`, Status: `OPEN` | ✅ **PASS** |
| **Case 2** | **Incomplete / Invalid Data Handling** | ทดสอบการส่งข้อมูลที่สั้นเกินไปหรือไม่ครบถ้วน เพื่อป้องกันคำขอที่ไม่มีความหมาย | `learnerId`: "STU-002", `problemSummary`: "ช่วย" (< 5 ตัวอักษร), `problemDetail`: "พัง" (< 10 ตัวอักษร) | HTTP 400 Bad Request, แจ้งข้อความ Error ชัดเจน ไม่บันทึกลงระบบ | ได้รับ HTTP 400, Error: `SUMMARY_TOO_SHORT`, แจ้งเตือนข้อความชัดเจน | ✅ **PASS** |
| **Case 3** | **Duplicate Request Prevention** | ทดสอบผู้เรียนเดิมส่งคำขอใหม่ซ้ำซ้อน ขณะที่มีคำขอเดิมสถานะ OPEN หรือ ASSIGNED อยู่ | `learnerId`: "STU-001", ส่งซ้ำหลังจากเพิ่งสร้างใน Case 1 สำเร็จ | HTTP 409 Conflict, ปฏิเสธการสร้างตั๋วใหม่ และส่งข้อมูลตั๋วเดิมกลับมาให้ผู้เรียน | ได้รับ HTTP 409, Error: `DUPLICATE_ACTIVE_TICKET`, พร้อมเลขอ้างอิงตั๋วเดิม | ✅ **PASS** |
| **Case 4** | **State Transition & Next Steps Validation** | ทดสอบการปิดเคส (RESOLVED) ต้องมีแนวทางก้าวต่อไปให้ผู้เรียนเสมอ | 4.1 ส่งปิดเคสโดยไม่มี `resolutionAction`<br>4.2 ส่งปิดเคสพร้อมระบุ `resolutionAction` | 4.1 HTTP 400 (บังคับใส่คำแนะนำ)<br>4.2 HTTP 200 เปลี่ยนสถานะเป็น RESOLVED สำเร็จ และสถานะผู้เรียนกลับมาเป็น Active | 4.1 ได้รับ HTTP 400 `MISSING_RESOLUTION_ACTION`<br>4.2 ได้รับ HTTP 200, Status: `RESOLVED` พร้อมข้อความก้าวต่อ | ✅ **PASS** |

---

## 2. ตัวอย่างการแก้ไขหลังการทดสอบ (Bug Fix Before & After)

ในการทดสอบระบบระยะแรก พบจุดบกพร่องสำคัญ 2 จุดที่ได้รับการปรับปรุงแก้ไขเพื่อให้ระบบรองรับการใช้งานจริงบนโทรศัพท์มือถือได้อย่างมีเสถียรภาพ:

### 🎯 จุดแก้ไขที่ 1: การจัดการช่องว่างและตัวพิมพ์ในรหัสผู้เรียน (Whitespace & Case Handling)
* **ปัญหาที่พบ:** เมื่อผู้ใช้กรอกรหัสผ่านแป้นพิมพ์มือถือ (เช่น iOS/Android) ระบบคีย์บอร์ดมักจะเติมวรรคหลังพิมพ์เสร็จโดยอัตโนมัติ (เช่น `"STU-001 "`) หรือพิมพ์ตัวพิมพ์เล็ก (`"stu-001"`) ส่งผลให้ระบบแจ้งเตือน `404 NOT FOUND` ทำให้ผู้ใช้เข้าใจผิดว่าตนเองไม่มีชื่อในโครงการ

**โค้ดก่อนแก้ไข (Before):**
```javascript
// server.js (เดิม)
app.get('/api/learners/:id', (req, res) => {
  const learnerId = req.params.id; // ไม่ได้ตัดช่องว่างและไม่ได้แปลงตัวพิมพ์
  const learner = learners.find(l => l.id === learnerId);
  if (!learner) {
    return res.status(404).json({ success: false, message: 'ไม่พบผู้เรียน' });
  }
  // ...
});
```

**โค้ดหลังแก้ไข (After):**
```javascript
// server.js (แก้ไขแล้ว)
app.get('/api/learners/:id', (req, res) => {
  const learnerId = req.params.id.trim().toUpperCase(); // ตัด whitespace และแปลงเป็นตัวพิมพ์ใหญ่อัตโนมัติ
  const learner = learners.find(l => l.id === learnerId);
  if (!learner) {
    return res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: `ไม่พบข้อมูลผู้เรียนรหัส ${learnerId} ในระบบ กรุณาตรวจสอบรหัสประจำตัว (เช่น STU-001 ถึง STU-060)`
    });
  }
  // ...
});
```

---

### 🎯 จุดแก้ไขที่ 2: การบังคับระบุแนวทางก้าวต่อก่อนปิดเคส (Resolution Guardrail)
* **ปัญหาที่พบ:** พี่เลี้ยงสามารถกดเปลี่ยนสถานะตั๋วเป็น `RESOLVED` ได้โดยลืมกรอกข้อความคำแนะนำ ส่งผลให้หน้าจอมือถือของผู้เรียนขึ้นว่า "แก้ไขเสร็จแล้ว" แต่ไม่มีคำอธิบายว่าต้องก้าวต่อไปอย่างไร

**โค้ดก่อนแก้ไข (Before):**
```javascript
// server.js (เดิม)
if (status === 'RESOLVED') {
  ticket.status = status;
  ticket.resolvedAt = new Date().toISOString();
}
```

**โค้ดหลังแก้ไข (After):**
```javascript
// server.js (แก้ไขแล้ว)
if (status === 'RESOLVED') {
  // Guardrail: ต้องระบุแนวทางก้าวต่อไปให้ผู้เรียนเสมอ
  if (!resolutionAction && !ticket.resolutionAction) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_RESOLUTION_ACTION',
      message: 'การปิดเคส (RESOLVED) ต้องระบุแนวทางก้าวต่อไป (resolutionAction) ให้ผู้เรียน'
    });
  }
  ticket.resolvedAt = new Date().toISOString();
  
  // อัปเดตสถานะผู้เรียนให้กลับมาเป็น Active พร้อมเรียนรู้ต่อ
  const learner = learners.find(l => l.id === ticket.learnerId);
  if (learner && learner.status === 'stuck') {
    learner.status = 'active';
  }
}
```

---

## 3. หลักฐานการรันชุดทดสอบอัตโนมัติ (Automated Test Execution Log)
```text
> stepforward-tiis@1.0.0 test
> node tests/run-tests.js

====================================================
🧪 เริ่มต้นการทดสอบระบบ StepForward (4 กรณีศึกษา)
====================================================

🔹 กรณีที่ 1: ผู้เรียน (STU-001) ส่งคำขอความช่วยเหลือครั้งแรก (Normal Operation)
   ✅ PASS: ส่งคำขอสำเร็จ ได้รับ HTTP 201, Ticket ID: TICK-104
   ℹ️ Priority คำนวณได้: HIGH | สถานะ: OPEN

🔹 กรณีที่ 2: ผู้เรียนส่งข้อมูลไม่ครบถ้วน หรือข้อความสั้นเกินไป (Invalid/Incomplete Data)
   ✅ PASS: ระบบปฏิเสธด้วย HTTP 400 และแจ้งเตือน: กรุณาสรุปปัญหาให้ชัดเจนอย่างน้อย 5 ตัวอักษร เพื่อให้ทีมงานเข้าใจบริบท

🔹 กรณีที่ 3: ผู้เรียนเดิม (STU-001) พยายามส่งตั๋วใหม่อีกใบขณะที่ใบแรกยังไม่ปิด (Duplicate Prevention)
   ✅ PASS: ระบบป้องกันการส่งซ้ำสำเร็จ ได้รับ HTTP 409 Conflict
   ℹ️ แจ้งเตือนผู้เรียน: ท่านมีคำร้องหมายเลข TICK-104 ที่กำลังอยู่ในระหว่างดำเนินการ กรุณารอทีมงานตอบกลับ หรือแก้ไขข้อมูลในคำร้องเดิม

🔹 กรณีที่ 4: พี่เลี้ยงรับเคส (ASSIGNED) และปิดเคส (RESOLVED) พร้อมให้คำแนะนำ (Clear Next Steps)
   ✅ PASS: มีการบังคับให้ใส่แนวทางก้าวต่อก่อนปิดเคส และเปลี่ยนสถานะเป็น RESOLVED สำเร็จ
   ℹ️ ข้อความก้าวต่อที่ผู้เรียนได้รับ: แก้ไข path รูปภาพเป็น ./images/logo.png และรีเฟรชหน้าเว็บ ภาพแสดงผลถูกต้อง

====================================================
📊 สรุปผลการทดสอบ: ผ่าน 4/4 กรณี (100% ครบถ้วนสมบูรณ์)
====================================================
```
