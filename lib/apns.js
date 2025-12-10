import http2 from 'node:http2';
import jwt from 'jsonwebtoken';

const {
  APNS_KEY_ID,
  APNS_TEAM_ID,
  APNS_BUNDLE_ID,
  APNS_AUTH_KEY,
} = process.env;

if (!APNS_KEY_ID || !APNS_TEAM_ID || !APNS_BUNDLE_ID || !APNS_AUTH_KEY) {
  console.warn('⚠️ APNS environment variables are not fully configured. Push sending will fail until they are set.');
}

const authKey = APNS_AUTH_KEY ? APNS_AUTH_KEY.replace(/\\n/g, '\n') : null;

let cachedJwt = null;
let jwtExpiresAt = 0;

function getJwtToken() {
  if (!authKey) {
    throw new Error('APNS_AUTH_KEY is not configured');
  }

  const now = Date.now();
  if (cachedJwt && now < jwtExpiresAt - 30 * 1000) {
    return cachedJwt;
  }

  const token = jwt.sign(
    {
      iss: APNS_TEAM_ID,
      iat: Math.floor(now / 1000),
    },
    authKey,
    {
      algorithm: 'ES256',
      header: {
        kid: APNS_KEY_ID,
      },
      expiresIn: '45m',
    }
  );

  cachedJwt = token;
  jwtExpiresAt = now + 45 * 60 * 1000;
  return token;
}

export async function sendAPNSNotification(deviceToken, payload, environment = 'development') {
  if (!APNS_BUNDLE_ID) {
    throw new Error('APNS_BUNDLE_ID is not configured');
  }

  const host = environment === 'production'
    ? 'api.push.apple.com'
    : 'api.sandbox.push.apple.com';

  const client = http2.connect(`https://${host}`);

  const requestHeaders = {
    ':method': 'POST',
    ':path': `/3/device/${deviceToken}`,
    'apns-topic': APNS_BUNDLE_ID,
    'apns-push-type': payload.pushType || 'alert',
    authorization: `bearer ${getJwtToken()}`,
  };

  const body = JSON.stringify({
    aps: {
      alert: {
        title: payload.title,
        body: payload.body,
      },
      sound: payload.sound || 'default',
      badge: payload.badge,
    },
    extra: payload.extra,
  });

  return new Promise((resolve, reject) => {
    const request = client.request(requestHeaders);
    let responseData = '';
    let status = 0;

    request.on('response', (headers) => {
      status = headers[':status'];
    });

    request.setEncoding('utf8');
    request.on('data', (chunk) => {
      responseData += chunk;
    });

    request.on('end', () => {
      client.close();
      resolve({
        status,
        body: responseData ? safeJsonParse(responseData) : null,
      });
    });

    request.on('error', (error) => {
      client.close();
      reject(error);
    });

    request.end(body);
  });
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
