// public/mockAdapter.js - Client-Side Mock Adapter for GitHub Pages Demo Mode
// จะทำงานอัตโนมัติเฉพาะเมื่อไม่มี Node.js Backend รองรับ (เช่น บน GitHub Pages)

(function() {
  const originalFetch = window.fetch;

  // ตรวจสอบเบื้องต้นว่ามี Backend ทำงานอยู่หรือไม่
  let isStaticHost = window.location.hostname.includes('github.io') || window.location.protocol === 'file:';

  // Seed Data
  const defaultLearners = [
    { id: "STU-001", name: "สมชาย สุขเกษม", track: "Basic Web Development", deviceType: "laptop", completedDays: 8, targetDays: 14, status: "active", daysSinceLastActive: 0, lastActiveDate: "2026-10-18" },
    { id: "STU-005", name: "ศศิธร รัตนโชติ", track: "Digital Marketing & AI Tools", deviceType: "smartphone", completedDays: 4, targetDays: 14, status: "stuck", daysSinceLastActive: 1, lastActiveDate: "2026-10-17" },
    { id: "STU-008", name: "อนุชา สายทอง", track: "Basic Web Development", deviceType: "smartphone", completedDays: 2, targetDays: 14, status: "dropout_risk", daysSinceLastActive: 4, lastActiveDate: "2026-10-14" },
    { id: "STU-010", name: "ชลธิชา สมบูรณ์", track: "Basic Web Development", deviceType: "smartphone", completedDays: 5, targetDays: 14, status: "stuck", daysSinceLastActive: 2, lastActiveDate: "2026-10-16" },
    { id: "STU-015", name: "กัญญารัตน์ พงษ์สุวรรณ", track: "Data Analysis with Spreadsheets", deviceType: "laptop", completedDays: 9, targetDays: 14, status: "active", daysSinceLastActive: 0, lastActiveDate: "2026-10-18" }
  ];

  const defaultTickets = [
    {
      id: "TICK-101",
      learnerId: "STU-005",
      learnerName: "ศศิธร รัตนโชติ",
      deviceType: "smartphone",
      track: "Digital Marketing & AI Tools",
      category: "exercise_stuck",
      priority: "HIGH",
      problemSummary: "เปิดหน้าต่างตั้งค่า Prompt บนมือถือแล้วกดปุ่ม Save ไม่ติด",
      problemDetail: "ใช้ iPhone Safari เมื่อเลื่อนลงมาล่างสุด ปุ่มยืนยันโดนแถบเบราว์เซอร์บัง ทำให้ส่งการบ้านวันที่ 4 ไม่ได้",
      selfTriageTried: true,
      status: "OPEN",
      assignedMentor: null,
      mentorNote: "",
      resolutionAction: "",
      createdAt: "2026-10-17T09:30:00.000Z",
      resolvedAt: null
    },
    {
      id: "TICK-102",
      learnerId: "STU-010",
      learnerName: "ชลธิชา สมบูรณ์",
      deviceType: "smartphone",
      track: "Basic Web Development",
      category: "tools_setup",
      priority: "CRITICAL",
      problemSummary: "ติดตั้งโปรแกรมแก้ไขโค้ดบนมือถือไม่ได้ และไม่รู้จะใช้เว็บตัวไหนแทน",
      problemDetail: "ไม่มีคอมพิวเตอร์ ทำตามคลิปที่ใช้วินโดวส์ไม่ได้เลย ตอนนี้ค้างมา 2 วันแล้ว",
      selfTriageTried: false,
      status: "ASSIGNED",
      assignedMentor: "พี่เอ (ทีมหลัก)",
      mentorNote: "แนะนำให้ใช้ Replit ผ่านเว็บเบราว์เซอร์มือถือแทน",
      resolutionAction: "ส่งลิงก์ Replit Template พร้อมวิดีโอแนะนำการใช้งานบนมือถือ 3 นาที",
      createdAt: "2026-10-16T15:20:00.000Z",
      resolvedAt: null
    }
  ];

  function getLocalData(key, fallback) {
    const val = localStorage.getItem(`stepforward_${key}`);
    return val ? JSON.parse(val) : fallback;
  }

  function setLocalData(key, val) {
    localStorage.setItem(`stepforward_${key}`, JSON.stringify(val));
  }

  if (!localStorage.getItem('stepforward_learners')) {
    setLocalData('learners', defaultLearners);
  }
  if (!localStorage.getItem('stepforward_tickets')) {
    setLocalData('tickets', defaultTickets);
  }

  window.fetch = async function(url, options = {}) {
    // หากไม่ใช่ Static Host ให้ลอง fetch จริงก่อน
    if (!isStaticHost) {
      try {
        const res = await originalFetch(url, options);
        if (res.status !== 404 && res.status !== 502) {
          return res;
        }
      } catch (e) {
        // Fallback to static mock
        console.warn('Backend server not detected. Switching to Client-Side Mock Mode.');
        isStaticHost = true;
      }
    }

    // Client-side Mock API Handler
    const path = typeof url === 'string' ? url : url.url;
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : {};

    let learners = getLocalData('learners', defaultLearners);
    let tickets = getLocalData('tickets', defaultTickets);

    const makeJsonResponse = (status, data) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
      });
    };

    // 1. GET /api/stats
    if (path === '/api/stats' || path.endsWith('/api/stats')) {
      return makeJsonResponse(200, {
        learners: {
          total: 60,
          active: learners.filter(l => l.status === 'active').length + 40,
          stuck: learners.filter(l => l.status === 'stuck').length,
          dropoutRisk: learners.filter(l => l.status === 'dropout_risk').length + 3
        },
        tickets: {
          total: tickets.length,
          open: tickets.filter(t => t.status === 'OPEN').length,
          assigned: tickets.filter(t => t.status === 'ASSIGNED').length,
          resolved: tickets.filter(t => t.status === 'RESOLVED').length,
          criticalPending: tickets.filter(t => t.status !== 'RESOLVED' && t.priority === 'CRITICAL').length
        }
      });
    }

    // 2. GET /api/learners/:id
    const learnerMatch = path.match(/\/api\/learners\/([A-Za-z0-9_-]+)/);
    if (learnerMatch && method === 'GET') {
      const id = learnerMatch[1].toUpperCase();
      let learner = learners.find(l => l.id === id);
      if (!learner) {
        // สร้างผู้เรียนอัตโนมัติถ้ากรอก STU-001 ถึง STU-060
        learner = {
          id,
          name: `ผู้เรียน ${id}`,
          track: "Basic Web Development",
          deviceType: id.endsWith('5') || id.endsWith('0') ? "smartphone" : "laptop",
          completedDays: 5,
          targetDays: 14,
          status: "active",
          daysSinceLastActive: 0,
          lastActiveDate: "2026-10-18"
        };
        learners.push(learner);
        setLocalData('learners', learners);
      }

      const activeTicket = tickets.find(
        t => t.learnerId === id && (t.status === 'OPEN' || t.status === 'ASSIGNED')
      );

      return makeJsonResponse(200, {
        success: true,
        data: learner,
        activeTicket: activeTicket || null
      });
    }

    // 3. GET /api/learners
    if (path.includes('/api/learners') && method === 'GET') {
      return makeJsonResponse(200, {
        success: true,
        count: learners.length,
        data: learners
      });
    }

    // 4. POST /api/checkin
    if (path.endsWith('/api/checkin') && method === 'POST') {
      const learner = learners.find(l => l.id === body.learnerId);
      if (learner) {
        learner.completedDays = Math.min(14, learner.completedDays + 1);
        learner.status = 'active';
        setLocalData('learners', learners);
      }
      return makeJsonResponse(200, { success: true, learner });
    }

    // 5. POST /api/tickets
    if (path.endsWith('/api/tickets') && method === 'POST') {
      const { learnerId, category, problemSummary, problemDetail, userPriority } = body;

      const existing = tickets.find(t => t.learnerId === learnerId && (t.status === 'OPEN' || t.status === 'ASSIGNED'));
      if (existing) {
        return makeJsonResponse(409, {
          success: false,
          error: 'DUPLICATE_ACTIVE_TICKET',
          message: `ท่านมีคำร้องหมายเลข ${existing.id} ที่กำลังอยู่ในระหว่างดำเนินการ กรุณารอทีมงานตอบกลับ`,
          existingTicket: existing
        });
      }

      const newTicket = {
        id: `TICK-${Date.now().toString().slice(-3)}`,
        learnerId,
        learnerName: `ผู้เรียน (${learnerId})`,
        deviceType: "smartphone",
        track: "Basic Web Development",
        category,
        priority: userPriority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        problemSummary,
        problemDetail,
        status: 'OPEN',
        assignedMentor: null,
        mentorNote: '',
        resolutionAction: '',
        createdAt: new Date().toISOString()
      };

      tickets.unshift(newTicket);
      setLocalData('tickets', tickets);

      return makeJsonResponse(201, {
        success: true,
        message: 'ส่งคำขอความช่วยเหลือเรียบร้อยแล้ว ทีมงานจะเร่งตรวจสอบตามลำดับความเร่งด่วน',
        ticket: newTicket
      });
    }

    // 6. GET /api/tickets
    if (path.includes('/api/tickets') && method === 'GET') {
      return makeJsonResponse(200, {
        success: true,
        data: tickets
      });
    }

    // 7. PATCH /api/tickets/:id
    const patchMatch = path.match(/\/api\/tickets\/([A-Za-z0-9_-]+)/);
    if (patchMatch && method === 'PATCH') {
      const id = patchMatch[1];
      const ticket = tickets.find(t => t.id === id);
      if (ticket) {
        if (body.status) ticket.status = body.status;
        if (body.assignedMentor) ticket.assignedMentor = body.assignedMentor;
        if (body.mentorNote) ticket.mentorNote = body.mentorNote;
        if (body.resolutionAction) ticket.resolutionAction = body.resolutionAction;
        setLocalData('tickets', tickets);
        return makeJsonResponse(200, { success: true, ticket });
      }
    }

    // 8. POST /api/reset
    if (path.endsWith('/api/reset') && method === 'POST') {
      setLocalData('learners', defaultLearners);
      setLocalData('tickets', defaultTickets);
      return makeJsonResponse(200, { success: true });
    }

    return makeJsonResponse(404, { success: false, message: 'Endpoint not found' });
  };
})();
