// server.js - Backend API for StepForward
const express = require('express');
const path = require('path');
const { generateMockLearners, initialTickets } = require('./data/mockData');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Database (สามารถ Reset ได้ตลอดเวลาเพื่อการทดสอบ)
let learners = generateMockLearners();
let tickets = JSON.parse(JSON.stringify(initialTickets));
let ticketCounter = 104;

// Helper: คำนวณลำดับความสำคัญ (Triage Priority Engine)
function calculatePriority(category, deviceType, daysSinceActive) {
  // กฎทางธุรกิจ:
  // 1. ถ้าเครื่องมือใช้งานไม่ได้เลย (tools_setup) หรือไม่ได้เข้ามาเกิน 3 วัน = CRITICAL
  // 2. ถ้าใช้มือถือและติดแบบฝึกหัด = HIGH (เพราะแก้ยากกว่าบนคอม เสี่ยงถอดใจ)
  // 3. ทั่วไป = MEDIUM หรือ LOW
  if (category === 'tools_setup' || daysSinceActive >= 3) {
    return 'CRITICAL';
  }
  if (deviceType === 'smartphone' && category === 'exercise_stuck') {
    return 'HIGH';
  }
  if (category === 'exercise_stuck') {
    return 'MEDIUM';
  }
  return 'LOW';
}

// ==========================================
// API Endpoints
// ==========================================

// 1. ดึงภาพรวมสถิติสำหรับ Dashboard ทีมงาน 3 คน
app.get('/api/stats', (req, res) => {
  const totalLearners = learners.length;
  const activeLearners = learners.filter(l => l.status === 'active').length;
  const stuckLearners = learners.filter(l => l.status === 'stuck').length;
  const dropoutRiskLearners = learners.filter(l => l.status === 'dropout_risk').length;

  const openTickets = tickets.filter(t => t.status === 'OPEN').length;
  const assignedTickets = tickets.filter(t => t.status === 'ASSIGNED').length;
  const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED').length;
  const criticalTickets = tickets.filter(t => t.status !== 'RESOLVED' && t.priority === 'CRITICAL').length;

  res.json({
    learners: {
      total: totalLearners,
      active: activeLearners,
      stuck: stuckLearners,
      dropoutRisk: dropoutRiskLearners
    },
    tickets: {
      total: tickets.length,
      open: openTickets,
      assigned: assignedTickets,
      resolved: resolvedTickets,
      criticalPending: criticalTickets
    }
  });
});

// 2. ค้นหาข้อมูลผู้เรียนตาม ID (เช่น STU-001)
app.get('/api/learners/:id', (req, res) => {
  const learnerId = req.params.id.trim().toUpperCase();
  const learner = learners.find(l => l.id === learnerId);

  if (!learner) {
    return res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: `ไม่พบข้อมูลผู้เรียนรหัส ${learnerId} ในระบบ กรุณาตรวจสอบรหัสประจำตัว (เช่น STU-001 ถึง STU-060)`
    });
  }

  // ดึงประวัติตั๋วที่ยังเปิดค้างอยู่ (ถ้ามี)
  const activeTicket = tickets.find(
    t => t.learnerId === learnerId && (t.status === 'OPEN' || t.status === 'ASSIGNED')
  );

  res.json({
    success: true,
    data: learner,
    activeTicket: activeTicket || null
  });
});

// 3. ดึงรายชื่อผู้เรียนทั้งหมด (รองรับการกรองตามสถานะ เช่น dropout_risk, stuck)
app.get('/api/learners', (req, res) => {
  const { status, track, device } = req.query;
  let result = [...learners];

  if (status) {
    result = result.filter(l => l.status === status);
  }
  if (track) {
    result = result.filter(l => l.track === track);
  }
  if (device) {
    result = result.filter(l => l.deviceType === device);
  }

  res.json({
    success: true,
    count: result.length,
    data: result
  });
});

// 4. เช็คอินความคืบหน้ารายวัน (Daily Pulse Check-in)
app.post('/api/checkin', (req, res) => {
  const { learnerId, mood, progressNote } = req.body;

  if (!learnerId) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_FIELD',
      message: 'กรุณาระบุรหัสผู้เรียน (learnerId)'
    });
  }

  const learner = learners.find(l => l.id === learnerId.trim().toUpperCase());
  if (!learner) {
    return res.status(404).json({
      success: false,
      error: 'NOT_FOUND',
      message: `ไม่พบผู้เรียนรหัส ${learnerId}`
    });
  }

  // อัปเดตสถานะผู้เรียน
  learner.lastActiveDate = new Date().toISOString().split('T')[0];
  learner.daysSinceLastActive = 0;

  if (mood === 'stuck') {
    learner.status = 'stuck';
  } else {
    learner.status = 'active';
    if (learner.completedDays < learner.targetDays) {
      learner.completedDays += 1;
    }
  }

  res.json({
    success: true,
    message: 'บันทึกการเช็คอินประจำวันเรียบร้อยแล้ว',
    learner
  });
});

// 5. ส่งคำขอความช่วยเหลือ (Create SOS Ticket) พร้อม Validation & Duplicate Prevention
app.post('/api/tickets', (req, res) => {
  const { learnerId, category, problemSummary, problemDetail, selfTriageTried, userPriority } = req.body;

  // Validation 1: ตรวจสอบฟิลด์ที่จำเป็น (Required fields)
  if (!learnerId || !category || !problemSummary || !problemDetail) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_REQUIRED_FIELDS',
      message: 'กรุณากรอกข้อมูลให้ครบถ้วน: รหัสผู้เรียน, หมวดหมู่ปัญหา, หัวข้อสรุป และรายละเอียด'
    });
  }

  // Validation 2: ความยาวของข้อความต้องมีความหมาย (ไม่สั้นเกินไปจนทีมงานช่วยเหลือไม่ได้)
  if (problemSummary.trim().length < 5) {
    return res.status(400).json({
      success: false,
      error: 'SUMMARY_TOO_SHORT',
      message: 'กรุณาสรุปปัญหาให้ชัดเจนอย่างน้อย 5 ตัวอักษร เพื่อให้ทีมงานเข้าใจบริบท'
    });
  }

  if (problemDetail.trim().length < 10) {
    return res.status(400).json({
      success: false,
      error: 'DETAIL_TOO_SHORT',
      message: 'กรุณาระบุรายละเอียดสิ่งที่ติดขัดอย่างน้อย 10 ตัวอักษร เช่น หน้าจอที่พบ หรือข้อความแจ้งเตือน'
    });
  }

  // Validation 3: ตรวจสอบว่าผู้เรียนมีตัวตนจริงในโครงการ
  const learner = learners.find(l => l.id === learnerId.trim().toUpperCase());
  if (!learner) {
    return res.status(404).json({
      success: false,
      error: 'LEARNER_NOT_FOUND',
      message: `ไม่พบรหัสผู้เรียน ${learnerId} ในระบบ กรุณาตรวจสอบรหัสอีกครั้ง`
    });
  }

  // Validation 4: DUPLICATE PREVENTION (ป้องกันการส่งซ้ำ)
  // หากผู้เรียนมีคำขอที่สถานะยังเป็น OPEN หรือ ASSIGNED อยู่แล้ว จะไม่อนุญาตให้เปิดใบใหม่ซ้ำซ้อน
  const existingActiveTicket = tickets.find(
    t => t.learnerId === learner.id && (t.status === 'OPEN' || t.status === 'ASSIGNED')
  );

  if (existingActiveTicket) {
    return res.status(409).json({
      success: false,
      error: 'DUPLICATE_ACTIVE_TICKET',
      message: `ท่านมีคำร้องหมายเลข ${existingActiveTicket.id} ที่กำลังอยู่ในระหว่างดำเนินการ กรุณารอทีมงานตอบกลับ หรือแก้ไขข้อมูลในคำร้องเดิม`,
      existingTicket: existingActiveTicket
    });
  }

  // คำนวณ Priority อัตโนมัติ ผสานกับความต้องการของผู้ใช้
  const systemPriority = calculatePriority(category, learner.deviceType, learner.daysSinceLastActive);
  const finalPriority = userPriority === 'CRITICAL' ? 'CRITICAL' : systemPriority;

  // สร้าง Ticket ใหม่
  const newTicket = {
    id: `TICK-${ticketCounter++}`,
    learnerId: learner.id,
    learnerName: learner.name,
    deviceType: learner.deviceType,
    track: learner.track,
    category,
    priority: finalPriority,
    problemSummary: problemSummary.trim(),
    problemDetail: problemDetail.trim(),
    selfTriageTried: Boolean(selfTriageTried),
    status: 'OPEN',
    assignedMentor: null,
    mentorNote: '',
    resolutionAction: '',
    createdAt: new Date().toISOString(),
    resolvedAt: null
  };

  tickets.unshift(newTicket); // เพิ่มไว้บนสุด
  learner.status = 'stuck'; // ปรับสถานะผู้เรียนเป็นติดปัญหา

  res.status(201).json({
    success: true,
    message: 'ส่งคำขอความช่วยเหลือเรียบร้อยแล้ว ทีมงานจะเร่งตรวจสอบตามลำดับความเร่งด่วน',
    ticket: newTicket
  });
});

// 6. ดึงรายการตั๋วขอความช่วยเหลือทั้งหมด (สำหรับ Mentor Dashboard)
app.get('/api/tickets', (req, res) => {
  const { status, priority, category } = req.query;
  let result = [...tickets];

  if (status) {
    result = result.filter(t => t.status === status);
  }
  if (priority) {
    result = result.filter(t => t.priority === priority);
  }
  if (category) {
    result = result.filter(t => t.category === category);
  }

  // เรียงลำดับ: CRITICAL -> HIGH -> MEDIUM -> LOW ตามด้วยเวลา
  const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  result.sort((a, b) => {
    if (a.status === 'RESOLVED' && b.status !== 'RESOLVED') return 1;
    if (a.status !== 'RESOLVED' && b.status === 'RESOLVED') return -1;
    const diff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    if (diff !== 0) return diff;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  res.json({
    success: true,
    count: result.length,
    data: result
  });
});

// 7. อัปเดตสถานะตั๋ว (Assign พี่เลี้ยง / ปิดเคสพร้อมคำแนะนำ)
app.patch('/api/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { status, assignedMentor, mentorNote, resolutionAction } = req.body;

  const ticket = tickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({
      success: false,
      error: 'TICKET_NOT_FOUND',
      message: `ไม่พบตั๋วหมายเลข ${id}`
    });
  }

  // State Transition Logic
  if (status) {
    const validStatuses = ['OPEN', 'ASSIGNED', 'RESOLVED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_STATUS',
        message: `สถานะไม่ถูกต้อง อนุญาตเฉพาะ: ${validStatuses.join(', ')}`
      });
    }

    // กรณีเปลี่ยนเป็น RESOLVED ต้องมีข้อความคำแนะนำให้ผู้เรียน
    if (status === 'RESOLVED') {
      if (!resolutionAction && !ticket.resolutionAction) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_RESOLUTION_ACTION',
          message: 'การปิดเคส (RESOLVED) ต้องระบุแนวทางก้าวต่อไป (resolutionAction) ให้ผู้เรียน'
        });
      }
      ticket.resolvedAt = new Date().toISOString();

      // เมื่อเคสแก้เสร็จ เปลี่ยนสถานะผู้เรียนกลับเป็น active
      const learner = learners.find(l => l.id === ticket.learnerId);
      if (learner && learner.status === 'stuck') {
        learner.status = 'active';
      }
    }

    ticket.status = status;
  }

  if (assignedMentor !== undefined) ticket.assignedMentor = assignedMentor;
  if (mentorNote !== undefined) ticket.mentorNote = mentorNote;
  if (resolutionAction !== undefined) ticket.resolutionAction = resolutionAction;

  res.json({
    success: true,
    message: `อัปเดตตั๋ว ${id} สำเร็จ`,
    ticket
  });
});

// 8. รีเซ็ตข้อมูลกลับสู่ค่าเริ่มต้น (สำหรับการทดสอบและการประเมินงาน)
app.post('/api/reset', (req, res) => {
  learners = generateMockLearners();
  tickets = JSON.parse(JSON.stringify(initialTickets));
  ticketCounter = 104;

  res.json({
    success: true,
    message: 'รีเซ็ตข้อมูล Mock 60 คนและตั๋วเริ่มต้นเรียบร้อยแล้ว'
  });
});

// เริ่มต้นเปิดเซิร์ฟเวอร์
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 StepForward System Running on http://localhost:${PORT}`);
    console.log(`📱 Learner Portal:  http://localhost:${PORT}/index.html`);
    console.log(`🖥️ Mentor Dashboard: http://localhost:${PORT}/mentor.html`);
    console.log(`====================================================`);
  });
}

module.exports = app;
