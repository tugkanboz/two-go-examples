// A fast endpoint to measure against.
import http from "node:http";

export function createServer() {
  return http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/ping") {
      res.writeHead(200, { "content-type": "application/json" });
      return res.end(JSON.stringify({ ok: true }));
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "not found" }));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(process.env.PORT || 8080);
}
