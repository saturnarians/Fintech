import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PHC Bank — Digital Banking Core Engine',
  description: 'Digital Banking System with NIBSS by Phoenix Integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-navy-900 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
