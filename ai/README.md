# two-go AI layer (offline with a stub provider)

This example shows the optional AI helpers from `two-go/ai`:

- `aiGenerateTests({ provider, endpoint, sample })` turns an endpoint plus a
  sample response into a runnable `*.twogo.mjs` suite (markdown fences stripped).
- `aiReview(response, { provider })` returns an array of findings about a
  response (security, correctness, smells).
- `explainFailure(error, { provider, response })` returns a short, plain-English
  explanation of why an assertion failed.

## Running offline

Every AI helper accepts an injected `provider` with an async
`complete(prompt, opts)` method. The test in `ai.test.mjs` passes a stub
provider that returns canned output, so the suite is deterministic and runs
with no network and no API key:

```bash
npm install
npm test
```

The stub looks at each prompt and returns the right shape: a fenced suite for
`aiGenerateTests`, a JSON array string for `aiReview`, and a sentence for
`explainFailure`.

## Real usage

In real projects you build a provider with `createProvider` and let it call a
cloud model. Provide a key via the matching environment variable:

```js
import { createProvider } from "two-go/ai";
import { aiGenerateTests, aiReview, explainFailure } from "two-go/ai";

// OpenAI: reads OPENAI_API_KEY from the environment.
const provider = createProvider({ provider: "openai" });

// Anthropic: reads ANTHROPIC_API_KEY from the environment.
// const provider = createProvider({ provider: "anthropic" });

const source = await aiGenerateTests({
  provider,
  endpoint: "/users",
  method: "GET",
  baseUrl: "https://api.example.com",
  sample: { data: [{ id: 1 }] }
});
```

```bash
export OPENAI_API_KEY=sk-...      # for provider: "openai"
export ANTHROPIC_API_KEY=sk-ant-... # for provider: "anthropic"
```

### Default models

The default model is `gpt-5.3` for OpenAI and `claude-opus-4-8` for Anthropic.
Override either with `{ model }`:

```js
const provider = createProvider({ provider: "openai", model: "gpt-5.3-mini" });
// or
const provider = createProvider({ provider: "anthropic", model: "claude-opus-4-8" });
```

Because the helpers only depend on the `provider.complete` contract, you can
swap the real provider for the stub in tests at any time to keep your suite
offline and free.
