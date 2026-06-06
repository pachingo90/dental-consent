-- 診所資料表
CREATE TABLE IF NOT EXISTS clinics (
  id          TEXT PRIMARY KEY,
  name_zh     TEXT NOT NULL,
  name_en     TEXT NOT NULL,
  access_code TEXT NOT NULL,
  active      INTEGER DEFAULT 1,
  created_at  TEXT NOT NULL
);

-- 簽署記錄資料表
CREATE TABLE IF NOT EXISTS records (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  clinic_id     TEXT NOT NULL,
  patient_name  TEXT NOT NULL,
  type          TEXT NOT NULL,
  date          TEXT NOT NULL,
  time          TEXT NOT NULL,
  doctor        TEXT DEFAULT '',
  relation      TEXT DEFAULT '',
  teeth         TEXT DEFAULT '[]',
  checks        TEXT DEFAULT '[]',
  signature     TEXT DEFAULT '',
  created_at    TEXT NOT NULL,
  FOREIGN KEY (clinic_id) REFERENCES clinics(id)
);

-- 索引加速查詢
CREATE INDEX IF NOT EXISTS idx_records_clinic ON records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_records_date   ON records(clinic_id, date);
CREATE INDEX IF NOT EXISTS idx_records_name   ON records(clinic_id, patient_name);
