// Minimal user service with validation, for the data-driven example.
import http from "node:http";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function createServer() {
  const emails = new Set();
  let nextId = 1;

  return http.createServer((req, res) => {
    const json = (status, body) => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };

    if (req.method === "POST" && req.url === "/users") {
      let raw = "";
      req.on("data", (c) => { raw += c; });
      req.on("end", () => {
        let body = {};
        try { body = JSON.parse(raw || "{}"); } catch { return json(400, { error: "invalid JSON" }); }
        if (!body.name) return json(400, { error: "name is required" });
        if (!body.email || !EMAIL.test(body.email)) return json(400, { error: "a valid email is required" });
        if (emails.has(body.email)) return json(409, { error: "email already exists" });
        emails.add(body.email);
        json(201, { id: nextId++, name: body.name, email: body.email });
      });
      return;
    }

    json(404, { error: "not found" });
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createServer().listen(process.env.PORT || 8080);
}
