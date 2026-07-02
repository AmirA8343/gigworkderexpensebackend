const { extractTextFromImage, extractTextFromPdf } = require('./ocr');
const { verifyFirebaseBearerToken } = require('./firebaseAdmin');

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function getBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 12 * 1024 * 1024) {
        reject(new Error('Request body is too large.'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });
    req.on('error', reject);
  });
}

async function handleIncomeOcr(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end('');
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    await verifyFirebaseBearerToken(req);

    const body = await getBody(req);
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
    const fileBase64 = typeof body.fileBase64 === 'string' ? body.fileBase64.trim() : '';
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType.trim().toLowerCase() : '';
    const base64Content = imageBase64 || fileBase64;

    if (!base64Content) {
      sendJson(res, 400, { error: 'imageBase64 or fileBase64 is required' });
      return;
    }

    const text =
      fileBase64 && mimeType === 'application/pdf'
        ? await extractTextFromPdf(fileBase64, mimeType)
        : await extractTextFromImage(base64Content);

    if (!text.trim()) {
      sendJson(res, 422, { error: 'No readable text detected in income file.' });
      return;
    }

    sendJson(res, 200, { text });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    console.error('[income-ocr] failed', error);
    sendJson(res, statusCode, { error: error.message || 'OCR request failed' });
  }
}

module.exports = {
  handleIncomeOcr,
};
