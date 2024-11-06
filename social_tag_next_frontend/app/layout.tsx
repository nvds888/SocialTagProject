import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SocialTag",
  icons: [
    { rel: "icon", url: "/SocialTag.jpg" },
    { rel: "shortcut icon", url: "/SocialTag.jpg" },
    { rel: "apple-touch-icon", url: "/SocialTag.jpg" },
  ],
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
