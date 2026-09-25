import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Aperonix AI",
  description:
    "Aperonix AI — a long-term AI assistant project created by Mohammad Khan."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
