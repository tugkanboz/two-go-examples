# two-go with Mocha

This example shows how to use [two-go](https://www.npmjs.com/package/two-go)
inside [Mocha](https://mochajs.org/) as an ESM project (`.mjs` test files).

The test suite starts a tiny in-memory user service (plain `node:http`, no
external dependencies) on a random port, then drives it with two-go. Everything
runs offline and is deterministic.

## Layout

- `service/server.js` exports `createServer()`, an in-memory user service.
- `test/users.test.mjs` is the Mocha suite. It covers create, get, and a
  missing-user (404) case.

## Run

```sh
npm install
npm test
```

`npm test` runs `mocha "test/**/*.test.mjs"`.

## How it works

- `before` starts the service on port 0 (the OS picks a free port) and builds a
  two-go client with `go("http://localhost:<port>")`.
- `after` closes the server.
- Each `it` block sends a request through the chainable builder and queues
  builder-level assertions (`expectStatus`, `expectJson`, `expectOk`).
- Extended assertions such as `expectJsonSchema`, `expectClientError`, and
  `expectValue(path)` are called on the resolved `GoResponse` after `await`.
