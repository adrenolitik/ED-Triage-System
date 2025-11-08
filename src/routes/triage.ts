import { Hono } from 'hono';
import {
  calculateNEWS,
  calculateMEWS,
  calculateQSOFA,
  determineTriageLevel,
  type VitalSigns,
  type ClinicalFeatures,
} from '../lib/scoring';

type Bindings = {
  DB: D1Database;
};

const triage = new Hono<{ Bindings: Bindings }>();

// Create new patient and triage assessment
triage.post('/assess', async (c) => {
  try {
    const data = await c.req.json();
    const { patient, vitals, features, assessedBy } = data;

    // Validate required fields
    if (!patient?.patientId || !vitals || !features) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const db = c.env.DB;

    // Insert or update patient
    const patientResult = await db
      .prepare(
        `INSERT INTO patients (patient_id, age, gender, arrival_mode, chief_complaint)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(patient_id) DO UPDATE SET
           age = excluded.age,
           gender = excluded.gender,
           arrival_mode = excluded.arrival_mode,
           chief_complaint = excluded.chief_complaint,
           admission_time = CURRENT_TIMESTAMP
         RETURNING id`
      )
      .bind(
        patient.patientId,
        patient.age || null,
        patient.gender || null,
        patient.arrivalMode || 'walking',
        patient.chiefComplaint || null
      )
      .first();

    if (!patientResult) {
      return c.json({ error: 'Failed to create patient record' }, 500);
    }

    const patientDbId = patientResult.id as number;

    // Calculate scores
    const vitalSigns: VitalSigns = {
      respiratoryRate: vitals.respiratoryRate,
      spo2: vitals.spo2,
      oxygenSupplementation: vitals.oxygenSupplementation || false,
      heartRate: vitals.heartRate,
      systolicBP: vitals.systolicBP,
      temperature: vitals.temperature,
      consciousnessLevel: vitals.consciousnessLevel || 'alert',
      gcsScore: vitals.gcsScore,
    };

    const clinicalFeatures: ClinicalFeatures = {
      chestPain: features.chestPain || false,
      dyspnea: features.dyspnea || false,
      trauma: features.trauma || false,
      bleeding: features.bleeding || false,
      seizures: features.seizures || false,
      alteredMentalStatus: features.alteredMentalStatus || false,
    };

    const newsScore = calculateNEWS(vitalSigns);
    const mewsScore = calculateMEWS(vitalSigns);
    const qsofaScore = calculateQSOFA(vitalSigns);

    const triageResult = determineTriageLevel(
      { news: newsScore, mews: mewsScore, qsofa: qsofaScore },
      vitalSigns,
      clinicalFeatures
    );

    // Insert triage assessment
    const assessmentResult = await db
      .prepare(
        `INSERT INTO triage_assessments (
          patient_id, respiratory_rate, spo2, oxygen_supplementation, oxygen_flow,
          heart_rate, systolic_bp, diastolic_bp, temperature, consciousness_level, gcs_score,
          chest_pain, dyspnea, trauma, bleeding, seizures, altered_mental_status,
          news_score, mews_score, qsofa_score,
          triage_level, triage_color, priority_score,
          immediate_actions, monitoring_plan, investigations_needed, escalation_required,
          assessed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id`
      )
      .bind(
        patientDbId,
        vitals.respiratoryRate,
        vitals.spo2,
        vitals.oxygenSupplementation ? 1 : 0,
        vitals.oxygenFlow || null,
        vitals.heartRate,
        vitals.systolicBP,
        vitals.diastolicBP || null,
        vitals.temperature,
        vitals.consciousnessLevel,
        vitals.gcsScore || null,
        features.chestPain ? 1 : 0,
        features.dyspnea ? 1 : 0,
        features.trauma ? 1 : 0,
        features.bleeding ? 1 : 0,
        features.seizures ? 1 : 0,
        features.alteredMentalStatus ? 1 : 0,
        newsScore,
        mewsScore,
        qsofaScore,
        triageResult.level,
        triageResult.color,
        triageResult.priorityScore,
        JSON.stringify(triageResult.immediateActions),
        JSON.stringify(triageResult.monitoringPlan),
        JSON.stringify(triageResult.investigationsNeeded),
        triageResult.escalationRequired ? 1 : 0,
        assessedBy || null
      )
      .first();

    // Log the assessment
    await db
      .prepare(
        `INSERT INTO triage_logs (patient_id, assessment_id, action, details, user_id)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        patientDbId,
        assessmentResult?.id || null,
        'ASSESSMENT_CREATED',
        `Triage level: ${triageResult.level}, Priority: ${triageResult.priorityScore}`,
        assessedBy || null
      )
      .run();

    return c.json({
      success: true,
      patientId: patient.patientId,
      assessmentId: assessmentResult?.id,
      scores: {
        news: newsScore,
        mews: mewsScore,
        qsofa: qsofaScore,
      },
      triage: triageResult,
    });
  } catch (error) {
    console.error('Error in triage assessment:', error);
    return c.json({ error: 'Internal server error', details: String(error) }, 500);
  }
});

// Get all patients with latest assessment
triage.get('/patients', async (c) => {
  try {
    const db = c.env.DB;
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const patients = await db
      .prepare(
        `SELECT 
          p.id, p.patient_id, p.age, p.gender, p.arrival_mode, 
          p.chief_complaint, p.admission_time,
          t.triage_level, t.triage_color, t.priority_score, t.assessment_time,
          t.news_score, t.mews_score, t.qsofa_score
         FROM patients p
         LEFT JOIN triage_assessments t ON p.id = t.patient_id
         WHERE t.id = (
           SELECT id FROM triage_assessments 
           WHERE patient_id = p.id 
           ORDER BY assessment_time DESC 
           LIMIT 1
         )
         ORDER BY t.priority_score DESC, p.admission_time DESC
         LIMIT ? OFFSET ?`
      )
      .bind(limit, offset)
      .all();

    return c.json({ success: true, patients: patients.results });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get patient details with all assessments
triage.get('/patient/:patientId', async (c) => {
  try {
    const patientId = c.req.param('patientId');
    const db = c.env.DB;

    const patient = await db
      .prepare('SELECT * FROM patients WHERE patient_id = ?')
      .bind(patientId)
      .first();

    if (!patient) {
      return c.json({ error: 'Patient not found' }, 404);
    }

    const assessments = await db
      .prepare(
        `SELECT * FROM triage_assessments 
         WHERE patient_id = ? 
         ORDER BY assessment_time DESC`
      )
      .bind(patient.id)
      .all();

    const logs = await db
      .prepare(
        `SELECT * FROM triage_logs 
         WHERE patient_id = ? 
         ORDER BY timestamp DESC`
      )
      .bind(patient.id)
      .all();

    return c.json({
      success: true,
      patient,
      assessments: assessments.results,
      logs: logs.results,
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get statistics
triage.get('/stats', async (c) => {
  try {
    const db = c.env.DB;

    const stats = await db
      .prepare(
        `SELECT 
          COUNT(DISTINCT p.id) as total_patients,
          SUM(CASE WHEN t.triage_color = 'red' THEN 1 ELSE 0 END) as red_patients,
          SUM(CASE WHEN t.triage_color = 'orange' THEN 1 ELSE 0 END) as orange_patients,
          SUM(CASE WHEN t.triage_color = 'yellow' THEN 1 ELSE 0 END) as yellow_patients,
          SUM(CASE WHEN t.triage_color = 'green' THEN 1 ELSE 0 END) as green_patients,
          SUM(CASE WHEN t.triage_color = 'blue' THEN 1 ELSE 0 END) as blue_patients,
          AVG(t.news_score) as avg_news,
          AVG(t.mews_score) as avg_mews,
          AVG(t.priority_score) as avg_priority
         FROM patients p
         LEFT JOIN triage_assessments t ON p.id = t.patient_id
         WHERE t.id = (
           SELECT id FROM triage_assessments 
           WHERE patient_id = p.id 
           ORDER BY assessment_time DESC 
           LIMIT 1
         )`
      )
      .first();

    return c.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default triage;
