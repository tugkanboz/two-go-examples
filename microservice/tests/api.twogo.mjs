// Runs inside the compose network against the service by name.
// BASE_URL is set in docker-compose.test.yml to http://service:8080
import { go, suite, eventually } from "two-go";

const api = go(process.env.BASE_URL);

suite("microservice", ({ test, before }) => {
  // Wait until the service is actually answering before the real tests run.
  // This is a safety net on top of the compose healthcheck gating.
  before(() =>
    eventually(() => api.get("/health").expectOk(), { timeout: 60000, interval: 1000 })
  );

  test("health endpoint is ok", async () => {
    await api.get("/health").expectOk();
  });

  test("GET /users returns a list", async () => {
    await api.get("/users").expectStatus(200).expectJson("data[0].id");
  });

  test("POST /users creates a user", async () => {
    await api.post("/users")
      .json({ name: "Ada", role: "admin" })
      .expectStatus(201)
      .expectJson("name", "Ada");
  });
});
