# contract

Contract and regression testing with two-go:

- `expectJsonSchema(...)`: assert a response matches an explicit JSON schema.
- `inferSchema(body)`: build a schema from a known-good response, then validate
  later responses against it.
- `toMatchSnapshot(body, name)`: catch any change to the response shape. The
  first run writes `__snapshots__/user.json`; later runs compare. Refresh with
  `TWO_GO_UPDATE_SNAPSHOTS=1 npm test`.

```bash
npm install
npm test
```
