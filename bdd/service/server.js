// A small in-memory user service with input validation, so the BDD suite has
// real success, validation, and edge cases to cover. Plain Node http, no deps,
// no database. Exported as createServer() so tests can start it in process.
import http from "node:http";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function send(res, status, body) {
  if (body === undefined) {
    res.writeHead(status);
    return res.end();
  }
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(raw || "{}"));
      } catch {
        resolve(null); // signal malformed JSON
      }
    });
  });
}

export function createServer() {
  const users = [];
  let nextId = 1;

  return http.createServer(async (req, res) => {
    const { method, url } = req;

    if (method === "POST" && url === "/users") {
      const body = await readJson(req);
      if (body === null) return send(res, 400, { error: "invalid JSON body" });
      if (!body.name || typeof body.name !== "string") {
        return send(res, 400, { error: "name is required" });
      }
      if (!body.email) return send(res, 400, { error: "email is required" });
      if (!EMAIL.test(body.email)) return send(res, 400, { error: "email is invalid" });
      if (users.some((u) => u.email === body.email)) {
        return send(res, 409, { error: "email already exists" });
      }
      const user = { id: nextId++, name: body.name, email: body.email, role: body.role || "user" };
      users.push(user);
      return send(res, 201, user);
    }

    if (method === "GET" && url === "/users") {
      return send(res, 200, { data: users, count: users.length });
    }

    const match = url.match(/^\/users\/([^/]+)$/);
    if (match) {
      const raw = match[1];
      if (!/^\d+$/.test(raw)) return send(res, 400, { error: "id must be a number" });
      const id = Number(raw);
      const index = users.findIndex((u) => u.id === id);

      if (method === "GET") {
        if (index === -1) return send(res, 404, { error: "user not found" });
        return send(res, 200, users[index]);
      }
      if (method === "DELETE") {
        if (index === -1) return send(res, 404, { error: "user not found" });
        users.splice(index, 1);
        return send(res, 204);
      }
    }

    return send(res, 404, { error: "not found" });
  });
}

// Allow running the service standalone: node service/server.js
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = process.env.PORT || 8080;
  createServer().listen(port, () => console.log(`users service on ${port}`));
}
