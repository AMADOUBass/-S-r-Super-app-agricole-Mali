const axios = require('axios');
require('dotenv').config();

const API_BASE = 'https://developersandbox-api.flutterwave.com';
const TOKEN_URL = 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token';

async function testFull() {
  console.log('🚀 Starting Full Flutterwave Integration Test...');

  try {
    // 1. Get Token
    const params = new URLSearchParams({
      client_id: process.env.FLUTTERWAVE_CLIENT_ID,
      client_secret: process.env.FLUTTERWAVE_CLIENT_SECRET,
      grant_type: 'client_credentials',
    });
    const tokenRes = await axios.post(TOKEN_URL, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const token = tokenRes.data.access_token;
    console.log('✅ 1. Token Obtained');

    const traceId = 'test-' + Date.now().toString().slice(-8);

    // 2. Create Customer
    console.log('⏳ 2. Creating Customer...');
    let customerId;
    try {
      const custRes = await axios.post(
        `${API_BASE}/customers`,
        {
          name: { first: 'Test', last: 'User' },
          phone: { country_code: '223', number: '60000000' },
          email: `test-${traceId}@soro.ml`,
        },
        { headers: { Authorization: `Bearer ${token}`, 'X-Trace-Id': traceId } }
      );
      customerId = custRes.data.data.id;
      console.log('✅ 2. Customer Created:', customerId);
    } catch (err) {
      console.error('❌ 2. Customer Creation Failed:', err.response?.data || err.message);
      return;
    }

    // 3. Create Payment Method
    console.log('⏳ 3. Creating Payment Method...');
    let paymentMethodId;
    try {
      const pmRes = await axios.post(
        `${API_BASE}/payment-methods`,
        {
          type: 'mobile_money',
          mobile_money: {
            country_code: '233', // Sandbox requires Ghana
            network: 'MTN',
            phone_number: '9012345678',
          },
        },
        { headers: { Authorization: `Bearer ${token}`, 'X-Trace-Id': `pm-${traceId}` } }
      );
      paymentMethodId = pmRes.data.data.id;
      console.log('✅ 3. Payment Method Created:', paymentMethodId);
    } catch (err) {
      console.error('❌ 3. Payment Method Failed:', err.response?.data || err.message);
      return;
    }

    // 4. Charge
    console.log('⏳ 4. Initiating Charge...');
    try {
      const chargeRes = await axios.post(
        `${API_BASE}/charges`,
        {
          reference: 'ref-' + traceId,
          currency: 'GHS',
          customer_id: customerId,
          payment_method_id: paymentMethodId,
          amount: 100,
          redirect_url: 'https://soro.vercel.app/test-status',
          meta: { source: 'soro-test' },
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`, 
            'X-Trace-Id': `chg-${traceId}`,
            'X-Scenario-Key': 'scenario:auth_redirect'
          } 
        }
      );
      console.log('✅ 4. Charge Initiated!');
      console.log('Payment URL:', chargeRes.data.data.next_action?.redirect_url?.url || chargeRes.data.data.redirect_url);
    } catch (err) {
      console.error('❌ 4. Charge Failed:', err.response?.data || err.message);
    }

  } catch (err) {
    console.error('💥 Unexpected Global Error:', err.message);
  }
}

testFull();
