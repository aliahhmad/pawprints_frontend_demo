import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/load-module.mjs";

const demo = await loadModule(new URL("../src/lib/demo-client.ts", import.meta.url));
const emptyFilters = { query: "", status: "", tag: "", sort: "" };
let values;
Object.defineProperty(globalThis, "window", { value: undefined, writable: true, configurable: true });

test.beforeEach(t => {
  values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  t.mock.property(globalThis, "window", Object.assign(new EventTarget(), { localStorage: storage, sessionStorage: storage }));
  t.mock.method(globalThis, "fetch", () => { throw new Error("The demo must never fetch data."); });
  demo.resetDemoData();
  demo.signOutDemo();
});

test("guests browse local samples with filtering, sorting, and real pagination", async () => {
  const first = await demo.getPetitions(emptyFilters, 1);
  const second = await demo.getPetitions(emptyFilters, 2);
  assert.equal(first.petitions.length, 20);
  assert.equal(second.petitions.length, 8);
  assert.equal(first.page_info.total_items, 28);
  assert.equal(first.petitions.some(p => p.is_draft), false);
  assert.equal(new Set([...first.petitions, ...second.petitions].map(p => p.id)).size, 28);
  for (const status of ["0", "1", "2", "3"]) {
    const result = await demo.getPetitions({ ...emptyFilters, status }, 1);
    assert.ok(result.petitions.length > 0);
    assert.ok(result.petitions.every(p => String(p.status) === status));
  }
  const filtered = await demo.getPetitions({ ...emptyFilters, query: "LIBRARY", tag: "1", status: "1" }, 1);
  assert.deepEqual(filtered.petitions.map(p => p.id), [1]);
  const sorted = await demo.getPetitions({ ...emptyFilters, sort: "total_signatures" }, 1);
  assert.deepEqual(sorted.petitions.map(p => p.total_signatures), sorted.petitions.map(p => p.total_signatures).sort((a,b) => a-b));
  const none = await demo.getPetitions({ ...emptyFilters, query: "does-not-exist" }, 1);
  assert.equal(none.page_info.total_items, 0);
  assert.deepEqual(none.petitions, []);
  assert.deepEqual((await demo.getPetitions(emptyFilters, 99)).petitions, []);
});

test("example sign-in/out persists and profile pagination includes only owned petitions", async () => {
  await assert.rejects(demo.getCurrentUser(), e => e.status === 401);
  demo.signInDemo();
  assert.equal((await demo.getCurrentUser()).username, "demo_student");
  const all = await demo.getOwnPetitions(1, "all");
  assert.equal(all.page_info.total_items, 14);
  assert.equal((await demo.getOwnPetitions(2, "published")).petitions.length, 2);
  assert.equal((await demo.getOwnPetitions(1, "drafts")).petitions.length, 2);
  assert.ok(all.petitions.every(p => p.author.username === "demo_student"));
  assert.equal(JSON.parse(values.get(demo.DEMO_STORAGE_KEY)).username, "demo_student");
  demo.signInDemo("demo_committee");
  assert.equal((await demo.getCurrentUser()).username, "demo_committee");
  assert.equal((await demo.getOwnPetitions(1, "drafts")).petitions.length, 1);
  demo.signOutDemo();
  await assert.rejects(demo.getOwnPetitions(1, "all"), e => e.status === 401);
});

test("signatures update counts once, survive reads, and reject closed or owned petitions", async () => {
  assert.equal(await demo.getSigningState(14), "guest");
  demo.signInDemo();
  const before = (await demo.getPetition(14)).total_signatures;
  assert.equal(await demo.getSigningState(14), "ready");
  assert.equal((await demo.changeSignature(14, false)).total_signatures, before + 1);
  assert.equal((await demo.changeSignature(14, false)).total_signatures, before + 1);
  assert.equal(await demo.getSigningState(14), "signed");
  assert.equal((await demo.getPetition(14)).total_signatures, before + 1);
  assert.equal((await demo.changeSignature(14, true)).total_signatures, before);
  assert.equal((await demo.changeSignature(14, true)).total_signatures, before);
  assert.equal(await demo.getSigningState(1), "own");
  for (const id of [1, 24, 25]) await assert.rejects(demo.changeSignature(id, false), e => e.status === 403);
  assert.equal(await demo.getSigningState(24), "closed");
  assert.equal(await demo.getSigningState(25), "closed");
});

test("creating, saving, reopening, and publishing a petition updates local lists", async () => {
  const input = { title: "Add a shaded study space", description: "<p>A quieter place to study outside between classes.</p>", tags: [1,4], is_draft: true };
  await assert.rejects(demo.savePetition(input), e => e.status === 401);
  demo.signInDemo();
  const draft = await demo.savePetition(input);
  assert.equal(draft.total_signatures, 0);
  assert.equal((await demo.getOwnPetitions(1, "drafts")).page_info.total_items, 3);
  assert.equal((await demo.getPetitionDescription(draft.id)).petition_description, input.description);
  assert.equal((await demo.getPetitions({ ...emptyFilters, query: input.title }, 1)).page_info.total_items, 0);
  const saved = await demo.savePetition({ ...input, title: "Add shaded study tables", is_draft: false }, draft.id);
  assert.equal(saved.id, draft.id);
  assert.equal(saved.total_signatures, 1);
  assert.equal(saved.is_draft, false);
  assert.equal(await demo.getSigningState(saved.id), "own");
  assert.deepEqual(saved.tags.map(t => t.id), [1,4]);
  assert.equal((await demo.getPetitions({ ...emptyFilters, query: saved.title }, 1)).page_info.total_items, 1);
  await assert.rejects(demo.savePetition(input, draft.id), e => e.status === 403);
  demo.signInDemo("demo_committee");
  await assert.rejects(demo.getPetition(101), e => e.status === 404);
  assert.equal(await demo.getSigningState(saved.id), "ready");
});

test("committee drafts can be created, edited, revised, and deleted without appearing publicly", async () => {
  demo.signInDemo();
  await assert.rejects(demo.getTimeline(1, undefined, true), e => e.status === 403);
  await assert.rejects(demo.createUpdate(1, "<p>New draft.</p>"), e => e.status === 403);
  demo.signInDemo("demo_committee");
  assert.equal((await demo.getTimeline(1)).petition_updates.length, 1);
  assert.equal((await demo.getTimeline(1, undefined, true)).petition_updates.length, 2);
  const draft = await demo.createUpdate(1, "<p>A proposed pilot.</p>");
  assert.equal(draft.update.is_draft, true);
  assert.equal(draft.is_response, false);
  const edited = await demo.editUpdate(1, { ...draft.update, is_approved: true }, "<p>A revised pilot.</p>");
  assert.equal(edited.update.is_approved, false);
  assert.equal(edited.update.message, "<p>A revised pilot.</p>");
  const revised = await demo.createUpdate(1, "<p>Another proposal.</p>", edited.update.id);
  assert.notEqual(revised.update.id, edited.update.id);
  assert.equal((await demo.getTimeline(1)).petition_updates.length, 1);
  await demo.deleteUpdate(1, draft.update.id);
  assert.equal((await demo.getTimeline(1, undefined, true)).petition_updates.some(e => e.update.id === draft.update.id), false);
  await assert.rejects(demo.createUpdate(3, "<p>Wrong committee.</p>"), e => e.status === 403);
  await assert.rejects(demo.deleteUpdate(1, 10), e => e.status === 403);
});

test("reset restores the bundled samples while keeping the selected example account", async () => {
  demo.signInDemo();
  await demo.changeSignature(14, false);
  await demo.savePetition({ title: "A new idea", description: "<p>A description for a new example idea.</p>", tags: [], is_draft: false });
  demo.resetDemoData();
  assert.equal((await demo.getCurrentUser()).username, "demo_student");
  assert.equal((await demo.getPetitions(emptyFilters, 1)).page_info.total_items, 28);
  assert.equal(await demo.getSigningState(14), "ready");
});

test("local images become persistent raster data URLs and reject unsupported or oversized files", async () => {
  demo.signInDemo();
  const image = new File([new Uint8Array([137,80,78,71])], "example.png", { type: "image/png" });
  assert.equal((await demo.uploadImage(image)).uri, "data:image/png;base64,iVBORw==");
  await assert.rejects(demo.uploadImage(new File(["<svg/>"], "example.svg", { type: "image/svg+xml" })), e => e.status === 400);
  await assert.rejects(demo.uploadImage(new File([new Uint8Array(1024*1024+1)], "big.png", { type: "image/png" })), e => e.status === 400);
});

test("cancelled reads, missing petitions, local tags, and notices need no network", async () => {
  const controller = new AbortController(); controller.abort();
  await assert.rejects(demo.getPetitions(emptyFilters, 1, controller.signal), { name: "AbortError" });
  await assert.rejects(demo.getPetition(999999), e => e.status === 404);
  assert.equal((await demo.getTags()).length, 7);
  assert.match((await demo.getSiteAlert()).alert_message, /fictional/);
});

test("unavailable browser storage falls back to memory and full storage does not claim a save", async t => {
  t.mock.method(window.localStorage, "getItem", () => { throw new DOMException("Unavailable", "SecurityError"); });
  t.mock.method(window.localStorage, "setItem", () => { throw new DOMException("Unavailable", "SecurityError"); });
  demo.signInDemo();
  assert.equal((await demo.getCurrentUser()).username, "demo_student");
  await demo.changeSignature(14, false);
  assert.equal(await demo.getSigningState(14), "signed");
  window.localStorage.setItem = () => { throw new DOMException("Full", "QuotaExceededError"); };
  await assert.rejects(demo.changeSignature(14, true), e => e.status === 507);
  assert.equal(await demo.getSigningState(14), "signed");
});
