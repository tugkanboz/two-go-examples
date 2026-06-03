# two-go-examples

Runnable examples for [two-go](https://github.com/tugkanboz/two-go), the
zero-dependency API testing library.

Each folder is self contained. Install two-go and run.

| Example | What it shows |
| ------- | ------------- |
| [basic](./basic) | Write a suite in a `*.twogo.mjs` file and run it with the built-in CLI. |
| [node-test](./node-test) | Use two-go inside the Node test runner (`node --test`). |
| [bdd](./bdd) | BDD style scenarios (given/when/then) over a user service, with success, validation, and edge cases. |
| [microservice](./microservice) | Test a microservice brought up with Docker Compose alongside MySQL and MSSQL. |

The basic and node-test examples hit a public test API
(`https://jsonplaceholder.typicode.com`), so they run without any backend.

## Quick start

```bash
cd basic
npm install
npm test
```

## License

MIT
