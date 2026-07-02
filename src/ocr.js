const vision = require('@google-cloud/vision');
const { getGoogleClientOptions } = require('./credentials');

const visionClient = new vision.ImageAnnotatorClient(getGoogleClientOptions());

function collectTextFromImageResult(result) {
  return result?.fullTextAnnotation?.text || result?.textAnnotations?.[0]?.description || '';
}

function getMaxPdfPages() {
  const configured = Number.parseInt(process.env.MAX_PDF_PAGES || '5', 10);
  const max = Number.isFinite(configured) && configured > 0 ? configured : 5;
  return Math.min(max, 20);
}

async function extractTextFromPdf(fileBase64, mimeType) {
  const pages = Array.from({ length: getMaxPdfPages() }, (_, index) => index + 1);
  const [result] = await visionClient.batchAnnotateFiles({
    requests: [
      {
        inputConfig: {
          content: fileBase64,
          mimeType,
        },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
        pages,
      },
    ],
  });

  const fileResponse = result.responses?.[0];
  if (fileResponse?.error?.message) {
    throw new Error(fileResponse.error.message);
  }

  return (fileResponse?.responses || [])
    .map((page) => {
      if (page?.error?.message) {
        throw new Error(page.error.message);
      }
      return collectTextFromImageResult(page);
    })
    .filter((text) => text.trim().length > 0)
    .join('\n');
}

async function extractTextFromImage(imageBase64) {
  const [result] = await visionClient.documentTextDetection({
    image: { content: imageBase64 },
    imageContext: { languageHints: ['en'] },
  });

  if (result.error?.message) {
    throw new Error(result.error.message);
  }

  return collectTextFromImageResult(result);
}

module.exports = {
  extractTextFromImage,
  extractTextFromPdf,
};
