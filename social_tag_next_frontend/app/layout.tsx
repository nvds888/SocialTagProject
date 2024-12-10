import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SocialTag",
  description: "SocialTag - Your Verified Social Identity",
  metadataBase: new URL('https://www.social-tag.xyz'),
  icons: [
    { rel: "icon", url: "/SocialTag.png" },
    { rel: "apple-touch-icon", url: "/SocialTag.png" },
    { rel: "shortcut icon", url: "/SocialTag.png" }
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1
  },
  openGraph: {
    title: 'SocialTag',
    description: 'Your Verified Social Identity',
    url: 'https://www.social-tag.xyz',
    siteName: 'SocialTag',
    images: [
      {
        url: '/SocialTag.png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  }
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