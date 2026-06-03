// Data-driven (table) tests plus faker-generated payloads.
import { test, before, after } from "node:test";
import { go, faker } from "two-go";
import { createServer } from "./service/server.js";

let server;
let api;

before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  api = go(`http://localhost:${server.address().port}`);
});
after(() => server.close());

// One row per case: input plus the status it should produce.
const cases = [
  { label: "valid user", body: { name: "Ada", email: "ada@example.com" }, status: 201 },
  { label: "missing name", body: { email: "x@example.com" }, status: 400 },
  { label: "invalid email", body: { name: "Bob", email: "nope" }, status: 400 },
  { label: "empty body", body: {}, status: 400 },
];

for (const c of cases) {
  test(`POST /users: ${c.label} -> ${c.status}`, async () => {
    await api.post("/users").json(c.body).expectStatus(c.status);
  });
}

test("faker generated payloads all create users", async () => {
  for (let i = 0; i < 5; i += 1) {
    await api.post("/users")
      .json({ name: faker.fullName(), email: faker.email() })
      .expectStatus(201);
  }
});
