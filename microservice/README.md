# microservice

Test a microservice that you bring up with Docker Compose, alongside MySQL and
MSSQL. A dedicated `tests` service runs the two-go suite against it over the
compose network and the whole run exits with the test result.

This example is complete and runs end to end. It ships a small working service
(plain Node plus `mysql2` and `mssql`) so you can try the whole flow with one
command, then swap in your own service.

## Layout

```
microservice/
  docker-compose.test.yml   # mysql + mssql + service + tests
  service/                  # the example microservice (server.js + Dockerfile)
  tests/
    package.json            # depends on two-go
    api.twogo.mjs           # the suite, targets http://service:8080
```

To test your own service instead, set `image: your-org/your-service:latest` in
the `service` block (or replace `service/` with your own code and Dockerfile).
The suite only needs `/health` and `/users` (GET and POST).

## Run

```bash
docker compose -f docker-compose.test.yml up --build \
  --abort-on-container-exit --exit-code-from tests
```

- `--exit-code-from tests` makes the whole command exit with the test result,
  which is what you want in CI.
- `--abort-on-container-exit` stops the databases and service once the tests finish.

The first run is slow: it builds the service image and MSSQL needs around half a
minute to accept connections. The service retries on startup and the suite waits
on `/health`, so it just works, it only takes a moment. Later runs are fast.

A passing run ends with something like:

```
tests-1  | microservice
tests-1  |   ok health endpoint is ok
tests-1  |   ok GET /users returns a list
tests-1  |   ok POST /users creates a user
tests-1  | 3 passed, 0 failed
tests-1 exited with code 0
```

Clean up:

```bash
docker compose -f docker-compose.test.yml down -v
```

## How readiness works

There are two layers so the tests never run against a half-started stack:

1. Compose gating: `service` waits for `mysql` to be healthy, and `tests` waits
   for `service` to be healthy.
2. In the suite, a `before` hook uses `eventually(...)` to poll `/health` until
   it answers, as a safety net.

A reliable MSSQL healthcheck depends on the image tag (the `sqlcmd` path moves
between versions), so readiness is gated through the service's own `/health`
endpoint rather than a database healthcheck. Make sure your `/health` actually
checks the database connections.

## Talking to the databases

From the service, reach the databases by their compose service names:

- MySQL: `mysql://root:root@mysql:3306/app`
- MSSQL: `Server=mssql;User Id=sa;Password=Your_strong_Pass123;Encrypt=false`

From the tests, reach the service at `http://service:8080`. Never use
`localhost` between containers.
