import { beforeAll, afterAll, test } from "@jest/globals";
import { go } from "two-go";
import { createServer } from "./service/server.js";

let server;
let api;

beforeAll(async () => {
  server = createServer();
  // Listen on port 0 so the OS assigns a free random port.
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  api = go(`http://localhost:${port}`);
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("creates a user and returns 201", async () => {
  const res = await api
    .post("/users")
    .json({ name: "Ada Lovelace", email: "ada@example.com" })
    .expectStatus(201)
    .expectJson("name", "Ada Lovelace")
    .expectJson("email", "ada@example.com");

  // Extended assertions run on the resolved GoResponse. expectJsonSchema takes
  // a JSON schema (type/properties/required), not a field-to-type map.
  res.expectJsonSchema({
    type: "object",
    required: ["id", "name", "email"],
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      email: { type: "string" }
    }
  });
});

test("gets an existing user and returns 200", async () => {
  const created = await api
    .post("/users")
    .json({ name: "Alan Turing", email: "alan@example.com" })
    .expectStatus(201);

  const id = created.get("id");

  const res = await api
    .get(`/users/${id}`)
    .expectStatus(200)
    .expectOk()
    .expectJson("id", id)
    .expectJson("name", "Alan Turing");

  res.expectValue("email").toBe("alan@example.com");
});

test("returns 404 for a missing user", async () => {
  const res = await api
    .get("/users/999999")
    .expectStatus(404)
    .expectJson("error", "user not found");

  res.expectValue("error").toContain("not found");
});
