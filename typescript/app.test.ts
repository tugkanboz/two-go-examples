// Typed end-to-end test. Run with: node --import tsx --test "*.test.ts".
// Everything resolves against the shipped two-go types: no @types/two-go needed.
import { test, before, after } from "node:test";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";

import { go, faker } from "two-go";
import type { GoClient, GoResponse } from "two-go";

import { createServer } from "./service/server.ts";
import type { User } from "./service/server.ts";

// Typed module-level state shared across the test cases below.
let server: Server;
let api: GoClient;

before(async () => {
  server = createServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as AddressInfo;
  const baseUrl: string = `http://localhost:${address.port}`;
  // go(baseUrl) is typed to return a GoClient.
  api = go(baseUrl);
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("lists users and reads typed values", async () => {
  // Awaiting the builder yields a GoResponse; the annotation documents that.
  const res: GoResponse = await api.get("/users").expectStatus(200);

  // expectValue returns a Jest-style Expectation bound to the resolved value.
  res.expectValue("data[0].id").toBeGreaterThan(0);

  // Extended response-only assertions live on the resolved GoResponse.
  res.expectJsonSchema({
    type: "object",
    properties: {
      data: { type: "array" }
    },
    required: ["data"]
  });
  res.expectJsonLength("data", 2);

  // res.get returns unknown; narrow it before using it as typed data.
  const first = res.get("data[0]") as User;
  res.expectValue("data[0].name").toBe(first.name);
});

test("creates a user with faker data and typed assertions", async () => {
  // faker helpers are fully typed (string / number return types).
  const name: string = faker.fullName();
  const email: string = faker.email();

  const res: GoResponse = await api
    .post("/users")
    .json({ name, email })
    .expectStatus(201);

  res.expectCreated();
  res.expectContentType("application/json");
  res.expectValue("data.id").toBeGreaterThan(0);
  res.expectValue("data.name").toBe(name);
  res.expectValue("data.active").toBe(true);

  const created = res.get("data") as User;
  // Fetch it back by its typed id to prove the round trip.
  const fetched: GoResponse = await api.get(`/users/${created.id}`).expectStatus(200);
  fetched.expectValue("data.email").toBe(email);
});

test("rejects invalid input with a client error", async () => {
  const res: GoResponse = await api.post("/users").json({ name: "" }).expectStatus(400);
  res.expectClientError();
  res.expectValue("error").toBeType("string");
});
