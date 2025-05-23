import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());

const client_id = '4595aa31219c4fbabf83fe388bf55682'; // Replace if needed
const client_secret = '69c9de26bf1c48899e5e933f53dd5b90'; // Replace this with your actual Spotify secret
const redirect_uri = 'https://spotify-auth-server-dxij.onrender.com/callback';

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

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri,
    client_id,
    client_secret
  });

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const data = await response.json();

  if (data.access_token) {
    res.send(`<h1>Login successful</h1><p>Access token: ${data.access_token}</p>`);
  } else {
    res.status(400).json(data);
  }
});

app.listen(3000, () => {
  console.log('✅ Server listening at http://127.0.0.1:3000');
});