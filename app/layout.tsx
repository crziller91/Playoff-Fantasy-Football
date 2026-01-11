import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Flowbite } from "flowbite-react";
import { StoreProvider } from "./stores/StoreContext";
import Providers from "./providers";
import { ToastContainer } from 'react-toastify';
import { Analytics } from "@vercel/analytics/react";
import 'react-toastify/dist/ReactToastify.css';
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Playoff Fantasy Football",
  description: "Created by Christian Ziller",
  icons: {
    icon: {
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🏈</text></svg>',
      type: 'image/svg+xml',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <StoreProvider>
            <Flowbite>{children}</Flowbite>
            <ToastContainer
              position="bottom-right"
              autoClose={3000}
              hideProgressBar
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
            />
          </StoreProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}