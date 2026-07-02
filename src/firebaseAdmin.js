const admin = require('firebase-admin');
const { parseServiceAccountJson } = require('./credentials');

function getFirebaseAdmin() {
  if (admin.apps.length) return admin;

  const credentials = parseServiceAccountJson();
  if (credentials) {
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
      projectId: credentials.project_id,
    });
    return admin;
  }

  admin.initializeApp();
  return admin;
}

async function verifyFirebaseBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    const error = new Error('Missing bearer token');
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    const error = new Error('Invalid bearer token');
    error.statusCode = 401;
    throw error;
  }

  return getFirebaseAdmin().auth().verifyIdToken(token);
}

module.exports = {
  getFirebaseAdmin,
  verifyFirebaseBearerToken,
};
