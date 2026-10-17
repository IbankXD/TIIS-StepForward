// tests/run-tests.js - Automated Test Runner for StepForward
const http = require('http');
const app = require('../server');

const TEST_PORT = 3099;
let server;

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };

    const req = http.request(options, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: rawData });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 เริ่มต้นการทดสอบระบบ StepForward (4 กรณีศึกษา)');
  console.log('====================================================\n');

  let passedCount = 0;

  try {
    // 0. Reset State ก่อนเริ่ม
    await makeRequest('POST', '/api/reset');

    // ----------------------------------------------------
    // กรณีที่ 1: การใช้งานปกติ (Happy Path)
    // ----------------------------------------------------
    console.log('🔹 กรณีที่ 1: ผู้เรียน (STU-001) ส่งคำขอความช่วยเหลือครั้งแรก (Normal Operation)');
    const case1Res = await makeRequest('POST', '/api/tickets', {
      learnerId: 'STU-001',
      category: 'exercise_stuck',
      problemSummary: 'เขียนโค้ด HTML ลิงก์รูปภาพไม่แสดงผล',
      problemDetail: 'ใส่แท็ก <img> แล้วขึ้นรูปแตกบนบราวเซอร์มือถือ ตรวจสอบ path รูปภาพแล้วยังไม่หาย',
      selfTriageTried: true,
      userPriority: 'AUTO'
    });

    if (case1Res.status === 201 && case1Res.body.success && case1Res.body.ticket.id) {
      console.log('   ✅ PASS: ส่งคำขอสำเร็จ ได้รับ HTTP 201, Ticket ID:', case1Res.body.ticket.id);
      console.log('   ℹ️ Priority คำนวณได้:', case1Res.body.ticket.priority, '| สถานะ:', case1Res.body.ticket.status);
      passedCount++;
    } else {
      console.error('   ❌ FAIL: กรณีที่ 1 ล้มเหลว', case1Res);
    }

    // ----------------------------------------------------
    // กรณีที่ 2: ข้อมูลไม่ครบถ้วน / สั้นเกินไป (Validation & Error Handling)
    // ----------------------------------------------------
    console.log('\n🔹 กรณีที่ 2: ผู้เรียนส่งข้อมูลไม่ครบถ้วน หรือข้อความสั้นเกินไป (Invalid/Incomplete Data)');
    const case2Res = await makeRequest('POST', '/api/tickets', {
      learnerId: 'STU-002',
      category: 'exercise_stuck',
      problemSummary: 'ช่วย', // สั้นเกินไป (< 5 ตัวอักษร)
      problemDetail: 'พัง'    // สั้นเกินไป (< 10 ตัวอักษร)
    });

    if (case2Res.status === 400 && case2Res.body.error === 'SUMMARY_TOO_SHORT') {
      console.log('   ✅ PASS: ระบบปฏิเสธด้วย HTTP 400 และแจ้งเตือน:', case2Res.body.message);
      passedCount++;
    } else {
      console.error('   ❌ FAIL: กรณีที่ 2 ล้มเหลว ไม่สามารถตรวจจับฟิลด์สั้นเกินไป', case2Res);
    }

    // ----------------------------------------------------
    // กรณีที่ 3: ป้องกันการทำรายการซ้ำ (Duplicate Prevention)
    // ----------------------------------------------------
    console.log('\n🔹 กรณีที่ 3: ผู้เรียนเดิม (STU-001) พยายามส่งตั๋วใหม่อีกใบขณะที่ใบแรกยังไม่ปิด (Duplicate Prevention)');
    const case3Res = await makeRequest('POST', '/api/tickets', {
      learnerId: 'STU-001',
      category: 'clarification',
      problemSummary: 'อยากถามเรื่องการส่งงานเพิ่มเติม',
      problemDetail: 'ส่งตั๋วเพิ่มอีกใบเพื่อความรวดเร็วในการติดต่อ',
      selfTriageTried: false
    });

    if (case3Res.status === 409 && case3Res.body.error === 'DUPLICATE_ACTIVE_TICKET') {
      console.log('   ✅ PASS: ระบบป้องกันการส่งซ้ำสำเร็จ ได้รับ HTTP 409 Conflict');
      console.log('   ℹ️ แจ้งเตือนผู้เรียน:', case3Res.body.message);
      passedCount++;
    } else {
      console.error('   ❌ FAIL: กรณีที่ 3 ล้มเหลว ยอมให้ส่งตั๋วซ้ำซ้อน', case3Res);
    }

    // ----------------------------------------------------
    // กรณีที่ 4: การเปลี่ยนสถานะงานและแนวทางก้าวต่อ (State Transition & Resolution)
    // ----------------------------------------------------
    console.log('\n🔹 กรณีที่ 4: พี่เลี้ยงรับเคส (ASSIGNED) และปิดเคส (RESOLVED) พร้อมให้คำแนะนำ (Clear Next Steps)');
    const ticketIdToUpdate = case1Res.body.ticket.id;

    // ขั้นที่ 4.1: ลอง Resolve โดยไม่ใส่คำแนะนำ (ต้องติด Validation)
    const invalidResolveRes = await makeRequest('PATCH', `/api/tickets/${ticketIdToUpdate}`, {
      status: 'RESOLVED',
      resolutionAction: '' // ไม่มีคำแนะนำ
    });

    let validationChecked = (invalidResolveRes.status === 400 && invalidResolveRes.body.error === 'MISSING_RESOLUTION_ACTION');

    // ขั้นที่ 4.2: อัปเดตพร้อมระบุคำแนะนำจริง
    const validResolveRes = await makeRequest('PATCH', `/api/tickets/${ticketIdToUpdate}`, {
      status: 'RESOLVED',
      assignedMentor: 'พี่เอ (ทีมหลัก)',
      mentorNote: 'โทรแนะนำ 5 นาที อธิบายเรื่อง Relative vs Absolute Path',
      resolutionAction: 'แก้ไข path รูปภาพเป็น ./images/logo.png และรีเฟรชหน้าเว็บ ภาพแสดงผลถูกต้อง'
    });

    if (validationChecked && validResolveRes.status === 200 && validResolveRes.body.ticket.status === 'RESOLVED') {
      console.log('   ✅ PASS: มีการบังคับให้ใส่แนวทางก้าวต่อก่อนปิดเคส และเปลี่ยนสถานะเป็น RESOLVED สำเร็จ');
      console.log('   ℹ️ ข้อความก้าวต่อที่ผู้เรียนได้รับ:', validResolveRes.body.ticket.resolutionAction);
      passedCount++;
    } else {
      console.error('   ❌ FAIL: กรณีที่ 4 ล้มเหลว', { validationChecked, validResolveRes });
    }

    console.log('\n====================================================');
    console.log(`📊 สรุปผลการทดสอบ: ผ่าน ${passedCount}/4 กรณี (${passedCount === 4 ? '100% ครบถ้วนสมบูรณ์' : 'มีข้อผิดพลาด'})`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการรันการทดสอบ:', err);
  } finally {
    if (server) {
      server.close();
    }
  }
}

// เริ่มเซิร์ฟเวอร์เฉพาะการทดสอบ
server = app.listen(TEST_PORT, () => {
  runTests();
});
