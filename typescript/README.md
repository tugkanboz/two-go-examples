# two-go TypeScript example

A typed example that exercises the type declarations shipped inside the
`two-go` package. It runs fully offline against a tiny in-memory user
service started on a random port (`node:http`, `listen(0)`).

## Types ship with two-go

You do not need a separate `@types/two-go` package. The `.d.ts` files are
bundled with `two-go`, so `import { go, faker } from "two-go"` and
`import type { GoClient, GoResponse } from "two-go"` resolve out of the box
under `"moduleResolution": "NodeNext"`.

## Install

```
npm install
```

## Run the tests

```
npm test
```

This uses the Node.js built-in test runner with `tsx` as the loader:
`node --import tsx --test "*.test.ts"`. No build step is required.

## Type check

```
npm run typecheck
```

This runs `tsc --noEmit` to verify that the typed usage in `app.test.ts`
and `service/server.ts` is sound.

## What it shows

- `go(baseUrl)` typed as `GoClient`.
- Awaiting a `RequestBuilder` yields a `GoResponse` (annotated `res`).
- Queued builder assertions (`expectStatus`) followed by response-only
  assertions (`expectJsonSchema`, `expectCreated`, `expectContentType`).
- `res.expectValue("data[0].id").toBeGreaterThan(0)` and other Jest-style
  matchers.
- Typed `faker` helpers (`faker.fullName()`, `faker.email()`).
- Narrowing `res.get(path)` (which returns `unknown`) into a typed `User`.
