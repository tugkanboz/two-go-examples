# async-jobs

Testing async work (a job that finishes later) with two-go:

- `pollUntil(fn, predicate, options)`: call an endpoint until a condition holds,
  then return the response.
- `eventually(fn, options)`: retry an assertion block until it stops throwing.

The service reports `pending` for a moment, then `done`.

```bash
npm install
npm test
```
