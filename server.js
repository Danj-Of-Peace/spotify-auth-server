import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';
import querystring from 'querystring';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;  // e.g. https://spotify-auth-server-dxij.onrender.com/callback

// Helper to encode basic auth for Spotify
const basicAuth = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

app.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email';
  const authUrl =
    'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      show_dialog: true,
    });
  res.redirect(authUrl);
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).send('Error retrieving access token');
    }

    const access_token = tokenData.access_token;
    const refresh_token = tokenData.refresh_token;

    // Serve HTML that posts the access token back to your frontend
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head><title>Spotify Auth Callback</title></head>
      <body>
        <h2>Login successful</h2>
        <p>You can close this window now.</p>
        <script>
          // Send token to opener window only if it exists
          if (window.opener) {
            window.opener.postMessage(
              { access_token: '${access_token}', refresh_token: '${refresh_token}' },
              'https://throbbers-2025.web.app'
            );
            window.close();
          } else {
            document.body.innerText = 'No window opener found.';
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});