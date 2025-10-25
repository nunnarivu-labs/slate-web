import { authFn } from '@/data/auth.ts';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const { isAuthenticated, userId } = await authFn();

    if (!isAuthenticated || !userId) throw redirect({ to: '/login' });
    return { userId };
  },
});
