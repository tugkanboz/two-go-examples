// Contract and regression testing with two-go: validate against an explicit
// schema, infer a schema from a golden response, and snapshot the body.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { go, inferSchema, validate, toMatchSnapshot } from "two-go";
import { createServer } from "./service/server.js";

let server;
let api;

before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  api = go(`http://localhost:${server.address().port}`);
});
after(() => server.close());

test("response matches an explicit JSON schema", async () => {
  // expectJsonSchema is a GoResponse method, so assert on the resolved response
  // (the builder only queues the core expect* assertions).
  const res = await api.get("/user").expectStatus(200);
  res.expectJsonSchema({
    type: "object",
    required: ["id", "name", "email", "active"],
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      email: { type: "string", pattern: "@" },
      active: { type: "boolean" },
      roles: { type: "array", items: { type: "string" } },
    },
  });
});

test("an inferred schema validates the response (contract from a golden body)", async () => {
  const res = await api.get("/user").expectOk();
  const schema = inferSchema(res.body); // or res.toSchema()
  const result = validate(res.body, schema);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
});

test("the response matches the committed snapshot", async () => {
  const res = await api.get("/user").expectOk();
  // First run writes __snapshots__/user.json and passes; later runs compare.
  toMatchSnapshot(res.body, "user");
});
