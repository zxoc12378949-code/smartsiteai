// SmartSite AI - Core Application Logic

// ==========================================
// 1. MOCK DATA INITIALIZATION
// ==========================================

const INITIAL_USERS = [
  { id: "usr-1", name: "王大明", email: "daming.wang@smartsite.com", department: "工務組 - 工地主任", role: "Site Manager", avatar: "SM" },
  { id: "usr-2", name: "陳小明", email: "xiaoming.chen@smartsite.com", department: "安衛室 - 巡檢工程師", role: "Inspector", avatar: "IN" },
  { id: "usr-3", name: "黃監造", email: "supervisor.huang@consultant.com", department: "營建諮詢顧問 - 監造經理", role: "Supervisor", avatar: "SV" },
  { id: "usr-4", name: "李安管", email: "admin.lee@smartsite.com", department: "系統管理部 - 經理", role: "Administrator", avatar: "AD" }
];

const INITIAL_INSPECTIONS = [
  {
    id: "ins-1",
    date: "2026-06-01",
    projectName: "智慧大廈新建工程",
    workArea: "A區基礎",
    inspector: "陳小明",
    checklist: {
      helmet: "Pass",
      scaffold: "Pass",
      electrical: "Pass",
      fall: "Pass",
      storage: "Pass",
      housekeeping: "Pass"
    },
    result: "Pass",
    notes: "基礎開挖及週邊護欄防護網設置完善，現場標示清晰，未發現異常項目。",
    photos: []
  },
  {
    id: "ins-2",
    date: "2026-06-08",
    projectName: "智慧大廈新建工程",
    workArea: "B區主體",
    inspector: "陳小明",
    checklist: {
      helmet: "Pass",
      scaffold: "Fail",
      electrical: "Pass",
      fall: "Fail",
      storage: "Warning",
      housekeeping: "Pass"
    },
    result: "Fail",
    notes: "二樓外側施工架無搭設防護中欄桿，且部分高空作業人員未確實繫掛安全帶雙掛鉤，存有立即墬落危險，已要求現場工班暫停該區作業。",
    photos: []
  },
  {
    id: "ins-3",
    date: "2026-06-11",
    projectName: "智慧大廈新建工程",
    workArea: "C區外牆",
    inspector: "陳小明",
    checklist: {
      helmet: "Pass",
      scaffold: "Pass",
      electrical: "Pass",
      fall: "Pass",
      storage: "Warning",
      housekeeping: "Fail"
    },
    result: "Warning",
    notes: "外牆卸料平台周遭堆放廢模板與包裝材，阻礙安全走道避難通行。現場已口頭通知下游承商負責人限期今日清理完畢。",
    photos: []
  }
];

const INITIAL_DEFECTS = [
  {
    id: "def-1",
    title: "二樓外側施工架無搭設護欄與腳趾板",
    desc: "於B區結構體二樓外側，發現部分架設完畢之施工架未設置交叉拉桿、中欄桿及腳趾板，存有墜落與物體飛落危險。",
    workArea: "B區主體",
    assignee: "王大明",
    dueDate: "2026-06-18",
    riskLevel: "High",
    severity: 4,
    probability: 4,
    score: 16,
    status: "Open",
    createdDate: "2026-06-08",
    photos: [],
    resolvedDate: null,
    resolvedNotes: "",
    resolvedPhotos: [],
    closedDate: null
  },
  {
    id: "def-2",
    title: "高空作業人員未確實繫掛安全帶",
    desc: "B區二樓樑柱模板鋼筋綁紮高空作業人員，身穿安全防墜吊帶，但現場未繫掛於安全母索上，涉嫌違規危險作業。",
    workArea: "B區主體",
    assignee: "陳小明",
    dueDate: "2026-06-10",
    riskLevel: "High",
    severity: 5,
    probability: 4,
    score: 20,
    status: "In Progress",
    createdDate: "2026-06-08",
    photos: [],
    resolvedDate: null,
    resolvedNotes: "",
    resolvedPhotos: [],
    closedDate: null
  },
  {
    id: "def-3",
    title: "逃生通道雜物堆放阻礙通行",
    desc: "C區一樓安全走道與安全梯處，堆放大量拆卸下來的廢模板與水泥空袋，影響緊急避難逃生動線。",
    workArea: "C區外牆",
    assignee: "王大明",
    dueDate: "2026-06-14",
    riskLevel: "Medium",
    severity: 3,
    probability: 4,
    score: 12,
    status: "Resolved",
    createdDate: "2026-06-11",
    photos: [],
    resolvedDate: "2026-06-12",
    resolvedNotes: "現場廢棄木模與通道雜物已完成清理，恢復走道暢通，並宣導禁止暫存任何雜物。",
    resolvedPhotos: [],
    closedDate: null
  },
  {
    id: "def-4",
    title: "配電箱未加鎖且周圍有積水",
    desc: "D區機電室旁臨時配電箱門牌掀開未關閉鎖上，且正下方地面有清洗混凝土殘留積水，涉漏電觸電公安風險。",
    workArea: "D區機電",
    assignee: "王大明",
    dueDate: "2026-06-05",
    riskLevel: "High",
    severity: 4,
    probability: 4,
    score: 16,
    status: "Closed",
    createdDate: "2026-06-01",
    photos: [],
    resolvedDate: "2026-06-03",
    resolvedNotes: "電箱已關閉鎖上，周圍積水已清除，並擺放絕緣橡膠墊防護。",
    resolvedPhotos: [],
    closedDate: "2026-06-04"
  }
];

const INITIAL_ACTIVITIES = [
  { id: "act-1", type: "success", text: "<strong>陳小明</strong> 提交了 A區基礎 巡檢紀錄：綜合結果 <strong>Pass (合格)</strong>。", time: "2026-06-01 10:30" },
  { id: "act-2", type: "danger", text: "<strong>陳小明</strong> 通報了缺失 <strong>二樓外側施工架無搭設護欄</strong>，指派給 <strong>王大明</strong>。", time: "2026-06-08 14:15" },
  { id: "act-3", type: "warning", text: "缺失 <strong>高空作業人員未確實繫掛安全帶</strong> 狀態變更為 <strong>改善中 (In Progress)</strong>。", time: "2026-06-09 09:00" },
  { id: "act-4", type: "success", text: "<strong>王大明</strong> 完成了缺失 <strong>逃生通道雜物堆放阻礙通行</strong> 的改善，等待審核。", time: "2026-06-12 11:30" }
];

const INITIAL_NOTIFICATIONS = [
  { id: "noti-1", title: "逾期警告", desc: "缺失「高空作業人員未確實繫掛安全帶」已超過改善期限 (2026-06-10)。", time: "2 小時前", read: false },
  { id: "noti-2", title: "缺失待審核", desc: "王大明已回報改善「逃生通道雜物堆放阻礙通行」，請進行複查與結案。", time: "5 小時前", read: false },
  { id: "noti-3", title: "新增缺失指派", desc: "您有一項新缺失指派：「二樓外側施工架無搭設護欄與腳趾板」。", time: "3 天前", read: false }
];

// Load Database Helper Functions
function getDB(key, defaultData) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultData;
}

function setDB(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Initialize databases in localStorage
let users = getDB("smartsite_users", INITIAL_USERS);
let inspections = getDB("smartsite_inspections", INITIAL_INSPECTIONS);
let defects = getDB("smartsite_defects", INITIAL_DEFECTS);
let activities = getDB("smartsite_activities", INITIAL_ACTIVITIES);
let notifications = getDB("smartsite_notifications", INITIAL_NOTIFICATIONS);

// Active logged-in user profile cache
let currentUser = users.find(u => u.role === "Site Manager") || users[0];

// Temp base64 images container for file upload mockup
let uploadedTempImages = [];

// Chart References to destroy and rebuild on updates
let chartDefectDist = null;
let chartCompletionTrend = null;
let chartRiskTrend = null;

// ==========================================
// 2. MAIN APP CONTROLLER
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

function initApp() {
  setupNavigation();
  setupRoleSwitcher();
  setupNotifications();
  setupModals();
  setupInspectionModule();
  setupDefectModule();
  setupRiskModule();
  setupReportsModule();
  setupUsersModule();
  
  // Render Dashboard
  renderDashboard();
  updateNavigationVisibility();
}

// ==========================================
// Navigation & Routing
// ==========================================
function setupNavigation() {
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll(".page-section");
  const pageTitle = document.getElementById("current-page-title");
  const menuToggle = document.getElementById("menu-toggle-btn");
  const sidebar = document.getElementById("app-sidebar");

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      // Remove active states
      navLinks.forEach(l => l.classList.remove("active"));
      sections.forEach(s => s.classList.remove("active"));

      // Set active state
      link.classList.add("active");
      const targetId = link.getAttribute("data-target");
      const activeSection = document.getElementById(targetId);
      activeSection.classList.add("active");

      // Update Header Title
      pageTitle.textContent = link.innerText.trim();

      // Trigger sub-renderers if needed
      if (targetId === "section-dashboard") {
        renderDashboard();
      } else if (targetId === "section-inspections") {
        renderInspectionsList();
      } else if (targetId === "section-defects") {
        renderDefectBoard();
      } else if (targetId === "section-reports") {
        renderReportsView();
      } else if (targetId === "section-users") {
        renderUsersList();
      }

      // Close sidebar in mobile
      sidebar.classList.remove("active");
    });
  });

  // Toggle Sidebar (Mobile / Tablet)
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.toggle("active");
  });

  // Close sidebar clicking outside
  document.addEventListener("click", (e) => {
    if (window.innerWidth < 1024 && !sidebar.contains(e.target) && e.target !== menuToggle) {
      sidebar.classList.remove("active");
    }
  });

  // Link in dashboard table
  document.getElementById("dashboard-to-defects").addEventListener("click", () => {
    document.getElementById("nav-defects").click();
  });
}

// ==========================================
// User Roles Permissions Switcher
// ==========================================
function setupRoleSwitcher() {
  const roleSelect = document.getElementById("role-select");
  const avatarEl = document.getElementById("header-user-avatar");
  const userNameEl = document.getElementById("header-user-name");
  const userRoleEl = document.getElementById("header-user-role");

  roleSelect.addEventListener("change", (e) => {
    const selectedRole = e.target.value;
    currentUser = users.find(u => u.role === selectedRole) || users[0];
    
    // Update Header Profile Display
    avatarEl.textContent = currentUser.avatar;
    userNameEl.textContent = currentUser.name;
    userRoleEl.textContent = currentUser.department.split(" - ")[1] || currentUser.role;

    // Toast notification for switching roles
    showToast(`已切換為 ${currentUser.name} (${currentUser.role})`, "success");

    // Refresh view states & active section to filter actions
    updateNavigationVisibility();
    
    // Rerender whatever section is currently active
    const activeSection = document.querySelector(".page-section.active");
    if (activeSection.id === "section-dashboard") {
      renderDashboard();
    } else if (activeSection.id === "section-inspections") {
      renderInspectionsList();
    } else if (activeSection.id === "section-defects") {
      renderDefectBoard();
    } else if (activeSection.id === "section-users") {
      renderUsersList();
    }
  });

  // Trigger initial load setting
  roleSelect.dispatchEvent(new Event("change"));
}

function updateNavigationVisibility() {
  const btnNewInspection = document.getElementById("btn-new-inspection");
  const btnNewDefect = document.getElementById("btn-new-defect");
  const btnAddUser = document.getElementById("btn-add-user");

  // Inspection creation restricted from Supervisor
  if (currentUser.role === "Supervisor") {
    if (btnNewInspection) btnNewInspection.style.display = "none";
  } else {
    if (btnNewInspection) btnNewInspection.style.display = "inline-flex";
  }

  // Defect creation restricted from Supervisor
  if (currentUser.role === "Supervisor") {
    if (btnNewDefect) btnNewDefect.style.display = "none";
  } else {
    if (btnNewDefect) btnNewDefect.style.display = "inline-flex";
  }

  // User management add member only for Administrator
  if (currentUser.role !== "Administrator") {
    if (btnAddUser) btnAddUser.style.display = "none";
  } else {
    if (btnAddUser) btnAddUser.style.display = "inline-flex";
  }
}

// ==========================================
// Toast & Notifications Center
// ==========================================
function setupNotifications() {
  const bell = document.getElementById("notification-bell");
  const drawer = document.getElementById("notification-drawer");
  const closeBtn = document.getElementById("btn-close-notification-drawer");
  const clearBtn = document.getElementById("btn-clear-notifications");
  const listEl = document.getElementById("notification-list");
  const badge = document.getElementById("noti-badge");

  // Toggle Drawer
  bell.addEventListener("click", (e) => {
    e.stopPropagation();
    drawer.classList.toggle("active");
  });

  closeBtn.addEventListener("click", () => {
    drawer.classList.remove("active");
  });

  document.addEventListener("click", (e) => {
    if (!drawer.contains(e.target) && !bell.contains(e.target)) {
      drawer.classList.remove("active");
    }
  });

  // Clear/Mark All as read
  clearBtn.addEventListener("click", () => {
    notifications.forEach(n => n.read = true);
    setDB("smartsite_notifications", notifications);
    renderNotifications();
    showToast("所有通知已標記為已讀", "success");
  });

  // Render Notifications List
  window.renderNotifications = function() {
    listEl.innerHTML = "";
    const unread = notifications.filter(n => !n.read).length;
    
    if (unread > 0) {
      badge.textContent = unread;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }

    if (notifications.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:32px 0; font-size:12px;">無新通知</div>`;
      return;
    }

    notifications.forEach(n => {
      const div = document.createElement("div");
      div.className = `drawer-notification-item ${n.read ? '' : 'unread'}`;
      if (!n.read) div.style.borderLeft = "3px solid var(--warning)";
      div.innerHTML = `
        <div class="drawer-notification-title">${escapeHTML(n.title)}</div>
        <div class="drawer-notification-desc">${escapeHTML(n.desc)}</div>
        <div class="drawer-notification-time">${n.time}</div>
      `;
      div.addEventListener("click", () => {
        n.read = true;
        setDB("smartsite_notifications", notifications);
        renderNotifications();
        // Route according to notification context if needed
        drawer.classList.remove("active");
      });
      listEl.appendChild(div);
    });
  };

  renderNotifications();
}

function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  
  let icon = "";
  if (type === "success") {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === "warning") {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else if (type === "danger") {
    icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  }

  toast.innerHTML = `
    ${icon}
    <div class="toast-content">
      <div class="toast-title">${type === 'success' ? '系統作業成功' : type === 'warning' ? '警告提示' : '危險/錯誤警示'}</div>
      <div class="toast-message">${escapeHTML(message)}</div>
    </div>
    <button class="toast-close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  container.appendChild(toast);

  toast.querySelector(".toast-close").addEventListener("click", () => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  });

  // Auto remove toast
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

function addNotification(title, desc) {
  const newNoti = {
    id: `noti-${Date.now()}`,
    title: title,
    desc: desc,
    time: "剛剛",
    read: false
  };
  notifications.unshift(newNoti);
  setDB("smartsite_notifications", notifications);
  if (typeof renderNotifications === "function") renderNotifications();
}

function addActivity(type, text) {
  const newAct = {
    id: `act-${Date.now()}`,
    type: type,
    text: text,
    time: getFormattedDateTime()
  };
  activities.unshift(newAct);
  // Cap activities size
  if (activities.length > 30) activities.pop();
  setDB("smartsite_activities", activities);
}

// ==========================================
// 3. DASHBOARD RENDERER
// ==========================================
function renderDashboard() {
  // Update KPI displays
  const countInspections = inspections.length;
  const countOpenDefects = defects.filter(d => d.status === "Open" || d.status === "In Progress").length;
  const countHighRisk = defects.filter(d => d.riskLevel === "High" && (d.status === "Open" || d.status === "In Progress")).length;
  
  const closedDefects = defects.filter(d => d.status === "Closed" || d.status === "Resolved").length;
  const totalDefects = defects.length;
  const completionRate = totalDefects > 0 ? Math.round((closedDefects / totalDefects) * 100) : 0;

  document.getElementById("kpi-inspections").textContent = countInspections;
  document.getElementById("kpi-open-defects").textContent = countOpenDefects;
  document.getElementById("kpi-high-risk").textContent = countHighRisk;
  document.getElementById("kpi-completion-rate").textContent = `${completionRate}%`;

  // Render recent defect alerts table
  const tbody = document.getElementById("dashboard-defect-table-body");
  tbody.innerHTML = "";
  
  // Show active/open defects on dashboard
  const activeDefects = defects.filter(d => d.status !== "Closed").slice(0, 5);
  
  if (activeDefects.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:24px;">目前無待改善缺失！安全防護良好。</td></tr>`;
  } else {
    activeDefects.forEach(d => {
      const tr = document.createElement("tr");
      
      // Overdue logic
      const isOverdue = new Date(d.dueDate) < new Date() && d.status !== "Resolved";
      const badgeClass = d.status === "Open" ? "badge-danger" : d.status === "In Progress" ? "badge-warning" : "badge-primary";
      const riskClass = d.riskLevel === "High" ? "badge-danger" : d.riskLevel === "Medium" ? "badge-warning" : "badge-secondary";
      
      tr.innerHTML = `
        <td style="font-weight:600; cursor:pointer;" onclick="openViewDefectModal('${d.id}')">${escapeHTML(d.title)}</td>
        <td>${escapeHTML(d.workArea)}</td>
        <td>${escapeHTML(d.assignee)}</td>
        <td class="${isOverdue ? 'overdue' : ''}" style="${isOverdue ? 'color:var(--danger); font-weight:600' : ''}">
          ${d.dueDate} ${isOverdue ? '(逾期)' : ''}
        </td>
        <td><span class="badge ${riskClass}">${d.riskLevel}</span></td>
        <td><span class="badge ${badgeClass}">${d.status}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Render Activity List
  const actListEl = document.getElementById("dashboard-activity-list");
  actListEl.innerHTML = "";
  
  activities.slice(0, 4).forEach(act => {
    const item = document.createElement("div");
    item.className = "activity-item";
    
    let markerClass = "marker-success";
    if (act.type === "danger") markerClass = "marker-danger";
    if (act.type === "warning") markerClass = "marker-warning";
    
    item.innerHTML = `
      <div class="activity-marker ${markerClass}"></div>
      <div class="activity-details">
        <div class="activity-text">${act.text}</div>
        <div class="activity-time">${act.time}</div>
      </div>
    `;
    actListEl.appendChild(item);
  });

  // Draw Charts
  initCharts();
}

function initCharts() {
  // Destroy old charts to clean canvas context
  if (chartDefectDist) chartDefectDist.destroy();
  if (chartCompletionTrend) chartCompletionTrend.destroy();
  if (chartRiskTrend) chartRiskTrend.destroy();

  // 1. Defect Distribution chart logic (Count by types)
  // Types: Helmet, Scaffold, Electrical, Fall, Storage, Housekeeping
  let typeCounts = {
    "安全帽": 0,
    "施工架": 0,
    "臨時用電": 0,
    "防墜設施": 0,
    "物料堆放": 0,
    "工地整理": 0
  };

  defects.forEach(d => {
    if (d.title.includes("安全帽") || d.desc.includes("安全帽") || d.desc.includes("安全防護帽")) typeCounts["安全帽"]++;
    else if (d.title.includes("施工架") || d.desc.includes("施工架") || d.desc.includes("腳手架")) typeCounts["施工架"]++;
    else if (d.title.includes("配電") || d.title.includes("電線") || d.desc.includes("電")) typeCounts["臨時用電"]++;
    else if (d.title.includes("防墜") || d.title.includes("安全帶") || d.title.includes("安全母索")) typeCounts["防墜設施"]++;
    else if (d.title.includes("通道") || d.title.includes("堆放") || d.desc.includes("物料")) typeCounts["物料堆放"]++;
    else typeCounts["工地整理"]++;
  });

  const defectDistCtx = document.getElementById("chart-defect-distribution").getContext("2d");
  chartDefectDist = new Chart(defectDistCtx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(typeCounts),
      datasets: [{
        data: Object.values(typeCounts),
        backgroundColor: ['#64748B', '#F97316', '#EF4444', '#3B82F6', '#22C55E', '#A855F7'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { family: 'Inter', size: 11 } }
        }
      },
      cutout: '65%'
    }
  });

  // 2. Completion Trend chart logic (Mock data + dynamic computation)
  const completionTrendCtx = document.getElementById("chart-completion-trend").getContext("2d");
  chartCompletionTrend = new Chart(completionTrendCtx, {
    type: 'bar',
    data: {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
      datasets: [
        {
          label: '已結案缺失',
          data: [12, 19, 15, 24, 22, defects.filter(d => d.status === "Closed" || d.status === "Resolved").length],
          backgroundColor: '#0F172A',
          borderRadius: 4
        },
        {
          label: '新增巡檢缺失',
          data: [15, 22, 17, 28, 25, defects.length],
          backgroundColor: '#CBD5E1',
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { labels: { font: { family: 'Inter', size: 11 } } }
      }
    }
  });

  // 3. High Risk Event Trend (Line chart)
  const riskTrendCtx = document.getElementById("chart-risk-trend").getContext("2d");
  chartRiskTrend = new Chart(riskTrendCtx, {
    type: 'line',
    data: {
      labels: ['06-01', '06-03', '06-05', '06-08', '06-10', '06-12'],
      datasets: [{
        label: '高風險缺失計數',
        data: [2, 1, 1, 3, 2, defects.filter(d => d.riskLevel === "High" && d.status !== "Closed").length],
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointBackgroundColor: '#EF4444'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

// ==========================================
// 4. INSPECTION MODULE
// ==========================================
function setupInspectionModule() {
  const btnNew = document.getElementById("btn-new-inspection");
  const modal = document.getElementById("modal-inspection");
  const closeBtns = modal.querySelectorAll(".modal-cancel-btn");
  const saveBtn = document.getElementById("btn-save-inspection");
  const fileInput = document.getElementById("inspect-photo-input");
  const uploadZone = document.getElementById("inspect-upload-zone");
  const previewContainer = document.getElementById("inspect-photo-previews");

  // Filters
  const filterArea = document.getElementById("inspect-filter-area");
  const filterResult = document.getElementById("inspect-filter-result");
  const searchInput = document.getElementById("inspect-search");

  // Open Modal
  btnNew.addEventListener("click", () => {
    // Check permissions
    if (currentUser.role === "Supervisor") {
      showToast("監造人員權限不足，無法新增巡檢！", "danger");
      return;
    }
    
    // Reset Form
    document.getElementById("inspection-form").reset();
    document.getElementById("ins-date").value = getTodayDateString();
    document.getElementById("ins-inspector").value = currentUser.name;
    
    uploadedTempImages = [];
    previewContainer.innerHTML = "";
    
    document.getElementById("inspection-modal-title").textContent = "新增工地巡檢紀錄";
    modal.classList.add("active");
  });

  // Close Modals
  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modal.classList.remove("active");
      document.getElementById("modal-view-inspection").classList.remove("active");
    });
  });

  // Mock Upload Files
  uploadZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Img = event.target.result;
        uploadedTempImages.push(base64Img);
        
        // Render previews
        const wrapper = document.createElement("div");
        wrapper.className = "preview-image-wrapper";
        wrapper.innerHTML = `
          <img src="${base64Img}">
          <button type="button" class="preview-image-remove">×</button>
        `;
        wrapper.querySelector(".preview-image-remove").addEventListener("click", (ev) => {
          ev.stopPropagation();
          const idx = uploadedTempImages.indexOf(base64Img);
          if (idx > -1) uploadedTempImages.splice(idx, 1);
          wrapper.remove();
        });
        previewContainer.appendChild(wrapper);
      };
      reader.readAsDataURL(files[0]);
    }
  });

  // Save/Submit
  saveBtn.addEventListener("click", () => {
    const date = document.getElementById("ins-date").value;
    const projectName = document.getElementById("ins-project").value;
    const workArea = document.getElementById("ins-area").value;
    const notes = document.getElementById("ins-notes").value;

    if (!date || !projectName || !workArea) {
      showToast("請填寫所有必要欄位 (*)", "warning");
      return;
    }

    // Get checklist responses
    const checklist = {
      helmet: document.querySelector('input[name="check-helmet"]:checked').value,
      scaffold: document.querySelector('input[name="check-scaffold"]:checked').value,
      electrical: document.querySelector('input[name="check-electrical"]:checked').value,
      fall: document.querySelector('input[name="check-fall"]:checked').value,
      storage: document.querySelector('input[name="check-storage"]:checked').value,
      housekeeping: document.querySelector('input[name="check-housekeeping"]:checked').value
    };

    // Calculate overall inspection result
    const resultsArray = Object.values(checklist);
    let finalResult = "Pass";
    if (resultsArray.includes("Fail")) {
      finalResult = "Fail";
    } else if (resultsArray.includes("Warning")) {
      finalResult = "Warning";
    }

    // Create record
    const newInspection = {
      id: `ins-${Date.now()}`,
      date,
      projectName,
      workArea,
      inspector: currentUser.name,
      checklist,
      result: finalResult,
      notes,
      photos: [...uploadedTempImages]
    };

    inspections.unshift(newInspection);
    setDB("smartsite_inspections", inspections);

    // If inspection failed, automatically issue an "Open" Defect!
    if (finalResult === "Fail") {
      let failItems = [];
      if (checklist.helmet === "Fail") failItems.push("安全帽配戴違規");
      if (checklist.scaffold === "Fail") failItems.push("施工架安全防護缺失");
      if (checklist.electrical === "Fail") failItems.push("臨時用電安全違規");
      if (checklist.fall === "Fail") failItems.push("防墜設施搭設缺失");
      if (checklist.storage === "Fail") failItems.push("物料堆放阻礙通道");
      if (checklist.housekeeping === "Fail") failItems.push("工地整理整頓缺失");

      // Spawn defect
      const newDefect = {
        id: `def-${Date.now()}`,
        title: `${workArea} - ${failItems.join('、')}等安全缺失`,
        desc: `此缺失由系統於巡檢後自動生成。巡檢日期：${date}。詳細狀況：${notes || '無額外備註'}`,
        workArea,
        assignee: "王大明", // Default assignee
        dueDate: addDays(date, 3), // default 3 days limit
        riskLevel: "High",
        severity: 4,
        probability: 4,
        score: 16,
        status: "Open",
        createdDate: date,
        photos: [...uploadedTempImages],
        resolvedDate: null,
        resolvedNotes: "",
        resolvedPhotos: [],
        closedDate: null
      };
      defects.unshift(newDefect);
      setDB("smartsite_defects", defects);
      
      showToast("巡檢結果不合格！系統已自動通報公安缺失卡片", "danger");
      addNotification("安全缺失自動通報", `${workArea} 巡檢異常，已自動指派改善缺失卡片。`);
      addActivity("danger", `<strong>系統</strong> 自動通報了 <strong>${workArea}</strong> 巡檢安全缺失。`);
    } else {
      showToast("巡檢紀錄儲存成功", "success");
      addActivity("success", `<strong>${currentUser.name}</strong> 新增了 <strong>${workArea}</strong> 巡檢紀錄 (${finalResult})。`);
    }

    modal.classList.remove("active");
    renderInspectionsList();
  });

  // Attach filters listener
  [filterArea, filterResult, searchInput].forEach(elem => {
    elem.addEventListener("input", renderInspectionsList);
  });
}

function renderInspectionsList() {
  const tbody = document.getElementById("inspection-table-body");
  tbody.innerHTML = "";

  const filterAreaVal = document.getElementById("inspect-filter-area").value;
  const filterResultVal = document.getElementById("inspect-filter-result").value;
  const searchVal = document.getElementById("inspect-search").value.toLowerCase();

  // Filter
  const filtered = inspections.filter(item => {
    if (filterAreaVal && item.workArea !== filterAreaVal) return false;
    if (filterResultVal && item.result !== filterResultVal) return false;
    
    if (searchVal) {
      const matchText = `${item.projectName} ${item.workArea} ${item.inspector} ${item.notes}`.toLowerCase();
      if (!matchText.includes(searchVal)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:32px;">查無相符的巡檢紀錄。</td></tr>`;
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement("tr");

    // Checklist stats
    const values = Object.values(item.checklist);
    const passCount = values.filter(v => v === "Pass").length;
    const complianceRate = Math.round((passCount / values.length) * 100);

    const badgeClass = item.result === "Pass" ? "badge-success" : item.result === "Warning" ? "badge-warning" : "badge-danger";

    tr.innerHTML = `
      <td>${item.date}</td>
      <td>${escapeHTML(item.projectName)}</td>
      <td><span class="badge badge-secondary">${escapeHTML(item.workArea)}</span></td>
      <td>${escapeHTML(item.inspector)}</td>
      <td><strong>${complianceRate}%</strong> (${passCount}/${values.length})</td>
      <td><span class="badge ${badgeClass}">${item.result}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openViewInspectionModal('${item.id}')" style="padding:4px 8px; font-size:12px;">詳情</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Open Detail view modal for inspection
window.openViewInspectionModal = function(id) {
  const item = inspections.find(ins => ins.id === id);
  if (!item) return;

  const modal = document.getElementById("modal-view-inspection");
  const body = document.getElementById("view-inspection-body");

  // Checklist mapping icons
  const itemNames = {
    helmet: "1. 安全帽配戴 (Safety Helmet)",
    scaffold: "2. 施工架安全 (Scaffold Safety)",
    electrical: "3. 用電安全 (Electrical Safety)",
    fall: "4. 防墜設施 (Fall Protection)",
    storage: "5. 物料堆放 (Material Storage)",
    housekeeping: "6. 工地整理整頓 (Housekeeping)"
  };

  let checklistHTML = "";
  for (const [key, value] of Object.entries(item.checklist)) {
    const badge = value === "Pass" ? '<span class="badge badge-success">Pass</span>' : value === "Warning" ? '<span class="badge badge-warning">Warning</span>' : '<span class="badge badge-danger">Fail</span>';
    checklistHTML += `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #F1F5F9;">
        <span style="font-size:13px; font-weight:500;">${itemNames[key]}</span>
        ${badge}
      </div>
    `;
  }

  let photosHTML = "";
  if (item.photos && item.photos.length > 0) {
    photosHTML = `
      <div style="margin-top:16px;">
        <span style="font-size:13px; font-weight:600; color:var(--secondary); display:block; margin-bottom:8px;">現場巡勘照片:</span>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          ${item.photos.map(p => `<img src="${p}" style="max-width:120px; border-radius:4px; border:1px solid var(--border);">`).join('')}
        </div>
      </div>
    `;
  }

  const finalBadge = item.result === "Pass" ? 'badge-success' : item.result === "Warning" ? 'badge-warning' : 'badge-danger';

  body.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
      <div>
        <h4 style="font-size:16px; margin-bottom:4px;">${escapeHTML(item.projectName)}</h4>
        <p style="font-size:12px; color:var(--text-muted);">工區：${escapeHTML(item.workArea)} | 巡檢日期：${item.date}</p>
      </div>
      <span class="badge ${finalBadge}" style="font-size:14px; padding:6px 12px;">結果：${item.result}</span>
    </div>
    
    <div style="background-color:#F8FAFC; padding:12px 16px; border-radius:var(--radius-sm); border:1px solid var(--border); margin-bottom:16px;">
      <span style="font-size:12px; font-weight:600; color:var(--text-muted); display:block; margin-bottom:4px;">巡檢人員</span>
      <span style="font-size:14px; font-weight:600;">${escapeHTML(item.inspector)}</span>
    </div>

    <div style="margin-bottom:16px;">
      <span style="font-size:13px; font-weight:600; color:var(--secondary); display:block; margin-bottom:8px;">安全檢查結果:</span>
      ${checklistHTML}
    </div>

    <div style="margin-bottom:16px;">
      <span style="font-size:13px; font-weight:600; color:var(--secondary); display:block; margin-bottom:4px;">詳細備註說明:</span>
      <div style="font-size:13px; line-height:1.5; color:var(--secondary); background-color:#F8FAFC; padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border); white-space:pre-wrap;">${escapeHTML(item.notes || '無詳細備註')}</div>
    </div>

    ${photosHTML}
  `;

  modal.classList.add("active");
};

// ==========================================
// 5. DEFECT MODULE
// ==========================================
function setupDefectModule() {
  const btnNew = document.getElementById("btn-new-defect");
  const modal = document.getElementById("modal-defect");
  const closeBtns = modal.querySelectorAll(".modal-cancel-btn");
  const saveBtn = document.getElementById("btn-save-defect");
  const fileInput = document.getElementById("defect-photo-input");
  const uploadZone = document.getElementById("defect-upload-zone");
  const previewContainer = document.getElementById("defect-photo-previews");
  const assigneeSelect = document.getElementById("def-assignee");

  // Filter triggers
  const filterArea = document.getElementById("defect-filter-area");
  const filterRisk = document.getElementById("defect-filter-risk");
  const searchInput = document.getElementById("defect-search");

  // Open modal for Create
  btnNew.addEventListener("click", () => {
    if (currentUser.role === "Supervisor") {
      showToast("監造人員權限不足，無法通報缺失！", "danger");
      return;
    }

    // Populate Users list in dropdown
    assigneeSelect.innerHTML = users.map(u => `<option value="${u.name}">${u.name} (${u.department.split(' - ')[1] || u.role})</option>`).join('');

    // Reset Form
    document.getElementById("defect-form").reset();
    document.getElementById("def-id").value = "";
    document.getElementById("def-duedate").value = addDays(getTodayDateString(), 7); // Default 7 days due date
    uploadedTempImages = [];
    previewContainer.innerHTML = "";

    document.getElementById("defect-modal-title").textContent = "通報工地安全缺失";
    modal.classList.add("active");
  });

  // Handle Close Modals
  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modal.classList.remove("active");
      document.getElementById("modal-view-defect").classList.remove("active");
    });
  });

  // Mock Upload Files
  uploadZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Img = event.target.result;
        uploadedTempImages.push(base64Img);
        
        // Render previews
        const wrapper = document.createElement("div");
        wrapper.className = "preview-image-wrapper";
        wrapper.innerHTML = `
          <img src="${base64Img}">
          <button type="button" class="preview-image-remove">×</button>
        `;
        wrapper.querySelector(".preview-image-remove").addEventListener("click", (ev) => {
          ev.stopPropagation();
          const idx = uploadedTempImages.indexOf(base64Img);
          if (idx > -1) uploadedTempImages.splice(idx, 1);
          wrapper.remove();
        });
        previewContainer.appendChild(wrapper);
      };
      reader.readAsDataURL(files[0]);
    }
  });

  // Save Defect
  saveBtn.addEventListener("click", () => {
    const defId = document.getElementById("def-id").value;
    const title = document.getElementById("def-title").value;
    const desc = document.getElementById("def-desc").value;
    const workArea = document.getElementById("def-area").value;
    const assignee = document.getElementById("def-assignee").value;
    const dueDate = document.getElementById("def-duedate").value;
    const riskLevel = document.getElementById("def-risk").value;

    if (!title || !desc || !dueDate) {
      showToast("請填寫所有必要欄位 (*)", "warning");
      return;
    }

    // Set Risk Score mapping based on level choice
    let severity = 3;
    let probability = 3;
    if (riskLevel === "High") { severity = 4; probability = 4; }
    else if (riskLevel === "Low") { severity = 2; probability = 2; }
    const score = severity * probability;

    if (defId) {
      // Edit
      const defect = defects.find(d => d.id === defId);
      if (defect) {
        defect.title = title;
        defect.desc = desc;
        defect.workArea = workArea;
        defect.assignee = assignee;
        defect.dueDate = dueDate;
        defect.riskLevel = riskLevel;
        defect.severity = severity;
        defect.probability = probability;
        defect.score = score;
        if (uploadedTempImages.length > 0) defect.photos = [...uploadedTempImages];
        
        showToast("缺失更新成功", "success");
        addActivity("warning", `<strong>${currentUser.name}</strong> 編輯了缺失卡片：${title}`);
      }
    } else {
      // Create new
      const newDef = {
        id: `def-${Date.now()}`,
        title,
        desc,
        workArea,
        assignee,
        dueDate,
        riskLevel,
        severity,
        probability,
        score,
        status: "Open",
        createdDate: getTodayDateString(),
        photos: [...uploadedTempImages],
        resolvedDate: null,
        resolvedNotes: "",
        resolvedPhotos: [],
        closedDate: null
      };

      defects.unshift(newDef);
      
      showToast("安全缺失卡片通報成功", "success");
      addNotification("新缺失通報", `${assignee} 已被指派新安全缺失項目「${title}」。`);
      addActivity("danger", `<strong>${currentUser.name}</strong> 新增了缺失 <strong>${title}</strong>，指派給 <strong>${assignee}</strong>。`);
    }

    setDB("smartsite_defects", defects);
    modal.classList.remove("active");
    renderDefectBoard();
  });

  // Attach filters listener
  [filterArea, filterRisk, searchInput].forEach(elem => {
    elem.addEventListener("input", renderDefectBoard);
  });
}

function renderDefectBoard() {
  const containerIds = ["cards-open", "cards-progress", "cards-resolved", "cards-closed"];
  const countIds = ["count-open", "count-progress", "count-resolved", "count-closed"];
  
  // Clear lists
  containerIds.forEach(id => {
    document.getElementById(id).innerHTML = "";
  });

  const filterAreaVal = document.getElementById("defect-filter-area").value;
  const filterRiskVal = document.getElementById("defect-filter-risk").value;
  const searchVal = document.getElementById("defect-search").value.toLowerCase();

  // Filters logic
  const filtered = defects.filter(item => {
    if (filterAreaVal && item.workArea !== filterAreaVal) return false;
    if (filterRiskVal && item.riskLevel !== filterRiskVal) return false;
    if (searchVal) {
      const matchText = `${item.title} ${item.desc} ${item.assignee}`.toLowerCase();
      if (!matchText.includes(searchVal)) return false;
    }
    return true;
  });

  // Group by status
  const groups = { "Open": [], "In Progress": [], "Resolved": [], "Closed": [] };
  filtered.forEach(item => {
    if (groups[item.status]) {
      groups[item.status].push(item);
    }
  });

  // Populate Columns
  Object.keys(groups).forEach(status => {
    let colId = "";
    let countId = "";
    if (status === "Open") { colId = "cards-open"; countId = "count-open"; }
    else if (status === "In Progress") { colId = "cards-progress"; countId = "count-progress"; }
    else if (status === "Resolved") { colId = "cards-resolved"; countId = "count-resolved"; }
    else if (status === "Closed") { colId = "cards-closed"; countId = "count-closed"; }

    const countEl = document.getElementById(countId);
    countEl.textContent = groups[status].length;

    const cardsContainer = document.getElementById(colId);
    
    if (groups[status].length === 0) {
      cardsContainer.innerHTML = `<div style="text-align:center; padding:24px 0; color:var(--text-muted); font-size:11px; border:2px dashed var(--border); border-radius:var(--radius-sm)">無此狀態缺失</div>`;
      return;
    }

    groups[status].forEach(item => {
      const card = document.createElement("div");
      card.className = "defect-card";
      card.addEventListener("click", () => openViewDefectModal(item.id));
      
      const isOverdue = new Date(item.dueDate) < new Date() && item.status !== "Resolved" && item.status !== "Closed";
      
      let badgeClass = "badge-secondary";
      if (item.riskLevel === "High") badgeClass = "badge-danger";
      else if (item.riskLevel === "Medium") badgeClass = "badge-warning";

      card.innerHTML = `
        <div class="defect-card-header">
          <span class="badge ${badgeClass}">${item.riskLevel}</span>
          <span style="font-size:11px; font-weight:600; color:var(--text-muted);">${escapeHTML(item.workArea)}</span>
        </div>
        <div class="defect-card-title">${escapeHTML(item.title)}</div>
        <div class="defect-card-desc">${escapeHTML(item.desc)}</div>
        <div class="defect-card-meta">
          <div class="defect-card-person">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            ${escapeHTML(item.assignee)}
          </div>
          <div class="defect-card-due ${isOverdue ? 'overdue' : ''}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            ${item.dueDate} ${isOverdue ? '!' : ''}
          </div>
        </div>
      `;
      cardsContainer.appendChild(card);
    });
  });
}

// Open detailed modal view for defect card with action steps based on logged in role
window.openViewDefectModal = function(id) {
  const item = defects.find(d => d.id === id);
  if (!item) return;

  const modal = document.getElementById("modal-view-defect");
  const body = document.getElementById("view-defect-body");
  const footer = document.getElementById("view-defect-footer");

  let attachmentHTML = "";
  if (item.photos && item.photos.length > 0) {
    attachmentHTML = `
      <div style="margin-top:16px;">
        <span style="font-size:13px; font-weight:600; color:var(--secondary); display:block; margin-bottom:8px;">通報現場照片:</span>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          ${item.photos.map(p => `<img src="${p}" style="max-height:100px; border-radius:4px; border:1px solid var(--border);">`).join('')}
        </div>
      </div>
    `;
  }

  let resolvedBlock = "";
  if (item.status === "Resolved" || item.status === "Closed") {
    let resolvedPhotosHTML = "";
    if (item.resolvedPhotos && item.resolvedPhotos.length > 0) {
      resolvedPhotosHTML = `
        <div style="margin-top:12px;">
          <span style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:4px;">改善後佐證照片:</span>
          <div style="display:flex; gap:8px;">
            ${item.resolvedPhotos.map(rp => `<img src="${rp}" style="max-height:80px; border-radius:4px; border:1px solid var(--border);">`).join('')}
          </div>
        </div>
      `;
    }
    resolvedBlock = `
      <div style="margin-top:20px; background-color:#F0FDF4; border-left:4px solid var(--success); padding:16px; border-radius: 0 var(--radius-sm) var(--radius-sm) 0;">
        <span style="font-size:13px; font-weight:700; color:#15803d; display:block; margin-bottom:4px;">✔ 改善完成申報資訊:</span>
        <div style="font-size:13px; color:#166534;"><strong>申報日期：</strong>${item.resolvedDate}</div>
        <div style="font-size:13px; color:#166534; margin-top:4px;"><strong>執行備註：</strong>${escapeHTML(item.resolvedNotes || '無備註說明')}</div>
        ${resolvedPhotosHTML}
      </div>
    `;
  }

  const riskBadge = item.riskLevel === "High" ? "badge-danger" : item.riskLevel === "Medium" ? "badge-warning" : "badge-secondary";
  const statusBadge = item.status === "Open" ? "badge-danger" : item.status === "In Progress" ? "badge-warning" : item.status === "Resolved" ? "badge-primary" : "badge-success";

  body.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px;">
      <div>
        <h4 style="font-size:16px; margin-bottom:4px;">${escapeHTML(item.title)}</h4>
        <p style="font-size:12px; color:var(--text-muted);">工區：${escapeHTML(item.workArea)} | 通報日期：${item.createdDate}</p>
      </div>
      <div style="display:flex; gap:6px;">
        <span class="badge ${riskBadge}">${item.riskLevel} Risk</span>
        <span class="badge ${statusBadge}">${item.status}</span>
      </div>
    </div>

    <div style="margin-bottom:16px; background-color:#F8FAFC; padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border);">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:13px;">
        <div><strong>責任改善人：</strong>${escapeHTML(item.assignee)}</div>
        <div><strong>改善期限：</strong>${item.dueDate}</div>
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <span style="font-size:13px; font-weight:600; color:var(--secondary); display:block; margin-bottom:4px;">異常危害狀況說明:</span>
      <div style="font-size:13px; line-height:1.5; color:var(--secondary); background-color:#F8FAFC; padding:12px; border-radius:var(--radius-sm); border:1px solid var(--border); white-space:pre-wrap;">${escapeHTML(item.desc)}</div>
    </div>

    ${attachmentHTML}
    ${resolvedBlock}

    <!-- Dynamic Actions Form inside View Modal -->
    <div id="defect-action-form-container" style="margin-top:20px; display:none;">
      <hr style="border:0; border-top:1px solid var(--border); margin:20px 0;">
      <h4 style="font-size:14px; margin-bottom:12px;">申報缺失改善結果</h4>
      <div class="form-group">
        <label for="modal-action-notes">改善說明備註 *</label>
        <textarea id="modal-action-notes" class="form-control" placeholder="請描述已採取的改善對策..."></textarea>
      </div>
      <div class="form-group">
        <label>上傳改善後現場佐證相片</label>
        <div class="file-upload-zone" id="defect-resolved-upload-zone" style="padding:12px;">
          <span style="font-size:12px; color:var(--text-muted);">點擊上傳改善後照片</span>
          <input type="file" id="defect-resolved-photo-input" accept="image/*" style="display:none;">
        </div>
        <div class="preview-images-container" id="defect-resolved-photo-previews"></div>
      </div>
    </div>
  `;

  // Render Footer Buttons dynamically based on Role + Status
  footer.innerHTML = `<button class="btn btn-secondary modal-cancel-btn">關閉</button>`;
  
  const cancelBtn = footer.querySelector(".modal-cancel-btn");
  cancelBtn.addEventListener("click", () => modal.classList.remove("active"));

  const actionFormContainer = body.querySelector("#defect-action-form-container");

  // State Transitions logic:
  // 1. Inspector / Site Manager can transition Open -> In Progress
  if (item.status === "Open") {
    if (currentUser.role === "Site Manager" || currentUser.role === "Inspector" || currentUser.role === "Administrator") {
      const btnStart = document.createElement("button");
      btnStart.className = "btn btn-warning";
      btnStart.textContent = "開始改善 (Start)";
      btnStart.addEventListener("click", () => {
        item.status = "In Progress";
        setDB("smartsite_defects", defects);
        showToast("缺失已開始改善", "success");
        addActivity("warning", `缺失 <strong>${item.title}</strong> 狀態更新為 <strong>改善中</strong>。`);
        modal.classList.remove("active");
        renderDefectBoard();
      });
      footer.insertBefore(btnStart, cancelBtn);
    }
  }
  
  // 2. Assignee / Site Manager can transition In Progress -> Resolved (Requires uploading resolved description)
  else if (item.status === "In Progress") {
    if (currentUser.role === "Site Manager" || currentUser.name === item.assignee || currentUser.role === "Administrator") {
      // Show action form
      actionFormContainer.style.display = "block";
      
      // Setup file upload event for resolution photos
      const resFileInput = body.querySelector("#defect-resolved-photo-input");
      const resUploadZone = body.querySelector("#defect-resolved-upload-zone");
      const resPreviewContainer = body.querySelector("#defect-resolved-photo-previews");
      
      let resTempImages = [];

      resUploadZone.addEventListener("click", () => resFileInput.click());
      resFileInput.addEventListener("change", (e) => {
        const files = e.target.files;
        if (files && files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Img = event.target.result;
            resTempImages.push(base64Img);
            
            const wrapper = document.createElement("div");
            wrapper.className = "preview-image-wrapper";
            wrapper.innerHTML = `
              <img src="${base64Img}">
              <button type="button" class="preview-image-remove">×</button>
            `;
            wrapper.querySelector(".preview-image-remove").addEventListener("click", (ev) => {
              ev.stopPropagation();
              const idx = resTempImages.indexOf(base64Img);
              if (idx > -1) resTempImages.splice(idx, 1);
              wrapper.remove();
            });
            resPreviewContainer.appendChild(wrapper);
          };
          reader.readAsDataURL(files[0]);
        }
      });

      const btnResolve = document.createElement("button");
      btnResolve.className = "btn btn-primary";
      btnResolve.textContent = "送出改善申報";
      btnResolve.addEventListener("click", () => {
        const notes = body.querySelector("#modal-action-notes").value;
        if (!notes) {
          showToast("請填寫改善說明備註！", "warning");
          return;
        }

        item.status = "Resolved";
        item.resolvedNotes = notes;
        item.resolvedDate = getTodayDateString();
        item.resolvedPhotos = [...resTempImages];

        setDB("smartsite_defects", defects);
        showToast("缺失改善已提交，等待核可結案", "success");
        addNotification("缺失改善申報", `王大明已回報改善缺失「${item.title}」，請核准結案。`);
        addActivity("success", `<strong>${currentUser.name}</strong> 申報了缺失 <strong>${item.title}</strong> 的改善成果。`);
        
        modal.classList.remove("active");
        renderDefectBoard();
      });
      footer.insertBefore(btnResolve, cancelBtn);
    }
  }

  // 3. Supervisor / Site Manager can approve / close Resolved -> Closed, or reject back to In Progress
  else if (item.status === "Resolved") {
    if (currentUser.role === "Supervisor" || currentUser.role === "Site Manager" || currentUser.role === "Administrator") {
      
      // Reject button
      const btnReject = document.createElement("button");
      btnReject.className = "btn btn-danger";
      btnReject.textContent = "駁回重作 (Reopen)";
      btnReject.addEventListener("click", () => {
        item.status = "In Progress";
        item.resolvedDate = null;
        item.resolvedNotes = "";
        item.resolvedPhotos = [];

        setDB("smartsite_defects", defects);
        showToast("已駁回改善申報，卡片返回改善中狀態", "warning");
        addNotification("改善申報駁回", `缺失「${item.title}」之改善複查未過，已退回重作。`);
        addActivity("warning", `<strong>${currentUser.name}</strong> 駁回了 <strong>${item.title}</strong> 的改善申請。`);
        
        modal.classList.remove("active");
        renderDefectBoard();
      });
      footer.insertBefore(btnReject, cancelBtn);

      // Approve/Close button
      const btnClose = document.createElement("button");
      btnClose.className = "btn btn-primary";
      btnClose.textContent = "審查核可結案 (Close)";
      btnClose.style.backgroundColor = "var(--success)";
      btnClose.style.borderColor = "var(--success)";
      btnClose.addEventListener("click", () => {
        item.status = "Closed";
        item.closedDate = getTodayDateString();

        setDB("smartsite_defects", defects);
        showToast("缺失審查完成，卡片已結案", "success");
        addNotification("缺失結案通知", `缺失項目「${item.title}」已由 ${currentUser.name} 審定結案。`);
        addActivity("success", `<strong>${currentUser.name}</strong> 審定結案了缺失 <strong>${item.title}</strong>。`);
        
        modal.classList.remove("active");
        renderDefectBoard();
      });
      footer.insertBefore(btnClose, cancelBtn);
    }
  }

  modal.classList.add("active");
};

// ==========================================
// 6. RISK ANALYSIS MODULE
// ==========================================
function setupRiskModule() {
  const severitySlider = document.getElementById("risk-severity");
  const probabilitySlider = document.getElementById("risk-probability");
  const severityVal = document.getElementById("risk-severity-val");
  const probabilityVal = document.getElementById("risk-probability-val");
  
  const scoreDisplay = document.getElementById("risk-score-val");
  const levelDisplay = document.getElementById("risk-level-val");
  const resultBox = document.getElementById("risk-result-box");
  
  const matrixCells = document.querySelectorAll(".risk-matrix-cell");

  const presetSelect = document.getElementById("ai-defect-preset");
  const customGroup = document.getElementById("ai-custom-input-group");
  const customDesc = document.getElementById("ai-custom-description");
  
  const recLevel = document.getElementById("ai-rec-level");
  const recOutput = document.getElementById("ai-rec-output");

  // Slider change trigger
  function updateRiskCalc() {
    const s = parseInt(severitySlider.value);
    const p = parseInt(probabilitySlider.value);
    const score = s * p;

    severityVal.textContent = s;
    probabilityVal.textContent = p;
    scoreDisplay.textContent = score;

    // Determine Risk Level
    let level = "Low (低風險)";
    let boxClass = "matrix-cell-low";
    let boxBg = "#DCFCE7";
    let boxColor = "#166534";
    let badgeRisk = "Low Risk";

    if (score >= 16) {
      level = "High (高風險)";
      boxClass = "matrix-cell-high";
      boxBg = "#FEE2E2";
      boxColor = "#991B1B";
      badgeRisk = "High Risk";
    } else if (score >= 6) {
      level = "Medium (中風險)";
      boxClass = "matrix-cell-medium";
      boxBg = "#FEF3C7";
      boxColor = "#92400E";
      badgeRisk = "Medium Risk";
    }

    resultBox.style.backgroundColor = boxBg;
    resultBox.style.color = boxColor;
    levelDisplay.textContent = level;

    // Highlight matrix cell
    matrixCells.forEach(cell => {
      cell.classList.remove("active-cell");
      const cs = parseInt(cell.getAttribute("data-s"));
      const cp = parseInt(cell.getAttribute("data-p"));
      if (cs === s && cp === p) {
        cell.classList.add("active-cell");
      }
    });

    // Sync Preset AI Recommendation based on level
    recLevel.textContent = badgeRisk;
    recLevel.className = `badge ${score >= 16 ? 'badge-danger' : score >= 6 ? 'badge-warning' : 'badge-success'}`;
    
    updateAIRecommendationText(score);
  }

  severitySlider.addEventListener("input", updateRiskCalc);
  probabilitySlider.addEventListener("input", updateRiskCalc);

  // Click Matrix cell trigger
  matrixCells.forEach(cell => {
    cell.addEventListener("click", () => {
      const s = cell.getAttribute("data-s");
      const p = cell.getAttribute("data-p");
      
      severitySlider.value = s;
      probabilitySlider.value = p;
      
      updateRiskCalc();
    });
  });

  // Preset selectors AI engine logic
  presetSelect.addEventListener("change", (e) => {
    const preset = e.target.value;
    if (preset === "custom") {
      customGroup.style.display = "block";
    } else {
      customGroup.style.display = "none";
      // Adjust sliders to match common preset levels
      if (preset === "harness") { severitySlider.value = 5; probabilitySlider.value = 4; } // High (20)
      else if (preset === "scaffold") { severitySlider.value = 4; probabilitySlider.value = 4; } // High (16)
      else if (preset === "helmet") { severitySlider.value = 3; probabilitySlider.value = 3; } // Medium (9)
      else if (preset === "wiring") { severitySlider.value = 4; probabilitySlider.value = 5; } // High (20)
      else if (preset === "storage") { severitySlider.value = 3; probabilitySlider.value = 4; } // Medium (12)
      
      updateRiskCalc();
    }
  });

  customDesc.addEventListener("input", () => {
    updateRiskCalc();
  });

  function updateAIRecommendationText(score) {
    const preset = presetSelect.value;
    let rec = "";

    if (preset === "harness") {
      rec = `<strong>【立即對策】</strong><br>
             1. 勒令該區高空作業暫停。<br>
             2. 要求操作人員立即回到安全踏板，並確實將安全帶雙掛鉤扣鎖於救生鋼索或主體結構定點上。<br>
             3. 派安衛人員現場監督改善後，始得恢復作業。<br><br>
             <strong>【根本原因與長期預防】</strong><br>
             - <strong>原因：</strong> 現場缺乏水平安全母索，或人員貪圖一時便利未繫掛。<br>
             - <strong>措施：</strong> 於高空外牆全面拉設不銹鋼或高強度纖維防墜水平母索；實施現地入工安全講習並嚴格處罰未掛鉤承商。`;
    } 
    else if (preset === "scaffold") {
      rec = `<strong>【立即對策】</strong><br>
             1. 限制人員攀登及在該不完整施工架上作業。<br>
             2. 設置危險管制線並張貼告示牌。<br>
             3. 通知專業架子工立刻補設中欄桿（高度45-55cm）、交叉拉桿及安全防護網。<br><br>
             <strong>【根本原因與長期預防】</strong><br>
             - <strong>原因：</strong> 施工架驗收流於形式，架設商未按圖施工即交付使用。<br>
             - <strong>措施：</strong> 施工架使用前須由安衛人員與工地主任共同簽章驗收合格；每日作業前進行自主檢查。`;
    }
    else if (preset === "helmet") {
      rec = `<strong>【立即對策】</strong><br>
             1. 工地門口守衛與安檢人員應予攔阻其進入。<br>
             2. 立即提供備用安全帽，要求其確實戴上並扣緊頤帶。<br>
             3. 違規者進行登記並依工地安衛罰則對承攬商實施扣款處分。<br><br>
             <strong>【根本原因與長期預防】</strong><br>
             - <strong>原因：</strong> 人員安全意識薄弱，門禁管制有漏洞。<br>
             - <strong>措施：</strong> 實施臉部辨識或門禁卡結合「未配戴安全帽AI影像辨識」系統，未戴者閘門拒絕開啟；加強新進人員安衛教育。`;
    }
    else if (preset === "wiring") {
      rec = `<strong>【立即對策】</strong><br>
             1. 立即派持照電工切斷該異常配電箱之電源迴路。<br>
             2. 動用抽水機清除地面積水。<br>
             3. 將臨時電線予以架高（高於地面2公尺以上）或套入PVC硬質保護管防止車輛碾壓破皮。<br><br>
             <strong>【根本原因與長期預防】</strong><br>
             - <strong>原因：</strong> 臨時用電私接現象嚴重，缺乏防水絕緣與漏電斷路器防護。<br>
             - <strong>措施：</strong> 所有臨時電箱必須上鎖，配備合格之漏電斷路器；每週指派電機工程師量測接地電阻及檢查絕緣狀況。`;
    }
    else if (preset === "storage") {
      rec = `<strong>【立即對策】</strong><br>
             1. 指派現場工班將阻礙通道的物料移動至指定「暫存區」。<br>
             2. 將木模等易燃材料移置通風良好、遠離火源處，並在旁配置合格滅火器。<br>
             3. 清除避難通道雜物，確保淨寬度大於1.2公尺。<br><br>
             <strong>【根本原因與長期預防】</strong><br>
             - <strong>原因：</strong> 工班施工完畢後未進行「一日一清」，材料商卸料位置未加規範。<br>
             - <strong>措施：</strong> 推行工地「5S管理（整理、整頓、清掃、清潔、素養）」，下班前30分鐘為強制整理整頓時間。`;
    }
    else {
      // Custom Description logic
      const descVal = customDesc.value.trim();
      let scoreText = score >= 16 ? "立即停止作業並強制執行現地整改，缺失必須當日結案。" : score >= 6 ? "限期 3 天內改善完成，並加強該區自主檢查頻率。" : "列入自主觀察項目，維持定期追蹤即可。";
      
      rec = `<strong>【針對自訂缺失之 AI 分析建議】</strong><br>
             - <strong>評估危害描述：</strong> ${descVal ? escapeHTML(descVal) : '未輸入異常描述'}<br>
             - <strong>風險綜合得分：</strong> ${score} 分 (嚴重度 ${severitySlider.value} × 發生機率 ${probabilitySlider.value})<br>
             - <strong>管制處理建議：</strong> ${scoreText}<br><br>
             <strong>【通用改善步驟】</strong><br>
             1. 消除危害源：第一時間排除高危風險要素。<br>
             2. 工程控制：增設護欄、遮罩、絕緣防護。<br>
             3. 管理控制：張貼警告牌、派員輪班看守、變更作業時間。<br>
             4. 個人防護具 (PPE)：強制佩戴足夠安全護具。`;
    }

    recOutput.innerHTML = rec;
  }

  // Initial calculation trigger
  updateRiskCalc();
}

// ==========================================
// 7. REPORTS MODULE
// ==========================================
function setupReportsModule() {
  const filterArea = document.getElementById("report-filter-area");
  const dateStart = document.getElementById("report-date-start");
  const dateEnd = document.getElementById("report-date-end");
  const csvBtn = document.getElementById("btn-export-csv");
  const pdfBtn = document.getElementById("btn-export-pdf");

  // Load defaults
  dateStart.value = "2026-06-01";
  dateEnd.value = getTodayDateString();

  [filterArea, dateStart, dateEnd].forEach(elem => {
    elem.addEventListener("input", renderReportsView);
  });

  // Export to CSV/Excel
  csvBtn.addEventListener("click", () => {
    exportToCSV();
  });

  // Export to PDF / Print view
  pdfBtn.addEventListener("click", () => {
    window.print();
  });
}

function renderReportsView() {
  const tbody = document.getElementById("report-table-body");
  tbody.innerHTML = "";

  const areaVal = document.getElementById("report-filter-area").value;
  const startVal = new Date(document.getElementById("report-date-start").value);
  const endVal = new Date(document.getElementById("report-date-end").value);

  // Filter defects list for reporting
  const filtered = defects.filter(d => {
    if (areaVal && d.workArea !== areaVal) return false;
    
    const cDate = new Date(d.createdDate);
    if (cDate < startVal || cDate > endVal) return false;
    
    return true;
  });

  // Calculate KPIs
  const reportInspections = inspections.filter(ins => {
    if (areaVal && ins.workArea !== areaVal) return false;
    const iDate = new Date(ins.date);
    return iDate >= startVal && iDate <= endVal;
  });

  const resolvedDefects = filtered.filter(d => d.status === "Resolved" || d.status === "Closed");

  document.getElementById("report-kpi-inspections").textContent = reportInspections.length;
  document.getElementById("report-kpi-defects").textContent = filtered.length;
  document.getElementById("report-kpi-resolved").textContent = resolvedDefects.length;
  
  if (filtered.length > 0) {
    const rate = Math.round((resolvedDefects.length / filtered.length) * 100);
    document.getElementById("report-kpi-avg-days").textContent = `${rate}% (改善率)`;
  } else {
    document.getElementById("report-kpi-avg-days").textContent = "100% (改善率)";
  }

  // Populate Table
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:32px;">在此區間無相關缺失資料。</td></tr>`;
    return;
  }

  filtered.forEach(d => {
    const tr = document.createElement("tr");
    const riskBadge = d.riskLevel === "High" ? "badge-danger" : d.riskLevel === "Medium" ? "badge-warning" : "badge-secondary";
    const statusBadge = d.status === "Open" ? "badge-danger" : d.status === "In Progress" ? "badge-warning" : d.status === "Resolved" ? "badge-primary" : "badge-success";

    tr.innerHTML = `
      <td>${d.id}</td>
      <td style="font-weight:600;">${escapeHTML(d.title)}</td>
      <td>${escapeHTML(d.workArea)}</td>
      <td>${escapeHTML(d.assignee)}</td>
      <td>${d.createdDate}</td>
      <td>${d.dueDate}</td>
      <td><span class="badge ${riskBadge}">${d.riskLevel}</span></td>
      <td><span class="badge ${statusBadge}">${d.status}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function exportToCSV() {
  const areaVal = document.getElementById("report-filter-area").value;
  const startVal = new Date(document.getElementById("report-date-start").value);
  const endVal = new Date(document.getElementById("report-date-end").value);

  const filtered = defects.filter(d => {
    if (areaVal && d.workArea !== areaVal) return false;
    const cDate = new Date(d.createdDate);
    return cDate >= startVal && cDate <= endVal;
  });

  if (filtered.length === 0) {
    showToast("查無可匯出的缺失資料", "warning");
    return;
  }

  // Setup CSV headers (Traditional Chinese)
  let csvContent = "缺失編號,缺失項目,工區位置,責任改善人,通報日期,改善期限,風險等級,目前狀態,改善說明\r\n";
  
  filtered.forEach(d => {
    const titleClean = d.title.replace(/"/g, '""');
    const descClean = (d.resolvedNotes || "").replace(/"/g, '""');
    csvContent += `"${d.id}","${titleClean}","${d.workArea}","${d.assignee}","${d.createdDate}","${d.dueDate}","${d.riskLevel}","${d.status}","${descClean}"\r\n`;
  });

  // Dynamic file trigger download with BOM to support Excel opening in Traditional Chinese
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `SmartSite_AI_Defects_Report_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast("Excel (CSV) 報表匯出成功", "success");
}

// ==========================================
// 8. USER MANAGEMENT MODULE
// ==========================================
function setupUsersModule() {
  const btnAdd = document.getElementById("btn-add-user");
  const modal = document.getElementById("modal-user");
  const closeBtns = modal.querySelectorAll(".modal-cancel-btn");
  const saveBtn = document.getElementById("btn-save-user");
  const searchInput = document.getElementById("user-search");

  btnAdd.addEventListener("click", () => {
    if (currentUser.role !== "Administrator") {
      showToast("僅有系統管理者 (Administrator) 可新增成員！", "danger");
      return;
    }
    document.getElementById("user-form").reset();
    document.getElementById("usr-id").value = "";
    document.getElementById("user-modal-title").textContent = "新增團隊成員";
    modal.classList.add("active");
  });

  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  });

  saveBtn.addEventListener("click", () => {
    const usrId = document.getElementById("usr-id").value;
    const name = document.getElementById("usr-name").value;
    const email = document.getElementById("usr-email").value;
    const dept = document.getElementById("usr-dept").value;
    const role = document.getElementById("usr-role").value;

    if (!name || !email || !dept) {
      showToast("請填寫所有欄位", "warning");
      return;
    }

    const initials = name.slice(-2);

    if (usrId) {
      // Edit User
      const user = users.find(u => u.id === usrId);
      if (user) {
        user.name = name;
        user.email = email;
        user.department = dept;
        user.role = role;
        user.avatar = initials;
        showToast("團隊成員資訊已更新", "success");
      }
    } else {
      // Add User
      const newUser = {
        id: `usr-${Date.now()}`,
        name,
        email,
        department: dept,
        role,
        avatar: initials
      };
      users.push(newUser);
      showToast("成功新增團隊成員", "success");
      addActivity("success", `<strong>系統</strong> 新增了團隊成員 <strong>${name}</strong> (${role})。`);
    }

    setDB("smartsite_users", users);
    modal.classList.remove("active");
    renderUsersList();
  });

  searchInput.addEventListener("input", renderUsersList);
}

function renderUsersList() {
  const container = document.getElementById("user-grid-container");
  container.innerHTML = "";

  const searchVal = document.getElementById("user-search").value.toLowerCase();

  const filtered = users.filter(u => {
    if (searchVal) {
      const matchText = `${u.name} ${u.email} ${u.department} ${u.role}`.toLowerCase();
      if (!matchText.includes(searchVal)) return false;
    }
    return true;
  });

  filtered.forEach(u => {
    const card = document.createElement("div");
    card.className = "user-card";
    
    // Toggle administrator specific actions
    let actionButtons = "";
    if (currentUser.role === "Administrator") {
      actionButtons = `
        <div class="user-card-actions">
          <button class="btn btn-secondary btn-sm" onclick="editUserCard('${u.id}')">編輯</button>
          <button class="btn btn-danger btn-sm" onclick="deleteUserCard('${u.id}')">刪除</button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="user-card-avatar">${u.avatar}</div>
      <div class="user-card-name">${escapeHTML(u.name)}</div>
      <div class="user-card-dept">${escapeHTML(u.department)}</div>
      <div class="user-card-email">${escapeHTML(u.email)}</div>
      <span class="badge ${u.role === 'Administrator' ? 'badge-danger' : u.role === 'Site Manager' ? 'badge-warning' : u.role === 'Inspector' ? 'badge-primary' : 'badge-secondary'}" style="margin-bottom:12px;">${u.role}</span>
      ${actionButtons}
    `;
    container.appendChild(card);
  });
}

window.editUserCard = function(id) {
  const u = users.find(usr => usr.id === id);
  if (!u) return;

  const modal = document.getElementById("modal-user");
  document.getElementById("usr-id").value = u.id;
  document.getElementById("usr-name").value = u.name;
  document.getElementById("usr-email").value = u.email;
  document.getElementById("usr-dept").value = u.department;
  document.getElementById("usr-role").value = u.role;

  document.getElementById("user-modal-title").textContent = "編輯成員資料";
  modal.classList.add("active");
};

window.deleteUserCard = function(id) {
  if (confirm("您確定要將此成員移出團隊嗎？此動作無法復原！")) {
    const uIdx = users.findIndex(usr => usr.id === id);
    if (uIdx > -1) {
      const name = users[uIdx].name;
      users.splice(uIdx, 1);
      setDB("smartsite_users", users);
      showToast("團隊成員已刪除", "success");
      addActivity("danger", `<strong>系統</strong> 移除了團隊成員 <strong>${name}</strong>。`);
      renderUsersList();
    }
  }
};

// ==========================================
// 9. HELPER UTILS
// ==========================================
function setupModals() {
  // Global backdrop cancel trigger
  const overlays = document.querySelectorAll(".modal-overlay");
  overlays.forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
      }
    });
  });
}

function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateStr, days) {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getFormattedDateTime() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
