import assert from "node:assert/strict";
import test from "node:test";
import { comparisonRoute } from "../src/lib/design-routes.ts";
import { loadModule } from "./helpers/load-module.mjs";
const { localFetch } = await loadModule(new URL("../src/old/local-fetch.ts", import.meta.url));
const demo = await loadModule(new URL("../src/lib/demo-client.ts", import.meta.url));
Object.defineProperty(globalThis, "window", { value: undefined, writable: true, configurable: true });
test.beforeEach(t => {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (k,v) => values.set(k,v), removeItem: k => values.delete(k) };
  t.mock.property(globalThis, "window", Object.assign(new EventTarget(), { localStorage: storage, sessionStorage: storage }));
  t.mock.method(globalThis, "fetch", () => { throw new Error("The original frontend must not make network API calls."); });
  demo.resetDemoData(); demo.signOutDemo();
});
test("the comparison switch maps original routes and preserves query context", () => {
  assert.equal(comparisonRoute("/petitions", "?query=library&status=1", "old"), "/old?query=library&status=1");
  assert.equal(comparisonRoute("/old/about", "", "new"), "/about");
  assert.equal(comparisonRoute("/old", "?petition=14", "new"), "/petitions?petition=14");
  assert.equal(comparisonRoute("/create", "?draft=101", "old"), "/old/create?draft=101");
  assert.equal(comparisonRoute("/old/review/1", "", "new"), "/petitions/1");
  assert.equal(comparisonRoute("/petitions/14", "", "old"), "/old?petition=14");
  assert.equal(comparisonRoute("/petitions/1", "", "old", true), "/old/review/1");
  assert.equal(comparisonRoute("/profile", "?filter=drafts&page=2", "old"), "/old/profile?filter=drafts&page=2");
});
test("original catalog reads use the shared samples with original 40-item pagination", async () => {
  const response = await localFetch("/api/v1/petitions/search?items_per_page=40");
  const data = await response.json();
  assert.equal(data.petitions.length,28);
  assert.equal(data.petitions[0].id,1);
  assert.equal((await (await localFetch("/api/v1/tags")).json()).tags.length,7);
  const filtered = await (await localFetch("/api/v1/petitions/search?query=LIBRARY&status=1&tag_id=1")).json();
  assert.deepEqual(filtered.petitions.map(p=>p.id),[1]);
});
test("a signature made through the copied UI is immediately visible in the new UI client", async () => {
  assert.equal((await localFetch("/api/v1/users/14/can_sign")).status,401);
  demo.signInDemo();
  const before=(await demo.getPetition(14)).total_signatures;
  assert.equal((await localFetch("/api/v1/users/1/can_sign")).status,423);
  assert.equal((await localFetch("/api/v1/users/24/can_sign")).status,404);
  await localFetch("/api/v1/users/14/sign",{method:"POST"});
  assert.equal(await demo.getSigningState(14),"signed");
  assert.equal((await demo.getPetition(14)).total_signatures,before+1);
  assert.equal((await localFetch("/api/v1/users/14/can_sign")).status,409);
  await localFetch("/api/v1/users/14/unsign",{method:"POST"});
  assert.equal((await demo.getPetition(14)).total_signatures,before);
});
test("original forms share drafts and publication with the new client", async () => {
  demo.signInDemo();
  const input={title:"Original form local draft",description:"<p>This sample draft is shared by both route trees.</p>",is_draft:true,tags:[1]};
  const draft=await (await localFetch("/api/v1/petitions/create",{method:"POST",body:JSON.stringify(input)})).json();
  assert.equal((await demo.getPetitionDescription(draft.id)).petition_description,input.description);
  assert.equal((await demo.getOwnPetitions(1,"drafts")).page_info.total_items,3);
  assert.equal((await (await localFetch("/api/v1/petitions/user/me?filter=draft")).json()).page_info.total_items,3);
  await localFetch(`/api/v1/petitions/${draft.id}`,{method:"PUT",body:JSON.stringify({...input,is_draft:false})});
  assert.equal((await demo.getPetition(draft.id)).is_draft,false);
});
test("original committee draft writes stay private and admin operations are unavailable", async () => {
  demo.signInDemo("demo_committee");
  const entry=await (await localFetch("/api/v1/petitions/1/draft_update",{method:"POST",body:JSON.stringify({message:"<p>Shared original committee draft.</p>",is_draft:true})})).json();
  assert.ok((await demo.getTimeline(1,undefined,true)).petition_updates.some(e=>e.update.id===entry.update.id));
  assert.equal((await demo.getTimeline(1)).petition_updates.some(e=>e.update.id===entry.update.id),false);
  assert.equal((await localFetch("/api/v1/petitions/1/review",{method:"POST",body:"{}"})).status,404);
  assert.equal((await localFetch("/api/v1/petitions/1/draft_update",{method:"POST",body:JSON.stringify({message:"Response",is_response:true})})).status,403);
});
