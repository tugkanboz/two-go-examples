// A tiny BDD layer on top of node:test. Zero dependencies. A feature groups
// scenarios, a scenario is a list of Given/When/Then steps that run in order
// and share a `world` object. Each scenario becomes one test, and two-go's
// throwing assertions are what make a step pass or fail.
import { test } from "node:test";

let currentFeature = null;

// Group related scenarios under a feature name.
export function feature(name, build) {
  const previous = currentFeature;
  currentFeature = name;
  build();
  currentFeature = previous;
}

// Define a scenario from an ordered list of steps. Steps receive a shared
// `world` object so a When can stash a response that a Then asserts on.
export function scenario(title, steps) {
  const name = currentFeature ? `${currentFeature}: ${title}` : title;
  test(name, async (t) => {
    const world = {};
    for (const step of steps) {
      t.diagnostic(`${step.kind} ${step.text}`);
      await step.run(world);
    }
  });
}

const step = (kind) => (text, run) => ({ kind, text, run });

export const given = step("Given");
export const when = step("When");
export const then = step("Then");
export const and = step("And");
