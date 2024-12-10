import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SocialTag",
  icons: {
    icon: [
      { url: "/SocialTag.png", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/SocialTag.png" type="image/png" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}