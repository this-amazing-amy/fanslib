/// <reference types="vite/client" />
import { QueryClientProvider } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import * as React from "react";
import { AppLayout } from "~/components/AppLayout";
import { NotFound } from "~/components/NotFound";
import { readSidebarCollapsedPreference } from "~/lib/read-sidebar-collapsed-preference";
import { seo } from "~/lib/seo";
import { queryClient, type RouterContext } from "~/router";
import appCss from "~/styles.css?url";

const RootShell = ({ children }: { children: React.ReactNode }) => (
  <html>
    <head>
      <HeadContent />
    </head>
    <body>
      {children}
      <Scripts />
    </body>
  </html>
);

const RootLayout = () => {
  const { sidebarCollapsedInitial } = Route.useLoaderData();
  return (
    <QueryClientProvider client={queryClient}>
      <AppLayout initialSidebarCollapsed={sidebarCollapsedInitial}>
        <Outlet />
      </AppLayout>
    </QueryClientProvider>
  );
};

export const Route = createRootRouteWithContext<RouterContext>()({
  loader: () => ({
    sidebarCollapsedInitial: readSidebarCollapsedPreference(),
  }),
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "Fanslib",
      }),
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@300;400;500;600;700&family=Montserrat:wght@700&display=swap",
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/logo_small.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/logo_small.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/logo_small.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/logo_small.png",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
    ],
    scripts: [],
  }),
  notFoundComponent: () => <NotFound />,
  shellComponent: RootShell,
  component: RootLayout,
});
