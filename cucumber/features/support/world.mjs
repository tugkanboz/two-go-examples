// Starts the service once for the whole run and gives every scenario a two-go
// client on `this.api`. cucumber-js builds a fresh World per scenario.
import { setWorldConstructor, BeforeAll, AfterAll } from "@cucumber/cucumber";
import { go } from "two-go";
import { createServer } from "../../service/server.js";

let server;
let baseUrl;

BeforeAll(async function () {
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

AfterAll(function () {
  if (server) server.close();
});

class TwoGoWorld {
  constructor() {
    this.api = go(baseUrl);
    this.res = null;
    this.userId = null;
  }
}

setWorldConstructor(TwoGoWorld);
