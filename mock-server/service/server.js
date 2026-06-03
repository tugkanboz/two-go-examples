import http from "node:http";

// A tiny price service.
//
// It depends on an UPSTREAM exchange-rate service. For a given product id it
// looks up a fixed base price, fetches the current rate from the upstream,
// multiplies the two, and returns the computed price.
//
// The upstream location is injected through process.env.UPSTREAM_URL so the
// test can point it at a mock instead of the real dependency.

// Fixed base prices keyed by product id. In a real service this would be a
// database lookup; here a small in-memory table keeps the example offline.
const BASE_PRICES = {
  "1": 10,
  "2": 25
};

function sendJson(res, status, payload) {
  const text = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(text)
  });
  res.end(text);
}

async function fetchRate(upstreamUrl) {
  // Throws on any non-2xx upstream response or transport error. The caller
  // turns this into a 502 so upstream problems never leak as a 500.
  const response = await fetch(upstreamUrl + "/rate");
  if (!response.ok) {
    throw new Error("upstream returned status " + response.status);
  }
  const data = await response.json();
  if (typeof data.rate !== "number") {
    throw new Error("upstream returned an invalid rate");
  }
  return data.rate;
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const match = url.pathname.match(/^\/price\/([^/]+)$/);

    if (req.method !== "GET" || !match) {
      sendJson(res, 404, { error: "not found" });
      return;
    }

    const id = match[1];
    const basePrice = BASE_PRICES[id];
    if (basePrice === undefined) {
      sendJson(res, 404, { error: "unknown product" });
      return;
    }

    const upstreamUrl = process.env.UPSTREAM_URL;
    if (!upstreamUrl) {
      sendJson(res, 500, { error: "UPSTREAM_URL is not configured" });
      return;
    }

    try {
      const rate = await fetchRate(upstreamUrl);
      sendJson(res, 200, { id, price: basePrice * rate });
    } catch (err) {
      // The upstream dependency failed. We surface this as 502 Bad Gateway so
      // callers can distinguish "this service is broken" (5xx of our own) from
      // "a dependency this service relies on is broken".
      sendJson(res, 502, { error: "upstream unavailable", detail: err.message });
    }
  });
}
