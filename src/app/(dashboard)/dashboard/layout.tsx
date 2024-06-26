
import '@/app/ui/global.css';
import SideNav from '@/app/ui/dashboard/sidenav';
import { inter } from '@/app/ui/fonts';

import {
  ClerkProvider,
  GoogleOneTap,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'
 
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      
      
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
    
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
          <div className="w-full flex-none md:w-64">
            <SideNav />
          </div>
          <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
        </div>
    </body>
    </html>
    </ClerkProvider>
  );
}


