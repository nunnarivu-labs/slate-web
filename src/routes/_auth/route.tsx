import { LOCAL_STORAGE_USER_KEY } from '@/data/config.ts';
import { isEmailAndPasswordValid } from '@/data/sign-in.ts';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  ssr: false,
  beforeLoad: async () => {
    const user: { email: string; password: string } = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_USER_KEY) ??
        JSON.stringify({ email: '', password: '' }),
    );

    const isValidUser = await isEmailAndPasswordValid({
      data: { email: user.email, password: user.password },
    });

    if (!isValidUser) {
      throw redirect({ to: '/unauthorized' });
    }
  },
});
