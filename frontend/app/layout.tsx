import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/context/ToastContext';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'ReviseAI | Estudos de Alta Performance para Ensino Médio',
  description: 'Plataforma mobile-first para revisão ativa, técnica de Feynman por voz, escaneamento de cadernos e simulados inteligentes para o ENEM e vestibulares.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark bg-black">
      <body className="min-h-screen bg-black text-white antialiased selection:bg-[#11C76F] selection:text-black">
        <ToastProvider>
          <AuthProvider>
            <div className="flex flex-col min-h-screen max-w-md md:max-w-3xl lg:max-w-4xl mx-auto px-4 pb-24 pt-4">
              {children}
            </div>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
