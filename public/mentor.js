// public/mentor.js - Logic for Mentor Triage Dashboard

let allTickets = [];
let currentFilter = 'ALL';

const statTotalLearners = document.getElementById('statTotalLearners');
const statCriticalTickets = document.getElementById('statCriticalTickets');
const statPendingTickets = document.getElementById('statPendingTickets');
const statDropoutRisk = document.getElementById('statDropoutRisk');
const dropoutBadge = document.getElementById('dropoutBadge');
const dropoutLearnersList = document.getElementById('dropoutLearnersList');
const ticketTableBody = document.getElementById('ticketTableBody');
const currentMentorSelect = document.getElementById('currentMentorSelect');
const btnResetData = document.getElementById('btnResetData');

// Modal Elements
const actionModal = document.getElementById('actionModal');
const modalTicketId = document.getElementById('modalTicketId');
const modalTicketTitle = document.getElementById('modalTicketTitle');
const modalTicketDetails = document.getElementById('modalTicketDetails');
const modalStatusSelect = document.getElementById('modalStatusSelect');
const modalMentorNote = document.getElementById('modalMentorNote');
const modalResolutionAction = document.getElementById('modalResolutionAction');
const groupResolutionAction = document.getElementById('groupResolutionAction');
const modalAlertArea = document.getElementById('modalAlertArea');
const modalForm = document.getElementById('modalForm');

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  btnResetData.addEventListener('click', handleResetData);
  modalForm.addEventListener('submit', handleModalSubmit);
  modalStatusSelect.addEventListener('change', () => {
    if (modalStatusSelect.value === 'RESOLVED') {
      groupResolutionAction.style.display = 'block';
    } else {
      groupResolutionAction.style.display = 'none';
    }
  });
});

async function loadDashboardData() {
  await Promise.all([
    fetchStats(),
    fetchDropoutRiskLearners(),
    fetchTickets()
  ]);
}

// 1. Fetch Stats
async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    statTotalLearners.textContent = data.learners.total;
    statCriticalTickets.textContent = data.tickets.criticalPending;
    statPendingTickets.textContent = data.tickets.open;
    statDropoutRisk.textContent = data.learners.dropoutRisk;
    dropoutBadge.textContent = `ตรวจพบ ${data.learners.dropoutRisk} คน`;
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

// 2. Fetch Silent-Dropout Risk Learners
async function fetchDropoutRiskLearners() {
  try {
    const res = await fetch('/api/learners?status=dropout_risk');
    const data = await res.json();
    if (!data.success) return;

    dropoutLearnersList.innerHTML = '';
    data.data.forEach(learner => {
      const chip = document.createElement('div');
      chip.style.cssText = `
        background: #fff7ed;
        border: 1px solid #fdba74;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      chip.innerHTML = `
        <div>
          <strong>${learner.name}</strong> (${learner.id})
          <div style="font-size: 0.75rem; color: #9a3412;">
            เงียบไป ${learner.daysSinceLastActive} วัน | ${learner.deviceType === 'smartphone' ? '📱 มือถือ' : '💻 แล็ปท็อป'} | ทำได้ ${learner.completedDays}/14 วัน
          </div>
        </div>
        <button class="btn btn-outline btn-sm" style="padding: 3px 8px; font-size: 0.75rem; margin-left: 6px;" onclick="promptOutreach('${learner.id}', '${learner.name}')">
          ✉️ ทักทาย
        </button>
      `;
      dropoutLearnersList.appendChild(chip);
    });

  } catch (err) {
    console.error('Error fetching dropout risk:', err);
  }
}

window.promptOutreach = function(id, name) {
  alert(`[Proactive Outreach]\nแนะนำให้ ${currentMentorSelect.value} ส่งข้อความทักทายคุณ ${name} (${id})\nตัวอย่างข้อความ: "สวัสดีครับคุณ ${name} พี่ๆ ทีมงานเห็นว่าเงียบไป 3-4 วัน ติดขัดตรงส่วนไหนของการนำไปใช้ไหมครับ สามารถทักมาคุยหรือขอคำแนะนำได้ตลอดเลยนะ พี่ๆ พร้อมช่วยครับ!"`);
};

// 3. Fetch Tickets
async function fetchTickets() {
  try {
    const res = await fetch('/api/tickets');
    const data = await res.json();
    if (!data.success) return;

    allTickets = data.data;
    renderTicketsTable();
  } catch (err) {
    console.error('Error fetching tickets:', err);
  }
}

window.filterTickets = function(filter) {
  currentFilter = filter;
  document.querySelectorAll('.active-filter').forEach(btn => btn.classList.remove('active-filter'));
  event.target.classList.add('active-filter');
  renderTicketsTable();
};

function renderTicketsTable() {
  ticketTableBody.innerHTML = '';

  let filtered = allTickets;
  if (currentFilter !== 'ALL') {
    filtered = allTickets.filter(t => t.status === currentFilter);
  }

  if (filtered.length === 0) {
    ticketTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--gray-600); padding: 24px;">
          ไม่มีรายการคำขอในหมวดนี้
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(ticket => {
    const tr = document.createElement('tr');

    const priorityClass = `badge-${ticket.priority.toLowerCase()}`;
    const statusClass = `badge-${ticket.status.toLowerCase()}`;

    const deviceIcon = ticket.deviceType === 'smartphone' ? '📱' : '💻';

    tr.innerHTML = `
      <td><strong>${ticket.id}</strong></td>
      <td><span class="badge ${priorityClass}">${ticket.priority}</span></td>
      <td>
        <strong>${ticket.learnerName}</strong> (${ticket.learnerId})
        <div style="font-size: 0.78rem; color: var(--gray-600);">${deviceIcon} ${ticket.track}</div>
      </td>
      <td>
        <div style="font-weight: 600;">${ticket.problemSummary}</div>
        <div style="font-size: 0.78rem; color: var(--gray-600); max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${ticket.problemDetail}
        </div>
      </td>
      <td><span class="badge ${statusClass}">${ticket.status}</span></td>
      <td>${ticket.assignedMentor || '<span style="color: var(--gray-600);">-</span>'}</td>
      <td style="text-align: right;">
        <button class="btn btn-outline btn-sm" onclick="openTicketActionModal('${ticket.id}')">
          ⚙️ จัดการ
        </button>
      </td>
    `;
    ticketTableBody.appendChild(tr);
  });
}

// 4. Modal Management
window.openTicketActionModal = function(ticketId) {
  const ticket = allTickets.find(t => t.id === ticketId);
  if (!ticket) return;

  modalTicketId.value = ticket.id;
  modalTicketTitle.textContent = `จัดการคำขอ ${ticket.id} - ${ticket.learnerName}`;
  modalTicketDetails.innerHTML = `
    <div><strong>เรื่อง:</strong> ${ticket.problemSummary}</div>
    <div style="margin-top: 4px;"><strong>รายละเอียด:</strong> ${ticket.problemDetail}</div>
    <div style="margin-top: 4px;"><strong>อุปกรณ์:</strong> ${ticket.deviceType} | <strong>ความเร่งด่วน:</strong> ${ticket.priority}</div>
  `;

  modalStatusSelect.value = ticket.status === 'RESOLVED' ? 'RESOLVED' : 'ASSIGNED';
  modalMentorNote.value = ticket.mentorNote || '';
  modalResolutionAction.value = ticket.resolutionAction || '';
  modalAlertArea.innerHTML = '';

  if (modalStatusSelect.value === 'RESOLVED') {
    groupResolutionAction.style.display = 'block';
  } else {
    groupResolutionAction.style.display = 'none';
  }

  actionModal.style.display = 'flex';
};

window.closeModal = function() {
  actionModal.style.display = 'none';
};

async function handleModalSubmit(e) {
  e.preventDefault();

  const id = modalTicketId.value;
  const status = modalStatusSelect.value;
  const mentorNote = modalMentorNote.value.trim();
  const resolutionAction = modalResolutionAction.value.trim();
  const assignedMentor = currentMentorSelect.value;

  if (status === 'RESOLVED' && !resolutionAction) {
    modalAlertArea.innerHTML = `
      <div class="alert alert-danger" style="padding: 8px 12px; margin-bottom: 8px;">
        กรุณาระบุแนวทางก้าวต่อไปสำหรับผู้เรียน ก่อนปิดเคส (RESOLVED)
      </div>
    `;
    modalResolutionAction.focus();
    return;
  }

  try {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        assignedMentor,
        mentorNote,
        resolutionAction
      })
    });

    const data = await res.json();
    if (!res.ok) {
      modalAlertArea.innerHTML = `
        <div class="alert alert-danger" style="padding: 8px 12px; margin-bottom: 8px;">
          ${data.message || 'บันทึกไม่สำเร็จ'}
        </div>
      `;
      return;
    }

    closeModal();
    await loadDashboardData();

  } catch (err) {
    console.error(err);
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }
}

// 5. Reset Demo Data
async function handleResetData() {
  if (!confirm('ต้องการรีเซ็ตข้อมูล Mock ทั้งหมด 60 คนกลับสู่ค่าเริ่มต้นสำหรับการทดสอบหรือไม่?')) return;

  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว!');
      await loadDashboardData();
    }
  } catch (err) {
    console.error(err);
  }
}
