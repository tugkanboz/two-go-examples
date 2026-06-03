import http from "node:http";

// A tiny in-memory user service used by the Vitest example.
// It exposes:
//   POST /users        create a user, returns 201 with the created record
//   GET  /users/:id    fetch a user, returns 200 or 404
// IDs are assigned from an incrementing counter so results are deterministic.
export function createServer() {
  const users = new Map();
  let nextId = 1;

  function send(res, status, payload) {
    const data = JSON.stringify(payload);
    res.writeHead(status, {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(data)
    });
    res.end(data);
  }

  function readJson(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
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

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;

    if (req.method === "POST" && path === "/users") {
      let payload;
      try {
        payload = await readJson(req);
      } catch {
        send(res, 400, { error: "invalid_json" });
        return;
      }
      if (!payload || typeof payload.name !== "string") {
        send(res, 400, { error: "name_required" });
        return;
      }
      const user = {
        id: nextId++,
        name: payload.name,
        email: typeof payload.email === "string" ? payload.email : null
      };
      users.set(user.id, user);
      send(res, 201, user);
      return;
    }

    const match = path.match(/^\/users\/(\d+)$/);
    if (req.method === "GET" && match) {
      const id = Number(match[1]);
      const user = users.get(id);
      if (!user) {
        send(res, 404, { error: "not_found" });
        return;
      }
      send(res, 200, user);
      return;
    }

    send(res, 404, { error: "not_found" });
  });

  return server;
}
