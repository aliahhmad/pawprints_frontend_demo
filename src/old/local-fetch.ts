import * as demo from "@/lib/demo-client";
import type { PetitionType } from "@/old/app/components/Petition";
import seed from "../data/demo.json";
import type { Petition, PetitionInput, PetitionUpdate } from "@/lib/types";
import type { PetitionFilters } from "@/lib/petitions";

// Compatibility boundary for the directly copied frontend. This never calls fetch.
function legacyPetition(p: Petition): PetitionType {
  return { ...p, description: "", updates: [], response: null,
    total_signatures: p.total_signatures ?? 0, status: p.status ?? 0,
    created_at: p.created_at || "", expires: p.expires || "",
    has_response: !!p.has_response, is_draft: !!p.is_draft,
    tags: (p.tags || []).map(tag => ({ ...tag, created_at: "" })),
    committee: p.committee ? { ...p.committee, description: p.committee.description || "" } : null,
    author: p.author ? { ...p.author, roles: p.author.roles || [] } : { username: "", first_name: "Unknown", last_name: "", roles: [] },
  };
}
export async function listPetitions(filters: PetitionFilters, page = 1, size = 40, signal?: AbortSignal) {
  const first = await demo.getPetitions(filters, 1, signal);
  const all = [...first.petitions];
  for (let n = 2; n <= first.page_info.total_pages; n++)
    all.push(...(await demo.getPetitions(filters, n, signal)).petitions);
  const items = all.slice((page - 1) * size, page * size).map(legacyPetition);
  return { petitions: items, page_info: { page, items: items.length, total_items: all.length, total_pages: Math.max(1, Math.ceil(all.length / size)) } };
}
export async function localFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, "http://local-demo.invalid");
  const path = url.pathname.replace(/\/$/, "");
  const method = init?.method || "GET";
  const signal = init?.signal || undefined;
  signal?.throwIfAborted();
  const body = typeof init?.body === "string" ? JSON.parse(init.body) : {};
  const json = (value: unknown, status = 200) => Response.json(value, { status });
  try {
    if (path === "/api/v1/users/me") return json(await demo.getCurrentUser(signal));
    if (path === "/api/v1/tags") return json({ tags: await demo.getTags(signal) });
    if (path === "/api/v1/settings/alert") return json(await demo.getSiteAlert(signal));
    if (path === "/api/v1/committees") return json(seed.committees);
    if (path === "/api/v1/images/upload" && method === "POST") {
      const file = (init?.body as FormData).get("file");
      if (!(file instanceof File)) return json({ message: "Choose an image." }, 400);
      return json(await demo.uploadImage(file));
    }
    if (path === "/api/v1/petitions/search") return json(await listPetitions({
      query: url.searchParams.get("query") || "", status: url.searchParams.get("status") || "",
      tag: url.searchParams.get("tag_id") || "", sort: url.searchParams.get("sort") || "",
    }, Number(url.searchParams.get("page") || 1), Number(url.searchParams.get("items_per_page") || 40), signal));
    if (path === "/api/v1/petitions/user/me") {
      const filter = url.searchParams.get("filter");
      const result = await demo.getOwnPetitions(Number(url.searchParams.get("page") || 1), filter === "draft" ? "drafts" : filter === "petition" ? "published" : "all", signal);
      return json({ ...result, petitions: result.petitions.map(legacyPetition) });
    }
    if (path === "/api/v1/petitions/create" && method === "POST") return json(await demo.savePetition(body as PetitionInput));
    const signing = path.match(/^\/api\/v1\/users\/(\d+)\/(can_sign|sign|unsign)$/);
    if (signing) {
      const id = Number(signing[1]);
      if (signing[2] !== "can_sign") return json(await demo.changeSignature(id, signing[2] === "unsign"));
      const state = await demo.getSigningState(id, signal);
      if (state === "guest") return json({ message: "Choose an example account." }, 401);
      if (state === "own") return json({ signed: true }, 423);
      if (state === "closed") return json({ message: "Signing is closed." }, 404);
      return json({ signed: state === "signed" }, state === "signed" ? 409 : 200);
    }
    const petition = path.match(/^\/api\/v1\/petitions\/(\d+)(?:\/(.*))?$/);
    if (petition) {
      const id = Number(petition[1]), action = petition[2] || "";
      if (!action && method === "GET") return json(legacyPetition(await demo.getPetition(id, signal)));
      if (!action && method === "PUT") return json(await demo.savePetition(body as PetitionInput, id));
      if (action === "description") return json(await demo.getPetitionDescription(id, signal));
      if (action === "timeline" || action === "admin/timeline") {
        const result = await demo.getTimeline(id, signal, action === "admin/timeline");
        return json({ ...result, petition_updates: result.petition_updates.map(entry => ({ ...entry, review: entry.review || [], update: { ...entry.update, reviews: entry.review || [] } })) });
      }
      if (action === "draft_update" && method === "POST") {
        if (body.is_response || body.is_draft === false) return json({ message: "Publishing responses is unavailable in this demo." }, 403);
        const timeline = await demo.getTimeline(id, signal, true);
        const user = await demo.getCurrentUser(signal);
        const original = timeline.petition_updates.find(entry => entry.update.id === body.original_draft_id && entry.update.is_draft && entry.update.author_id === user.username);
        return json(await demo.createUpdate(id, body.message, original?.update.id ?? null));
      }
      if (action === "draft_update" && method === "PUT") return json(await demo.editUpdate(id, body as PetitionUpdate, body.message));
      if (action.startsWith("draft_update/") && method === "DELETE") {
        await demo.deleteUpdate(id, Number(action.split("/")[1]));
        return new Response(null, { status: 204 });
      }
    }
    return json({ message: "This operation is unavailable in the local demo." }, 404);
  } catch (error) {
    if (signal?.aborted) throw error;
    const status = error instanceof demo.DemoError ? error.status : 500;
    return json({ message: error instanceof Error ? error.message : "The local operation failed." }, status);
  }
}
