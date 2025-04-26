import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Flowbite } from "flowbite-react";
import { StoreProvider } from "./stores/StoreContext";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Playoff Fantasy Football",
  description: "Created by Christian Ziller",
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
          </StoreProvider>
        </Providers>
      </body>
    </html>
  );
}