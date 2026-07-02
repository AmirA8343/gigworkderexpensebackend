const { handleIncomeOcr } = require('../src/incomeOcrHandler');

module.exports = async function incomeOcrApi(req, res) {
  await handleIncomeOcr(req, res);
};
