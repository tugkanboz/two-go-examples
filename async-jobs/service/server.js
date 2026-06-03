// Simulates an async job: POST /jobs starts one, GET /jobs/:id reports
// "pending" until a short time has passed, then "done".
import http from "node:http";

const READY_AFTER_MS = 250;

export function createServer() {
  const jobs = new Map(); // id -> startedAt
  let nextId = 1;

  return http.createServer((req, res) => {
    const json = (status, body) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (req.method === "POST" && req.url === "/jobs") {
      const id = nextId++;
      jobs.set(id, Date.now());
      return json(201, { id, status: "pending" });
    }

    const match = req.url.match(/^\/jobs\/(\d+)$/);
    if (req.method === "GET" && match) {
      const id = Number(match[1]);
      if (!jobs.has(id)) return json(404, { error: "job not found" });
      const status = Date.now() - jobs.get(id) >= READY_AFTER_MS ? "done" : "pending";
      return json(200, { id, status });
    }

    json(404, { error: "not found" });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(process.env.PORT || 8080);
}
