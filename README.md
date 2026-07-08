# GigBalance Backend

Standalone OCR backend for income statement imports.

## Endpoints

- `GET /health`
- `POST /api/income-ocr`

`POST /api/income-ocr` requires a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

Body for screenshots:

```json
{
  "imageBase64": "...",
  "mimeType": "image/jpeg",
  "fileName": "income.jpg"
}
```

Body for PDFs:

```json
{
  "fileBase64": "...",
  "mimeType": "application/pdf",
  "fileName": "weekly-statement.pdf"
}
```

Response:

```json
{
  "text": "...",
  "structured": {
    "documentType": "tax_statement",
    "platform": "Uber Eats",
    "amountCents": 136487,
    "basePayCents": 87724,
    "tipCents": 48463,
    "bonusCents": 300,
    "tripCount": null,
    "onlineMinutes": null,
    "activeMinutes": null,
    "onTripDistance": 275,
    "onlineDistance": 275,
    "distanceUnit": "km",
    "summaryType": "custom_range",
    "periodStartDate": "2026-01-01",
    "periodEndDate": "2026-01-31",
    "confidence": 0.9,
    "warnings": []
  },
  "structuredError": null
}
```

## Environment

Use one of these credential options:

- `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

Both should contain the full Google service-account JSON. The same service account must have Firebase Admin access and Google Cloud Vision API access.

Optional:

- `PORT=3000`
- `MAX_PDF_PAGES=5`
- `AI_EXTRACTION_API_KEY` or `OPENAI_API_KEY`
- `AI_EXTRACTION_MODEL=gpt-4o-mini`
- `AI_EXTRACTION_BASE_URL=https://api.openai.com/v1`

AI extraction is optional. If no AI key is configured, the endpoint still returns OCR text and the mobile app falls back to its local parser. The base URL uses an OpenAI-compatible `/chat/completions` endpoint, so other providers can be used if they support that contract.

## Local Run

```bash
cd backend
npm install
npm run dev
```

Set the mobile app env var to:

```bash
EXPO_PUBLIC_INCOME_OCR_URL=http://localhost:3000/api/income-ocr
```

For a physical phone, use your Mac LAN IP instead of `localhost`.

## Railway

Deploy this `backend` directory as the service root.

Start command:

```bash
npm start
```

Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `FIREBASE_SERVICE_ACCOUNT_JSON` in Railway variables.

## Vercel

Deploy this `backend` directory as the project root. Vercel will expose:

```text
/api/income-ocr
```

Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `FIREBASE_SERVICE_ACCOUNT_JSON` in Vercel environment variables.

If you are importing the full repo in Vercel, set **Root Directory** to `backend`.
