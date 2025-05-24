import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

const client_id = '4595aa31219c4fbabf83fe388bf55682'; // ✅ Your actual Spotify Client ID
const client_secret = '69c9de26bf1c48899e5e933f53dd5b90';             // 🔁 Replace with your actual secret
const redirect_uri = 'https://spotify-auth-server-dxij.onrender.com/callback'; // ✅ Must match Spotify dashboard

// STEP 1: Redirect to Spotify login
app.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email';
  const authUrl = 'https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id,
      scope,
      redirect_uri
    });

  res.redirect(authUrl);
});

// STEP 2: Spotify redirects back to this /callback endpoint with ?code=
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    client_id,
    client_secret
  });

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });

    const data = await response.json();

    if (data.access_token) {
      // ✅ Redirect to Firebase app with access token in URL hash
      const frontendUrl = `https://throbbers-2025.web.app/host.html#access_token=${data.access_token}`;
      res.redirect(frontendUrl);
    } else {
      res.status(400).json({ error: 'Failed to get access token', details: data });
    }

  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).send('Server error');
  }
});

app.listen(3000, () => {
  console.log('✅ Server listening at http://127.0.0.1:3000');
});