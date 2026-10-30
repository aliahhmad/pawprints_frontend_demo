export const PETITION_SORT_OPTIONS = [
  { value: '', label: 'Recommended' },
  { value: '-created_at', label: 'Newest first' },
  { value: 'created_at', label: 'Oldest first' },
  { value: '-total_signatures', label: 'Most signatures' },
  { value: 'total_signatures', label: 'Fewest signatures' },
] as const;

export type PetitionSort = typeof PETITION_SORT_OPTIONS[number]['value'];

export function parsePetitionSort(value: string | null | undefined): PetitionSort {
  return PETITION_SORT_OPTIONS.find(option => option.value === value)?.value ?? '';
}
