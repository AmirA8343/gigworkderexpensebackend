require('dotenv/config');

const cors = require('cors');
const express = require('express');
const { handleIncomeOcr } = require('./incomeOcrHandler');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '12mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post('/api/income-ocr', handleIncomeOcr);
app.options('/api/income-ocr', handleIncomeOcr);

app.listen(port, () => {
  console.log(`GigBalance backend listening on port ${port}`);
});
