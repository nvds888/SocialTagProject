import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SocialTag",
  description: "SocialTag - Your Verified Social Identity",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/SocialTag.png" },
    { rel: "apple-touch-icon", url: "/SocialTag.png" },
    { rel: "shortcut icon", url: "/SocialTag.png" }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/SocialTag.png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}