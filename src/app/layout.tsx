// src/app/layout.tsx
import './globals.css';
import type { ReactNode } from 'react';
import TopNav from '@/components/top-nav';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-[#0b0b0f] text-[#e6e6ea]">
      <body>
        <TopNav />
        {children}
      </body>
    </html>
  );
}
