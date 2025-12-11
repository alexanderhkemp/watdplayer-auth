import { neon } from '@neondatabase/serverless';
import { sendAPNSNotification } from '../../../lib/apns.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, title, body, environment } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (!body) {
    return res.status(400).json({ success: false, error: 'Message body is required' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    
    let tokens;
    if (environment === 'all') {
      tokens = await sql`SELECT token, environment FROM device_tokens`;
    } else {
      tokens = await sql`SELECT token, environment FROM device_tokens WHERE environment = ${environment}`;
    }

    if (tokens.length === 0) {
      return res.status(200).json({
        success: true,
        sent: 0,
        message: 'No devices registered for this environment'
      });
    }

    const results = [];
    
    for (const { token, environment: tokenEnv } of tokens) {
      try {
        const result = await sendAPNSNotification(token, {
          title: title || '',
          body,
          sound: 'default'
        }, tokenEnv);
        
        results.push({
          token: token.substring(0, 10) + '…',
          status: result.status,
          body: result.body
        });
      } catch (err) {
        results.push({
          token: token.substring(0, 10) + '…',
          status: 500,
          error: err.message
        });
      }
    }

    const successCount = results.filter(r => r.status === 200).length;

    return res.status(200).json({
      success: true,
      sent: tokens.length,
      delivered: successCount,
      results
    });
  } catch (error) {
    console.error('Send error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
