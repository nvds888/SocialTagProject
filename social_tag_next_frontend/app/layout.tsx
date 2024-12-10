import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SocialTag",
  icons: {
    icon: '/SocialTag.png',  // Base favicon
    shortcut: '/SocialTag.png',  // For older browsers
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/SocialTag.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/SocialTag.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}