// Mocha test suite driving the in-memory user service with two-go.
// Run with: npm test
import assert from "node:assert/strict";
import { go } from "two-go";
import { createServer } from "../service/server.js";

describe("users API (two-go + Mocha)", () => {
  let server;
  let api;

  before(async () => {
    server = createServer();
    // Listen on port 0 so the OS assigns a free random port.
    await new Promise((resolve) => server.listen(0, resolve));
    const { port } = server.address();
    api = go(`http://localhost:${port}`);
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it("creates a user", async () => {
    const res = await api
      .post("/users")
      .json({ name: "Ada Lovelace", email: "ada@example.com" })
      .expectStatus(201)
      .expectJson("name", "Ada Lovelace")
      .expectJson("email", "ada@example.com");

    // Extended assertions live on the resolved GoResponse, not the builder.
    res.expectJsonSchema({
      id: "number",
      name: "string",
      email: "string"
    });

    const id = res.get("id");
    assert.ok(Number.isInteger(id), "created user should have an integer id");
  });

  it("gets an existing user", async () => {
    // First create one, then read it back by id.
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

  it("returns 404 for a missing user", async () => {
    const res = await api
      .get("/users/999999")
      .expectStatus(404)
      .expectJson("error", "user not found");

    res.expectClientError();
  });
});
