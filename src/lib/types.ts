export interface UserProfile {
  username: string;
  first_name: string;
  last_name: string;
  roles?: { id: number; name: string; description?: string }[];
  committees?: { id: number; name: string }[] | null;
}

export interface Tag {
  id: number;
  name: string;
  description: string;
  color: string;
}

export interface Petition {
  id: number;
  title: string;
  author: UserProfile | null;
  total_signatures: number | null;
  created_at: string | null;
  status: number | null;
  expires?: string | null;
  has_response?: boolean | null;
  is_draft?: boolean | null;
  tags?: Tag[] | null;
  committee?: { id: number; name: string; description?: string } | null;
  // Frontend lookup state; an unavailable assignment is different from no assignment.
  committeeUnavailable?: boolean;
}

export interface PetitionReview {
  id?: number;
  update_id: number;
  message: string;
  reviewer_id: string;
  is_approved: boolean;
  created_at: string;
}

export interface PetitionUpdate {
  id: number;
  message: string | null;
  created_at: string;
  author_id: string | null;
  approved_by: string | null;
  is_draft: boolean;
  is_approved: boolean;
}

export interface TimelineEntry {
  is_response: boolean;
  update: PetitionUpdate;
  review?: PetitionReview[] | null;
}

export interface Committee {
  id: number;
  name: string;
  description?: string;
}

export interface PetitionTimeline {
  petition_description: string | null;
  petition_updates: TimelineEntry[];
}

export type SigningState = "ready" | "signed" | "own" | "closed" | "guest";

export interface PetitionPage {
  page_info: {
    page: number;
    items: number;
    total_items: number;
    total_pages: number;
  };
  petitions: Petition[];
}

export interface PetitionInput {
  title: string;
  description: string;
  is_draft: boolean;
  tags: number[];
}

export interface SavedPetition extends Petition {
  description: string | null;
}
