import jwt from 'jsonwebtoken';

const {
  APNS_KEY_ID,
  APNS_TEAM_ID,
  APNS_BUNDLE_ID,
  APNS_AUTH_KEY,
} = process.env;

export default async function handler(req, res) {
  try {
    const keyIdLength = APNS_KEY_ID?.length || 0;
    const teamIdLength = APNS_TEAM_ID?.length || 0;
    const bundleId = APNS_BUNDLE_ID || 'NOT SET';
    const authKeySet = !!APNS_AUTH_KEY;
    const authKeyLength = APNS_AUTH_KEY?.length || 0;
    const authKeyStart = APNS_AUTH_KEY?.substring(0, 30) || 'NOT SET';
    const authKeyEnd = APNS_AUTH_KEY?.substring(APNS_AUTH_KEY.length - 30) || 'NOT SET';
    
    // Try to parse the key
    let keyParseResult = 'not attempted';
    let jwtResult = 'not attempted';
    
    if (APNS_AUTH_KEY) {
      const processedKey = APNS_AUTH_KEY.replace(/\\n/g, '\n');
      
      try {
        const token = jwt.sign(
          {
            iss: APNS_TEAM_ID,
            iat: Math.floor(Date.now() / 1000),
          },
          processedKey,
          {
            algorithm: 'ES256',
            header: {
              kid: APNS_KEY_ID,
            },
            expiresIn: '45m',
          }
        );
        jwtResult = `Success - token length: ${token.length}`;
      } catch (e) {
        jwtResult = `Error: ${e.message}`;
      }
    }

    return res.status(200).json({
      config: {
        keyIdLength,
        keyIdPreview: APNS_KEY_ID ? `${APNS_KEY_ID.substring(0, 3)}...` : 'NOT SET',
        teamIdLength,
        teamIdPreview: APNS_TEAM_ID ? `${APNS_TEAM_ID.substring(0, 3)}...` : 'NOT SET',
        bundleId,
        authKeySet,
        authKeyLength,
        authKeyStart,
        authKeyEnd,
      },
      jwtResult,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
