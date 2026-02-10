import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'NBA Draft Formula Lab',
  description: 'Interactive per-position formula editor with real-time draft leaderboards.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
