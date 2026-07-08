const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

function getAiConfig() {
  const apiKey = process.env.AI_EXTRACTION_API_KEY || process.env.OPENAI_API_KEY || '';
  const model = process.env.AI_EXTRACTION_MODEL || DEFAULT_MODEL;
  const baseUrl = (process.env.AI_EXTRACTION_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  return {
    apiKey: apiKey.trim(),
    model: model.trim(),
    baseUrl,
  };
}

function normalizeString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeInteger(value) {
  const number = normalizeNumber(value);
  if (number === null) return null;
  return Math.round(number);
}

function normalizeDate(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

function normalizeDocumentType(value) {
  return value === 'tax_statement' || value === 'earnings_summary' ? value : null;
}

function normalizeSummaryType(value) {
  return value === 'daily' || value === 'weekly' || value === 'custom_range' ? value : null;
}

function normalizeDistanceUnit(value) {
  return value === 'mi' || value === 'km' ? value : null;
}

function normalizeStructuredExtraction(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const structured = {
    documentType: normalizeDocumentType(raw.documentType),
    platform: normalizeString(raw.platform),
    amountCents: normalizeInteger(raw.amountCents),
    basePayCents: normalizeInteger(raw.basePayCents),
    tipCents: normalizeInteger(raw.tipCents),
    bonusCents: normalizeInteger(raw.bonusCents),
    tripCount: normalizeInteger(raw.tripCount),
    onlineMinutes: normalizeInteger(raw.onlineMinutes),
    activeMinutes: normalizeInteger(raw.activeMinutes),
    onTripDistance: normalizeNumber(raw.onTripDistance),
    onlineDistance: normalizeNumber(raw.onlineDistance),
    distanceUnit: normalizeDistanceUnit(raw.distanceUnit),
    summaryType: normalizeSummaryType(raw.summaryType),
    periodStartDate: normalizeDate(raw.periodStartDate),
    periodEndDate: normalizeDate(raw.periodEndDate),
    confidence: normalizeNumber(raw.confidence),
    warnings: Array.isArray(raw.warnings)
      ? raw.warnings.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()).slice(0, 5)
      : [],
  };

  if (structured.activeMinutes !== null && structured.onlineMinutes !== null && structured.activeMinutes > structured.onlineMinutes) {
    structured.warnings.push('AI returned active time greater than online time; review imported time fields.');
  }
  if (!structured.distanceUnit) {
    structured.onTripDistance = null;
    structured.onlineDistance = null;
  }

  return structured;
}

function parseJsonFromMessage(message) {
  if (!message || typeof message !== 'string') return null;
  try {
    return JSON.parse(message);
  } catch {
    const match = message.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  }
}

async function extractStructuredIncome(text, context = {}) {
  const { apiKey, model, baseUrl } = getAiConfig();
  if (!apiKey) return null;
  const trimmedText = typeof text === 'string' ? text.trim() : '';
  if (!trimmedText) return null;

  const prompt = [
    'Extract structured gig worker statement fields from OCR text.',
    'Return only JSON. Do not include markdown.',
    'Use null for fields that are not explicitly present. Do not guess.',
    'For tax statements, include mileage if present, but do not convert mileage into income.',
    'For Uber Canada tax summaries, GST/HST, Uber fees, shopping reimbursements, and registration numbers are not income.',
    'amountCents must be gross platform income paid to the worker for the statement period, usually fares/base + tips + bonuses/other income, excluding GST/HST and reimbursements.',
    'onlineMinutes and activeMinutes are time fields only. Do not use mileage as time.',
    'Return fields: documentType, platform, amountCents, basePayCents, tipCents, bonusCents, tripCount, onlineMinutes, activeMinutes, onTripDistance, onlineDistance, distanceUnit, summaryType, periodStartDate, periodEndDate, confidence, warnings.',
  ].join('\n');

  const body = {
    model,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: JSON.stringify({
          fileName: context.fileName || null,
          mimeType: context.mimeType || null,
          ocrText: trimmedText.slice(0, 50000),
        }),
      },
    ],
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    const error = new Error(`AI extraction failed (${response.status}): ${details.slice(0, 500)}`);
    error.statusCode = response.status >= 500 ? 502 : 500;
    throw error;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  return normalizeStructuredExtraction(parseJsonFromMessage(content));
}

module.exports = {
  extractStructuredIncome,
  normalizeStructuredExtraction,
};
