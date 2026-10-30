import assert from "node:assert/strict";
import test from "node:test";
import {
  canEditDraft,
  hasRichContent,
  petitionAccess,
  petitionReturnPath,
  validPetitionId,
} from "../src/lib/petition-access.ts";

const user = (name, roles = [], committees = []) => ({
  username: name,
  first_name: name,
  last_name: "",
  roles: roles.map((name) => ({ id: 1, name })),
  committees,
});
const petition = { committee: { id: 2, name: "Academic Affairs" } };

test("guests and students never receive review tools", () => {
  assert.equal(petitionAccess(null, petition).reviewer, false);
  assert.equal(petitionAccess(user("student"), petition).canCompose, false);
});
test("the admin role does not grant review or draft access in the demo", () => {
  for (const committees of [[], [{ id: 2 }]]) {
    const access = petitionAccess(user("admin", ["admin"], committees), petition);
    assert.equal(access.reviewer, false);
    assert.equal(access.canCompose, false);
  }
  const member = user("member", ["admin", "committee_member"], [{ id: 2 }]);
  assert.equal(petitionAccess(member, petition).canCompose, true);
});
test("committee editors must belong to the assigned committee", () => {
  assert.equal(
    petitionAccess(user("member", ["committee_member"], [{ id: 3 }]), petition)
      .canCompose,
    false
  );
  assert.equal(
    petitionAccess(user("member", ["committee_member"], [{ id: 2 }]), petition)
      .canCompose,
    true
  );
});
test("only an unpublished draft author receives edit and delete actions", () => {
  const update = { author_id: "sam", is_draft: true, is_approved: false };
  assert.equal(canEditDraft(user("sam"), update), true);
  assert.equal(canEditDraft(user("other"), update), false);
  assert.equal(
    canEditDraft(user("sam"), { ...update, is_draft: false }),
    false
  );
  assert.equal(
    canEditDraft(user("sam"), { ...update, is_approved: true }),
    false
  );
});
test("empty formatting is not a valid draft or rejection reason", () => {
  for (const value of [
    "",
    "   ",
    "<p><br></p>",
    JSON.stringify({
      root: {
        children: [
          { type: "paragraph", children: [{ type: "text", text: "   " }] },
        ],
      },
    }),
  ])
    assert.equal(hasRichContent(value), false);
  assert.equal(
    hasRichContent(
      JSON.stringify({
        root: { children: [{ type: "text", text: "A useful update" }] },
      })
    ),
    true
  );
  assert.equal(
    hasRichContent(
      JSON.stringify({
        root: { children: [{ type: "image", src: "/image.png" }] },
      })
    ),
    true
  );
});
test("back links preserve list context and reject external or unrelated paths", () => {
  assert.equal(
    petitionReturnPath("/petitions?page=3&tag=2"),
    "/petitions?page=3&tag=2"
  );
  for (const value of [
    "https://evil.test/petitions",
    "//evil.test/petitions",
    "/admin",
    "/admin/petitions?page=2",
    "/admin/pawstats?granularity=weekly",
    "/\\evil.test",
  ])
    assert.equal(petitionReturnPath(value), "/petitions");
});
test("detail identifiers are validated before API requests", () => {
  assert.equal(validPetitionId("123"), true);
  for (const id of ["0", "-1", "1.2", "abc", "2147483648"])
    assert.equal(validPetitionId(id), false);
});

test("a full petition can return to the profile's filters and page", () => {
  assert.equal(
    petitionReturnPath("/profile?filter=published&page=2"),
    "/profile?filter=published&page=2"
  );
  assert.equal(petitionReturnPath("https://evil.test/profile"), "/petitions");
  assert.equal(petitionReturnPath("/profile/other"), "/petitions");
});
