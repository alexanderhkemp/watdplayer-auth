import { sql } from '../../lib/db.js';
import { sendAPNSNotification } from '../../lib/apns.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      title = 'New Episode',
      body: alertBody = 'Check out the latest release.',
      sound = 'default',
      extra = {},
      environment = 'development',
      limit = 50,
    } = body;

    await ensureTable();

    const tokens = await sql`
      SELECT token, environment
      FROM device_tokens
      WHERE environment = ${environment}
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `;

    if (tokens.length === 0) {
      return res.status(200).json({ success: true, sent: 0, message: 'No tokens registered for this environment.' });
    }

    const results = [];
    for (const row of tokens) {
      try {
        const response = await sendAPNSNotification(row.token, {
          title,
          body: alertBody,
          sound,
          extra,
        }, row.environment);

        results.push({
          token: row.token.slice(0, 10) + '…',
          status: response.status,
          body: response.body,
        });
      } catch (error) {
        results.push({
          token: row.token.slice(0, 10) + '…',
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      sent: results.length,
      results,
    });
  } catch (error) {
    console.error('Send notification error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS device_tokens (
      token TEXT PRIMARY KEY,
      environment TEXT NOT NULL,
      platform TEXT NOT NULL,
      app_version TEXT,
      build_number TEXT,
      device_model TEXT,
      system_version TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}
