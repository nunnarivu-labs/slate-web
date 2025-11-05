import { ClerkProvider, useAuth } from '@clerk/tanstack-react-start';
import type { QueryClient } from '@tanstack/react-query';
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';

import appCss from '../styles.css?url';

interface MyRouterContext {
  queryClient: QueryClient;
  convexClient: ConvexReactClient;
}

const RootDocument = ({ children }: { children: React.ReactNode }) => {
  const context = Route.useRouteContext();

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={context.convexClient} useAuth={useAuth}>
        <html lang="en">
          <head>
            <title />
            <HeadContent />
          </head>
          <body className="min-h-screen bg-zinc-100 dark:bg-zinc-900">
            {children}
            <Scripts />
          </body>
        </html>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
};

export const Route = createRootRouteWithContext<MyRouterContext>()({
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

  shellComponent: RootDocument,

  component: Outlet,
});
