const baseUrl = process.env.LOAD_TEST_URL ?? "http://localhost:3000/api/health";
const total = Number(process.env.LOAD_TEST_REQUESTS ?? 50);
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY ?? 10);
let next = 0;
let failures = 0;

async function worker() {
  while (true) {
    const index = next++;
    if (index >= total) return;
    try {
      const response = await fetch(baseUrl);
      if (!response.ok) failures += 1;
    } catch {
      failures += 1;
    }
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker));
console.log(
  JSON.stringify({ url: baseUrl, requests: total, concurrency, failures }),
);
if (failures > 0) process.exitCode = 1;

