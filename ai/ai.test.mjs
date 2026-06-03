// Demonstrates the optional two-go AI layer WITHOUT any network call.
//
// The AI helpers accept an injected `provider` with an async complete()
// method. By passing a stub that returns canned output, these tests are
// fully deterministic and run offline with no API key. See README.md for
// the real usage (provider: "openai" / "anthropic").
import { test } from "node:test";
import assert from "node:assert/strict";

import { aiGenerateTests, explainFailure, aiReview } from "two-go/ai";

// One stub provider whose complete() inspects the prompt and returns output
// shaped for whichever helper is calling it.
const provider = {
  complete: async (prompt, opts) => {
    const system = (opts && opts.system) || "";

    // explainFailure frames its system prompt as failure triage.
    if (/triag/i.test(system)) {
      return "The endpoint returned 500 instead of 200, which points to an unhandled server error; check the service logs for a stack trace.";
    }

    // aiReview asks for a JSON array of findings about a response.
    if (/finding/i.test(prompt) || /finding/i.test(system)) {
      return '[{"severity":"high","field":"token","message":"auth token should not be returned in the body"}]';
    }

    // aiGenerateTests asks for a runnable suite; return a fenced block to
    // prove the helper strips markdown fences for us.
    return [
      "```js",
      'import { go, suite } from "two-go";',
      "",
      'suite("generated users suite", ({ test }) => {',
      '  test("GET /users returns a list", async () => {',
      '    await go("https://api.example.com").get("/users").expectStatus(200);',
      "  });",
      "});",
      "```"
    ].join("\n");
  }
};

test("aiGenerateTests returns runnable suite source", async () => {
  const source = await aiGenerateTests({
    provider,
    endpoint: "/users",
    method: "GET",
    baseUrl: "https://api.example.com",
    sample: { data: [{ id: 1 }] }
  });

  assert.equal(typeof source, "string");
  // The helper strips the markdown fences the model wrapped around the code.
  assert.doesNotMatch(source, /```/);
  assert.match(source, /^import \{ go, suite \} from "two-go";/);
  assert.match(source, /suite\(/);
});

test("aiReview returns an array of findings", async () => {
  const findings = await aiReview(
    { method: "GET", url: "/me", status: 200, body: { id: 1, token: "secret" } },
    { provider }
  );

  assert.ok(Array.isArray(findings));
  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, "high");
  assert.equal(findings[0].field, "token");
});

test("explainFailure returns a human-readable string", async () => {
  const error = new Error("GET /users -> expected status 200 but got 500");
  const explanation = await explainFailure(error, {
    provider,
    response: {
      method: "GET",
      url: "https://api.example.com/users",
      status: 500,
      statusText: "Internal Server Error",
      time: 42,
      headers: { "content-type": "text/html" },
      text: "<html>boom</html>"
    }
  });

  assert.equal(typeof explanation, "string");
  assert.ok(explanation.length > 0);
  assert.match(explanation, /500/);
});
