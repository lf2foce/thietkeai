import TopNav from './_components/topnav';
import {
    ClerkProvider,
  } from '@clerk/nextjs'
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
     <ClerkProvider>
        <TopNav />
        {children}
    </ClerkProvider>
  );
}