import { neon } from '@neondatabase/serverless';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    
    const result = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE environment = 'development') as development,
        COUNT(*) FILTER (WHERE environment = 'production') as production
      FROM device_tokens
    `;

    return res.status(200).json({
      success: true,
      total: parseInt(result[0].total),
      development: parseInt(result[0].development),
      production: parseInt(result[0].production)
    });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
