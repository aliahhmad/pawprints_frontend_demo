import type { Petition, PetitionUpdate, UserProfile } from "./types";

export function petitionAccess(user: UserProfile | null, petition?: Petition) {
  const committee = !!user?.roles?.some(
    (role) => role.name.toLowerCase() === "committee_member"
  );
  const assignedMember =
    !!petition?.committee &&
    !!user?.committees?.some((item) => item.id === petition.committee?.id);
  return {
    reviewer: committee,
    assignedMember,
    canCompose: committee && assignedMember,
  };
}

export function canEditDraft(user: UserProfile | null, update: PetitionUpdate) {
  return (
    !!user &&
    update.is_draft &&
    !update.is_approved &&
    update.author_id === user.username
  );
}

export function hasRichContent(value: string): boolean {
  if (!value.trim()) return false;
  try {
    const data = JSON.parse(value);
    const visit = (node: unknown): boolean => {
      if (!node || typeof node !== "object") return false;
      const item = node as {
        type?: string;
        text?: string;
        children?: unknown[];
      };
      return (
        (item.type === "text" &&
          typeof item.text === "string" &&
          !!item.text.trim()) ||
        item.type === "image" ||
        (Array.isArray(item.children) && item.children.some(visit))
      );
    };
    return visit(data.root);
  } catch {
    return !!value
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();
  }
}

export function validPetitionId(value: string) {
  return (
    /^[1-9]\d*$/.test(value) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) <= 2147483647
  );
}

export function petitionReturnPath(value: string | null) {
  if (!value || /[\\\r\n]/.test(value)) return "/petitions";
  try {
    const url = new URL(value, "https://pawprints.invalid");
    return url.origin === "https://pawprints.invalid" &&
      url.pathname === value.split(/[?#]/)[0] &&
      (url.pathname === "/petitions" ||
        url.pathname === "/profile")
      ? url.pathname + url.search
      : "/petitions";
  } catch {
    return "/petitions";
  }
}
