import { authFn } from '@/data/auth.ts';
import { useSignIn } from '@clerk/clerk-react';
import {
  createFileRoute,
  redirect,
  useNavigate,
  useRouter,
  useSearch,
} from '@tanstack/react-router';
import { KeyRound, LogIn } from 'lucide-react';
import { FormEvent, useCallback, useState } from 'react';
import { z } from 'zod';

const LoginPage = () => {
  const { signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' });

  const handleLogin = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      try {
        const result = await signIn?.create({ identifier: email, password });

        if (result) {
          const status = result.status;

          if (status === 'complete') {
            await setActive?.({ session: result.createdSessionId });
            await router.invalidate();
            return;
          }
        }
      } finally {
        await navigate({ to: '/', search: { tags: search.tags } });
      }
    },
    [email, password, signIn, setActive, navigate],
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-900">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl dark:bg-zinc-800">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <KeyRound
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
              aria-hidden="true"
            />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Sign In
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter your credentials to access your notes.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="email"
              className="block text-left text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:ring-blue-400"
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-left text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder-zinc-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none sm:text-sm dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:focus:ring-blue-400"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Route = createFileRoute('/login')({
  component: LoginPage,

  validateSearch: z.object({
    redirect: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),

  beforeLoad: async ({ search }) => {
    const { isAuthenticated } = await authFn();

    if (isAuthenticated)
      throw redirect({
        to: search.redirect ?? '/notes/$category',
        params: { category: 'active' },
        search: { tags: search.tags },
      });
  },
});
