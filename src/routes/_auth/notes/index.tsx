import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/notes/')({
  beforeLoad: () => {
    throw redirect({ to: '/notes/$category', params: { category: 'active' } });
  },
});
