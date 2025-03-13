import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Flowbite } from "flowbite-react";
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
        <Flowbite>{children}</Flowbite>
      </body>
    </html>
  );
}
