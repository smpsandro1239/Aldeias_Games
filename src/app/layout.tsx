import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif, Plus_Jakarta_Sans, Chakra_Petch, Russo_One } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import { Toaster } from "@/components/ui/sonner";

const ThemeProvider = dynamic(
  () => import("@/components/theme-provider").then((mod) => mod.ThemeProvider),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });
const notoSerif = Noto_Serif({ 
  subsets: ["latin"],
  variable: "--font-noto-serif",
  display: "swap",
});
const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});
const chakraPetch = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-chakra",
  display: "swap",
});
const russoOne = Russo_One({
  subsets: ["latin"],
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
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1b4b" },
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
          {children}
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}