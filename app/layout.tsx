import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Navigation } from '@/components/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Century Cleaning Agency',
  description: 'Inventory and Sales Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="h-full relative">
          <div className="hidden h-full md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-[80]">
            <Navigation />
          </div>
          <main className="md:pl-64 h-full">
            <div className="p-8 h-full bg-slate-50 min-h-screen">
              {children}
            </div>
          </main>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
