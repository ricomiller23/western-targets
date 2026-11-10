import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WESTERN TARGETS — 3D Regional OTC Distress & Capital Radar",
  description: "Institutional screening engine for 119 OTC & distressed companies across Western States (AZ, CA, CO, ID, NV, WY). Forensic liquidity analysis, negative working capital, 2-year financing flows, S-3/S-1 shelf registrations, Section 3(a)(10) court debt swaps, and C-Suite CRM outreach.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <head>
        <meta name="color-scheme" content="dark" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-[#f5d378] selection:text-[#070a10]">
        {children}
      </body>
    </html>
  );
}
