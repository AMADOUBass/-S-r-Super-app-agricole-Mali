const axios = require('axios');
require('dotenv').config();

const TOKEN_URL = 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token';

async function test() {
  console.log('Testing Flutterwave Connection...');
  console.log('Client ID:', process.env.FLUTTERWAVE_CLIENT_ID);
  
  const params = new URLSearchParams({
    client_id: process.env.FLUTTERWAVE_CLIENT_ID,
    client_secret: process.env.FLUTTERWAVE_CLIENT_SECRET,
    grant_type: 'client_credentials',
  });

  try {
    const res = await axios.post(TOKEN_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    console.log('✅ Token received successfully!');
    console.log('Token (first 10 chars):', res.data.access_token.substring(0, 10));
  } catch (err) {
    console.error('❌ Failed to get token:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

test();
