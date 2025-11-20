// Patreon OAuth callback handler
// This receives the OAuth code from Patreon and redirects back to the app

export default async function handler(req, res) {
  const { code, error, error_description } = req.query;

  // Handle OAuth errors
  if (error) {
    console.error('Patreon OAuth error:', error, error_description);
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; text-align: center; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <h1 class="error">Authentication Failed</h1>
          <p>${error_description || 'An error occurred during authentication.'}</p>
          <p>Please close this window and try again.</p>
        </body>
      </html>
    `);
  }

  // No code received
  if (!code) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invalid Request</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Invalid Request</h1>
          <p>No authorization code received.</p>
        </body>
      </html>
    `);
  }

  // Exchange code for access token
  const clientId = process.env.PATREON_CLIENT_ID;
  const clientSecret = process.env.PATREON_CLIENT_SECRET;
  const redirectUri = process.env.PATREON_REDIRECT_URI;

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.patreon.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token } = tokenData;

    // Get user's Patreon identity
    const identityResponse = await fetch('https://www.patreon.com/api/oauth2/v2/identity?include=memberships&fields[user]=email,full_name', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });

    if (!identityResponse.ok) {
      throw new Error('Failed to fetch user identity');
    }

    const identityData = await identityResponse.json();
    
    // Check if user has active membership
    const hasMembership = identityData.included?.some(item => 
      item.type === 'member' && item.attributes?.patron_status === 'active_patron'
    );

    // Redirect back to app with tokens
    const appRedirectUrl = `watdplayer://oauth?` + new URLSearchParams({
      access_token,
      refresh_token,
      is_patron: hasMembership ? 'true' : 'false',
      email: identityData.data.attributes.email,
      name: identityData.data.attributes.full_name,
    });

    // Return HTML that redirects to the app
    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Successful</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              padding: 40px; 
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .success { font-size: 48px; margin-bottom: 20px; }
            h1 { margin: 0 0 10px 0; }
            p { opacity: 0.9; }
            .spinner {
              border: 3px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top: 3px solid white;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
          <script>
            // Attempt to redirect to app
            window.location.href = '${appRedirectUrl}';
            
            // Fallback if redirect doesn't work
            setTimeout(() => {
              document.getElementById('manual').style.display = 'block';
            }, 2000);
          </script>
        </head>
        <body>
          <div class="success">✓</div>
          <h1>Authentication Successful!</h1>
          <p>Redirecting to WATDplayer...</p>
          <div class="spinner"></div>
          <div id="manual" style="display: none;">
            <p>If the app doesn't open automatically, please close this window and return to the app.</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Server Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; text-align: center; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <h1 class="error">Server Error</h1>
          <p>An error occurred while processing your authentication.</p>
          <p>Please close this window and try again.</p>
        </body>
      </html>
    `);
  }
}
