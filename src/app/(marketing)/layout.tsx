import '@/app/ui/global.css';

import { inter } from '@/app/ui/fonts';
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <ClerkProvider>
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
      <Analytics />
    </html>
    // </ClerkProvider>
  );
}
