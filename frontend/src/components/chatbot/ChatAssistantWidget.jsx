import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appointmentsAPI, chatsAPI, doctorsAPI, symptomsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import './ChatAssistantWidget.css';

const quickActions = [
  { id: 'doctor', label: 'Talk to a doctor', message: 'I want to talk to a doctor.' },
  { id: 'assessment', label: 'Symptom guidance', message: 'Please help me understand my symptoms.' },
  { id: 'prescription', label: 'Upload prescription', message: 'I want to upload my previous prescription.' },
  { id: 'booking', label: 'Book appointment', message: 'Help me book an appointment.' },
  { id: 'assistant_name', label: 'Set assistant name', message: 'I want to call you Alex.' },
  { id: 'routine', label: 'Daily routine tips', message: 'Suggest an Ayurvedic daily routine for me.' },
  { id: 'account', label: 'Account help', message: 'I need help with my account.' },
];

const symptomCatalog = [
  { id: 'headache', label: 'Headache', keywords: ['headache', 'migraine', 'head pain'] },
  { id: 'joint_pain', label: 'Joint Pain', keywords: ['joint pain', 'knee pain', 'back pain', 'stiff'] },
  { id: 'indigestion', label: 'Indigestion', keywords: ['indigestion', 'gas', 'acidity', 'bloating'] },
  { id: 'cold_cough', label: 'Cold / Cough', keywords: ['cold', 'cough', 'throat', 'sneeze'] },
  { id: 'fatigue', label: 'Fatigue', keywords: ['fatigue', 'tired', 'weakness', 'low energy'] },
  { id: 'anxiety', label: 'Anxiety', keywords: ['anxiety', 'stress', 'panic', 'restless'] },
  { id: 'insomnia', label: 'Insomnia', keywords: ['insomnia', 'sleep', 'sleepless'] },
  { id: 'skin_rash', label: 'Skin Rash', keywords: ['rash', 'itching', 'skin allergy', 'redness'] },
];

const severityOptions = [
  { value: 1, label: 'Mild' },
  { value: 2, label: 'Moderate' },
  { value: 3, label: 'Severe/High' },
];

const createId = (prefix = 'msg') =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const nowIso = () => new Date().toISOString();

const textMessage = (sender, text, kind = 'text') => ({
  id: createId(sender.toLowerCase()),
  sender,
  kind,
  text,
  createdAt: nowIso(),
});

const normalizeMessages = (messages = []) =>
  messages
    .filter((item) => item?.text)
    .map((item, index) => ({
      id: `${item.createdAt || 'msg'}-${index}`,
      sender: item.sender || 'SYSTEM',
      text: item.text,
      kind: 'text',
      createdAt: item.createdAt || null,
    }));

const baseWelcome = [
  {
    id: 'welcome-1',
    sender: 'AI',
    kind: 'text',
    text: 'Namaste. I am your AyuSetu AI assistant. I can guide you with symptoms, booking, and doctor escalation.',
    createdAt: nowIso(),
  },
  {
    id: 'welcome-2',
    sender: 'AI',
    kind: 'text',
    text: 'You can start a symptom assessment to get report-style Ayurvedic guidance directly here.',
    createdAt: nowIso(),
  },
];

const createAssessmentState = () => ({
  active: false,
  step: 1,
  selectedSymptoms: [],
  severityBySymptom: {},
  age: '',
  gender: '',
  lifestyle: '',
  description: '',
  error: '',
  generating: false,
});

const createConsultationState = () => ({
  active: false,
  step: 'specialty',
  loading: false,
  error: '',
  doctors: [],
  specialties: [],
  selectedSpecialty: 'Any',
  selectedDoctor: null,
  availability: [],
  selectedDate: '',
  selectedTime: '',
  consultationType: 'telemedicine',
  symptomSummary: '',
});

const createPrescriptionState = () => ({
  active: false,
  step: 'upload',
  uploadedFile: null,
  fileName: '',
  extractionMode: '',
  followupQuestions: [],
  extractedText: '',
  extractedSymptoms: [],
  suggestedSeverityBySymptom: {},
  medications: [],
  currentFeeling: '',
  currentFeelingText: '',
  error: '',
  analyzing: false,
  generating: false,
});

const prescriptionFeelingOptions = [
  { value: 'improving', label: 'Improving' },
  { value: 'same', label: 'About the same' },
  { value: 'worse', label: 'Worse than before' },
  { value: 'new', label: 'New symptoms appeared' },
];

const roleHelpMessage = (isLoggedIn, isPatient) => {
  if (!isLoggedIn) {
    return 'Please sign in as a patient to start secure AI chat and symptom reports.';
  }
  if (!localStorage.getItem('token')) {
    return 'Your login session is incomplete. Please sign in again to continue secure chat.';
  }
  if (!isPatient) {
    return 'AI chat + symptom report flow is available in patient view. Please switch to a patient account.';
  }
  return '';
};

const getSymptomLabel = (symptomId) =>
  symptomCatalog.find((item) => item.id === symptomId)?.label ||
  symptomId.replace(/_/g, ' ');

const detectSeverityFromText = (text) => {
  const lowered = String(text || '').toLowerCase();
  if (/(severe|high|intense|unbearable|extreme)/.test(lowered)) return 3;
  if (/(moderate|medium)/.test(lowered)) return 2;
  if (/(mild|light|slight)/.test(lowered)) return 1;
  return 2;
};

const detectSymptomsFromText = (text) => {
  const lowered = String(text || '').toLowerCase();
  if (!lowered.trim()) return [];

  return symptomCatalog
    .filter((symptom) =>
      symptom.keywords.some((keyword) => lowered.includes(keyword))
    )
    .map((symptom) => symptom.id);
};

const buildSymptomsPayload = (assessment) => {
  const selected = assessment.selectedSymptoms.map((symptomId) => ({
    name: symptomId,
    severity: Number(assessment.severityBySymptom[symptomId] || 1),
  }));

  const detectedFromText = detectSymptomsFromText(assessment.description);
  const textSeverity = detectSeverityFromText(assessment.description);

  const existing = new Set(selected.map((item) => item.name));
  detectedFromText.forEach((symptomId) => {
    if (!existing.has(symptomId)) {
      selected.push({ name: symptomId, severity: textSeverity });
    }
  });

  return selected;
};

const buildReport = (data, symptomsForSubmission) => {
  const recommendations = (data?.recommendations || []).map((item) => ({
    symptom: item.symptom,
    homeRemedy: item.home || item.med || item.action || 'Consult a doctor for immediate support.',
    ayurvedicExplanation:
      item.reason ||
      `This symptom may relate to ${data?.doshaImbalance || 'a dosha'} imbalance.`,
    severity: item.severity || 'moderate',
  }));

  return {
    reportId: `AYU-${Date.now().toString().slice(-8)}`,
    generatedAt: nowIso(),
    doshaImbalance: data?.doshaImbalance || 'General Imbalance',
    severityLevel: data?.severityLevel || 'moderate',
    urgency: data?.urgency || 'MEDIUM',
    recommendedSpecialty: data?.recommendedSpecialty || 'Kayachikitsa',
    recommendations,
    symptoms: symptomsForSubmission || [],
    disclaimer:
      data?.disclaimer ||
      'This report is supportive wellness guidance and not a confirmed diagnosis.',
    highSeverity: symptomsForSubmission.some((item) => Number(item.severity) >= 3),
  };
};

const toTitle = (value = '') => {
  const text = String(value || '').replace(/_/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
};

const safeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const createPrintableReportHtml = (report) => {
  const rows = (report.recommendations || [])
    .map(
      (rec) => `
      <div class="item">
        <h4>${safeHtml(toTitle(rec.symptom))}</h4>
        <p><strong>Severity:</strong> ${safeHtml(toTitle(rec.severity || 'moderate'))}</p>
        <p><strong>Home Remedy:</strong> ${safeHtml(rec.homeRemedy || '')}</p>
        <p><strong>Ayurvedic Explanation:</strong> ${safeHtml(rec.ayurvedicExplanation || '')}</p>
      </div>
    `
    )
    .join('');

  const symptoms = (report.symptoms || [])
    .map((sym) => `${toTitle(sym.name)} (${toTitle(String(sym.severity || 1) === '3' ? 'severe' : String(sym.severity || 1) === '2' ? 'moderate' : 'mild')})`)
    .join(', ');

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>AyuSetu Report ${safeHtml(report.reportId || '')}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
      .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
      .item { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; margin-top: 10px; }
      .warn { border: 1px solid #fca5a5; background: #fff1f2; color: #b91c1c; padding: 10px; border-radius: 10px; margin: 10px 0; }
      h1, h2, h4, p { margin: 0 0 8px; }
      .muted { color: #475569; }
    </style>
  </head>
  <body>
    <h1>AyuSetu Wellness Report</h1>
    <p class="muted">Report ID: ${safeHtml(report.reportId || '')}</p>
    <p class="muted">Generated: ${safeHtml(new Date(report.generatedAt || Date.now()).toLocaleString())}</p>
    <div class="card">
      <div class="grid">
        <p><strong>Dosha Imbalance:</strong> ${safeHtml(report.doshaImbalance || '')}</p>
        <p><strong>Severity:</strong> ${safeHtml(toTitle(report.severityLevel || ''))}</p>
        <p><strong>Urgency:</strong> ${safeHtml(toTitle(report.urgency || ''))}</p>
        <p><strong>Recommended Specialty:</strong> ${safeHtml(report.recommendedSpecialty || '')}</p>
      </div>
      <p><strong>Symptoms:</strong> ${safeHtml(symptoms || 'Not captured')}</p>
      ${report.highSeverity ? '<div class="warn"><strong>Your symptom severity is high. While you can use these home remedies for temporary relief, we strongly advise consulting a doctor immediately.</strong></div>' : ''}
      <h2>Recommendations</h2>
      ${rows}
      <p class="muted"><strong>Disclaimer:</strong> ${safeHtml(report.disclaimer || '')}</p>
    </div>
  </body>
</html>
`;
};

export default function ChatAssistantWidget() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasToken = Boolean(localStorage.getItem('token'));
  const isLoggedIn = Boolean(user);
  const isAuthenticated = isLoggedIn && hasToken;
  const isPatient = user?.role === 'patient';

  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState(baseWelcome);
  const [assistantDisplayName, setAssistantDisplayName] = useState('AyuBot');
  const [memoryContext, setMemoryContext] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [serverHistoryLength, setServerHistoryLength] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState(createAssessmentState);
  const [consultation, setConsultation] = useState(createConsultationState);
  const [prescription, setPrescription] = useState(createPrescriptionState);
  const [viewMode, setViewMode] = useState('chat');
  const [chatEnded, setChatEnded] = useState(false);
  const [satisfaction, setSatisfaction] = useState('');
  const [forceQuickActions, setForceQuickActions] = useState(false);

  const chatBodyRef = useRef(null);
  const fileInputRef = useRef(null);

  const helperMessage = useMemo(
    () => roleHelpMessage(isLoggedIn, isPatient),
    [isLoggedIn, isPatient, hasToken]
  );

  useEffect(() => {
    setBootstrapped(false);
    setSessionId(null);
    setChatSessions([]);
    setAssistantDisplayName('AyuBot');
    setMemoryContext(null);
    setServerHistoryLength(0);
    setMessages(baseWelcome);
    setError('');
    setAssessment(createAssessmentState());
    setConsultation(createConsultationState());
    setPrescription(createPrescriptionState());
    setViewMode('chat');
    setChatEnded(false);
    setSatisfaction('');
    setForceQuickActions(false);
  }, [isLoggedIn, isPatient]);

  useEffect(() => {
    if (!isOpen || bootstrapped) return;

    const bootstrapChat = async () => {
      if (!isAuthenticated || !isPatient) {
        setMessages(
          helperMessage
            ? [...baseWelcome, textMessage('SYSTEM', helperMessage)]
            : baseWelcome
        );
        setBootstrapped(true);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const listResponse = await chatsAPI.mine();
        const sessions = listResponse?.data?.sessions || [];
        setChatSessions(sessions);
        let memory = null;
        try {
          const memoryResponse = await chatsAPI.memory();
          memory = memoryResponse?.data?.memory || null;
          setMemoryContext(memory);
          if (memory?.lastAssistantName) {
            setAssistantDisplayName(memory.lastAssistantName);
          }
        } catch (memoryError) {
          setMemoryContext(null);
        }
        const activeSession = sessions.find((item) => item.channel === 'AI') || sessions[0];

        if (activeSession?._id) {
          const normalized = normalizeMessages(activeSession.messages || []);
          setSessionId(activeSession._id);
          setAssistantDisplayName(activeSession.assistantName || memory?.lastAssistantName || 'AyuBot');
          setServerHistoryLength((activeSession.messages || []).length);
          setMessages(normalized.length ? normalized : baseWelcome);
        } else {
          const memoryIntro =
            memory?.topSymptoms?.length
              ? [
                  ...baseWelcome,
                  textMessage(
                    'AI',
                    `Welcome back. I remember your recurring symptoms: ${memory.topSymptoms.join(', ')}. Share how you feel today and I will personalize guidance.`
                  ),
                ]
              : baseWelcome;
          setMessages(memoryIntro);
          setServerHistoryLength(0);
        }
      } catch (bootstrapError) {
        setMessages([
          ...baseWelcome,
          textMessage('SYSTEM', 'Unable to connect to the AI assistant right now. Please try again shortly.'),
        ]);
      } finally {
        setBootstrapped(true);
        setLoading(false);
      }
    };

    bootstrapChat();
  }, [bootstrapped, helperMessage, isOpen, isAuthenticated, isPatient]);

  useEffect(() => {
    if (!chatBodyRef.current) return;
    chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [messages, loading, isOpen, assessment.active, assessment.step]);

  const startAssessmentFlow = () => {
    if (!isAuthenticated || !isPatient) {
      setMessages((previous) => [
        ...previous,
        textMessage('AI', helperMessage || 'Please sign in as a patient to start symptom assessment.'),
      ]);
      return;
    }

    setAssessment({
      ...createAssessmentState(),
      active: true,
    });
    setPrescription(createPrescriptionState());
    setError('');
    setChatEnded(false);
    setForceQuickActions(false);
    setMessages((previous) => [
      ...previous,
      textMessage('AI', 'Step 1: Select your symptoms below. Then continue through severity, profile details, and natural language description.'),
    ]);
  };

  const startPrescriptionFlow = () => {
    if (!isAuthenticated || !isPatient) {
      setMessages((previous) => [
        ...previous,
        textMessage('AI', helperMessage || 'Please sign in as a patient to upload and analyze reports.'),
      ]);
      return;
    }

    setAssessment(createAssessmentState());
    setConsultation(createConsultationState());
    setPrescription({
      ...createPrescriptionState(),
      active: true,
      step: 'upload',
    });
    setChatEnded(false);
    setError('');
    setForceQuickActions(false);
    setMessages((previous) => [
      ...previous,
      textMessage(
        'AI',
        'Upload your previous prescription/report file. I will analyze it, ask how you feel now, and generate a fresh guidance report.'
      ),
    ]);
  };

  const triggerPrescriptionFilePicker = () => {
    if (!prescription.active) {
      startPrescriptionFlow();
      return;
    }
    fileInputRef.current?.click();
  };

  const handlePrescriptionFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPrescription((previous) => ({
      ...previous,
      analyzing: true,
      error: '',
      uploadedFile: file,
      fileName: file.name,
    }));
    setError('');

    try {
      const response = await chatsAPI.analyzePrescription({
        file,
        generateReport: false,
      });
      const extracted = response?.data || {};
      const extractedSymptoms = (extracted?.structured?.symptoms || []).map((item) => item.name);
      const severityBySymptom = (extracted?.structured?.symptoms || []).reduce((acc, item) => {
        acc[item.name] = Number(item.severity || 2);
        return acc;
      }, {});
      const medications = extracted?.structured?.medications || [];
      setMemoryContext(extracted?.memorySummary || null);
      if (extracted?.memorySummary?.lastAssistantName) {
        setAssistantDisplayName(extracted.memorySummary.lastAssistantName);
      }

      const summary =
        extractedSymptoms.length > 0 || medications.length > 0
          ? `Analyzed ${file.name} on server (${extracted.extractionMode || 'AUTO'}). I detected ${extractedSymptoms.length} symptom pattern(s) and ${medications.length} medication mention(s).`
          : `Analyzed ${file.name} on server (${extracted.extractionMode || 'AUTO'}). I could not detect clear symptoms yet, so your follow-up input will guide the report.`;

      setMessages((previous) => [...previous, textMessage('AI', summary)]);
      setMessages((previous) => [
        ...previous,
        textMessage(
          'AI',
          extracted?.structured?.followupQuestions?.[0] ||
            'Follow-up: How are you feeling right now compared to your previous prescription period?'
        ),
      ]);

      setPrescription((previous) => ({
        ...previous,
        analyzing: false,
        step: 'followup',
        extractionMode: extracted.extractionMode || '',
        followupQuestions: extracted?.structured?.followupQuestions || [],
        extractedText: extracted.extractedPreview || '',
        extractedSymptoms,
        suggestedSeverityBySymptom: severityBySymptom,
        medications,
      }));
    } catch (fileError) {
      setPrescription((previous) => ({
        ...previous,
        analyzing: false,
        error: 'Could not read this file. Try a text-based report or continue by describing symptoms.',
      }));
    } finally {
      event.target.value = '';
    }
  };

  const generatePrescriptionFollowupReport = async () => {
    if (!isAuthenticated || !isPatient) {
      setPrescription((previous) => ({
        ...previous,
        error: helperMessage || 'Please sign in as a patient to generate report.',
      }));
      return;
    }

    if (!prescription.currentFeeling) {
      setPrescription((previous) => ({
        ...previous,
        error: 'Please choose how you feel right now.',
      }));
      return;
    }

    if (!prescription.uploadedFile) {
      setPrescription((previous) => ({
        ...previous,
        error: 'Please upload prescription/report file first.',
      }));
      return;
    }

    setPrescription((previous) => ({ ...previous, generating: true, error: '' }));
    try {
      const response = await chatsAPI.analyzePrescription({
        file: prescription.uploadedFile,
        followupText: prescription.currentFeelingText,
        currentFeeling: prescription.currentFeeling,
        generateReport: true,
      });
      const triage = response?.data?.triage || null;
      const symptoms = response?.data?.structured?.symptoms || [];
      if (!triage || !symptoms.length) {
        throw new Error('Unable to generate report from uploaded prescription.');
      }
      const report = buildReport(triage, symptoms);
      persistGeneratedReport(report);
      setMemoryContext(response?.data?.memorySummary || memoryContext);
      setMessages((previous) => [
        ...previous,
        textMessage(
          'PATIENT',
          `Uploaded ${prescription.fileName || 'report'} and shared current condition: ${
            prescription.currentFeelingText || prescription.currentFeeling
          }`
        ),
        textMessage('AI', 'Here is your follow-up report based on previous prescription + current condition.'),
        {
          id: createId('report'),
          sender: 'AI',
          kind: 'report',
          report,
          createdAt: nowIso(),
        },
      ]);
      setPrescription(createPrescriptionState());
      setForceQuickActions(true);
    } catch (submitError) {
      setPrescription((previous) => ({
        ...previous,
        generating: false,
        error:
          submitError?.response?.data?.message ||
          'Could not generate follow-up report right now. Please try again.',
      }));
    }
  };

  const cancelPrescriptionFlow = () => {
    setPrescription(createPrescriptionState());
    setMessages((previous) => [
      ...previous,
      textMessage('SYSTEM', 'Prescription analysis flow canceled. You can start again anytime.'),
    ]);
    setForceQuickActions(true);
  };

  const postMessage = async (text) => {
    const cleaned = String(text || '').trim();
    if (!cleaned || loading || assessment.generating) return;
    const lowered = cleaned.toLowerCase();

    if (assessment.active) {
      setAssessment((previous) => ({
        ...previous,
        error: 'Finish the active symptom assessment or cancel it before regular chat.',
      }));
      return;
    }
    if (prescription.active) {
      setPrescription((previous) => ({
        ...previous,
        error: 'Finish the active prescription flow or cancel it before regular chat.',
      }));
      return;
    }

    if (
      /(talk to a doctor|need doctor|book appointment|consultation|doctor consultation)/.test(
        lowered
      )
    ) {
      setMessages((previous) => [...previous, textMessage('PATIENT', cleaned)]);
      startConsultationFlow('Any');
      return;
    }

    if (/(upload report|upload prescription|previous prescription|analyze report)/.test(lowered)) {
      setMessages((previous) => [...previous, textMessage('PATIENT', cleaned)]);
      startPrescriptionFlow();
      return;
    }

    setInput('');
    setError('');
    setChatEnded(false);
    setForceQuickActions(false);

    if (!isAuthenticated || !isPatient) {
      setMessages((previous) => [
        ...previous,
        textMessage('PATIENT', cleaned),
        textMessage(
          'AI',
          helperMessage ||
            'I can assist once a patient session is active. Please sign in as a patient.'
        ),
      ]);
      return;
    }

    const localPatientMessage = textMessage('PATIENT', cleaned);
    setMessages((previous) => [...previous, localPatientMessage]);

    setLoading(true);
    try {
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const createResponse = await chatsAPI.create({ channel: 'AI' });
        activeSessionId = createResponse?.data?.session?._id || null;
        setSessionId(activeSessionId);
      }

      if (!activeSessionId) {
        throw new Error('Missing chat session');
      }

      const response = await chatsAPI.postPatientMessage(activeSessionId, { text: cleaned });
      const session = response?.data?.session;
      if (session?.assistantName) {
        setAssistantDisplayName(session.assistantName);
      }
      setChatSessions((previous) => {
        const withoutCurrent = previous.filter((item) => item._id !== session?._id);
        return session?._id ? [session, ...withoutCurrent] : previous;
      });
      const normalized = normalizeMessages(session?.messages || []);
      const nextServerLength = (session?.messages || []).length;

      let newServerMessages = normalized.slice(serverHistoryLength);
      newServerMessages = newServerMessages.filter(
        (item) => !(item.sender === 'PATIENT' && item.text.trim() === cleaned)
      );
      const lastLocalAi = [...messages].reverse().find((item) => item.sender === 'AI')?.text || '';
      newServerMessages = newServerMessages.map((item) => {
        if (
          item.sender === 'AI' &&
          item.text === lastLocalAi &&
          item.text.includes('Based on your profile, your likely imbalance is general')
        ) {
          const symptoms = detectSymptomsFromText(cleaned);
          if (symptoms.length) {
            return {
              ...item,
              text: `I understood ${symptoms.map(getSymptomLabel).join(', ')} from your message. For best accuracy, use Symptom guidance or upload a previous prescription so I can generate a detailed report.`,
            };
          }
        }
        return item;
      });

      setServerHistoryLength(nextServerLength);
      if (newServerMessages.length) {
        setMessages((previous) => [...previous, ...newServerMessages]);
      }
    } catch (postError) {
      setError(
        postError?.response?.data?.message ||
          'Message could not be sent. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    postMessage(input);
  };

  const toggleWorkflowSymptom = (symptomId) => {
    setAssessment((previous) => {
      const exists = previous.selectedSymptoms.includes(symptomId);
      const selectedSymptoms = exists
        ? previous.selectedSymptoms.filter((item) => item !== symptomId)
        : [...previous.selectedSymptoms, symptomId];

      const severityBySymptom = { ...previous.severityBySymptom };
      if (exists) {
        delete severityBySymptom[symptomId];
      } else if (!severityBySymptom[symptomId]) {
        severityBySymptom[symptomId] = 1;
      }

      return {
        ...previous,
        selectedSymptoms,
        severityBySymptom,
        error: '',
      };
    });
  };

  const setWorkflowSeverity = (symptomId, severity) => {
    setAssessment((previous) => ({
      ...previous,
      severityBySymptom: {
        ...previous.severityBySymptom,
        [symptomId]: severity,
      },
      error: '',
    }));
  };

  const goToNextAssessmentStep = () => {
    setAssessment((previous) => {
      if (previous.step === 1 && previous.selectedSymptoms.length === 0) {
        return { ...previous, error: 'Please select at least one symptom.' };
      }

      if (previous.step === 3) {
        if (!String(previous.age || '').trim()) {
          return { ...previous, error: 'Please enter age.' };
        }
        if (!String(previous.gender || '').trim()) {
          return { ...previous, error: 'Please select gender.' };
        }
        if (!String(previous.lifestyle || '').trim()) {
          return { ...previous, error: 'Please enter lifestyle details.' };
        }
      }

      return {
        ...previous,
        step: Math.min(previous.step + 1, 4),
        error: '',
      };
    });
  };

  const goToPreviousAssessmentStep = () => {
    setAssessment((previous) => ({
      ...previous,
      step: Math.max(previous.step - 1, 1),
      error: '',
    }));
  };

  const cancelAssessment = () => {
    setAssessment(createAssessmentState());
    setError('');
    setInput('');
    setMessages((previous) => [
      ...previous,
      textMessage('SYSTEM', 'Symptom assessment canceled.'),
    ]);
    setForceQuickActions(true);
  };

  const generateAssessmentReport = async () => {
    if (!isAuthenticated || !isPatient) {
      setAssessment((previous) => ({
        ...previous,
        error: helperMessage || 'Please sign in as a patient to generate symptom report.',
      }));
      return;
    }

    if (!String(assessment.description || '').trim()) {
      setAssessment((previous) => ({
        ...previous,
        error: 'Please describe your symptoms in natural language.',
      }));
      return;
    }

    const symptoms = buildSymptomsPayload(assessment);
    if (!symptoms.length) {
      setAssessment((previous) => ({
        ...previous,
        error: 'Could not detect symptoms. Please select symptoms or describe more clearly.',
      }));
      return;
    }

    setAssessment((previous) => ({ ...previous, generating: true, error: '' }));
    setError('');

    try {
      const lifestyle = [
        assessment.lifestyle,
        assessment.age ? `Age: ${assessment.age}` : '',
        assessment.gender ? `Gender: ${assessment.gender}` : '',
        `Description: ${assessment.description}`,
      ]
        .filter(Boolean)
        .join(' | ');

      const payload = {
        symptoms,
        lifestyle,
        language: 'en',
        inputMode: 'text',
      };

      const response = await symptomsAPI.submit(payload);
      const report = buildReport(response?.data, symptoms);
      persistGeneratedReport(report);

      setMessages((previous) => [
        ...previous,
        textMessage('PATIENT', assessment.description),
        textMessage('AI', 'Step 4 complete. Here is your symptom report.'),
        {
          id: createId('report'),
          sender: 'AI',
          kind: 'report',
          report,
          createdAt: nowIso(),
        },
      ]);
    } catch (submitError) {
      setAssessment((previous) => ({
        ...previous,
        error:
          submitError?.response?.data?.message ||
          'Could not generate report right now. Please try again.',
        generating: false,
      }));
      return;
    }

    setAssessment(createAssessmentState());
    setForceQuickActions(true);
  };

  const handleBookConsultation = (report) => {
    navigate('/doctors', {
      state: {
        specialty: report?.recommendedSpecialty || 'Kayachikitsa',
        reason: 'Recommended based on your chatbot symptom report',
      },
    });
    setIsOpen(false);
  };

  const persistGeneratedReport = (report) => {
    try {
      const existing = JSON.parse(localStorage.getItem('ayur_chat_reports') || '[]');
      localStorage.setItem(
        'ayur_chat_reports',
        JSON.stringify([{ ...report }, ...existing].slice(0, 25))
      );
    } catch (storageError) {
      // Keep UX non-blocking if local storage is unavailable.
    }
  };

  const handleDownloadReport = (report) => {
    const html = createPrintableReportHtml(report);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `AyuSetu-Report-${report.reportId || Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const handlePrintReport = (report) => {
    const html = createPrintableReportHtml(report);
    const reportWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
    if (!reportWindow) return;
    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
    reportWindow.focus();
    reportWindow.print();
  };

  const handleCopyReportSummary = async (report) => {
    const text = [
      `AyuSetu Report ${report.reportId || ''}`.trim(),
      `Dosha: ${report.doshaImbalance || 'N/A'}`,
      `Severity: ${toTitle(report.severityLevel || 'N/A')}`,
      `Urgency: ${toTitle(report.urgency || 'N/A')}`,
      `Specialty: ${report.recommendedSpecialty || 'N/A'}`,
      '',
      ...(report.recommendations || []).map(
        (rec) =>
          `- ${toTitle(rec.symptom)} | Remedy: ${rec.homeRemedy} | Why: ${rec.ayurvedicExplanation}`
      ),
      '',
      `Disclaimer: ${report.disclaimer || ''}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setMessages((previous) => [...previous, textMessage('SYSTEM', 'Report summary copied to clipboard.')]);
    } catch (copyError) {
      setMessages((previous) => [...previous, textMessage('SYSTEM', 'Could not copy report. Please try again.')]);
    }
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diffMs = Math.max(0, now - then);
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min. ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr. ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvailableDateMap = (availability = []) => {
    const map = {};
    availability.forEach((entry) => {
      const date = entry?.date;
      if (!date) return;
      const times = (entry?.slots || [])
        .filter((slot) => slot?.status === 'AVAILABLE')
        .map((slot) => slot.time);
      if (times.length) {
        map[date] = times;
      }
    });
    return map;
  };

  const startConsultationFlow = async (initialSpecialty = 'Any') => {
    if (!isAuthenticated || !isPatient) {
      setMessages((previous) => [
        ...previous,
        textMessage('AI', helperMessage || 'Please sign in as patient to book consultation.'),
      ]);
      return;
    }

    setChatEnded(false);
    setAssessment(createAssessmentState());
    setPrescription(createPrescriptionState());
    setForceQuickActions(false);
    setConsultation((previous) => ({
      ...createConsultationState(),
      active: true,
      loading: true,
      selectedSpecialty: initialSpecialty,
    }));
    setMessages((previous) => [
      ...previous,
      textMessage('AI', 'Let us book your doctor consultation. Step 1: Choose a specialty.'),
    ]);

    try {
      const params = {};
      if (initialSpecialty !== 'Any') params.specialty = initialSpecialty;
      const { data } = await doctorsAPI.list(params);
      const doctors = data?.doctors || [];
      const specialties = [
        'Any',
        ...new Set(doctors.map((doc) => doc?.doctorProfile?.specialty).filter(Boolean)),
      ];

      setConsultation((previous) => ({
        ...previous,
        loading: false,
        doctors,
        specialties,
        step: 'specialty',
      }));
    } catch (doctorError) {
      setConsultation((previous) => ({
        ...previous,
        loading: false,
        error: 'Could not load doctors right now. Please try again.',
      }));
    }
  };

  const handleSelectSpecialty = async (specialty) => {
    setConsultation((previous) => ({
      ...previous,
      loading: true,
      error: '',
      selectedSpecialty: specialty,
      selectedDoctor: null,
      availability: [],
      selectedDate: '',
      selectedTime: '',
    }));

    try {
      const params = specialty && specialty !== 'Any' ? { specialty } : {};
      const { data } = await doctorsAPI.list(params);
      const doctors = data?.doctors || [];
      setConsultation((previous) => ({
        ...previous,
        loading: false,
        doctors,
        step: 'doctor',
        error: doctors.length ? '' : 'No doctors found for this specialty.',
      }));
    } catch (doctorError) {
      setConsultation((previous) => ({
        ...previous,
        loading: false,
        error: 'Could not load doctors for this specialty.',
      }));
    }
  };

  const handleSelectDoctor = async (doctor) => {
    setConsultation((previous) => ({
      ...previous,
      loading: true,
      error: '',
      selectedDoctor: doctor,
      availability: [],
      selectedDate: '',
      selectedTime: '',
    }));

    try {
      const { data } = await doctorsAPI.getAvailability(doctor?._id);
      const availability = data?.availability || [];
      const dateMap = getAvailableDateMap(availability);
      const availableDates = Object.keys(dateMap);
      setConsultation((previous) => ({
        ...previous,
        loading: false,
        availability,
        step: availableDates.length ? 'date' : 'doctor',
        error: availableDates.length
          ? ''
          : 'This doctor has no available slots right now. Please choose another doctor.',
      }));
    } catch (availabilityError) {
      setConsultation((previous) => ({
        ...previous,
        loading: false,
        error: 'Could not load doctor availability right now.',
      }));
    }
  };

  const handleSelectDate = (date) => {
    setConsultation((previous) => ({
      ...previous,
      selectedDate: date,
      selectedTime: '',
      step: 'time',
      error: '',
    }));
  };

  const handleSelectTime = (time) => {
    setConsultation((previous) => ({
      ...previous,
      selectedTime: time,
      step: 'type',
      error: '',
    }));
  };

  const handleSelectConsultationType = (consultationType) => {
    setConsultation((previous) => ({
      ...previous,
      consultationType,
      step: 'summary',
      error: '',
    }));
  };

  const handleContinueFromSummary = () => {
    setConsultation((previous) => ({
      ...previous,
      step: 'confirm',
      error: '',
    }));
  };

  const handleBookFromConsultation = async () => {
    const selectedDoctor = consultation.selectedDoctor;
    if (!selectedDoctor?._id || !consultation.selectedDate || !consultation.selectedTime) {
      setConsultation((previous) => ({
        ...previous,
        error: 'Please complete doctor, date and time selection.',
      }));
      return;
    }

    setConsultation((previous) => ({ ...previous, loading: true, error: '' }));
    try {
      const { data } = await appointmentsAPI.create({
        doctorId: selectedDoctor._id,
        date: consultation.selectedDate,
        time: consultation.selectedTime,
        consultationType: consultation.consultationType,
        symptomSummary: consultation.symptomSummary,
      });

      const appointment = data?.appointment;
      setMessages((previous) => [
        ...previous,
        textMessage(
          'AI',
          `Appointment booked with ${selectedDoctor.fullName} on ${consultation.selectedDate} at ${consultation.selectedTime}.`
        ),
        textMessage(
          'SYSTEM',
          appointment?.meeting?.joinUrl
            ? `Meeting link: ${appointment.meeting.joinUrl}`
            : 'Your booking is confirmed. You can view details in dashboard.'
        ),
      ]);

      setConsultation(createConsultationState());
    } catch (bookingError) {
      const message =
        bookingError?.response?.data?.message ||
        'Could not book appointment. Please try another slot.';
      setConsultation((previous) => ({
        ...previous,
        loading: false,
        error: message,
      }));
      if (bookingError?.response?.status === 409 && selectedDoctor?._id) {
        handleSelectDoctor(selectedDoctor);
      }
    }
  };

  const cancelConsultationFlow = () => {
    setConsultation(createConsultationState());
    setMessages((previous) => [
      ...previous,
      textMessage('SYSTEM', 'Doctor consultation flow canceled. You can start again anytime.'),
    ]);
    setForceQuickActions(true);
  };

  const handleOpenChatHistory = () => {
    setViewMode('history');
  };

  const handleOpenCurrentChat = () => {
    setViewMode('chat');
  };

  const handleSelectSession = (session) => {
    const normalized = normalizeMessages(session?.messages || []);
    setSessionId(session?._id || null);
    setAssistantDisplayName(session?.assistantName || 'AyuBot');
    setMessages(normalized.length ? normalized : baseWelcome);
    setServerHistoryLength((session?.messages || []).length);
    setAssessment(createAssessmentState());
    setConsultation(createConsultationState());
    setPrescription(createPrescriptionState());
    setError('');
    setViewMode('chat');
    setChatEnded(false);
    setSatisfaction('');
    setForceQuickActions(false);
  };

  const handleEndChat = () => {
    setAssessment(createAssessmentState());
    setConsultation(createConsultationState());
    setPrescription(createPrescriptionState());
    setError('');
    setInput('');
    setChatEnded(true);
    setMessages((previous) => [
      ...previous,
      textMessage('SYSTEM', 'Your chat has ended.'),
    ]);
    setForceQuickActions(true);
  };

  const handleAskAnotherQuestion = () => {
    setAssessment(createAssessmentState());
    setConsultation(createConsultationState());
    setPrescription(createPrescriptionState());
    setChatEnded(false);
    setSatisfaction('');
    setMessages((previous) => [
      ...previous,
      textMessage('AI', 'Sure, ask another question. I am here to help.'),
    ]);
    setForceQuickActions(true);
  };

  const handleStartNewChat = async () => {
    if (!isAuthenticated || !isPatient) {
      handleAskAnotherQuestion();
      return;
    }

    try {
      const createResponse = await chatsAPI.create({ channel: 'AI' });
      const newSession = createResponse?.data?.session || null;
      if (newSession?._id) {
        const normalized = normalizeMessages(newSession.messages || []);
        setSessionId(newSession._id);
        setAssistantDisplayName(newSession?.assistantName || assistantDisplayName || 'AyuBot');
        setServerHistoryLength((newSession.messages || []).length);
        setChatSessions((previous) => [newSession, ...previous]);
        setMessages(normalized.length ? normalized : baseWelcome);
      } else {
        setMessages(baseWelcome);
      }
      setChatEnded(false);
      setSatisfaction('');
      setAssessment(createAssessmentState());
      setConsultation(createConsultationState());
      setPrescription(createPrescriptionState());
      setError('');
      setForceQuickActions(true);
    } catch (startError) {
      setError('Could not start a new chat right now. Please try again.');
    }
  };

  const showQuickActions =
    !assessment.active &&
    !consultation.active &&
    !prescription.active &&
    (messages.length <= 8 || chatEnded || forceQuickActions);
  const inputDisabled =
    loading ||
    assessment.generating ||
    assessment.active ||
    consultation.active ||
    prescription.active;

  return (
    <div className="ayu-chatbot" aria-live="polite">
      {isOpen && (
        <section className="ayu-chatbot__panel" role="dialog" aria-label="AI assistant chatbot">
          <header className="ayu-chatbot__header">
            <div className="ayu-chatbot__header-left">
              {viewMode === 'history' ? (
                <button
                  type="button"
                  className="ayu-chatbot__icon-btn"
                  onClick={handleOpenCurrentChat}
                  aria-label="Back to chat"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
              ) : null}
              <div className="ayu-chatbot__brand">
                <div className="ayu-chatbot__brand-icon">A</div>
                <div>
                  <p className="ayu-chatbot__brand-name">{assistantDisplayName || 'AyuBot'}</p>
                  <p className="ayu-chatbot__brand-subtitle">AI Assistant</p>
                </div>
              </div>
            </div>
            <div className="ayu-chatbot__header-actions">
              {viewMode === 'chat' ? (
                <button
                  type="button"
                  className="ayu-chatbot__icon-btn"
                  onClick={handleOpenChatHistory}
                  aria-label="Open chat history"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 8h13v9H8z" />
                    <path d="M3 3h13v9H3z" />
                  </svg>
                </button>
              ) : null}
              <button
                type="button"
                className="ayu-chatbot__close"
                onClick={() => setIsOpen(false)}
                aria-label="Close chatbot"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
          </header>

          <div className="ayu-chatbot__content" ref={chatBodyRef}>
            {viewMode === 'history' ? (
              <section className="ayu-chatbot__history">
                <h3>Your Chats</h3>
                {chatSessions.length === 0 ? (
                  <p className="ayu-chatbot__history-empty">No previous chats yet.</p>
                ) : (
                  chatSessions.map((session) => {
                    const messagesInSession = session?.messages || [];
                    const lastMessage = messagesInSession[messagesInSession.length - 1]?.text || 'Open chat';
                    return (
                      <button
                        key={session?._id}
                        type="button"
                        className="ayu-chatbot__history-item"
                        onClick={() => handleSelectSession(session)}
                      >
                        <div className="ayu-chatbot__history-avatar">A</div>
                        <div className="ayu-chatbot__history-text">
                          <div className="ayu-chatbot__history-row">
                            <strong>AyuBot</strong>
                            <span>{formatRelativeTime(session?.updatedAt)}</span>
                          </div>
                          <p>{lastMessage}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </section>
            ) : (
              <>
            {messages.map((message) => {
              const mine = message.sender === 'PATIENT';
              if (message.kind === 'report') {
                const report = message.report || {};
                return (
                  <article key={message.id} className="ayu-chatbot__bubble ayu-chatbot__bubble--report">
                    <div className="ayu-chatbot__report">
                      <div className="ayu-chatbot__report-top">
                        <div>
                          <h4>Assessment Report</h4>
                          <p className="ayu-chatbot__report-meta">
                            Report ID: <strong>{report.reportId || 'N/A'}</strong>
                          </p>
                        </div>
                        <span className="ayu-chatbot__severity-chip">{toTitle(report.severityLevel || 'moderate')}</span>
                      </div>
                      <div className="ayu-chatbot__report-grid">
                        <div>
                          <p className="ayu-chatbot__report-k">Dosha Imbalance</p>
                          <p className="ayu-chatbot__report-v">{report.doshaImbalance || 'General Imbalance'}</p>
                        </div>
                        <div>
                          <p className="ayu-chatbot__report-k">Urgency</p>
                          <p className="ayu-chatbot__report-v">{toTitle(report.urgency || 'medium')}</p>
                        </div>
                        <div>
                          <p className="ayu-chatbot__report-k">Specialty</p>
                          <p className="ayu-chatbot__report-v">{report.recommendedSpecialty || 'Kayachikitsa'}</p>
                        </div>
                        <div>
                          <p className="ayu-chatbot__report-k">Generated</p>
                          <p className="ayu-chatbot__report-v">{new Date(report.generatedAt || Date.now()).toLocaleString()}</p>
                        </div>
                      </div>

                      {report.highSeverity && (
                        <div className="ayu-chatbot__warning">
                          <strong>
                            Your symptom severity is high. While you can use these home remedies
                            for temporary relief, we strongly advise consulting a doctor
                            immediately.
                          </strong>
                        </div>
                      )}

                      <div className="ayu-chatbot__report-list">
                        {(report.recommendations || []).map((rec) => (
                          <div key={`${message.id}-${rec.symptom}`} className="ayu-chatbot__report-item">
                            <p className="ayu-chatbot__report-symptom">{getSymptomLabel(rec.symptom)}</p>
                            <p><strong>Severity:</strong> {toTitle(rec.severity || 'moderate')}</p>
                            <p><strong>Home Remedy:</strong> {rec.homeRemedy}</p>
                            <p><strong>Ayurvedic Explanation:</strong> {rec.ayurvedicExplanation}</p>
                          </div>
                        ))}
                      </div>

                      <p className="ayu-chatbot__report-disclaimer">
                        <strong>Disclaimer:</strong> {report.disclaimer || 'Consult a doctor for confirmed diagnosis.'}
                      </p>

                      <div className="ayu-chatbot__report-actions">
                        <button
                          type="button"
                          className="ayu-chatbot__report-btn ayu-chatbot__report-btn--soft"
                          onClick={() => handleDownloadReport(report)}
                        >
                          Download Report
                        </button>
                        <button
                          type="button"
                          className="ayu-chatbot__report-btn ayu-chatbot__report-btn--soft"
                          onClick={() => handlePrintReport(report)}
                        >
                          Print / Save PDF
                        </button>
                        <button
                          type="button"
                          className="ayu-chatbot__report-btn ayu-chatbot__report-btn--soft"
                          onClick={() => handleCopyReportSummary(report)}
                        >
                          Copy Summary
                        </button>
                      </div>

                      <button
                        type="button"
                        className="ayu-chatbot__book-btn"
                        onClick={() => handleBookConsultation(report)}
                      >
                        Book Doctor Consultation
                      </button>
                      <span className="ayu-chatbot__time">{formatMessageTime(message.createdAt)}</span>
                    </div>
                  </article>
                );
              }

              return (
                <article
                  key={message.id}
                  className={`ayu-chatbot__bubble ${mine ? 'ayu-chatbot__bubble--mine' : ''}`}
                >
                  <p>{message.text}</p>
                  <span className="ayu-chatbot__time">{formatMessageTime(message.createdAt)}</span>
                </article>
              );
            })}

            {memoryContext?.topSymptoms?.length > 0 && !assessment.active && !consultation.active && !prescription.active && (
              <section className="ayu-chatbot__workflow">
                <div className="ayu-chatbot__workflow-head">
                  <p>Your Health Memory</p>
                  <span>AUTO</span>
                </div>
                <div className="ayu-chatbot__workflow-body">
                  <p>
                    Recurring symptoms: <strong>{memoryContext.topSymptoms.map(getSymptomLabel).join(', ')}</strong>
                  </p>
                  {(memoryContext?.likelyCauses || []).length > 0 && (
                    <p>Possible underlying contributors: {memoryContext.likelyCauses.join(', ')}.</p>
                  )}
                  <p className="ayu-chatbot__workflow-info">
                    This summary is also visible to doctors in appointment case reports.
                  </p>
                </div>
              </section>
            )}

            {assessment.active && (
              <section className="ayu-chatbot__workflow">
                <div className="ayu-chatbot__workflow-head">
                  <p>Symptom Assessment</p>
                  <span>Step {assessment.step} of 4</span>
                </div>

                {assessment.step === 1 && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Select symptoms:</p>
                    <div className="ayu-chatbot__symptom-grid">
                      {symptomCatalog.map((symptom) => {
                        const selected = assessment.selectedSymptoms.includes(symptom.id);
                        return (
                          <button
                            key={symptom.id}
                            type="button"
                            className={`ayu-chatbot__symptom-btn ${selected ? 'is-selected' : ''}`}
                            onClick={() => toggleWorkflowSymptom(symptom.id)}
                          >
                            {symptom.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {assessment.step === 2 && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Choose severity for each symptom:</p>
                    <div className="ayu-chatbot__severity-list">
                      {assessment.selectedSymptoms.map((symptomId) => (
                        <div key={symptomId} className="ayu-chatbot__severity-row">
                          <span>{getSymptomLabel(symptomId)}</span>
                          <div className="ayu-chatbot__severity-buttons">
                            {severityOptions.map((option) => (
                              <button
                                key={`${symptomId}-${option.value}`}
                                type="button"
                                onClick={() => setWorkflowSeverity(symptomId, option.value)}
                                className={
                                  Number(assessment.severityBySymptom[symptomId] || 1) === option.value
                                    ? 'is-selected'
                                    : ''
                                }
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {assessment.step === 3 && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Enter personal details:</p>
                    <div className="ayu-chatbot__details">
                      <input
                        type="number"
                        min="1"
                        placeholder="Age"
                        value={assessment.age}
                        onChange={(event) =>
                          setAssessment((previous) => ({
                            ...previous,
                            age: event.target.value,
                            error: '',
                          }))
                        }
                      />
                      <select
                        value={assessment.gender}
                        onChange={(event) =>
                          setAssessment((previous) => ({
                            ...previous,
                            gender: event.target.value,
                            error: '',
                          }))
                        }
                      >
                        <option value="">Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <textarea
                        placeholder="Lifestyle (diet, sleep, stress)..."
                        value={assessment.lifestyle}
                        onChange={(event) =>
                          setAssessment((previous) => ({
                            ...previous,
                            lifestyle: event.target.value,
                            error: '',
                          }))
                        }
                      />
                    </div>
                  </div>
                )}

                {assessment.step === 4 && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Describe your condition in natural language:</p>
                    <textarea
                      className="ayu-chatbot__description"
                      placeholder="Example: I have severe headache since morning with anxiety and poor sleep."
                      value={assessment.description}
                      onChange={(event) =>
                        setAssessment((previous) => ({
                          ...previous,
                          description: event.target.value,
                          error: '',
                        }))
                      }
                    />
                  </div>
                )}

                {assessment.error && <p className="ayu-chatbot__workflow-error">{assessment.error}</p>}

                <div className="ayu-chatbot__workflow-actions">
                  <button type="button" onClick={cancelAssessment} className="ghost">
                    Cancel
                  </button>
                  {assessment.step > 1 && (
                    <button type="button" onClick={goToPreviousAssessmentStep} className="ghost">
                      Go Back
                    </button>
                  )}
                  {assessment.step < 4 ? (
                    <button type="button" onClick={goToNextAssessmentStep}>
                      Next
                    </button>
                  ) : (
                    <button type="button" onClick={generateAssessmentReport} disabled={assessment.generating}>
                      {assessment.generating ? 'Generating...' : 'Generate Report'}
                    </button>
                  )}
                </div>
              </section>
            )}

            {consultation.active && (
              <section className="ayu-chatbot__workflow">
                <div className="ayu-chatbot__workflow-head">
                  <p>Doctor Consultation</p>
                  <span>{consultation.step.toUpperCase()}</span>
                </div>

                {consultation.loading && <p className="ayu-chatbot__workflow-info">Loading options...</p>}

                {!consultation.loading && consultation.step === 'specialty' && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Choose specialty:</p>
                    <div className="ayu-chatbot__option-grid">
                      {(consultation.specialties.length
                        ? consultation.specialties
                        : ['Any']).map((specialty) => (
                        <button
                          key={specialty}
                          type="button"
                          className={`ayu-chatbot__option-btn ${
                            consultation.selectedSpecialty === specialty ? 'is-selected' : ''
                          }`}
                          onClick={() => handleSelectSpecialty(specialty)}
                        >
                          {specialty}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!consultation.loading && consultation.step === 'doctor' && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Select a doctor:</p>
                    <div className="ayu-chatbot__option-list">
                      {(consultation.doctors || []).map((doctor) => (
                        <button
                          key={doctor?._id}
                          type="button"
                          className="ayu-chatbot__option-btn ayu-chatbot__option-btn--block"
                          onClick={() => handleSelectDoctor(doctor)}
                        >
                          <strong>{doctor?.fullName}</strong>
                          <span>{doctor?.doctorProfile?.specialty || 'Specialist'}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!consultation.loading && consultation.step === 'date' && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Choose date:</p>
                    <div className="ayu-chatbot__option-grid">
                      {Object.keys(getAvailableDateMap(consultation.availability)).map((date) => (
                        <button
                          key={date}
                          type="button"
                          className={`ayu-chatbot__option-btn ${
                            consultation.selectedDate === date ? 'is-selected' : ''
                          }`}
                          onClick={() => handleSelectDate(date)}
                        >
                          {date}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!consultation.loading && consultation.step === 'time' && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Choose time:</p>
                    <div className="ayu-chatbot__option-grid">
                      {(getAvailableDateMap(consultation.availability)[consultation.selectedDate] || []).map((time) => (
                        <button
                          key={time}
                          type="button"
                          className={`ayu-chatbot__option-btn ${
                            consultation.selectedTime === time ? 'is-selected' : ''
                          }`}
                          onClick={() => handleSelectTime(time)}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!consultation.loading && consultation.step === 'type' && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Choose consultation type:</p>
                    <div className="ayu-chatbot__option-grid">
                      {['telemedicine', 'ayurveda', 'followup'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={`ayu-chatbot__option-btn ${
                            consultation.consultationType === type ? 'is-selected' : ''
                          }`}
                          onClick={() => handleSelectConsultationType(type)}
                        >
                          {toTitle(type)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!consultation.loading && consultation.step === 'summary' && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Add symptom summary (optional):</p>
                    <textarea
                      className="ayu-chatbot__description"
                      placeholder="Short note for doctor..."
                      value={consultation.symptomSummary}
                      onChange={(event) =>
                        setConsultation((previous) => ({
                          ...previous,
                          symptomSummary: event.target.value,
                          error: '',
                        }))
                      }
                    />
                    <button type="button" onClick={handleContinueFromSummary}>
                      Continue to Confirm
                    </button>
                  </div>
                )}

                {!consultation.loading && consultation.step === 'confirm' && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Confirm booking details:</p>
                    <div className="ayu-chatbot__confirm">
                      <p><strong>Doctor:</strong> {consultation.selectedDoctor?.fullName}</p>
                      <p><strong>Date:</strong> {consultation.selectedDate}</p>
                      <p><strong>Time:</strong> {consultation.selectedTime}</p>
                      <p><strong>Type:</strong> {toTitle(consultation.consultationType)}</p>
                    </div>
                    <button type="button" onClick={handleBookFromConsultation}>
                      Book Now
                    </button>
                  </div>
                )}

                {consultation.error && <p className="ayu-chatbot__workflow-error">{consultation.error}</p>}

                <div className="ayu-chatbot__workflow-actions">
                  <button type="button" onClick={cancelConsultationFlow} className="ghost">
                    Cancel
                  </button>
                </div>
              </section>
            )}

            {prescription.active && (
              <section className="ayu-chatbot__workflow">
                <div className="ayu-chatbot__workflow-head">
                  <p>Prescription Follow-up</p>
                  <span>{prescription.step.toUpperCase()}</span>
                </div>

                {prescription.step === 'upload' && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>Upload previous prescription/report file:</p>
                    <button
                      type="button"
                      className="ayu-chatbot__option-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={prescription.analyzing}
                    >
                      {prescription.analyzing ? 'Analyzing file...' : 'Choose File'}
                    </button>
                    <p className="ayu-chatbot__workflow-info">
                      Supported text extraction: TXT, CSV, JSON, MD. For PDF/DOC, upload and continue with follow-up text.
                    </p>
                  </div>
                )}

                {prescription.step === 'followup' && (
                  <div className="ayu-chatbot__workflow-body">
                    <p>How are you feeling now?</p>
                    <div className="ayu-chatbot__option-grid">
                      {prescriptionFeelingOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`ayu-chatbot__option-btn ${
                            prescription.currentFeeling === option.value ? 'is-selected' : ''
                          }`}
                          onClick={() =>
                            setPrescription((previous) => ({
                              ...previous,
                              currentFeeling: option.value,
                              error: '',
                            }))
                          }
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="ayu-chatbot__description"
                      placeholder="Describe what you are feeling right now in your own words..."
                      value={prescription.currentFeelingText}
                      onChange={(event) =>
                        setPrescription((previous) => ({
                          ...previous,
                          currentFeelingText: event.target.value,
                          error: '',
                        }))
                      }
                    />
                    {(prescription.followupQuestions || []).length > 1 && (
                      <div className="ayu-chatbot__workflow-info">
                        <strong>Additional follow-up prompts:</strong>{' '}
                        {prescription.followupQuestions.slice(1).join(' ')}
                      </div>
                    )}
                    {(prescription.extractedSymptoms || []).length > 0 && (
                      <p className="ayu-chatbot__workflow-info">
                        Detected from previous file: {prescription.extractedSymptoms.map(getSymptomLabel).join(', ')}
                      </p>
                    )}
                    {!!prescription.extractionMode && (
                      <p className="ayu-chatbot__workflow-info">
                        Extraction mode: {prescription.extractionMode}
                      </p>
                    )}
                    {(prescription.medications || []).length > 0 && (
                      <p className="ayu-chatbot__workflow-info">
                        Medicines mentioned: {prescription.medications.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {prescription.error && <p className="ayu-chatbot__workflow-error">{prescription.error}</p>}

                <div className="ayu-chatbot__workflow-actions">
                  <button type="button" className="ghost" onClick={cancelPrescriptionFlow}>
                    Cancel
                  </button>
                  {prescription.step === 'followup' && (
                    <button
                      type="button"
                      onClick={generatePrescriptionFollowupReport}
                      disabled={prescription.generating}
                    >
                      {prescription.generating ? 'Generating...' : 'Generate Follow-up Report'}
                    </button>
                  )}
                </div>
              </section>
            )}

            {loading && (
              <article className="ayu-chatbot__bubble">
                <div className="ayu-chatbot__typing">
                  <span />
                  <span />
                  <span />
                </div>
              </article>
            )}

            {showQuickActions && (
              <div className="ayu-chatbot__actions">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className="ayu-chatbot__action-btn"
                    onClick={() => {
                      if (action.id === 'assessment') {
                        startAssessmentFlow();
                        return;
                      }
                      if (action.id === 'doctor' || action.id === 'booking') {
                        startConsultationFlow('Any');
                        return;
                      }
                      if (action.id === 'prescription') {
                        startPrescriptionFlow();
                        return;
                      }
                      if (action.id === 'routine') {
                        setMessages((previous) => [
                          ...previous,
                          textMessage(
                            'AI',
                            'Daily routine starter: wake by sunrise, drink warm water, eat freshly cooked meals at fixed times, include 20 minutes of movement, and avoid heavy late-night meals.'
                          ),
                        ]);
                        setForceQuickActions(true);
                        return;
                      }
                      if (action.id === 'assistant_name') {
                        setMessages((previous) => [
                          ...previous,
                          textMessage(
                            'AI',
                            'You can rename me anytime. Example: "Call you Alex". I will continue with that name in future chats.'
                          ),
                        ]);
                        setForceQuickActions(true);
                        return;
                      }
                      if (action.id === 'account') {
                        setMessages((previous) => [
                          ...previous,
                          textMessage(
                            'AI',
                            'For account help, please share your issue (login, profile, password, or appointments). I will guide you step-by-step.'
                          ),
                        ]);
                        return;
                      }
                      postMessage(action.message);
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
            {!assessment.active && (
              <div className="ayu-chatbot__followup-actions">
                <button type="button" className="ayu-chatbot__followup-btn" onClick={handleEndChat}>
                  No, end chat
                </button>
                <button type="button" className="ayu-chatbot__followup-btn" onClick={handleAskAnotherQuestion}>
                  Yes, ask another question
                </button>
              </div>
            )}
            {chatEnded && (
              <section className="ayu-chatbot__end-card">
                <h4>How satisfied were you chatting with AyuBot today?</h4>
                <div className="ayu-chatbot__rating-row">
                  {[
                    { value: 'sad', label: '😟' },
                    { value: 'neutral', label: '😐' },
                    { value: 'happy', label: '🙂' },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`ayu-chatbot__rating-btn ${satisfaction === item.value ? 'is-active' : ''}`}
                      onClick={() => setSatisfaction(item.value)}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
                <p>Your chat has ended. To start a new chat, click below.</p>
                <button type="button" className="ayu-chatbot__new-chat-btn" onClick={handleStartNewChat}>
                  Start New Chat
                </button>
              </section>
            )}
              </>
            )}
          </div>

          <footer className="ayu-chatbot__footer">
            {error && <p className="ayu-chatbot__error">{error}</p>}
            <form onSubmit={handleSubmit} className="ayu-chatbot__form">
              <input
                ref={fileInputRef}
                type="file"
                className="ayu-chatbot__file-input"
                accept=".txt,.md,.json,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                onChange={handlePrescriptionFileChange}
              />
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  assessment.active
                    ? 'Complete assessment steps above...'
                    : prescription.active
                    ? 'Complete prescription steps above...'
                    : 'Ask me anything...'
                }
                disabled={inputDisabled || viewMode === 'history'}
              />
              <button
                type="button"
                className="ayu-chatbot__icon-light"
                aria-label="Attach file"
                onClick={triggerPrescriptionFilePicker}
                disabled={viewMode === 'history' || loading}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 11.5L12.5 20a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 1 1 5.6 5.7l-9.2 9.2a2 2 0 1 1-2.8-2.8l8.5-8.5" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={inputDisabled || viewMode === 'history' || !input.trim()}
                aria-label="Send message"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </form>
            <p className="ayu-chatbot__disclaimer">AI-generated content may be inaccurate.</p>
          </footer>
        </section>
      )}

      <button
        type="button"
        className="ayu-chatbot__launcher"
        onClick={() => setIsOpen((previous) => !previous)}
        aria-label={isOpen ? 'Close chatbot launcher' : 'Open chatbot launcher'}
      >
        {isOpen ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6l-12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
