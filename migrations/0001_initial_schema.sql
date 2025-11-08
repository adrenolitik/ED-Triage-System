-- Patients table
CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id TEXT UNIQUE NOT NULL,
  age INTEGER,
  gender TEXT,
  arrival_mode TEXT, -- 'walking', 'ambulance', 'icu'
  admission_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  chief_complaint TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Vital signs and triage assessments
CREATE TABLE IF NOT EXISTS triage_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  
  -- Vital signs
  respiratory_rate INTEGER, -- breaths/min
  spo2 INTEGER, -- %
  oxygen_supplementation BOOLEAN DEFAULT 0,
  oxygen_flow INTEGER, -- L/min
  heart_rate INTEGER, -- bpm
  systolic_bp INTEGER, -- mmHg
  diastolic_bp INTEGER, -- mmHg
  temperature REAL, -- Celsius
  consciousness_level TEXT, -- 'alert', 'voice', 'pain', 'unresponsive' (AVPU)
  gcs_score INTEGER, -- Glasgow Coma Scale (3-15)
  
  -- Clinical features
  chest_pain BOOLEAN DEFAULT 0,
  dyspnea BOOLEAN DEFAULT 0,
  trauma BOOLEAN DEFAULT 0,
  bleeding BOOLEAN DEFAULT 0,
  seizures BOOLEAN DEFAULT 0,
  altered_mental_status BOOLEAN DEFAULT 0,
  
  -- Calculated scores
  news_score INTEGER, -- National Early Warning Score
  mews_score INTEGER, -- Modified Early Warning Score
  qsofa_score INTEGER, -- Quick SOFA
  
  -- Triage result
  triage_level TEXT, -- 'resuscitation', 'emergency', 'urgent', 'semi-urgent', 'non-urgent'
  triage_color TEXT, -- 'red', 'orange', 'yellow', 'green', 'blue'
  priority_score INTEGER,
  
  -- Recommendations
  immediate_actions TEXT,
  monitoring_plan TEXT,
  investigations_needed TEXT,
  escalation_required BOOLEAN DEFAULT 0,
  
  -- Metadata
  assessed_by TEXT,
  assessment_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Audit log
CREATE TABLE IF NOT EXISTS triage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  assessment_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  user_id TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (assessment_id) REFERENCES triage_assessments(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_admission_time ON patients(admission_time);
CREATE INDEX IF NOT EXISTS idx_triage_patient_id ON triage_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_level ON triage_assessments(triage_level);
CREATE INDEX IF NOT EXISTS idx_triage_assessment_time ON triage_assessments(assessment_time);
CREATE INDEX IF NOT EXISTS idx_logs_patient_id ON triage_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON triage_logs(timestamp);
