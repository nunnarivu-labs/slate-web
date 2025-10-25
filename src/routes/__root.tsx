// 1. IMPORT THE LAYOUT
import { AppLayout } from '@/components/layout/app-layout.tsx';
import { ClerkProvider } from '@clerk/tanstack-react-start';
import { TanStackDevtools } from '@tanstack/react-devtools';
import type { QueryClient } from '@tanstack/react-query';
import {
  HeadContent,
  Outlet,
  // 2. IMPORT THE OUTLET
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools';
import appCss from '../styles.css?url';

interface MyRouterContext {
  queryClient: QueryClient;
}

// Your RootDocument remains completely unchanged.
const RootDocument = ({ children }: { children: React.ReactNode }) => {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <title />
          <HeadContent />
        </head>
        <body className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
          {children}
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
          <Scripts />
        </body>
      </html>
    </ClerkProvider>
  );
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
  // Your head and links options remain unchanged.
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Slate',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  // Your shellComponent remains unchanged.
  shellComponent: RootDocument,

  // 3. ADD THE COMPONENT PROPERTY
  // This component will be rendered *inside* your RootDocument's {children}.
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
