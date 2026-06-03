// Run with: npx two-go   (or npm test)
// The built-in CLI discovers every *.twogo.mjs file and runs the suites.
import { go, suite } from "two-go";

const api = go("https://jsonplaceholder.typicode.com");

suite("jsonplaceholder", ({ test }) => {
  test("GET /todos/1 returns the first todo", async () => {
    await api.get("/todos/1")
      .expectStatus(200)
      .expectHeader("content-type", /json/)
      .expectJson("id", 1)
      .expectJson("userId", 1);
  });

  test("GET /users returns a list", async () => {
    await api.get("/users")
      .expectOk()
      .expectJson("[0].id", 1)
      .expectJson("", (users) => users.length === 10);
  });

  test("POST /posts echoes the created resource", async () => {
    await api.post("/posts")
      .json({ title: "hello", body: "from two-go", userId: 1 })
      .expectStatus(201)
      .expectJson("title", "hello");
  });
});
