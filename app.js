// public/app.js - Learner Portal Logic

let currentLearner = null;

// Elements
const inputLearnerId = document.getElementById('inputLearnerId');
const btnLoadLearner = document.getElementById('btnLoadLearner');
const learnerAlertArea = document.getElementById('learnerAlertArea');

const learnerProfileSection = document.getElementById('learnerProfileSection');
const learnerName = document.getElementById('learnerName');
const learnerTrack = document.getElementById('learnerTrack');
const learnerDevice = document.getElementById('learnerDevice');
const learnerStatusBadge = document.getElementById('learnerStatusBadge');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const checkinFeedback = document.getElementById('checkinFeedback');

const activeTicketSection = document.getElementById('activeTicketSection');
const activeTicketStatusBadge = document.getElementById('activeTicketStatusBadge');
const ticketIdDisplay = document.getElementById('ticketIdDisplay');
const ticketSummaryDisplay = document.getElementById('ticketSummaryDisplay');
const ticketDetailDisplay = document.getElementById('ticketDetailDisplay');
const ticketPriorityDisplay = document.getElementById('ticketPriorityDisplay');
const mentorAssignmentArea = document.getElementById('mentorAssignmentArea');
const ticketMentorDisplay = document.getElementById('ticketMentorDisplay');
const mentorResolutionArea = document.getElementById('mentorResolutionArea');
const ticketResolutionDisplay = document.getElementById('ticketResolutionDisplay');

const helpFormSection = document.getElementById('helpFormSection');
const ticketForm = document.getElementById('ticketForm');
const categorySelect = document.getElementById('categorySelect');
const problemSummary = document.getElementById('problemSummary');
const problemDetail = document.getElementById('problemDetail');
const userPriority = document.getElementById('userPriority');
const checkRefresh = document.getElementById('checkRefresh');
const checkDevice = document.getElementById('checkDevice');
const formFeedbackArea = document.getElementById('formFeedbackArea');
const btnSubmitTicket = document.getElementById('btnSubmitTicket');

// Event Listeners
btnLoadLearner.addEventListener('click', () => loadLearnerData(inputLearnerId.value));
inputLearnerId.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') loadLearnerData(inputLearnerId.value);
});
ticketForm.addEventListener('submit', handleTicketSubmit);

// Quick select helper
window.quickSelectLearner = function(id) {
  inputLearnerId.value = id;
  loadLearnerData(id);
};

// Scroll to form
window.scrollToTicketForm = function() {
  helpFormSection.scrollIntoView({ behavior: 'smooth' });
  categorySelect.focus();
};

// Load Learner Profile & Active Tickets
async function loadLearnerData(id) {
  const cleanId = id.trim().toUpperCase();
  if (!cleanId) {
    showAlert(learnerAlertArea, 'alert-danger', 'กรุณาระบุรหัสผู้เรียน (เช่น STU-001)');
    return;
  }

  showAlert(learnerAlertArea, 'alert-info', 'กำลังค้นหาข้อมูล...');

  try {
    const res = await fetch(`/api/learners/${cleanId}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      showAlert(learnerAlertArea, 'alert-danger', data.message || 'ไม่พบข้อมูลผู้เรียน');
      learnerProfileSection.style.display = 'none';
      activeTicketSection.style.display = 'none';
      helpFormSection.style.display = 'none';
      currentLearner = null;
      return;
    }

    learnerAlertArea.innerHTML = '';
    currentLearner = data.data;
    renderLearnerProfile(data.data);
    renderTicketState(data.activeTicket);

  } catch (err) {
    console.error(err);
    showAlert(learnerAlertArea, 'alert-danger', 'เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
  }
}

function renderLearnerProfile(learner) {
  learnerProfileSection.style.display = 'block';
  learnerName.textContent = learner.name + ` (${learner.id})`;
  learnerTrack.textContent = learner.track;
  learnerDevice.textContent = learner.deviceType === 'smartphone' ? '📱 สมาร์ทโฟน' : (learner.deviceType === 'laptop' ? '💻 แล็ปท็อป/คอมพิวเตอร์' : '📟 แท็บเล็ต');
  
  // Status badge
  learnerStatusBadge.className = 'badge';
  if (learner.status === 'active') {
    learnerStatusBadge.classList.add('badge-resolved');
    learnerStatusBadge.textContent = 'กำลังก้าวต่อ (Active)';
  } else if (learner.status === 'stuck') {
    learnerStatusBadge.classList.add('badge-high');
    learnerStatusBadge.textContent = 'ติดปัญหา (Stuck)';
  } else if (learner.status === 'dropout_risk') {
    learnerStatusBadge.classList.add('badge-critical');
    learnerStatusBadge.textContent = `เงียบ ${learner.daysSinceLastActive} วัน (Dropout Risk)`;
  }

  // Progress
  const pct = Math.round((learner.completedDays / learner.targetDays) * 100);
  progressText.textContent = `${learner.completedDays} / ${learner.targetDays} วัน (${pct}%)`;
  progressBar.style.width = `${pct}%`;

  // Dynamic device checklist text
  const deviceCheckText = document.getElementById('deviceCheckText');
  if (learner.deviceType === 'smartphone') {
    deviceCheckText.textContent = 'ลองสลับเป็นแนวนอน หรือเปิดแท็บใหม่ในโหมดเดสก์ท็อป (Desktop Site)';
  } else {
    deviceCheckText.textContent = 'ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต และลองเคลียร์แคชเบราว์เซอร์';
  }
}

function renderTicketState(activeTicket) {
  if (activeTicket) {
    // ผู้เรียนมีคำขอที่ยังค้างอยู่ -> แสดง Active Ticket และซ่อนฟอร์ม (ป้องกัน Duplicate)
    activeTicketSection.style.display = 'block';
    helpFormSection.style.display = 'none';

    ticketIdDisplay.textContent = activeTicket.id;
    ticketSummaryDisplay.textContent = activeTicket.problemSummary;
    ticketDetailDisplay.textContent = activeTicket.problemDetail;
    ticketPriorityDisplay.innerHTML = `<span class="badge badge-${activeTicket.priority.toLowerCase()}">${activeTicket.priority}</span>`;

    // Step indicators
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');

    step1.className = 'ticket-step done';
    step2.className = 'ticket-step';
    step3.className = 'ticket-step';

    activeTicketStatusBadge.className = 'badge';

    if (activeTicket.status === 'OPEN') {
      activeTicketStatusBadge.classList.add('badge-open');
      activeTicketStatusBadge.textContent = 'รอดำเนินการ (OPEN)';
      mentorAssignmentArea.style.display = 'none';
      mentorResolutionArea.style.display = 'none';
      step2.className = 'ticket-step active';
    } else if (activeTicket.status === 'ASSIGNED') {
      activeTicketStatusBadge.classList.add('badge-assigned');
      activeTicketStatusBadge.textContent = 'พี่เลี้ยงกำลังดูแล (IN PROGRESS)';
      mentorAssignmentArea.style.display = 'block';
      ticketMentorDisplay.textContent = activeTicket.assignedMentor || 'ทีมงานหลัก';
      mentorResolutionArea.style.display = 'none';
      step2.className = 'ticket-step done';
      step3.className = 'ticket-step active';
    } else if (activeTicket.status === 'RESOLVED') {
      activeTicketStatusBadge.classList.add('badge-resolved');
      activeTicketStatusBadge.textContent = 'แก้ไขเรียบร้อย (RESOLVED)';
      mentorAssignmentArea.style.display = 'block';
      ticketMentorDisplay.textContent = activeTicket.assignedMentor;
      mentorResolutionArea.style.display = 'block';
      ticketResolutionDisplay.textContent = activeTicket.resolutionAction;
      step2.className = 'ticket-step done';
      step3.className = 'ticket-step done';
    }

  } else {
    // ไม่มีคำขอค้างอยู่ -> ซ่อนกล่อง Active Ticket และแสดงฟอร์มให้ส่งคำร้องได้
    activeTicketSection.style.display = 'none';
    helpFormSection.style.display = 'block';
    formFeedbackArea.innerHTML = '';
  }
}

// Daily check-in
window.submitCheckin = async function(mood) {
  if (!currentLearner) return;

  try {
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learnerId: currentLearner.id,
        mood
      })
    });
    const data = await res.json();
    if (data.success) {
      checkinFeedback.style.display = 'block';
      checkinFeedback.textContent = '🎉 เยี่ยมมาก! บันทึกความคืบหน้าก้าวต่อไปเรียบร้อยแล้ว';
      renderLearnerProfile(data.learner);
      setTimeout(() => { checkinFeedback.style.display = 'none'; }, 4000);
    }
  } catch (err) {
    console.error(err);
  }
};

// Handle Help Ticket Submission
async function handleTicketSubmit(e) {
  e.preventDefault();

  if (!currentLearner) {
    showAlert(formFeedbackArea, 'alert-danger', 'กรุณาระบุรหัสผู้เรียนก่อนส่งคำขอ');
    return;
  }

  const category = categorySelect.value;
  const summary = problemSummary.value.trim();
  const detail = problemDetail.value.trim();
  const priorityChoice = userPriority.value;
  const selfTriage = checkRefresh.checked || checkDevice.checked;

  // Client-Side Validation
  if (!category) {
    showAlert(formFeedbackArea, 'alert-danger', 'กรุณาเลือกประเภทปัญหาที่พบ');
    categorySelect.focus();
    return;
  }
  if (summary.length < 5) {
    showAlert(formFeedbackArea, 'alert-danger', 'กรุณาสรุปปัญหาอย่างน้อย 5 ตัวอักษร');
    problemSummary.focus();
    return;
  }
  if (detail.length < 10) {
    showAlert(formFeedbackArea, 'alert-danger', 'กรุณากรอกรายละเอียดสิ่งที่ติดขัดอย่างน้อย 10 ตัวอักษร');
    problemDetail.focus();
    return;
  }

  btnSubmitTicket.disabled = true;
  btnSubmitTicket.textContent = '⏳ กำลังส่งข้อมูล...';
  formFeedbackArea.innerHTML = '';

  try {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        learnerId: currentLearner.id,
        category,
        problemSummary: summary,
        problemDetail: detail,
        selfTriageTried: selfTriage,
        userPriority: priorityChoice
      })
    });

    const data = await res.json();

    if (!res.ok) {
      // จัดการ Error กรณี Duplicate หรืออื่นๆ
      if (res.status === 409) {
        showAlert(formFeedbackArea, 'alert-warning', `⚠️ ${data.message}`);
        setTimeout(() => {
          renderTicketState(data.existingTicket);
        }, 1500);
      } else {
        showAlert(formFeedbackArea, 'alert-danger', `❌ ${data.message || 'ส่งคำขอไม่สำเร็จ'}`);
      }
      return;
    }

    // สำเร็จ! แสดงผลลัพธ์และขั้นตอนต่อไป
    showAlert(formFeedbackArea, 'alert-success', `✅ ${data.message} (รหัสตั๋ว: ${data.ticket.id})`);
    ticketForm.reset();

    setTimeout(() => {
      loadLearnerData(currentLearner.id);
    }, 1200);

  } catch (err) {
    console.error(err);
    showAlert(formFeedbackArea, 'alert-danger', 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  } finally {
    btnSubmitTicket.disabled = false;
    btnSubmitTicket.textContent = '🚀 ส่งคำขอความช่วยเหลือไปยังทีมพี่เลี้ยง';
  }
}

function showAlert(targetEl, alertClass, message) {
  targetEl.innerHTML = `
    <div class="alert ${alertClass}">
      <div>${message}</div>
    </div>
  `;
}
