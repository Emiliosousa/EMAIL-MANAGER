// gmail.js
const { google } = require('googleapis');
require('dotenv').config();

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// 🔗 Paso 1: generar la URL para iniciar sesión
function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

// 🔐 Paso 2: intercambiar código por tokens
async function getTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

// 📬 Leer mensajes recientes
async function listRecentEmails(auth, max = 5) {
  const gmail = google.gmail({ version: 'v1', auth });
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults: max,
  });

  const messages = res.data.messages || [];
  const fullMessages = await Promise.all(
    messages.map(async (msg) =>
      gmail.users.messages.get({ userId: 'me', id: msg.id })
    )
  );

  return fullMessages.map((msg) => ({
    id: msg.data.id,
    snippet: msg.data.snippet,
  }));
}
// ✉️ Enviar correo con Gmail API
async function sendGmailMessage(auth, to, subject, text) {
  const gmail = google.gmail({ version: 'v1', auth });

  const rawMessage = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\n\r\n${text}`
  )
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: rawMessage,
    },
  });
}

module.exports = {
  oauth2Client,
  getAuthUrl,
  getTokens,
  listRecentEmails,
  sendGmailMessage,
};



