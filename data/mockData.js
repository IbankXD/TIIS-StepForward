// data/mockData.js
// ข้อมูลจำลองโครงการนำร่อง TIIS: ผู้เรียน 60 คน, ติดตามผล 14 วัน

const tracks = [
  "Basic Web Development",
  "Digital Marketing & AI Tools",
  "Data Analysis with Spreadsheets"
];

const firstNames = [
  "สมชาย", "วิภา", "กิตติ", "ณัฐพล", "ศศิธร", "ธนกร", "ปิยะดา", "อนุชา", "พิมพ์ใจ", "ชลธิชา",
  "เอกชัย", "วรัญญา", "ธีรภัทร", "อรอนงค์", "สุรศักดิ์", "กัญญารัตน์", "เกียรติศักดิ์", "เบญจมาศ", "นพดล", "มัลลิกา",
  "พงศ์พัฒน์", "รุ่งทิพย์", "อานนท์", "สุชาดา", "จิรายุ", "ปิยมาศ", "รพีพัฒน์", "ชนิกานต์", "สิทธิโชค", "นิตยา",
  "ชานนท์", "ปวีณา", "ศิริชัย", "สุภัทรา", "กฤติน", "ภัทรภร", "ธนพล", "พัชรี", "อรรถพล", "วรรณิศา",
  "ปรเมศวร์", "ลลิตา", "วรวุฒิ", "ดวงกมล", "พิชัย", "ศิริพร", "จักรพงษ์", "อัจฉรา", "กานต์", "ขวัญใจ",
  "ภูวดล", "กุลธิดา", "ยุทธนา", "เมทินี", "วิศรุต", "ชญานิศ", "ธนภูมิ", "อารียา", "ภาณุพงศ์", "สุพรรษา"
];

const lastNames = [
  "สุขเกษม", "วงษ์สุวรรณ", "เจริญผล", "ทองดี", "รัตนโชติ", "มณีรัตน์", "บุญชู", "สายทอง", "ศิริวัฒน์", "สมบูรณ์",
  "ตั้งตรงจิตร", "ไพโรจน์", "แก้วมณี", "สุขสวัสดิ์", "พงษ์สุวรรณ", "ประเสริฐยิ่ง", "มั่นคง", "งามวงศ์", "มีชัย", "จันทร",
  "เรืองฤทธิ์", "วงค์ษา", "สว่างวงษ์", "อินทร์ทอง", "ยอดเยี่ยม", "สิงห์ทอง", "ทองทา", "กิตติคุณ", "แซ่ลิ้ม", "วัฒนธรรม",
  "พิมพา", "ศรีสวัสดิ์", "ภักดี", "แสงเดือน", "สุวรรณศรี", "ดวงจันทร์", "มีสุข", "เลิศรัตน์", "คงเจริญ", "บุณยรัตน์",
  "พงษ์พิพัฒน์", "สุทธิสาร", "วรจักร", "ธนกิจ", "รุ่งเรือง", "ชำนาญศิลป์", "บำรุงวงศ์", "จิตต์ประเสริฐ", "นิมิตพงษ์", "เกตุแก้ว",
  "ใจซื่อ", "ศรีเมือง", "เพชรประสิทธิ์", "ศิริพงษ์", "ทองทิพย์", "ประยูรพงษ์", "อัมพร", "รัตนพันธ์", "กอบกิจ", "วัฒนกุล"
];

function generateMockLearners() {
  const learners = [];
  const baseDate = new Date("2026-10-17T12:00:00Z");

  for (let i = 1; i <= 60; i++) {
    const id = `STU-${String(i).padStart(3, "0")}`;
    const name = `${firstNames[i - 1]} ${lastNames[i - 1]}`;
    const track = tracks[(i - 1) % tracks.length];

    // อุปกรณ์: 40% มือถือ, 50% แล็ปท็อป, 10% แท็บเล็ต (สะท้อนโจทย์เรื่องคนใช้มือถือเป็นหลัก)
    let deviceType = "laptop";
    if (i % 10 <= 3) deviceType = "smartphone"; // 40%
    else if (i % 10 === 9) deviceType = "tablet"; // 10%

    // กำหนดสถานะและวันเช็คอินล่าสุด
    // บางคน Active ปกติ, บางคนติดปัญหา (Stuck), บางคนเงียบหายเกิน 3 วัน (Dropout Risk)
    let completedDays = Math.min(14, Math.floor(Math.random() * 10) + 1);
    let status = "active";
    let daysSinceLastActive = 0;

    if (i % 8 === 0) {
      // กลุ่มที่เสี่ยงหลุด (เงียบเกิน 3 วัน)
      daysSinceLastActive = 4;
      status = "dropout_risk";
    } else if (i % 5 === 0) {
      // กลุ่มที่กำลังติดปัญหา
      daysSinceLastActive = 1;
      status = "stuck";
    } else {
      daysSinceLastActive = (i % 2 === 0) ? 0 : 1;
      status = "active";
    }

    const lastActive = new Date(baseDate.getTime() - daysSinceLastActive * 24 * 60 * 60 * 1000);

    learners.push({
      id,
      name,
      track,
      deviceType,
      completedDays,
      targetDays: 14,
      status,
      lastActiveDate: lastActive.toISOString().split("T")[0],
      daysSinceLastActive
    });
  }

  return learners;
}

const initialTickets = [
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
    mentorNote: "แนะนำให้ใช้ Replit หรือ CodeSandbox ผ่านเว็บเบราว์เซอร์มือถือแทน ไม่ต้องติดตั้งโปรแกรมลงเครื่อง",
    resolutionAction: "ส่งลิงก์ Replit Template พร้อมวิดีโอแนะนำการใช้งานบนมือถือ 3 นาที",
    createdAt: "2026-10-16T15:20:00.000Z",
    resolvedAt: null
  },
  {
    id: "TICK-103",
    learnerId: "STU-015",
    learnerName: "กัญญารัตน์ พงษ์สุวรรณ",
    deviceType: "laptop",
    track: "Data Analysis with Spreadsheets",
    category: "clarification",
    priority: "MEDIUM",
    problemSummary: "สูตร XLOOKUP ในแบบฝึกหัดวันที่ 6 ขึ้น #N/A ตลอดเวลา",
    problemDetail: "ตรวจสอบช่วงข้อมูลแล้วตรงกัน แต่น่าจะมีช่องว่างเกินมาในรหัสสินค้า",
    selfTriageTried: true,
    status: "RESOLVED",
    assignedMentor: "พี่บี (ทีมหลัก)",
    mentorNote: "ให้ใช้ฟังก์ชัน TRIM() ครอบคอลัมน์รหัสสินค้าเพื่อลบ space ที่มองไม่เห็น",
    resolutionAction: "ผู้เรียนทำสำเร็จแล้ว และส่งแบบฝึกหัดวันที่ 6 เรียบร้อย",
    createdAt: "2026-10-16T10:00:00.000Z",
    resolvedAt: "2026-10-16T11:45:00.000Z"
  }
];

module.exports = {
  generateMockLearners,
  initialTickets
};
