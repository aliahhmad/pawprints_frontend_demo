import { connection } from "next/server";

// Share metadata varies by petition query; keep the rest of the page prerenderable.
export default async function MetadataRequest() {
  await connection();
  return null;
}
