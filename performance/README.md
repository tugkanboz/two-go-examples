# performance

A light performance check with two-go:

- `mapLimit(items, limit, fn)`: fire many requests with bounded concurrency.
- `r.time`: each response carries its round trip time, so you can compute a p95.
- `_.range(n)`: a small utility to build the request list.

This is not a load testing tool, just a quick latency budget you can keep in CI.

```bash
npm install
npm test
```
