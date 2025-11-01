import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  validateSearch: (rawSearch) => ({
    tags: rawSearch.tags ? (rawSearch.tags as string[]) : undefined,
  }),

  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/notes/$category',
      params: { category: 'active' },
      search: { tags: search.tags },
    });
  },
});
