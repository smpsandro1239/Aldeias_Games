import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Aldeias Games - Plataforma de Angariação de Fundos",
  description: "Plataforma SaaS multi-tenant para comunidades locais portuguesas realizarem angariação de fundos digital através de jogos tradicionais.",
  keywords: ["aldeias", "jogos", "rifas", "angariação", "fundos", "comunidade", "Portugal"],
  authors: [{ name: "Sandro Pereira" }],
  creator: "Sandro Pereira",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: "/",
    title: "Aldeias Games",
    description: "Plataforma de angariação de fundos para comunidades locais",
    siteName: "Aldeias Games",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aldeias Games",
    description: "Plataforma de angariação de fundos para comunidades locais",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-PT" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
