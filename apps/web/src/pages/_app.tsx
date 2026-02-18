import "~/styles/globals.css";
import type { NextPage, Viewport } from "next";
import type { AppProps, AppType } from "next/app";
import type { ReactElement, ReactNode } from "react";
import dynamic from "next/dynamic";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { ModalProvider } from "~/providers/modal";
import { PopupProvider } from "~/providers/popup";
import { queryClient, QueryProvider } from "~/utils/api";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Kan",
  description: "The open source Trello alternative",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function AppContent({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ModalProvider>
        <PopupProvider>
          {getLayout(<Component {...pageProps} />)}
        </PopupProvider>
      </ModalProvider>
    </ThemeProvider>
  );
}

const ClientAppContent = dynamic(() => Promise.resolve(AppContent), {
  ssr: false,
});

const MyApp: AppType = (props: AppPropsWithLayout) => {
  return (
    <QueryProvider client={queryClient}>
      <style jsx global>{`
        html {
          font-family: ${jakarta.style.fontFamily};
        }
        body {
          position: relative;
        }
      `}</style>
      <script src="/__ENV.js" />
      <main className="font-sans">
        <ClientAppContent {...props} />
      </main>
    </QueryProvider>
  );
};

export default MyApp;
