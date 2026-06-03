// The same tiny BDD layer on top of node:test. A feature groups scenarios, a
// scenario is an ordered list of Given/When/Then steps sharing a `world`, and
// two-go's throwing assertions decide pass or fail.
import { test } from "node:test";

let currentFeature = null;

export function feature(name, build) {
  const previous = currentFeature;
  currentFeature = name;
  build();
  currentFeature = previous;
}

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
