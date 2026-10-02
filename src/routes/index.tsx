import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  validateSearch: (rawSearch) => ({
    q:
      typeof rawSearch.q === 'string'
        ? rawSearch.q.trim().slice(0, 256) || undefined
        : undefined,
    tags: rawSearch.tags ? (rawSearch.tags as string[]) : undefined,
  }),

  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/notes/$category',
      params: { category: 'active' },
      search: { tags: search.tags, q: search.q },
    });
  },
});
