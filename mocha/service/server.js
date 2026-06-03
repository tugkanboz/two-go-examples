// Minimal in-memory user service used by the Mocha example.
// It has no external dependencies and listens on a random port (0).
// Reach it at http://localhost:<port> after calling listen().
import { createServer as createHttpServer } from "node:http";

export function createServer() {
  // In-memory store. Keys are numeric ids, values are user objects.
  const users = new Map();
  let nextId = 1;

  function send(res, status, body) {
    const payload = body === undefined ? "" : JSON.stringify(body);
    res.writeHead(status, {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(payload)
    });
    res.end(payload);
  }

  function readJson(req) {
    return new Promise((resolve, reject) => {
      let raw = "";
      req.on("data", (chunk) => {
        raw += chunk;
      });
      req.on("end", () => {
        if (!raw) {
          resolve({});
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch (err) {
          reject(err);
        }
      });
      req.on("error", reject);
    });
  }

  const server = createHttpServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;

    // POST /users -> create a user.
    if (req.method === "POST" && path === "/users") {
      let body;
      try {
        body = await readJson(req);
      } catch {
        send(res, 400, { error: "invalid JSON" });
        return;
      }
      if (!body || typeof body.name !== "string" || typeof body.email !== "string") {
        send(res, 400, { error: "name and email are required" });
        return;
      }
      const user = { id: nextId++, name: body.name, email: body.email };
      users.set(user.id, user);
      send(res, 201, user);
      return;
    }

    // GET /users/:id -> fetch a user.
    const match = path.match(/^\/users\/(\d+)$/);
    if (req.method === "GET" && match) {
      const id = Number(match[1]);
      const user = users.get(id);
      if (!user) {
        send(res, 404, { error: "user not found" });
        return;
      }
      send(res, 200, user);
      return;
    }

    // Anything else.
    send(res, 404, { error: "not found" });
  });

  return server;
}
