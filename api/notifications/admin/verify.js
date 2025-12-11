const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }

  if (password === ADMIN_PASSWORD) {
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ success: false, error: 'Invalid password' });
}
