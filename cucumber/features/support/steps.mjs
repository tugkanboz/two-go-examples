// Step definitions. The Gherkin steps in the .feature files map to these, and
// two-go does the request and the assertions. A unique counter keeps created
// emails from colliding across scenarios.
import { Given, When, Then } from "@cucumber/cucumber";

let seq = 0;
const uniqueEmail = () => `cucumber${seq++}@example.com`;

Given("a user named {string} exists", async function (name) {
  const res = await this.api.post("/users").json({ name, email: uniqueEmail() }).expectStatus(201);
  this.userId = res.get("id");
});

When("I create a user named {string} with email {string}", async function (name, email) {
  this.res = await this.api.post("/users").json({ name, email });
});

When("I create a user with no name and email {string}", async function (email) {
  this.res = await this.api.post("/users").json({ email });
});

When("I get that user by id", async function () {
  this.res = await this.api.get(`/users/${this.userId}`);
});

When("I get the user with id {string}", async function (id) {
  this.res = await this.api.get(`/users/${id}`);
});

Then("the response status should be {int}", function (status) {
  this.res.expectStatus(status);
});

Then("the response field {string} should be {string}", function (field, value) {
  this.res.expectJson(field, value);
});
