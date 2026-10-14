async function loadTest() {
  console.log('Starting load test of 5000 requests (throttled)...');
  const total = 5000;
  const concurrency = 10;

  for (let i = 0; i < total; i += concurrency) {
    const batch = Array.from({ length: Math.min(concurrency, total - i) }, (_, index) =>
      fetch('http://localhost:3000/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: `load-test-${i + index}` }),
      }).catch((err) => console.error(`Request failed:`, err.message))
    );

    await Promise.all(batch);
    console.log(`Submitted requests up to ${i + batch.length}`);

    // Brief pause to prevent overwhelming port-forward
    await new Promise((resolve) => setTimeout(resolve, 505));
  }
  console.log('Load test completed.');
}

loadTest();
