// BDD scenarios for the user service, run with: node --test (or npm test).
// The service is started in process on a random port, so there is nothing to
// set up. Each endpoint has a success path plus validation and edge cases.
import { before, after } from "node:test";
import { go } from "two-go";
import { createServer } from "./service/server.js";
import { feature, scenario, given, when, then, and } from "./bdd.mjs";

let server;
let api;
const client = () => api;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  api = go(`http://localhost:${server.address().port}`);
});

after(() => server.close());

// A unique email per scenario keeps the in-memory store from colliding.
let seq = 0;
const uniqueEmail = () => `user${seq++}@example.com`;

feature("POST /users", () => {
  scenario("creates a user with valid data", [
    given("a valid user payload", (w) => {
      w.payload = { name: "Ada", email: uniqueEmail(), role: "admin" };
    }),
    when("the user is created", async (w) => {
      w.res = await client().post("/users").json(w.payload);
    }),
    then("the response is 201 Created", (w) => w.res.expectStatus(201)),
    and("the body echoes the name and email", (w) =>
      w.res.expectJson("name", "Ada").expectJson("email", w.payload.email)),
    and("an id was assigned", (w) => w.res.expectValue("id").toBeGreaterThan(0)),
  ]);

  scenario("rejects a missing name", [
    given("a payload with no name", (w) => {
      w.payload = { email: uniqueEmail() };
    }),
    when("the user is created", async (w) => {
      w.res = await client().post("/users").json(w.payload);
    }),
    then("the response is 400", (w) => w.res.expectStatus(400)),
    and("the error explains the missing name", (w) =>
      w.res.expectJson("error", "name is required")),
  ]);

  scenario("rejects an invalid email", [
    given("a payload with a malformed email", (w) => {
      w.payload = { name: "Bob", email: "not-an-email" };
    }),
    when("the user is created", async (w) => {
      w.res = await client().post("/users").json(w.payload);
    }),
    then("the response is 400", (w) => w.res.expectStatus(400)),
    and("the error explains the invalid email", (w) =>
      w.res.expectJson("error", "email is invalid")),
  ]);

  scenario("rejects a duplicate email", [
    given("an email that is already used", async (w) => {
      w.email = uniqueEmail();
      await client().post("/users").json({ name: "First", email: w.email }).expectStatus(201);
    }),
    when("a second user uses the same email", async (w) => {
      w.res = await client().post("/users").json({ name: "Second", email: w.email });
    }),
    then("the response is 409 Conflict", (w) => w.res.expectStatus(409)),
    and("the error explains the conflict", (w) =>
      w.res.expectJson("error", "email already exists")),
  ]);
});

feature("GET /users", () => {
  scenario("lists users with a matching count", [
    given("at least one user exists", async () => {
      await client().post("/users").json({ name: "Listed", email: uniqueEmail() }).expectStatus(201);
    }),
    when("the list is fetched", async (w) => {
      w.res = await client().get("/users");
    }),
    then("the response is 200", (w) => w.res.expectOk()),
    and("count matches the number of returned users", (w) =>
      w.res.check("count matches data length", (r) => r.get("count") === r.get("data").length)),
  ]);
});

feature("GET /users/:id", () => {
  scenario("returns an existing user", [
    given("a created user", async (w) => {
      const created = await client().post("/users").json({ name: "Grace", email: uniqueEmail() });
      w.id = created.get("id");
    }),
    when("that user is fetched by id", async (w) => {
      w.res = await client().get(`/users/${w.id}`);
    }),
    then("the response is 200", (w) => w.res.expectStatus(200)),
    and("the returned id matches", (w) => w.res.expectJson("id", w.id)),
  ]);

  scenario("returns 400 for a non numeric id", [
    when("an id that is not a number is requested", async (w) => {
      w.res = await client().get("/users/abc");
    }),
    then("the response is 400", (w) => w.res.expectStatus(400)),
    and("the error explains the bad id", (w) => w.res.expectJson("error", "id must be a number")),
  ]);

  scenario("returns 404 for an unknown id", [
    when("a missing id is requested", async (w) => {
      w.res = await client().get("/users/999999");
    }),
    then("the response is 404", (w) => w.res.expectStatus(404)),
    and("the error says not found", (w) => w.res.expectJson("error", "user not found")),
  ]);
});

feature("DELETE /users/:id", () => {
  scenario("deletes an existing user", [
    given("a created user", async (w) => {
      const created = await client().post("/users").json({ name: "Temp", email: uniqueEmail() });
      w.id = created.get("id");
    }),
    when("the user is deleted", async (w) => {
      w.res = await client().delete(`/users/${w.id}`);
    }),
    then("the response is 204 No Content", (w) => w.res.expectStatus(204)),
    and("the user can no longer be fetched", async (w) => {
      await client().get(`/users/${w.id}`).expectStatus(404);
    }),
  ]);

  scenario("returns 404 when deleting an unknown id", [
    when("a missing id is deleted", async (w) => {
      w.res = await client().delete("/users/999999");
    }),
    then("the response is 404", (w) => w.res.expectStatus(404)),
  ]);

  scenario("returns 400 when deleting a non numeric id", [
    when("a non numeric id is deleted", async (w) => {
      w.res = await client().delete("/users/xyz");
    }),
    then("the response is 400", (w) => w.res.expectStatus(400)),
  ]);
});
