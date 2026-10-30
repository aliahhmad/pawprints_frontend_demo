import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/load-module.mjs";
const { petitionMetadata } = await loadModule(new URL("../src/lib/petition-metadata.ts", import.meta.url));
const fallback = { title: "Campus petitions" };

test("shared links have metadata from local public sample data without any fetch", async t => {
  const fetch = t.mock.method(globalThis, "fetch", () => { throw new Error("No API allowed"); });
  const result = await petitionMetadata(Promise.resolve({ petition: "1" }), fallback);
  assert.equal(result.title, "Keep the library open later during finals");
  assert.equal(result.openGraph.title, result.title);
  assert.equal(result.twitter.card, "summary");
  assert.equal(fetch.mock.callCount(), 0);
});

test("unknown, unpublished, and invalid petitions use generic metadata", async () => {
  for (const petition of ["999999", "101", "nope", "0", "-1", "2147483648", "42/../users"]) {
    assert.deepEqual(await petitionMetadata(Promise.resolve({ petition }), fallback), fallback);
  }
});
