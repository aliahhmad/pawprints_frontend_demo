import { listPetitions } from "@/old/local-fetch";
import type { PetitionSort } from "@/old/lib/petitionSort";

export const API_URL = "";
export function GET(query = "", status = "", tag_id = "", page = 1, items_per_page = 40, sort: PetitionSort = "", signal?: AbortSignal) {
  return listPetitions({ query, status, tag: tag_id, sort }, page, items_per_page, signal);
}
export function GETTag(tag_id: string, page = 1, items_per_page = 40) {
  return GET("", "", tag_id, page, items_per_page);
}
