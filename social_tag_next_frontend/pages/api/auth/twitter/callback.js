import { parse } from 'url';

export default function handler(req, res) {
  const { query } = parse(req.url, true);
  const { oauth_token, oauth_verifier } = query;

  // Redirect to your backend server to complete the authentication
  res.redirect(`http://localhost:5000/auth/twitter/callback?oauth_token=${oauth_token}&oauth_verifier=${oauth_verifier}`);
}