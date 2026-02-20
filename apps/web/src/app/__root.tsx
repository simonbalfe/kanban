import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { ModalProvider } from "~/providers/modal";
import { PopupProvider } from "~/providers/popup";
import { ThemeProvider } from "~/providers/theme";
import appCss from "~/styles/globals.css?url";
import { QueryProvider, queryClient } from "~/utils/api";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
      },
      { title: "Kan" },
      { name: "description", content: "The open source Trello alternative" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
  }),
  component: RootLayout,
});

function RootLayout() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme') || 'system';
                var resolved = theme;
                if (theme === 'system') {
                  resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(resolved);
              })();
            `,
          }}
        />
      </head>
      <body className="relative font-sans">
        <QueryProvider client={queryClient}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ModalProvider>
              <PopupProvider>
                <Outlet />
              </PopupProvider>
            </ModalProvider>
          </ThemeProvider>
        </QueryProvider>
        <Scripts />
      </body>
    </html>
  );
}
