const axios = require('axios');

const BASE_URL = 'https://api.open-meteo.com/v1';
const coords = { lat: 12.6392, lon: -8.0029 };

async function testMeteo() {
  try {
    console.log(`Calling ${BASE_URL}/forecast...`);
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        latitude: coords.lat,
        longitude: coords.lon,
        daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,weathercode',
        timezone: 'Africa/Bamako',
        forecast_days: 7,
      },
    });

    console.log('✅ Status:', response.status);
    console.log('✅ Data Daily Keys:', Object.keys(response.data.daily));
    
    const { daily } = response.data;
    const previsions = daily.time.map((date, i) => ({
        date,
        tempMax: Math.round(daily.temperature_2m_max[i]),
        tempMin: Math.round(daily.temperature_2m_min[i]),
        precipitation: daily.precipitation_sum[i] || 0,
        vent: Math.round(daily.windspeed_10m_max[i]),
        weathercode: daily.weathercode[i]
    }));
    console.log('✅ Sample Prevision:', previsions[0]);

  } catch (err) {
    console.error('❌ Error:', err.response ? err.response.data : err.message);
  }
}

testMeteo();
