import { sql } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { targetEnvironment = 'production' } = body;

    const result = await sql`
      UPDATE device_tokens
      SET environment = ${targetEnvironment}, updated_at = NOW()
      RETURNING token
    `;

    return res.status(200).json({
      success: true,
      updated: result.length,
      message: `Updated all tokens to ${targetEnvironment} environment.`,
    });
  } catch (error) {
    console.error('Fix environment error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
