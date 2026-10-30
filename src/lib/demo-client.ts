import seed from "../data/demo.json";
import { canEditDraft, hasRichContent, petitionAccess } from "./petition-access";
import type { PetitionFilters } from "./petitions";
import type {
  Petition, PetitionInput, PetitionPage, PetitionTimeline, PetitionUpdate,
  SavedPetition, SigningState, Tag, TimelineEntry, UserProfile,
} from "./types";

export const DEMO_STORAGE_KEY = "pawprints-frontend-demo:v1";
export const DEMO_CHANGE_EVENT = "pawprints-demo-change";
export const demoAccounts: UserProfile[] = structuredClone(seed.accounts);

type DemoState = {
  version: number;
  username: string | null;
  petitions: SavedPetition[];
  timelines: Record<string, TimelineEntry[]>;
  signatures: Record<string, number[]>;
};

export class DemoError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "DemoError";
  }
}

function initialState(): DemoState {
  return structuredClone({
    version: seed.version,
    username: null,
    petitions: seed.petitions,
    timelines: seed.timelines,
    signatures: seed.signatures,
  });
}

let memory = initialState();

function readState(): DemoState {
  if (typeof window === "undefined") return initialState();
  try {
    const saved = window.localStorage.getItem(DEMO_STORAGE_KEY);
    if (saved) {
      let data: DemoState;
      try { data = JSON.parse(saved) as DemoState; }
      catch { memory = initialState(); return structuredClone(memory); }
      if (
        data && data.version === seed.version && Array.isArray(data.petitions) &&
        data.timelines && typeof data.timelines === "object" &&
        data.signatures && typeof data.signatures === "object" &&
        (data.username === null || demoAccounts.some(u => u.username === data.username)) &&
        data.petitions.every(p => p && Number.isSafeInteger(p.id) && typeof p.title === "string" && typeof p.description === "string") &&
        Object.values(data.timelines).every(Array.isArray) &&
        Object.values(data.signatures).every(ids => Array.isArray(ids) && ids.every(Number.isSafeInteger))
      ) {
        memory = data;
      } else {
        memory = initialState();
      }
    }
  } catch {
    // Private browsing can disable storage. The same demo works in memory.
  }
  return structuredClone(memory);
}

function saveState(state: DemoState) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      if (error instanceof DOMException && error.name === "QuotaExceededError")
        throw new DemoError("Demo storage is full. Try a smaller image or reset the sample data from your profile.", 507);
      // When browser storage is disabled, retain changes for this open tab.
    }
  }
  memory = structuredClone(state);
}

function notifySession() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DEMO_CHANGE_EVENT));
}

export function signInDemo(username = demoAccounts[0].username) {
  const user = demoAccounts.find(account => account.username === username);
  if (!user) throw new DemoError("Choose one of the example accounts.", 400);
  const state = readState();
  state.username = username;
  saveState(state);
  notifySession();
  return structuredClone(user);
}

export function signOutDemo() {
  const state = readState();
  state.username = null;
  saveState(state);
  notifySession();
}

export function resetDemoData() {
  const username = readState().username;
  const state = initialState();
  state.username = username;
  saveState(state);
  if (typeof window !== "undefined") {
    try { window.sessionStorage.removeItem("sg-alert-dismissed"); } catch { /* Optional storage. */ }
  }
  notifySession();
}

function account(state: DemoState): UserProfile {
  const user = demoAccounts.find(u => u.username === state.username);
  if (!user) throw new DemoError("Choose an example account to continue.", 401);
  return structuredClone(user);
}

function findPetition(state: DemoState, id: number): SavedPetition {
  const petition = state.petitions.find(p => p.id === id);
  if (!petition || (petition.is_draft && petition.author?.username !== state.username))
    throw new DemoError("This example petition is unavailable.", 404);
  return petition;
}

function summary(petition: SavedPetition): Petition {
  const { description, ...result } = petition;
  void description;
  return structuredClone(result);
}

function paginate(petitions: SavedPetition[], page: number, size: number): PetitionPage {
  const currentPage = Number.isSafeInteger(page) && page > 0 ? page : 1;
  const items = petitions.slice((currentPage - 1) * size, currentPage * size).map(summary);
  return {
    petitions: items,
    page_info: {
      page: currentPage, items: items.length, total_items: petitions.length,
      total_pages: Math.max(1, Math.ceil(petitions.length / size)),
    },
  };
}

export async function getCurrentUser(signal?: AbortSignal): Promise<UserProfile> {
  signal?.throwIfAborted();
  return account(readState());
}

export async function getPetitions(filters: PetitionFilters, page: number, signal?: AbortSignal): Promise<PetitionPage> {
  signal?.throwIfAborted();
  const query = filters.query.trim().toLowerCase();
  const petitions = readState().petitions.filter(p =>
    !p.is_draft && (!query || `${p.title} ${p.description}`.toLowerCase().includes(query)) &&
    (!filters.status || String(p.status) === filters.status) &&
    (!filters.tag || p.tags?.some(tag => String(tag.id) === filters.tag))
  );
  const field = filters.sort.includes("total_signatures") ? "total_signatures" : "created_at";
  const direction = filters.sort && !filters.sort.startsWith("-") ? 1 : -1;
  petitions.sort((a, b) => direction * (field === "total_signatures"
    ? (a.total_signatures ?? 0) - (b.total_signatures ?? 0)
    : (a.created_at || "").localeCompare(b.created_at || "")) || b.id - a.id);
  return paginate(petitions, page, 20);
}

export async function getPetition(id: number, signal?: AbortSignal): Promise<Petition> {
  signal?.throwIfAborted();
  return summary(findPetition(readState(), id));
}

export async function getOwnPetitions(page: number, filter: "all" | "published" | "drafts", signal?: AbortSignal): Promise<PetitionPage> {
  signal?.throwIfAborted();
  const state = readState();
  const user = account(state);
  const petitions = state.petitions.filter(p => p.author?.username === user.username &&
    (filter === "all" || Boolean(p.is_draft) === (filter === "drafts")));
  petitions.sort((a,b) => (b.created_at || "").localeCompare(a.created_at || "") || b.id - a.id);
  return paginate(petitions, page, 10);
}

export async function getPetitionDescription(id: number, signal?: AbortSignal) {
  signal?.throwIfAborted();
  return { petition_description: findPetition(readState(), id).description };
}

export async function savePetition(input: PetitionInput, draftId?: number): Promise<SavedPetition> {
  const state = readState();
  const user = account(state);
  if (input.title.trim().length < 3 || input.title.trim().length > 80 ||
    input.description.length < 10 || !hasRichContent(input.description))
    throw new DemoError("Add a title of 3–80 characters and a description for your petition.", 400);
  let petition: SavedPetition;
  if (draftId !== undefined) {
    petition = findPetition(state, draftId);
    if (petition.author?.username !== user.username || !petition.is_draft)
      throw new DemoError("You can only edit your own unpublished drafts.", 403);
  } else {
    petition = {
      id: Math.max(0, ...state.petitions.map(p => p.id)) + 1,
      title: "", description: "", author: user, total_signatures: 0,
      created_at: new Date().toISOString(), status: 0, is_draft: true,
      has_response: false, committee: null, tags: [], expires: null,
    };
    state.petitions.push(petition);
    state.timelines[String(petition.id)] = [];
  }
  Object.assign(petition, {
    title: input.title.trim(), description: input.description,
    is_draft: input.is_draft, tags: seed.tags.filter(tag => input.tags.includes(tag.id)),
    total_signatures: input.is_draft ? 0 : 1,
    expires: input.is_draft ? null : new Date(Date.now() + 30 * 86400000).toISOString(),
  });
  saveState(state);
  return structuredClone(petition);
}

export async function getTimeline(id: number, signal?: AbortSignal, internal = false): Promise<PetitionTimeline> {
  signal?.throwIfAborted();
  const state = readState();
  const petition = findPetition(state, id);
  if (internal && !petitionAccess(account(state), petition).reviewer)
    throw new DemoError("Use the committee example account to view team drafts.", 403);
  const entries = state.timelines[String(id)] || [];
  return structuredClone({
    petition_description: petition.description,
    petition_updates: internal ? entries : entries.filter(entry => !entry.update.is_draft).map(({ is_response, update }) => ({ is_response, update })),
  });
}

function committeeEditor(state: DemoState, id: number) {
  const user = account(state);
  if (!petitionAccess(user, findPetition(state, id)).canCompose)
    throw new DemoError("Only the assigned committee can submit draft updates.", 403);
  return user;
}

export async function createUpdate(id: number, message: string, originalId: number | null = null): Promise<TimelineEntry> {
  const state = readState();
  const user = committeeEditor(state, id);
  if (!hasRichContent(message) || message.length > 40000)
    throw new DemoError("Write an update of up to 40,000 characters.", 400);
  if (originalId !== null) {
    const original = (state.timelines[String(id)] || []).find(e => e.update.id === originalId);
    if (!original || !canEditDraft(user, original.update))
      throw new DemoError("You can only revise your own unpublished update drafts.", 403);
  }
  const entry: TimelineEntry = {
    is_response: false, review: [],
    update: {
      id: Math.max(0, ...Object.values(state.timelines).flat().map(e => e.update.id)) + 1,
      message, author_id: user.username, created_at: new Date().toISOString(),
      approved_by: null, is_draft: true, is_approved: false,
    },
  };
  (state.timelines[String(id)] ||= []).push(entry);
  saveState(state);
  return structuredClone(entry);
}

function ownUpdate(state: DemoState, id: number, updateId: number): TimelineEntry {
  const user = account(state);
  findPetition(state, id);
  const entry = (state.timelines[String(id)] || []).find(e => e.update.id === updateId);
  if (!entry || entry.is_response || !canEditDraft(user, entry.update))
    throw new DemoError("You can only change your own unpublished update drafts.", 403);
  return entry;
}

export async function editUpdate(id: number, update: PetitionUpdate, message: string): Promise<TimelineEntry> {
  const state = readState();
  const entry = ownUpdate(state, id, update.id);
  if (!hasRichContent(message) || message.length > 40000)
    throw new DemoError("Write an update of up to 40,000 characters.", 400);
  entry.update.message = message;
  saveState(state);
  return structuredClone(entry);
}

export async function deleteUpdate(id: number, updateId: number) {
  const state = readState();
  ownUpdate(state, id, updateId);
  state.timelines[String(id)] = state.timelines[String(id)].filter(e => e.update.id !== updateId);
  saveState(state);
}

export async function uploadImage(file: File): Promise<{ uri: string }> {
  account(readState());
  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type))
    throw new DemoError("Choose a PNG, JPEG, WebP, or GIF image.", 400);
  if (file.size > 1024 * 1024)
    throw new DemoError("Choose an image smaller than 1 MB for this local demo.", 400);
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return { uri: `data:${file.type};base64,${btoa(binary)}` };
}

export async function getTags(signal?: AbortSignal): Promise<Tag[]> {
  signal?.throwIfAborted();
  return structuredClone(seed.tags);
}

export async function getSiteAlert(signal?: AbortSignal) {
  signal?.throwIfAborted();
  return structuredClone(seed.notice);
}

function signingState(state: DemoState, id: number): SigningState {
  const petition = findPetition(state, id);
  if (!state.username) return "guest";
  if (petition.author?.username === state.username) return "own";
  if (petition.is_draft || petition.has_response || petition.status === 2 || petition.status === 3 ||
    (petition.expires && Date.parse(petition.expires) <= Date.now())) return "closed";
  return state.signatures[state.username]?.includes(id) ? "signed" : "ready";
}

export async function getSigningState(id: number, signal?: AbortSignal): Promise<SigningState> {
  signal?.throwIfAborted();
  return signingState(readState(), id);
}

export async function changeSignature(id: number, signed: boolean) {
  const state = readState();
  const user = account(state);
  const current = signingState(state, id);
  if (!["ready", "signed"].includes(current))
    throw new DemoError("This example petition is not open for your signature.", 403);
  const petition = findPetition(state, id);
  const ids = state.signatures[user.username] ||= [];
  const alreadySigned = ids.includes(id);
  if (signed && alreadySigned) {
    state.signatures[user.username] = ids.filter(value => value !== id);
    petition.total_signatures = Math.max(0, (petition.total_signatures ?? 0) - 1);
  } else if (!signed && !alreadySigned) {
    ids.push(id);
    petition.total_signatures = (petition.total_signatures ?? 0) + 1;
  }
  saveState(state);
  return { signed: !signed, total_signatures: petition.total_signatures ?? 0 };
}
