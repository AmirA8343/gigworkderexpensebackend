function parseServiceAccountJson() {
  const raw =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    '';

  if (!raw.trim()) return null;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed.private_key === 'string') {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch (error) {
    throw new Error('Service account JSON env var is not valid JSON.');
  }
}

function getGoogleClientOptions() {
  const credentials = parseServiceAccountJson();
  if (!credentials) return {};

  return {
    projectId: credentials.project_id,
    credentials,
  };
}

module.exports = {
  getGoogleClientOptions,
  parseServiceAccountJson,
};
