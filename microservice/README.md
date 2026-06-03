# microservice

Test a microservice that you bring up with Docker Compose, alongside MySQL and
MSSQL. A dedicated `tests` service runs the two-go suite against it over the
compose network and the whole run exits with the test result.

## Layout

```
microservice/
  docker-compose.test.yml   # mysql + mssql + service + tests
  service/                  # your microservice (add a Dockerfile here)
  tests/
    package.json            # depends on two-go
    api.twogo.mjs           # the suite, targets http://service:8080
```

Point the `service` block in the compose file at your own service: either
`build: ./service` with a Dockerfile, or `image: your-org/your-service:latest`.

## Run

```bash
docker compose -f docker-compose.test.yml up --build \
  --abort-on-container-exit --exit-code-from tests
```

- `--exit-code-from tests` makes the whole command exit with the test result,
  which is what you want in CI.
- `--abort-on-container-exit` stops the databases and service once the tests finish.

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
