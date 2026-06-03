// Deterministic service for contract testing: the same user shape every time.
import http from "node:http";

export function createServer() {
  const user = {
    id: 1,
    name: "Ada Lovelace",
    email: "ada@example.com",
    active: true,
    roles: ["admin", "user"],
  };
  return http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/user") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify(user));
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(process.env.PORT || 8080);
}
