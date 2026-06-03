// Run with: node --test   (or npm test)
// two-go assertions throw on failure, so the Node test runner reports them as
// normal test failures. No adapter needed.
import { test } from "node:test";
import { go, expect } from "two-go";

const api = go("https://jsonplaceholder.typicode.com");

test("GET /todos/1", async () => {
  await api.get("/todos/1").expectStatus(200).expectJson("id", 1);
});

test("GET /users has ten users", async () => {
  const res = await api.get("/users").expectOk();
  expect(res.get("")).toHaveLength(10);
  res.expectValue("[0].id").toBe(1);
});
