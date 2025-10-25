import { LOCAL_STORAGE_USER_KEY } from '@/data/config.ts';
import {
  fetchUserDetailFromEnv,
  isEmailAndPasswordValid,
} from '@/data/sign-in.ts';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { ShieldAlert } from 'lucide-react';

const UnauthorizedPage = () => {
  const fetchUserDetailFromEnvFn = useServerFn(fetchUserDetailFromEnv);
  const navigate = useNavigate();

  const doLogin = async () => {
    const user = await fetchUserDetailFromEnvFn();

    if (user.email && user.password) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
      await navigate({ to: '/notes' });
    }
  };

  return (
    <div className="flex h-full items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-900">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl dark:bg-zinc-800">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
          <ShieldAlert
            className="h-6 w-6 text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Access Denied
        </h1>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          You do not have the necessary permissions to view this application.
        </p>
        <div className="mt-6">
          <button
            onClick={doLogin}
            className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/unauthorized')({
  ssr: false,

  component: UnauthorizedPage,

  beforeLoad: async () => {
    const user: { email: string; password: string } = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_USER_KEY) ??
        JSON.stringify({ email: '', password: '' }),
    );

    const isValidUser = await isEmailAndPasswordValid({
      data: { email: user.email, password: user.password },
    });

    if (isValidUser) {
      throw redirect({ to: '/notes' });
    }
  },
});
