// A small typed in-memory user service backed by node:http.
// It listens on port 0 so the OS picks a free random port.
import http from "node:http";

export interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

interface CreateUserInput {
  name?: unknown;
  email?: unknown;
}

// Deterministic seed data. The first id is 1 so id > 0 always holds.
let nextId = 1;
const users: User[] = [];

function seed(): void {
  users.length = 0;
  nextId = 1;
  addUser("Ada Lovelace", "ada@example.com");
  addUser("Alan Turing", "alan@example.com");
}

function addUser(name: string, email: string): User {
  const user: User = { id: nextId++, name, email, active: true };
  users.push(user);
  return user;
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (raw.length === 0) {
    return undefined;
  }
  return JSON.parse(raw) as unknown;
}

function sendJson(res: http.ServerResponse, status: number, payload: unknown): void {
  const text = JSON.stringify(payload);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(text)
  });
  res.end(text);
}

// Creates (but does not start) the HTTP server. Call .listen(0) to start it.
export function createServer(): http.Server {
  seed();

  return http.createServer((req, res) => {
    const method: string = req.method ?? "GET";
    const url: string = req.url ?? "/";

    if (method === "GET" && url === "/users") {
      sendJson(res, 200, { data: users });
      return;
    }

    const match = url.match(/^\/users\/(\d+)$/);
    if (method === "GET" && match) {
      const id = Number(match[1]);
      const found = users.find((u) => u.id === id);
      if (!found) {
        sendJson(res, 404, { error: "not found" });
        return;
      }
      sendJson(res, 200, { data: found });
      return;
    }

    if (method === "POST" && url === "/users") {
      void readJson(req)
        .then((parsed) => {
          const input = (parsed ?? {}) as CreateUserInput;
          const name = typeof input.name === "string" ? input.name : "";
          const email = typeof input.email === "string" ? input.email : "";
          if (name.length === 0 || email.length === 0) {
            sendJson(res, 400, { error: "name and email are required" });
            return;
          }
          const created = addUser(name, email);
          sendJson(res, 201, { data: created });
        })
        .catch(() => {
          sendJson(res, 400, { error: "invalid json" });
        });
      return;
    }

    sendJson(res, 404, { error: "route not found" });
  });
}
