# service

Put your microservice here, with a `Dockerfile` that listens on the port used
in `docker-compose.test.yml` (8080 in the example) and exposes a `/health`
endpoint that checks its database connections.

If you already have an image, skip this folder and set `image:` instead of
`build: ./service` in the compose file.
