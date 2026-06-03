// Waiting for async work with two-go: pollUntil and eventually.
import { test, before, after } from "node:test";
import { go, pollUntil, eventually } from "two-go";
import { createServer } from "./service/server.js";

let server;
let api;

before(async () => {
  server = createServer();
  await new Promise((r) => server.listen(0, r));
  api = go(`http://localhost:${server.address().port}`);
});
after(() => server.close());

test("pollUntil waits for the job to finish, then returns the response", async () => {
  const started = await api.post("/jobs").expectStatus(201).expectJson("status", "pending");
  const id = started.get("id");

  const done = await pollUntil(
    () => api.get(`/jobs/${id}`),
    (res) => res.get("status") === "done",
    { timeout: 5000, interval: 100, message: "job never finished" }
  );
  done.expectStatus(200).expectJson("status", "done");
});

test("eventually retries the assertion until it passes", async () => {
  const started = await api.post("/jobs");
  const id = started.get("id");

  await eventually(
    () => api.get(`/jobs/${id}`).expectJson("status", "done"),
    { timeout: 5000, interval: 100 }
  );
});
