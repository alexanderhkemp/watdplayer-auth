# WATDplayer Patreon Auth Backend

This is a simple Vercel serverless function that handles Patreon OAuth authentication for the WATDplayer iOS app.

## Setup Instructions

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy to Vercel

```bash
cd watdplayer-auth
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- What's your project's name? **watdplayer-auth**
- In which directory is your code located? **./**
- Want to override the settings? **N**

### 3. Set Environment Variables

After deployment, add these environment variables in the Vercel dashboard:

1. Go to https://vercel.com/your-username/watdplayer-auth/settings/environment-variables
2. Add the following variables:
   - `PATREON_CLIENT_ID`: Your Patreon Client ID
   - `PATREON_CLIENT_SECRET`: Your Patreon Client Secret
   - `PATREON_REDIRECT_URI`: Your Vercel URL + `/patreon/callback` (e.g., `https://watdplayer-auth.vercel.app/patreon/callback`)

### 4. Update Patreon OAuth Settings

Go back to your Patreon OAuth client settings and update:
- **Redirect URIs**: `https://watdplayer-auth.vercel.app/patreon/callback` (use your actual Vercel URL)

### 5. Redeploy

After setting environment variables, redeploy:

```bash
vercel --prod
```

## How It Works

1. User clicks "Login with Patreon" in the app
2. App opens Safari with Patreon OAuth URL
3. User authorizes the app on Patreon
4. Patreon redirects to this Vercel function with an authorization code
5. Function exchanges code for access token
6. Function fetches user's Patreon membership status
7. Function redirects back to app with tokens via custom URL scheme `watdplayer://oauth`

## Testing

Test the callback URL in your browser:
```
https://watdplayer-auth.vercel.app/patreon/callback?code=test
```

You should see an error page (since "test" isn't a valid code), but it confirms the endpoint is working.
