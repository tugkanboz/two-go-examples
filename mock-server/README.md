# mock-server

This example shows how to isolate a service from an upstream dependency by
mocking the upstream, then driving the service with [two-go](https://www.npmjs.com/package/two-go).

## The scenario

`service/server.js` exposes a small price service:

- `GET /price/:id` looks up a fixed base price for the product id.
- It fetches the current exchange rate from an upstream service located at
  `process.env.UPSTREAM_URL + "/rate"`, which returns `{ rate }`.
- It returns `{ id, price }` where `price = basePrice * rate`.

The upstream location is injected through the `UPSTREAM_URL` environment
variable. That single seam is what makes the service testable in isolation:
the test can point `UPSTREAM_URL` at a mock instead of the real dependency.

## Why mock the upstream?

Testing against a live upstream makes tests slow, flaky, and dependent on
network access and credentials. By starting a local mock upstream we get:

- Determinism: the mock returns exactly the rate we choose, so the computed
  price is predictable.
- Failure injection: we can make the mock return a 500 on demand to verify how
  the service behaves when its dependency is down.
- Offline runs: everything runs on `localhost` with random ports, no secrets.

## What the test does

`price.test.mjs`:

1. Starts a mock upstream (`node:http`, port 0) whose response is controlled
   per test.
2. Sets `process.env.UPSTREAM_URL` to the mock and starts the price service.
3. Healthy path: the mock returns `{ rate: 2 }`, so `GET /price/1` with a base
   price of 10 must return `{ id: "1", price: 20 }`.
4. Failure path: the mock returns a 500. The service catches the upstream
   failure and responds with `502 Bad Gateway` and
   `{ error: "upstream unavailable" }`, so an upstream outage never leaks as a
   misleading 500 from the price service itself.

The `502` choice is deliberate and implemented consistently in the service: a
`5xx` from a dependency is translated into a Bad Gateway, which is the standard
way to say "this service is fine, but something it depends on is not".

## Run it

```
npm install
npm test
```
