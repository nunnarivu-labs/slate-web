import { AppLayout } from '@/components/layout/app-layout.tsx';
import { authFn } from '@/data/auth.ts';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  validateSearch: (rawSearch) => ({
    tags: rawSearch.tags ? (rawSearch.tags as string[]) : undefined,
  }),

  beforeLoad: async ({ location, search }) => {
    const { isAuthenticated, userId } = await authFn();

    if (!isAuthenticated || !userId)
      throw redirect({
        to: '/login',
        search: { redirect: location.href, tags: search.tags },
      });
    return { userId };
  },

  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
