const API_KEY = 'AIzaSyAEmipk6r38v9em5VGoW5Gy2WEDRY6GrJU';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function verifyKey() {
  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with "OK" if you can hear me.' }] }]
      })
    });

    if (!response.ok) {
        const data = await response.json();
        console.error('Error:', response.status, data);
        process.exit(1);
    }

    const data = await response.json();
    console.log('Success!', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
    process.exit(1);
  }
}

verifyKey();
