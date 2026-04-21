const fs = require('fs');
const path = require('path');

const rulesPath = path.join(__dirname, '../config/rules.json');
const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));

const specialtyMap = {
  'Vata': 'Nadi Pariksha',
  'Pitta': 'Diet & Nutrition',
  'Kapha': 'Panchakarma',
  'Vata/Pitta': 'Nadi Pariksha',
  'Kapha/Pitta': 'Kayachikitsa',
  'Pitta/Vata': 'Kayachikitsa',
  'Vata/Kapha': 'Diet & Nutrition',
};

const severityKey = (level) => {
  if (level === 1) return 'mild';
  if (level === 2) return 'moderate';
  return 'severe';
};

const symptomAliases = {
  headache: ['headache', 'migraine', 'head pain'],
  indigestion: ['indigestion', 'acidity', 'gas', 'bloating'],
  joint_pain: ['joint pain', 'knee pain', 'back pain', 'stiffness'],
  cold_cough: ['cold', 'cough', 'sore throat', 'congestion', 'sneeze'],
  fatigue: ['fatigue', 'tired', 'low energy', 'weakness'],
  anxiety: ['anxiety', 'stress', 'restless', 'panic'],
  insomnia: ['insomnia', 'sleepless', 'sleep problem', 'cannot sleep'],
  skin_rash: ['skin rash', 'itching', 'rash', 'redness'],
};

const symptomCauseHints = {
  headache: ['stress', 'sleep disruption', 'dehydration', 'pitta aggravation'],
  indigestion: ['irregular meals', 'heavy/oily food', 'weak digestive fire (agni)'],
  joint_pain: ['vata aggravation', 'inflammation', 'poor posture or strain'],
  cold_cough: ['kapha accumulation', 'weather exposure', 'low immunity'],
  fatigue: ['poor sleep quality', 'nutritional imbalance', 'chronic stress'],
  anxiety: ['high stress load', 'vata imbalance', 'sleep deprivation'],
  insomnia: ['mental overactivity', 'late-night routines', 'stress and anxiety'],
  skin_rash: ['allergic trigger', 'pitta aggravation', 'dietary intolerance'],
};

const inferSeverityFromMessage = (loweredMessage) => {
  if (/(severe|high|intense|unbearable|extreme)/.test(loweredMessage)) return 3;
  if (/(moderate|medium)/.test(loweredMessage)) return 2;
  return 1;
};

const inferSymptomsFromMessage = (loweredMessage) =>
  Object.entries(symptomAliases)
    .filter(([, aliases]) => aliases.some((alias) => loweredMessage.includes(alias)))
    .map(([symptom]) => symptom);

const predictLikelyCauses = (symptoms = []) => {
  const causes = symptoms.flatMap((symptom) => symptomCauseHints[symptom] || []);
  const unique = [...new Set(causes)];
  return unique.slice(0, 5);
};

const analyzeSymptoms = ({ symptoms = [], lifestyle = '', language = 'en' }) => {
  let totalScore = 0;
  const doshaCollection = [];
  const recommendations = [];
  const unknownSymptoms = [];

  symptoms.forEach((sym) => {
    const rule = rules.symptoms[sym.name];
    if (!rule) {
      unknownSymptoms.push(sym.name);
      return;
    }

    const key = severityKey(Number(sym.severity || 1));
    const rec = rule.severity[key];
    totalScore += rec.score;
    doshaCollection.push(rule.dosha);
    recommendations.push({
      symptom: sym.name,
      severity: key,
      ...rec,
    });
  });

  const uniqDosha = [...new Set(doshaCollection)];
  const doshaImbalance = uniqDosha.length ? uniqDosha.join('/') : 'General Imbalance';
  const severityLevel = totalScore >= 6 ? 'severe' : totalScore >= 3 ? 'moderate' : 'mild';

  let urgency = 'LOW';
  if (severityLevel === 'moderate') urgency = 'MEDIUM';
  if (severityLevel === 'severe') urgency = 'HIGH';

  const recommendedSpecialty = specialtyMap[doshaImbalance] || 'Kayachikitsa';

  return {
    doshaImbalance,
    severityLevel,
    urgency,
    lifestyleSummary: lifestyle || 'Not provided',
    recommendedSpecialty,
    recommendations,
    unknownSymptoms,
    disclaimer: rules.disclaimer,
    language,
  };
};

const fallbackAssistantReply = ({ message, triage, assistantName = 'AyuBot', memorySummary = null }) => {
  const lowered = String(message || '').toLowerCase();
  if (lowered.includes('emergency') || lowered.includes('chest pain') || lowered.includes('breath')) {
    return 'This may be urgent. Please seek emergency medical help immediately or call your local emergency number.';
  }

  if (lowered.includes('doctor') || lowered.includes('not satisfied') || lowered.includes('dissatisfied')) {
    return 'I understand. I can escalate your case to a doctor right now. Please share your preferred consultation time.';
  }

  if (/(book|appointment|consultation)/.test(lowered)) {
    return 'I can help with booking. Please tell me your preferred specialty and time, and I will guide you to the doctor consultation flow.';
  }

  let effectiveTriage = triage || null;
  if (!effectiveTriage) {
    const inferredSymptoms = inferSymptomsFromMessage(lowered);
    if (inferredSymptoms.length) {
      const inferredSeverity = inferSeverityFromMessage(lowered);
      effectiveTriage = analyzeSymptoms({
        symptoms: inferredSymptoms.map((name) => ({ name, severity: inferredSeverity })),
        lifestyle: '',
        language: 'en',
      });
    }
  }

  if (effectiveTriage?.recommendations?.length) {
    const primary = effectiveTriage.recommendations[0];
    const step = primary.home || primary.med || primary.action || 'Hydrate well and rest';
    const reason = primary.reason || 'supports dosha rebalancing';
    const memoryHint =
      memorySummary?.topSymptoms?.length
        ? ` I also noted previous recurring symptoms: ${memorySummary.topSymptoms.join(', ')}.`
        : '';
    return `I noted a likely ${effectiveTriage.doshaImbalance} pattern.${memoryHint} A helpful first step is: ${step}. Ayurvedic reasoning: ${reason}. If symptoms are severe or persistent, please consult a doctor promptly.`;
  }

  if (/(hello|hi|hey|namaste)/.test(lowered)) {
    return `Namaste, I am ${assistantName}. I can help with symptom guidance, home remedies, and doctor consultation when needed. Tell me your main symptom to begin.`;
  }

  return 'Thanks for sharing. Please mention your key symptoms (for example headache, joint pain, indigestion) and severity so I can give focused guidance.';
};

const generateAssistantReply = async ({ message, triage, assistantName = 'AyuBot', memorySummary = null }) => {
  if (!process.env.OPENAI_API_KEY) {
    return fallbackAssistantReply({ message, triage, assistantName, memorySummary });
  }

  try {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

    const prompt = [
      'You are an Ayurvedic telemedicine assistant.',
      'Give safe, non-diagnostic guidance and suggest doctor consultation when needed.',
      `Assistant display name: ${assistantName}`,
      `Known triage context: ${JSON.stringify(triage || {})}`,
      `Longitudinal symptom memory: ${JSON.stringify(memorySummary || {})}`,
      `Patient message: ${message}`,
    ].join('\n');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    return (
      data?.choices?.[0]?.message?.content ||
      fallbackAssistantReply({ message, triage, assistantName, memorySummary })
    );
  } catch (err) {
    return fallbackAssistantReply({ message, triage, assistantName, memorySummary });
  }
};

module.exports = {
  analyzeSymptoms,
  generateAssistantReply,
  inferSymptomsFromMessage,
  inferSeverityFromMessage,
  predictLikelyCauses,
};
