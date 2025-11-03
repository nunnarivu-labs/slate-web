import { AppLayout } from '@/components/layout/app-layout.tsx';
import { authFn } from '@/data/auth.ts';
import { useUser } from '@clerk/shared/react';
import {
  Navigate,
  Outlet,
  createFileRoute,
  redirect,
} from '@tanstack/react-router';

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
    return {
      userId,
      isGuestUser: userId === import.meta.env.VITE_GUEST_USER_ID,
    };
  },

  component: () => {
    const user = useUser();

    if (!user.isSignedIn && user.isLoaded) {
      return <Navigate to="/login" search={{ redirect: location.href }} />;
    }

    return (
      <AppLayout>
        <Outlet />
      </AppLayout>
    );
  },
});
