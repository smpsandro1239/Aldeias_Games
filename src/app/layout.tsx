import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif, Plus_Jakarta_Sans, Chakra_Petch, Russo_One } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { OfflineProvider } from "@/components/providers/offline-provider";
import { SentryInit } from "@/components/sentry-init";
import { Toaster } from "@/components/ui/sonner";
import { AnalyticsInit } from "@/components/analytics-init";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";

const inter = Inter({ subsets: ["latin", "latin-ext"] });
const notoSerif = Noto_Serif({ 
  subsets: ["latin", "latin-ext"],
  variable: "--font-noto-serif",
  display: "swap",
});
const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta",
  display: "swap",
});
const chakraPetch = Chakra_Petch({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-chakra",
  display: "swap",
});
const russoOne = Russo_One({
  subsets: ["cyrillic", "latin", "latin-ext"],
  weight: "400",
  variable: "--font-russo",
  display: "swap",
});

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
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  other: {
    charset: "utf-8",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(var(--primary))" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(var(--primary))" },
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
      <body className={`${inter.className} ${notoSerif.variable} ${plusJakartaSans.variable} ${chakraPetch.variable} ${russoOne.variable} font-body bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <OfflineProvider>
              <SentryInit />
              <AnalyticsInit />
              {children}
              <CookieConsentBanner />
              <Toaster position="top-right" richColors />
            </OfflineProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}