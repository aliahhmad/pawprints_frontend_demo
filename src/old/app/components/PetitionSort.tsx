'use client';

import { useTransition } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from '@/old/navigation';
import { PETITION_SORT_OPTIONS, parsePetitionSort } from '@/old/lib/petitionSort';
import './petitioncontainer.css';

export default function PetitionSort() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const sort = parsePetitionSort(value);

    if (sort) {
      params.set('sort', sort);
    } else {
      params.delete('sort');
    }
    params.delete('page');

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  return (
    <div className="petition-sort">
      <label htmlFor="petition-sort">Sort by:</label>
      <div className="petition-sort-select">
        <select
          id="petition-sort"
          value={parsePetitionSort(searchParams.get('sort'))}
          onChange={event => changeSort(event.target.value)}
          disabled={isPending}
          aria-busy={isPending}
        >
          {PETITION_SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden="true" />
      </div>
    </div>
  );
}
