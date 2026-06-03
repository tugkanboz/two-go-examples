# two-go with Vitest

This example shows how to drive an HTTP API with [two-go](https://www.npmjs.com/package/two-go) inside [Vitest](https://vitest.dev). Vitest is ESM native, so no transform or extra config is needed.

The test starts a small in-memory user service (`service/server.js`) on a random port, then uses two-go to create users, read them back, and confirm that a missing user returns 404. Everything runs offline.

## Files

- `service/server.js` exports `createServer()`, a zero-dependency `node:http` user service.
- `users.test.mjs` boots the service in `beforeAll`, points two-go at it, and exercises create, get, and missing cases.

## Run

```
npm install
npm test
```

`npm test` runs `vitest run`, which executes the suite once and exits.

## What it demonstrates

- Building requests with the chainable two-go builder: `.json(...)`, queued assertions such as `.expectStatus(...)` and `.expectJson(path, value)`.
- Reading values off a resolved `GoResponse` with `res.get(path)` and `res.expectValue(path)`.
- Deterministic behavior: the service assigns IDs from an incrementing counter, so the tests pass on every run.
