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
  "text": "..."
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
