// A light performance check: fire many requests with bounded concurrency,
// then assert on the p95 latency. Uses two-go's async helpers and utils.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { go, mapLimit, _ } from "two-go";
import { createServer } from "./service/server.js";

let server;
let api;

before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  api = go(`http://localhost:${server.address().port}`);
});
after(() => server.close());

test("p95 latency stays under the budget over 100 requests", async () => {
  const CALLS = 100;
  const CONCURRENCY = 10;
  const BUDGET_MS = 200;

  // mapLimit runs at most CONCURRENCY requests at a time, preserving order.
  const responses = await mapLimit(_.range(CALLS), CONCURRENCY, () =>
    api.get("/ping").expectOk()
  );

  const times = responses.map((r) => r.time).sort((a, b) => a - b);
  const p95 = times[Math.ceil(times.length * 0.95) - 1];
  const max = times[times.length - 1];

  assert.ok(p95 < BUDGET_MS, `p95 was ${p95}ms, budget ${BUDGET_MS}ms`);
  console.log(`p95=${p95}ms max=${max}ms over ${CALLS} calls`);
});
