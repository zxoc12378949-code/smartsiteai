-- =================================================================
-- SmartSite AI - D1 Database Schema
-- Version: 1.0
-- Compatible with: Cloudflare D1 (SQLite-compatible)
-- =================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('inspector', 'manager', 'supervisor', 'admin')),
  department TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  name TEXT NOT NULL,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. Inspections Table
CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inspector_id TEXT NOT NULL REFERENCES users(id),
  inspection_date TEXT NOT NULL,
  work_area TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pass' CHECK (status IN ('pass', 'warning', 'fail')),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Inspection Items Table
CREATE TABLE IF NOT EXISTS inspection_items (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  inspection_id TEXT NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  result TEXT NOT NULL DEFAULT 'normal' CHECK (result IN ('normal', 'abnormal'))
);

-- 5. Defects Table
CREATE TABLE IF NOT EXISTS defects (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inspection_id TEXT REFERENCES inspections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  work_area TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  responsible_user_id TEXT REFERENCES users(id),
  due_date TEXT,
  resolved_notes TEXT,
  resolved_date TEXT,
  closed_date TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6. Defect Attachments Table
CREATE TABLE IF NOT EXISTS defect_attachments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  defect_id TEXT NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  attachment_type TEXT NOT NULL DEFAULT 'before' CHECK (attachment_type IN ('before', 'after')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 7. Risk Assessments Table
CREATE TABLE IF NOT EXISTS risk_assessments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  defect_id TEXT NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  severity INTEGER NOT NULL CHECK (severity BETWEEN 1 AND 5),
  probability INTEGER NOT NULL CHECK (probability BETWEEN 1 AND 5),
  risk_score INTEGER NOT NULL,
  ai_suggestion TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('defect_created', 'due_soon', 'overdue', 'resolved', 'status_changed')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- =================================================================
-- Indexes for performance
-- =================================================================
CREATE INDEX IF NOT EXISTS idx_inspections_project ON inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_inspector ON inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspection_items_inspection ON inspection_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_defects_project ON defects(project_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_risk_level ON defects(risk_level);
CREATE INDEX IF NOT EXISTS idx_defects_responsible ON defects(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_defect ON risk_assessments(defect_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- =================================================================
-- Seed Data (Initial demo data)
-- =================================================================

-- Admin User (password: Admin@1234)
INSERT OR IGNORE INTO users (id, name, email, password_hash, role, department) VALUES
  ('usr-admin-001', '李安管', 'admin@smartsite.com', '$2a$10$demo_hash_admin', 'admin', '系統管理部 - 經理'),
  ('usr-mgr-001', '王大明', 'manager@smartsite.com', '$2a$10$demo_hash_mgr', 'manager', '工務組 - 工地主任'),
  ('usr-ins-001', '陳小明', 'inspector@smartsite.com', '$2a$10$demo_hash_ins', 'inspector', '安衛室 - 巡檢工程師'),
  ('usr-sup-001', '黃監造', 'supervisor@smartsite.com', '$2a$10$demo_hash_sup', 'supervisor', '營建諮詢顧問 - 監造經理');

-- Demo Project
INSERT OR IGNORE INTO projects (id, name, location, status) VALUES
  ('proj-001', '智慧大廈新建工程', '台北市信義區', 'active');

-- Demo Inspections
INSERT OR IGNORE INTO inspections (id, project_id, inspector_id, inspection_date, work_area, status, notes) VALUES
  ('ins-001', 'proj-001', 'usr-ins-001', '2026-06-01', 'A區基礎', 'pass', '基礎開挖及週邊護欄防護網設置完善，現場標示清晰，未發現異常項目。'),
  ('ins-002', 'proj-001', 'usr-ins-001', '2026-06-08', 'B區主體', 'fail', '二樓外側施工架無搭設防護中欄桿，且部分高空作業人員未確實繫掛安全帶雙掛鉤。'),
  ('ins-003', 'proj-001', 'usr-ins-001', '2026-06-11', 'C區外牆', 'warning', '外牆卸料平台周遭堆放廢模板與包裝材，阻礙安全走道避難通行。');

-- Demo Inspection Items
INSERT OR IGNORE INTO inspection_items (id, inspection_id, item_name, result) VALUES
  ('item-001', 'ins-001', '安全帽配戴', 'normal'),
  ('item-002', 'ins-001', '施工架安全', 'normal'),
  ('item-003', 'ins-001', '用電安全', 'normal'),
  ('item-004', 'ins-001', '防墜設施', 'normal'),
  ('item-005', 'ins-001', '物料堆放', 'normal'),
  ('item-006', 'ins-001', '工地整理整頓', 'normal'),
  ('item-007', 'ins-002', '安全帽配戴', 'normal'),
  ('item-008', 'ins-002', '施工架安全', 'abnormal'),
  ('item-009', 'ins-002', '用電安全', 'normal'),
  ('item-010', 'ins-002', '防墜設施', 'abnormal'),
  ('item-011', 'ins-002', '物料堆放', 'normal'),
  ('item-012', 'ins-002', '工地整理整頓', 'normal'),
  ('item-013', 'ins-003', '安全帽配戴', 'normal'),
  ('item-014', 'ins-003', '施工架安全', 'normal'),
  ('item-015', 'ins-003', '用電安全', 'normal'),
  ('item-016', 'ins-003', '防墜設施', 'normal'),
  ('item-017', 'ins-003', '物料堆放', 'abnormal'),
  ('item-018', 'ins-003', '工地整理整頓', 'abnormal');

-- Demo Defects
INSERT OR IGNORE INTO defects (id, project_id, inspection_id, title, description, work_area, risk_level, status, responsible_user_id, due_date, resolved_notes, resolved_date, closed_date, created_by) VALUES
  ('def-001', 'proj-001', 'ins-002', '二樓外側施工架無搭設護欄與腳趾板', '於B區結構體二樓外側，發現部分架設完畢之施工架未設置交叉拉桿、中欄桿及腳趾板，存有墜落與物體飛落危險。', 'B區主體', 'high', 'open', 'usr-mgr-001', '2026-06-18', NULL, NULL, NULL, 'usr-ins-001'),
  ('def-002', 'proj-001', 'ins-002', '高空作業人員未確實繫掛安全帶', 'B區二樓樑柱模板鋼筋綁紮高空作業人員，身穿安全防墜吊帶，但現場未繫掛於安全母索上，涉嫌違規危險作業。', 'B區主體', 'high', 'in_progress', 'usr-ins-001', '2026-06-10', NULL, NULL, NULL, 'usr-ins-001'),
  ('def-003', 'proj-001', 'ins-003', '逃生通道雜物堆放阻礙通行', 'C區一樓安全走道與安全梯處，堆放大量拆卸下來的廢模板與水泥空袋，影響緊急避難逃生動線。', 'C區外牆', 'medium', 'resolved', 'usr-mgr-001', '2026-06-14', '現場廢棄木模與通道雜物已完成清理，恢復走道暢通，並宣導禁止暫存任何雜物。', '2026-06-12', NULL, 'usr-ins-001'),
  ('def-004', 'proj-001', NULL, '配電箱未加鎖且周圍有積水', 'D區機電室旁臨時配電箱門牌掀開未關閉鎖上，且正下方地面有清洗混凝土殘留積水，涉漏電觸電公安風險。', 'D區機電', 'high', 'closed', 'usr-mgr-001', '2026-06-05', '電箱已關閉鎖上，周圍積水已清除，並擺放絕緣橡膠墊防護。', '2026-06-03', '2026-06-04', 'usr-ins-001');

-- Demo Risk Assessments
INSERT OR IGNORE INTO risk_assessments (id, defect_id, severity, probability, risk_score, ai_suggestion) VALUES
  ('risk-001', 'def-001', 4, 4, 16, '立即對策：限制人員攀登及在不完整施工架上作業，設置危險管制線，通知專業架子工立刻補設中欄桿、交叉拉桿及安全防護網。'),
  ('risk-002', 'def-002', 5, 4, 20, '立即對策：勒令該區高空作業暫停，要求操作人員確實將安全帶雙掛鉤扣鎖於救生鋼索或主體結構定點上。'),
  ('risk-003', 'def-003', 3, 4, 12, '限期3天內完成清理，確保走道淨寬度大於1.2公尺，推行工地5S管理。'),
  ('risk-004', 'def-004', 4, 4, 16, '立即切斷異常配電箱電源迴路，清除積水，將臨時電線予以架高或套入保護管。');

-- Demo Notifications
INSERT OR IGNORE INTO notifications (id, user_id, type, title, message, is_read) VALUES
  ('noti-001', 'usr-mgr-001', 'overdue', '逾期警告', '缺失「高空作業人員未確實繫掛安全帶」已超過改善期限 (2026-06-10)。', 0),
  ('noti-002', 'usr-sup-001', 'resolved', '缺失待審核', '王大明已回報改善「逃生通道雜物堆放阻礙通行」，請進行複查與結案。', 0),
  ('noti-003', 'usr-mgr-001', 'defect_created', '新增缺失指派', '您有一項新缺失指派：「二樓外側施工架無搭設護欄與腳趾板」。', 0);
