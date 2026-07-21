async function testOverpassWithUserAgent() {
  console.log('--- TESTING OVERPASS API WITH USER-AGENT ---');

  const lat = 38.4192; // Izmir
  const lon = 27.1287;
  const query = `[out:json][timeout:15];(node["amenity"="hospital"](around:10000,${lat},${lon});way["amenity"="hospital"](around:10000,${lat},${lon}););out center;`;

  // Test 1: Without User-Agent
  try {
    const r1 = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    console.log('Without User-Agent status:', r1.status);
  } catch (e) {
    console.error('Err 1:', e.message);
  }

  // Test 2: WITH User-Agent
  try {
    const r2 = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'SafeQuakeApp/1.0 (https://safequake.app)',
      },
      body: `data=${encodeURIComponent(query)}`,
    });
    console.log('WITH User-Agent status:', r2.status);
    if (r2.ok) {
      const data = await r2.json();
      console.log('Found places count:', data?.elements?.length);
      console.log('First place:', data?.elements?.[0]?.tags?.name);
    }
  } catch (e) {
    console.error('Err 2:', e.message);
  }
}

testOverpassWithUserAgent();
