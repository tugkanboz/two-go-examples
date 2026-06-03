# cucumber

Real Gherkin `.feature` files run with [cucumber-js](https://github.com/cucumber/cucumber-js),
where two-go does the HTTP calls and the assertions inside the step definitions.

This is the answer to "where is the `.feature` file?". The other BDD examples
(`bdd`, `ecommerce-bdd`) use a small JS DSL with no extra dependency. This one
uses actual Gherkin text and the cucumber runner, which is a dependency.

## Layout

```
cucumber/
  cucumber.json             # cucumber-js config (ESM)
  service/server.js         # the in-memory user service
  features/
    get_user.feature        # Gherkin, plain text
    create_user.feature
    support/
      world.mjs             # starts the service, puts a two-go client on this.api
      steps.mjs             # step definitions, two-go does request + assertions
```

## Run

```bash
npm install
npm test          # runs: cucumber-js
```

## How it fits together

The feature file is plain Gherkin:

```gherkin
Scenario: Get an existing user
  Given a user named "Grace" exists
  When I get that user by id
  Then the response status should be 200
  And the response field "name" should be "Grace"
```

Each step maps to a definition where two-go runs the request and asserts:

```js
When("I get that user by id", async function () {
  this.res = await this.api.get(`/users/${this.userId}`);
});

Then("the response status should be {int}", function (status) {
  this.res.expectStatus(status);
});
```

`this.api` is a two-go client set up once in `world.mjs`. A `When` stashes the
response on the World, a `Then` asserts on it.
