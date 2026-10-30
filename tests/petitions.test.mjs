import assert from "node:assert/strict";
import test from "node:test";
import {
  parseFilters,
  parsePage,
  petitionSearchParams,
  safeReturnPath,
} from "../src/lib/petitions.ts";

test("a shared filtered URL retains the Active status, tag, query and sort", () => {
  const filters = parseFilters(
    new URLSearchParams(
      "query=library+%26+study&status=0&tag=12&sort=-total_signatures"
    )
  );
  const params = petitionSearchParams(filters, 3);
  assert.equal(params.get("query"), "library & study");
  assert.equal(params.get("status"), "0");
  assert.equal(params.get("tag_id"), "12");
  assert.equal(params.get("sort"), "-total_signatures");
  assert.equal(params.get("page"), "3");
  assert.equal(params.get("items_per_page"), "20");
  assert.equal(params.has("tag"), false);
});

test("Recommended omits explicit sorting and empty filters", () => {
  const params = petitionSearchParams(parseFilters(new URLSearchParams()));
  assert.deepEqual(
    [...params],
    [
      ["page", "1"],
      ["items_per_page", "20"],
    ]
  );
});

test("invalid shared filters cannot become arbitrary API sort or status values", () => {
  assert.deepEqual(
    parseFilters(new URLSearchParams("status=99&tag=-1&sort=arbitrary")),
    { query: "", status: "", tag: "", sort: "" }
  );
});

test("search text is encoded as data, including reserved URL characters", () => {
  const filters = {
    query: "buses & bikes? #campus",
    status: "",
    tag: "",
    sort: "",
  };
  const encoded = petitionSearchParams(filters).toString();
  assert.equal(new URLSearchParams(encoded).get("query"), filters.query);
  assert.equal(new URLSearchParams(encoded).has("bikes?"), false);
});

test("demo sign-in preserves the petition and list context on return", () => {
  assert.equal(
    safeReturnPath("/petitions?query=library&tag=2&petition=123"),
    "/petitions?query=library&tag=2&petition=123"
  );
});

test("demo sign-in cannot redirect to an external or unrelated destination", () => {
  for (const value of [
    null,
    "https://evil.test/petitions",
    "//evil.test/petitions",
    "/\\evil.test",
    "/petitions/../admin",
    "/petitions-extra",
    "/petitions\n?x=1",
  ]) {
    assert.equal(safeReturnPath(value), "/petitions", String(value));
  }
});

test("sign-in rejects every removed admin destination", () => {
  for (const path of [
    "/admin?search=aa&role=admin&page=2",
    "/admin/roles?search=committee",
    "/admin/permissions",
    "/admin/committees",
    "/admin/petitions",
    "/admin/tags",
    "/admin/settings",
    "/admin/pawstats",
    "https://evil.test/admin",
    "//evil.test/admin",
    "/admin-extra",
    "/admin/users",
    "/petitions/../admin",
    "/petitions/%2e%2e/admin",
  ]) {
    assert.equal(safeReturnPath(path), "/petitions", path);
  }
});

test("pagination accepts shared page numbers and rejects invalid pages", () => {
  assert.equal(parsePage("3"), 3);
  for (const value of [
    null,
    "",
    "0",
    "-1",
    "1.5",
    "2abc",
    "2147483648",
    "999999999999999999999999",
  ]) {
    assert.equal(parsePage(value), 1, String(value));
  }
});

test("demo sign-in returns to a standalone petition and preserves its list context", () => {
  assert.equal(
    safeReturnPath("/petitions/123?from=%2Fpetitions%3Fpage%3D2"),
    "/petitions/123?from=%2Fpetitions%3Fpage%3D2"
  );
});

test("demo sign-in returns to native creation or a draft without accepting lookalike paths", () => {
  assert.equal(safeReturnPath("/create"), "/create");
  assert.equal(safeReturnPath("/create?draft=123"), "/create?draft=123");
  for (const path of [
    "https://evil.test/create",
    "//evil.test/create",
    "/create/extra",
    "/create-extra",
  ])
    assert.equal(safeReturnPath(path), "/petitions");
});

test("demo sign-in preserves an owned-petition page without accepting external profile destinations", () => {
  assert.equal(
    safeReturnPath("/profile?filter=drafts&page=2&petition=31"),
    "/profile?filter=drafts&page=2&petition=31"
  );
  for (const path of [
    "https://evil.test/profile",
    "//evil.test/profile",
    "/profile-extra",
    "/profile/admin",
  ])
    assert.equal(safeReturnPath(path), "/petitions");
});
