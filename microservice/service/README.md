# service

A small example microservice so the whole stack runs end to end. It is plain
Node `http` plus the `mysql2` and `mssql` drivers.

- `GET /health`: checks the MySQL and MSSQL connections, returns `{ status: "ok" }`.
- `GET /users`: lists users from MySQL.
- `POST /users`: inserts a user in MySQL and writes an audit row in MSSQL.

It waits for both databases on startup (they take a moment to accept
connections) and creates its tables automatically.

To test your own service instead, replace this folder with yours, or set
`image:` rather than `build: ./service` in `docker-compose.test.yml`. The suite
only needs `/health`, `/users` (GET and POST).
