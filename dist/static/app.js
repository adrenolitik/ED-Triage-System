// Anesthesiology Triage Application - Frontend

const API_BASE = '/api/triage';

// Application State
const state = {
  currentView: 'form', // 'form', 'patients', 'stats'
  patients: [],
  stats: null,
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
  loadPatients();
  loadStats();
});

// Main render function
function renderApp() {
  const app = document.getElementById('app');
  
  app.innerHTML = `
    <div class="min-h-screen">
      <!-- Header -->
      <header class="bg-blue-600 text-white shadow-lg">
        <div class="container mx-auto px-4 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold">
                <i class="fas fa-heartbeat mr-2"></i>
                Анестезиологический Триаж
              </h1>
              <p class="text-blue-100 mt-1">Система оценки тяжести состояния пациентов</p>
            </div>
            <div id="stats-summary" class="text-right">
              <!-- Stats will be inserted here -->
            </div>
          </div>
        </div>
      </header>

      <!-- Navigation -->
      <nav class="bg-white shadow-md mb-6">
        <div class="container mx-auto px-4">
          <div class="flex space-x-1">
            <button onclick="switchView('form')" 
                    class="nav-btn px-6 py-3 font-medium ${state.currentView === 'form' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}">
              <i class="fas fa-plus-circle mr-2"></i>Новая оценка
            </button>
            <button onclick="switchView('patients')" 
                    class="nav-btn px-6 py-3 font-medium ${state.currentView === 'patients' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}">
              <i class="fas fa-users mr-2"></i>Список пациентов
            </button>
            <button onclick="switchView('stats')" 
                    class="nav-btn px-6 py-3 font-medium ${state.currentView === 'stats' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}">
              <i class="fas fa-chart-bar mr-2"></i>Статистика
            </button>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="container mx-auto px-4 pb-12">
        <div id="main-content">
          <!-- Content will be rendered here -->
        </div>
      </main>
    </div>
  `;

  renderMainContent();
  renderStatsSummary();
}

// Switch between views
function switchView(view) {
  state.currentView = view;
  renderApp();
  
  if (view === 'patients') {
    loadPatients();
  } else if (view === 'stats') {
    loadStats();
  }
}

// Render main content based on current view
function renderMainContent() {
  const content = document.getElementById('main-content');
  
  switch (state.currentView) {
    case 'form':
      content.innerHTML = renderTriageForm();
      break;
    case 'patients':
      content.innerHTML = renderPatientsList();
      break;
    case 'stats':
      content.innerHTML = renderStatsView();
      break;
  }
}

// Render triage assessment form
function renderTriageForm() {
  return `
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-clipboard-list mr-2 text-blue-600"></i>
          Оценка пациента
        </h2>
        
        <form id="triage-form" onsubmit="handleSubmit(event)">
          <!-- Patient Information -->
          <div class="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 class="text-lg font-semibold mb-3 text-blue-900">
              <i class="fas fa-user mr-2"></i>Информация о пациенте
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">ID Пациента *</label>
                <input type="text" name="patientId" required 
                       class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Возраст</label>
                <input type="number" name="age" min="0" max="120"
                       class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Пол</label>
                <select name="gender" class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500">
                  <option value="">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Способ доставки</label>
                <select name="arrivalMode" class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500">
                  <option value="walking">Пешком</option>
                  <option value="ambulance">Скорая помощь</option>
                  <option value="icu">Реанимация</option>
                </select>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium mb-1">Жалоба</label>
                <input type="text" name="chiefComplaint" 
                       placeholder="Боль в груди, одышка, травма..."
                       class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
          </div>

          <!-- Vital Signs -->
          <div class="mb-6 p-4 bg-red-50 rounded-lg">
            <h3 class="text-lg font-semibold mb-3 text-red-900">
              <i class="fas fa-heart-pulse mr-2"></i>Витальные показатели
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-1">ЧДД (дых/мин) *</label>
                <input type="number" name="respiratoryRate" required min="0" max="60"
                       class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">SpO₂ (%) *</label>
                <input type="number" name="spo2" required min="50" max="100"
                       class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Подача O₂</label>
                <div class="flex items-center space-x-4 mt-2">
                  <label class="flex items-center">
                    <input type="checkbox" name="oxygenSupplementation" class="mr-2">
                    <span class="text-sm">Да</span>
                  </label>
                  <input type="number" name="oxygenFlow" placeholder="L/мин" min="0" max="15"
                         class="w-20 px-2 py-1 border rounded-md text-sm">
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">ЧСС (уд/мин) *</label>
                <input type="number" name="heartRate" required min="20" max="250"
                       class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">АД сист. (мм рт.ст.) *</label>
                <input type="number" name="systolicBP" required min="40" max="280"
                       class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">АД диаст. (мм рт.ст.)</label>
                <input type="number" name="diastolicBP" min="20" max="180"
                       class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Температура (°C) *</label>
                <input type="number" name="temperature" required min="30" max="44" step="0.1"
                       class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500">
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Уровень сознания *</label>
                <select name="consciousnessLevel" required 
                        class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500">
                  <option value="alert">Ясное (A)</option>
                  <option value="voice">Реакция на голос (V)</option>
                  <option value="pain">Реакция на боль (P)</option>
                  <option value="unresponsive">Без сознания (U)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">GCS (3-15)</label>
                <input type="number" name="gcsScore" min="3" max="15"
                       class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500">
              </div>
            </div>
          </div>

          <!-- Clinical Features -->
          <div class="mb-6 p-4 bg-yellow-50 rounded-lg">
            <h3 class="text-lg font-semibold mb-3 text-yellow-900">
              <i class="fas fa-exclamation-triangle mr-2"></i>Клинические признаки
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="chestPain" class="w-4 h-4">
                <span>Боль в груди</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="dyspnea" class="w-4 h-4">
                <span>Одышка</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="trauma" class="w-4 h-4">
                <span>Травма</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="bleeding" class="w-4 h-4">
                <span>Кровотечение</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="seizures" class="w-4 h-4">
                <span>Судороги</span>
              </label>
              <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="alteredMentalStatus" class="w-4 h-4">
                <span>Нарушение сознания</span>
              </label>
            </div>
          </div>

          <!-- Assessed By -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-1">Врач</label>
            <input type="text" name="assessedBy" 
                   class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500">
          </div>

          <!-- Submit Button -->
          <div class="flex justify-end space-x-3">
            <button type="button" onclick="document.getElementById('triage-form').reset()"
                    class="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-medium">
              <i class="fas fa-redo mr-2"></i>Очистить
            </button>
            <button type="submit" 
                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
              <i class="fas fa-save mr-2"></i>Оценить и сохранить
            </button>
          </div>
        </form>
      </div>

      <!-- Result Modal -->
      <div id="result-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div id="result-content"></div>
        </div>
      </div>
    </div>
  `;
}

// Handle form submission
async function handleSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  const data = {
    patient: {
      patientId: formData.get('patientId'),
      age: parseInt(formData.get('age')) || null,
      gender: formData.get('gender') || null,
      arrivalMode: formData.get('arrivalMode') || 'walking',
      chiefComplaint: formData.get('chiefComplaint') || null,
    },
    vitals: {
      respiratoryRate: parseInt(formData.get('respiratoryRate')),
      spo2: parseInt(formData.get('spo2')),
      oxygenSupplementation: formData.get('oxygenSupplementation') === 'on',
      oxygenFlow: parseInt(formData.get('oxygenFlow')) || null,
      heartRate: parseInt(formData.get('heartRate')),
      systolicBP: parseInt(formData.get('systolicBP')),
      diastolicBP: parseInt(formData.get('diastolicBP')) || null,
      temperature: parseFloat(formData.get('temperature')),
      consciousnessLevel: formData.get('consciousnessLevel'),
      gcsScore: parseInt(formData.get('gcsScore')) || null,
    },
    features: {
      chestPain: formData.get('chestPain') === 'on',
      dyspnea: formData.get('dyspnea') === 'on',
      trauma: formData.get('trauma') === 'on',
      bleeding: formData.get('bleeding') === 'on',
      seizures: formData.get('seizures') === 'on',
      alteredMentalStatus: formData.get('alteredMentalStatus') === 'on',
    },
    assessedBy: formData.get('assessedBy') || null,
  };

  try {
    const response = await axios.post(`${API_BASE}/assess`, data);
    
    if (response.data.success) {
      showResult(response.data);
      form.reset();
      loadPatients();
      loadStats();
    } else {
      alert('Ошибка: ' + (response.data.error || 'Неизвестная ошибка'));
    }
  } catch (error) {
    console.error('Error submitting assessment:', error);
    alert('Ошибка при отправке данных: ' + (error.response?.data?.error || error.message));
  }
}

// Show assessment result
function showResult(data) {
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-content');
  
  const colorClass = `triage-${data.triage.color}`;
  const levelText = {
    'resuscitation': 'РЕАНИМАЦИЯ',
    'emergency': 'ЭКСТРЕННАЯ',
    'urgent': 'СРОЧНАЯ',
    'semi-urgent': 'ПОЛУСРОЧНАЯ',
    'non-urgent': 'НЕСРОЧНАЯ'
  };

  content.innerHTML = `
    <div class="p-6">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-2xl font-bold text-gray-800">Результат оценки</h2>
        <button onclick="closeResultModal()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Triage Level -->
      <div class="${colorClass} rounded-lg p-6 mb-4 text-center">
        <div class="text-4xl font-bold mb-2">${levelText[data.triage.level]}</div>
        <div class="text-xl">Приоритет: ${data.triage.priorityScore}/100</div>
      </div>

      <!-- Scores -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-blue-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-600">${data.scores.news}</div>
          <div class="text-sm text-gray-600">NEWS</div>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-600">${data.scores.mews}</div>
          <div class="text-sm text-gray-600">MEWS</div>
        </div>
        <div class="bg-orange-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-orange-600">${data.scores.qsofa}</div>
          <div class="text-sm text-gray-600">qSOFA</div>
        </div>
      </div>

      <!-- Immediate Actions -->
      ${data.triage.immediateActions.length > 0 ? `
        <div class="mb-4">
          <h3 class="font-semibold text-red-700 mb-2">
            <i class="fas fa-bolt mr-2"></i>Немедленные действия:
          </h3>
          <ul class="list-disc list-inside space-y-1 text-sm">
            ${data.triage.immediateActions.map(action => `<li>${action}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Monitoring Plan -->
      ${data.triage.monitoringPlan.length > 0 ? `
        <div class="mb-4">
          <h3 class="font-semibold text-blue-700 mb-2">
            <i class="fas fa-heartbeat mr-2"></i>План мониторинга:
          </h3>
          <ul class="list-disc list-inside space-y-1 text-sm">
            ${data.triage.monitoringPlan.map(plan => `<li>${plan}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      <!-- Investigations -->
      ${data.triage.investigationsNeeded.length > 0 ? `
        <div class="mb-4">
          <h3 class="font-semibold text-green-700 mb-2">
            <i class="fas fa-microscope mr-2"></i>Необходимые исследования:
          </h3>
          <ul class="list-disc list-inside space-y-1 text-sm">
            ${data.triage.investigationsNeeded.map(inv => `<li>${inv}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${data.triage.escalationRequired ? `
        <div class="bg-red-50 border-l-4 border-red-600 p-4 mb-4">
          <div class="flex items-center">
            <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
            <span class="font-semibold text-red-800">Требуется эскалация помощи!</span>
          </div>
        </div>
      ` : ''}

      <div class="flex justify-end space-x-3">
        <button onclick="closeResultModal()" 
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
          <i class="fas fa-check mr-2"></i>Понятно
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeResultModal() {
  document.getElementById('result-modal').classList.add('hidden');
}

// Render patients list
function renderPatientsList() {
  if (state.patients.length === 0) {
    return `
      <div class="bg-white rounded-lg shadow-md p-12 text-center">
        <i class="fas fa-users text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">Пока нет пациентов</p>
      </div>
    `;
  }

  return `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div class="px-6 py-4 bg-gray-50 border-b">
        <h2 class="text-xl font-bold text-gray-800">
          <i class="fas fa-users mr-2"></i>
          Список пациентов (${state.patients.length})
        </h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-semibold">ID</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Возраст/Пол</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Жалоба</th>
              <th class="px-4 py-3 text-center text-sm font-semibold">Триаж</th>
              <th class="px-4 py-3 text-center text-sm font-semibold">Приоритет</th>
              <th class="px-4 py-3 text-center text-sm font-semibold">Шкалы</th>
              <th class="px-4 py-3 text-left text-sm font-semibold">Время</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            ${state.patients.map(patient => `
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">${patient.patient_id}</td>
                <td class="px-4 py-3">${patient.age || '-'}/${patient.gender === 'male' ? 'М' : patient.gender === 'female' ? 'Ж' : '-'}</td>
                <td class="px-4 py-3 text-sm">${patient.chief_complaint || '-'}</td>
                <td class="px-4 py-3 text-center">
                  <span class="triage-${patient.triage_color} px-3 py-1 rounded-full text-xs font-bold">
                    ${patient.triage_level?.toUpperCase()}
                  </span>
                </td>
                <td class="px-4 py-3 text-center font-bold text-lg">${patient.priority_score || '-'}</td>
                <td class="px-4 py-3 text-center text-sm">
                  <div>NEWS: ${patient.news_score}</div>
                  <div>MEWS: ${patient.mews_score}</div>
                  <div>qSOFA: ${patient.qsofa_score}</div>
                </td>
                <td class="px-4 py-3 text-sm">${new Date(patient.admission_time).toLocaleString('ru-RU')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Render stats view
function renderStatsView() {
  if (!state.stats) {
    return `
      <div class="bg-white rounded-lg shadow-md p-12 text-center">
        <i class="fas fa-spinner fa-spin text-4xl text-gray-300 mb-4"></i>
        <p class="text-gray-500">Загрузка статистики...</p>
      </div>
    `;
  }

  const s = state.stats;
  
  return `
    <div class="space-y-6">
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-chart-bar mr-2"></i>Статистика
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div class="bg-blue-50 p-6 rounded-lg text-center">
            <div class="text-4xl font-bold text-blue-600">${s.total_patients || 0}</div>
            <div class="text-gray-600 mt-2">Всего пациентов</div>
          </div>
          <div class="bg-purple-50 p-6 rounded-lg text-center">
            <div class="text-4xl font-bold text-purple-600">${(s.avg_news || 0).toFixed(1)}</div>
            <div class="text-gray-600 mt-2">Средний NEWS</div>
          </div>
          <div class="bg-orange-50 p-6 rounded-lg text-center">
            <div class="text-4xl font-bold text-orange-600">${(s.avg_priority || 0).toFixed(0)}</div>
            <div class="text-gray-600 mt-2">Средний приоритет</div>
          </div>
        </div>

        <div class="border-t pt-6">
          <h3 class="text-lg font-semibold mb-4">Распределение по категориям триажа:</h3>
          <div class="space-y-3">
            <div class="flex items-center">
              <div class="w-32 font-medium">
                <span class="triage-red px-3 py-1 rounded text-sm">КРАСНАЯ</span>
              </div>
              <div class="flex-1 bg-gray-200 rounded-full h-6 ml-4">
                <div class="triage-red h-6 rounded-full flex items-center justify-end px-2 text-sm font-bold"
                     style="width: ${((s.red_patients || 0) / (s.total_patients || 1) * 100)}%">
                  ${s.red_patients || 0}
                </div>
              </div>
            </div>
            
            <div class="flex items-center">
              <div class="w-32 font-medium">
                <span class="triage-orange px-3 py-1 rounded text-sm">ОРАНЖЕВАЯ</span>
              </div>
              <div class="flex-1 bg-gray-200 rounded-full h-6 ml-4">
                <div class="triage-orange h-6 rounded-full flex items-center justify-end px-2 text-sm font-bold"
                     style="width: ${((s.orange_patients || 0) / (s.total_patients || 1) * 100)}%">
                  ${s.orange_patients || 0}
                </div>
              </div>
            </div>
            
            <div class="flex items-center">
              <div class="w-32 font-medium">
                <span class="triage-yellow px-3 py-1 rounded text-sm">ЖЁЛТАЯ</span>
              </div>
              <div class="flex-1 bg-gray-200 rounded-full h-6 ml-4">
                <div class="triage-yellow h-6 rounded-full flex items-center justify-end px-2 text-sm font-bold"
                     style="width: ${((s.yellow_patients || 0) / (s.total_patients || 1) * 100)}%">
                  ${s.yellow_patients || 0}
                </div>
              </div>
            </div>
            
            <div class="flex items-center">
              <div class="w-32 font-medium">
                <span class="triage-green px-3 py-1 rounded text-sm">ЗЕЛЁНАЯ</span>
              </div>
              <div class="flex-1 bg-gray-200 rounded-full h-6 ml-4">
                <div class="triage-green h-6 rounded-full flex items-center justify-end px-2 text-sm font-bold"
                     style="width: ${((s.green_patients || 0) / (s.total_patients || 1) * 100)}%">
                  ${s.green_patients || 0}
                </div>
              </div>
            </div>
            
            <div class="flex items-center">
              <div class="w-32 font-medium">
                <span class="triage-blue px-3 py-1 rounded text-sm">СИНЯЯ</span>
              </div>
              <div class="flex-1 bg-gray-200 rounded-full h-6 ml-4">
                <div class="triage-blue h-6 rounded-full flex items-center justify-end px-2 text-sm font-bold"
                     style="width: ${((s.blue_patients || 0) / (s.total_patients || 1) * 100)}%">
                  ${s.blue_patients || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render stats summary in header
function renderStatsSummary() {
  const summary = document.getElementById('stats-summary');
  
  if (!state.stats) {
    summary.innerHTML = '<div class="text-sm">Загрузка...</div>';
    return;
  }

  const critical = (state.stats.red_patients || 0) + (state.stats.orange_patients || 0);
  
  summary.innerHTML = `
    <div class="text-sm">
      <div class="font-bold text-2xl">${state.stats.total_patients || 0}</div>
      <div class="text-blue-100">Пациентов</div>
      ${critical > 0 ? `<div class="text-yellow-300 font-semibold mt-1">⚠ ${critical} критических</div>` : ''}
    </div>
  `;
}

// Load patients from API
async function loadPatients() {
  try {
    const response = await axios.get(`${API_BASE}/patients?limit=100`);
    if (response.data.success) {
      state.patients = response.data.patients || [];
      if (state.currentView === 'patients') {
        renderMainContent();
      }
    }
  } catch (error) {
    console.error('Error loading patients:', error);
  }
}

// Load stats from API
async function loadStats() {
  try {
    const response = await axios.get(`${API_BASE}/stats`);
    if (response.data.success) {
      state.stats = response.data.stats;
      renderStatsSummary();
      if (state.currentView === 'stats') {
        renderMainContent();
      }
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Make functions globally accessible
window.switchView = switchView;
window.handleSubmit = handleSubmit;
window.closeResultModal = closeResultModal;
