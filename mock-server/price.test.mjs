import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { go } from "two-go";
import { createServer } from "./service/server.js";

// Helper: start any node:http server on a random port and resolve its base URL.
function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve("http://localhost:" + port);
    });
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

// The mock upstream is configurable per test so we can simulate both a healthy
// dependency and a failing one without touching the real exchange-rate service.
let upstreamHandler;
let upstream;
let upstreamUrl;
let service;
let api;

before(async () => {
  // Mock upstream: delegates to whatever upstreamHandler the current test sets.
  upstream = http.createServer((req, res) => upstreamHandler(req, res));
  upstreamUrl = await listen(upstream);

  // Point the price service at the mock instead of the real dependency.
  process.env.UPSTREAM_URL = upstreamUrl;

  service = createServer();
  const baseUrl = await listen(service);
  api = go(baseUrl);
});

after(async () => {
  await close(service);
  await close(upstream);
  delete process.env.UPSTREAM_URL;
});

test("computes price using the mocked upstream rate", async () => {
  // Healthy upstream that always returns a fixed rate of 2.
  upstreamHandler = (req, res) => {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ rate: 2 }));
  };

  // Base price for product 1 is 10, rate is 2, so the price must be 20.
  const res = await api
    .get("/price/1")
    .expectStatus(200)
    .expectJson("id", "1")
    .expectJson("price", 20);

  res.expectJsonSchema({
    type: "object",
    properties: {
      id: { type: "string" },
      price: { type: "number" }
    },
    required: ["id", "price"]
  });
});

test("returns 502 when the upstream dependency fails", async () => {
  // Failing upstream: simulate the exchange-rate service returning a 500.
  upstreamHandler = (req, res) => {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "rate engine down" }));
  };

  const res = await api
    .get("/price/1")
    .expectStatus(502)
    .expectJson("error", "upstream unavailable");

  // The price service stayed up and translated the upstream failure into a
  // 502 Bad Gateway, so the failure is clearly attributable to the dependency.
  assert.equal(res.get("error"), "upstream unavailable");
});
