import { AppLayout } from '@/components/layout/app-layout.tsx';
import { authFn } from '@/data/auth.ts';
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const { isAuthenticated, userId } = await authFn();

    if (!isAuthenticated || !userId)
      throw redirect({ to: '/login', search: { redirect: location.href } });
    return { userId };
  },

  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
