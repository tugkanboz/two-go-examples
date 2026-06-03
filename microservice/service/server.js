// A small example microservice that uses both MySQL and MSSQL, so the two-go
// suite has something real to hit. Users live in MySQL; every create writes an
// audit row to MSSQL. /health checks both connections.
//
// It is intentionally plain Node http plus the two database drivers. This is
// the service under test, not part of two-go.
import http from "node:http";
import mysql from "mysql2/promise";
import sql from "mssql";

const PORT = Number(process.env.PORT || 8080);

const mssqlConfig = {
  server: process.env.MSSQL_HOST || "mssql",
  user: process.env.MSSQL_USER || "sa",
  password: process.env.MSSQL_PASSWORD || "Your_strong_Pass123",
  database: "master",
  port: 1433,
  options: { encrypt: false, trustServerCertificate: true },
  pool: { max: 5 },
};

let mysqlPool;
let mssqlPool;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Databases take a while to accept connections, so keep trying on startup.
async function withRetry(label, fn, { retries = 30, delay = 2000 } = {}) {
  let lastError;
  for (let i = 0; i < retries; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.log(`waiting for ${label} (${i + 1}/${retries}): ${err.message}`);
      await sleep(delay);
    }
  }
  throw lastError;
}

async function init() {
  mysqlPool = mysql.createPool(process.env.MYSQL_URL || "mysql://root:root@mysql:3306/app");
  await withRetry("mysql", () => mysqlPool.query("SELECT 1"));
  await mysqlPool.query(
    "CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), role VARCHAR(64))"
  );

  mssqlPool = await withRetry("mssql", () => new sql.ConnectionPool(mssqlConfig).connect());
  await mssqlPool
    .request()
    .query(
      "IF OBJECT_ID('dbo.audit','U') IS NULL CREATE TABLE dbo.audit (id INT IDENTITY PRIMARY KEY, action NVARCHAR(255), at DATETIME DEFAULT GETDATE())"
    );
}

function send(res, status, body) {
  const isText = typeof body === "string";
  res.writeHead(status, { "content-type": isText ? "text/plain" : "application/json" });
  res.end(isText ? body : JSON.stringify(body));
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
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      await mysqlPool.query("SELECT 1");
      await mssqlPool.request().query("SELECT 1");
      return send(res, 200, { status: "ok" });
    }

    if (req.method === "GET" && req.url === "/users") {
      const [rows] = await mysqlPool.query("SELECT id, name, role FROM users ORDER BY id");
      return send(res, 200, { data: rows, count: rows.length });
    }

    if (req.method === "POST" && req.url === "/users") {
      const body = await readJson(req);
      const [result] = await mysqlPool.query(
        "INSERT INTO users (name, role) VALUES (?, ?)",
        [body.name || null, body.role || null]
      );
      await mssqlPool
        .request()
        .input("action", sql.NVarChar, `created user ${result.insertId}`)
        .query("INSERT INTO dbo.audit (action) VALUES (@action)");
      return send(res, 201, { id: result.insertId, name: body.name, role: body.role });
    }

    return send(res, 404, { error: "not found" });
  } catch (err) {
    return send(res, 500, { error: err.message });
  }
});

init()
  .then(() => server.listen(PORT, () => console.log(`service listening on ${PORT}`)))
  .catch((err) => {
    console.error("startup failed:", err);
    process.exit(1);
  });
