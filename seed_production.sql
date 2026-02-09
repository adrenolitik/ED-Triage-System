-- Тестовые пациенты для production
INSERT INTO patients (patient_id, age, gender, arrival_mode, chief_complaint, admission_time) VALUES 
('PROD-001', 45, 'М', 'ambulance', 'Боль в груди', '2026-02-09 19:00:00'),
('PROD-002', 67, 'Ж', 'ambulance', 'Затрудненное дыхание', '2026-02-09 19:15:00'),
('PROD-003', 32, 'М', 'walk_in', 'Головная боль', '2026-02-09 19:30:00');

-- Оценки триажа
INSERT INTO triage_assessments (
  patient_id, respiratory_rate, spo2, oxygen_supplementation, 
  heart_rate, systolic_bp, temperature, consciousness_level, gcs_score,
  news_score, mews_score, qsofa_score, 
  triage_level, triage_color, priority_score
) VALUES 
(1, 24, 89, 1, 110, 95, 37.8, 'alert', 15, 10, 5, 2, 'red', '#ef4444', 90),
(2, 28, 88, 1, 120, 85, 38.2, 'voice', 13, 12, 6, 2, 'red', '#ef4444', 95),
(3, 16, 98, 0, 75, 120, 36.8, 'alert', 15, 2, 1, 0, 'yellow', '#fbbf24', 40);
