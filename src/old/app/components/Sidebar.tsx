'use client';

import { useTransition } from 'react';
import './sidebar.css';
import { usePathname, useRouter, useSearchParams } from '@/old/navigation';
import type { TagType } from './SidebarItem';
import { ChevronDown } from 'lucide-react';

export default function Sidebar({ tags }: { tags: TagType[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();
  const [isPending, startTransition] = useTransition();
  const tagFromUrl = searchParams.get('tag') ?? '';
  const selectedTag = tags.some(tag => tag.id.toString() === tagFromUrl) ? tagFromUrl : '';

  function filterSearch(tagId: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (tagId) {
      params.set('tag', tagId);
    } else {
      params.delete('tag');
    }

    // Keep the existing tag-filter behavior: reset pagination and search.
    params.delete('page');
    params.delete('query');

    startTransition(() => {
      replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="sidebar">
      <label htmlFor="petition-tag" className="sr-only">Filter by tag</label>
      <select
        id="petition-tag"
        className="sidebar-select"
        value={selectedTag}
        onChange={event => filterSearch(event.target.value)}
        disabled={isPending}
        aria-busy={isPending}
      >
        <option value="">All Tags</option>
        {tags.map(tag => (
          <option key={tag.id} value={tag.id.toString()}>
            {tag.name}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
    </div>
  );
}
