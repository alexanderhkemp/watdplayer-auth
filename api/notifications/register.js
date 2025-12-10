import { sql } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      token,
      environment = 'development',
      platform = 'ios',
      appVersion = 'unknown',
      buildNumber = 'unknown',
      deviceModel = 'unknown',
      systemVersion = 'unknown',
    } = body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid token' });
    }

    await ensureTable();

    await sql`
      INSERT INTO device_tokens (token, environment, platform, app_version, build_number, device_model, system_version, updated_at)
      VALUES (${token}, ${environment}, ${platform}, ${appVersion}, ${buildNumber}, ${deviceModel}, ${systemVersion}, NOW())
      ON CONFLICT (token) DO UPDATE SET
        environment = EXCLUDED.environment,
        platform = EXCLUDED.platform,
        app_version = EXCLUDED.app_version,
        build_number = EXCLUDED.build_number,
        device_model = EXCLUDED.device_model,
        system_version = EXCLUDED.system_version,
        updated_at = NOW();
    `;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Device registration error:', error);
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
