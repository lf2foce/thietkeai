import '@/app/ui/global.css';
import "@uploadthing/react/styles.css";

import { inter } from '@/app/ui/fonts';
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // <ClerkProvider>
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
    // </ClerkProvider>
  );
}
