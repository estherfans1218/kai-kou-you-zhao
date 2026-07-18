import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "开口有招｜女性沟通的情境案例练习场",
    description: "看一局、拆一招、练一遍，慢慢练成自己的说法。",
    openGraph: {
      title: "开口有招",
      description: "看一局，学一招，练成自己的说法。",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1536, height: 1024, alt: "开口有招" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "开口有招",
      description: "看一局，学一招，练成自己的说法。",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
