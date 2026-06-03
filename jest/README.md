# two-go with Jest (ESM)

This example shows how to use the `two-go` API testing library inside Jest
with native ES modules. The tests run fully offline against a tiny in-memory
user service that the test suite starts on a random port.

## Run

```
npm install
npm test
```

## What it does

- `service/server.js` exports `createServer()`, a zero-dependency `node:http`
  user service (`POST /users`, `GET /users`, `GET /users/:id`).
- `users.test.js` starts that server on port 0, builds a `two-go` client
  pointed at the assigned port, and covers a 201 create, a 200 fetch, and a
  404 for a missing user.

## ESM note

Jest needs the experimental VM modules flag to run native ES modules. The
`test` script sets it for you via `cross-env`:

```
cross-env NODE_OPTIONS=--experimental-vm-modules jest
```

The project is ESM (`"type": "module"`) and requires Node 18 or newer.
