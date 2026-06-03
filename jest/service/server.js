import http from "node:http";

// Small in-memory user service used by the Jest example.
// It has no external dependencies and keeps all state in memory.
export function createServer() {
  const users = [];
  let nextId = 1;

  function send(res, status, payload) {
    const text = JSON.stringify(payload);
    res.writeHead(status, {
      "content-type": "application/json",
      "content-length": Buffer.byteLength(text)
    });
    res.end(text);
  }

  function readJson(req) {
    return new Promise((resolve) => {
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
        } catch {
          resolve(null);
        }
      });
    });
  }

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname;

    // Create a user with basic validation.
    if (req.method === "POST" && path === "/users") {
      const body = await readJson(req);
      if (!body || typeof body.name !== "string" || body.name.length === 0) {
        send(res, 400, { error: "name is required" });
        return;
      }
      if (typeof body.email !== "string" || !body.email.includes("@")) {
        send(res, 400, { error: "valid email is required" });
        return;
      }
      const user = { id: nextId++, name: body.name, email: body.email };
      users.push(user);
      send(res, 201, user);
      return;
    }

    // List all users.
    if (req.method === "GET" && path === "/users") {
      send(res, 200, { data: users, count: users.length });
      return;
    }

    // Get a single user by id.
    const match = path.match(/^\/users\/(\d+)$/);
    if (req.method === "GET" && match) {
      const id = Number(match[1]);
      const user = users.find((u) => u.id === id);
      if (!user) {
        send(res, 404, { error: "user not found" });
        return;
      }
      send(res, 200, user);
      return;
    }

    send(res, 404, { error: "not found" });
  });

  return server;
}
