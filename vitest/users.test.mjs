import { describe, it, beforeAll, afterAll } from "vitest";
import { go } from "two-go";
import { createServer } from "./service/server.js";

let server;
let api;

beforeAll(async () => {
  server = createServer();
  // Port 0 lets the OS pick a free random port, so the example never collides.
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  api = go(`http://localhost:${port}`);
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("user service", () => {
  it("creates a user", async () => {
    const res = await api
      .post("/users")
      .json({ name: "Ada Lovelace", email: "ada@example.com" })
      .expectStatus(201)
      .expectJson("name", "Ada Lovelace");

    // Extended assertions live on the resolved response.
    res.expectValue("id").toBeGreaterThan(0);
    res.expectValue("email").toBe("ada@example.com");
  });

  it("gets a user that was just created", async () => {
    const created = await api
      .post("/users")
      .json({ name: "Alan Turing" })
      .expectStatus(201);

    const id = created.get("id");

    const res = await api
      .get(`/users/${id}`)
      .expectStatus(200)
      .expectJson("id", id)
      .expectJson("name", "Alan Turing");

    res.expectValue("name").toBe("Alan Turing");
  });

  it("returns 404 for a missing user", async () => {
    const res = await api
      .get("/users/999999")
      .expectStatus(404)
      .expectJson("error", "not_found");

    res.expectValue("error").toBe("not_found");
  });
});
