const PatientSymptomMemory = require('../models/PatientSymptomMemory');
const {
  inferSymptomsFromMessage,
  inferSeverityFromMessage,
  predictLikelyCauses,
} = require('./aiService');

const medicationAliases = [
  'ashwagandha',
  'brahmi',
  'triphala',
  'chyawanprash',
  'giloy',
  'sitopaladi',
  'hingvashtak',
  'yogaraja guggulu',
  'maharasnadi',
  'pathyadi',
  'guggulu',
  'arishta',
  'kwath',
  'vati',
];

const extractAssistantNamePreference = (text = '') => {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const patterns = [
    /(?:call\s+you|your\s+name\s+is|talk\s+as|talk\s+like)\s+([a-z][a-z\s]{1,24})/i,
    /(?:i\s+will\s+call\s+you)\s+([a-z][a-z\s]{1,24})/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) {
      return match[1]
        .trim()
        .split(/\s+/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    }
  }
  return null;
};

const extractMedicationMentions = (text = '') => {
  const lowered = String(text || '').toLowerCase();
  return medicationAliases.filter((med) => lowered.includes(med));
};

const buildSymptomsFromText = (text = '') => {
  const lowered = String(text || '').toLowerCase();
  const inferredSymptoms = inferSymptomsFromMessage(lowered);
  const severity = inferSeverityFromMessage(lowered);
  return inferredSymptoms.map((name) => ({
    name,
    severity,
    confidence: 0.7,
  }));
};

const recomputeSummary = (entries = []) => {
  const symptomCounts = {};
  entries.forEach((entry) => {
    (entry.symptoms || []).forEach((symptom) => {
      symptomCounts[symptom.name] = (symptomCounts[symptom.name] || 0) + 1;
    });
  });

  const topSymptoms = Object.entries(symptomCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  const likelyCauses = predictLikelyCauses(topSymptoms);
  return { topSymptoms, likelyCauses };
};

const upsertSymptomMemory = async ({
  userId,
  source = 'CHAT',
  rawText = '',
  symptoms = [],
  medications = [],
  assistantName = 'AyuBot',
}) => {
  const normalizedSymptoms = Array.isArray(symptoms) ? symptoms.filter((s) => s?.name) : [];
  if (!normalizedSymptoms.length && !String(rawText || '').trim()) {
    return null;
  }

  const memory =
    (await PatientSymptomMemory.findOne({ userId })) ||
    new PatientSymptomMemory({ userId, entries: [] });

  memory.entries.push({
    source,
    assistantName,
    rawText: String(rawText || '').slice(0, 5000),
    symptoms: normalizedSymptoms,
    medications: Array.isArray(medications) ? medications.slice(0, 20) : [],
    createdAt: new Date(),
  });

  memory.entries = memory.entries.slice(-120);
  const summary = recomputeSummary(memory.entries);
  memory.topSymptoms = summary.topSymptoms;
  memory.likelyCauses = summary.likelyCauses;
  memory.lastAssistantName = assistantName || memory.lastAssistantName || 'AyuBot';
  await memory.save();

  return memory;
};

const getSymptomMemorySummary = async (userId) => {
  const memory = await PatientSymptomMemory.findOne({ userId });
  if (!memory) {
    return {
      topSymptoms: [],
      likelyCauses: [],
      lastAssistantName: 'AyuBot',
      recentEntries: [],
    };
  }

  return {
    topSymptoms: memory.topSymptoms || [],
    likelyCauses: memory.likelyCauses || [],
    lastAssistantName: memory.lastAssistantName || 'AyuBot',
    recentEntries: (memory.entries || []).slice(-5).reverse(),
  };
};

const captureFromMessage = async ({ userId, text, assistantName = 'AyuBot' }) => {
  const symptoms = buildSymptomsFromText(text);
  const medications = extractMedicationMentions(text);
  if (!symptoms.length && !medications.length) {
    return null;
  }
  return upsertSymptomMemory({
    userId,
    source: 'CHAT',
    rawText: text,
    symptoms,
    medications,
    assistantName,
  });
};

module.exports = {
  extractAssistantNamePreference,
  extractMedicationMentions,
  buildSymptomsFromText,
  upsertSymptomMemory,
  getSymptomMemorySummary,
  captureFromMessage,
};

