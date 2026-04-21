const path = require('path');
const pdfParse = require('pdf-parse');
const {
  buildSymptomsFromText,
  extractMedicationMentions,
} = require('./patientSymptomMemoryService');

const toUtf8 = (buffer) => {
  try {
    return buffer.toString('utf8');
  } catch (error) {
    return '';
  }
};

const normalizeText = (text = '') =>
  String(text || '')
    .replace(/\u0000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const extractByOpenAIVision = async ({ buffer, mimeType }) => {
  if (!process.env.OPENAI_API_KEY) return '';
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const imageDataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all readable prescription/report text. Return plain text only.',
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();
  return normalizeText(data?.choices?.[0]?.message?.content || '');
};

const extractTextFromUpload = async (file) => {
  const mimeType = String(file?.mimetype || '').toLowerCase();
  const originalName = String(file?.originalname || '').toLowerCase();
  const ext = path.extname(originalName);
  const buffer = file?.buffer;
  if (!buffer?.length) return { text: '', mode: 'NONE' };

  const isTextLike =
    mimeType.startsWith('text/') ||
    mimeType.includes('json') ||
    ['.txt', '.md', '.csv', '.json'].includes(ext);
  if (isTextLike) {
    return { text: normalizeText(toUtf8(buffer)), mode: 'TEXT_DIRECT' };
  }

  const isPdf = mimeType.includes('pdf') || ext === '.pdf';
  if (isPdf) {
    try {
      const parsed = await pdfParse(buffer);
      return { text: normalizeText(parsed?.text || ''), mode: 'PDF_PARSE' };
    } catch (error) {
      return { text: '', mode: 'PDF_PARSE_FAILED' };
    }
  }

  const isImage = mimeType.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
  if (isImage) {
    try {
      const text = await extractByOpenAIVision({ buffer, mimeType: mimeType || 'image/png' });
      return { text, mode: 'IMAGE_VISION' };
    } catch (error) {
      return { text: '', mode: 'IMAGE_VISION_FAILED' };
    }
  }

  const fallback = normalizeText(toUtf8(buffer));
  return { text: fallback, mode: 'FALLBACK_UTF8' };
};

const buildStructuredPrescription = ({ extractedText = '', followupText = '' }) => {
  const merged = normalizeText([extractedText, followupText].filter(Boolean).join(' '));
  const symptoms = buildSymptomsFromText(merged);
  const medications = extractMedicationMentions(merged);
  const followupQuestions = [
    'How are your symptoms today compared to earlier?',
    'Are you facing any new symptoms right now?',
    'Did any medicine or remedy make symptoms better/worse?',
  ];

  return {
    extractedText: merged,
    symptoms,
    medications,
    followupQuestions,
  };
};

module.exports = {
  extractTextFromUpload,
  buildStructuredPrescription,
};

