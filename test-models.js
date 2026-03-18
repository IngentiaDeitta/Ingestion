const API_KEY = 'AIzaSyC2ATvkAO3VrJWUisGvKlkZZ7GTlekP5_U';
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

async function testModel(modelName) {
  console.log(`Testing model: ${modelName}...`);
  try {
    const response = await fetch(`${BASE_URL}/${modelName}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with "OK" if you can hear me.' }] }]
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`[PASS] ${modelName}: OK`);
      return true;
    } else {
      console.log(`[FAIL] ${modelName}: ${response.status} - ${data.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (err) {
    console.log(`[ERROR] ${modelName}: ${err.message}`);
    return false;
  }
}

async function runTests() {
  await testModel('gemini-2.0-flash'); // Expect fail
  await testModel('gemini-1.5-flash');
  await testModel('gemini-3.1-flash-lite-preview');
  await testModel('gemini-3.1-pro-preview');
}

runTests();
