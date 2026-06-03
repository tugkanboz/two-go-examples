# cucumber

Real Gherkin `.feature` files run with [cucumber-js](https://github.com/cucumber/cucumber-js),
where two-go does the HTTP calls and the assertions inside the step definitions.

This is the answer to "where is the `.feature` file?". The other BDD examples
(`bdd`, `ecommerce-bdd`) use two-go's built-in `two-go/bdd` layer, which needs
no extra dependency. This one uses actual Gherkin text and the cucumber runner,
which is a dependency.

## Layout

```
cucumber/
  cucumber.json             # cucumber-js config (ESM)
  service/server.js         # the in-memory user service
  features/
    get_user.feature        # Gherkin, plain text
    create_user.feature
    validate_user.feature   # a Scenario Outline with an Examples table
    support/
      world.mjs             # starts the service, puts a two-go client on this.api
      steps.mjs             # step definitions, two-go does request + assertions
```

## Run

```bash
npm install
npm test           # runs every scenario (cucumber-js)
npm run test:smoke # only scenarios tagged @smoke
```

A self-contained HTML report is written to `reports/cucumber.html` on every run
(configured in `cucumber.json` via the `html` formatter).

## Scenario Outline

`validate_user.feature` drives one scenario across a table of inputs, so you do
not repeat yourself:

```gherkin
Scenario Outline: validating create input
  When I create a user named "<name>" with email "<email>"
  Then the response status should be <status>

  Examples:
    | name | email                 | status |
    | Ada  | outline-1@example.com | 201    |
    |      | outline-3@example.com | 400    |
    | Cleo | not-an-email          | 400    |
```

## Tags

Scenarios can be tagged (for example `@smoke` or `@validation`) and filtered:

```bash
cucumber-js --tags @smoke
cucumber-js --tags "not @validation"
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
