import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aether LMS - Plataforma Educativa de Alto Rendimiento',
  description: 'Arquitectura moderna para educación en línea, streaming WebRTC y tiempo real.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-[#0d0f12] text-gray-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
