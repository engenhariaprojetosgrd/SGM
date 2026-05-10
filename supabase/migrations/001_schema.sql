-- ============================================================
-- SGM – Sistema de Gestão de Mangueiras Hidráulicas
-- Migration 001: Schema inicial
-- ============================================================

-- HOSES (mangueiras instaladas)
CREATE TABLE IF NOT EXISTS hoses (
  id          TEXT PRIMARY KEY,
  equip       TEXT NOT NULL,
  system      TEXT NOT NULL,
  position    TEXT NOT NULL,
  supplier    TEXT NOT NULL,
  hose_type   TEXT,
  part_number TEXT,
  unit_cost   NUMERIC(10,2) DEFAULT 0,
  install_date DATE,
  install_hours NUMERIC(10,2) DEFAULT 0,
  expected_life INTEGER,
  notes       TEXT,
  status      TEXT DEFAULT 'active' CHECK (status IN ('active','replaced')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- FAILURES (ocorrências / substituições)
CREATE TABLE IF NOT EXISTS failures (
  id            TEXT PRIMARY KEY,
  hose_id       TEXT REFERENCES hoses(id) ON DELETE SET NULL,
  equip         TEXT NOT NULL,
  system        TEXT,
  position      TEXT,
  supplier_orig TEXT,
  fail_date     DATE,
  fail_hours    NUMERIC(10,2),
  mtbf          NUMERIC(10,2),
  fail_type     TEXT,
  downtime      NUMERIC(10,2) DEFAULT 0,
  root_cause    TEXT,
  new_supplier  TEXT,
  new_cost      NUMERIC(10,2),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- APP CONFIG (single row, id=1)
CREATE TABLE IF NOT EXISTS app_config (
  id                    INTEGER PRIMARY KEY DEFAULT 1,
  machine_cost_per_hour NUMERIC(10,2) DEFAULT 800,
  labor_cost_per_hour   NUMERIC(10,2) DEFAULT 45,
  labor_hours_install   NUMERIC(4,2)  DEFAULT 1.5,
  fleet_name            TEXT          DEFAULT 'MRN – Motoniveladora',
  updated_at            TIMESTAMPTZ   DEFAULT NOW()
);

INSERT INTO app_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hoses_updated_at
  BEFORE UPDATE ON hoses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hoses_equip    ON hoses(equip);
CREATE INDEX IF NOT EXISTS idx_hoses_supplier ON hoses(supplier);
CREATE INDEX IF NOT EXISTS idx_hoses_status   ON hoses(status);
CREATE INDEX IF NOT EXISTS idx_failures_hose  ON failures(hose_id);
CREATE INDEX IF NOT EXISTS idx_failures_equip ON failures(equip);
CREATE INDEX IF NOT EXISTS idx_failures_date  ON failures(fail_date);

-- ============================================================
-- RLS – Row Level Security (recomendado para produção)
-- Descomente após configurar autenticação
-- ============================================================
-- ALTER TABLE hoses      ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE failures   ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow all for authenticated" ON hoses      FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all for authenticated" ON failures   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all for authenticated" ON app_config FOR ALL USING (auth.role() = 'authenticated');
