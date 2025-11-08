// Medical Scoring Systems for Triage

export interface VitalSigns {
  respiratoryRate: number;
  spo2: number;
  oxygenSupplementation: boolean;
  heartRate: number;
  systolicBP: number;
  temperature: number;
  consciousnessLevel: 'alert' | 'voice' | 'pain' | 'unresponsive';
  gcsScore?: number;
}

export interface TriageScores {
  news: number;
  mews: number;
  qsofa: number;
}

/**
 * Calculate National Early Warning Score (NEWS)
 * Range: 0-20
 * Clinical significance:
 * 0-4: Low risk
 * 5-6: Medium risk (urgent response)
 * 7+: High risk (emergency response)
 */
export function calculateNEWS(vitals: VitalSigns): number {
  let score = 0;

  // Respiratory rate score
  if (vitals.respiratoryRate <= 8) score += 3;
  else if (vitals.respiratoryRate <= 11) score += 1;
  else if (vitals.respiratoryRate <= 20) score += 0;
  else if (vitals.respiratoryRate <= 24) score += 2;
  else score += 3;

  // SpO2 score
  if (vitals.spo2 <= 91) score += 3;
  else if (vitals.spo2 <= 93) score += 2;
  else if (vitals.spo2 <= 95) score += 1;
  else score += 0;

  // Oxygen supplementation
  if (vitals.oxygenSupplementation) score += 2;

  // Heart rate score
  if (vitals.heartRate <= 40) score += 3;
  else if (vitals.heartRate <= 50) score += 1;
  else if (vitals.heartRate <= 90) score += 0;
  else if (vitals.heartRate <= 110) score += 1;
  else if (vitals.heartRate <= 130) score += 2;
  else score += 3;

  // Systolic BP score
  if (vitals.systolicBP <= 90) score += 3;
  else if (vitals.systolicBP <= 100) score += 2;
  else if (vitals.systolicBP <= 110) score += 1;
  else if (vitals.systolicBP <= 219) score += 0;
  else score += 3;

  // Temperature score
  if (vitals.temperature <= 35.0) score += 3;
  else if (vitals.temperature <= 36.0) score += 1;
  else if (vitals.temperature <= 38.0) score += 0;
  else if (vitals.temperature <= 39.0) score += 1;
  else score += 2;

  // Consciousness level score (AVPU)
  if (vitals.consciousnessLevel === 'alert') score += 0;
  else score += 3;

  return score;
}

/**
 * Calculate Modified Early Warning Score (MEWS)
 * Range: 0-14
 * Clinical significance:
 * 0-2: Low risk
 * 3-4: Medium risk
 * 5+: High risk
 */
export function calculateMEWS(vitals: VitalSigns): number {
  let score = 0;

  // Respiratory rate
  if (vitals.respiratoryRate < 9) score += 2;
  else if (vitals.respiratoryRate <= 14) score += 0;
  else if (vitals.respiratoryRate <= 20) score += 1;
  else if (vitals.respiratoryRate <= 29) score += 2;
  else score += 3;

  // Heart rate
  if (vitals.heartRate < 40) score += 2;
  else if (vitals.heartRate <= 50) score += 1;
  else if (vitals.heartRate <= 100) score += 0;
  else if (vitals.heartRate <= 110) score += 1;
  else if (vitals.heartRate <= 129) score += 2;
  else score += 3;

  // Systolic BP
  if (vitals.systolicBP < 70) score += 3;
  else if (vitals.systolicBP <= 80) score += 2;
  else if (vitals.systolicBP <= 100) score += 1;
  else if (vitals.systolicBP <= 199) score += 0;
  else score += 2;

  // Temperature
  if (vitals.temperature < 35) score += 2;
  else if (vitals.temperature <= 38.4) score += 0;
  else score += 2;

  // Consciousness (AVPU)
  if (vitals.consciousnessLevel === 'alert') score += 0;
  else if (vitals.consciousnessLevel === 'voice') score += 1;
  else if (vitals.consciousnessLevel === 'pain') score += 2;
  else score += 3;

  return score;
}

/**
 * Calculate Quick SOFA (qSOFA) score
 * Range: 0-3
 * Clinical significance:
 * 0-1: Low risk of sepsis
 * 2+: High risk of sepsis, ICU consideration
 */
export function calculateQSOFA(vitals: VitalSigns): number {
  let score = 0;

  // Respiratory rate >= 22/min
  if (vitals.respiratoryRate >= 22) score += 1;

  // Altered mental status (not alert)
  if (vitals.consciousnessLevel !== 'alert') score += 1;

  // Systolic BP <= 100 mmHg
  if (vitals.systolicBP <= 100) score += 1;

  return score;
}

/**
 * Determine triage level based on combined scores and clinical features
 */
export interface TriageResult {
  level: 'resuscitation' | 'emergency' | 'urgent' | 'semi-urgent' | 'non-urgent';
  color: 'red' | 'orange' | 'yellow' | 'green' | 'blue';
  priorityScore: number;
  immediateActions: string[];
  monitoringPlan: string[];
  investigationsNeeded: string[];
  escalationRequired: boolean;
}

export interface ClinicalFeatures {
  chestPain: boolean;
  dyspnea: boolean;
  trauma: boolean;
  bleeding: boolean;
  seizures: boolean;
  alteredMentalStatus: boolean;
}

export function determineTriageLevel(
  scores: TriageScores,
  vitals: VitalSigns,
  features: ClinicalFeatures
): TriageResult {
  const result: TriageResult = {
    level: 'non-urgent',
    color: 'blue',
    priorityScore: 0,
    immediateActions: [],
    monitoringPlan: [],
    investigationsNeeded: [],
    escalationRequired: false,
  };

  // Calculate priority score (0-100)
  result.priorityScore = Math.min(
    100,
    scores.news * 4 + scores.mews * 3 + scores.qsofa * 10
  );

  // Critical/Resuscitation criteria (RED)
  if (
    scores.qsofa >= 2 ||
    scores.news >= 7 ||
    vitals.consciousnessLevel === 'unresponsive' ||
    vitals.spo2 < 85 ||
    vitals.systolicBP < 70 ||
    features.seizures
  ) {
    result.level = 'resuscitation';
    result.color = 'red';
    result.priorityScore = Math.max(result.priorityScore, 90);
    result.escalationRequired = true;
    result.immediateActions.push(
      'Немедленная помощь реаниматолога',
      'Обеспечить проходимость дыхательных путей',
      'Подача высокопоточного кислорода',
      'Венозный доступ и инфузионная терапия',
      'Мониторинг витальных функций'
    );
    result.investigationsNeeded.push(
      'ЭКГ',
      'КТ головы (при травме/неврологии)',
      'Общий анализ крови, биохимия',
      'Коагулограмма',
      'Газы крови'
    );
  }
  // Emergency criteria (ORANGE)
  else if (
    scores.news >= 5 ||
    scores.mews >= 5 ||
    features.chestPain ||
    features.bleeding ||
    vitals.spo2 < 90 ||
    vitals.systolicBP < 90
  ) {
    result.level = 'emergency';
    result.color = 'orange';
    result.priorityScore = Math.max(result.priorityScore, 70);
    result.escalationRequired = true;
    result.immediateActions.push(
      'Немедленный осмотр врача (в течение 10 минут)',
      'Подача кислорода при SpO2 < 94%',
      'Венозный доступ',
      'Мониторинг витальных функций каждые 15 минут'
    );
    result.investigationsNeeded.push(
      'ЭКГ (при боли в груди)',
      'Общий анализ крови',
      'Биохимия крови',
      'Рентген грудной клетки (при одышке)'
    );
  }
  // Urgent criteria (YELLOW)
  else if (
    scores.news >= 3 ||
    scores.mews >= 3 ||
    features.dyspnea ||
    features.trauma ||
    vitals.temperature > 38.5 ||
    vitals.temperature < 36.0
  ) {
    result.level = 'urgent';
    result.color = 'yellow';
    result.priorityScore = Math.max(result.priorityScore, 50);
    result.immediateActions.push(
      'Осмотр врача в течение 30 минут',
      'Контроль витальных функций каждые 30 минут',
      'Обеспечить комфорт пациента'
    );
    result.investigationsNeeded.push(
      'Общий анализ крови',
      'Общий анализ мочи',
      'Рентгенография при необходимости'
    );
  }
  // Semi-urgent criteria (GREEN)
  else if (scores.news > 0 || scores.mews > 0) {
    result.level = 'semi-urgent';
    result.color = 'green';
    result.priorityScore = Math.max(result.priorityScore, 30);
    result.immediateActions.push(
      'Осмотр врача в течение 60 минут',
      'Измерение витальных функций каждый час'
    );
    result.investigationsNeeded.push('Базовые анализы по показаниям');
  }
  // Non-urgent (BLUE)
  else {
    result.level = 'non-urgent';
    result.color = 'blue';
    result.priorityScore = Math.max(result.priorityScore, 10);
    result.immediateActions.push(
      'Плановый осмотр в течение 120 минут',
      'Регистрация данных'
    );
  }

  // Monitoring plan based on level
  switch (result.level) {
    case 'resuscitation':
      result.monitoringPlan.push(
        'Непрерывный мониторинг ЭКГ, SpO2, АД',
        'Контроль сознания каждые 5 минут',
        'Учёт диуреза'
      );
      break;
    case 'emergency':
      result.monitoringPlan.push(
        'Мониторинг витальных функций каждые 15 минут',
        'Оценка динамики состояния каждые 30 минут'
      );
      break;
    case 'urgent':
      result.monitoringPlan.push(
        'Контроль витальных функций каждые 30 минут',
        'Переоценка через 1 час'
      );
      break;
    case 'semi-urgent':
      result.monitoringPlan.push(
        'Контроль витальных функций каждый час',
        'Переоценка через 2 часа'
      );
      break;
    default:
      result.monitoringPlan.push('Базовый мониторинг', 'Переоценка при изменении состояния');
  }

  return result;
}
