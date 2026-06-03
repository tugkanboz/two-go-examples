# ci

GitHub Actions setup that runs the runnable two-go example suites.

## What it does

The workflow at `.github/workflows/examples.yml` runs on every push and pull
request targeting the `main` branch. It defines a single job that runs on
Node 20 (Ubuntu) and uses a matrix over the runnable example directory names:

- basic
- node-test
- bdd
- ecommerce-bdd
- contract
- async-jobs
- performance
- data-driven

Each matrix entry produces an independent job that checks out the repository,
sets up Node 20, and then runs a single step in the matching directory:

```
cd ${{ matrix.example }} && npm install --no-audit --no-fund && npm test
```

`fail-fast` is disabled, so one failing example does not cancel the others.
This makes it easy to see at a glance which suites pass and which fail.

## Independence

Every example is fully self-contained. Each one has its own `package.json`,
installs `two-go` from npm, and starts its own in-memory `node:http` service
on a random port (port 0) so the tests run offline and deterministically.
Because `npm install` and `npm test` run inside each example directory, the
examples share nothing at runtime and can be added, removed, or run in any
order without affecting one another.
